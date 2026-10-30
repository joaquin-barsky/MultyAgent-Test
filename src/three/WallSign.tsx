import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import type { ThreeElements } from '@react-three/fiber'

// Cartel del equipo: la pared se pinta del color del área y lleva el nombre grande (elegido por Joaquín, variante 3)

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

const CW = 2048
const CH = 640
const PAD = 48

export function WallSign({ name, width = 5.2, ...props }: { name: string; width?: number } & ThreeElements['group']) {
  const ready = useFontsReady()
  const tex = useMemo(() => {
    const cv = document.createElement('canvas')
    cv.width = CW
    cv.height = CH
    const c = cv.getContext('2d')!
    c.textBaseline = 'alphabetic'
    // el nombre se achica hasta que entra entero en el ancho del cartel
    let size = 300
    c.font = `800 ${size}px "Bricolage Grotesque Variable", sans-serif`
    const fit = CW - PAD * 2
    const w = c.measureText(name).width
    if (w > fit) {
      size = Math.floor((size * fit) / w)
      c.font = `800 ${size}px "Bricolage Grotesque Variable", sans-serif`
    }
    c.fillStyle = 'rgba(255,255,255,0.94)'
    c.fillText(name, PAD, CH - 90)
    c.font = '600 72px "Figtree Variable", sans-serif'
    c.fillStyle = 'rgba(255,255,255,0.7)'
    c.fillText('Equipo de', PAD + 10, CH - 90 - size * 0.92 - 24)
    const t = new THREE.CanvasTexture(cv)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    return t
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, ready])
  useEffect(() => () => tex.dispose(), [tex])

  return (
    <group {...props}>
      <mesh>
        <planeGeometry args={[width, (width * CH) / CW]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  )
}

/** color de la pared pintada del área */
export function paintedWall(color: string) {
  return '#' + new THREE.Color('#0F1A22').lerp(new THREE.Color(color), 0.72).getHexString()
}
