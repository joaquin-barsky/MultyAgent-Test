// Avisos que Bruno manda solo cada tanto. Se arman en el navegador, sin usar la IA (no gastan crédito).
import { OTHER_RUBRO } from './rubros/index.js'

const INMO_ALERTS = [
  'Ojo: **Teo** tiene 3 alquileres atrasados. Ya mandó el segundo aviso a los inquilinos.',
  '**Paz** frenó una reserva porque falta el informe de dominio. Ya lo pidió al escribano.',
  '**Nina** encontró una transferencia sin comprobante en la caja de hoy.',
  'Dato: los reels que arma **Rolo** están trayendo el doble de consultas que los posteos.',
  '**Fran** apagó dos anuncios que no funcionaban y dejó el que trae más consultas.',
]

export const ALERTS: string[] = OTHER_RUBRO ? OTHER_RUBRO.alerts : INMO_ALERTS
