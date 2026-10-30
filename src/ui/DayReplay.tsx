import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { History, Pause, Play, X } from 'lucide-react'
import { AGENT_BY_ID, FLOORS } from '../data/agents'
import { useCrew } from '../sim/store'
import { dayEvents, dayRange, type DayEvent } from '../sim/replay'

const MIN = 60000
const WINDOW = 40 * MIN
const OPENED = Date.now()
const hhmm = (t: number) => new Date(t).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Argentina/Buenos_Aires' })

/** línea del día: arrastrás y ves qué hizo cada uno a cada hora */
export function DayReplay() {
  const [open, setOpen] = useState(false)
  return (
    <div className="cine-hide pointer-events-none absolute bottom-4 left-4 right-[386px] z-20 hidden lg:flex">
      <AnimatePresence mode="wait" initial={false}>
        {open ? (
          <motion.div key="open" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.2 }} className="pointer-events-auto w-full">
            <Timeline onClose={() => setOpen(false)} />
          </motion.div>
        ) : (
          <motion.button key="closed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} onClick={() => setOpen(true)} className="glass pointer-events-auto flex h-11 items-center gap-2 rounded-full pl-2 pr-4 text-[14px] font-semibold">
            <span className="grid size-8 place-items-center rounded-full bg-[var(--ink)] text-[var(--bg)]"><History size={16} /></span>
            Repaso del día
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

function Timeline({ onClose }: { onClose: () => void }) {
  const feedKey = useCrew((s) => s.feed[0]?.id ?? 0)
  const setFloor = useCrew((s) => s.setFloor)
  const select = useCrew((s) => s.select)
  const [tick, setTick] = useState(0)
  // el final de la línea avanza con el reloj
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000)
    return () => clearInterval(t)
  }, [])
  const range = useMemo(() => dayRange(), [tick])
  const events = useMemo(() => dayEvents(range, useCrew.getState().feed, OPENED), [range, feedKey])
  const span = range.end - range.start
  const [cursor, setCursor] = useState<number | null>(null)
  const at = cursor ?? range.end
  const [playing, setPlaying] = useState(false)
  const track = useRef<HTMLDivElement>(null)

  // "Ver el día": recorre de la mañana a ahora en unos segundos
  useEffect(() => {
    if (!playing) return
    let raf = 0
    const t0 = performance.now()
    const from = cursor !== null && cursor < range.end - 5 * MIN ? cursor : range.start
    const step = (now: number) => {
      const t = from + ((now - t0) / 14000) * span
      if (t >= range.end) {
        setCursor(null)
        setPlaying(false)
        return
      }
      setCursor(t)
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  const fromX = (clientX: number) => {
    const r = track.current!.getBoundingClientRect()
    const k = Math.min(1, Math.max(0, (clientX - r.left) / r.width))
    return range.start + k * span
  }
  const onDown = (e: React.PointerEvent) => {
    setPlaying(false)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    setCursor(fromX(e.clientX))
  }
  const onMove = (e: React.PointerEvent) => e.buttons === 1 && setCursor(fromX(e.clientX))

  const near = events.filter((e) => e.at <= at && e.at > at - WINDOW).reverse().slice(0, 4)
  const done = events.filter((e) => e.at <= at).length
  const hours: number[] = []
  for (let h = Math.ceil(range.start / (60 * MIN)) * 60 * MIN; h <= range.end; h += 60 * MIN) hours.push(h)
  const x = (t: number) => `${((t - range.start) / span) * 100}%`
  const openAgent = (e: DayEvent) => {
    const a = AGENT_BY_ID[e.agent]
    setFloor(a.floor)
    select(a.id)
  }

  return (
    <div className="glass flex gap-4 rounded-[22px] p-3 pr-4">
      {/* lo que pasó cerca del momento elegido */}
      <div className="flex w-[300px] shrink-0 flex-col">
        <div className="flex items-center gap-2 px-1">
          <span className="text-[15px] font-bold">Repaso {range.yesterday ? 'de ayer' : 'del día'}</span>
          <span className="text-[12.5px] tabular-nums text-[var(--muted)]">{hhmm(at)}, {done} tareas</span>
        </div>
        <div className="mt-2 flex h-[150px] flex-col gap-1 overflow-hidden">
          {near.length === 0 && <p className="px-1 pt-2 text-[13px] text-[var(--muted)]">A esta hora no pasó nada. Mové la línea para ver otro momento.</p>}
          {near.map((e) => {
            const a = AGENT_BY_ID[e.agent]
            return (
              <button key={e.id} onClick={() => openAgent(e)} className="row flex items-center gap-2 p-1.5 pr-2 text-left">
                <span className="size-8 shrink-0 overflow-hidden rounded-lg" style={{ background: a.soft }}>
                  <img src={a.avatar} alt="" className="size-full object-cover" />
                </span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="flex items-baseline gap-1.5">
                    <span className="text-[13px] font-semibold">{a.name}</span>
                    <span className="text-[11px] tabular-nums text-[var(--muted)]">{hhmm(e.at)}</span>
                  </span>
                  <span className="block truncate text-[12px]">{e.text}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* la línea: una fila por área, cada punto es una tarea */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <button onClick={() => setPlaying((p) => !p)} className="flex h-8 items-center gap-1.5 rounded-full bg-[var(--ink)] px-3 text-[13px] font-semibold text-[var(--bg)]">
            {playing ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
            {playing ? 'Pausar' : 'Ver el día'}
          </button>
          {cursor !== null && !playing && (
            <button onClick={() => setCursor(null)} className="h-8 rounded-full bg-[var(--line)] px-3 text-[13px] font-semibold">Volver a ahora</button>
          )}
          <button onClick={onClose} className="ibtn ml-auto" aria-label="Cerrar repaso"><X size={17} /></button>
        </div>
        <div className="mt-2 flex flex-1 gap-3">
          <div className="flex h-[118px] w-[112px] shrink-0 flex-col justify-between py-1">
            {FLOORS.map((f) => (
              <span key={f.id} className="flex h-[16px] items-center gap-1.5 truncate text-[11.5px] font-semibold">
                <span className="size-2 shrink-0 rounded-full" style={{ background: f.tint }} />
                {f.name}
              </span>
            ))}
          </div>
        <div ref={track} onPointerDown={onDown} onPointerMove={onMove} className="relative flex-1 cursor-ew-resize touch-none select-none">
          <div className="absolute inset-x-0 top-0 flex h-[118px] flex-col justify-between py-1">
            {FLOORS.map((f) => (
              <div key={f.id} className="relative h-[16px] rounded-full" style={{ background: `color-mix(in srgb, ${f.tint} 10%, transparent)` }}>
                <span className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full" style={{ width: x(at), background: `color-mix(in srgb, ${f.tint} 35%, transparent)` }} />
              </div>
            ))}
          </div>
          <div className="absolute inset-x-0 top-0 h-[118px] py-1">
            {events.map((e) => {
              const a = AGENT_BY_ID[e.agent]
              const row = FLOORS.findIndex((f) => f.id === a.floor)
              const past = e.at <= at
              return (
                <span
                  key={e.id}
                  className="absolute size-[10px] -translate-x-1/2 rounded-full transition-opacity"
                  style={{ left: x(e.at), top: 4 + row * 23.5 + 3, background: a.color, opacity: past ? (e.live ? 1 : 0.85) : 0.18, boxShadow: e.live ? `0 0 0 3px color-mix(in srgb, ${a.color} 30%, transparent)` : undefined }}
                />
              )
            })}
          </div>
          {/* horas */}
          <div className="absolute inset-x-0 top-[122px] h-4">
            {hours.map((h) => (
              <span key={h} className="absolute -translate-x-1/2 text-[11px] tabular-nums text-[var(--muted)]" style={{ left: x(h) }}>{hhmm(h).replace(/^0/, '')}</span>
            ))}
          </div>
          {/* cursor */}
          <div className="pointer-events-none absolute top-[-4px] h-[126px] w-0" style={{ left: x(at) }}>
            <span className="absolute inset-y-0 left-[-1px] w-[2px] rounded-full bg-[var(--ink)]" />
            <span className="absolute left-1/2 top-[-6px] size-3 -translate-x-1/2 rounded-full border-2 border-[var(--card)] bg-[var(--ink)]" />
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
