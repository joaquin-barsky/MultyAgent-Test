import Anthropic from '@anthropic-ai/sdk'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { AGENTS, AGENT_BY_ID, COMPANY, FLOORS } from '../src/data/agents.js'
import { MAX_TOKENS, MODEL, SYSTEM } from './_bruno.js'
import { SITE, TEMPLATE, TEMPLATE_LANG, buildSummary, summaryParams, summaryText } from './_resumen.js'

// Bruno por WhatsApp (API oficial de Meta). Meta llama a esta función cada vez que alguien le escribe al número
// y Bruno contesta con el mismo modelo que el chat de la página.
// Variables en Vercel: WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, WHATSAPP_VERIFY_TOKEN y, si está, WHATSAPP_APP_SECRET.
// Resumen diario: Vercel llama todos los días a GET /api/whatsapp?cron=resumen (ver vercel.json); va a los números de WHATSAPP_RESUMEN_TO.

const GRAPH = 'https://graph.facebook.com/v25.0'
const WABA = '2470685390090126'

/** la plantilla del resumen; Meta la revisa antes de dejar usarla */
const TEMPLATE_DEF = {
  name: TEMPLATE,
  language: TEMPLATE_LANG,
  category: 'UTILITY',
  components: [
    { type: 'HEADER', format: 'TEXT', text: 'Resumen del día' },
    {
      type: 'BODY',
      text: [
        'Así cerró el equipo hoy, {{1}}.',
        '',
        '*{{2}} tareas* hechas y *{{3}} horas* ahorradas.',
        '',
        '*Lo más importante*',
        '• {{4}}',
        '• {{5}}',
        '• {{6}}',
        '',
        '*Te espera*',
        '{{7}}',
        '',
        'Cualquier duda, escribime acá.',
      ].join('\n'),
      example: { body_text: [['jueves 30 de octubre', '214', '78', 'Teo tiene 3 alquileres atrasados y ya mandó el segundo aviso.', 'Nina encontró una transferencia sin comprobante.', 'Fran dejó solo el anuncio que trae más consultas.', 'Paz te pregunta si manda la reserva al martillero.']] },
    },
    { type: 'FOOTER', text: 'Bruno, supervisor del equipo' },
    { type: 'BUTTONS', buttons: [{ type: 'URL', text: 'Abrir la oficina', url: SITE }] },
  ],
}

async function graph(path: string, init?: RequestInit) {
  const res = await fetch(`${GRAPH}/${path}`, { ...init, headers: { authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'content-type': 'application/json' } })
  return { status: res.status, body: await res.json().catch(() => null) }
}
const MAX_MESSAGES = 10
const MAX_MESSAGE_CHARS = 600

// memoria corta por número y límite por número (por instancia de la función, alcanza para la demo)
const history = new Map<string, Msg[]>()
const hits = new Map<string, number[]>()
const seen = new Set<string>()
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 25

const WHATSAPP_RULES = `Estás respondiendo por WhatsApp desde el celular del dueño.
- Para negrita usá un solo asterisco: *texto*.
- Desde acá no ves la simulación en vivo: tenés los números de la semana y lo que hace cada agente. Si te preguntan qué pasa ahora mismo, decilo y ofrecé lo que sabés.`

type Msg = { role: 'user' | 'assistant'; content: string }

const hhmm = () => new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })

/** foto del equipo armada con los datos de la demo (en WhatsApp no hay simulación corriendo) */
function teamSnapshot() {
  const tasks = AGENTS.reduce((n, a) => n + a.runsWeek, 0)
  const minutes = AGENTS.reduce((n, a) => n + a.runsWeek * a.savedMinutes, 0)
  const lines = [`Empresa: ${COMPANY}.`, `Hora en Buenos Aires: ${hhmm()}. Tareas hechas esta semana: ${tasks}. Horas ahorradas esta semana: ${Math.round(minutes / 60)}.`]
  for (const f of FLOORS) {
    lines.push(`\nPiso ${f.n}, ${f.name}:`)
    for (const a of AGENTS.filter((x) => x.floor === f.id)) {
      const last = a.steps.filter((x) => x.kind === 'ai' || x.kind === 'if').flatMap((x) => x.output).slice(0, 3).join('; ')
      lines.push(
        `- ${a.name} (${a.role}): ${a.mission} ${a.runsWeek} vueltas esta semana. Ahorra ${a.savedMinutes} min por vuelta. Le pasa el trabajo a ${a.handoffTo ? AGENT_BY_ID[a.handoffTo].name : 'nadie'}. Últimos resultados: ${last}.`,
      )
    }
  }
  return lines.join('\n')
}

/** WhatsApp manda los números de Argentina con 9 (549…) pero para contestar hay que sacarlo; igual México (521…) */
const replyTo = (from: string) => (from.startsWith('549') ? '54' + from.slice(3) : from.startsWith('521') ? '52' + from.slice(3) : from)

const toWhatsapp = (t: string) => t.replace(/\*\*(.+?)\*\*/g, '*$1*').replace(/^#+\s*/gm, '')

async function post(payload: object) {
  const res = await fetch(`${GRAPH}/${process.env.WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...payload }),
  })
  if (!res.ok) console.error('whatsapp send', res.status, await res.text())
  return res.ok
}

const send = (to: string, body: string) => post({ to, type: 'text', text: { body } })

/** resumen del día con botón para abrir la oficina; fuera de las 24 h de charla Meta solo deja mandar la plantilla aprobada */
async function sendSummary(to: string, onlyOpenChat = false) {
  const s = buildSummary()
  const direct = await post({
    to,
    type: 'interactive',
    interactive: {
      type: 'cta_url',
      header: { type: 'text', text: 'Resumen del día' },
      body: { text: summaryText(s) },
      footer: { text: 'Bruno, supervisor del equipo' },
      action: { name: 'cta_url', parameters: { display_text: 'Abrir la oficina', url: SITE } },
    },
  })
  if (direct || onlyOpenChat) return direct ? 'directo' : 'error'
  const tpl = await post({
    to,
    type: 'template',
    template: { name: TEMPLATE, language: { code: TEMPLATE_LANG }, components: [{ type: 'body', parameters: summaryParams(s).map((text) => ({ type: 'text', text })) }] },
  })
  return tpl ? 'plantilla' : 'error'
}

async function answer(from: string, text: string) {
  if (!process.env.ANTHROPIC_API_KEY) return 'Ahora estoy sin conexión a la IA. Probá de nuevo en un rato.'

  const now = Date.now()
  const recent = (hits.get(from) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) return 'Me hiciste muchas preguntas seguidas. Dame unos minutos y seguimos.'
  hits.set(from, [...recent, now])

  const messages = [...(history.get(from) ?? []), { role: 'user' as const, content: text.slice(0, MAX_MESSAGE_CHARS) }].slice(-MAX_MESSAGES)
  while (messages.length && messages[0].role !== 'user') messages.shift()

  const client = new Anthropic()
  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      thinking: { type: 'disabled' },
      output_config: { effort: 'low' },
      system: [
        { type: 'text', text: SYSTEM },
        { type: 'text', text: WHATSAPP_RULES },
        { type: 'text', text: `ESTADO DEL EQUIPO:\n${teamSnapshot()}` },
      ],
      messages,
    })
    if (res.stop_reason === 'refusal') return 'Eso no te lo puedo responder. Preguntame por el equipo y lo vemos.'
    const reply = toWhatsapp(res.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('').trim())
    history.set(from, [...messages, { role: 'assistant' as const, content: reply }].slice(-MAX_MESSAGES))
    return reply
  } catch (e) {
    console.error('anthropic', e instanceof Anthropic.APIError ? e.status : e)
    return 'Se me cortó la conexión. Mandame el mensaje de nuevo en un ratito.'
  }
}

function validSignature(raw: string, header: string | null) {
  const secret = process.env.WHATSAPP_APP_SECRET
  if (!secret) return true
  if (!header?.startsWith('sha256=')) return false
  const expected = createHmac('sha256', secret).update(raw).digest('hex')
  const got = header.slice(7)
  return got.length === expected.length && timingSafeEqual(Buffer.from(got), Buffer.from(expected))
}

// Meta verifica la dirección una sola vez con un GET; sin parámetros devuelve qué falta configurar
export async function GET(req: Request): Promise<Response> {
  const q = new URL(req.url).searchParams
  if (q.get('hub.mode') === 'subscribe') {
    const ok = !!process.env.WHATSAPP_VERIFY_TOKEN && q.get('hub.verify_token') === process.env.WHATSAPP_VERIFY_TOKEN
    return new Response(ok ? (q.get('hub.challenge') ?? '') : 'no', { status: ok ? 200 : 403 })
  }
  const secret = process.env.CRON_SECRET
  const allowed = !!secret && (req.headers.get('authorization') === `Bearer ${secret}` || q.get('key') === secret)
  // armado de la plantilla (una sola vez) y estado de la revisión de Meta
  if (q.get('admin') === 'plantilla') {
    if (!allowed) return new Response('no', { status: 401 })
    return Response.json(await graph(`${WABA}/message_templates`, { method: 'POST', body: JSON.stringify(TEMPLATE_DEF) }))
  }
  if (q.get('admin') === 'estado') {
    if (!allowed) return new Response('no', { status: 401 })
    return Response.json(await graph(`${WABA}/message_templates?name=${TEMPLATE}&fields=name,status,category,language,rejected_reason`))
  }
  if (q.get('cron') === 'resumen') {
    if (!allowed) return new Response('no', { status: 401 })
    const list = (process.env.WHATSAPP_RESUMEN_TO ?? '').split(',').map((n) => n.replace(/D/g, '')).filter(Boolean)
    const sent = await Promise.all(list.map(async (n) => [n.slice(-4), await sendSummary(replyTo(n))]))
    return Response.json({ sent: Object.fromEntries(sent) })
  }
  const vars = ['WHATSAPP_RESUMEN_TO', 'CRON_SECRET', 'WHATSAPP_TOKEN', 'WHATSAPP_PHONE_ID', 'WHATSAPP_VERIFY_TOKEN', 'WHATSAPP_APP_SECRET', 'ANTHROPIC_API_KEY']
  return Response.json(Object.fromEntries(vars.map((v) => [v, !!process.env[v]])))
}

export async function POST(req: Request): Promise<Response> {
  const raw = await req.text()
  if (!validSignature(raw, req.headers.get('x-hub-signature-256'))) return new Response('firma', { status: 401 })

  let body: any
  try {
    body = JSON.parse(raw)
  } catch {
    return new Response('formato', { status: 400 })
  }

  // Meta espera un 200 siempre; si no, reintenta el mismo mensaje
  const msgs: any[] = body?.entry?.flatMap((e: any) => e.changes?.flatMap((c: any) => c.value?.messages ?? []) ?? []) ?? []
  for (const m of msgs) {
    if (!m?.id || seen.has(m.id)) continue
    seen.add(m.id)
    const to = replyTo(String(m.from))
    const text = m.type === 'text' ? String(m.text?.body ?? '') : ''
    // "resumen" trae el resumen del día al toque, sin gastar IA
    if (/^s*resumen/i.test(text)) {
      await sendSummary(to, true)
      continue
    }
    await send(to, text.trim() ? await answer(to, text) : 'Por ahora leo solo mensajes de texto. Escribime tu pregunta y te cuento.')
  }
  return new Response('ok')
}
