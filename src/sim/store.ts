import { create } from 'zustand'
import { AGENTS, AGENT_BY_ID, type Agent, type FloorId } from '../data/agents'

export type Status = 'idle' | 'working'

export interface AgentRun {
  status: Status
  col: number
  t: number
  runs: number
  idleFor: number
}

export interface Packet {
  id: number
  from: string
  to: string
  born: number
}

export interface FeedItem {
  id: number
  at: number
  from: string
  to?: string
  text: string
}

export const PACKET_MS = 1800

const maxCol = (a: Agent) => Math.max(...a.steps.map((s) => s.col))
export const colSecs = (a: Agent, col: number) =>
  Math.max(0, ...a.steps.filter((s) => s.col === col).map((s) => s.secs))

interface State {
  runs: Record<string, AgentRun>
  packets: Packet[]
  feed: FeedItem[]
  queue: { id: string; at: number }[]
  tasks: number
  minutes: number
  selected: string | null
  select: (id: string | null) => void
  floor: FloorId | null
  chat: boolean
  setChat: (v: boolean) => void
  setFloor: (f: FloorId | null) => void
  start: (id: string, note?: string) => void
  tick: (dt: number) => void
}

let seq = 1

const initialRuns = Object.fromEntries(
  AGENTS.map((a) => [a.id, { status: 'idle', col: 0, t: 0, runs: a.runsWeek, idleFor: 0 } as AgentRun]),
)

export const useCrew = create<State>((set, get) => ({
  runs: initialRuns,
  packets: [],
  feed: [],
  queue: [
    { id: 'mora', at: performance.now() + 400 },
    { id: 'cata', at: performance.now() + 1400 },
    { id: 'leo', at: performance.now() + 2600 },
    { id: 'teo', at: performance.now() + 3800 },
    { id: 'paz', at: performance.now() + 5200 },
  ],
  tasks: 214,
  minutes: 3912,
  selected: null,
  select: (id) => set({ selected: id }),
  floor: null,
  chat: false,
  setChat: (v) => set({ chat: v }),
  setFloor: (f) => set({ floor: f }),

  start: (id, note) => {
    const r = get().runs[id]
    if (!r || r.status === 'working') return
    const feed = note
      ? [{ id: seq++, at: Date.now(), from: id, text: note }, ...get().feed].slice(0, 40)
      : get().feed
    set({ runs: { ...get().runs, [id]: { ...r, status: 'working', col: 0, t: 0 } }, feed })
  },

  tick: (dt) => {
    const now = performance.now()
    const s = get()
    const runs = { ...s.runs }
    let packets = s.packets.filter((p) => now - p.born < PACKET_MS)
    let feed = s.feed
    let queue = s.queue
    let { tasks, minutes } = s
    let changed = packets.length !== s.packets.length

    for (const a of AGENTS) {
      const r = runs[a.id]
      if (r.status === 'idle') {
        runs[a.id] = { ...r, idleFor: r.idleFor + dt }
        if (a.selfStart && r.idleFor + dt > a.selfStart && !queue.some((q) => q.id === a.id)) {
          queue = [...queue, { id: a.id, at: now }]
          feed = [{ id: seq++, at: Date.now(), from: a.id, text: a.selfStartText ?? 'arrancó solo' }, ...feed]
        }
        continue
      }
      changed = true
      let { col, t } = r
      t += dt
      if (t >= colSecs(a, col)) {
        col += 1
        t = 0
      }
      if (col > maxCol(a)) {
        runs[a.id] = { status: 'idle', col: 0, t: 0, runs: r.runs + 1, idleFor: 0 }
        tasks += 1
        minutes += a.savedMinutes
        if (a.handoffTo) {
          packets = [...packets, { id: seq++, from: a.id, to: a.handoffTo, born: now }]
          queue = [...queue, { id: a.handoffTo, at: now + PACKET_MS + 200 }]
          feed = [{ id: seq++, at: Date.now(), from: a.id, to: a.handoffTo, text: a.handoffText }, ...feed]
        }
      } else {
        runs[a.id] = { ...r, col, t }
      }
    }

    // arrancar lo que está en cola si el agente está libre
    const keep: typeof queue = []
    for (const q of queue) {
      const r = runs[q.id]
      if (q.at <= now && r.status === 'idle' && r.idleFor > 1.2) {
        runs[q.id] = { ...r, status: 'working', col: 0, t: 0 }
        changed = true
      } else if (q.at <= now && r.status === 'working') {
        keep.push({ ...q, at: now + 1500 })
      } else {
        keep.push(q)
      }
    }
    // no acumular pedidos repetidos para el mismo agente
    const dedup = keep.filter((q, i) => keep.findIndex((k) => k.id === q.id) === i)

    if (changed || dedup.length !== s.queue.length || feed !== s.feed) {
      set({ runs, packets, feed: feed.slice(0, 40), queue: dedup, tasks, minutes })
    } else {
      set({ runs })
    }
  },
}))

/** estado de un paso del diagrama según el avance del agente */
export function stepStatus(_a: Agent, r: AgentRun | undefined, col: number): 'done' | 'running' | 'pending' {
  if (!r || r.status === 'idle') return r && r.runs > 0 ? 'done' : 'pending'
  if (col < r.col) return 'done'
  if (col === r.col) return 'running'
  return 'pending'
}

export function currentStep(a: Agent, r: AgentRun | undefined) {
  if (!r || r.status === 'idle') return null
  return a.steps.find((s) => s.col === r.col) ?? null
}

export function runProgress(a: Agent, r: AgentRun | undefined) {
  if (!r || r.status === 'idle') return 0
  const cols = maxCol(a) + 1
  return Math.min(1, (r.col + r.t / Math.max(0.1, colSecs(a, r.col))) / cols)
}

export { AGENT_BY_ID }
