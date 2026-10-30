import { AnimatePresence, motion } from 'motion/react'
import { Check } from 'lucide-react'
import { FLOORS, agentsOn, type Agent } from '../data/agents'
import { currentStep, runProgress, stepStatus, useCrew } from '../sim/store'
import { NodeIcon } from './icons'
import { ResultCard } from './ResultCard'

// Panel del recorrido: mientras la cámara muestra un piso, cuenta qué está haciendo ese equipo
export function ShowcasePanel() {
  const showcase = useCrew((s) => s.showcase)
  const shot = useCrew((s) => s.showcaseShot)
  const floor = FLOORS.find((f) => f.id === showcase)
  return (
    <AnimatePresence>
      {floor && (
        <motion.aside
          key={`${floor.id}-${shot}`}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0, transition: { delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] } }}
          exit={{ opacity: 0, x: 16, transition: { duration: 0.3 } }}
          className="showcase pointer-events-none absolute z-20 max-lg:inset-x-2 max-lg:bottom-2 lg:right-4 lg:top-1/2 lg:w-[350px] lg:-translate-y-1/2"
          style={{ ['--c' as string]: floor.tint }}
        >
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl font-display text-[17px] font-bold text-white" style={{ background: floor.tint }}>
              {floor.n}
            </span>
            <div className="flex flex-col leading-tight">
              <span className="font-display text-[22px] font-bold">{floor.name}</span>
              <TeamLine id={floor.id} />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {agentsOn(floor.id).map((a) => (
              <Member key={a.id} agent={a} />
            ))}
          </div>
          <LeadFlow id={floor.id} />
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function TeamLine({ id }: { id: (typeof FLOORS)[number]['id'] }) {
  const busy = useCrew((s) => agentsOn(id).filter((a) => s.runs[a.id].status === 'working').length)
  const total = agentsOn(id).length
  return <span className="text-[13px] text-[var(--muted)]">{busy ? `${busy} de ${total} trabajando ahora` : `${total} en el equipo, en pausa`}</span>
}

function Member({ agent }: { agent: Agent }) {
  const run = useCrew((s) => s.runs[agent.id])
  const step = currentStep(agent, run)
  const p = runProgress(agent, run)
  return (
    <div className="flex items-center gap-2.5">
      <span className="size-9 shrink-0 overflow-hidden rounded-xl" style={{ background: agent.soft }}>
        <img src={agent.avatar} alt="" className="size-full object-cover" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[13.5px] font-semibold">{agent.name}</span>
          {run.status === 'waiting' ? (
            <span className="truncate text-[11.5px] font-bold text-[var(--need-ink)]">Te necesita</span>
          ) : (
            <span className="truncate text-[11.5px] text-[var(--muted)]">{step ? step.title : 'Libre'}</span>
          )}
        </div>
        <span className="mt-1 block h-[4px] overflow-hidden rounded-full bg-[var(--line)]">
          <span className="block h-full rounded-full transition-[width] duration-200" style={{ width: `${p * 100}%`, background: agent.color }} />
        </span>
      </div>
    </div>
  )
}

/** el proceso del que más avanzado está, en una fila de pasos */
function LeadFlow({ id }: { id: (typeof FLOORS)[number]['id'] }) {
  const runs = useCrew((s) => s.runs)
  const team = agentsOn(id)
  const lead = team.filter((a) => runs[a.id].status !== 'idle').sort((a, b) => runProgress(b, runs[b.id]) - runProgress(a, runs[a.id]))[0] ?? team[0]
  const run = runs[lead.id]
  const cols = Array.from(new Set(lead.steps.map((s) => s.col))).sort((a, b) => a - b)
  const step = currentStep(lead, run)
  return (
    <div className="mt-5 border-t border-[var(--line)] pt-4">
      <p className="text-[12.5px] text-[var(--muted)]">
        Proceso de <b className="font-semibold text-[var(--ink)]">{lead.name}</b>
      </p>
      <div className="mt-3 flex items-center">
        {cols.map((c, i) => {
          const st = stepStatus(lead, run, c)
          const s = lead.steps.find((x) => x.col === c)!
          return (
            <div key={c} className="flex flex-1 items-center last:flex-none">
              <span className={`sc-node ${st}`} style={{ ['--c' as string]: lead.color }}>
                {st === 'done' ? <Check size={13} strokeWidth={3} /> : <NodeIcon icon={s.icon} size={14} color={st === 'running' ? '#fff' : lead.color} />}
              </span>
              {i < cols.length - 1 && <span className={`sc-link ${st === 'done' ? 'done' : ''}`} style={{ ['--c' as string]: lead.color }} />}
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-[14px] font-semibold leading-snug">{step ? step.title : 'Esperando el próximo pedido'}</p>
      <p className="mt-0.5 text-[12.5px] leading-snug text-[var(--muted)]">{step ? step.what : lead.mission}</p>
      <div className="mt-4 rounded-2xl bg-[var(--card)] p-3 ring-1 ring-[var(--line)]">
        <p className="mb-2 text-[11.5px] font-semibold" style={{ color: lead.color }}>Último resultado de {lead.name}</p>
        <ResultCard agentId={lead.id} color={lead.color} compact />
      </div>
    </div>
  )
}
