// Tomas del video "24 horas en mi empresa" (VIDS orik-07-24-horas). keys: [[posición], [mira a]] por punto.
// Pisos (y del piso): direccion 9.95, marketing 7.55, finanzas 5.15, administracion 2.75, ventas 0.35.
// Cada agente se sienta en (x, z - 0.6) de su escritorio y mira hacia +z; la cabeza queda a ~0.6 del piso.
// Los nombres del video son inventados: cada toma usa un escritorio de la demo con otra luz (?hora=).
const edificio = [[[27, 17, 31], [0, 6.4, 0]], [[19, 12.5, 24], [0, 6.2, 0]]]
export const SHOTS = [
  // el edificio con la misma cámara en las cuatro luces: fundidas dan el día entero
  { n: 'e_noche', q: 'hora=noche', dur: 4, curva: 'lineal', keys: edificio },
  { n: 'e_amanecer', q: 'hora=amanecer', dur: 4, curva: 'lineal', keys: edificio },
  { n: 'e_dia', q: 'hora=dia', dur: 4, curva: 'lineal', keys: edificio },
  { n: 'e_atardecer', q: 'hora=atardecer', dur: 4, curva: 'lineal', keys: edificio },
  // el mismo recorrido de noche, más largo: al revés es el cierre (termina en el primer cuadro del video)
  { n: 'e_noche_largo', q: 'hora=noche', dur: 6.4, curva: 'lineal', keys: edificio },
  // Los personajes quedan arriba a la derecha del cuadro (la cámara apunta más abajo): abajo va la tarjeta.
  // 02:00 Mora, atención (escritorio de Cata, marketing)
  { n: 'mora', q: 'hora=madrugada&piso=marketing', dur: 3.9, keys: [[[1.75, 8.85, 0.25], [0, 7.8, -1.5]], [[1.45, 8.72, -0.05], [0, 7.8, -1.5]]] },
  // 05:00 Beto, depósito (escritorio de Teo, finanzas). En el video va espejada.
  { n: 'beto', q: 'hora=madrugada&piso=finanzas', dur: 4.4, keys: [[[3.75, 6.4, -0.25], [1.4, 5.34, -1.8]], [[3.45, 6.28, -0.55], [1.4, 5.34, -1.8]]] },
  // 08:00 Paz, cobranzas (administración)
  { n: 'paz', q: 'hora=amanecer&piso=administracion', dur: 4.4, keys: [[[-0.95, 3.8, -0.45], [1.4, 2.96, -1.9]], [[-0.7, 3.72, -0.7], [1.4, 2.96, -1.9]]] },
  // 11:00 llego yo: el edificio de día, de cerca y bajando
  { n: 'llego', q: 'hora=dia', dur: 3.4, keys: [[[13, 12.5, 17], [0, 7.4, 0]], [[11.5, 10.6, 15.2], [0, 6.6, 0]]] },
  // 15:00 Vera, compras (escritorio de Vale, ventas). En el video va espejada.
  { n: 'vera', q: 'hora=dia&piso=ventas', dur: 4.8, keys: [[[-0.35, 1.65, 0.25], [1.4, 0.6, -1.5]], [[-0.05, 1.52, -0.05], [1.4, 0.6, -1.5]]] },
  // 19:00 Bruno, dirección (queda a la derecha: la tarjeta va abajo a la izquierda)
  { n: 'bruno', q: 'hora=atardecer&piso=direccion', dur: 4.4, keys: [[[5.0, 11.75, 2.3], [2.99, 10.3, 0.09]], [[4.55, 11.5, 1.85], [2.99, 10.3, 0.09]]] },
]
