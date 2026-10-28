import { useEffect, useMemo, useRef } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'

type GroupProps = ThreeElements['group']

/** Mueble de Kenney centrado en X/Z y apoyado en el piso */
export function Furn({ name, tint, ...props }: GroupProps & { name: string; tint?: Record<string, string> }) {
  const { scene } = useGLTF(`/models/furn/${name}.glb`)
  const obj = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = true
        m.receiveShadow = true
        if (tint) {
          const swap = (mat: THREE.Material) => {
            const c = tint[mat.name]
            if (!c) return mat
            const nm = (mat as THREE.MeshStandardMaterial).clone()
            nm.color.set(c)
            if (c.startsWith('glow:')) {
              nm.color.set(c.slice(5))
              nm.emissive.set(c.slice(5))
              nm.emissiveIntensity = 1.4
            }
            return nm
          }
          m.material = Array.isArray(m.material) ? m.material.map(swap) : swap(m.material)
        }
      }
    })
    const box = new THREE.Box3().setFromObject(c)
    const center = box.getCenter(new THREE.Vector3())
    c.position.set(-center.x, -box.min.y, -center.z)
    const wrap = new THREE.Group()
    wrap.add(c)
    return wrap
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, JSON.stringify(tint)])
  return <primitive object={obj} {...props} />
}

export type Pose = 'sit' | 'idle' | 'walk' | 'emote-yes' | 'interact-right'

/** Personaje animado de Kenney Mini Characters */
const clayCache = new WeakMap<THREE.Texture, THREE.Texture>()

/** versión en tonos de yeso de la textura, como las figuras de una maqueta */
function clayOf(tex: THREE.Texture) {
  const hit = clayCache.get(tex)
  if (hit) return hit
  const img = tex.image as HTMLImageElement | ImageBitmap
  const cv = document.createElement('canvas')
  cv.width = img.width
  cv.height = img.height
  const ctx = cv.getContext('2d')!
  ctx.drawImage(img as CanvasImageSource, 0, 0)
  const d = ctx.getImageData(0, 0, cv.width, cv.height)
  for (let i = 0; i < d.data.length; i += 4) {
    const l = 0.3 * d.data[i] + 0.59 * d.data[i + 1] + 0.11 * d.data[i + 2]
    const v = l < 60 ? 70 : 200 + (l / 255) * 50
    d.data[i] = v
    d.data[i + 1] = v * 0.985
    d.data[i + 2] = v * 0.96
  }
  ctx.putImageData(d, 0, 0)
  const t = new THREE.CanvasTexture(cv)
  t.flipY = tex.flipY
  t.colorSpace = THREE.SRGBColorSpace
  t.magFilter = THREE.NearestFilter
  clayCache.set(tex, t)
  return t
}

export function Character({ model, pose, clay, ...props }: GroupProps & { model: string; pose: Pose; clay?: boolean; accent?: string }) {
  const group = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF(`/models/chars/${model}.glb`)
  const clone = useMemo(() => {
    const c = SkeletonUtils.clone(scene)
    c.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = true
        m.receiveShadow = false
        if (clay) {
          const src = m.material as THREE.MeshStandardMaterial
          const mat = src.clone()
          if (src.map) mat.map = clayOf(src.map)
          mat.roughness = 0.85
          m.material = mat
        }
      }
    })
    return c
  }, [scene, clay])
  const { actions } = useAnimations(animations, group)

  useEffect(() => {
    const a = actions[pose]
    if (!a) return
    a.reset().fadeIn(0.35).play()
    return () => {
      a.fadeOut(0.35)
    }
  }, [pose, actions])

  return (
    <group ref={group} {...props}>
      <primitive object={clone} />
    </group>
  )
}

/** pequeño balanceo para cosas que flotan */
export function Bob({ children, amp = 0.08, speed = 1, phase = 0 }: { children: React.ReactNode; amp?: number; speed?: number; phase?: number }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = Math.sin(clock.elapsedTime * speed + phase) * amp
  })
  return <group ref={ref}>{children}</group>
}

const PRELOAD = [
  'desk', 'chairDesk', 'computerScreen', 'computerKeyboard', 'laptop', 'pottedPlant', 'plantSmall1', 'plantSmall2',
  'bookcaseOpen', 'kitchenBar', 'kitchenCoffeeMachine', 'loungeSofa', 'rugRound', 'tableCoffee', 'lampSquareFloor',
  'wall', 'wallWindow', 'speaker', 'lampSquareTable', 'books', 'bookcaseOpenLow', 'loungeDesignSofa', 'tableCoffeeGlass', 'stoolBar', 'loungeDesignChair', 'bookcaseOpenLow', 'loungeDesignSofa', 'tableCoffeeGlass',
]
PRELOAD.forEach((n) => useGLTF.preload(`/models/furn/${n}.glb`))
