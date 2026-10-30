import { lazy, Suspense, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useProgress } from '@react-three/drei'
import { ArrowLeft, ChevronDown, ChevronUp, X, Moon, Sun } from 'lucide-react'
import { AGENTS, AGENT_BY_ID, FLOORS, agentsOn, type Agent } from './data/agents'
import { currentStep, runProgress, useCrew } from './sim/store'
import { useDaylight } from './sim/daylight'
import { SupervisorChat, SupervisorHeader, useBrunoNotices, useChat } from './chat/SupervisorChat'
import { useIsNarrow } from './ui/useIsNarrow'
import { ShowcasePanel } from './ui/ShowcasePanel'
import { DayReplay } from './ui/DayReplay'
import { TaskBoard } from './ui/TaskBoard'

const BuildingScene = lazy(() => import('./scenes/BuildingScene'))
const OpenPlanScene = lazy(() => import('./scenes/OpenPlanScene'))

// dos vistas: ?v=2 planta libre (la de entrada), ?v=1 edificio
const readV = (): 1 | 2 => (new URLSearchParams(location.search).get('v') === '1' ? 1 : 2)
// el diagrama (React Flow) se baja recién cuando abrís un agente
const FlowPanel = lazy(() => import('./flow/FlowPanel').then((m) => ({ default: m.FlowPanel })))


/** si no tocás nada por unos segundos, la cámara recorre a los trabajadores de cerca */
function useShowcase() {
  useEffect(() => {
    let last = Date.now()
    let next = 0
    // mover el mouse solo posterga el recorrido; para salir hay que hacer clic o tocar una tecla
    const move = () => {
      if (!useCrew.getState().showcase) last = Date.now()
    }
    const poke = () => {
      last = Date.now()
      if (useCrew.getState().showcase) useCrew.getState().setShowcase(null)
    }
    const evs = ['pointerdown', 'keydown', 'touchstart'] as const
    evs.forEach((e) => window.addEventListener(e, poke, { passive: true }))
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('wheel', move, { passive: true })
    const id = setInterval(() => {
      const s = useCrew.getState()
      if (s.selected || s.chat || s.board) {
        last = Date.now()
        return
      }
      const now = Date.now()
      if (now - last < 8000 || (s.showcase && now < next)) return
      // muestra un piso entero; si estás dentro de un piso, se queda en ese (cambia el ángulo)
      if (s.floor) {
        s.setShowcase(s.floor)
      } else {
        const others = FLOORS.filter((f) => f.id !== s.showcase)
        const busy = others.filter((f) => agentsOn(f.id).some((x) => s.runs[x.id].status === 'working'))
        const from = busy.length ? busy : others
        s.setShowcase(from[Math.floor(Math.random() * from.length)].id)
      }
      next = now + 12000
    }, 500)
    return () => {
      evs.forEach((e) => window.removeEventListener(e, poke))
      window.removeEventListener('pointermove', move)
      window.removeEventListener('wheel', move)
      clearInterval(id)
    }
  }, [])
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
  useBrunoNotices()
  useShowcase()
  const narrow = useIsNarrow(1024)
  const [v, setV] = useState(readV)
  const pickV = (n: 1 | 2) => {
    useCrew.getState().setFloor(null)
    useCrew.getState().select(null)
    setV(n)
    const u = new URL(location.href)
    u.searchParams.set('v', String(n))
    history.replaceState(null, '', u)
  }
  const night = useCrew((s) => s.night)
  const { light, clock } = useDaylight(night)
  const floor = useCrew((s) => s.floor)
  const showcase = useCrew((s) => s.showcase)
  const tint = FLOORS.find((f) => f.id === floor)?.tint
  // al entrar a un piso cambia la ambientación: fondo con el color del área
  const focusBg = tint
    ? light.dark
      ? `radial-gradient(120% 90% at 50% 15%, color-mix(in srgb, ${tint} 38%, #0B1622) 0%, #070D16 78%)`
      : `radial-gradient(120% 90% at 50% 15%, color-mix(in srgb, ${tint} 20%, #FFFFFF) 0%, color-mix(in srgb, ${tint} 8%, #E6ECF2) 78%)`
    : null

  // links directos: ?piso=marketing&agente=lupa
  useEffect(() => {
    const q = new URLSearchParams(location.search)
    const piso = FLOORS.find((f) => f.id === q.get('piso'))
    const ag = AGENT_BY_ID[q.get('agente') ?? '']
    if (piso || ag) useCrew.getState().setFloor(ag?.floor ?? piso!.id)
    if (ag) useCrew.getState().select(ag.id)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = light.dark ? 'noche' : 'dia'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', light.dark ? '#0B1622' : '#DDEFFF')
  }, [light])

  return (
    <div className="stage relative h-dvh w-full overflow-hidden" data-cinema={showcase ? '' : undefined} style={{ background: focusBg ?? light.sky }}>
      <Suspense fallback={null}>
        {v === 2 ? <OpenPlanScene light={light} /> : <BuildingScene style="vidrio" light={light} />}
      </Suspense>
      <ModelProgress />
      <TopBar clock={clock} phase={light.label} />
      <FloorBar label={v === 2 ? 'Toda la oficina' : 'Edificio'} />
      <VariantSwitch v={v} onPick={pickV} />
      <ShowcasePanel />
      <DayReplay />
      <TaskBoard />

      {!narrow ? (
        <>
          <aside className="cine-hide pointer-events-none absolute bottom-4 right-4 top-[92px] z-10 flex w-[350px] flex-col">
            <RightPanel />
          </aside>
        </>
      ) : (
        <MobileDock />
      )}

      <LazyFlow />
      {/* durante el recorrido, el clic para salir no toca nada de abajo */}
      {showcase && <div className="fixed inset-0 z-[70] cursor-pointer" aria-label="Salir del recorrido" />}
    </div>
  )
}

function LazyFlow() {
  const open = useCrew((s) => s.selected !== null)
  const [wanted, setWanted] = useState(false)
  useEffect(() => {
    if (open) setWanted(true)
  }, [open])
  return wanted ? (
    <Suspense fallback={null}>
      <FlowPanel />
    </Suspense>
  ) : null
}

function ModelProgress() {
  const { active, progress } = useProgress()
  return (
    <AnimatePresence>
      {active && (
        <motion.div exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 z-[5] grid place-items-center">
          <div className="glass flex w-[220px] flex-col gap-2 rounded-[20px] p-4">
            <span className="text-[14px] font-semibold">Abriendo el edificio</span>
            <span className="block h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
              <motion.span className="block h-full rounded-full bg-[var(--accent)]" animate={{ width: `${progress}%` }} />
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function TopBar({ clock, phase }: { clock: string; phase: string }) {
  const minutes = useCrew((s) => s.minutes)
  const busy = useCrew((s) => Object.values(s.runs).filter((r) => r.status === 'working').length)
  const needIds = useCrew((s) => Object.keys(s.runs).filter((id) => s.runs[id].status === 'waiting').join(','))
  const need = needIds ? needIds.split(',') : []
  const openNeed = () => {
    const a = AGENT_BY_ID[need[0]]
    if (!a) return
    useCrew.getState().setFloor(a.floor)
    useCrew.getState().select(a.id)
  }
  return (
    <header className="cine-hide pointer-events-none absolute inset-x-2 top-2 z-30 flex items-start gap-2 sm:inset-x-4 sm:top-4">
      <div className="glass pointer-events-auto flex items-center gap-4 rounded-[20px] px-4 py-2 sm:gap-6 sm:px-5">
        <Metric label="Horas ahorradas" value={Math.round(minutes / 60).toLocaleString('es-AR')} />
        <Metric label="Trabajando" value={`${busy} de ${AGENTS.length}`} className="hidden sm:flex" />
        <Metric label={phase} value={clock} className="hidden md:flex" />
      </div>
      <NightToggle />
      <AnimatePresence>
        {need.length > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={openNeed}
            className="needchip pointer-events-auto mr-auto"
          >
            <span className="need-dot">!</span>
            <span className="flex flex-col items-start leading-tight">
              <span className="text-[11px] font-semibold opacity-75">{need.length === 1 ? 'Te necesita' : 'Te necesitan'}</span>
              <span className="text-[14.5px] font-bold">{need.map((id) => AGENT_BY_ID[id].name).join(' y ')}</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </header>
  )
}

/** modo noche: la oficina a oscuras y el equipo trabajando igual */
function NightToggle() {
  const night = useCrew((s) => s.night)
  const setNight = useCrew((s) => s.setNight)
  return (
    <button
      onClick={() => setNight(!night)}
      aria-pressed={night}
      className={`glass pointer-events-auto flex h-[52px] items-center gap-2 rounded-[20px] pl-2.5 pr-4 text-[14px] font-semibold transition-colors ${night ? '!bg-[var(--ink)] text-[var(--bg)]' : ''}`}
    >
      <span className={`grid size-8 place-items-center rounded-[11px] ${night ? 'bg-[var(--bg)] text-[var(--ink)]' : 'bg-[var(--ink)] text-[var(--bg)]'}`}>
        {night ? <Sun size={16} strokeWidth={2.2} /> : <Moon size={16} strokeWidth={2.2} />}
      </span>
      <span className="max-sm:hidden">{night ? 'Volver al día' : 'Modo noche'}</span>
    </button>
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

/** aparece cuando estás dentro de un piso */
function VariantSwitch({ v, onPick }: { v: 1 | 2; onPick: (n: 1 | 2) => void }) {
  const board = useCrew((s) => s.board)
  const setBoard = useCrew((s) => s.setBoard)
  const cur = board ? 0 : v
  return (
    <div className="cine-hide glass pointer-events-auto absolute right-4 top-4 z-30 hidden gap-1 rounded-[16px] p-1 lg:flex" role="tablist" aria-label="Vista">
      {([2, 1, 0] as const).map((n) => (
        <button
          key={n}
          role="tab"
          aria-selected={cur === n}
          onClick={() => {
            if (n === 0) {
              useCrew.getState().setFloor(null)
              useCrew.getState().select(null)
              return setBoard(true)
            }
            setBoard(false)
            if (n !== v) onPick(n)
          }}
          className="relative h-9 rounded-[12px] px-3.5 text-[13.5px] font-semibold"
        >
          {cur === n && <motion.span layoutId="vsw" className="absolute inset-0 rounded-[12px] bg-[var(--ink)]" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
          <span className={`relative ${cur === n ? 'text-[var(--bg)]' : ''}`}>{n === 1 ? 'Edificio' : n === 2 ? 'Planta libre' : 'Tablero'}</span>
        </button>
      ))}
    </div>
  )
}

function FloorBar({ label }: { label: string }) {
  const floor = useCrew((s) => s.floor)
  const setFloor = useCrew((s) => s.setFloor)
  const f = FLOORS.find((x) => x.id === floor)
  const go = (dir: 1 | -1) => {
    if (!f) return
    const next = FLOORS.find((x) => x.n === f.n + dir)
    if (next) setFloor(next.id)
  }
  // flechas del teclado para subir y bajar, Escape para volver al edificio
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (!useCrew.getState().floor || useCrew.getState().selected) return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'TEXTAREA' || tag === 'INPUT') return
      if (e.key === 'ArrowUp') go(1)
      if (e.key === 'ArrowDown') go(-1)
      if (e.key === 'Escape') setFloor(null)
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  })
  return (
    <AnimatePresence>
      {f && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="cine-hide pointer-events-none absolute inset-x-0 top-[70px] z-20 flex justify-center sm:top-[84px]"
        >
          <div className="glass pointer-events-auto flex items-center gap-2 rounded-full p-1">
            <button onClick={() => setFloor(null)} className="flex h-9 items-center gap-1.5 rounded-full bg-[var(--ink)] px-3.5 text-[13.5px] font-semibold text-[var(--bg)]">
              <ArrowLeft size={15} /> {label}
            </button>
            <span className="grid size-7 place-items-center rounded-full text-[12px] font-bold text-white" style={{ background: f.tint }}>{f.n}</span>
            <span className="min-w-[104px] text-[14.5px] font-semibold">{f.name}</span>
            <span className="flex gap-1">
              <button onClick={() => go(-1)} disabled={f.n === 1} className="grid size-9 place-items-center rounded-full bg-[var(--line)] disabled:opacity-35" aria-label="Bajar un piso">
                <ChevronDown size={17} />
              </button>
              <button onClick={() => go(1)} disabled={f.n === FLOORS.length} className="grid size-9 place-items-center rounded-full bg-[var(--line)] disabled:opacity-35" aria-label="Subir un piso">
                <ChevronUp size={17} />
              </button>
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function AgentRow({ agent, wide = true }: { agent: Agent; wide?: boolean }) {
  const run = useCrew((s) => s.runs[agent.id])
  const selected = useCrew((s) => s.selected === agent.id)
  const select = useCrew((s) => s.select)
  const setFloor = useCrew((s) => s.setFloor)
  const step = currentStep(agent, run)
  const p = runProgress(agent, run)
  const working = run.status === 'working'
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        setFloor(agent.floor)
        select(agent.id)
      }}
      className={`row flex items-center gap-2.5 p-2 pr-2.5 text-left ${wide ? 'w-full' : 'w-[230px] shrink-0 snap-start'}`}
      style={{ boxShadow: selected ? `0 0 0 2px ${agent.color}` : undefined }}
    >
      <span className="relative size-10 shrink-0 overflow-hidden rounded-xl" style={{ background: agent.soft }}>
        <img src={agent.avatar} alt="" className="size-full object-cover" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-baseline gap-1.5">
          <span className="text-[14px] font-semibold">{agent.name}</span>
          <span className="truncate text-[11.5px] text-[var(--muted)]">{agent.role}</span>
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[12px]">
          <span className="size-1.5 shrink-0 rounded-full" style={{ background: working ? agent.color : 'var(--edge)' }} />
          <span className="truncate">{step ? step.title : 'Libre'}</span>
        </span>
        <span className="mt-1 block h-[3px] overflow-hidden rounded-full bg-[var(--line)]">
          <span className="block h-full rounded-full transition-[width] duration-200" style={{ width: `${p * 100}%`, background: agent.color }} />
        </span>
      </span>
    </motion.button>
  )
}

function timeAgo(at: number, now: number) {
  const s = Math.max(1, Math.round((now - at) / 1000))
  return s < 60 ? `hace ${s} s` : `hace ${Math.round(s / 60)} min`
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
  const setFloor = useCrew((s) => s.setFloor)
  const now = useNow()
  if (!feed.length) return <p className="px-3 py-6 text-center text-[13.5px] text-[var(--muted)]">En unos segundos vas a ver acá cómo se pasan el trabajo.</p>
  return (
    <ul className="flex flex-col gap-1.5">
      <AnimatePresence initial={false}>
        {feed.slice(0, max).map((f) => {
          const a = AGENT_BY_ID[f.from]
          const b = f.to ? AGENT_BY_ID[f.to] : null
          return (
            <motion.li key={f.id} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 34 }}>
              <button
                onClick={() => {
                  const t = b ?? a
                  setFloor(t.floor)
                  select(t.id)
                }}
                className="row flex w-full items-start gap-2.5 p-2.5 text-left"
              >
                <span className="relative mt-0.5 flex shrink-0">
                  <Ava a={a} />
                  {b && <Ava a={b} className="-ml-2.5 ring-2 ring-[var(--card)]" />}
                </span>
                <span className="min-w-0 flex-1 text-[13px] leading-snug">
                  <b className="font-semibold" style={{ color: a.color }}>{a.name}</b> {f.text}
                  <span className="mt-0.5 block text-[11px] text-[var(--muted)]">{timeAgo(f.at, now)}</span>
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
    <span className={`size-8 overflow-hidden rounded-full ${className}`} style={{ background: a.soft }}>
      <img src={a.avatar} alt="" className="size-full object-cover" />
    </span>
  )
}

function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { id: T; label: string }[] }) {
  return (
    <div className="flex gap-1 rounded-[16px] bg-[var(--line)] p-1">
      {items.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)} className="relative h-9 flex-1 rounded-[12px] text-[13.5px] font-semibold">
          {value === t.id && <motion.span layoutId={`tab-${items.map((i) => i.id).join()}`} className="absolute inset-0 rounded-[12px] bg-[var(--card)] shadow-sm" />}
          <span className="relative">{t.label}</span>
        </button>
      ))}
    </div>
  )
}

function RightPanel() {
  const [tab, setTab] = useState<'bruno' | 'actividad'>('bruno')
  const unread = useChat((s) => s.unread)
  return (
    <div className="glass pointer-events-auto flex min-h-0 flex-1 flex-col gap-3 rounded-[26px] p-3">
      <div className="flex items-center justify-between px-1">
        <SupervisorHeader />
      </div>
      <Tabs value={tab} onChange={setTab} items={[{ id: 'bruno', label: unread ? `Preguntarle (${unread})` : 'Preguntarle' }, { id: 'actividad', label: 'Actividad' }]} />
      <div className="min-h-0 flex-1">
        {tab === 'bruno' ? <SupervisorChat /> : <div className="noscroll h-full overflow-y-auto"><FeedList /></div>}
      </div>
    </div>
  )
}

function MobileDock() {
  const [tab, setTab] = useState<'pisos' | 'actividad'>('pisos')
  const floor = useCrew((s) => s.floor)
  const chat = useCrew((s) => s.chat)
  const setChat = useCrew((s) => s.setChat)
  const unread = useChat((s) => s.unread)
  const list = floor ? agentsOn(floor) : AGENTS
  return (
    <>
      <div className="cine-hide absolute inset-x-2 bottom-2 z-10">
        <div className="glass rounded-[24px] p-2">
          <div className="mb-2 flex gap-2">
            <div className="flex-1">
              <Tabs value={tab} onChange={setTab} items={[{ id: 'pisos', label: floor ? 'Este piso' : 'Equipo' }, { id: 'actividad', label: 'Actividad' }]} />
            </div>
            <button onClick={() => setChat(true)} className="relative flex h-11 items-center gap-2 rounded-[16px] bg-[var(--ink)] pl-1.5 pr-3 text-[13.5px] font-semibold text-[var(--bg)]">
              {unread > 0 && <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[var(--accent)] text-[11px] font-bold text-white">{unread}</span>}
              <img src="/avatars/face-character-male-e.png" alt="" className="size-8 rounded-[11px] bg-[#E4E9F0] object-cover" />
              Bruno
            </button>
          </div>
          {tab === 'pisos' ? (
            <div className="noscroll -mx-2 flex snap-x snap-mandatory gap-2 overflow-x-auto px-2 pb-0.5">
              {list.map((a) => (
                <AgentRow key={a.id} agent={a} wide={false} />
              ))}
            </div>
          ) : (
            <div className="noscroll max-h-[34dvh] overflow-y-auto">
              <FeedList max={12} />
            </div>
          )}
        </div>
      </div>
      <AnimatePresence>
        {chat && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 36 }}
            className="panel fixed inset-x-2 bottom-2 top-2 z-40 flex flex-col gap-3 p-3"
          >
            <div className="flex items-center justify-between">
              <SupervisorHeader />
              <button onClick={() => setChat(false)} className="ibtn" aria-label="Cerrar chat"><X size={18} /></button>
            </div>
            <div className="min-h-0 flex-1">
              <SupervisorChat />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
