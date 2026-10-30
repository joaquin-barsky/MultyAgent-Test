import { useEffect, useMemo, useState } from 'react'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { ThreeElements } from '@react-three/fiber'

// Cartel del equipo en la pared lateral del piso. Variantes temporales con ?cartel=1..3
export const SIGN_VARIANT = (() => {
  const n = Number(new URLSearchParams(location.search).get('cartel'))
  return n === 2 || n === 3 ? n : 1
})()

function useFontsReady() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    Promise.all([
      document.fonts.load('800 140px "Bricolage Grotesque Variable"'),
      document.fonts.load('600 60px "Figtree Variable"'),
    ]).finally(() => setReady(true))
  }, [])
  return ready
}

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void

function useCanvas(w: number, h: number, draw: Draw, deps: unknown[]) {
  const ready = useFontsReady()
  const tex = useMemo(() => {
    const cv = document.createElement('canvas')
    cv.width = w
    cv.height = h
    const ctx = cv.getContext('2d')!
    draw(ctx, w, h)
    const t = new THREE.CanvasTexture(cv)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    return t
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, ...deps])
  useEffect(() => () => tex.dispose(), [tex])
  return tex
}

/** v1: placa de recepción, oscura, con el número del piso en el color del área */
function Plaque({ name, color, n }: { name: string; color: string; n: number }) {
  const tex = useCanvas(
    1600,
    480,
    (c, w, h) => {
      c.clearRect(0, 0, w, h)
      c.fillStyle = color
      c.beginPath()
      c.roundRect(70, 120, 240, 240, 56)
      c.fill()
      c.fillStyle = '#FFFFFF'
      c.textAlign = 'center'
      c.textBaseline = 'middle'
      c.font = '800 150px "Bricolage Grotesque Variable", sans-serif'
      c.fillText(String(n), 190, 248)
      c.textAlign = 'left'
      c.font = '600 54px "Figtree Variable", sans-serif'
      c.fillStyle = 'rgba(255,255,255,0.55)'
      c.fillText('Equipo', 370, 168)
      c.font = '800 150px "Bricolage Grotesque Variable", sans-serif'
      c.fillStyle = '#FFFFFF'
      c.fillText(name, 362, 300)
    },
    [name, color, n],
  )
  return (
    <group>
      <RoundedBox args={[3.3, 1.0, 0.06]} radius={0.05} smoothness={3}>
        <meshStandardMaterial color="#141B22" roughness={0.45} metalness={0.2} />
      </RoundedBox>
      <mesh position={[0, 0, 0.032]}>
        <planeGeometry args={[3.3, 0.99]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} />
      </mesh>
    </group>
  )
}

/** v2: letras luminosas en el color del área, con un halo suave en la pared */
function Glow({ name, color }: { name: string; color: string }) {
  const tex = useCanvas(
    2048,
    512,
    (c, w, h) => {
      c.clearRect(0, 0, w, h)
      c.textBaseline = 'middle'
      c.font = '800 220px "Bricolage Grotesque Variable", sans-serif'
      c.shadowColor = color
      c.shadowBlur = 60
      c.fillStyle = color
      c.fillText(name, 60, h / 2)
      c.shadowBlur = 14
      c.fillStyle = '#FFFFFF'
      c.globalAlpha = 0.92
      c.fillText(name, 60, h / 2)
    },
    [name, color],
  )
  return (
    <mesh>
      <planeGeometry args={[4.4, 1.1]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} depthWrite={false} />
    </mesh>
  )
}

/** v3: pared pintada del color del área con el nombre grande (la pared se pinta en el piso) */
function Painted({ name }: { name: string }) {
  const tex = useCanvas(
    2048,
    640,
    (c, w, h) => {
      c.clearRect(0, 0, w, h)
      c.textBaseline = 'alphabetic'
      c.font = '800 300px "Bricolage Grotesque Variable", sans-serif'
      c.fillStyle = 'rgba(255,255,255,0.94)'
      c.fillText(name, 40, h - 90)
      c.font = '600 72px "Figtree Variable", sans-serif'
      c.fillStyle = 'rgba(255,255,255,0.7)'
      c.fillText('Equipo de', 52, h - 400)
    },
    [name],
  )
  return (
    <mesh>
      <planeGeometry args={[5.2, 1.625]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} depthWrite={false} />
    </mesh>
  )
}

export function WallSign({ name, color, n, ...props }: { name: string; color: string; n: number } & ThreeElements['group']) {
  return (
    <group {...props}>
      {SIGN_VARIANT === 1 && <Plaque name={name} color={color} n={n} />}
      {SIGN_VARIANT === 2 && <Glow name={name} color={color} />}
      {SIGN_VARIANT === 3 && <Painted name={name} />}
    </group>
  )
}

/** color de la pared lateral cuando se usa la variante pintada */
export function paintedWall(color: string) {
  return '#' + new THREE.Color('#0F1A22').lerp(new THREE.Color(color), 0.72).getHexString()
}
