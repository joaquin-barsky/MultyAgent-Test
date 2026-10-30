// Resumen del día que Bruno manda por WhatsApp. Se arma con los datos de la demo (en el servidor no corre la simulación).
import { AGENTS, AGENT_BY_ID } from '../src/data/agents.js'
import { ALERTS } from '../src/data/alerts.js'
import { ASKS } from '../src/data/asks.js'

export const SITE = 'https://orik-crew.vercel.app'
export const TEMPLATE = 'resumen_diario'
export const TEMPLATE_LANG = 'es_AR'

const TZ = 'America/Argentina/Buenos_Aires'
const plain = (t: string) => t.replace(/\*\*(.+?)\*\*/g, '$1')

export interface Summary {
  date: string
  tasks: string
  hours: string
  highlights: [string, string, string]
  pending: string
}

/** cambia un poco cada día para que no llegue siempre lo mismo */
export function buildSummary(now = new Date()): Summary {
  const day = Math.floor(now.getTime() / 86400000)
  const k = 0.85 + ((day * 37) % 30) / 100
  const tasks = Math.round((AGENTS.reduce((n, a) => n + a.runsWeek, 0) / 5) * k)
  const hours = Math.round((AGENTS.reduce((n, a) => n + a.runsWeek * a.savedMinutes, 0) / 5 / 60) * k)
  const pick = (i: number) => plain(ALERTS[(day + i) % ALERTS.length])
  const askIds = Object.keys(ASKS)
  const id = askIds[day % askIds.length]
  const date = now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ })
  return {
    date,
    tasks: tasks.toLocaleString('es-AR'),
    hours: hours.toLocaleString('es-AR'),
    highlights: [pick(0), pick(1), pick(2)],
    pending: id ? `${AGENT_BY_ID[id].name} te pregunta: ${ASKS[id].q}` : 'Nada, el equipo siguió solo.',
  }
}

/** el mismo texto que la plantilla, para mandarlo directo cuando la charla está abierta */
export function summaryText(s: Summary) {
  return [
    `Así cerró el equipo hoy, ${s.date}.`,
    '',
    `*${s.tasks} tareas* hechas y *${s.hours} horas* ahorradas.`,
    '',
    '*Lo más importante*',
    ...s.highlights.map((h) => `• ${h}`),
    '',
    '*Te espera*',
    s.pending,
    '',
    'Cualquier duda, escribime acá.',
  ].join('\n')
}

/** valores de la plantilla aprobada por Meta, en el orden {{1}} a {{7}} */
export const summaryParams = (s: Summary) => [s.date, s.tasks, s.hours, ...s.highlights, s.pending]
