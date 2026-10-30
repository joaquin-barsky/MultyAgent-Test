import { useRef, useState } from 'react'
import { Billboard, Html, RoundedBox } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { Agent } from '../data/agents'
import { runProgress, useCrew } from '../sim/store'
import { Character, Furn } from './models'
import { CurvedMonitor } from './CurvedMonitor'
import { screenTexture } from './screenTexture'

const RING_SEG = 96

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
  /** modo noche: la pantalla ilumina el escritorio y el piso */
  night?: boolean
}

const S = 1.3 // escala del puesto
// el personaje mira hacia +z (hacia el escritorio); un poco más alto para que no se hunda en la silla
// medido a ojo con ?seat=: el personaje apoyado en el almohadón, con el apoyabrazos por debajo de las piernas
export const SEAT: [number, number, number] = [0, 0.25, -0.6]
export let CHAR_SCALE = 0.62
export let CHAIR_SCALE = 0.75
export let CHAIR_Z = -0.6
// solo desarrollo: ?seat=y,z,escalaPersonaje,escalaSilla,zSilla para ajustar a ojo
if (import.meta.env.DEV) {
  const q = new URLSearchParams(location.search).get('seat')
  if (q) {
    const v = q.split(',').map(Number)
    SEAT[1] = v[0]
    SEAT[2] = v[1]
    CHAR_SCALE = v[2]
    CHAIR_SCALE = v[3]
    CHAIR_Z = v[4]
  }
}

const NEED = '#FFC21A'
let needTex: THREE.CanvasTexture | null = null
/** círculo amarillo con signo de exclamación, dibujado una sola vez */
function needTexture() {
  if (needTex) return needTex
  const cv = document.createElement('canvas')
  cv.width = cv.height = 128
  const c = cv.getContext('2d')!
  c.fillStyle = NEED
  c.beginPath()
  c.arc(64, 64, 60, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = '#3A2A00'
  c.fillRect(56, 26, 16, 52)
  c.beginPath()
  c.arc(64, 96, 9, 0, Math.PI * 2)
  c.fill()
  needTex = new THREE.CanvasTexture(cv)
  needTex.colorSpace = THREE.SRGBColorSpace
  return needTex
}

// cosas sobre el escritorio: alfombrita del color del agente, taza y algo propio en las esquinas (cambia según el agente)
const LEFT = ['plantSmall1', 'plantSmall2', 'books', 'plantSmall3']
const RIGHT = ['books', null, 'plantSmall3', 'speakerSmall']
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

function DeskProps({ agent }: { agent: Agent }) {
  const h = hash(agent.id)
  const left = LEFT[h % LEFT.length]
  const right = RIGHT[(h >> 3) % RIGHT.length]
  return (
    <group>
      <RoundedBox args={[0.6, 0.008, 0.19]} radius={0.004} position={[0.05, 0.388, -0.18]} receiveShadow>
        <meshStandardMaterial color={agent.color} roughness={0.85} />
      </RoundedBox>
      <mesh position={[0.43, 0.415, -0.13]} castShadow>
        <cylinderGeometry args={[0.028, 0.025, 0.06, 16]} />
        <meshStandardMaterial color="#F4F1EC" roughness={0.5} />
      </mesh>
      <mesh position={[0.43, 0.444, -0.13]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.024, 16]} />
        <meshStandardMaterial color="#5A3A22" roughness={0.3} />
      </mesh>
      <Furn name={left} position={[-0.46, 0.384, 0.1]} rotation-y={left === 'books' ? 0.4 : 0} scale={left === 'books' ? 1.15 : 1.5} />
      {right && right !== left && <Furn name={right} position={[0.47, 0.384, 0.12]} rotation-y={right === 'speakerSmall' ? Math.PI + 0.3 : -0.3} scale={right === 'speakerSmall' ? 0.6 : 1.15} />}
    </group>
  )
}

let glowTex: THREE.CanvasTexture | null = null
/** mancha de luz redonda que se desvanece, dibujada una sola vez */
function glowTexture() {
  if (glowTex) return glowTex
  const cv = document.createElement('canvas')
  cv.width = cv.height = 128
  const c = cv.getContext('2d')!
  const g = c.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(255,255,255,0.9)')
  g.addColorStop(0.45, 'rgba(255,255,255,0.35)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  c.fillStyle = g
  c.fillRect(0, 0, 128, 128)
  glowTex = new THREE.CanvasTexture(cv)
  return glowTex
}

export function Station({ agent, position, rotation = 0, lamps, dark, showTag, interactive, animate, night }: StationProps) {
  const working = useCrew((s) => s.runs[agent.id].status === 'working')
  const waiting = useCrew((s) => s.runs[agent.id].status === 'waiting')
  const selected = useCrew((s) => s.selected === agent.id)
  const select = useCrew((s) => s.select)
  const panelOpen = useCrew((s) => s.selected !== null)
  const [hover, setHover] = useState(false)
  const ring = useRef<THREE.Mesh>(null)
  const prog = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (ring.current) {
      const m = ring.current.material as THREE.MeshBasicMaterial
      const target = waiting ? 0.75 + Math.sin(clock.elapsedTime * 5) * 0.25 : hover || selected ? 0.9 : 0
      m.opacity += (target - m.opacity) * 0.15
      m.color.set(waiting ? NEED : agent.color)
    }
    // anillo de progreso: se dibuja solo el tramo que avanzó (sin re-dibujar el componente)
    if (prog.current && working) {
      const p = Math.max(0.02, runProgress(agent, useCrew.getState().runs[agent.id]))
      prog.current.geometry.setDrawRange(0, Math.ceil(RING_SEG * p) * 6)
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
        {/* escritorio más ancho con un monitor curvo largo */}
        <Furn name="desk" scale={[1.5, 1, 1.15]} />
        <CurvedMonitor content={working ? screenTexture(agent.id, agent.color) : null} glow={waiting ? NEED : null} dark={dark} accent={waiting ? NEED : working ? agent.color : null} />
        <Furn name="computerKeyboard" position={[0, 0.38, -0.2]} rotation-y={Math.PI} />
        <Furn name="computerMouse" position={[0.25, 0.38, -0.21]} rotation-y={Math.PI} />
        <DeskProps agent={agent} />
        <Furn name="chairDesk" position={[0, 0, CHAIR_Z]} scale={CHAIR_SCALE} tint={{ carpet: agent.color }} />
      </group>
      {/* de noche, el resplandor de la pantalla sobre el escritorio y el piso (sin luces de verdad, para que no pese) */}
      {night && (working || waiting) && (
        <>
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.392, -0.05]}>
            <planeGeometry args={[1.3, 0.75]} />
            <meshBasicMaterial map={glowTexture()} color={waiting ? NEED : agent.color} transparent opacity={0.75} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, -0.3]}>
            <planeGeometry args={[2.6, 2.2]} />
            <meshBasicMaterial map={glowTexture()} color={waiting ? NEED : agent.color} transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
        </>
      )}
      {/* siempre sentado; cuando trabaja teclea */}
      <Character model={agent.model} pose="sit" position={SEAT} scale={CHAR_SCALE} animate={animate} typing={working && animate} />
      {/* trabajando: anillo de progreso alrededor del puesto */}
      {working && (
        <group rotation-x={-Math.PI / 2} position-y={0.025}>
          <mesh>
            <ringGeometry args={[1.0, 1.07, RING_SEG, 1]} />
            <meshBasicMaterial color={agent.color} transparent opacity={0.16} toneMapped={false} depthWrite={false} />
          </mesh>
          <mesh ref={prog} rotation-z={Math.PI / 2} scale={[-1, 1, 1]}>
            <ringGeometry args={[1.0, 1.07, RING_SEG, 1]} />
            <meshBasicMaterial color={agent.color} toneMapped={false} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        </group>
      )}
      {/* te necesita: cartelito amarillo arriba del escritorio */}
      {waiting && (
        <Billboard position={[0, 1.22, -0.35]}>
          <mesh>
            <circleGeometry args={[0.16, 32]} />
            <meshBasicMaterial map={needTexture()} transparent toneMapped={false} />
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
