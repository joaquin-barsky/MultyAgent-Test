import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import type { ThreeElements } from '@react-three/fiber'

// Cartel pintado en la pared del piso: "Equipo de Marketing". Se dibuja una vez en un canvas (liviano).
export function WallSign({ name, color, width, ...props }: { name: string; color: string; width: number } & ThreeElements['group']) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    document.fonts.load('800 140px "Bricolage Grotesque Variable"').finally(() => setReady(true))
  }, [])

  const tex = useMemo(() => {
    const cv = document.createElement('canvas')
    cv.width = 2048
    cv.height = 512
    const ctx = cv.getContext('2d')!
    ctx.clearRect(0, 0, cv.width, cv.height)
    ctx.textBaseline = 'middle'
    ctx.font = '600 64px "Figtree Variable", sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.62)'
    ctx.fillText('Equipo de', 40, 150)
    ctx.font = '800 210px "Bricolage Grotesque Variable", sans-serif'
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(name, 30, 330)
    // subrayado con el color del área
    const w = Math.min(cv.width - 80, ctx.measureText(name).width)
    ctx.fillStyle = color
    ctx.fillRect(40, 458, w * 0.42, 22)
    const t = new THREE.CanvasTexture(cv)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    return t
    // se redibuja cuando la tipografía terminó de cargar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, color, ready])

  useEffect(() => () => tex.dispose(), [tex])

  return (
    <group {...props}>
      <mesh>
        <planeGeometry args={[width, width / 4]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  )
}
