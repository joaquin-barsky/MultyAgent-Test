import { useMemo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CircleCheck, Hand, Loader, X } from 'lucide-react'
import { AGENTS, AGENT_BY_ID, FLOORS, type Agent } from '../data/agents'
import { ASKS } from '../data/asks'
import { currentStep, runProgress, useCrew } from '../sim/store'
import { dayEvents, dayRange, type DayEvent } from '../sim/replay'
import { AskCard } from './AskCard'

const OPENED = Date.now()
const hhmm = (t: number) => new Date(t).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Argentina/Buenos_Aires' })
const floorOf = (a: Agent) => FLOORS.find((f) => f.id === a.floor)!

/** el mismo trabajo que en la oficina, pero como lista: en curso, te espera y hecho */
export function TaskBoard() {
  const open = useCrew((s) => s.board)
  const setBoard = useCrew((s) => s.setBoard)
  return (
    <AnimatePresence>
      {open && (
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 14 }}
          transition={{ duration: 0.22 }}
          className="panel absolute bottom-4 left-4 right-[386px] top-[92px] z-30 flex flex-col overflow-hidden max-lg:inset-x-2 max-lg:bottom-2"
        >
          <header className="flex items-center gap-3 border-b border-[var(--line)] px-5 py-3">
            <h2 className="font-display text-[22px] font-bold">Tablero del equipo</h2>
            <FreeChips />
            <button onClick={() => setBoard(false)} className="ibtn ml-auto" aria-label="Cerrar tablero"><X size={18} /></button>
          </header>
          <div className="grid min-h-0 flex-1 grid-cols-3 gap-3 p-3 max-lg:grid-cols-1 max-lg:overflow-y-auto">
            <Working />
            <Waiting />
            <Done />
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  )
}

function FreeChips() {
  const ids = useCrew((s) => AGENTS.filter((a) => s.runs[a.id].status === 'idle').map((a) => a.id).join(','))
  const free = ids ? ids.split(',').map((id) => AGENT_BY_ID[id]) : []
  return (
    <div className="flex min-w-0 items-center gap-2 max-md:hidden">
      <span className="text-[12.5px] text-[var(--muted)]">Libres</span>
      <div className="flex -space-x-2">
        {free.slice(0, 10).map((a) => (
          <span key={a.id} title={a.name} className="size-7 overflow-hidden rounded-full ring-2 ring-[var(--card)]" style={{ background: a.soft }}>
            <img src={a.avatar} alt="" className="size-full object-cover" />
          </span>
        ))}
      </div>
      {free.length > 10 && <span className="text-[12px] font-semibold text-[var(--muted)]">+{free.length - 10}</span>}
    </div>
  )
}

function Column({ title, n, icon, tint, children }: { title: string; n: number; icon: React.ReactNode; tint: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-col rounded-[18px] bg-[var(--flow)] p-2.5 ring-1 ring-[var(--line)]">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="grid size-7 place-items-center rounded-[9px] text-white" style={{ background: tint }}>{icon}</span>
        <span className="text-[15px] font-bold">{title}</span>
        <span className="ml-auto grid h-6 min-w-6 place-items-center rounded-full bg-[var(--card)] px-2 text-[12px] font-bold tabular-nums ring-1 ring-[var(--line)]">{n}</span>
      </div>
      <div className="noscroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        <AnimatePresence initial={false}>{children}</AnimatePresence>
      </div>
    </div>
  )
}

function useOpen() {
  const setFloor = useCrew((s) => s.setFloor)
  const select = useCrew((s) => s.select)
  return (a: Agent) => {
    setFloor(a.floor)
    select(a.id)
  }
}

function Card({ a, children, onClick, need }: { a: Agent; children: React.ReactNode; onClick?: () => void; need?: boolean }) {
  const f = floorOf(a)
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`tcard ${onClick ? 'cursor-pointer' : ''} ${need ? 'need' : ''}`}
      style={{ ['--c' as string]: a.color }}
    >
      <div className="flex items-center gap-2.5">
        <span className="size-9 shrink-0 overflow-hidden rounded-xl" style={{ background: a.soft }}>
          <img src={a.avatar} alt="" className="size-full object-cover" />
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block text-[14px] font-semibold">{a.name}</span>
          <span className="block truncate text-[12px] text-[var(--muted)]">{a.role}</span>
        </span>
        <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-white" style={{ background: f.tint }}>{f.name}</span>
      </div>
      {children}
    </motion.div>
  )
}

function Working() {
  const ids = useCrew((s) => AGENTS.filter((a) => s.runs[a.id].status === 'working').map((a) => a.id).join(','))
  const list = ids ? ids.split(',').map((id) => AGENT_BY_ID[id]) : []
  const open = useOpen()
  return (
    <Column title="En curso" n={list.length} icon={<Loader size={15} strokeWidth={2.6} />} tint="#2E7DFF">
      {list.map((a) => (
        <Card key={a.id} a={a} onClick={() => open(a)}>
          <Progress a={a} />
        </Card>
      ))}
      {!list.length && <Empty text="Nadie está trabajando en este momento." />}
    </Column>
  )
}

function Progress({ a }: { a: Agent }) {
  const step = useCrew((s) => currentStep(a, s.runs[a.id])?.title ?? '')
  const p = useCrew((s) => Math.round(runProgress(a, s.runs[a.id]) * 50) / 50)
  return (
    <div className="mt-2.5">
      <div className="flex items-baseline justify-between gap-2 text-[12.5px]">
        <span className="truncate font-medium">{step}</span>
        <span className="shrink-0 tabular-nums text-[var(--muted)]">{Math.round(p * 100)}%</span>
      </div>
      <span className="mt-1.5 block h-[5px] overflow-hidden rounded-full bg-[var(--line)]">
        <span className="block h-full rounded-full transition-[width] duration-300" style={{ width: `${p * 100}%`, background: a.color }} />
      </span>
    </div>
  )
}

function Waiting() {
  const ids = useCrew((s) => AGENTS.filter((a) => s.runs[a.id].status === 'waiting').map((a) => a.id).join(','))
  const list = ids ? ids.split(',').map((id) => AGENT_BY_ID[id]) : []
  return (
    <Column title="Te espera" n={list.length} icon={<Hand size={15} strokeWidth={2.6} />} tint="#E0A100">
      {list.map((a) => (
        <Card key={a.id} a={a} need>
          <p className="mt-2 text-[13px] leading-snug">{ASKS[a.id]?.q}</p>
          <AskCard agentId={a.id} compact />
        </Card>
      ))}
      {!list.length && <Empty text="No hay nada esperando tu respuesta." />}
    </Column>
  )
}

/** una tarjeta por agente: cuántas tareas terminó hoy y la última, en vez de cada paso suelto */
function Done() {
  const feedKey = useCrew((s) => s.feed[0]?.id ?? 0)
  const groups = useMemo(() => {
    const by = new Map<string, { n: number; last: DayEvent }>()
    for (const e of dayEvents(dayRange(), useCrew.getState().feed, OPENED)) {
      const g = by.get(e.agent)
      by.set(e.agent, { n: (g?.n ?? 0) + 1, last: e })
    }
    return [...by.entries()].map(([id, g]) => ({ a: AGENT_BY_ID[id], ...g })).sort((x, y) => y.last.at - x.last.at)
  }, [feedKey])
  const total = groups.reduce((n, g) => n + g.n, 0)
  const open = useOpen()
  return (
    <Column title={dayRange().yesterday ? 'Hecho ayer' : 'Hecho hoy'} n={total} icon={<CircleCheck size={15} strokeWidth={2.6} />} tint="#3DAE2B">
      {groups.map(({ a, n, last }) => (
        <Card key={a.id} a={a} onClick={() => open(a)}>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-lg px-2 py-0.5 text-[12.5px] font-bold tabular-nums" style={{ background: a.soft, color: a.color }}>{n} {n === 1 ? 'tarea' : 'tareas'}</span>
            <span className="text-[12px] tabular-nums text-[var(--muted)]">última {hhmm(last.at)}</span>
          </div>
          <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-snug">{last.text[0].toUpperCase() + last.text.slice(1)}</p>
        </Card>
      ))}
    </Column>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="px-2 py-6 text-center text-[13px] text-[var(--muted)]">{text}</p>
}
