import { useEffect, useRef, useState } from 'react'
import { Html } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { Agent } from '../data/agents'
import { useCrew } from '../sim/store'
import { Character, Furn, type Pose } from './models'

export interface StationProps {
  agent: Agent
  position: [number, number, number]
  rotation?: number
  lamps: number
  dark: boolean
  showTag: boolean
  interactive: boolean
  /** escritorios del piso (x, y, z) para poder ir caminando hasta otro */
  spots: Record<string, [number, number, number]>
  /** lugares del piso donde van a tomar un café */
  breakArea: { focus: [number, number]; slots: [number, number][] }
  floorId: string
  aisleZ: number
}

const S = 1.3 // escala del puesto
const SEAT = new THREE.Vector3(0, 0.12, -0.5)
const STAND = new THREE.Vector3(0.62, 0, -0.1)
const SPEED = 1.15 // unidades del piso por segundo

// quién está parado en cada lugar de descanso (clave piso:lugar), para que no se amontonen
const taken = new Map<string, string>()
const release = (id: string) => {
  for (const [k, v] of taken) if (v === id) taken.delete(k)
}

interface Walk {
  pts: THREE.Vector3[] // en coordenadas del puesto
  lens: number[]
  total: number
  wait: number
  t0: number
  face: number
}

function makeWalk(worldPts: [number, number][], me: [number, number], wait: number, t0: number, faceTo: [number, number]): Walk {
  const pts = worldPts.map(([x, z]) => new THREE.Vector3((x - me[0]) / S, 0, (z - me[1]) / S))
  pts.unshift(STAND.clone())
  const lens = [0]
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + pts[i].distanceTo(pts[i - 1]))
  const last = worldPts[worldPts.length - 1]
  return { pts, lens, total: lens[lens.length - 1], wait, t0, face: Math.atan2(faceTo[0] - last[0], faceTo[1] - last[1]) }
}

/** posición sobre el recorrido y hacia dónde mira */
function along(w: Walk, d: number, out: THREE.Vector3) {
  let i = 1
  while (i < w.lens.length - 1 && w.lens[i] < d) i++
  const seg = Math.max(1e-4, w.lens[i] - w.lens[i - 1])
  const k = Math.min(1, Math.max(0, (d - w.lens[i - 1]) / seg))
  out.copy(w.pts[i - 1]).lerp(w.pts[i], k)
  return Math.atan2(w.pts[i].x - w.pts[i - 1].x, w.pts[i].z - w.pts[i - 1].z)
}

export function Station({ agent, position, rotation = 0, lamps, dark, showTag, interactive, spots, breakArea, floorId, aisleZ }: StationProps) {
  const run = useCrew((s) => s.runs[agent.id])
  const selected = useCrew((s) => s.selected === agent.id)
  const select = useCrew((s) => s.select)
  const panelOpen = useCrew((s) => s.selected !== null)
  const tripId = useCrew((s) => s.trips.find((t) => t.from === agent.id)?.id)
  const tripTo = useCrew((s) => s.trips.find((t) => t.from === agent.id)?.to)
  const [hover, setHover] = useState(false)
  const [walkPose, setWalkPose] = useState<Pose | null>(null)
  const working = run.status === 'working'
  const body = useRef<THREE.Group>(null)
  const ring = useRef<THREE.Mesh>(null)
  const walk = useRef<Walk | null>(null)
  const nextBreak = useRef(-1)
  const tmp = useRef(new THREE.Vector3())
  const me: [number, number] = [position[0], position[2]]

  // pasar trabajo: va por el pasillo hasta el escritorio del otro y vuelve
  useEffect(() => {
    if (!tripId || !tripTo || !interactive) return
    const to = spots[tripTo]
    if (!to) return
    const tx = to[0] - 1.05
    const tz = to[2] + 0.75
    walk.current = makeWalk([[me[0] + 0.8, aisleZ], [tx, aisleZ], [tx, tz]], me, 1.8, -1, [to[0], to[2]])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, interactive])

  // si salís del piso, vuelven a su lugar
  useEffect(() => {
    if (!interactive) {
      walk.current = null
      setWalkPose(null)
      release(agent.id)
    }
    return () => release(agent.id)
  }, [interactive, agent.id])

  useFrame(({ clock }, dt) => {
    const g = body.current
    if (!g) return
    const now = clock.elapsedTime
    if (nextBreak.current < 0) nextBreak.current = now + 14 + Math.random() * 40

    // de vez en cuando, si está libre, se va a tomar un café
    if (interactive && !walk.current && !working && now > nextBreak.current) {
      nextBreak.current = now + 30 + Math.random() * 45
      // elige un lugar libre; si están todos ocupados, espera a la próxima
      const free = breakArea.slots.map((_, i) => i).filter((i) => !taken.has(`${floorId}:${i}`))
      if (free.length) {
        const i = free[Math.floor(Math.random() * free.length)]
        const [sx, sz] = breakArea.slots[i]
        taken.set(`${floorId}:${i}`, agent.id)
        walk.current = makeWalk([[me[0] + 0.8, aisleZ], [sx, aisleZ], [sx, sz]], me, 3.5, now, breakArea.focus)
      }
    }

    const w = walk.current
    if (w) {
      if (w.t0 < 0) w.t0 = now
      const el = now - w.t0
      const v = SPEED / S
      const tWalk = w.total / v
      let pose: Pose = 'walk'
      if (el < tWalk) {
        g.rotation.y = along(w, el * v, g.position)
      } else if (el < tWalk + w.wait) {
        along(w, w.total, g.position)
        g.rotation.y += (w.face - g.rotation.y) * Math.min(1, dt * 6)
        pose = 'idle'
      } else if (el < 2 * tWalk + w.wait) {
        g.rotation.y = along(w, w.total - (el - tWalk - w.wait) * v, tmp.current) + Math.PI
        g.position.copy(tmp.current)
      } else {
        walk.current = null
        release(agent.id)
      }
      if (walk.current && pose !== walkPose) setWalkPose(pose)
      if (!walk.current) setWalkPose(null)
    } else {
      g.position.lerp(working ? SEAT : STAND, 1 - Math.exp(-dt * 6))
      g.rotation.y += ((working ? 0 : -0.9) - g.rotation.y) * (1 - Math.exp(-dt * 6))
    }

    if (ring.current) {
      const m = ring.current.material as THREE.MeshBasicMaterial
      const target = hover || selected ? 0.9 : working ? 0.28 + Math.sin(now * 3) * 0.12 : 0
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
  // si está caminando manda la caminata; si no, sentado cuando trabaja
  const pose: Pose = walkPose ?? (working ? 'sit' : 'idle')

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
        <Furn name="desk" />
        <Furn name="computerScreen" position={[-0.08, 0.38, -0.04]} rotation-y={Math.PI} tint={{ metalDark: screen }} />
        <Furn name="computerKeyboard" position={[-0.08, 0.38, -0.2]} rotation-y={Math.PI} />
        <Furn name="lampSquareTable" position={[0.26, 0.38, -0.02]} tint={{ lamp: lamps > 0 ? 'glow:#FFD58A' : '#F3E6C4' }} />
        <Furn name="chairDesk" position={[0, 0, -0.52]} tint={{ carpet: agent.color }} />
      </group>
      <group ref={body} position={STAND.toArray()}>
        <Character model={agent.model} pose={pose} scale={0.62} animate={interactive} />
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
