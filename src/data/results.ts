// Lo último que produjo cada agente: el resultado concreto de su trabajo (datos simulados).
const P = (n: number) => `/img/prop${n}.jpg`

export type Result =
  | { kind: 'post'; img: string; title: string; text: string; meta: string }
  | { kind: 'video'; img: string; title: string; meta: string }
  | { kind: 'gallery'; imgs: string[]; title: string; meta: string }
  | { kind: 'chat'; with: string; msgs: { me: boolean; text: string }[] }
  | { kind: 'doc'; title: string; lines: string[] }
  | { kind: 'stats'; title: string; items: { label: string; value: string }[] }

export const RESULTS: Record<string, Result> = {
  mora: { kind: 'doc', title: 'Plan del día', lines: ['Marketing: 3 publicaciones', 'Ventas: 2 consultas calientes', 'Finanzas: cierre de caja 19:00', 'Urgente: vence un contrato hoy'] },
  tomi: { kind: 'stats', title: 'Tablero de la semana', items: [{ label: 'Consultas', value: '+18%' }, { label: 'Visitas', value: '19' }, { label: 'Reservas', value: '2' }, { label: 'Seguidores', value: '+312' }] },
  sol: { kind: 'doc', title: 'Control del reel PH Villa Crespo', lines: ['Logo y colores de la marca', 'Precio igual a la ficha', 'Subtítulos legibles', 'Aprobado para publicar'] },
  lupa: { kind: 'doc', title: 'Informe de competencia, semana 43', lines: ['Funcionan los recorridos de 20 s', 'Precio en el primer segundo', 'Terrazas al atardecer', 'Palermo: 2 amb. bajó 3%'] },
  cata: { kind: 'post', img: P(4), title: 'Tu terraza en Villa Crespo', text: 'PH de 3 ambientes reciclado, con terraza propia y parrilla. A dos cuadras del subte B.', meta: 'Programado jueves 19:30' },
  rolo: { kind: 'video', img: P(1), title: 'Reel PH Villa Crespo', meta: '20 s, voz en off y subtítulos' },
  fran: { kind: 'stats', title: 'Campaña 2 amb. Palermo', items: [{ label: 'Alcance', value: '14.200' }, { label: 'Consultas', value: '27' }, { label: 'Clics', value: '3,1%' }, { label: 'Mejor versión', value: 'B' }] },
  mica: { kind: 'gallery', imgs: [P(2), P(6), P(4), P(5)], title: '14 fotos editadas', meta: 'Más recorrido 360° de 6 ambientes' },
  nina: { kind: 'stats', title: 'Cierre de caja de hoy', items: [{ label: 'Cobros', value: '9' }, { label: 'Facturas', value: '7' }, { label: 'Cierran', value: '15 de 16' }, { label: 'Alertas', value: '2' }] },
  teo: { kind: 'stats', title: 'Alquileres del mes', items: [{ label: 'Avisos', value: '12' }, { label: 'Pagados', value: '9' }, { label: 'Atrasados', value: '3' }, { label: 'Al día', value: '92%' }] },
  gaby: { kind: 'doc', title: 'Factura B por comisión', lines: ['Reserva 2 amb. Palermo', 'Enviada por mail 18:42', 'Registrada en la caja', '26 facturas esta semana'] },
  juli: { kind: 'chat', with: 'Interesado', msgs: [{ me: false, text: '¿Puedo ver el depto esta semana?' }, { me: true, text: 'Claro. Tengo jueves 17:00 o viernes 11:00. ¿Cuál te queda mejor?' }, { me: false, text: 'Jueves 17' }, { me: true, text: 'Listo, te espero. Te mando la ubicación.' }] },
  paz: { kind: 'doc', title: 'Borrador de reserva', lines: ['Oferta: USD 132.000', 'Seña: USD 5.000', 'Falta: informe de dominio', 'Revisa: el martillero'] },
  lucas: { kind: 'chat', with: 'Inquilino', msgs: [{ me: false, text: 'La canilla de la cocina pierde desde ayer.' }, { me: true, text: 'Gracias por avisar. Va el plomero el jueves a las 10. ¿Hay alguien para abrir?' }, { me: false, text: 'Sí, va a estar mi pareja.' }, { me: true, text: 'Perfecto, queda confirmado.' }] },
  ana: { kind: 'doc', title: 'Publicado en 3 lugares', lines: ['Portal 1: publicado', 'Portal 2: publicado', 'Web propia: publicado', 'Ficha de 140 palabras'] },
  leo: { kind: 'chat', with: 'Consulta por WhatsApp', msgs: [{ me: false, text: 'Hola, ¿sigue disponible el 2 amb. de Palermo?' }, { me: true, text: 'Hola, sí. Te paso también 3 parecidos: Palermo Hollywood, Soho y Colegiales.' }, { me: false, text: 'Me interesa el primero, ¿se puede ver?' }] },
  vale: { kind: 'chat', with: 'Después de la visita', msgs: [{ me: true, text: '¿Qué te pareció el depto de ayer?' }, { me: false, text: 'Me gustó mucho. Quiero ofertar 132.000.' }, { me: true, text: 'Buenísimo, lo paso para armar la reserva.' }] },
  martin: { kind: 'stats', title: 'Tasación 3 amb. Colegiales', items: [{ label: 'Valor sugerido', value: 'USD 162k' }, { label: 'Rango', value: '158k a 167k' }, { label: 'Comparables', value: '12' }, { label: 'Por m²', value: 'USD 2.250' }] },
  caro: { kind: 'chat', with: 'Dueño que quiere vender', msgs: [{ me: false, text: 'Quiero vender mi 3 ambientes en Colegiales.' }, { me: true, text: 'Genial. Vendimos 4 parecidos este año en la zona. ¿Lo vamos a ver el martes a las 11?' }, { me: false, text: 'Dale.' }] },
}
