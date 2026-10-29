import { Fragment, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { create } from 'zustand'
import { ArrowUp, BellRing, Sparkles } from 'lucide-react'
import { AGENT_BY_ID, SUPERVISOR } from '../data/agents'
import { useCrew } from '../sim/store'
import { localAnswer, teamSnapshot } from './snapshot'

type Msg = { id: number; role: 'user' | 'assistant'; content: string; local?: boolean; notice?: boolean }

const SUGGESTIONS = ['¿Qué pasó hoy?', '¿Hubo algún problema?', '¿Cómo viene Marketing?', '¿Quién está trabajando ahora?']

let mid = 1

// los mensajes viven fuera del componente para no perderlos al cerrar el chat en el celular
type ChatState = { msgs: Msg[]; busy: boolean; unread: number; open: number; lastTyped: number }
export const useChat = create<ChatState & { set: (p: Partial<ChatState>) => void }>((set) => ({
  msgs: [{ id: mid++, role: 'assistant', content: 'Hola, soy Bruno. Veo todo lo que hace el equipo en los cinco pisos. Preguntame lo que quieras y te lo cuento. Si pasa algo importante, te aviso.' }],
  busy: false,
  unread: 0,
  open: 0,
  lastTyped: 0,
  set: (p) => set(p),
}))

// avisos que Bruno manda solo; se arman acá, sin usar la IA (no gastan crédito)
const ALERTS = [
  'Ojo: **Teo** tiene 3 alquileres atrasados. Ya mandó el segundo aviso a los inquilinos.',
  '**Paz** frenó una reserva porque falta el informe de dominio. Ya lo pidió al escribano.',
  '**Nina** encontró una transferencia sin comprobante en la caja de hoy.',
  'Dato: los reels que arma **Rolo** están trayendo el doble de consultas que los posteos.',
  '**Fran** apagó dos anuncios que no funcionaban y dejó el que trae más consultas.',
]
const LEADS = ['Te cuento:', 'Novedad:', 'Para que sepas:']

/** cada tanto Bruno cuenta algo que pasó, como un jefe que te pone al día */
export function useBrunoNotices() {
  useEffect(() => {
    let sent = 0
    let seenFeed = 0
    const tick = () => {
      const c = useChat.getState()
      if (sent >= 8 || c.busy || Date.now() - c.lastTyped < 20000) return
      const feed = useCrew.getState().feed
      let text: string
      if (sent % 2 === 1) {
        text = ALERTS[Math.floor(sent / 2) % ALERTS.length]
      } else {
        const f = feed.find((x) => x.to && x.id > seenFeed)
        if (!f) return
        seenFeed = f.id
        text = `${LEADS[sent % LEADS.length]} **${AGENT_BY_ID[f.from].name}** ${f.text}.`
      }
      sent++
      c.set({ msgs: [...c.msgs, { id: mid++, role: 'assistant', content: text, notice: true }], unread: c.open > 0 ? 0 : c.unread + 1 })
    }
    const first = setTimeout(tick, 22000)
    const id = setInterval(tick, 65000)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [])
}

/** **negrita** simple, sin librerías */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? <b key={i} className="font-semibold">{p.slice(2, -2)}</b> : <Fragment key={i}>{p}</Fragment>,
      )}
    </>
  )
}

export function SupervisorChat() {
  const { msgs, busy, set } = useChat()
  const [text, setText] = useState('')
  const setMsgs = (m: Msg[]) => set({ msgs: m })
  const setBusy = (b: boolean) => set({ busy: b })
  const list = useRef<HTMLDivElement>(null)

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' })
    useChat.getState().set({ unread: 0 })
  }, [msgs, busy])

  // mientras el chat está a la vista, los avisos no cuentan como sin leer
  useEffect(() => {
    useChat.getState().set({ open: useChat.getState().open + 1, unread: 0 })
    return () => useChat.getState().set({ open: useChat.getState().open - 1 })
  }, [])

  async function send(q: string) {
    const content = q.trim()
    if (!content || busy) return
    const next: Msg[] = [...msgs, { id: mid++, role: 'user', content }]
    setMsgs(next)
    setText('')
    setBusy(true)
    let answer = ''
    let local = false
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: next.slice(1).map(({ role, content }) => ({ role, content })), state: teamSnapshot() }),
      })
      const data = (await r.json()) as { text?: string; error?: string }
      if (r.ok && data.text) answer = data.text
      else if (data.error === 'limite') answer = 'Me hicieron muchas preguntas seguidas. Dame unos minutos y seguimos.'
      else {
        answer = localAnswer(content)
        local = true
      }
    } catch {
      answer = localAnswer(content)
      local = true
    }
    setMsgs([...useChat.getState().msgs, { id: mid++, role: 'assistant', content: answer, local }])
    setBusy(false)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={list} className="noscroll flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-1 pb-2">
        <AnimatePresence initial={false}>
          {msgs.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}
            >
              {m.role === 'assistant' && <Face />}
              <div className={`max-w-[84%] ${m.role === 'user' ? 'bubble-me' : m.notice ? 'bubble-bot bubble-notice' : 'bubble-bot'}`}>
                <p className="text-[14px] leading-relaxed">
                  {m.notice && <BellRing size={13} className="mr-1.5 inline -translate-y-px text-[var(--accent)]" />}
                  <Rich text={m.content} />
                </p>
                {m.local && <p className="mt-1.5 text-[11px] text-[var(--muted)]">Respuesta automática: la IA todavía no está conectada.</p>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {busy && (
          <div className="flex gap-2">
            <Face />
            <div className="bubble-bot flex items-center gap-1 py-3.5">
              {[0, 1, 2].map((i) => (
                <motion.span key={i} className="size-1.5 rounded-full bg-[var(--muted)]" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {msgs.length < 3 && (
        <div className="noscroll -mx-1 mb-2 flex gap-1.5 overflow-x-auto px-1">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} className="chip shrink-0">
              <Sparkles size={13} />
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          send(text)
        }}
        className="composer flex items-end gap-2"
      >
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            useChat.getState().set({ lastTyped: Date.now() })
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send(text)
            }
          }}
          rows={1}
          maxLength={600}
          placeholder="Preguntale a Bruno"
          className="max-h-28 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2.5 text-[16px] outline-none placeholder:text-[var(--muted)] sm:text-[14.5px]"
        />
        <button type="submit" disabled={!text.trim() || busy} className="sendbtn" aria-label="Enviar">
          <ArrowUp size={18} strokeWidth={2.5} />
        </button>
      </form>
    </div>
  )
}

function Face() {
  return (
    <span className="mt-0.5 size-8 shrink-0 overflow-hidden rounded-full" style={{ background: SUPERVISOR.soft }}>
      <img src={SUPERVISOR.avatar} alt="" className="size-full object-cover" />
    </span>
  )
}

export function SupervisorHeader() {
  return (
    <div className="flex items-center gap-3">
      <span className="relative size-11 shrink-0 overflow-hidden rounded-2xl" style={{ background: SUPERVISOR.soft }}>
        <img src={SUPERVISOR.avatar} alt="" className="size-full object-cover" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-display text-[17px] font-bold">Bruno</span>
        <span className="text-[12.5px] text-[var(--muted)]">Supervisor del equipo</span>
      </span>
    </div>
  )
}
