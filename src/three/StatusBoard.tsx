import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { FLOORS, agentsOn } from '../data/agents'
import { useCrew } from '../sim/store'

// Tablero en el frente del escritorio de Bruno: una luz por agente, ordenadas por área.
// Del color del agente si trabaja, amarilla si te necesita, apagada si está libre.
const ORDER = FLOORS.flatMap((f) => agentsOn(f.id))
// con muchos agentes (la vidriera tiene 40) van en filas de 10 para que entren en el frente del escritorio
const ROWS = ORDER.length > 20 ? Math.ceil(ORDER.length / 10) : 2
const PER_ROW = Math.ceil(ORDER.length / ROWS)
const GAP = ROWS > 2 ? 0.094 : 0.096
const ROW_GAP = ROWS > 2 ? 0.068 : 0.09
const DOT = ROWS > 2 ? 0.024 : 0.03
const OFF = new THREE.Color('#3A4652')
const NEED = new THREE.Color('#FFC21A')

export function StatusBoard() {
  const dots = useRef<(THREE.Mesh | null)[]>([])
  const colors = useRef(ORDER.map((a) => new THREE.Color(a.color)))
  useFrame(({ clock }) => {
    const runs = useCrew.getState().runs
    const pulse = 0.65 + Math.sin(clock.elapsedTime * 5) * 0.35
    ORDER.forEach((a, i) => {
      const m = dots.current[i]?.material as THREE.MeshBasicMaterial | undefined
      if (!m) return
      const st = runs[a.id]?.status
      if (st === 'waiting') m.color.copy(NEED).multiplyScalar(pulse)
      else m.color.copy(st === 'working' ? colors.current[i] : OFF)
    })
  })
  const w = PER_ROW * GAP + 0.04
  const h = ROWS * ROW_GAP + 0.03
  return (
    <group position={[0, 0.35 - h / 2 - 0.015, 0.232]}>
      <RoundedBox args={[w, h, 0.016]} radius={0.01}>
        <meshStandardMaterial color="#1F2A37" roughness={0.4} />
      </RoundedBox>
      {ORDER.map((a, i) => (
        <mesh key={a.id} ref={(m) => { dots.current[i] = m }} position={[((i % PER_ROW) - (PER_ROW - 1) / 2) * GAP, ((ROWS - 1) / 2 - Math.floor(i / PER_ROW)) * ROW_GAP, 0.0095]}>
          <circleGeometry args={[DOT, 20]} />
          <meshBasicMaterial color={OFF} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}
