import { useRef, useState } from 'react'
import { Html } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { Agent } from '../data/agents'
import { currentStep, runProgress, useCrew } from '../sim/store'
import { Character, Furn } from './models'

export interface StationProps {
  agent: Agent
  position: [number, number, number]
  rotation?: number
  night?: boolean
  compact?: boolean
  pad?: boolean
}

const SEAT = new THREE.Vector3(0, 0.12, -0.5)
const STAND = new THREE.Vector3(0.62, 0, -0.1)

export function Station({ agent, position, rotation = 0, night, compact, pad = true }: StationProps) {
  const run = useCrew((s) => s.runs[agent.id])
  const selected = useCrew((s) => s.selected === agent.id)
  const select = useCrew((s) => s.select)
  const [hover, setHover] = useState(false)
  const working = run.status === 'working'
  const body = useRef<THREE.Group>(null)
  const ring = useRef<THREE.Mesh>(null)

  useFrame(({ clock }, dt) => {
    const g = body.current
    if (g) {
      const target = working ? SEAT : STAND
      g.position.lerp(target, 1 - Math.exp(-dt * 6))
      const rotTarget = working ? 0 : -0.9
      g.rotation.y += (rotTarget - g.rotation.y) * (1 - Math.exp(-dt * 6))
    }
    if (ring.current) {
      const m = ring.current.material as THREE.MeshBasicMaterial
      const on = hover || selected
      const pulse = working ? 0.22 + Math.sin(clock.elapsedTime * 3) * 0.1 : 0
      m.opacity += ((on ? 0.85 : pulse) - m.opacity) * 0.15
    }
  })

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    select(agent.id)
  }
  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHover(true)
    document.body.style.cursor = 'pointer'
  }
  const out = () => {
    setHover(false)
    document.body.style.cursor = ''
  }

  const screen = working ? `glow:${agent.color}` : night ? '#1d2a30' : '#43545a'

  return (
    <group position={position} rotation-y={rotation}>
      <group onClick={onClick} onPointerOver={over} onPointerOut={out}>
        {pad && (
          <mesh rotation-x={-Math.PI / 2} position-y={0.012} receiveShadow>
            <circleGeometry args={[1.05, 48]} />
            <meshStandardMaterial color={agent.soft} roughness={0.9} />
          </mesh>
        )}
        <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.02}>
          <ringGeometry args={[1.05, 1.16, 64]} />
          <meshBasicMaterial color={agent.color} transparent opacity={0.2} toneMapped={false} />
        </mesh>
        {/* zona clickeable invisible para que sea fácil de tocar en celular */}
        <mesh position={[0, 0.6, -0.1]} visible={false}>
          <boxGeometry args={[1.6, 1.3, 1.6]} />
        </mesh>
        <Furn name="desk" />
        <Furn name="computerScreen" position={[0, 0.38, -0.04]} rotation-y={Math.PI} tint={{ metalDark: screen }} />
        <Furn name="computerKeyboard" position={[0, 0.38, -0.2]} rotation-y={Math.PI} />
        <Furn name="chairDesk" position={[0, 0, -0.52]} tint={{ carpet: agent.color }} />
        <group ref={body} position={STAND.toArray()}>
          <Character model={agent.model} pose={working ? "sit" : "idle"} scale={0.82} />
        </group>
        {night && <pointLight position={[0, 0.7, 0.1]} color={agent.color} intensity={working ? 2.2 : 0} distance={2.6} />}
      </group>
      <Html position={[0, 1.45, -0.2]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'auto' }}>
        <AgentTag agent={agent} compact={compact} />
      </Html>
    </group>
  )
}

function AgentTag({ agent, compact }: { agent: Agent; compact?: boolean }) {
  const run = useCrew((s) => s.runs[agent.id])
  const select = useCrew((s) => s.select)
  const step = currentStep(agent, run)
  const p = runProgress(agent, run)
  return (
    <button
      onClick={() => select(agent.id)}
      className="tag group flex items-center gap-2 rounded-full pl-1 pr-3 py-1 text-left whitespace-nowrap"
      style={{ ['--c' as string]: agent.color }}
    >
      <span className="relative grid size-7 shrink-0 place-items-center overflow-hidden rounded-full" style={{ background: agent.soft }}>
        <img src={agent.avatar} alt="" className="size-full object-cover" />
        {run.status === 'working' && <span className="tag-ping" />}
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[13px] font-semibold">{agent.name}</span>
        {!compact && (
          <span className="tag-sub text-[11px]">{step ? step.title : 'Libre'}</span>
        )}
        {!compact && (
          <span className="mt-1 block h-[3px] w-24 overflow-hidden rounded-full bg-[var(--line)]">
            <span className="block h-full rounded-full transition-[width] duration-200" style={{ width: `${p * 100}%`, background: agent.color }} />
          </span>
        )}
      </span>
    </button>
  )
}
