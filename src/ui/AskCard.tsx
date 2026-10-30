import { useState } from 'react'
import { ArrowUp, Hand } from 'lucide-react'
import { AGENT_BY_ID } from '../data/agents'
import { ASKS } from '../data/asks'
import { useCrew } from '../sim/store'

/** Pregunta de un agente que te necesita, con respuestas rápidas o escrita a mano */
export function AskCard({ agentId, compact, onAnswered }: { agentId: string; compact?: boolean; onAnswered?: (text: string, stop?: boolean) => void }) {
  const waiting = useCrew((s) => s.runs[agentId]?.status === 'waiting')
  const answer = useCrew((s) => s.answer)
  const [text, setText] = useState('')
  const ask = ASKS[agentId]
  const agent = AGENT_BY_ID[agentId]
  if (!ask || !agent) return null

  if (!waiting) {
    return compact ? <p className="mt-2 text-[12px] font-medium text-[var(--muted)]">Ya respondido</p> : null
  }

  const send = (label: string, stop?: boolean) => {
    answer(agentId, label, stop)
    onAnswered?.(label, stop)
    setText('')
  }

  return (
    <div className={compact ? 'mt-2.5' : 'askcard'}>
      {!compact && (
        <div className="flex items-start gap-2.5">
          <span className="need-dot mt-0.5">
            <Hand size={15} strokeWidth={2.5} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-[var(--need-ink)]">{agent.name} te necesita para seguir</p>
            <p className="mt-0.5 text-[14px] leading-snug">{ask.q}</p>
          </div>
        </div>
      )}
      <div className={`flex flex-wrap gap-1.5 ${compact ? '' : 'mt-3'}`}>
        {ask.options.map((o) => (
          <button key={o.label} onClick={() => send(o.label, o.stop)} className={`askbtn ${o.stop ? 'stop' : ''}`}>
            {o.label}
          </button>
        ))}
      </div>
      <form
        className="askinput mt-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (text.trim()) send(text.trim())
        }}
      >
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={200} placeholder="O escribile otra respuesta" className="min-w-0 flex-1 bg-transparent px-2.5 text-[13.5px] outline-none placeholder:text-[var(--muted)]" />
        <button type="submit" disabled={!text.trim()} className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-[var(--need)] text-[#3A2A00] disabled:opacity-40" aria-label="Enviar respuesta">
          <ArrowUp size={15} strokeWidth={2.5} />
        </button>
      </form>
    </div>
  )
}
