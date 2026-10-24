import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { AGENT_BY_ID } from '../data/agents'
import { PACKET_MS, useCrew, type Packet } from '../sim/store'

export type Spots = Record<string, [number, number, number]>
type V3 = [number, number, number]

/** punto sobre un arco entre dos puestos */
export function arcPoint(a: THREE.Vector3, b: THREE.Vector3, t: number, lift: number, out = new THREE.Vector3(), bulge?: V3) {
  const mid = a.clone().lerp(b, 0.5)
  mid.y += lift + a.distanceTo(b) * 0.18
  if (bulge) mid.add(new THREE.Vector3(...bulge))
  const u = 1 - t
  out.set(
    u * u * a.x + 2 * u * t * mid.x + t * t * b.x,
    u * u * a.y + 2 * u * t * mid.y + t * t * b.y,
    u * u * a.z + 2 * u * t * mid.z + t * t * b.z,
  )
  return out
}

export function arcCurve(a: THREE.Vector3, b: THREE.Vector3, lift: number, bulge?: V3) {
  const pts = Array.from({ length: 40 }, (_, i) => arcPoint(a, b, i / 39, lift, new THREE.Vector3(), bulge))
  return new THREE.CatmullRomCurve3(pts)
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

function Flyer({ p, spots, lift, y, bulge }: { p: Packet; spots: Spots; lift: number; y: number; bulge?: V3 }) {
  const head = useRef<THREE.Mesh>(null)
  const trail = useRef<THREE.Group>(null)
  const line = useRef<THREE.MeshBasicMaterial>(null)
  const color = AGENT_BY_ID[p.from].color
  const [a, b] = useMemo(() => {
    const A = new THREE.Vector3(...spots[p.from]).add(new THREE.Vector3(0, y, 0))
    const B = new THREE.Vector3(...spots[p.to]).add(new THREE.Vector3(0, y, 0))
    return [A, B]
  }, [p, spots, y])
  const curve = useMemo(() => arcCurve(a, b, lift, bulge), [a, b, lift, bulge])
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame(() => {
    const t = Math.min(1, (performance.now() - p.born) / PACKET_MS)
    const e = ease(t)
    const fade = t > 0.9 ? (1 - t) / 0.1 : 1
    if (head.current) {
      arcPoint(a, b, e, lift, tmp, bulge)
      head.current.position.copy(tmp)
      head.current.scale.setScalar(Math.max(0.01, Math.min(1, t / 0.08) * fade))
    }
    if (line.current) line.current.opacity = 0.4 * Math.min(1, t / 0.15) * fade
    trail.current?.children.forEach((c, i) => {
      arcPoint(a, b, Math.max(0, e - (i + 1) * 0.03), lift, tmp, bulge)
      c.position.copy(tmp)
      c.scale.setScalar(Math.max(0.01, (1 - i / 8) * fade))
    })
  })

  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 60, 0.014, 6, false]} />
        <meshBasicMaterial ref={line} color={color} transparent opacity={0} toneMapped={false} />
      </mesh>
      <mesh ref={head}>
        <icosahedronGeometry args={[0.12, 2]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <group ref={trail}>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.065, 10, 10]} />
            <meshBasicMaterial color={color} transparent opacity={0.55 - i * 0.06} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

export function Packets({ spots, lift = 1.2, y = 1, bulge }: { spots: Spots; lift?: number; y?: number; bulge?: V3 }) {
  const packets = useCrew((s) => s.packets)
  return (
    <>
      {packets.map((p) => spots[p.from] && spots[p.to] && <Flyer key={p.id} p={p} spots={spots} lift={lift} y={y} bulge={bulge} />)}
    </>
  )
}
