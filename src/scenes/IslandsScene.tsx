import { useMemo } from 'react'
import { ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { AGENTS, AGENT_BY_ID } from '../data/agents'
import { Bob, Furn } from '../three/models'
import { arcCurve, Packets, type Spots } from '../three/Packets'
import { Station } from '../three/Station'
import { SceneCanvas } from './SceneCanvas'

// v3: cada agente en su isla, unidos por los caminos por donde se pasan el trabajo
const R = 4.2
const RING = ['lupa', 'cata', 'rolo', 'nina', 'leo']
const SPOTS: Spots = { mora: [0, 0.4, 0] }
RING.forEach((id, i) => {
  const a = -Math.PI / 2 - 0.35 + (i / RING.length) * Math.PI * 2
  SPOTS[id] = [Math.cos(a) * R, ((i % 2) * 0.5) as number, Math.sin(a) * R]
})

const DECOR: Record<string, { name: string; pos: [number, number, number]; scale?: number }[]> = {
  mora: [{ name: 'pottedPlant', pos: [1.05, 0, -0.75], scale: 1.2 }, { name: 'bookcaseOpenLow', pos: [-1.1, 0, -0.7] }],
  lupa: [{ name: 'bookcaseOpen', pos: [-1, 0, -0.75] }, { name: 'plantSmall1', pos: [1.05, 0, 0.6] }],
  cata: [{ name: 'pottedPlant', pos: [1.05, 0, -0.7], scale: 1.1 }, { name: 'plantSmall2', pos: [-1, 0, 0.7] }],
  rolo: [{ name: 'speaker', pos: [-1.05, 0, -0.6] }, { name: 'speakerSmall', pos: [1.05, 0, -0.65] }],
  nina: [{ name: 'books', pos: [1, 0, -0.7] }, { name: 'plantSmall3', pos: [-1.05, 0, 0.6] }],
  leo: [{ name: 'lampSquareFloor', pos: [-1.05, 0, -0.7] }, { name: 'plantSmall1', pos: [1.05, 0, 0.65] }],
}

function Island({ color, soft, r = 1.45 }: { color: string; soft: string; r?: number }) {
  return (
    <group>
      <mesh position={[0, -0.16, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[r, r, 0.32, 64]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.003, 0]} receiveShadow>
        <cylinderGeometry args={[r - 0.06, r - 0.06, 0.01, 64]} />
        <meshStandardMaterial color={soft} roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.32, 0]} rotation-x={Math.PI}>
        <coneGeometry args={[r * 0.82, 0.9, 64, 1, true]} />
        <meshStandardMaterial color={color} roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

const LINKS: [string, string][] = AGENTS.filter((a) => a.handoffTo).map((a) => [a.id, a.handoffTo!])

function Paths() {
  const tubes = useMemo(
    () =>
      LINKS.map(([f, t]) => {
        const a = new THREE.Vector3(...SPOTS[f]).add(new THREE.Vector3(0, 1.1, 0))
        const b = new THREE.Vector3(...SPOTS[t]).add(new THREE.Vector3(0, 1.1, 0))
        return { key: f + t, curve: arcCurve(a, b, 1.1), color: AGENT_BY_ID[f].color }
      }),
    [],
  )
  return (
    <>
      {tubes.map((t) => (
        <mesh key={t.key}>
          <tubeGeometry args={[t.curve, 80, 0.018, 8, false]} />
          <meshBasicMaterial color={t.color} transparent opacity={0.22} toneMapped={false} />
        </mesh>
      ))}
    </>
  )
}

export default function IslandsScene({ compact }: { compact: boolean }) {
  return (
    <SceneCanvas camera={[13, 13, 14]} margin={compact ? 1.08 : 1.05} polar={[0.5, 1.2]} extra={<ContactShadows position={[0, -2.2, 0]} opacity={0.25} scale={22} blur={2.8} far={4} color="#C2407A" />}>
      <hemisphereLight args={['#FFFFFF', '#FFD3E6', 1.2]} />
      <directionalLight
        position={[6, 14, 8]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-bias={-0.0004}
      />
      {Object.entries(SPOTS).map(([id, pos], i) => {
        const a = AGENT_BY_ID[id]
        return (
          <group key={id} position={pos}>
            <Bob amp={0.07} speed={0.9} phase={i * 1.3}>
              <Island color={a.color} soft={a.soft} r={id === 'mora' ? 1.6 : 1.45} />
              {DECOR[id].map((d, k) => (
                <Furn key={k} name={d.name} position={d.pos} scale={d.scale ?? 1} />
              ))}
              <Station agent={a} position={[0, 0, 0.15]} compact={compact} pad={false} />
            </Bob>
          </group>
        )
      })}
      <Paths />
      <Packets spots={SPOTS} lift={1.1} y={1.1} />
    </SceneCanvas>
  )
}
