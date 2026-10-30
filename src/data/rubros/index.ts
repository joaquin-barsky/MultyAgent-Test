// Equipos de los otros rubros (la inmobiliaria sigue en agents.ts, asks.ts y results.ts).
import { currentRubroId, type Rubro, type RubroId } from '../kit.js'
import { DESARROLLADORA } from './desarrolladora.js'
import { CONCESIONARIA } from './concesionaria.js'
import { ECOMMERCE } from './ecommerce.js'
import { GASTRONOMIA } from './gastronomia.js'

const OTHERS: Partial<Record<RubroId, Rubro>> = {
  desarrolladora: DESARROLLADORA,
  concesionaria: CONCESIONARIA,
  ecommerce: ECOMMERCE,
  gastronomia: GASTRONOMIA,
}

export const RUBRO_ID = currentRubroId()
/** el rubro elegido, o null si es la inmobiliaria */
export const OTHER_RUBRO: Rubro | null = OTHERS[RUBRO_ID] ?? null
