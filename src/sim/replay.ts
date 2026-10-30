// Repaso del día: lo que hizo cada agente desde las 8:00 hasta ahora.
// Lo de antes de abrir la página se arma con datos de la simulación (siempre igual para el mismo día); lo de esta visita es real.
import { AGENTS, AGENT_BY_ID } from '../data/agents'
import type { FeedItem } from './store'

export interface DayEvent {
  id: string
  at: number
  agent: string
  text: string
  /** pasó durante esta visita */
  live?: boolean
}

export interface DayRange {
  start: number
  end: number
  yesterday: boolean
}

const MIN = 60000

/** minutos desde la medianoche en Buenos Aires */
function baMinutes(t: number) {
  const p = new Intl.DateTimeFormat('es-AR', { hour: 'numeric', minute: 'numeric', hourCycle: 'h23', timeZone: 'America/Argentina/Buenos_Aires' }).formatToParts(new Date(t))
  const h = Number(p.find((x) => x.type === 'hour')?.value ?? 0)
  const m = Number(p.find((x) => x.type === 'minute')?.value ?? 0)
  return h * 60 + m
}

/** de 8:00 a ahora; si todavía no son las 9, se muestra el día de ayer completo */
export function dayRange(now = Date.now()): DayRange {
  const mins = baMinutes(now)
  const midnight = now - mins * MIN
  if (mins < 9 * 60) return { start: midnight - 16 * 60 * MIN, end: midnight - 4 * 60 * MIN, yesterday: true }
  return { start: midnight + 8 * 60 * MIN, end: Math.min(now, midnight + 22 * 60 * MIN), yesterday: false }
}

function seeded(seed: string) {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

const cap = (s: string) => s[0].toLowerCase() + s.slice(1)

/** todo lo que pasó en el día, del más viejo al más nuevo */
export function dayEvents(range: DayRange, feed: FeedItem[], openedAt: number): DayEvent[] {
  const out: DayEvent[] = []
  const day = new Date(range.start).toISOString().slice(0, 10)
  const until = range.yesterday ? range.end : Math.min(range.end, openedAt)
  const frac = Math.min(1, (until - range.start) / (12 * 60 * MIN))
  for (const a of AGENTS) {
    const rnd = seeded(`${day}-${a.id}`)
    const texts = [
      ...(a.handoffTo ? [a.handoffText] : []),
      ...a.steps.filter((s) => s.kind === 'ai' || s.kind === 'action').map((s) => `${s.title}: ${cap(s.output[0])}`),
    ]
    const n = Math.max(1, Math.min(12, Math.round((a.runsWeek / 5) * frac * (0.7 + rnd() * 0.5))))
    for (let i = 0; i < n; i++) {
      const at = range.start + 6 * MIN + rnd() * Math.max(MIN, until - range.start - 10 * MIN)
      out.push({ id: `${a.id}-${i}`, at, agent: a.id, text: texts[Math.floor(rnd() * texts.length)] })
    }
  }
  for (const f of feed) {
    if (!AGENT_BY_ID[f.from] || f.at < range.start || f.at > range.end) continue
    out.push({ id: `f${f.id}`, at: f.at, agent: f.from, text: f.text, live: true })
  }
  return out.sort((x, y) => x.at - y.at)
}
