import { OTHER_RUBRO } from './rubros/index.js'

// Cuando el agente llega a este paso, a veces frena y te pregunta. No sigue hasta que le contestás.
export interface AskOption {
  label: string
  /** si es true, el agente frena esta tarea en vez de seguir */
  stop?: boolean
}

export interface Ask {
  /** columna del diagrama donde frena */
  col: number
  q: string
  options: AskOption[]
}

const INMO_ASKS: Record<string, Ask> = {
  paz: {
    col: 4,
    q: 'El borrador de reserva del 2 amb. de Palermo está listo. ¿Lo mando al martillero para firmar?',
    options: [{ label: 'Sí, mandalo' }, { label: 'Primero lo leo yo' }, { label: 'Frená la reserva', stop: true }],
  },
  sol: {
    col: 3,
    q: 'El reel del PH de Villa Crespo pasó el control de marca. ¿Lo publico?',
    options: [{ label: 'Publicalo' }, { label: 'Publicalo mañana' }, { label: 'No lo publiques', stop: true }],
  },
  fran: {
    col: 4,
    q: 'La versión B del anuncio trae 3 veces más consultas. ¿Apago las otras dos y le paso todo el presupuesto?',
    options: [{ label: 'Sí, dale' }, { label: 'Apagá las otras, mismo presupuesto' }, { label: 'Dejá todo como está', stop: true }],
  },
  teo: {
    col: 4,
    q: 'Hay 3 alquileres con más de 5 días de atraso. ¿Mando el segundo aviso con tono firme?',
    options: [{ label: 'Mandalo' }, { label: 'Mandalo, pero amable' }, { label: 'Esperá, los llamo yo', stop: true }],
  },
  cata: {
    col: 4,
    q: 'El carrusel del PH de Villa Crespo está listo. ¿Lo programo para el jueves a las 19:30?',
    options: [{ label: 'Sí, programalo' }, { label: 'Mejor el viernes' }, { label: 'No lo publiques', stop: true }],
  },
  martin: {
    col: 3,
    q: 'La tasación del 3 amb. de Colegiales da USD 162.000. ¿Se la mando al dueño?',
    options: [{ label: 'Mandala' }, { label: 'Subila a USD 165.000' }, { label: 'Esperá, la reviso yo', stop: true }],
  },
}

export const ASKS: Record<string, Ask> = OTHER_RUBRO ? OTHER_RUBRO.asks : INMO_ASKS
