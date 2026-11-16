// Vidriera de oficinas: /v1, /v2… muestran la empresa genérica, cada número es un estilo de oficina.
// En la raíz sigue la demo de la inmobiliaria.
const m = typeof location !== 'undefined' ? /^\/v(\d+)\/?$/.exec(location.pathname) : null
export const SHOW = !!m
export const VERSION = m ? Number(m[1]) : 0
