import { Html, Stars } from '@react-three/drei'
import { AGENT_BY_ID } from '../data/agents'
import { Furn } from '../three/models'
import { Packets, type Spots } from '../three/Packets'
import { Station } from '../three/Station'
import { SceneCanvas } from './SceneCanvas'

// v2: edificio de noche, un piso por área
const W = 7
const D = 3.4
const H = 2.3

const FLOORS = [
  { name: 'Inteligencia', n: 3, ids: ['lupa', 'mora'], tone: '#1F5A63' },
  { name: 'Marketing', n: 2, ids: ['cata', 'rolo'], tone: '#5A2A4C' },
  { name: 'Operación', n: 1, ids: ['leo', 'nina'], tone: '#4A3E1E' },
]

const SPOTS: Spots = {}
FLOORS.forEach((f) => {
  const y = (f.n - 1) * H
  SPOTS[f.ids[0]] = [-1.7, y, 0.2]
  SPOTS[f.ids[1]] = [1.7, y, 0.2]
})

const BULGE: [number, number, number] = [0, 0, 3.4]

const WALL = { _defaultMat: '#3A5560', wood: '#5C7F8A', glass: 'glow:#1A9CC0' }

function Floor({ y, tone, name, n, compact }: { y: number; tone: string; name: string; n: number; compact: boolean }) {
  return (
    <group position={[0, y, 0]}>
      <mesh position={[0, -0.12, 0]} receiveShadow castShadow>
        <boxGeometry args={[W + 0.2, 0.24, D + 0.2]} />
        <meshStandardMaterial color="#3E6470" roughness={0.7} />
      </mesh>
      <pointLight position={[0, 1.9, 0.4]} color="#D6F4FF" intensity={9} distance={6.5} decay={1.6} />
      <mesh position={[0, 0.004, 0]} receiveShadow>
        <boxGeometry args={[W, 0.01, D]} />
        <meshStandardMaterial color={tone} roughness={0.9} />
      </mesh>
      {Array.from({ length: W }, (_, i) => (
        <Furn key={i} name="wallWindow" position={[-W / 2 + 0.5 + i, 0, -D / 2 + 0.03]} tint={WALL} />
      ))}
      {Array.from({ length: 3 }, (_, i) => (
        <Furn key={`s${i}`} name="wall" position={[-W / 2 + 0.03, 0, -D / 2 + 0.5 + i]} rotation-y={Math.PI / 2} tint={WALL} />
      ))}
      <Furn name="pottedPlant" position={[3.2, 0, -1.3]} scale={1.2} />
      <Furn name="lampSquareFloor" position={[-3.15, 0, -1.3]} tint={{ lamp: 'glow:#FFD27A' }} />
      <pointLight position={[-3.1, 1, -1.1]} color="#FFC46B" intensity={1.6} distance={3} />
      <Html position={[-W / 2 - 0.2, 0.15, D / 2]} center zIndexRange={[20, 0]}>
        <div className="floor-tag">
          <span className="floor-n">{n}</span>
          {!compact && <span>{name}</span>}
        </div>
      </Html>
    </group>
  )
}

export default function TowerScene({ compact }: { compact: boolean }) {
  return (
    <SceneCanvas camera={[14, 9, 15]} target={[0, 2.3, 0]} margin={compact ? 1.04 : 1.1} polar={[0.75, 1.35]} extra={<Stars radius={60} depth={30} count={1800} factor={3} saturation={0} fade speed={0.6} />}>
      <hemisphereLight args={['#8FC3D6', '#1A2A30', 1.1]} />
      <directionalLight
        position={[6, 12, 10]}
        intensity={0.9}
        color="#9CC9FF"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-4}
      />
      {/* base del edificio */}
      <mesh position={[0, -0.55, 0]} receiveShadow>
        <boxGeometry args={[W + 1.4, 0.6, D + 1.4]} />
        <meshStandardMaterial color="#1A2C33" />
      </mesh>
      {FLOORS.map((f) => (
        <Floor key={f.name} y={(f.n - 1) * H} tone={f.tone} name={f.name} n={f.n} compact={compact} />
      ))}
      {/* techo */}
      <mesh position={[0, 3 * H - 0.12, 0]} castShadow>
        <boxGeometry args={[W + 0.2, 0.24, D + 0.2]} />
        <meshStandardMaterial color="#2C4550" roughness={0.7} />
      </mesh>
      {Object.entries(SPOTS).map(([id, pos]) => (
        <Station key={id} agent={AGENT_BY_ID[id]} position={pos} night compact={compact} pad={false} />
      ))}
      <Packets spots={SPOTS} lift={0.2} y={1.1} bulge={BULGE} />
    </SceneCanvas>
  )
}
