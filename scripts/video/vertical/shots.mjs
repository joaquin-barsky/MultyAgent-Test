// Tomas del video "Mi empresa tiene 20 empleados". keys: [[posición], [mira a]] por punto.
// Pisos (y del piso): direccion 9.95, marketing 7.55, finanzas 5.15, administracion 2.75, ventas 0.35.
// Cada agente se sienta en (x, z - 0.6) de su escritorio y mira hacia +z; la cabeza queda a ~0.6 del piso.
const N = 'hora=noche'
const reloj = [[[22, 13, 30], [0, 6.2, 0]], [[30, 13, 22], [0, 6.2, 0]]]
export const SHOTS = [
  { n: '01_vuelo_entrada', q: N, dur: 3.2, keys: [[[30, 34, 42], [0, 8, 0]], [[15, 10.5, 21], [0, 6.2, 0]]] },
  { n: '02_cara_cerca', q: `${N}&piso=marketing`, dur: 2.2, keys: [[[0.2, 8.9, 2.4], [-1.3, 8.2, 1.3]], [[-0.45, 8.55, 1.75], [-1.3, 8.2, 1.3]]] },
  { n: '03_paneo_marketing', q: `${N}&piso=marketing`, dur: 3.2, keys: [[[-3.6, 9.4, -3.7], [-1.6, 8.0, 1.5]], [[3.6, 9.4, -3.7], [1.6, 8.0, 1.5]]] },
  { n: '04_leo_costado', q: `${N}&piso=ventas`, dur: 3, keys: [[[0.45, 1.6, -1.2], [-1.4, 0.95, -1.6]], [[0.2, 1.55, -0.85], [-1.4, 0.95, -1.6]]] },
  { n: '05_leo_pantalla', q: `${N}&piso=ventas`, dur: 2.4, keys: [[[-0.8, 1.6, -2.95], [-1.4, 0.9, -0.9]], [[-1.05, 1.5, -2.6], [-1.4, 0.9, -0.9]]] },
  { n: '06_juli', q: `${N}&piso=administracion`, dur: 2.6, keys: [[[-3.25, 4.0, -1.2], [-1.4, 3.35, -1.6]], [[-3.0, 3.95, -0.85], [-1.4, 3.35, -1.6]]] },
  { n: '07_nina', q: `${N}&piso=finanzas`, dur: 3, keys: [[[-3.25, 6.4, -1.2], [-1.4, 5.75, -1.6]], [[-3.0, 6.35, -0.85], [-1.4, 5.75, -1.6]]] },
  { n: '08_lupa', q: `${N}&piso=marketing`, dur: 3, keys: [[[-2.0, 8.8, -2.95], [-2.6, 8.1, -0.9]], [[-2.25, 8.7, -2.6], [-2.6, 8.1, -0.9]]] },
  { n: '09_reloj_dia', q: 'hora=dia', dur: 4, keys: reloj },
  { n: '09_reloj_atardecer', q: 'hora=atardecer', dur: 4, keys: reloj },
  { n: '09_reloj_noche', q: 'hora=noche', dur: 4, keys: reloj },
  { n: '09_reloj_amanecer', q: 'hora=amanecer', dur: 4, keys: reloj },
  { n: '10_bruno', q: `${N}&piso=direccion`, dur: 3, keys: [[[4.7, 11.9, 2.4], [3.25, 10.4, -0.1]], [[4.35, 11.65, 1.95], [3.25, 10.4, -0.1]]] },
  { n: '11_rolo_pantalla', q: `${N}&piso=marketing`, dur: 3, keys: [[[3.2, 8.8, -2.95], [2.6, 8.1, -0.9]], [[2.95, 8.7, -2.6], [2.6, 8.1, -0.9]]] },
  // orik-06-jarvis (12/11): de día, arranca adentro del piso de Ventas y se aleja hasta ver los 5 pisos trabajando
  { n: '20_equipo_dia', q: 'hora=dia', dur: 6, settle: 1500, keys: [[[7.5, 4.2, 10.5], [0, 4.6, 0]], [[13, 7.5, 18], [0, 5.4, 0]], [[20, 12.5, 28], [0, 6.2, 0]]] },
  { n: '12_final_loop', q: N, dur: 4, keys: [[[15, 10.5, 21], [0, 6.2, 0]], [[30, 34, 42], [0, 8, 0]]] },
]
