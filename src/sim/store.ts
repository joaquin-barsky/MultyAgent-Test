import { create } from 'zustand'
import { AGENTS, AGENT_BY_ID, type Agent, type FloorId } from '../data/agents'
import { ASKS } from '../data/asks'

/** waiting: frenó y te necesita; no sigue hasta que le contestes */
export type Status = 'idle' | 'working' | 'waiting'

export interface AgentRun {
  status: Status
  col: number
  t: number
  runs: number
  idleFor: number
  /** ya preguntó en esta vuelta */
  asked?: boolean
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

/** lo que un agente aprendió de una respuesta tuya */
export interface Learned {
  at: number
  q: string
  a: string
  stop?: boolean
}

// lo aprendido queda guardado en este navegador, para que el agente se acuerde la próxima vez
const MEM_KEY = 'crew-learned-inmobiliaria'
function loadLearned(): Record<string, Learned[]> {
  try {
    return JSON.parse(localStorage.getItem(MEM_KEY) ?? '{}') ?? {}
  } catch {
    return {}
  }
}
function saveLearned(l: Record<string, Learned[]>) {
  try {
    localStorage.setItem(MEM_KEY, JSON.stringify(l))
  } catch {
    // sin almacenamiento: se recuerda solo durante la visita
  }
}

export const PACKET_MS = 1800


const maxCol = (a: Agent) => Math.max(...a.steps.map((s) => s.col))
export const colSecs = (a: Agent, col: number) =>
  Math.max(0, ...a.steps.filter((s) => s.col === col).map((s) => s.secs))

interface State {
  runs: Record<string, AgentRun>
  packets: Packet[]
  feed: FeedItem[]
  learned: Record<string, Learned[]>
  queue: { id: string; at: number }[]
  tasks: number
  minutes: number
  selected: string | null
  select: (id: string | null) => void
  floor: FloorId | null
  /** agente que muestra la cámara de recorrido (cuando no tocás nada) */
  showcase: string | null
  /** sube en cada toma nueva del recorrido, para que la cámara cambie de ángulo aunque sea el mismo piso */
  showcaseShot: number
  setShowcase: (id: string | null) => void
  chat: boolean
  setChat: (v: boolean) => void
  setFloor: (f: FloorId | null) => void
  start: (id: string, note?: string) => void
  /** respuesta a un agente que te necesita */
  answer: (id: string, text: string, stop?: boolean) => void
  tick: (dt: number) => void
}

let seq = 1

const initialRuns = Object.fromEntries(
  AGENTS.map((a) => [a.id, { status: 'idle', col: 0, t: 0, runs: a.runsWeek, idleFor: 0 } as AgentRun]),
)

// quiénes arrancan apenas abrís la página
function firstQueue() {
  const now = performance.now()
  return ([['mora', 400], ['cata', 1400], ['leo', 2600], ['teo', 3800], ['paz', 5200], ['caro', 2000], ['lucas', 3200], ['mica', 4400]] as const).map(([id, ms]) => ({ id, at: now + ms }))
}

export const useCrew = create<State>((set, get) => ({
  runs: initialRuns,
  packets: [],
  feed: [],
  learned: loadLearned(),
  queue: firstQueue(),
  tasks: 214,
  minutes: 3912,
  selected: null,
  select: (id) => set({ selected: id }),
  floor: null,
  showcase: null,
  showcaseShot: 0,
  setShowcase: (id) => set((s) => ({ showcase: id, showcaseShot: id ? s.showcaseShot + 1 : s.showcaseShot })),
  chat: false,
  setChat: (v) => set({ chat: v }),
  setFloor: (f) => set({ floor: f }),

  start: (id, note) => {
    const r = get().runs[id]
    if (!r || r.status !== 'idle') return
    const feed = note
      ? [{ id: seq++, at: Date.now(), from: id, text: note }, ...get().feed].slice(0, 40)
      : get().feed
    set({ runs: { ...get().runs, [id]: { ...r, status: 'working', col: 0, t: 0 } }, feed })
  },

  answer: (id, text, stop) => {
    const r = get().runs[id]
    if (!r || r.status !== 'waiting') return
    const next: AgentRun = stop ? { status: 'idle', col: 0, t: 0, runs: r.runs, idleFor: 0 } : { ...r, status: 'working', t: 0 }
    const msg = stop ? `frenó la tarea por tu respuesta: “${text}”` : `siguió con tu respuesta: “${text}”`
    const ask = ASKS[id]
    const learned = ask ? { ...get().learned, [id]: [{ at: Date.now(), q: ask.q, a: text, stop }, ...(get().learned[id] ?? [])].slice(0, 6) } : get().learned
    if (ask) saveLearned(learned)
    set({ runs: { ...get().runs, [id]: next }, learned, feed: [{ id: seq++, at: Date.now(), from: id, text: msg }, ...get().feed].slice(0, 40) })
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
      if (r.status === 'waiting') continue
      changed = true
      let { col, t } = r
      t += dt
      if (t >= colSecs(a, col)) {
        col += 1
        t = 0
        // a veces frena acá y te pregunta (como mucho 2 esperando a la vez)
        const ask = ASKS[a.id]
        const waiting = Object.values(runs).filter((x) => x.status === 'waiting').length
        if (ask && ask.col === col && !r.asked && waiting < 2 && Math.random() < 0.6) {
          runs[a.id] = { ...r, status: 'waiting', col, t: 0, asked: true }
          feed = [{ id: seq++, at: Date.now(), from: a.id, text: 'te necesita para seguir' }, ...feed]
          continue
        }
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
      } else if (q.at <= now && r.status !== 'idle') {
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

// solo desarrollo: ?need=paz hace que ese agente frene y te pregunte a los 1,5 s
if (import.meta.env.DEV) {
  const id = new URLSearchParams(location.search).get('need')
  if (id && ASKS[id]) {
    setTimeout(() => {
      const s = useCrew.getState()
      useCrew.setState({ runs: { ...s.runs, [id]: { ...s.runs[id], status: 'waiting', col: ASKS[id].col, t: 0, asked: true } } })
    }, 1500)
  }
}
