import { useEffect, useState } from 'react'

// Momento del día según la hora de Buenos Aires
export type Phase = 'madrugada' | 'amanecer' | 'dia' | 'atardecer' | 'noche'

export interface Light {
  phase: Phase
  label: string
  dark: boolean
  sky: string
  sun: { color: string; intensity: number; pos: [number, number, number] }
  hemi: [string, string, number]
  windows: string
  lamps: number
}

export const LIGHTS: Record<Phase, Light> = {
  madrugada: {
    phase: 'madrugada', label: 'Madrugada', dark: true,
    sky: 'radial-gradient(120% 80% at 70% 0%, #1B2A4A 0%, #0B1324 55%, #060A14 100%)',
    sun: { color: '#8AA2FF', intensity: 0.35, pos: [-6, 12, 6] },
    hemi: ['#5D6FA8', '#141826', 0.75], windows: '#1E3E7A', lamps: 1,
  },
  amanecer: {
    phase: 'amanecer', label: 'Amanecer', dark: false,
    sky: 'linear-gradient(180deg, #8FB3E8 0%, #F6C1B1 55%, #FFD9A0 100%)',
    sun: { color: '#FFC08A', intensity: 1.6, pos: [-12, 5, 8] },
    hemi: ['#FFE3CF', '#8F7A90', 1], windows: '#FFD3A8', lamps: 0.35,
  },
  dia: {
    phase: 'dia', label: 'Día', dark: false,
    sky: 'linear-gradient(180deg, #A9D6FF 0%, #DDF0FF 55%, #F4F8FB 100%)',
    sun: { color: '#FFF6E8', intensity: 2.4, pos: [8, 16, 9] },
    hemi: ['#FFFFFF', '#C9D3DC', 1.15], windows: '#BFE3F5', lamps: 0,
  },
  atardecer: {
    phase: 'atardecer', label: 'Atardecer', dark: false,
    sky: 'linear-gradient(180deg, #5B6FB8 0%, #E77C8C 45%, #FFB36B 78%, #FFD58A 100%)',
    sun: { color: '#FF9A5A', intensity: 1.9, pos: [14, 5, 6] },
    hemi: ['#FFD0B0', '#6A5470', 0.95], windows: '#FFB27A', lamps: 0.6,
  },
  noche: {
    phase: 'noche', label: 'Noche', dark: true,
    sky: 'radial-gradient(120% 80% at 30% 0%, #1A2E44 0%, #0B1622 55%, #070D16 100%)',
    sun: { color: '#9CC2FF', intensity: 0.5, pos: [6, 12, 10] },
    hemi: ['#6F8FB0', '#121A22', 0.85], windows: '#2B5E86', lamps: 1,
  },
}

function phaseOf(h: number): Phase {
  if (h < 6) return 'madrugada'
  if (h < 8) return 'amanecer'
  if (h < 17.5) return 'dia'
  if (h < 20) return 'atardecer'
  return 'noche'
}

export function arHour(d = new Date()) {
  const parts = new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d)
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 12)
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
  return { h, m, text: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` }
}

/** ?hora=noche (o madrugada, amanecer, dia, atardecer) fuerza un momento para probar */
export function useDaylight() {
  const forced = new URLSearchParams(location.search).get('hora') as Phase | null
  const [now, setNow] = useState(() => arHour())
  useEffect(() => {
    const id = setInterval(() => setNow(arHour()), 30_000)
    return () => clearInterval(id)
  }, [])
  const phase = forced && LIGHTS[forced] ? forced : phaseOf(now.h + now.m / 60)
  return { light: LIGHTS[phase], clock: now.text }
}
