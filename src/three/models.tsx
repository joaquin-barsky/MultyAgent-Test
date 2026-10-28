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
/** animate=false deja al personaje quieto en su pose (los pisos que no estás mirando no se animan) */
export function Character({ model, pose, animate = true, ...props }: GroupProps & { model: string; pose: Pose; animate?: boolean }) {
  const group = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF(`/models/chars/${model}.glb`)
  const clone = useMemo(() => {
    const c = SkeletonUtils.clone(scene)
    c.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = true
        m.receiveShadow = false
      }
    })
    return c
  }, [scene])
  const { actions, mixer } = useAnimations(animations, group)

  useEffect(() => {
    mixer.timeScale = animate ? 1 : 0
  }, [mixer, animate])

  useEffect(() => {
    const a = actions[pose]
    if (!a) return
    if (!animate) {
      // quieto: pasa a la pose de una, sin transición (con el tiempo frenado no terminaría nunca)
      mixer.stopAllAction()
      a.reset().play()
      return
    }
    a.reset().fadeIn(0.35).play()
    return () => {
      a.fadeOut(0.35)
    }
  }, [pose, actions, animate, mixer])

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
