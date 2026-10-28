import { useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import * as THREE from 'three'

// Manzana alrededor del edificio: calle con autos, veredas, árboles, faroles y vecinos.
// Modelos Kenney City Kit (CC0). Pocas piezas para que cargue rápido y se mueva fluido.

type GroupProps = ThreeElements['group']

function Prop({ url, shadow = true, ...props }: GroupProps & { url: string; shadow?: boolean }) {
  const { scene } = useGLTF(url)
  const obj = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = shadow
        m.receiveShadow = true
      }
    })
    return c
  }, [scene, shadow])
  return <primitive object={obj} {...props} />
}

const R = (n: string) => `/models/city/roads/${n}.glb`
const B = (n: string) => `/models/city/commercial/${n}.glb`
const C = (n: string) => `/models/city/cars/${n}.glb`
const S = (n: string) => `/models/city/suburban/${n}.glb`

const T = 6 // tamaño de cada baldosa de calle
const FRONT_Z = 10 // calle de adelante (corre en X)
const SIDE_X = 18 // calle del costado (corre en Z)

const CARS = [
  { m: 'sedan', lane: -1, speed: 5.5, off: 0 },
  { m: 'taxi', lane: 1, speed: 4.6, off: 22 },
  { m: 'van', lane: -1, speed: 4.2, off: 38 },
  { m: 'suv', lane: 1, speed: 6, off: 52 },
]
const LOOP = 72

function Car({ m, lane, speed, off }: (typeof CARS)[number]) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const d = (clock.elapsedTime * speed + off) % LOOP
    ref.current.position.x = lane < 0 ? -LOOP / 2 + d : LOOP / 2 - d
  })
  return (
    <group ref={ref} position={[0, 0.02, FRONT_Z + lane * 1.35]} rotation-y={lane < 0 ? Math.PI / 2 : -Math.PI / 2}>
      <Prop url={C(m)} scale={1.25} shadow={false} />
    </group>
  )
}

export function CityBlock({ dark, ground, edge }: { dark: boolean; ground: string; edge: string }) {
  const front = useMemo(() => Array.from({ length: 11 }, (_, i) => -30 + i * T), [])
  const side = useMemo(() => [-20, -14, -8, -2, 4, 16, 22], [])
  return (
    <group>
      {/* base de la manzana */}
      <mesh position={[0, -0.32, 2]} receiveShadow>
        <boxGeometry args={[70, 0.6, 56]} />
        <meshStandardMaterial color={ground} roughness={1} />
      </mesh>
      <mesh position={[0, -0.64, 2]}>
        <boxGeometry args={[70.6, 0.06, 56.6]} />
        <meshStandardMaterial color={edge} />
      </mesh>

      {/* calles */}
      {front.map((x) => (
        <Prop key={`f${x}`} url={R(x === SIDE_X ? "road-crossroad-path" : "road-straight")} position={[x, 0.005, FRONT_Z]} rotation-y={Math.PI / 2} scale={T} shadow={false} />
      ))}
      {side.map((z) => (
        <Prop key={`s${z}`} url={R('road-straight')} position={[SIDE_X, 0.005, z]} scale={T} shadow={false} />
      ))}

      {/* árboles en las veredas, a los costados para no tapar el edificio */}
      {[[-26, 6], [-20, 6], [-12, 6], [-24, 14.5], [-12, 14.5], [22, -8], [12.5, -7], [-10, -9]].map(([x, z]) => (
        <Prop key={`t${x}${z}`} url={S(x % 2 === 0 ? 'tree-large' : 'tree-small')} position={[x, 0, z]} scale={7} />
      ))}

      {/* faroles */}
      {[-22, -10, 24].map((x) => (
        <group key={`l${x}`} position={[x, 0, FRONT_Z - 3.3]}>
          <Prop url={R('light-square')} scale={6} rotation-y={Math.PI} shadow={false} />
          {dark && (
            <mesh position={[0, 3.45, 1.1]}>
              <boxGeometry args={[0.35, 0.1, 0.35]} />
              <meshBasicMaterial color="#FFE2A8" toneMapped={false} />
            </mesh>
          )}
        </group>
      ))}

      {/* edificios vecinos */}
      <Prop url={B('building-a')} position={[-19, 0, -5]} scale={5.4} />
      <Prop url={B('building-c')} position={[-19, 0, -13]} scale={5.4} />
      <Prop url={B('building-skyscraper-a')} position={[-6, 0, -21]} scale={5.2} />
      <Prop url={B('building-e')} position={[8, 0, -18]} scale={5.4} />
      <Prop url={B('building-skyscraper-c')} position={[28, 0, -14]} scale={5.2} rotation-y={-Math.PI / 2} />
      <Prop url={B('building-a')} position={[27, 0, -3]} scale={5.4} rotation-y={-Math.PI / 2} />
      <Prop url={B('building-skyscraper-e')} position={[-30, 0, -20]} scale={5.2} />

      {CARS.map((c) => (
        <Car key={c.m} {...c} />
      ))}
    </group>
  )
}

;['road-straight', 'road-crossroad-path', 'light-square'].forEach((n) => useGLTF.preload(R(n)))
;['building-a', 'building-c', 'building-e', 'building-skyscraper-a', 'building-skyscraper-c', 'building-skyscraper-e'].forEach((n) => useGLTF.preload(B(n)))
;CARS.forEach((c) => useGLTF.preload(C(c.m)))
;['tree-large', 'tree-small'].forEach((n) => useGLTF.preload(S(n)))
