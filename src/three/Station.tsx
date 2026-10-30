import { useRef, useState } from 'react'
import { Billboard, Html } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { Agent } from '../data/agents'
import { runProgress, useCrew } from '../sim/store'
import { Character, Furn } from './models'

export interface StationProps {
  agent: Agent
  position: [number, number, number]
  rotation?: number
  lamps: number
  dark: boolean
  showTag: boolean
  /** se puede tocar (estás dentro del piso) */
  interactive: boolean
  /** se anima (el piso que estás mirando o el que muestra el recorrido) */
  animate: boolean
}

const S = 1.3 // escala del puesto
// el personaje mira hacia +z (hacia el escritorio); un poco más alto para que no se hunda en la silla
const SEAT: [number, number, number] = [0, 0.17, -0.46]

export function Station({ agent, position, rotation = 0, lamps, dark, showTag, interactive, animate }: StationProps) {
  const working = useCrew((s) => s.runs[agent.id].status === 'working')
  const selected = useCrew((s) => s.selected === agent.id)
  const select = useCrew((s) => s.select)
  const panelOpen = useCrew((s) => s.selected !== null)
  const [hover, setHover] = useState(false)
  const ring = useRef<THREE.Mesh>(null)
  const fill = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (ring.current) {
      const m = ring.current.material as THREE.MeshBasicMaterial
      const target = hover || selected ? 0.9 : working ? 0.28 + Math.sin(clock.elapsedTime * 3) * 0.12 : 0
      m.opacity += (target - m.opacity) * 0.15
    }
    // la barrita se lee del estado sin re-dibujar el componente
    if (fill.current && working && animate) {
      const p = Math.max(0.02, runProgress(agent, useCrew.getState().runs[agent.id]))
      fill.current.scale.x = p
      fill.current.position.x = -0.3 + 0.3 * p
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
    <group position={position} rotation-y={rotation} scale={S}>
      <group {...handlers}>
        <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.02}>
          <ringGeometry args={[0.92, 1, 64]} />
          <meshBasicMaterial color={agent.color} transparent opacity={0} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.6, -0.1]} visible={false}>
          <boxGeometry args={[1.6, 1.3, 1.6]} />
        </mesh>
        {/* escritorio más ancho con dos monitores */}
        <Furn name="desk" scale={[1.5, 1, 1.15]} />
        <Furn name="computerScreen" position={[-0.21, 0.38, 0.0]} rotation-y={Math.PI - 0.22} tint={{ metalDark: screen }} />
        <Furn name="computerScreen" position={[0.21, 0.38, 0.0]} rotation-y={Math.PI + 0.22} tint={{ metalDark: screen }} />
        <Furn name="computerKeyboard" position={[0, 0.38, -0.2]} rotation-y={Math.PI} />
        <Furn name="computerMouse" position={[0.25, 0.38, -0.21]} rotation-y={Math.PI} />
        <Furn name="chairDesk" position={[0, 0, -0.52]} tint={{ carpet: agent.color }} />
      </group>
      {/* siempre sentado; cuando trabaja teclea */}
      <Character model={agent.model} pose="sit" position={SEAT} scale={0.62} animate={animate} typing={working && animate} />
      {working && animate && (
        <Billboard position={[0, 1.08, -0.4]}>
          <mesh>
            <planeGeometry args={[0.62, 0.075]} />
            <meshBasicMaterial color="#0B1622" transparent opacity={0.55} toneMapped={false} />
          </mesh>
          <mesh ref={fill} position={[-0.3, 0, 0.001]} scale={[0.02, 1, 1]}>
            <planeGeometry args={[0.6, 0.05]} />
            <meshBasicMaterial color={agent.color} toneMapped={false} />
          </mesh>
        </Billboard>
      )}
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
