import { lazy, Suspense, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useProgress } from '@react-three/drei'
import { AGENTS, AGENT_BY_ID, type Agent } from './data/agents'
import { currentStep, runProgress, useCrew } from './sim/store'
import { FlowPanel } from './flow/FlowPanel'
import { useIsNarrow } from './ui/useIsNarrow'

const OfficeScene = lazy(() => import('./scenes/OfficeScene'))
const TowerScene = lazy(() => import('./scenes/TowerScene'))
const IslandsScene = lazy(() => import('./scenes/IslandsScene'))

const VARIANTS = [
  { v: 1, name: 'Oficina', theme: 'dia' },
  { v: 2, name: 'Edificio', theme: 'noche' },
  { v: 3, name: 'Islas', theme: 'cielo' },
] as const

function readV() {
  const n = Number(new URLSearchParams(location.search).get('v'))
  return VARIANTS.some((x) => x.v === n) ? n : 1
}

function useTicker() {
  const tick = useCrew((s) => s.tick)
  useEffect(() => {
    let last = performance.now()
    const id = setInterval(() => {
      const now = performance.now()
      tick(Math.min(0.5, (now - last) / 1000))
      last = now
    }, 100)
    return () => clearInterval(id)
  }, [tick])
}

export default function App() {
  useTicker()
  const [v, setV] = useState(readV)
  const narrow = useIsNarrow()
  const variant = VARIANTS.find((x) => x.v === v)!

  useEffect(() => {
    document.documentElement.dataset.theme = variant.theme
    const meta = document.querySelector('meta[name="theme-color"]')
    meta?.setAttribute('content', variant.theme === 'noche' ? '#071216' : variant.theme === 'cielo' ? '#DFF3FF' : '#FFE7D6')
  }, [variant])

  const pick = (n: number) => {
    setV(n)
    const u = new URL(location.href)
    u.searchParams.set('v', String(n))
    history.replaceState(null, '', u)
  }

  return (
    <div className="stage relative h-dvh w-full overflow-hidden">
      <Suspense fallback={<Loading />}>
        {v === 1 && <OfficeScene compact={narrow} />}
        {v === 2 && <TowerScene compact={narrow} />}
        {v === 3 && <IslandsScene compact={narrow} />}
      </Suspense>

      <ModelProgress />
      <TopBar v={v} onPick={pick} />

      {!narrow && (
        <>
          <aside className="pointer-events-none absolute bottom-4 left-4 top-[92px] z-10 hidden w-[300px] flex-col gap-2 lg:flex">
            <Roster />
          </aside>
          <aside className="pointer-events-none absolute bottom-4 right-4 top-[92px] z-10 hidden w-[330px] flex-col lg:flex">
            <Feed />
          </aside>
          <div className="absolute inset-x-4 bottom-4 z-10 lg:hidden">
            <MobileDock />
          </div>
        </>
      )}
      {narrow && (
        <div className="absolute inset-x-2 bottom-2 z-10">
          <MobileDock />
        </div>
      )}

      <FlowPanel />
    </div>
  )
}

function ModelProgress() {
  const { active, progress } = useProgress()
  return (
    <AnimatePresence>
      {active && (
        <motion.div exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 z-[5] grid place-items-center">
          <div className="glass flex w-[220px] flex-col gap-2 rounded-[20px] p-4">
            <span className="text-[14px] font-semibold">Armando la oficina</span>
            <span className="block h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
              <motion.span className="block h-full rounded-full bg-[var(--accent)]" animate={{ width: `${progress}%` }} />
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Loading() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="flex items-center gap-3 text-[15px] font-medium text-[var(--muted)]">
        <span className="size-5 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--accent)]" />
        Abriendo la oficina
      </div>
    </div>
  )
}

function TopBar({ v, onPick }: { v: number; onPick: (n: number) => void }) {
  const tasks = useCrew((s) => s.tasks)
  const minutes = useCrew((s) => s.minutes)
  const busy = useCrew((s) => Object.values(s.runs).filter((r) => r.status === 'working').length)
  return (
    <header className="pointer-events-none absolute inset-x-2 top-2 z-30 flex flex-wrap items-start justify-between gap-2 sm:inset-x-4 sm:top-4">
      <div className="glass pointer-events-auto flex items-center gap-3 rounded-[22px] py-2 pl-2 pr-3 sm:gap-5 sm:pr-5">
        <div className="flex items-center gap-2.5">
          <span className="font-display text-[19px] font-extrabold leading-none sm:text-[21px]">Orik Crew</span>
        </div>
        <span className="hidden h-8 w-px bg-[var(--line)] sm:block" />
        <Metric label="Tareas hechas" value={tasks.toLocaleString('es-AR')} />
        <Metric label="Horas ahorradas" value={Math.round(minutes / 60).toLocaleString('es-AR')} className="hidden sm:flex" />
        <Metric label="Trabajando" value={`${busy} de ${AGENTS.length}`} className="hidden md:flex" />
      </div>
      <Switcher v={v} onPick={onPick} />
    </header>
  )
}

function Metric({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex flex-col leading-tight ${className}`}>
      <span className="text-[11px] text-[var(--muted)]">{label}</span>
      <motion.span key={value} initial={{ opacity: 0.4, y: 3 }} animate={{ opacity: 1, y: 0 }} className="font-display text-[17px] font-bold tabular-nums">
        {value}
      </motion.span>
    </div>
  )
}

function Switcher({ v, onPick }: { v: number; onPick: (n: number) => void }) {
  return (
    <div className="glass pointer-events-auto flex gap-1 rounded-[18px] p-1" role="tablist" aria-label="Variante de diseño">
      {VARIANTS.map((x) => (
        <button
          key={x.v}
          role="tab"
          aria-selected={v === x.v}
          onClick={() => onPick(x.v)}
          className="relative h-9 rounded-[14px] px-3 text-[13px] font-semibold sm:h-10 sm:px-4 sm:text-[14px]"
        >
          {v === x.v && (
            <motion.span layoutId="sw" className="absolute inset-0 rounded-[14px] bg-[var(--ink)]" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
          )}
          <span className={`relative ${v === x.v ? 'text-[var(--bg)]' : ''}`}>
            <span className="opacity-60">{x.v}</span> {x.name}
          </span>
        </button>
      ))}
    </div>
  )
}

function AgentRow({ agent, wide }: { agent: Agent; wide?: boolean }) {
  const run = useCrew((s) => s.runs[agent.id])
  const selected = useCrew((s) => s.selected === agent.id)
  const select = useCrew((s) => s.select)
  const step = currentStep(agent, run)
  const p = runProgress(agent, run)
  const working = run.status === 'working'
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => select(agent.id)}
      className={`card pointer-events-auto flex items-center gap-3 p-2.5 pr-3 text-left transition-shadow ${wide ? 'w-full' : 'w-[230px] shrink-0 snap-start'}`}
      style={{ boxShadow: selected ? `0 0 0 2px ${agent.color}` : undefined }}
    >
      <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl" style={{ background: agent.soft }}>
        <img src={agent.avatar} alt="" className="size-full object-cover" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-2">
          <span className="text-[15px] font-semibold">{agent.name}</span>
          <span className="truncate text-[12px] text-[var(--muted)]">{agent.role}</span>
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[12.5px]">
          <span className="size-2 shrink-0 rounded-full" style={{ background: working ? agent.color : 'var(--edge)' }} />
          <span className="truncate">{step ? step.title : 'Libre, esperando trabajo'}</span>
        </span>
        <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-[var(--line)]">
          <span className="block h-full rounded-full transition-[width] duration-200" style={{ width: `${p * 100}%`, background: agent.color }} />
        </span>
      </span>
    </motion.button>
  )
}

function Roster() {
  return (
    <div className="glass pointer-events-auto flex min-h-0 flex-col gap-2 overflow-y-auto rounded-[26px] p-2.5 noscroll">
      <p className="px-2 pt-1 font-display text-[17px] font-bold">El equipo</p>
      {AGENTS.map((a) => (
        <AgentRow key={a.id} agent={a} wide />
      ))}
    </div>
  )
}

function timeAgo(at: number, now: number) {
  const s = Math.max(1, Math.round((now - at) / 1000))
  if (s < 60) return `hace ${s} s`
  return `hace ${Math.round(s / 60)} min`
}

function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}

function FeedList({ max = 30 }: { max?: number }) {
  const feed = useCrew((s) => s.feed)
  const select = useCrew((s) => s.select)
  const now = useNow()
  if (!feed.length)
    return <p className="px-3 py-6 text-center text-[13.5px] text-[var(--muted)]">En unos segundos vas a ver acá cómo se pasan el trabajo.</p>
  return (
    <ul className="flex flex-col gap-1.5">
      <AnimatePresence initial={false}>
        {feed.slice(0, max).map((f) => {
          const a = AGENT_BY_ID[f.from]
          const b = f.to ? AGENT_BY_ID[f.to] : null
          return (
            <motion.li
              key={f.id}
              layout
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 34 }}
            >
              <button onClick={() => select(f.to ?? f.from)} className="card flex w-full items-start gap-2.5 p-2.5 text-left">
                <span className="relative mt-0.5 flex shrink-0">
                  <Ava a={a} />
                  {b && <Ava a={b} className="-ml-2.5 ring-2 ring-[var(--card)]" />}
                </span>
                <span className="min-w-0 flex-1 text-[13.5px] leading-snug">
                  <b className="font-semibold" style={{ color: a.color }}>{a.name}</b> {f.text}
                  <span className="mt-0.5 block text-[11.5px] text-[var(--muted)]">{timeAgo(f.at, now)}</span>
                </span>
              </button>
            </motion.li>
          )
        })}
      </AnimatePresence>
    </ul>
  )
}

function Ava({ a, className = '' }: { a: Agent; className?: string }) {
  return (
    <span className={`grid size-8 place-items-center overflow-hidden rounded-full ${className}`} style={{ background: a.soft }}>
      <img src={a.avatar} alt="" className="size-full object-cover" />
    </span>
  )
}

function Feed() {
  return (
    <div className="glass pointer-events-auto flex min-h-0 flex-1 flex-col rounded-[26px] p-2.5">
      <p className="px-2 pb-2 pt-1 font-display text-[17px] font-bold">Lo que pasa en el equipo</p>
      <div className="min-h-0 flex-1 overflow-y-auto noscroll">
        <FeedList />
      </div>
    </div>
  )
}

function MobileDock() {
  const [tab, setTab] = useState<'equipo' | 'actividad'>('equipo')
  return (
    <div className="glass rounded-[24px] p-2">
      <div className="mb-2 flex gap-1 rounded-[16px] bg-[var(--line)] p-1">
        {(['equipo', 'actividad'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className="relative h-9 flex-1 rounded-[12px] text-[14px] font-semibold">
            {tab === t && <motion.span layoutId="dock" className="absolute inset-0 rounded-[12px] bg-[var(--card)] shadow-sm" />}
            <span className="relative">{t === 'equipo' ? 'Equipo' : 'Actividad'}</span>
          </button>
        ))}
      </div>
      {tab === 'equipo' ? (
        <div className="noscroll -mx-2 flex snap-x snap-mandatory gap-2 overflow-x-auto px-2 pb-0.5">
          {AGENTS.map((a) => (
            <AgentRow key={a.id} agent={a} />
          ))}
        </div>
      ) : (
        <div className="noscroll max-h-[34dvh] overflow-y-auto">
          <FeedList max={12} />
        </div>
      )}
    </div>
  )
}
