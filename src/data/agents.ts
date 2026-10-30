// Equipo de agentes de la demo (una inmobiliaria). Datos simulados para mostrar el concepto.
import { EXTRA_AGENTS } from './agents-extra.js'
import { OTHER_RUBRO } from './rubros/index.js'

export type IconKey =
  | 'whatsapp' | 'instagram' | 'tiktok' | 'youtube' | 'claude' | 'sheets' | 'calendar'
  | 'gmail' | 'docs' | 'drive' | 'elevenlabs' | 'meta'
  | 'clock' | 'globe' | 'building' | 'mic' | 'film' | 'image' | 'captions' | 'music'
  | 'search' | 'merge' | 'filter' | 'bell' | 'calc' | 'chart' | 'user' | 'send'
  | 'list' | 'layers' | 'inbox' | 'route' | 'check' | 'split' | 'brain' | 'database'
  | 'key' | 'file' | 'pen' | 'wallet' | 'repeat' | 'phone' | 'map' | 'shield'

export type NodeKind = 'trigger' | 'action' | 'ai' | 'if' | 'handoff'

export type Preview =
  | { type: 'thumbs'; imgs: string[] }
  | { type: 'chart'; data: number[] }
  | { type: 'text'; text: string }
  | { type: 'chips'; items: string[] }
  | { type: 'stat'; value: string; label: string }

export interface Sub {
  kind: 'model' | 'memory' | 'tool'
  label: string
  icon: IconKey
}

export interface FlowStep {
  id: string
  kind: NodeKind
  title: string
  subtitle: string
  icon: IconKey
  col: number
  lane: number
  secs: number
  items: number
  what: string
  output: string[]
  preview?: Preview
  subs?: Sub[]
}

export interface FlowEdge {
  from: string
  to: string
  label?: string
}

export interface Section {
  title: string
  from: number
  to: number
}

export interface Agent {
  id: string
  name: string
  role: string
  floor: FloorId
  color: string
  soft: string
  model: string
  avatar: string
  mission: string
  steps: FlowStep[]
  edges: FlowEdge[]
  sections: Section[]
  handoffTo?: string
  handoffText: string
  selfStart?: number
  selfStartText?: string
  savedMinutes: number
  runsWeek: number
  /** costo aproximado de una vuelta en dólares */
  cost: number
}

export type FloorId = 'direccion' | 'marketing' | 'finanzas' | 'administracion' | 'ventas'

const INMO_FLOORS: { id: FloorId; name: string; n: number; tint: string }[] = [
  { id: 'direccion', name: 'Dirección', n: 5, tint: '#2E7DFF' },
  { id: 'marketing', name: 'Marketing', n: 4, tint: '#FF3D9A' },
  { id: 'finanzas', name: 'Finanzas', n: 3, tint: '#3DAE2B' },
  { id: 'administracion', name: 'Administración', n: 2, tint: '#8A5CF6' },
  { id: 'ventas', name: 'Ventas', n: 1, tint: '#00A991' },
]

/** pisos del rubro elegido: los mismos cinco lugares, con el nombre de cada rubro */
export const FLOORS = INMO_FLOORS.map((f) => ({ ...f, name: OTHER_RUBRO?.floorNames[f.id] ?? f.name }))

/** cómo se le describe la empresa a Bruno */
export const COMPANY = OTHER_RUBRO?.company ?? 'Inmobiliaria de Buenos Aires que vende y alquila propiedades'

export const SUPERVISOR = {
  name: 'Bruno',
  role: 'Supervisor',
  model: 'character-male-e',
  avatar: '/avatars/face-character-male-e.png',
  color: '#1F2A37',
  soft: '#E4E9F0',
}

const chain = (ids: string[]): FlowEdge[] => ids.slice(1).map((to, i) => ({ from: ids[i], to }))
const P = (n: number) => `/img/prop${n}.jpg`
const HAIKU: Sub = { kind: 'model', label: 'Claude Haiku', icon: 'claude' }
const SONNET: Sub = { kind: 'model', label: 'Claude Sonnet', icon: 'claude' }
const MEM: Sub = { kind: 'memory', label: 'Memoria del equipo', icon: 'database' }

const INMO_AGENTS: Agent[] = [
  {
    id: 'mora', name: 'Mora', role: 'Coordinadora', floor: 'direccion', color: '#2E7DFF', soft: '#DCE9FF',
    model: 'character-female-c', avatar: '/avatars/face-character-female-c.png',
    mission: 'Reparte el trabajo del día entre los pisos, sigue los avances y le arma un resumen al dueño.',
    handoffTo: 'lupa', handoffText: 'le pidió a Lupa el relevamiento de la competencia',
    savedMinutes: 25, runsWeek: 214, cost: 0.004,
    sections: [{ title: 'Leer el día', from: 0, to: 1 }, { title: 'Decidir', from: 2, to: 3 }, { title: 'Repartir', from: 4, to: 5 }],
    steps: [
      { id: 'm1', kind: 'trigger', title: 'Arranca el día', subtitle: 'Lunes a sábado 8:00', icon: 'clock', col: 0, lane: 1, secs: 1.4, items: 1, what: 'Se activa sola a la mañana, antes de que llegue el equipo.', output: ['Turno abierto a las 8:00'] },
      { id: 'm2', kind: 'action', title: 'Leer pendientes', subtitle: 'Planilla del equipo', icon: 'sheets', col: 1, lane: 0, secs: 1.8, items: 14, what: 'Lee la planilla donde el equipo anota pedidos y tareas abiertas.', output: ['14 tareas abiertas', '3 propiedades nuevas'], preview: { type: 'stat', value: '14', label: 'tareas abiertas' } },
      { id: 'm3', kind: 'action', title: 'Leer mails', subtitle: 'Bandeja del dueño', icon: 'gmail', col: 1, lane: 2, secs: 1.8, items: 23, what: 'Revisa los mails de la noche y separa los que piden algo.', output: ['23 mails', '4 piden una acción'] },
      { id: 'm4', kind: 'ai', title: 'Priorizar el día', subtitle: 'Agente de IA', icon: 'brain', col: 2, lane: 1, secs: 2.8, items: 6, what: 'Decide qué es urgente y a qué piso le toca cada cosa.', output: ['Marketing: 3 publicaciones', 'Ventas: 2 consultas', 'Finanzas: cierre de caja'], subs: [SONNET, MEM, { kind: 'tool', label: 'Calendario', icon: 'calendar' }] },
      { id: 'm5', kind: 'if', title: '¿Hay algo urgente?', subtitle: 'Condición', icon: 'split', col: 3, lane: 1, secs: 0.8, items: 1, what: 'Si hay algo urgente, le avisa al dueño antes que nada.', output: ['Sí: 1 vencimiento de contrato hoy'] },
      { id: 'm6', kind: 'action', title: 'Avisar al dueño', subtitle: 'WhatsApp', icon: 'whatsapp', col: 4, lane: 0, secs: 1.4, items: 1, what: 'Le manda un mensaje corto con lo urgente.', output: ['Mensaje enviado 8:04'] },
      { id: 'm7', kind: 'action', title: 'Plan del día', subtitle: 'Grupo del equipo', icon: 'list', col: 4, lane: 2, secs: 1.4, items: 6, what: 'Publica el plan del día en el grupo para que las personas sepan qué va a pasar.', output: ['Plan publicado'], preview: { type: 'chips', items: ['Marketing', 'Ventas', 'Finanzas'] } },
      { id: 'm8', kind: 'handoff', title: 'Pasarle a Lupa', subtitle: 'Relevamiento', icon: 'send', col: 5, lane: 1, secs: 1, items: 1, what: 'Le pasa la primera tarea al agente de competencia.', output: ['Tarea entregada a Lupa'] },
    ],
    edges: [
      { from: 'm1', to: 'm2' }, { from: 'm1', to: 'm3' }, { from: 'm2', to: 'm4' }, { from: 'm3', to: 'm4' }, { from: 'm4', to: 'm5' },
      { from: 'm5', to: 'm6', label: 'sí' }, { from: 'm5', to: 'm7', label: 'no' }, { from: 'm6', to: 'm8' }, { from: 'm7', to: 'm8' },
    ],
  },
  {
    id: 'lupa', name: 'Lupa', role: 'Analista de competencia', floor: 'marketing', color: '#FF5A36', soft: '#FFE2D9',
    model: 'character-female-a', avatar: '/avatars/face-character-female-a.png',
    mission: 'Mira las redes y los avisos de otras inmobiliarias y saca lo que está funcionando.',
    handoffTo: 'cata', handoffText: 'le pasó a Cata 3 tendencias de la semana',
    savedMinutes: 180, runsWeek: 6, cost: 0.03,
    sections: [{ title: 'Recolectar', from: 0, to: 2 }, { title: 'Analizar', from: 3, to: 4 }, { title: 'Entregar', from: 5, to: 6 }],
    steps: [
      { id: 'l1', kind: 'trigger', title: 'Pedido de Mora', subtitle: 'Todos los lunes', icon: 'inbox', col: 0, lane: 1, secs: 1.2, items: 1, what: 'Arranca cuando Mora le pasa el relevamiento.', output: ['Relevamiento semanal pedido'] },
      { id: 'l2', kind: 'action', title: 'Revisar Instagram', subtitle: '6 inmobiliarias', icon: 'instagram', col: 1, lane: 0, secs: 2.2, items: 42, what: 'Junta los posteos y reels que publicó la competencia esta semana.', output: ['42 posteos nuevos', 'El más visto: recorrido de PH con terraza'], preview: { type: 'thumbs', imgs: [P(3), P(4), P(5)] } },
      { id: 'l3', kind: 'action', title: 'Revisar TikTok', subtitle: 'Mismas cuentas', icon: 'tiktok', col: 1, lane: 1, secs: 2, items: 18, what: 'Junta los videos cortos y cuántas vistas tuvo cada uno.', output: ['18 videos', 'Promedio 4.300 vistas'], preview: { type: 'chart', data: [3, 5, 4, 8, 6, 11, 9] } },
      { id: 'l4', kind: 'action', title: 'Avisos en portales', subtitle: 'Precios y fotos', icon: 'building', col: 1, lane: 2, secs: 2.4, items: 126, what: 'Lee los avisos nuevos de la zona y guarda precio, metros y fotos.', output: ['126 avisos nuevos', 'Palermo: 2 amb. bajó 3%'], preview: { type: 'stat', value: '126', label: 'avisos nuevos' } },
      { id: 'l5', kind: 'action', title: 'Transcribir videos', subtitle: 'Audio a texto', icon: 'captions', col: 2, lane: 1, secs: 1.8, items: 29, what: 'Pasa a texto lo que dicen los videos para poder analizarlos.', output: ['29 videos transcriptos'], preview: { type: 'text', text: '"…PH reciclado, 3 ambientes, terraza propia con parrilla, a dos cuadras del subte…"' } },
      { id: 'l6', kind: 'ai', title: 'Detectar tendencias', subtitle: 'Agente de IA', icon: 'brain', col: 3, lane: 1, secs: 3, items: 3, what: 'Mira los videos, lee los textos y encuentra qué se repite en lo que funciona.', output: ['Recorridos de 20 s en primera persona', 'Precio en el primer segundo', 'Terrazas al atardecer'], subs: [SONNET, MEM, { kind: 'tool', label: 'Buscador web', icon: 'globe' }] },
      { id: 'l7', kind: 'if', title: '¿Hay algo nuevo?', subtitle: 'Contra la semana pasada', icon: 'split', col: 4, lane: 1, secs: 0.8, items: 1, what: 'Compara con lo que encontró la semana pasada para no repetir.', output: ['Sí: 2 tendencias nuevas'] },
      { id: 'l8', kind: 'action', title: 'Informe semanal', subtitle: 'Google Docs', icon: 'docs', col: 5, lane: 0, secs: 1.6, items: 1, what: 'Escribe un informe corto con capturas para el dueño.', output: ['Informe de 2 páginas'] },
      { id: 'l9', kind: 'handoff', title: 'Pasarle a Cata', subtitle: 'Ideas para redes', icon: 'send', col: 6, lane: 1, secs: 1, items: 3, what: 'Le pasa las tendencias a la agente de redes.', output: ['3 tendencias entregadas'] },
    ],
    edges: [
      { from: 'l1', to: 'l2' }, { from: 'l1', to: 'l3' }, { from: 'l1', to: 'l4' },
      { from: 'l2', to: 'l5' }, { from: 'l3', to: 'l5' }, { from: 'l4', to: 'l6' }, { from: 'l5', to: 'l6' },
      { from: 'l6', to: 'l7' }, { from: 'l7', to: 'l8', label: 'sí' }, { from: 'l7', to: 'l9', label: 'no' }, { from: 'l8', to: 'l9' },
    ],
  },
  {
    id: 'cata', name: 'Cata', role: 'Redes y contenido', floor: 'marketing', color: '#FF3D9A', soft: '#FFDDEE',
    model: 'character-female-b', avatar: '/avatars/face-character-female-b.png',
    mission: 'Convierte cada propiedad nueva en publicaciones listas, con el estilo que está funcionando.',
    handoffTo: 'rolo', handoffText: 'le pidió a Rolo un reel de la propiedad',
    savedMinutes: 90, runsWeek: 23, cost: 0.012,
    sections: [{ title: 'Material', from: 0, to: 1 }, { title: 'Crear', from: 2, to: 3 }, { title: 'Publicar', from: 4, to: 5 }],
    steps: [
      { id: 'c1', kind: 'trigger', title: 'Propiedad nueva', subtitle: 'Cargada en el sistema', icon: 'building', col: 0, lane: 1, secs: 1.2, items: 1, what: 'Arranca cuando se carga una propiedad o cuando Lupa le pasa ideas.', output: ['PH 3 amb. con terraza, Villa Crespo'] },
      { id: 'c2', kind: 'action', title: 'Fotos y ficha', subtitle: 'Google Drive', icon: 'drive', col: 1, lane: 1, secs: 1.8, items: 24, what: 'Lee los datos de la ficha y baja las fotos de la carpeta.', output: ['24 fotos', '96 m², terraza propia'], preview: { type: 'thumbs', imgs: [P(4), P(6), P(3)] } },
      { id: 'c3', kind: 'ai', title: 'Escribir el posteo', subtitle: 'Agente de IA', icon: 'brain', col: 2, lane: 1, secs: 2.8, items: 3, what: 'Escribe el texto, el título y los hashtags usando las tendencias de Lupa.', output: ['Título: Tu terraza en Villa Crespo', 'Texto de 90 palabras', '12 hashtags'], subs: [HAIKU, MEM, { kind: 'tool', label: 'Tono de la marca', icon: 'pen' }] },
      { id: 'c4', kind: 'action', title: 'Armar carrusel', subtitle: '6 placas 4:5', icon: 'layers', col: 3, lane: 0, secs: 2.2, items: 6, what: 'Arma las placas del carrusel con la plantilla de la marca.', output: ['6 placas'], preview: { type: 'thumbs', imgs: [P(6), P(5), P(4)] } },
      { id: 'c5', kind: 'action', title: 'Historia', subtitle: 'Formato 9:16', icon: 'image', col: 3, lane: 2, secs: 1.6, items: 2, what: 'Hace dos historias con encuesta para medir interés.', output: ['2 historias'] },
      { id: 'c6', kind: 'action', title: 'Programar', subtitle: 'Instagram y Facebook', icon: 'meta', col: 4, lane: 1, secs: 1.6, items: 2, what: 'Deja programada la publicación en el mejor horario.', output: ['Jueves 19:30'], preview: { type: 'chips', items: ['Jue 19:30', 'Vie 13:00'] } },
      { id: 'c7', kind: 'handoff', title: 'Pedir reel a Rolo', subtitle: 'Video de 20 s', icon: 'send', col: 5, lane: 1, secs: 1, items: 1, what: 'Le pasa a Rolo las fotos y la idea para el reel.', output: ['Pedido de reel entregado'] },
    ],
    edges: [...chain(['c1', 'c2', 'c3']), { from: 'c3', to: 'c4' }, { from: 'c3', to: 'c5' }, { from: 'c4', to: 'c6' }, { from: 'c5', to: 'c6' }, { from: 'c6', to: 'c7' }],
  },
  {
    id: 'rolo', name: 'Rolo', role: 'Editor de video', floor: 'marketing', color: '#FFA400', soft: '#FFEFC9',
    model: 'character-male-b', avatar: '/avatars/face-character-male-b.png',
    mission: 'Arma reels de cada propiedad con plantilla, voz y subtítulos, y los manda a revisar.',
    handoffTo: 'sol', handoffText: 'le pasó a Sol el reel para revisar',
    savedMinutes: 120, runsWeek: 17, cost: 0.02,
    sections: [{ title: 'Guion', from: 0, to: 1 }, { title: 'Producción', from: 2, to: 4 }, { title: 'Revisión', from: 5, to: 6 }],
    steps: [
      { id: 'r1', kind: 'trigger', title: 'Pedido de Cata', subtitle: 'Reel de 20 s', icon: 'inbox', col: 0, lane: 1, secs: 1.2, items: 1, what: 'Arranca cuando Cata le pide un video.', output: ['Pedido: PH Villa Crespo'] },
      { id: 'r2', kind: 'ai', title: 'Tomas y guion', subtitle: 'Agente de IA', icon: 'brain', col: 1, lane: 1, secs: 2.6, items: 8, what: 'Elige las 8 mejores fotos y escribe un guion de 20 segundos.', output: ['8 fotos elegidas', 'Precio en el primer segundo'], subs: [SONNET, { kind: 'tool', label: 'Analizar fotos', icon: 'image' }] },
      { id: 'r3', kind: 'action', title: 'Voz en off', subtitle: 'ElevenLabs', icon: 'elevenlabs', col: 2, lane: 0, secs: 2, items: 1, what: 'Graba la voz del guion con una voz porteña.', output: ['Audio de 19 s'], preview: { type: 'chart', data: [2, 6, 4, 9, 3, 7, 5, 8, 2, 6, 4] } },
      { id: 'r4', kind: 'action', title: 'Música', subtitle: 'Biblioteca libre', icon: 'music', col: 2, lane: 2, secs: 1.4, items: 1, what: 'Elige un tema con licencia que acompañe el ritmo.', output: ['Tema de 92 BPM'] },
      { id: 'r5', kind: 'action', title: 'Montar el reel', subtitle: 'Plantilla de la marca', icon: 'film', col: 3, lane: 1, secs: 3, items: 1, what: 'Monta fotos, voz y música con la plantilla de la inmobiliaria.', output: ['Reel 9:16 de 20 s'], preview: { type: 'thumbs', imgs: [P(1), P(2), P(6)] } },
      { id: 'r6', kind: 'action', title: 'Subtítulos', subtitle: 'Automáticos', icon: 'captions', col: 4, lane: 1, secs: 1.6, items: 1, what: 'Agrega subtítulos grandes para ver sin sonido.', output: ['42 palabras'] },
      { id: 'r7', kind: 'if', title: '¿Pasa el control?', subtitle: 'Duración y marca', icon: 'shield', col: 5, lane: 1, secs: 0.8, items: 1, what: 'Revisa que dure menos de 30 s y que tenga el logo y el precio.', output: ['Sí: 20 s, logo y precio ok'] },
      { id: 'r8', kind: 'handoff', title: 'Mandar a revisar', subtitle: 'A Sol', icon: 'send', col: 6, lane: 1, secs: 1, items: 1, what: 'Se lo pasa a Sol, que controla la calidad antes de publicar.', output: ['Reel listo para revisar'] },
    ],
    edges: [
      { from: 'r1', to: 'r2' }, { from: 'r2', to: 'r3' }, { from: 'r2', to: 'r4' }, { from: 'r3', to: 'r5' }, { from: 'r4', to: 'r5' },
      { from: 'r5', to: 'r6' }, { from: 'r6', to: 'r7' }, { from: 'r7', to: 'r8', label: 'sí' },
    ],
  },
  {
    id: 'leo', name: 'Leo', role: 'Atención de consultas', floor: 'ventas', color: '#00A991', soft: '#D2F5EE',
    model: 'character-male-a', avatar: '/avatars/face-character-male-a.png',
    mission: 'Contesta las consultas al toque, a cualquier hora, y ofrece propiedades parecidas.',
    handoffTo: 'juli', handoffText: 'le pasó a Juli una visita para agendar',
    selfStart: 10, selfStartText: 'recibió una consulta nueva por WhatsApp',
    savedMinutes: 15, runsWeek: 148, cost: 0.002,
    sections: [{ title: 'Entender', from: 0, to: 2 }, { title: 'Responder', from: 3, to: 4 }, { title: 'Pasar', from: 5, to: 5 }],
    steps: [
      { id: 'e1', kind: 'trigger', title: 'Consulta nueva', subtitle: 'WhatsApp o portal', icon: 'whatsapp', col: 0, lane: 1, secs: 1, items: 1, what: 'Se activa cada vez que entra una consulta, a cualquier hora.', output: ['¿Sigue disponible el 2 amb. de Palermo?'], preview: { type: 'text', text: '"Hola! ¿Sigue disponible el 2 amb. de Palermo? ¿Se puede ver esta semana?"' } },
      { id: 'e2', kind: 'ai', title: 'Entender qué busca', subtitle: 'Agente de IA', icon: 'brain', col: 1, lane: 1, secs: 2.2, items: 1, what: 'Saca zona, ambientes, presupuesto y urgencia del mensaje.', output: ['Palermo, 2 ambientes', 'Hasta USD 140.000', 'Quiere visitar esta semana'], subs: [HAIKU, MEM, { kind: 'tool', label: 'Cartera de propiedades', icon: 'database' }] },
      { id: 'e3', kind: 'if', title: '¿Es un lead caliente?', subtitle: 'Urgencia y presupuesto', icon: 'split', col: 2, lane: 1, secs: 0.6, items: 1, what: 'Si quiere visitar pronto y el presupuesto cierra, lo prioriza.', output: ['Sí: visita esta semana'] },
      { id: 'e4', kind: 'action', title: 'Buscar parecidas', subtitle: 'Cartera', icon: 'search', col: 3, lane: 0, secs: 1.8, items: 3, what: 'Busca las propiedades que mejor coinciden.', output: ['Palermo Hollywood', 'Palermo Soho', 'Colegiales'], preview: { type: 'thumbs', imgs: [P(3), P(4), P(5)] } },
      { id: 'e5', kind: 'action', title: 'Respuesta corta', subtitle: 'Info general', icon: 'whatsapp', col: 3, lane: 2, secs: 1.2, items: 1, what: 'Si es una consulta general, responde y deja la puerta abierta.', output: ['Respuesta enviada'] },
      { id: 'e6', kind: 'action', title: 'Responder con opciones', subtitle: 'WhatsApp', icon: 'whatsapp', col: 4, lane: 0, secs: 1.4, items: 1, what: 'Le contesta con las opciones y fotos en menos de un minuto.', output: ['Respuesta en 40 s'], preview: { type: 'stat', value: '40 s', label: 'tiempo de respuesta' } },
      { id: 'e7', kind: 'handoff', title: 'Pasarle a Juli', subtitle: 'Agendar visita', icon: 'send', col: 5, lane: 0, secs: 1, items: 1, what: 'Le pasa a Juli el pedido de visita.', output: ['Pedido de visita entregado'] },
    ],
    edges: [
      { from: 'e1', to: 'e2' }, { from: 'e2', to: 'e3' }, { from: 'e3', to: 'e4', label: 'sí' }, { from: 'e3', to: 'e5', label: 'no' },
      { from: 'e4', to: 'e6' }, { from: 'e6', to: 'e7' },
    ],
  },
  {
    id: 'vale', name: 'Vale', role: 'Seguimiento de clientes', floor: 'ventas', color: '#0EA5C6', soft: '#D4F1F8',
    model: 'character-female-d', avatar: '/avatars/face-character-female-d.png',
    mission: 'Sigue a cada interesado después de la visita para que ninguno se enfríe.',
    handoffTo: 'paz', handoffText: 'le avisó a Paz que hay una reserva para preparar',
    savedMinutes: 40, runsWeek: 61, cost: 0.003,
    sections: [{ title: 'Después de la visita', from: 0, to: 2 }, { title: 'Cerrar', from: 3, to: 4 }],
    steps: [
      { id: 'v1', kind: 'trigger', title: 'Visita hecha', subtitle: 'Aviso de Juli', icon: 'inbox', col: 0, lane: 1, secs: 1.2, items: 1, what: 'Arranca cuando termina una visita.', output: ['Visita: 2 amb. Palermo Hollywood'] },
      { id: 'v2', kind: 'action', title: 'Mensaje post visita', subtitle: 'WhatsApp', icon: 'whatsapp', col: 1, lane: 1, secs: 1.4, items: 1, what: 'Le pregunta qué le pareció y si quiere ver algo más.', output: ['Mensaje enviado a las 2 h'] },
      { id: 'v3', kind: 'ai', title: 'Leer la respuesta', subtitle: 'Agente de IA', icon: 'brain', col: 2, lane: 1, secs: 2, items: 1, what: 'Entiende si quiere ofertar, seguir mirando o no le interesa.', output: ['Quiere ofertar USD 132.000'], subs: [HAIKU, MEM] },
      { id: 'v4', kind: 'if', title: '¿Quiere reservar?', subtitle: 'Intención', icon: 'split', col: 3, lane: 1, secs: 0.6, items: 1, what: 'Si quiere reservar, arranca los papeles; si no, lo vuelve a contactar en 5 días.', output: ['Sí'] },
      { id: 'v5', kind: 'action', title: 'Recordatorio', subtitle: 'En 5 días', icon: 'repeat', col: 4, lane: 2, secs: 1, items: 1, what: 'Agenda un nuevo contacto para no perderlo.', output: ['Recordatorio agendado'] },
      { id: 'v6', kind: 'handoff', title: 'Pasarle a Paz', subtitle: 'Armar reserva', icon: 'send', col: 4, lane: 0, secs: 1, items: 1, what: 'Le pasa a Paz los datos para armar la reserva.', output: ['Reserva pedida'] },
    ],
    edges: [...chain(['v1', 'v2', 'v3', 'v4']), { from: 'v4', to: 'v6', label: 'sí' }, { from: 'v4', to: 'v5', label: 'no' }],
  },
  {
    id: 'juli', name: 'Juli', role: 'Agenda y visitas', floor: 'administracion', color: '#8A5CF6', soft: '#ECE4FF',
    model: 'character-male-c', avatar: '/avatars/face-character-male-c.png',
    mission: 'Coordina las visitas con el cliente, el agente de la inmobiliaria y las llaves.',
    handoffTo: 'vale', handoffText: 'le avisó a Vale que la visita ya se hizo',
    savedMinutes: 20, runsWeek: 52, cost: 0.002,
    sections: [{ title: 'Coordinar', from: 0, to: 2 }, { title: 'Confirmar', from: 3, to: 4 }],
    steps: [
      { id: 'j1', kind: 'trigger', title: 'Pedido de visita', subtitle: 'De Leo', icon: 'inbox', col: 0, lane: 1, secs: 1, items: 1, what: 'Arranca cuando Leo consigue un interesado que quiere ver.', output: ['Visita para 2 amb. Palermo'] },
      { id: 'j2', kind: 'action', title: 'Buscar horarios', subtitle: 'Google Calendar', icon: 'calendar', col: 1, lane: 0, secs: 1.6, items: 4, what: 'Busca horarios libres del agente que lleva la propiedad.', output: ['Jue 17:00', 'Vie 11:00'], preview: { type: 'chips', items: ['Jue 17:00', 'Vie 11:00', 'Sáb 10:30'] } },
      { id: 'j3', kind: 'action', title: 'Llaves', subtitle: 'Planilla de llaves', icon: 'key', col: 1, lane: 2, secs: 1.2, items: 1, what: 'Chequea quién tiene las llaves ese día.', output: ['Llaves en la oficina'] },
      { id: 'j4', kind: 'action', title: 'Confirmar al cliente', subtitle: 'WhatsApp', icon: 'whatsapp', col: 2, lane: 1, secs: 1.4, items: 1, what: 'Le confirma día, hora y dirección con un mapa.', output: ['Confirmado jueves 17:00'] },
      { id: 'j5', kind: 'action', title: 'Recordatorio', subtitle: '2 h antes', icon: 'bell', col: 3, lane: 1, secs: 1, items: 2, what: 'Le recuerda al cliente y al agente antes de la visita.', output: ['2 recordatorios enviados'] },
      { id: 'j6', kind: 'handoff', title: 'Pasarle a Vale', subtitle: 'Seguimiento', icon: 'send', col: 4, lane: 1, secs: 1, items: 1, what: 'Después de la visita, se la pasa a Vale para el seguimiento.', output: ['Visita entregada a Vale'] },
    ],
    edges: [{ from: 'j1', to: 'j2' }, { from: 'j1', to: 'j3' }, { from: 'j2', to: 'j4' }, { from: 'j3', to: 'j4' }, ...chain(['j4', 'j5', 'j6'])],
  },
  {
    id: 'paz', name: 'Paz', role: 'Contratos y papeles', floor: 'administracion', color: '#B05CE6', soft: '#F3E3FC',
    model: 'character-female-f', avatar: '/avatars/face-character-female-f.png',
    mission: 'Prepara borradores de reservas y contratos y revisa que no falte ningún papel.',
    handoffTo: 'gaby', handoffText: 'le avisó a Gaby que hay una seña para facturar',
    savedMinutes: 75, runsWeek: 9, cost: 0.025,
    sections: [{ title: 'Datos', from: 0, to: 1 }, { title: 'Redactar', from: 2, to: 3 }, { title: 'Entregar', from: 4, to: 5 }],
    steps: [
      { id: 'p1', kind: 'trigger', title: 'Reserva pedida', subtitle: 'De Vale', icon: 'inbox', col: 0, lane: 1, secs: 1, items: 1, what: 'Arranca cuando un cliente quiere reservar.', output: ['Oferta USD 132.000'] },
      { id: 'p2', kind: 'action', title: 'Juntar datos', subtitle: 'Ficha y cliente', icon: 'drive', col: 1, lane: 1, secs: 1.6, items: 7, what: 'Junta los datos de la propiedad, el dueño y el comprador.', output: ['7 datos completos'] },
      { id: 'p3', kind: 'ai', title: 'Redactar borrador', subtitle: 'Agente de IA', icon: 'brain', col: 2, lane: 1, secs: 3, items: 1, what: 'Escribe el borrador de la reserva con el modelo de la inmobiliaria.', output: ['Borrador de 3 páginas'], subs: [SONNET, { kind: 'tool', label: 'Modelos de contrato', icon: 'file' }], preview: { type: 'text', text: '"…el oferente entrega en concepto de reserva la suma de USD 5.000…"' } },
      { id: 'p4', kind: 'if', title: '¿Falta algún papel?', subtitle: 'Control', icon: 'shield', col: 3, lane: 1, secs: 0.8, items: 1, what: 'Revisa que estén todos los documentos antes de firmar.', output: ['Falta: informe de dominio'] },
      { id: 'p5', kind: 'action', title: 'Pedir lo que falta', subtitle: 'Gmail', icon: 'gmail', col: 4, lane: 2, secs: 1.2, items: 1, what: 'Pide por mail lo que falta.', output: ['Mail enviado al escribano'] },
      { id: 'p6', kind: 'action', title: 'Mandar a revisar', subtitle: 'A una persona', icon: 'user', col: 4, lane: 0, secs: 1.2, items: 1, what: 'El borrador siempre lo revisa una persona antes de firmar.', output: ['Enviado al martillero'] },
      { id: 'p7', kind: 'handoff', title: 'Avisar a Gaby', subtitle: 'Seña', icon: 'send', col: 5, lane: 1, secs: 1, items: 1, what: 'Le avisa a facturación que va a entrar una seña.', output: ['Aviso entregado a Gaby'] },
    ],
    edges: [...chain(['p1', 'p2', 'p3', 'p4']), { from: 'p4', to: 'p5', label: 'sí' }, { from: 'p4', to: 'p6', label: 'no' }, { from: 'p5', to: 'p7' }, { from: 'p6', to: 'p7' }],
  },
  {
    id: 'nina', name: 'Nina', role: 'Caja diaria', floor: 'finanzas', color: '#3DAE2B', soft: '#E3F5D6',
    model: 'character-female-e', avatar: '/avatars/face-character-female-e.png',
    mission: 'Ordena cobros y gastos todos los días y avisa si algo no cierra.',
    handoffTo: 'mora', handoffText: 'le pasó a Mora el cierre de caja',
    savedMinutes: 60, runsWeek: 12, cost: 0.006,
    sections: [{ title: 'Leer', from: 0, to: 1 }, { title: 'Cruzar', from: 2, to: 3 }, { title: 'Reportar', from: 4, to: 5 }],
    steps: [
      { id: 'n1', kind: 'trigger', title: 'Aviso o cierre', subtitle: 'Todos los días 19:00', icon: 'clock', col: 0, lane: 1, secs: 1, items: 1, what: 'Arranca a la tarde o cuando le avisan de una seña.', output: ['Cierre del día'] },
      { id: 'n2', kind: 'action', title: 'Leer cobros', subtitle: 'Planilla de comisiones', icon: 'sheets', col: 1, lane: 0, secs: 1.6, items: 9, what: 'Lee las comisiones y señas cobradas.', output: ['9 cobros', '2 señas'], preview: { type: 'chart', data: [4, 6, 5, 9, 7, 8, 12] } },
      { id: 'n3', kind: 'action', title: 'Leer facturas', subtitle: 'Gmail', icon: 'gmail', col: 1, lane: 2, secs: 1.6, items: 7, what: 'Busca facturas y gastos que llegaron por mail.', output: ['7 facturas', '1 vence mañana'] },
      { id: 'n4', kind: 'action', title: 'Conciliar', subtitle: 'Cruce de datos', icon: 'calc', col: 2, lane: 1, secs: 2, items: 16, what: 'Cruza lo cobrado con lo pagado y lo que falta.', output: ['16 movimientos', 'Todo cierra salvo 1'], preview: { type: 'stat', value: '15/16', label: 'movimientos ok' } },
      { id: 'n5', kind: 'ai', title: 'Detectar alertas', subtitle: 'Agente de IA', icon: 'brain', col: 3, lane: 1, secs: 2.4, items: 2, what: 'Marca pagos duplicados, cobros atrasados o gastos que crecen.', output: ['Transferencia sin comprobante', 'Publicidad subió 18%'], subs: [HAIKU, MEM] },
      { id: 'n6', kind: 'action', title: 'Reporte de caja', subtitle: 'WhatsApp al dueño', icon: 'whatsapp', col: 4, lane: 1, secs: 1.4, items: 1, what: 'Le manda al dueño un resumen de 5 líneas.', output: ['Resumen enviado'] },
      { id: 'n7', kind: 'handoff', title: 'Pasarle a Mora', subtitle: 'Cierre', icon: 'send', col: 5, lane: 1, secs: 1, items: 1, what: 'Le deja el cierre a Mora para el resumen general.', output: ['Cierre entregado'] },
    ],
    edges: [{ from: 'n1', to: 'n2' }, { from: 'n1', to: 'n3' }, { from: 'n2', to: 'n4' }, { from: 'n3', to: 'n4' }, ...chain(['n4', 'n5', 'n6', 'n7'])],
  },
  {
    id: 'teo', name: 'Teo', role: 'Cobro de alquileres', floor: 'finanzas', color: '#7DBA1A', soft: '#EDF6D6',
    model: 'character-male-d', avatar: '/avatars/face-character-male-d.png',
    mission: 'Avisa a cada inquilino antes del vencimiento, registra los pagos y persigue los atrasos.',
    handoffTo: 'nina', handoffText: 'le pasó a Nina los alquileres cobrados',
    selfStart: 22, selfStartText: 'arrancó la ronda de vencimientos de alquileres',
    savedMinutes: 50, runsWeek: 31, cost: 0.003,
    sections: [{ title: 'Avisar', from: 0, to: 1 }, { title: 'Controlar', from: 2, to: 3 }, { title: 'Pasar', from: 4, to: 4 }],
    steps: [
      { id: 't1', kind: 'trigger', title: 'Vencimientos', subtitle: 'Todos los días 9:00', icon: 'clock', col: 0, lane: 1, secs: 1, items: 38, what: 'Revisa qué alquileres vencen en los próximos días.', output: ['38 alquileres este mes'] },
      { id: 't2', kind: 'action', title: 'Aviso al inquilino', subtitle: 'WhatsApp', icon: 'whatsapp', col: 1, lane: 1, secs: 1.6, items: 12, what: 'Manda el aviso con el monto y los datos para transferir.', output: ['12 avisos enviados'], preview: { type: 'stat', value: '12', label: 'avisos hoy' } },
      { id: 't3', kind: 'action', title: 'Leer pagos', subtitle: 'Banco', icon: 'wallet', col: 2, lane: 1, secs: 1.6, items: 9, what: 'Busca las transferencias que entraron.', output: ['9 pagos recibidos'], preview: { type: 'chart', data: [2, 3, 3, 5, 6, 8, 9] } },
      { id: 't4', kind: 'if', title: '¿Hay atrasos?', subtitle: 'Más de 5 días', icon: 'split', col: 3, lane: 1, secs: 0.6, items: 3, what: 'Separa los que se atrasaron.', output: ['Sí: 3 atrasados'] },
      { id: 't5', kind: 'action', title: 'Segundo aviso', subtitle: 'Tono firme', icon: 'phone', col: 4, lane: 2, secs: 1.2, items: 3, what: 'Manda un segundo aviso y, si hace falta, avisa al dueño.', output: ['3 avisos'] },
      { id: 't6', kind: 'handoff', title: 'Pasarle a Nina', subtitle: 'Cobros', icon: 'send', col: 4, lane: 0, secs: 1, items: 9, what: 'Le pasa a Nina lo cobrado para la caja.', output: ['9 cobros entregados'] },
    ],
    edges: [...chain(['t1', 't2', 't3', 't4']), { from: 't4', to: 't5', label: 'sí' }, { from: 't4', to: 't6', label: 'no' }, { from: 't5', to: 't6' }],
  },
]

INMO_AGENTS.push(...EXTRA_AGENTS)

export const AGENTS: Agent[] = OTHER_RUBRO ? OTHER_RUBRO.agents : INMO_AGENTS

export const AGENT_BY_ID = Object.fromEntries(AGENTS.map((a) => [a.id, a])) as Record<string, Agent>
export const agentsOn = (f: FloorId) => AGENTS.filter((a) => a.floor === f)
