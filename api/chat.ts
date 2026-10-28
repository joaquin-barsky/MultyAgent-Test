import Anthropic from '@anthropic-ai/sdk'

// Chat con Bruno, el supervisor. Usa el modelo más barato y respuestas cortas para gastar lo mínimo.
// El tope real de gasto se pone en la consola de Anthropic (límite mensual de la organización).

const MODEL = 'claude-haiku-5-5'
const MAX_TOKENS = 350
const MAX_MESSAGES = 10
const MAX_MESSAGE_CHARS = 600
const MAX_STATE_CHARS = 9000

// límite por visitante (por instancia de la función, es una barrera simple)
const hits = new Map<string, number[]>()
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 25

const SYSTEM = `Sos Bruno, el supervisor de un equipo de agentes de IA que trabaja para una inmobiliaria de Buenos Aires.
Tu trabajo es entender todo lo que hicieron los agentes y contárselo al dueño. Vos no hacés tareas: si te piden que hagas algo, explicá que vos supervisás y decí qué agente se encarga.
Hablás en castellano rioplatense, cálido y directo, como un jefe de equipo que conoce todo.
Reglas:
- Respondé corto: 2 a 5 oraciones, o una lista de hasta 5 puntos si te piden un resumen.
- Usá solo la información del ESTADO DEL EQUIPO. Si algo no está ahí, decí que no lo sabés. No inventes números, nombres ni clientes.
- Nombrá a los agentes por su nombre y su piso cuando ayude.
- Nada de emojis ni títulos. Podés usar negrita con **texto** para lo importante.
- Si te preguntan algo que no tiene que ver con el equipo o la inmobiliaria, respondé en una línea y volvé al tema.`

type Msg = { role: 'user' | 'assistant'; content: string }

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

export async function POST(req: Request): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) return json({ error: 'sin-clave' }, 503)

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anon'
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) return json({ error: 'limite' }, 429)
  hits.set(ip, [...recent, now])

  let body: { messages?: Msg[]; state?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'formato' }, 400)
  }

  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }))
  while (messages.length && messages[0].role !== 'user') messages.shift()
  if (!messages.length || messages[messages.length - 1].role !== 'user') return json({ error: 'formato' }, 400)

  const state = String(body.state ?? '').slice(0, MAX_STATE_CHARS)

  const client = new Anthropic()
  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      thinking: { type: 'disabled' },
      output_config: { effort: 'low' },
      system: [
        { type: 'text', text: SYSTEM },
        { type: 'text', text: `ESTADO DEL EQUIPO (en vivo):\n${state}` },
      ],
      messages,
    })
    if (res.stop_reason === 'refusal') return json({ text: 'Eso no te lo puedo responder. Preguntame por el equipo y lo vemos.' })
    const text = res.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('').trim()
    return json({ text, usage: { in: res.usage.input_tokens, out: res.usage.output_tokens } })
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return json({ error: 'limite' }, 429)
    if (e instanceof Anthropic.AuthenticationError) return json({ error: 'sin-clave' }, 503)
    if (e instanceof Anthropic.APIError) return json({ error: 'api', status: e.status }, 502)
    return json({ error: 'red' }, 502)
  }
}
