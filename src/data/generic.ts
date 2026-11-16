// Empresa genérica de la vidriera de oficinas (/v1, /v2…): 8 áreas, 40 agentes. Solo para mostrar, datos inventados.
import type { Agent, FloorId, FlowEdge, FlowStep, IconKey, NodeKind, Preview, Sub } from './agents'
import type { Result } from './results'

const HAIKU: Sub = { kind: 'model', label: 'Claude Haiku', icon: 'claude' }
const MEM: Sub = { kind: 'memory', label: 'Memoria del equipo', icon: 'database' }
const SECS: Record<NodeKind, number> = { trigger: 1.2, action: 2, ai: 3, if: 0.9, handoff: 1.2 }

/** áreas: tower 0 es la torre de la izquierda del edificio, n el piso dentro de su torre */
export const GENERIC_FLOORS: { id: FloorId; name: string; n: number; tint: string; tower: number }[] = [
  { id: 'direccion', name: 'Dirección', n: 4, tint: '#2E7DFF', tower: 0 },
  { id: 'marketing', name: 'Marketing', n: 3, tint: '#FF3D9A', tower: 0 },
  { id: 'ventas', name: 'Ventas', n: 2, tint: '#00A991', tower: 0 },
  { id: 'atencion', name: 'Atención al cliente', n: 1, tint: '#FF7A00', tower: 0 },
  { id: 'producto', name: 'Producto', n: 4, tint: '#8A5CF6', tower: 1 },
  { id: 'operaciones', name: 'Operaciones', n: 3, tint: '#E5484D', tower: 1 },
  { id: 'finanzas', name: 'Finanzas', n: 2, tint: '#3DAE2B', tower: 1 },
  { id: 'personas', name: 'Personas', n: 1, tint: '#E8A80C', tower: 1 },
]

export const GENERIC_COMPANY = 'Empresa de servicios con 40 agentes de IA repartidos en 8 áreas: dirección, marketing, ventas, atención al cliente, producto, operaciones, finanzas y personas'

/** un paso: [tipo, título, dónde, ícono, resultado, número destacado (valor, etiqueta)] */
type St = [NodeKind, string, string, IconKey, string, [string, string]?]
/** un agente: [id, nombre, rol, qué hace, qué entrega al terminar, pasos] */
type Ag = [string, string, string, string, string, St[]]

const AREAS: Record<string, Ag[]> = {
  direccion: [
    ['valen', 'Valentina', 'Coordinación general', 'Ordena las prioridades del día y reparte el trabajo entre las áreas.', 'el plan del día', [
      ['trigger', 'Arranca el día', 'Todos los días 8:00', 'clock', 'Turno abierto'],
      ['action', 'Leer pendientes', 'Tablero de tareas', 'list', '42 pendientes'],
      ['ai', 'Priorizar', 'Agente de IA', 'brain', '8 urgentes para hoy'],
      ['action', 'Publicar el plan', 'Grupo del equipo', 'whatsapp', 'Plan publicado 8:06'],
    ]],
    ['agus', 'Agustín', 'Tablero de resultados', 'Junta los números de todas las áreas en un tablero para la dirección.', 'el tablero semanal', [
      ['trigger', 'Cada lunes', 'Semana 46', 'clock', 'Semana cerrada'],
      ['action', 'Juntar datos', 'Planillas de las áreas', 'sheets', '8 áreas al día'],
      ['ai', 'Sacar conclusiones', 'Agente de IA', 'brain', 'Ventas 12% arriba', ['+12%', 'ventas']],
      ['action', 'Armar el tablero', 'Documento compartido', 'docs', 'Tablero listo'],
    ]],
    ['juli', 'Julieta', 'Agenda y reuniones', 'Organiza las reuniones, toma nota y sigue cada acuerdo.', 'la minuta de la reunión', [
      ['trigger', 'Reunión agendada', 'Calendario', 'calendar', 'Martes 10:00'],
      ['ai', 'Preparar temario', 'Agente de IA', 'brain', '5 temas'],
      ['action', 'Grabar y transcribir', 'Audio de la reunión', 'mic', '42 min transcriptos'],
      ['ai', 'Escribir la minuta', 'Agente de IA', 'brain', '6 acuerdos con responsable'],
    ]],
    ['nico', 'Nicolás', 'Estrategia', 'Mira el mercado y propone hacia dónde crecer.', 'el informe de mercado', [
      ['trigger', 'Cada mes', 'Noviembre', 'clock', 'Mes nuevo'],
      ['action', 'Buscar tendencias', 'Web y noticias', 'search', '64 fuentes'],
      ['ai', 'Comparar competidores', 'Agente de IA', 'brain', '3 oportunidades'],
      ['action', 'Escribir el informe', 'Documento compartido', 'docs', 'Informe de 4 páginas'],
    ]],
    ['sofi', 'Sofía', 'Calidad', 'Revisa que todo lo que sale de la empresa cumpla el estándar.', 'el control de calidad', [
      ['trigger', 'Entrega nueva', 'Bandeja de revisión', 'inbox', '6 entregas'],
      ['ai', 'Revisar', 'Agente de IA', 'brain', '5 de 6 aprobadas', ['96%', 'aprobado']],
      ['if', '¿Cumple?', 'Estándar de la marca', 'split', 'Una vuelve con cambios'],
      ['action', 'Aprobar', 'Tablero de tareas', 'check', 'Aprobado'],
    ]],
  ],
  marketing: [
    ['cami', 'Camila', 'Redes sociales', 'Escribe, diseña y programa lo que se publica en redes.', 'los posteos de la semana', [
      ['trigger', 'Calendario de contenidos', 'Semana 46', 'calendar', '9 publicaciones'],
      ['ai', 'Escribir posteos', 'Agente de IA', 'brain', '3 posteos nuevos'],
      ['action', 'Diseñar placas', 'Plantillas de la marca', 'image', '5 placas'],
      ['action', 'Programar', 'Instagram', 'instagram', 'Martes 19:00'],
    ]],
    ['tomas', 'Tomás', 'Videos y reels', 'Arma los reels: guion, voz, edición y subtítulos.', 'el reel terminado', [
      ['trigger', 'Idea aprobada', 'Bandeja de ideas', 'inbox', 'Idea del día'],
      ['ai', 'Escribir el guion', 'Agente de IA', 'brain', 'Guion de 20 s'],
      ['action', 'Grabar la voz', 'Voz con IA', 'elevenlabs', 'Voz en off lista'],
      ['action', 'Editar', 'Editor de video', 'film', 'Reel vertical de 20 s'],
    ]],
    ['lucia', 'Lucía', 'Anuncios', 'Lanza campañas pagas y deja prendidas solo las que funcionan.', 'los resultados de la campaña', [
      ['trigger', 'Producto destacado', 'Pedido de ventas', 'inbox', 'Campaña nueva'],
      ['ai', 'Armar versiones', 'Agente de IA', 'brain', '3 versiones del anuncio'],
      ['action', 'Lanzar campaña', 'Meta', 'meta', 'Campaña al aire'],
      ['action', 'Medir', 'Panel de anuncios', 'chart', 'Gana la versión B', ['3,4%', 'clics']],
    ]],
    ['fran', 'Francisco', 'Newsletter', 'Escribe el mail semanal y lo manda a cada grupo de clientes.', 'el newsletter', [
      ['trigger', 'Los viernes', '9:00', 'clock', 'Edición 46'],
      ['ai', 'Redactar', 'Agente de IA', 'brain', 'Mail de 300 palabras'],
      ['action', 'Separar grupos', 'Base de clientes', 'filter', '4 grupos'],
      ['action', 'Enviar', 'Mail', 'gmail', '2.400 mails', ['38%', 'apertura']],
    ]],
    ['marti', 'Martina', 'Marca y diseño', 'Cuida la marca y diseña todas las piezas que pide la empresa.', 'las piezas de marca', [
      ['trigger', 'Pedido de diseño', 'Bandeja de pedidos', 'inbox', '4 pedidos'],
      ['ai', 'Proponer bocetos', 'Agente de IA', 'brain', '3 bocetos'],
      ['action', 'Diseñar', 'Herramienta de diseño', 'pen', 'Diseño final'],
      ['action', 'Exportar', 'Carpeta de marca', 'layers', '12 archivos'],
    ]],
  ],
  ventas: [
    ['leo', 'Leandro', 'Prospección', 'Busca empresas que podrían comprar y las califica.', 'los contactos calificados', [
      ['trigger', 'Lista nueva', 'Rubro del mes', 'list', 'Rubro elegido'],
      ['action', 'Buscar contactos', 'Web y directorios', 'search', '120 empresas'],
      ['ai', 'Calificar', 'Agente de IA', 'brain', '18 con interés alto', ['18', 'calientes']],
      ['action', 'Primer mensaje', 'Mail', 'gmail', '18 mails enviados'],
    ]],
    ['rocio', 'Rocío', 'Primer contacto', 'Responde al toque cada consulta nueva y agenda la llamada.', 'la llamada agendada', [
      ['trigger', 'Consulta nueva', 'WhatsApp', 'whatsapp', 'Consulta de 9:12'],
      ['ai', 'Entender qué busca', 'Agente de IA', 'brain', 'Necesita 3 usuarios'],
      ['action', 'Responder', 'WhatsApp', 'whatsapp', 'Respuesta en 1 min'],
      ['action', 'Agendar llamada', 'Calendario', 'calendar', 'Jueves 11:00'],
    ]],
    ['seba', 'Sebastián', 'Propuestas', 'Arma la propuesta con precio y se la manda al cliente.', 'la propuesta', [
      ['trigger', 'Llamada hecha', 'Notas de la llamada', 'phone', 'Llamada de 25 min'],
      ['ai', 'Armar propuesta', 'Agente de IA', 'brain', 'Propuesta de 3 páginas'],
      ['action', 'Calcular precio', 'Lista de precios', 'calc', 'Precio con 10% de descuento', ['$ 1,8 M', 'propuesta']],
      ['action', 'Enviar', 'PDF por mail', 'file', 'Propuesta enviada'],
    ]],
    ['caro', 'Carolina', 'Seguimiento', 'Sigue cada propuesta hasta que el cliente decide.', 'la venta cerrada', [
      ['trigger', 'Propuesta enviada', 'Hace 3 días', 'send', 'Sin respuesta'],
      ['action', 'Recordatorio', 'WhatsApp', 'bell', 'Recordatorio amable'],
      ['ai', 'Leer la respuesta', 'Agente de IA', 'brain', 'Quiere avanzar'],
      ['if', '¿Aceptó?', 'Respuesta del cliente', 'split', 'Sí, aceptó'],
    ]],
    ['pedro', 'Pedro', 'Pronóstico de ventas', 'Mantiene al día el registro de clientes y calcula cuánto se va a vender.', 'el pronóstico de ventas', [
      ['trigger', 'Fin del día', '19:00', 'clock', 'Día cerrado'],
      ['action', 'Actualizar registro', 'Base de clientes', 'database', '34 cambios'],
      ['ai', 'Pronosticar', 'Agente de IA', 'brain', 'Mes 8% arriba', ['$ 4,2 M', 'este mes']],
      ['action', 'Armar gráfico', 'Tablero', 'chart', 'Gráfico al día'],
    ]],
  ],
  atencion: [
    ['ana', 'Ana', 'Mensajes', 'Contesta todos los mensajes de clientes en minutos.', 'los casos del día', [
      ['trigger', 'Mensaje nuevo', 'WhatsApp e Instagram', 'inbox', '58 mensajes hoy'],
      ['ai', 'Entender el pedido', 'Agente de IA', 'brain', 'Consulta de envío'],
      ['action', 'Responder', 'WhatsApp', 'whatsapp', 'Respuesta en 1 min', ['1 min', 'respuesta']],
      ['action', 'Etiquetar', 'Registro de casos', 'list', 'Caso cerrado'],
    ]],
    ['mati', 'Matías', 'Reclamos', 'Resuelve los reclamos y le avisa al cliente cómo sigue.', 'el reclamo resuelto', [
      ['trigger', 'Reclamo', 'Formulario', 'bell', 'Reclamo de 10:40'],
      ['ai', 'Clasificar', 'Agente de IA', 'brain', 'Producto con falla'],
      ['action', 'Buscar solución', 'Política de cambios', 'shield', 'Cambio sin cargo'],
      ['action', 'Avisar al cliente', 'Llamada', 'phone', 'Cliente avisado'],
    ]],
    ['pau', 'Paula', 'Encuestas', 'Pregunta a cada cliente cómo le fue y junta reseñas.', 'las reseñas', [
      ['trigger', 'Pedido entregado', 'Ayer', 'check', '32 entregas'],
      ['action', 'Enviar encuesta', 'Mail', 'send', '32 encuestas'],
      ['ai', 'Leer respuestas', 'Agente de IA', 'brain', '27 conformes', ['4,8', 'satisfacción']],
      ['action', 'Pedir reseña', 'Google', 'globe', '11 reseñas nuevas'],
    ]],
    ['gonza', 'Gonzalo', 'Centro de ayuda', 'Convierte las preguntas repetidas en artículos de ayuda.', 'el artículo de ayuda', [
      ['trigger', 'Pregunta repetida', 'Casos de la semana', 'repeat', 'Pregunta 14 veces'],
      ['ai', 'Escribir artículo', 'Agente de IA', 'brain', 'Artículo de 400 palabras'],
      ['action', 'Publicar', 'Centro de ayuda', 'globe', 'Publicado'],
      ['action', 'Avisar al equipo', 'Grupo del equipo', 'send', 'Equipo avisado'],
    ]],
    ['flor', 'Florencia', 'Turnos', 'Da turnos, confirma y manda recordatorios.', 'los turnos confirmados', [
      ['trigger', 'Pedido de turno', 'Web y WhatsApp', 'calendar', '9 pedidos'],
      ['ai', 'Buscar horario', 'Agente de IA', 'brain', 'Jueves 15:30'],
      ['action', 'Confirmar', 'WhatsApp', 'whatsapp', 'Turno confirmado'],
      ['action', 'Recordatorio', 'Un día antes', 'bell', 'Recordatorio programado', ['96%', 'asistencia']],
    ]],
  ],
  producto: [
    ['ines', 'Inés', 'Investigación', 'Escucha a los usuarios y encuentra qué les falta.', 'los hallazgos de la semana', [
      ['trigger', 'Opiniones nuevas', 'Encuestas y mensajes', 'inbox', '140 opiniones'],
      ['ai', 'Agrupar temas', 'Agente de IA', 'brain', '5 temas repetidos'],
      ['action', 'Entrevistas', 'Videollamadas', 'mic', '4 entrevistas'],
      ['action', 'Informe', 'Documento compartido', 'docs', 'Hallazgos listos'],
    ]],
    ['bauti', 'Bautista', 'Hoja de ruta', 'Ordena qué se construye primero y lo comparte con todos.', 'la hoja de ruta', [
      ['trigger', 'Cada dos semanas', 'Planificación', 'calendar', 'Ciclo 23'],
      ['ai', 'Priorizar ideas', 'Agente de IA', 'brain', '6 ideas elegidas'],
      ['action', 'Actualizar la hoja de ruta', 'Tablero', 'list', 'Hoja de ruta al día'],
      ['action', 'Compartir', 'Grupo del equipo', 'send', 'Compartida'],
    ]],
    ['malena', 'Malena', 'Diseño de pantallas', 'Diseña cómo se ven y se usan las pantallas nuevas.', 'el prototipo', [
      ['trigger', 'Idea elegida', 'Hoja de ruta', 'inbox', 'Pantalla de pagos'],
      ['action', 'Bocetos', 'Herramienta de diseño', 'pen', '3 bocetos'],
      ['ai', 'Revisar que se entienda', 'Agente de IA', 'brain', '2 mejoras'],
      ['action', 'Prototipo', 'Herramienta de diseño', 'layers', 'Prototipo navegable'],
    ]],
    ['santi', 'Santiago', 'Pruebas', 'Prueba cada versión nueva antes de que salga.', 'el reporte de pruebas', [
      ['trigger', 'Versión nueva', 'Versión 4.2', 'layers', 'Lista para probar'],
      ['action', 'Pruebas automáticas', 'Banco de pruebas', 'check', '214 pruebas', ['214', 'pruebas']],
      ['ai', 'Revisar errores', 'Agente de IA', 'brain', '2 errores menores'],
      ['action', 'Reporte', 'Documento compartido', 'file', 'Reporte enviado'],
    ]],
    ['abril', 'Abril', 'Lanzamientos', 'Saca las versiones nuevas y les cuenta a los clientes qué cambió.', 'el lanzamiento', [
      ['trigger', 'Versión aprobada', 'Versión 4.2', 'check', 'Aprobada'],
      ['ai', 'Notas de la versión', 'Agente de IA', 'brain', '5 novedades'],
      ['action', 'Publicar', 'Web', 'globe', 'Versión publicada'],
      ['action', 'Avisar a clientes', 'Mail', 'gmail', '1.200 mails'],
    ]],
  ],
  operaciones: [
    ['lucho', 'Luciano', 'Pedidos', 'Recibe cada pedido, lo controla y lo deja listo.', 'los pedidos listos', [
      ['trigger', 'Pedido nuevo', 'Tienda y ventas', 'inbox', '36 pedidos'],
      ['action', 'Validar', 'Stock y pago', 'check', '36 validados'],
      ['action', 'Preparar', 'Depósito', 'layers', 'Pedidos armados', ['36', 'pedidos hoy']],
      ['action', 'Etiquetar', 'Impresora', 'file', '36 etiquetas'],
    ]],
    ['vicky', 'Victoria', 'Envíos', 'Elige el mejor envío para cada pedido y lo sigue hasta que llega.', 'los envíos del día', [
      ['trigger', 'Pedido listo', 'Depósito', 'check', '36 listos'],
      ['ai', 'Elegir el envío', 'Agente de IA', 'brain', '22 en moto, 14 por correo'],
      ['action', 'Despachar', 'Correos', 'route', 'Despachados'],
      ['action', 'Seguimiento', 'Mapa de envíos', 'map', 'Todo en camino'],
    ]],
    ['juan', 'Juan', 'Stock', 'Cuenta el stock todas las noches y avisa antes de que falte algo.', 'el pedido de compra', [
      ['trigger', 'Cada noche', '23:00', 'clock', 'Conteo nocturno'],
      ['action', 'Contar', 'Sistema de stock', 'database', '480 productos'],
      ['ai', 'Predecir faltantes', 'Agente de IA', 'brain', '3 por agotarse'],
      ['action', 'Pedido de compra', 'Compras', 'send', 'Pedido armado'],
    ]],
    ['mili', 'Milagros', 'Compras', 'Pide presupuestos, compara y confirma la mejor compra.', 'la compra confirmada', [
      ['trigger', 'Pedido de compra', 'Stock', 'inbox', '3 productos'],
      ['action', 'Pedir presupuestos', 'Mail', 'gmail', '3 presupuestos'],
      ['ai', 'Comparar', 'Agente de IA', 'brain', 'El más conveniente, 12% menos', ['12%', 'ahorro']],
      ['action', 'Confirmar', 'Proveedor', 'check', 'Compra confirmada'],
    ]],
    ['edu', 'Eduardo', 'Procesos', 'Mide cuánto tarda cada tarea y propone cómo hacerla mejor.', 'la mejora propuesta', [
      ['trigger', 'Cada semana', 'Lunes', 'clock', 'Semana 46'],
      ['action', 'Medir tiempos', 'Registro de tareas', 'chart', '18 procesos'],
      ['ai', 'Detectar demoras', 'Agente de IA', 'brain', '2 cuellos de botella'],
      ['action', 'Proponer mejora', 'Documento compartido', 'docs', 'Mejora propuesta'],
    ]],
  ],
  finanzas: [
    ['nati', 'Natalia', 'Cobranzas', 'Avisa los vencimientos y sigue cada cobro hasta que entra.', 'los cobros del día', [
      ['trigger', 'Vencimientos', 'Esta semana', 'clock', '24 vencimientos'],
      ['action', 'Avisos', 'WhatsApp', 'whatsapp', '24 avisos'],
      ['action', 'Leer pagos', 'Banco', 'wallet', '22 pagos', ['92%', 'cobrado']],
      ['ai', 'Revisar atrasos', 'Agente de IA', 'brain', '2 con atraso'],
    ]],
    ['fede', 'Federico', 'Facturación', 'Hace la factura de cada venta y la manda.', 'las facturas', [
      ['trigger', 'Venta cerrada', 'Ventas', 'check', '14 ventas'],
      ['action', 'Emitir factura', 'Sistema de facturas', 'file', '14 facturas'],
      ['action', 'Enviar', 'Mail', 'gmail', 'Enviadas'],
      ['action', 'Registrar', 'Planilla de ingresos', 'sheets', 'Registradas'],
    ]],
    ['meli', 'Melina', 'Pagos', 'Controla las facturas de proveedores y programa los pagos.', 'los pagos programados', [
      ['trigger', 'Factura recibida', 'Mail de proveedores', 'inbox', '9 facturas'],
      ['ai', 'Controlar', 'Agente de IA', 'brain', '9 correctas'],
      ['action', 'Programar pago', 'Banco', 'wallet', 'Viernes 10:00'],
      ['action', 'Avisar', 'Mail', 'gmail', 'Proveedores avisados'],
    ]],
    ['dami', 'Damián', 'Caja y bancos', 'Cierra la caja todos los días y concilia los bancos.', 'el cierre de caja', [
      ['trigger', 'Cierre del día', '19:00', 'clock', 'Día cerrado'],
      ['action', 'Bajar movimientos', 'Bancos', 'wallet', '148 movimientos'],
      ['ai', 'Conciliar', 'Agente de IA', 'brain', 'Todo concilia', ['148', 'movimientos']],
      ['action', 'Reporte', 'Planilla de caja', 'sheets', 'Caja cerrada'],
    ]],
    ['rena', 'Renata', 'Presupuesto', 'Compara lo que se gasta con lo planeado y avisa si algo se pasa.', 'el control de presupuesto', [
      ['trigger', 'Inicio de mes', 'Noviembre', 'calendar', 'Mes nuevo'],
      ['action', 'Juntar gastos', 'Planillas', 'sheets', '62 gastos'],
      ['ai', 'Comparar con lo planeado', 'Agente de IA', 'brain', '2 rubros pasados', ['97%', 'del plan']],
      ['action', 'Alertas', 'Dirección', 'bell', 'Alerta enviada'],
    ]],
  ],
  personas: [
    ['clara', 'Clara', 'Búsquedas', 'Publica las búsquedas, filtra currículums y agenda entrevistas.', 'la terna de candidatos', [
      ['trigger', 'Puesto abierto', 'Diseño', 'user', 'Búsqueda nueva'],
      ['action', 'Publicar aviso', 'Portales de empleo', 'globe', '180 postulantes'],
      ['ai', 'Filtrar', 'Agente de IA', 'brain', '12 elegidos', ['12', 'de 180']],
      ['action', 'Agendar entrevistas', 'Calendario', 'calendar', '6 entrevistas'],
    ]],
    ['ivo', 'Ivo', 'Incorporaciones', 'Prepara todo para que cada persona nueva arranque bien.', 'el plan de bienvenida', [
      ['trigger', 'Ingreso nuevo', 'Lunes', 'user', 'Ingresa Diego'],
      ['action', 'Dar accesos', 'Sistemas', 'key', '7 accesos'],
      ['action', 'Plan de 30 días', 'Documento compartido', 'docs', 'Plan listo'],
      ['action', 'Bienvenida', 'Grupo del equipo', 'send', 'Bienvenida enviada'],
    ]],
    ['lola', 'Lola', 'Capacitación', 'Arma cursos cortos y sigue quién los termina.', 'el curso del mes', [
      ['trigger', 'Cada mes', 'Noviembre', 'calendar', 'Tema elegido'],
      ['ai', 'Armar el curso', 'Agente de IA', 'brain', '6 lecciones'],
      ['action', 'Grabar videos', 'Editor de video', 'film', '6 videos'],
      ['action', 'Seguimiento', 'Tablero', 'chart', '81% terminado', ['81%', 'terminado']],
    ]],
    ['ramiro', 'Ramiro', 'Sueldos', 'Junta las novedades del mes y liquida los sueldos.', 'los recibos', [
      ['trigger', 'Fin de mes', 'Día 28', 'calendar', 'Liquidación'],
      ['action', 'Horas y novedades', 'Planillas', 'sheets', '40 personas'],
      ['action', 'Liquidar', 'Sistema de sueldos', 'calc', 'Liquidado'],
      ['action', 'Recibos', 'Mail', 'file', '40 recibos'],
    ]],
    ['pili', 'Pilar', 'Clima laboral', 'Pregunta cómo está el equipo y avisa si algo no anda.', 'el informe de clima', [
      ['trigger', 'Cada quincena', 'Viernes', 'clock', 'Encuesta nueva'],
      ['action', 'Encuesta', 'Mail', 'send', '38 respuestas'],
      ['ai', 'Leer respuestas', 'Agente de IA', 'brain', 'Buen clima', ['8,4', 'clima']],
      ['action', 'Informe', 'Documento compartido', 'docs', 'Informe listo'],
    ]],
  ],
}

const MODELS = ['character-female-a', 'character-male-a', 'character-female-b', 'character-male-b', 'character-female-c', 'character-male-c', 'character-female-d', 'character-male-d', 'character-female-e', 'character-female-f']

function mix(hex: string, to: string, k: number) {
  const a = parseInt(hex.slice(1), 16)
  const b = parseInt(to.slice(1), 16)
  const ch = (s: number) => Math.round(((a >> s) & 255) * (1 - k) + ((b >> s) & 255) * k)
  return '#' + ((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0').toUpperCase()
}

const ORDER = GENERIC_FLOORS.map((f) => f.id)
const LIST = ORDER.flatMap((fid) => AREAS[fid].map((a) => ({ fid, a })))

function build(): Agent[] {
  return LIST.map(({ fid, a }, i) => {
    const [id, name, role, mission, entrega, raw] = a
    const floor = GENERIC_FLOORS.find((f) => f.id === fid)!
    const k = AREAS[fid].findIndex((x) => x[0] === id)
    // dentro del área se pasan el trabajo en cadena; el último le pasa al primero de la próxima área
    const next = k < AREAS[fid].length - 1 ? AREAS[fid][k + 1] : AREAS[ORDER[(ORDER.indexOf(fid) + 1) % ORDER.length]][0]
    const color = mix(floor.tint, k % 2 ? '#000000' : '#FFFFFF', [0, 0.12, 0.18, 0.22, 0.28][k])
    const steps: FlowStep[] = raw.map(([kind, title, subtitle, icon, out, stat], col) => {
      const preview: Preview | undefined = stat ? { type: 'stat', value: stat[0], label: stat[1] } : undefined
      return {
        id: `${id}${col + 1}`, kind, title, subtitle, icon, col, lane: 1, what: `${title}: ${subtitle.toLowerCase()}.`, output: [out],
        secs: SECS[kind], items: 1, preview, subs: kind === 'ai' ? [HAIKU, MEM] : undefined,
      }
    })
    steps.push({
      id: `${id}h`, kind: 'handoff', title: `Pasarle a ${next[1]}`, subtitle: entrega[0].toUpperCase() + entrega.slice(1), icon: 'send', col: raw.length, lane: 1,
      what: `Le pasa ${entrega} a ${next[1]}.`, output: ['Entregado'], secs: SECS.handoff, items: 1,
    })
    const edges: FlowEdge[] = steps.slice(1).map((s, j) => ({ from: steps[j].id, to: s.id }))
    const cols = steps.length
    return {
      id, name, role, floor: fid, color, soft: mix(color, '#FFFFFF', 0.82), model: MODELS[i % MODELS.length],
      avatar: `/avatars/face-${MODELS[i % MODELS.length]}.png`, mission, steps, edges,
      sections: [
        { title: 'Recibir', from: 0, to: 0 },
        { title: 'Trabajar', from: 1, to: cols - 2 },
        { title: 'Entregar', from: cols - 1, to: cols - 1 },
      ],
      handoffTo: next[0], handoffText: `le pasó a ${next[1]} ${entrega}`,
      savedMinutes: 20 + ((i * 17) % 70), runsWeek: 12 + ((i * 23) % 90), cost: 0,
    }
  })
}

export const GENERIC_AGENTS = build()

/** lo último que hizo cada uno: un informe corto con lo que salió de cada paso */
export const GENERIC_RESULTS: Record<string, Result> = Object.fromEntries(
  GENERIC_AGENTS.map((a) => [a.id, { kind: 'doc', title: a.role, lines: a.steps.filter((s) => s.kind !== 'handoff').map((s) => s.output[0]) } as Result]),
)
