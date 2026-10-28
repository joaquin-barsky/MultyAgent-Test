import { useRef, useState } from 'react'
import { Html } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { Agent } from '../data/agents'
import { useCrew } from '../sim/store'
import { Character, Furn } from './models'

export interface StationProps {
  agent: Agent
  position: [number, number, number]
  rotation?: number
  lamps: number
  dark: boolean
  showTag: boolean
  interactive: boolean
}

const SEAT = new THREE.Vector3(0, 0.12, -0.5)
const STAND = new THREE.Vector3(0.62, 0, -0.1)

export function Station({ agent, position, rotation = 0, lamps, dark, showTag, interactive }: StationProps) {
  const run = useCrew((s) => s.runs[agent.id])
  const selected = useCrew((s) => s.selected === agent.id)
  const select = useCrew((s) => s.select)
  const panelOpen = useCrew((s) => s.selected !== null)
  const [hover, setHover] = useState(false)
  const working = run.status === 'working'
  const body = useRef<THREE.Group>(null)
  const ring = useRef<THREE.Mesh>(null)

  useFrame(({ clock }, dt) => {
    const g = body.current
    if (g) {
      g.position.lerp(working ? SEAT : STAND, 1 - Math.exp(-dt * 6))
      g.rotation.y += ((working ? 0 : -0.9) - g.rotation.y) * (1 - Math.exp(-dt * 6))
    }
    if (ring.current) {
      const m = ring.current.material as THREE.MeshBasicMaterial
      const target = hover || selected ? 0.9 : working ? 0.28 + Math.sin(clock.elapsedTime * 3) * 0.12 : 0
      m.opacity += (target - m.opacity) * 0.15
    }
  })

  const handlers = interactive
    ? {
        onClick: (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          document.body.style.cursor = ''
          select(agent.id)
        },
        onPointerOver: (e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          setHover(true)
          document.body.style.cursor = 'pointer'
        },
        onPointerOut: () => {
          setHover(false)
          document.body.style.cursor = ''
        },
      }
    : {}

  const screen = working ? `glow:${agent.color}` : dark ? '#1d2a30' : '#43545a'

  return (
    <group position={position} rotation-y={rotation} scale={1.3}>
      <group {...handlers}>
        <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.02}>
          <ringGeometry args={[0.92, 1, 64]} />
          <meshBasicMaterial color={agent.color} transparent opacity={0} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.6, -0.1]} visible={false}>
          <boxGeometry args={[1.6, 1.3, 1.6]} />
        </mesh>
        <Furn name="desk" />
        <Furn name="computerScreen" position={[-0.08, 0.38, -0.04]} rotation-y={Math.PI} tint={{ metalDark: screen }} />
        <Furn name="computerKeyboard" position={[-0.08, 0.38, -0.2]} rotation-y={Math.PI} />
        <Furn name="lampSquareTable" position={[0.26, 0.38, -0.02]} tint={{ lamp: lamps > 0 ? 'glow:#FFD58A' : '#F3E6C4' }} />
        <Furn name="chairDesk" position={[0, 0, -0.52]} tint={{ carpet: agent.color }} />
        <group ref={body} position={STAND.toArray()}>
          <Character model={agent.model} pose={working ? 'sit' : 'idle'} scale={0.62} animate={interactive} />
        </group>
      </group>
      {showTag && hover && !panelOpen && (
        <Html position={[0, 1.25, -0.2]} center zIndexRange={[9, 0]} style={{ pointerEvents: 'none' }}>
          <AgentTag agent={agent} />
        </Html>
      )}
    </group>
  )
}

/** nombre al pasar el mouse; lo que está haciendo se ve al tocarlo */
function AgentTag({ agent }: { agent: Agent }) {
  return (
    <div className="tag flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-left whitespace-nowrap">
      <span className="size-7 shrink-0 overflow-hidden rounded-full" style={{ background: agent.soft }}>
        <img src={agent.avatar} alt="" className="size-full object-cover" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[13px] font-semibold">{agent.name}</span>
        <span className="tag-sub text-[11px]">{agent.role}</span>
      </span>
    </div>
  )
}
