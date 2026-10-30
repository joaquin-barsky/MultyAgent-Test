import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { AdaptiveDpr, CameraControls, Html, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { AGENT_BY_ID, FLOORS, agentsOn, type FloorId } from '../data/agents'
import type { Light } from '../sim/daylight'
import { useCrew } from '../sim/store'
import { Furn } from '../three/models'
import { Packets, type Spots } from '../three/Packets'
import { Station } from '../three/Station'
import { WallSign, paintedWall } from '../three/WallSign'
import { SupervisorDesk } from './BuildingScene'
import { slots } from './slots'

// Variante "planta libre": un solo piso grande, dividido en zonas por área.
// Atrás: Dirección y Marketing contra la pared del fondo. Adelante: Finanzas, Administración y Ventas, con una pared baja detrás.

const W = 24
const D = 15
const H = 2.4
const BACK_Z = -D / 2
const MID_Z = -1 // pared baja entre las dos filas de zonas
const LOW = 1.05 // alto de la pared baja

const PAL = { slab: '#2A323C', edge: '#1D232B', floor: '#DCD7CE', wall: '#2E3946', trim: '#1C222A', plaza: '#E9EDF1' }

interface Zone {
  id: FloorId
  x0: number
  x1: number
  z0: number
  z1: number
  /** pared donde va el cartel: la del fondo o la baja del medio */
  wall: 'back' | 'mid'
}

const ZONES: Zone[] = [
  { id: 'direccion', x0: -12, x1: -2, z0: BACK_Z, z1: MID_Z, wall: 'back' },
  { id: 'marketing', x0: -2, x1: 12, z0: BACK_Z, z1: MID_Z, wall: 'back' },
  { id: 'finanzas', x0: -12, x1: -4, z0: MID_Z, z1: D / 2, wall: 'mid' },
  { id: 'administracion', x0: -4, x1: 4, z0: MID_Z, z1: D / 2, wall: 'mid' },
  { id: 'ventas', x0: 4, x1: 12, z0: MID_Z, z1: D / 2, wall: 'mid' },
]
const ZONE_BY_ID = Object.fromEntries(ZONES.map((z) => [z.id, z])) as Record<FloorId, Zone>
const center = (z: Zone) => new THREE.Vector3((z.x0 + z.x1) / 2, 0, (z.z0 + z.z1) / 2)

const INMO_SPOTS: Spots = {
  mora: [-10.6, 0, -5.4], tomi: [-8.3, 0, -5.4], sol: [-9.45, 0, -2.6],
  lupa: [1.0, 0, -5.4], cata: [4.6, 0, -5.4], rolo: [8.2, 0, -5.4], fran: [2.8, 0, -2.6], mica: [6.4, 0, -2.6],
  nina: [-9.4, 0, 1.9], teo: [-6.6, 0, 1.9], gaby: [-8, 0, 4.7],
  juli: [-1.4, 0, 1.9], paz: [1.4, 0, 1.9], lucas: [-1.4, 0, 4.7], ana: [1.4, 0, 4.7],
  leo: [6.6, 0, 1.9], vale: [9.4, 0, 1.9], martin: [6.6, 0, 4.7], caro: [9.4, 0, 4.7],
}

// los rubros nuevos se acomodan solos dentro de cada zona
function buildSpots(): Spots {
  const s: Spots = {}
  for (const z of ZONES) {
    const list = agentsOn(z.id)
    const gen = slots(list.length)
    const cx = (z.x0 + z.x1) / 2
    const rowZ = z.z0 + (z.wall === 'back' ? 2.1 : 2.9)
    list.forEach((a, i) => {
      // con pocos escritorios van en el medio de la zona, más separados
      const few = list.length <= 2
      s[a.id] = INMO_SPOTS[a.id] ?? [cx + gen[i][0] * (few ? 1.6 : z.wall === 'back' ? 1.3 : 1), 0, rowZ + (few ? 1.4 : gen[i][1] * 2.8)]
    })
  }
  return s
}
const SPOTS = buildSpots()

function tintMix(hex: string, k: number) {
  return '#' + new THREE.Color(PAL.floor).lerp(new THREE.Color(hex), k).getHexString()
}

function ZoneArea({ z, light, focused, overview, touring }: { z: Zone; light: Light; focused: boolean; overview: boolean; touring: boolean }) {
  const f = FLOORS.find((x) => x.id === z.id)!
  const setFloor = useCrew((s) => s.setFloor)
  const busy = useCrew((s) => agentsOn(z.id).filter((a) => s.runs[a.id].status === 'working').length)
  const need = useCrew((s) => agentsOn(z.id).filter((a) => s.runs[a.id].status === 'waiting').length)
  const [hover, setHover] = useState(false)
  const c = center(z)
  const w = z.x1 - z.x0
  const d = z.z1 - z.z0
  const wallColor = paintedWall(f.tint)

  return (
    <group>
      {/* piso de la zona, del color del área */}
      <mesh
        position={[c.x, 0.012, c.z]}
        rotation-x={-Math.PI / 2}
        receiveShadow
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          setFloor(z.id)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHover(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHover(false)
          document.body.style.cursor = ''
        }}
      >
        <planeGeometry args={[w - 0.5, d - 0.5]} />
        <meshStandardMaterial color={tintMix(f.tint, hover || focused ? 0.3 : 0.17)} roughness={0.95} />
      </mesh>

      {/* pared pintada con el nombre del área */}
      {z.wall === 'back' ? (
        <group>
          <mesh position={[c.x, H / 2, BACK_Z + 0.08]} receiveShadow>
            <boxGeometry args={[w - 0.04, H, 0.16]} />
            <meshStandardMaterial color={wallColor} roughness={0.9} />
          </mesh>
          <WallSign name={f.name} width={Math.min(6.2, w * 0.62)} position={[z.x0 + Math.min(6.2, w * 0.62) / 2 + 0.6, 1.3, BACK_Z + 0.17]} />
        </group>
      ) : (
        <group>
          <mesh position={[c.x, LOW / 2, MID_Z]} castShadow receiveShadow>
            <boxGeometry args={[w - 0.04, LOW, 0.14]} />
            <meshStandardMaterial color={wallColor} roughness={0.9} />
          </mesh>
          <WallSign name={f.name} width={3.3} position={[z.x0 + 2.1, 0.54, MID_Z + 0.075]} />
        </group>
      )}

      {agentsOn(z.id).map((a) => (
        <Station key={a.id} agent={AGENT_BY_ID[a.id]} position={SPOTS[a.id]} lamps={light.lamps} dark={light.dark} showTag interactive animate />
      ))}

      {overview && !touring && (
        <Html position={z.wall === 'back' ? [z.x1 - 1.6, H + 0.45, BACK_Z + 0.2] : [z.x1 - 1.6, LOW + 0.45, MID_Z]} center zIndexRange={[9, 0]}>
          <button className="floor-tag" style={{ ['--c' as string]: f.tint }} onClick={() => setFloor(z.id)}>
            <span className="floor-n">{f.n}</span>
            <span className="flex flex-col items-start leading-tight">
              <span>{f.name}</span>
              {need ? (
                <span className="floor-sub need">{need === 1 ? '1 te necesita' : `${need} te necesitan`}</span>
              ) : (
                <span className="floor-sub">{busy ? `${busy} trabajando` : 'En pausa'}</span>
              )}
            </span>
          </button>
        </Html>
      )}
    </group>
  )
}

function Shell({ light }: { light: Light }) {
  return (
    <group>
      {/* base y piso general */}
      <mesh position={[0, -0.16, 0]} receiveShadow castShadow>
        <boxGeometry args={[W + 0.4, 0.32, D + 0.4]} />
        <meshStandardMaterial color={PAL.slab} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.004, 0]} receiveShadow>
        <boxGeometry args={[W, 0.008, D]} />
        <meshStandardMaterial color={PAL.floor} roughness={0.95} />
      </mesh>
      <RoundedBox args={[W + 3, 0.3, D + 3]} radius={0.12} position={[0, -0.42, 0.2]} receiveShadow>
        <meshStandardMaterial color={light.dark ? '#1A2530' : PAL.plaza} roughness={0.9} />
      </RoundedBox>
      {/* pared izquierda */}
      <mesh position={[-W / 2 + 0.06, H / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.12, H, D]} />
        <meshStandardMaterial color={PAL.wall} roughness={0.9} />
      </mesh>
      {/* vidrio a la derecha */}
      <mesh position={[W / 2 - 0.02, H / 2, 0]}>
        <boxGeometry args={[0.04, H, D]} />
        <meshPhysicalMaterial color="#9CC8E0" transparent opacity={0.22} roughness={0.05} />
      </mesh>
      {[-D / 2 + 0.1, -D / 4, 0, D / 4, D / 2 - 0.1].map((z) => (
        <mesh key={z} position={[W / 2 - 0.04, H / 2, z]}>
          <boxGeometry args={[0.07, H, 0.07]} />
          <meshStandardMaterial color={PAL.trim} />
        </mesh>
      ))}
      {/* separadores bajos de vidrio entre zonas */}
      {[
        { x: -2, z0: BACK_Z, z1: MID_Z },
        { x: -4, z0: MID_Z, z1: D / 2 - 1.2 },
        { x: 4, z0: MID_Z, z1: D / 2 - 1.2 },
      ].map((g) => (
        <mesh key={`${g.x}${g.z0}`} position={[g.x, 0.5, (g.z0 + g.z1) / 2]}>
          <boxGeometry args={[0.04, 1.0, g.z1 - g.z0]} />
          <meshPhysicalMaterial color="#BFE0EE" transparent opacity={0.3} roughness={0.05} />
        </mesh>
      ))}
      {/* algo de vida: plantas, café y un living en Dirección */}
      <Furn name="pottedPlant" position={[-11.3, 0, 6.8]} scale={1.4} />
      <Furn name="pottedPlant" position={[11.3, 0, -6.8]} scale={1.4} />
      <Furn name="pottedPlant" position={[-3.3, 0, -1.6]} scale={1.2} />
      <Furn name="kitchenBar" position={[11.2, 0, 6.6]} rotation-y={-Math.PI / 2} />
      <Furn name="kitchenCoffeeMachine" position={[11.25, 0.42, 6.6]} rotation-y={-Math.PI / 2} />
      <Furn name="loungeDesignSofa" position={[-11.3, 0, -2.2]} rotation-y={Math.PI / 2} tint={{ carpet: '#2E7DFF' }} />
      <Furn name="bookcaseClosedWide" position={[10.2, 0, BACK_Z + 0.45]} scale={1.1} />
    </group>
  )
}

/** espacio que tapan los paneles de la interfaz, en píxeles */
function insets(w: number) {
  return w >= 1024 ? { l: 16, r: 380, t: 84, b: 16 } : { l: 0, r: 0, t: 64, b: 170 }
}

function CameraRig({ floor, showcase }: { floor: FloorId | null; showcase: string | null }) {
  const ref = useRef<CameraControls>(null)
  const drift = useRef(0)
  const shotKey = useCrew((s) => s.showcaseShot)
  const size = useThree((s) => s.size)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ins = insets(size.width)
    camera.setViewOffset(size.width, size.height, -(ins.l - ins.r) / 2, -(ins.t - ins.b) / 2, size.width, size.height)
    camera.updateProjectionMatrix()
    const tanV = Math.tan((camera.fov * Math.PI) / 360)
    const tanFree = Math.min((tanV * (size.width - ins.l - ins.r)) / size.height, (tanV * (size.height - ins.t - ins.b)) / size.height)
    const fit = (r: number) => r / Math.sin(Math.atan(tanFree))

    const tour = showcase ? ZONE_BY_ID[showcase as FloorId] : null
    const zone = floor ? ZONE_BY_ID[floor] : null
    let t: THREE.Vector3
    let dist: number
    let az: number
    let polar: number
    if (tour) {
      // recorrido: paneo suave de zona en zona, sin cortes
      const side = shotKey % 2 ? 1 : -1
      const back = tour.wall === 'back'
      t = center(tour).add(new THREE.Vector3(0, 0.55, back ? -0.4 : 0.2))
      dist = fit(Math.hypot(tour.x1 - tour.x0, tour.z1 - tour.z0) * 0.36)
      az = 0.45 * side
      // a las zonas del fondo se las mira más desde arriba, para que no las tape la pared baja
      polar = back ? 0.9 : 1.08
      drift.current = 0.025 * -side
    } else if (zone) {
      // zona elegida: la cámara se acerca a ese equipo
      t = center(zone).add(new THREE.Vector3(0, 0.3, 0.3))
      dist = fit(Math.hypot(zone.x1 - zone.x0, zone.z1 - zone.z0) * 0.34)
      az = 0.22
      polar = 0.72
      drift.current = 0
    } else {
      t = new THREE.Vector3(0, 0.4, 0.6)
      dist = fit(Math.hypot(W, D) * 0.4)
      az = 0.42
      polar = 0.92
      drift.current = 0
    }
    const p = t.clone().add(new THREE.Vector3(Math.sin(polar) * Math.sin(az), Math.cos(polar), Math.sin(polar) * Math.cos(az)).multiplyScalar(dist))
    c.smoothTime = tour ? 1.8 : 0.6
    c.setLookAt(p.x, p.y, p.z, t.x, t.y, t.z, true)
  }, [floor, showcase, shotKey, size.width, size.height, camera])

  useFrame((_, dt) => {
    if (drift.current && ref.current) ref.current.rotate(drift.current * dt, 0, true)
  })

  return (
    <CameraControls
      ref={ref}
      makeDefault
      minPolarAngle={0.35}
      maxPolarAngle={1.35}
      minAzimuthAngle={-0.9}
      maxAzimuthAngle={1.2}
      minDistance={5}
      maxDistance={70}
      truckSpeed={0}
    />
  )
}

export default function OpenPlanScene({ light }: { light: Light }) {
  const floor = useCrew((s) => s.floor)
  const select = useCrew((s) => s.select)
  const selected = useCrew((s) => s.selected)
  const showcase = useCrew((s) => s.showcase)
  return (
    <div className="scene-area absolute inset-0" style={{ pointerEvents: selected ? 'none' : 'auto' }}>
      <Canvas shadows dpr={[1, 1.75]} camera={{ position: [14, 18, 22], fov: 30, near: 0.1, far: 300 }} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }} onPointerMissed={() => select(null)}>
        <AdaptiveDpr />
        <hemisphereLight args={light.hemi} />
        <directionalLight
          position={[light.sun.pos[0] * 1.4, light.sun.pos[1] * 1.4, light.sun.pos[2] * 1.4]}
          intensity={light.sun.intensity}
          color={light.sun.color}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-16}
          shadow-camera-right={16}
          shadow-camera-top={14}
          shadow-camera-bottom={-14}
          shadow-camera-far={90}
          shadow-bias={-0.0004}
        />
        {/* luz de oficina */}
        <pointLight position={[-6, 3.2, -3]} color={light.lamps > 0 ? '#FFD9A3' : '#FFF6EA'} intensity={light.lamps > 0 ? 26 * light.lamps : 12} distance={18} decay={1.4} />
        <pointLight position={[6, 3.2, 3]} color={light.lamps > 0 ? '#FFD9A3' : '#FFF6EA'} intensity={light.lamps > 0 ? 26 * light.lamps : 12} distance={18} decay={1.4} />
        <Shell light={light} />
        {ZONES.map((z) => (
          <ZoneArea key={z.id} z={z} light={light} focused={floor === z.id} overview={!floor} touring={!!showcase} />
        ))}
        {/* oficina vidriada de Bruno, dentro de Dirección */}
        <group position={[-7.4, 0, -5.2]}>
          <SupervisorDesk showTag lamps={light.lamps} />
        </group>
        {!showcase && <Packets spots={SPOTS} lift={1.4} y={1.1} />}
        <CameraRig floor={floor} showcase={showcase} />
      </Canvas>
    </div>
  )
}
