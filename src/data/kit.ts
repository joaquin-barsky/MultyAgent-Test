// Herramientas para escribir equipos de agentes de forma corta (los rubros nuevos usan esto).
import type { Agent, FloorId, FlowEdge, FlowStep, IconKey, NodeKind, Preview, Sub } from './agents.js'
import type { Ask } from './asks.js'
import type { Result } from './results.js'

export type RubroId = 'inmobiliaria' | 'desarrolladora' | 'concesionaria' | 'ecommerce' | 'gastronomia'

export const RUBRO_LIST: { id: RubroId; name: string; hint: string }[] = [
  { id: 'inmobiliaria', name: 'Inmobiliaria', hint: 'Venta y alquiler de propiedades' },
  { id: 'desarrolladora', name: 'Desarrolladora', hint: 'Edificios en pozo y obra' },
  { id: 'concesionaria', name: 'Concesionaria', hint: 'Autos 0 km y usados' },
  { id: 'ecommerce', name: 'E-commerce', hint: 'Tienda online' },
  { id: 'gastronomia', name: 'Gastronomía', hint: 'Restaurante con delivery' },
]

/** rubro elegido: ?rubro= en la dirección (en el servidor siempre inmobiliaria) */
export function currentRubroId(): RubroId {
  if (typeof location === 'undefined') return 'inmobiliaria'
  const q = new URLSearchParams(location.search).get('rubro') as RubroId | null
  return RUBRO_LIST.some((r) => r.id === q) ? q! : 'inmobiliaria'
}

export interface Rubro {
  id: RubroId
  /** cómo se le describe la empresa a Bruno */
  company: string
  /** nombre de cada piso o zona en este rubro */
  floorNames: Record<FloorId, string>
  agents: Agent[]
  asks: Record<string, Ask>
  results: Record<string, Result>
  /** avisos que Bruno manda solo cada tanto */
  alerts: string[]
}

export const HAIKU: Sub = { kind: 'model', label: 'Claude Haiku', icon: 'claude' }
export const SONNET: Sub = { kind: 'model', label: 'Claude Sonnet', icon: 'claude' }
export const MEM: Sub = { kind: 'memory', label: 'Memoria del equipo', icon: 'database' }
export const tool = (label: string, icon: IconKey): Sub => ({ kind: 'tool', label, icon })
export const P = (n: number) => `/img/prop${n}.jpg`

/** un paso: [tipo, título, subtítulo, ícono, qué hace, resultado, extras] */
export type S = [NodeKind, string, string, IconKey, string, string[], { preview?: Preview; subs?: Sub[]; items?: number }?]
/** dos pasos en paralelo (o los dos caminos de una condición: el primero es "sí") */
export type Par = { par: [S, S] }

const SECS: Record<NodeKind, number> = { trigger: 1, action: 1.6, ai: 2.6, if: 0.7, handoff: 1 }

export interface Spec {
  id: string
  name: string
  role: string
  floor: FloorId
  color: string
  soft: string
  model: string
  mission: string
  handoffTo?: string
  handoffText: string
  savedMinutes: number
  runsWeek: number
  selfStart?: number
  selfStartText?: string
  sections: [string, string, string]
  steps: (S | Par)[]
}

/** arma el agente con su diagrama: columnas en orden, ramas en paralelo y tres secciones */
export function mk(spec: Spec): Agent {
  const steps: FlowStep[] = []
  const edges: FlowEdge[] = []
  let prev: string[] = []
  let prevIf = false
  let n = 0
  const make = (s: S, col: number, lane: number): FlowStep => {
    const [kind, title, subtitle, icon, what, output, x] = s
    n += 1
    return {
      id: `${spec.id}${n}`, kind, title, subtitle, icon, col, lane, what, output,
      secs: SECS[kind], items: x?.items ?? 1, preview: x?.preview,
      subs: x?.subs ?? (kind === 'ai' ? [HAIKU, MEM] : undefined),
    }
  }
  spec.steps.forEach((item, col) => {
    const now: FlowStep[] = 'par' in item ? [make(item.par[0], col, 0), make(item.par[1], col, 2)] : [make(item, col, 1)]
    steps.push(...now)
    now.forEach((t, k) => {
      for (const p of prev) edges.push({ from: p, to: t.id, label: prevIf && now.length > 1 ? (k === 0 ? 'sí' : 'no') : undefined })
    })
    prev = now.map((t) => t.id)
    prevIf = now.length === 1 && now[0].kind === 'if'
  })
  const cols = spec.steps.length
  const a = Math.max(1, Math.round(cols / 3))
  const b = Math.max(a + 1, Math.round((cols * 2) / 3))
  return {
    id: spec.id, name: spec.name, role: spec.role, floor: spec.floor, color: spec.color, soft: spec.soft,
    model: spec.model, avatar: `/avatars/face-${spec.model}.png`, mission: spec.mission,
    steps, edges,
    sections: [
      { title: spec.sections[0], from: 0, to: a - 1 },
      { title: spec.sections[1], from: a, to: b - 1 },
      { title: spec.sections[2], from: b, to: cols - 1 },
    ],
    handoffTo: spec.handoffTo, handoffText: spec.handoffText,
    selfStart: spec.selfStart, selfStartText: spec.selfStartText,
    savedMinutes: spec.savedMinutes, runsWeek: spec.runsWeek, cost: 0,
  }
}
