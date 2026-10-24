// Equipo de agentes de la demo. Datos simulados para mostrar el concepto.

export type IconKey =
  | 'whatsapp' | 'instagram' | 'tiktok' | 'youtube' | 'claude' | 'sheets' | 'calendar'
  | 'gmail' | 'docs' | 'drive' | 'elevenlabs' | 'meta'
  | 'clock' | 'globe' | 'building' | 'mic' | 'film' | 'image' | 'captions' | 'music'
  | 'search' | 'merge' | 'filter' | 'bell' | 'calc' | 'chart' | 'user' | 'send'
  | 'list' | 'layers' | 'inbox' | 'route' | 'check'

export type NodeKind = 'trigger' | 'action' | 'ai' | 'handoff'

export interface FlowStep {
  id: string
  kind: NodeKind
  title: string
  subtitle: string
  icon: IconKey
  /** columna y carril dentro del diagrama */
  col: number
  lane: number
  /** segundos que tarda en la simulación */
  secs: number
  /** cantidad de elementos que sale de este paso */
  items: number
  what: string
  output: string[]
}

export interface FlowEdge {
  from: string
  to: string
}

export interface Agent {
  id: string
  name: string
  role: string
  color: string
  soft: string
  model: string
  avatar: string
  mission: string
  steps: FlowStep[]
  edges: FlowEdge[]
  handoffTo?: string
  handoffText: string
  /** si arranca solo cada tanto (disparador por horario o por evento externo) */
  selfStart?: number
  savedMinutes: number
  runsWeek: number
}

const chain = (ids: string[]): FlowEdge[] => ids.slice(1).map((to, i) => ({ from: ids[i], to }))

export const AGENTS: Agent[] = [
  {
    id: 'mora',
    name: 'Mora',
    role: 'Coordinadora',
    color: '#2E7DFF',
    soft: '#DCE9FF',
    model: 'character-female-c',
    avatar: '/avatars/face-character-female-c.png',
    mission: 'Reparte el trabajo del día, sigue los avances y le arma un resumen al dueño.',
    handoffTo: 'lupa',
    handoffText: 'le pidió a Lupa el relevamiento de la competencia',
    savedMinutes: 25,
    runsWeek: 214,
    steps: [
      { id: 'm1', kind: 'trigger', title: 'Arranca el día', subtitle: 'Lunes a sábado 8:00', icon: 'clock', col: 0, lane: 0, secs: 1.6, items: 1, what: 'Se activa sola a la mañana, antes de que llegue el equipo.', output: ['Turno abierto a las 8:00'] },
      { id: 'm2', kind: 'action', title: 'Leer pendientes', subtitle: 'Planilla del equipo', icon: 'sheets', col: 1, lane: 0, secs: 2.2, items: 14, what: 'Lee la planilla donde el equipo anota pedidos y tareas abiertas.', output: ['14 tareas abiertas', '3 propiedades nuevas para publicar', '2 consultas sin responder'] },
      { id: 'm3', kind: 'ai', title: 'Priorizar y repartir', subtitle: 'Agente con Claude', icon: 'claude', col: 2, lane: 0, secs: 3, items: 5, what: 'Decide qué es urgente y a qué agente le toca cada cosa.', output: ['Lupa: relevamiento semanal', 'Cata: 3 publicaciones', 'Leo: 2 consultas', 'Nina: cierre de caja'] },
      { id: 'm4', kind: 'action', title: 'Avisar al equipo', subtitle: 'Grupo de WhatsApp', icon: 'whatsapp', col: 3, lane: 0, secs: 1.8, items: 1, what: 'Manda el plan del día al grupo para que las personas sepan qué va a pasar.', output: ['Mensaje enviado al grupo del equipo'] },
      { id: 'm5', kind: 'handoff', title: 'Pasarle a Lupa', subtitle: 'Relevamiento', icon: 'send', col: 4, lane: 0, secs: 1.2, items: 1, what: 'Le pasa la primera tarea al agente de competencia.', output: ['Tarea entregada a Lupa'] },
    ],
    edges: chain(['m1', 'm2', 'm3', 'm4', 'm5']),
  },
  {
    id: 'lupa',
    name: 'Lupa',
    role: 'Analista de competencia',
    color: '#FF5A36',
    soft: '#FFE2D9',
    model: 'character-female-a',
    avatar: '/avatars/face-character-female-a.png',
    mission: 'Mira las redes y los avisos de otras inmobiliarias y saca lo que está funcionando.',
    handoffTo: 'cata',
    handoffText: 'le pasó a Cata 3 tendencias de la semana',
    savedMinutes: 180,
    runsWeek: 6,
    steps: [
      { id: 'l1', kind: 'trigger', title: 'Pedido de Mora', subtitle: 'Todos los lunes', icon: 'inbox', col: 0, lane: 1, secs: 1.4, items: 1, what: 'Arranca cuando Mora le pasa el relevamiento.', output: ['Relevamiento semanal pedido'] },
      { id: 'l2', kind: 'action', title: 'Revisar Instagram', subtitle: '6 inmobiliarias', icon: 'instagram', col: 1, lane: 0, secs: 2.4, items: 42, what: 'Junta los posteos y reels que publicó la competencia esta semana.', output: ['42 posteos nuevos', '11 reels', 'El más visto: recorrido de PH con terraza'] },
      { id: 'l3', kind: 'action', title: 'Revisar TikTok', subtitle: 'Mismas cuentas', icon: 'tiktok', col: 1, lane: 1, secs: 2.2, items: 18, what: 'Junta los videos cortos y cuántas vistas tuvo cada uno.', output: ['18 videos', 'Promedio 4.300 vistas', 'Formato ganador: antes y después'] },
      { id: 'l4', kind: 'action', title: 'Avisos en portales', subtitle: 'Precios y fotos', icon: 'building', col: 1, lane: 2, secs: 2.6, items: 126, what: 'Lee los avisos nuevos de la zona y guarda precio, metros y fotos.', output: ['126 avisos nuevos', 'Palermo: 2 amb. bajó 3%', 'Villa Crespo: más oferta de PH'] },
      { id: 'l5', kind: 'action', title: 'Juntar todo', subtitle: '3 fuentes', icon: 'merge', col: 2, lane: 1, secs: 1.2, items: 186, what: 'Une lo que encontró en redes y portales en una sola lista.', output: ['186 elementos listos para analizar'] },
      { id: 'l6', kind: 'ai', title: 'Detectar tendencias', subtitle: 'Agente con Claude', icon: 'claude', col: 3, lane: 1, secs: 3.2, items: 3, what: 'Mira los videos, lee los textos y encuentra qué se repite en lo que funciona.', output: ['1. Recorridos en primera persona de 20 s', '2. Precio en el primer segundo', '3. Terrazas y balcones al atardecer'] },
      { id: 'l7', kind: 'action', title: 'Informe semanal', subtitle: 'Google Docs', icon: 'docs', col: 4, lane: 1, secs: 1.8, items: 1, what: 'Escribe un informe corto con capturas y se lo deja al dueño.', output: ['Informe de 2 páginas creado'] },
      { id: 'l8', kind: 'handoff', title: 'Pasarle a Cata', subtitle: 'Ideas para redes', icon: 'send', col: 5, lane: 1, secs: 1.2, items: 3, what: 'Le pasa las 3 tendencias a la agente de redes.', output: ['3 tendencias entregadas'] },
    ],
    edges: [
      { from: 'l1', to: 'l2' }, { from: 'l1', to: 'l3' }, { from: 'l1', to: 'l4' },
      { from: 'l2', to: 'l5' }, { from: 'l3', to: 'l5' }, { from: 'l4', to: 'l5' },
      ...chain(['l5', 'l6', 'l7', 'l8']),
    ],
  },
  {
    id: 'cata',
    name: 'Cata',
    role: 'Redes y contenido',
    color: '#FF3D9A',
    soft: '#FFDDEE',
    model: 'character-female-b',
    avatar: '/avatars/face-character-female-b.png',
    mission: 'Convierte cada propiedad nueva en publicaciones listas, con el estilo que está funcionando.',
    handoffTo: 'rolo',
    handoffText: 'le pidió a Rolo un reel de la propiedad',
    savedMinutes: 90,
    runsWeek: 23,
    steps: [
      { id: 'c1', kind: 'trigger', title: 'Propiedad nueva', subtitle: 'Cargada en el sistema', icon: 'building', col: 0, lane: 0, secs: 1.4, items: 1, what: 'Arranca cuando se carga una propiedad nueva o cuando Lupa le pasa ideas.', output: ['PH 3 amb. con terraza, Villa Crespo'] },
      { id: 'c2', kind: 'action', title: 'Leer ficha y fotos', subtitle: 'Google Drive', icon: 'drive', col: 1, lane: 0, secs: 2, items: 24, what: 'Lee los datos de la ficha y baja las fotos de la carpeta.', output: ['24 fotos', '96 m², 3 ambientes, terraza propia'] },
      { id: 'c3', kind: 'ai', title: 'Escribir el posteo', subtitle: 'Agente con Claude', icon: 'claude', col: 2, lane: 0, secs: 3, items: 3, what: 'Escribe el texto, el título y los hashtags usando las tendencias de Lupa.', output: ['Título: Tu terraza en Villa Crespo', 'Texto de 90 palabras', '12 hashtags de la zona'] },
      { id: 'c4', kind: 'action', title: 'Armar carrusel', subtitle: '6 placas', icon: 'layers', col: 3, lane: 0, secs: 2.4, items: 6, what: 'Arma las placas del carrusel con la plantilla de la marca.', output: ['6 placas en formato 4:5'] },
      { id: 'c5', kind: 'action', title: 'Programar', subtitle: 'Instagram y Facebook', icon: 'meta', col: 4, lane: 0, secs: 1.8, items: 2, what: 'Deja programada la publicación en el mejor horario.', output: ['Jueves 19:30 en Instagram', 'Jueves 19:45 en Facebook'] },
      { id: 'c6', kind: 'handoff', title: 'Pedir reel a Rolo', subtitle: 'Video de 20 s', icon: 'send', col: 5, lane: 0, secs: 1.2, items: 1, what: 'Le pasa a Rolo las fotos y la idea para el reel.', output: ['Pedido de reel entregado'] },
    ],
    edges: chain(['c1', 'c2', 'c3', 'c4', 'c5', 'c6']),
  },
  {
    id: 'rolo',
    name: 'Rolo',
    role: 'Editor de video',
    color: '#FFA400',
    soft: '#FFEFC9',
    model: 'character-male-b',
    avatar: '/avatars/face-character-male-b.png',
    mission: 'Arma reels de cada propiedad con plantilla, voz y subtítulos, y los manda a revisar.',
    handoffTo: 'mora',
    handoffText: 'le entregó a Mora el reel para revisar',
    savedMinutes: 120,
    runsWeek: 17,
    steps: [
      { id: 'r1', kind: 'trigger', title: 'Pedido de Cata', subtitle: 'Reel de 20 s', icon: 'inbox', col: 0, lane: 1, secs: 1.4, items: 1, what: 'Arranca cuando Cata le pide un video.', output: ['Pedido: PH Villa Crespo'] },
      { id: 'r2', kind: 'ai', title: 'Elegir tomas y guion', subtitle: 'Agente con Claude', icon: 'claude', col: 1, lane: 1, secs: 2.8, items: 8, what: 'Elige las 8 mejores fotos y escribe un guion de 20 segundos.', output: ['8 fotos elegidas', 'Guion: precio en el primer segundo'] },
      { id: 'r3', kind: 'action', title: 'Voz en off', subtitle: 'ElevenLabs', icon: 'elevenlabs', col: 2, lane: 0, secs: 2.2, items: 1, what: 'Graba la voz del guion con una voz porteña.', output: ['Audio de 19 s'] },
      { id: 'r4', kind: 'action', title: 'Música', subtitle: 'Biblioteca libre', icon: 'music', col: 2, lane: 2, secs: 1.6, items: 1, what: 'Elige un tema con licencia que acompañe el ritmo.', output: ['Tema de 92 BPM'] },
      { id: 'r5', kind: 'action', title: 'Montar el reel', subtitle: 'Plantilla de la marca', icon: 'film', col: 3, lane: 1, secs: 3.2, items: 1, what: 'Monta fotos, voz y música con la plantilla de la inmobiliaria.', output: ['Reel 9:16 de 20 s'] },
      { id: 'r6', kind: 'action', title: 'Subtítulos', subtitle: 'Automáticos', icon: 'captions', col: 4, lane: 1, secs: 1.8, items: 1, what: 'Agrega subtítulos grandes para ver sin sonido.', output: ['42 palabras subtituladas'] },
      { id: 'r7', kind: 'handoff', title: 'Mandar a revisar', subtitle: 'A Mora', icon: 'send', col: 5, lane: 1, secs: 1.2, items: 1, what: 'Se lo pasa a Mora, que lo manda a una persona para aprobar.', output: ['Reel listo para revisar'] },
    ],
    edges: [
      { from: 'r1', to: 'r2' }, { from: 'r2', to: 'r3' }, { from: 'r2', to: 'r4' },
      { from: 'r3', to: 'r5' }, { from: 'r4', to: 'r5' }, ...chain(['r5', 'r6', 'r7']),
    ],
  },
  {
    id: 'leo',
    name: 'Leo',
    role: 'Atención de consultas',
    color: '#00B39A',
    soft: '#D2F5EE',
    model: 'character-male-a',
    avatar: '/avatars/face-character-male-a.png',
    mission: 'Contesta las consultas al toque, ofrece propiedades parecidas y agenda visitas.',
    handoffTo: 'nina',
    handoffText: 'le avisó a Nina de una reserva con seña',
    selfStart: 9,
    savedMinutes: 15,
    runsWeek: 148,
    steps: [
      { id: 'e1', kind: 'trigger', title: 'Consulta nueva', subtitle: 'WhatsApp o portal', icon: 'whatsapp', col: 0, lane: 0, secs: 1.2, items: 1, what: 'Se activa cada vez que entra una consulta, a cualquier hora.', output: ['Hola, ¿sigue disponible el 2 amb. de Palermo?'] },
      { id: 'e2', kind: 'ai', title: 'Entender qué busca', subtitle: 'Agente con Claude', icon: 'claude', col: 1, lane: 0, secs: 2.4, items: 1, what: 'Lee el mensaje y saca zona, ambientes, presupuesto y urgencia.', output: ['Zona: Palermo', '2 ambientes', 'Hasta USD 140.000', 'Quiere visitar esta semana'] },
      { id: 'e3', kind: 'action', title: 'Buscar parecidas', subtitle: 'Cartera de propiedades', icon: 'search', col: 2, lane: 0, secs: 2, items: 3, what: 'Busca en la cartera las propiedades que mejor coinciden.', output: ['2 amb. Palermo Hollywood', '2 amb. Palermo Soho', '2 amb. Colegiales'] },
      { id: 'e4', kind: 'action', title: 'Responder', subtitle: 'WhatsApp', icon: 'whatsapp', col: 3, lane: 0, secs: 1.8, items: 1, what: 'Le contesta con las opciones y fotos en menos de un minuto.', output: ['Respuesta enviada en 40 s'] },
      { id: 'e5', kind: 'action', title: 'Agendar visita', subtitle: 'Google Calendar', icon: 'calendar', col: 4, lane: 0, secs: 1.8, items: 1, what: 'Le ofrece horarios libres del agente y deja la visita en la agenda.', output: ['Jueves 17:00 con un agente del equipo'] },
      { id: 'e6', kind: 'handoff', title: 'Avisar a Nina', subtitle: 'Seña a registrar', icon: 'send', col: 5, lane: 0, secs: 1.2, items: 1, what: 'Si hay reserva, le avisa a finanzas para registrar la seña.', output: ['Aviso entregado a Nina'] },
    ],
    edges: chain(['e1', 'e2', 'e3', 'e4', 'e5', 'e6']),
  },
  {
    id: 'nina',
    name: 'Nina',
    role: 'Finanzas',
    color: '#5BBE2E',
    soft: '#E3F5D6',
    model: 'character-female-e',
    avatar: '/avatars/face-character-female-e.png',
    mission: 'Ordena cobros y gastos todos los días y avisa si algo no cierra.',
    handoffTo: 'mora',
    handoffText: 'le pasó a Mora el cierre de caja del día',
    savedMinutes: 60,
    runsWeek: 12,
    steps: [
      { id: 'n1', kind: 'trigger', title: 'Aviso o cierre', subtitle: 'Todos los días 19:00', icon: 'clock', col: 0, lane: 1, secs: 1.2, items: 1, what: 'Arranca a la tarde o cuando Leo le avisa de una seña.', output: ['Cierre del día'] },
      { id: 'n2', kind: 'action', title: 'Leer cobros', subtitle: 'Planilla de comisiones', icon: 'sheets', col: 1, lane: 0, secs: 2, items: 9, what: 'Lee las comisiones y señas cobradas.', output: ['9 cobros', '2 señas nuevas'] },
      { id: 'n3', kind: 'action', title: 'Leer facturas', subtitle: 'Gmail', icon: 'gmail', col: 1, lane: 2, secs: 2, items: 7, what: 'Busca facturas y gastos que llegaron por mail.', output: ['7 facturas', '1 vencimiento mañana'] },
      { id: 'n4', kind: 'action', title: 'Conciliar', subtitle: 'Cruce de datos', icon: 'calc', col: 2, lane: 1, secs: 2.4, items: 16, what: 'Cruza lo cobrado con lo pagado y lo que falta.', output: ['16 movimientos cruzados', 'Todo cierra salvo 1 transferencia'] },
      { id: 'n5', kind: 'ai', title: 'Detectar alertas', subtitle: 'Agente con Claude', icon: 'claude', col: 3, lane: 1, secs: 2.6, items: 2, what: 'Marca lo raro: pagos duplicados, cobros atrasados, gastos que crecen.', output: ['Transferencia sin comprobante', 'Gasto en publicidad subió 18%'] },
      { id: 'n6', kind: 'action', title: 'Reporte de caja', subtitle: 'WhatsApp al dueño', icon: 'whatsapp', col: 4, lane: 1, secs: 1.6, items: 1, what: 'Le manda al dueño un resumen de 5 líneas con lo importante.', output: ['Resumen enviado'] },
      { id: 'n7', kind: 'handoff', title: 'Pasarle a Mora', subtitle: 'Cierre del día', icon: 'send', col: 5, lane: 1, secs: 1.2, items: 1, what: 'Le deja el cierre a Mora para el resumen general.', output: ['Cierre entregado a Mora'] },
    ],
    edges: [
      { from: 'n1', to: 'n2' }, { from: 'n1', to: 'n3' }, { from: 'n2', to: 'n4' }, { from: 'n3', to: 'n4' },
      ...chain(['n4', 'n5', 'n6', 'n7']),
    ],
  },
]

export const AGENT_BY_ID = Object.fromEntries(AGENTS.map((a) => [a.id, a])) as Record<string, Agent>
