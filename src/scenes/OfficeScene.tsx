import { useMemo } from 'react'
import { AGENT_BY_ID } from '../data/agents'
import { Furn } from '../three/models'
import { Packets, type Spots } from '../three/Packets'
import { Station } from '../three/Station'
import { SceneCanvas } from './SceneCanvas'

// v1: oficina abierta de día, un solo piso con todo el equipo
const W = 11
const D = 8

const SPOTS: Spots = {
  lupa: [-3.2, 0, -1.3],
  mora: [0, 0, -1.3],
  cata: [3.2, 0, -1.3],
  rolo: [-3.2, 0, 1.7],
  leo: [0, 0, 1.7],
  nina: [3.2, 0, 1.7],
}

function Room() {
  const back = useMemo(() => Array.from({ length: W }, (_, i) => i), [])
  const side = useMemo(() => Array.from({ length: D }, (_, i) => i), [])
  return (
    <group>
      {/* base */}
      <mesh position={[0, -0.2, 0]} receiveShadow castShadow>
        <boxGeometry args={[W + 0.3, 0.4, D + 0.3]} />
        <meshStandardMaterial color="#F2B98C" roughness={0.8} />
      </mesh>
      {back.map((x) =>
        side.map((z) => (
          <mesh key={`f${x}-${z}`} position={[-W / 2 + 0.5 + x, 0.005, -D / 2 + 0.5 + z]} receiveShadow>
            <boxGeometry args={[0.985, 0.01, 0.985]} />
            <meshStandardMaterial color={(x + z) % 2 ? '#FFE6CF' : '#FFEEDD'} roughness={0.95} />
          </mesh>
        )),
      )}
      {/* paredes con ventanas */}
      {back.map((i) => (
        <Furn
          key={`b${i}`}
          name={i % 3 === 1 ? 'wall' : 'wallWindow'}
          position={[-W / 2 + 0.5 + i, 0, -D / 2 + 0.03]}
          tint={{ _defaultMat: '#FFF7EF', wood: '#FFB27A' }}
        />
      ))}
      {side.map((i) => (
        <Furn
          key={`s${i}`}
          name={i % 3 === 2 ? 'wall' : 'wallWindow'}
          position={[-W / 2 + 0.03, 0, -D / 2 + 0.5 + i]}
          rotation-y={Math.PI / 2}
          tint={{ _defaultMat: '#FFF7EF', wood: '#FFB27A' }}
        />
      ))}
      {/* rincón del café */}
      <Furn name="kitchenBar" position={[4.6, 0, -3.6]} />
      <Furn name="kitchenBar" position={[4.17, 0, -3.6]} />
      <Furn name="kitchenCoffeeMachine" position={[4.6, 0.42, -3.62]} />
      <Furn name="pottedPlant" position={[5.1, 0, 3.5]} scale={1.4} />
      <Furn name="pottedPlant" position={[-5, 0, -3.5]} scale={1.5} />
      <Furn name="bookcaseOpen" position={[-1.6, 0, -3.75]} scale={1.15} />
      <Furn name="bookcaseOpen" position={[1.6, 0, -3.75]} scale={1.15} />
      <Furn name="books" position={[-1.6, 0.48, -3.72]} />
      {/* living */}
      <Furn name="rugRound" position={[-3.6, 0, 3.9]} scale={1.6} tint={{ carpet: '#FF8E6E', carpetDarker: '#F26A49' }} />
      <Furn name="loungeSofa" position={[-4.7, 0, 3.7]} rotation-y={Math.PI / 2} tint={{ carpet: '#2E7DFF' }} />
      <Furn name="tableCoffee" position={[-3.7, 0, 3.75]} />
      <Furn name="lampSquareFloor" position={[-5, 0, 2.5]} />
      <Furn name="plantSmall2" position={[-3.7, 0.23, 3.75]} />
    </group>
  )
}

export default function OfficeScene({ compact }: { compact: boolean }) {
  return (
    <SceneCanvas camera={[13, 12, 13]} margin={compact ? 1.06 : 0.95}>
      <hemisphereLight args={['#FFF4E8', '#F2B98C', 1.1]} />
      <directionalLight
        position={[8, 14, 6]}
        intensity={2.4}
        color="#FFF1DE"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-bias={-0.0004}
      />
      <Room />
      {Object.entries(SPOTS).map(([id, pos]) => (
        <Station key={id} agent={AGENT_BY_ID[id]} position={pos} compact={compact} />
      ))}
      <Packets spots={SPOTS} lift={1.4} y={1.1} />
    </SceneCanvas>
  )
}
