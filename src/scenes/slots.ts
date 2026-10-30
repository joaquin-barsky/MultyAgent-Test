// Lugar de cada escritorio dentro de un piso o zona cuando el rubro no tiene una distribución hecha a mano.
// Devuelve [corrimiento en x, fila]: fila 0 es la de atrás, fila 1 la de adelante.
export function slots(n: number): [number, number][] {
  if (n <= 1) return [[0, 0]]
  if (n === 2) return [[-1.4, 0], [1.4, 0]]
  if (n === 3) return [[-1.4, 0], [1.4, 0], [0, 1]]
  if (n === 4) return [[-1.4, 0], [1.4, 0], [-1.4, 1], [1.4, 1]]
  return [[-2.6, 0], [0, 0], [2.6, 0], [-1.3, 1], [1.3, 1]].slice(0, n) as [number, number][]
}
