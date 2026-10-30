import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { CameraControls, Html, Stars, AdaptiveDpr, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { FLOORS, SUPERVISOR, agentsOn, type FloorId } from '../data/agents'
import type { Light } from '../sim/daylight'
import { useCrew } from '../sim/store'
import { Character, Furn } from '../three/models'
import { Packets, type Spots } from '../three/Packets'
import { CHAIR_SCALE, CHAIR_Z, CHAR_SCALE, SEAT, Station } from '../three/Station'
import { WallSign, paintedWall } from '../three/WallSign'
import { CurvedMonitor } from '../three/CurvedMonitor'

export type BuildingStyle = 'vidrio'

const W = 10
const D = 8.4
const H = 2.4
const BASE = 0.35
const floorY = (n: number) => BASE + (n - 1) * H

const PAL = { slab: '#2A323C', edge: '#1D232B', floor: '#D9D4CB', wall: '#39434F', trim: '#1C222A', col: '#1C222A', plaza: '#E9EDF1', street: '#CBD2D9' }

// dos filas de escritorios por piso: atrás (z negativo) y adelante
const BACK = -1.0
const FRONT = 1.9
const LAYOUT: Record<string, [number, number]> = {
  mora: [-2.7, BACK], tomi: [-0.6, BACK], sol: [-1.65, FRONT],
  lupa: [-2.6, BACK], cata: [0, BACK], rolo: [2.6, BACK], fran: [-1.3, FRONT], mica: [1.3, FRONT],
  nina: [-1.4, BACK], teo: [1.4, BACK], gaby: [0, FRONT],
  juli: [-1.4, BACK], paz: [1.4, BACK], lucas: [-1.4, FRONT], ana: [1.4, FRONT],
  leo: [-1.4, BACK], vale: [1.4, BACK], martin: [-1.4, FRONT], caro: [1.4, FRONT],
}

function buildSpots(): Spots {
  const s: Spots = {}
  for (const f of FLOORS) for (const a of agentsOn(f.id)) s[a.id] = [LAYOUT[a.id]?.[0] ?? 0, floorY(f.n), LAYOUT[a.id]?.[1] ?? 0]
  return s
}
const SPOTS = buildSpots()

const BZ = -D / 2 + 0.3 // pegado a la pared de atrás

/** mezcla el color del área con el piso, para alfombras suaves */
function tintMix(hex: string, k: number) {
  const c = new THREE.Color(PAL.floor).lerp(new THREE.Color(hex), k)
  return '#' + c.getHexString()
}

function Decor({ id }: { id: FloorId }) {
  switch (id) {
    case 'direccion':
      return (
        <>
          <Furn name="loungeDesignSofa" position={[-4.3, 0, 0.6]} rotation-y={Math.PI / 2} tint={{ carpet: '#2E7DFF' }} />
          <Furn name="tableCoffeeGlass" position={[-3.5, 0, 0.6]} />
          <Furn name="bookcaseClosedWide" position={[-1.6, 0, BZ]} scale={1.1} />
          <Furn name="pottedPlant" position={[4.5, 0, 3.6]} scale={1.3} />
        </>
      )
    case 'marketing':
      return (
        <>
          <Furn name="bookcaseClosedWide" position={[-1.7, 0, BZ]} scale={1.1} />
          <Furn name="bookcaseClosedWide" position={[1.7, 0, BZ]} scale={1.1} />
          <Furn name="pottedPlant" position={[-4.5, 0, 3.6]} scale={1.3} />
          <Furn name="pottedPlant" position={[4.5, 0, 3.6]} scale={1.3} />
        </>
      )
    case 'finanzas':
      return (
        <>
          <Furn name="bookcaseClosed" position={[0, 0, BZ]} scale={1.2} />
          <Furn name="books" position={[0, 0.42, BZ]} />
          <Furn name="pottedPlant" position={[-4.5, 0, 3.6]} scale={1.3} />
          <Furn name="plantSmall3" position={[4.5, 0, 3.6]} scale={1.6} />
          <Furn name="loungeDesignChair" position={[-4.2, 0, 0.4]} rotation-y={Math.PI / 2} />
        </>
      )
    case 'administracion':
      return (
        <>
          <Furn name="bookcaseClosedWide" position={[0, 0, BZ]} scale={1.1} />
          <Furn name="books" position={[0, 0.48, BZ + 0.03]} />
          <Furn name="pottedPlant" position={[4.5, 0, 3.6]} scale={1.3} />
          <Furn name="loungeDesignChair" position={[-4.3, 0, 0.4]} rotation-y={Math.PI / 2} />
        </>
      )
    case 'ventas':
      return (
        <>
          <Furn name="kitchenBar" position={[-4.4, 0, BZ]} />
          <Furn name="kitchenBar" position={[-3.97, 0, BZ]} />
          <Furn name="kitchenCoffeeMachine" position={[-4.4, 0.42, BZ - 0.02]} />
          <Furn name="stoolBar" position={[-4.2, 0, BZ + 0.8]} />
          <Furn name="pottedPlant" position={[4.5, 0, 3.6]} scale={1.4} />
          <Furn name="loungeDesignChair" position={[4.4, 0, 0.4]} rotation-y={-Math.PI / 2} />
        </>
      )
  }
}

function Floor({ f, light, focused, overview, showcased, touring }: { f: (typeof FLOORS)[number]; light: Light; focused: boolean; overview: boolean; showcased: boolean; touring: boolean }) {
  const setFloor = useCrew((s) => s.setFloor)
  const busy = useCrew((s) => agentsOn(f.id).filter((a) => s.runs[a.id].status === 'working').length)
  const need = useCrew((s) => agentsOn(f.id).filter((a) => s.runs[a.id].status === 'waiting').length)
  const [hover, setHover] = useState(false)
  const y = floorY(f.n)
  const agents = agentsOn(f.id)

  const click = (e: ThreeEvent<MouseEvent>) => {
    if (!overview) return
    e.stopPropagation()
    setFloor(f.id)
  }

  return (
    <group position={[0, y, 0]} visible={(overview && !touring) || focused || showcased}>
      <group
        onClick={click}
        onPointerOver={(e) => {
          if (!overview) return
          e.stopPropagation()
          setHover(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHover(false)
          document.body.style.cursor = ''
        }}
      >
        <mesh position={[0, -0.12, 0]} receiveShadow castShadow>
          <boxGeometry args={[W + 0.3, 0.24, D + 0.3]} />
          <meshStandardMaterial color={PAL.slab} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.12, D / 2 + 0.152]}>
          <boxGeometry args={[W + 0.3, 0.24, 0.01]} />
          <meshBasicMaterial color={hover || focused ? f.tint : PAL.edge} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.005, 0]} receiveShadow>
          <boxGeometry args={[W, 0.01, D]} />
          <meshStandardMaterial color={PAL.floor} roughness={0.9} />
        </mesh>
        {/* fachada de atrás: muro cortina de vidrio con parantes */}
        <mesh position={[0, H / 2, -D / 2 + 0.02]}>
          <boxGeometry args={[W - 0.1, H - 0.02, 0.03]} />
          <meshStandardMaterial color={light.windows} emissive={light.windows} emissiveIntensity={light.dark ? 0.55 : 0.35} roughness={0.15} metalness={0.2} />
        </mesh>
        {Array.from({ length: W + 1 }, (_, i) => (
          <mesh key={i} position={[-W / 2 + i, H / 2, -D / 2 + 0.06]}>
            <boxGeometry args={[0.06, H, 0.06]} />
            <meshStandardMaterial color={PAL.trim} roughness={0.6} />
          </mesh>
        ))}
        <mesh position={[0, 0.55, -D / 2 + 0.06]}>
          <boxGeometry args={[W, 0.05, 0.05]} />
          <meshStandardMaterial color={PAL.trim} roughness={0.6} />
        </mesh>
        {/* pared lateral y vidrio del otro lado */}
        <mesh position={[-W / 2 + 0.06, H / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.12, H, D]} />
          <meshStandardMaterial color={focused || showcased ? paintedWall(f.tint) : PAL.wall} roughness={0.9} />
        </mesh>
        <mesh position={[W / 2 - 0.02, H / 2, 0]}>
          <boxGeometry args={[0.04, H - 0.02, D]} />
          <meshPhysicalMaterial color="#9CC8E0" transparent opacity={0.28} roughness={0.05} metalness={0.1} />
        </mesh>
        {[-W / 2 + 0.12, W / 2 - 0.12].map((x) => (
          <mesh key={x} position={[x, H / 2, D / 2 - 0.12]} castShadow>
            <boxGeometry args={[0.22, H, 0.22]} />
            <meshStandardMaterial color={PAL.col} roughness={0.7} />
          </mesh>
        ))}
        {/* paneles de luz en el techo (no se ven desde arriba en la vista de piso) */}
        {[-3, 0, 3].map((x) =>
          [-1.4, 2.2].map((z) => (
            <mesh key={`l${x}${z}`} position={[x, H - 0.01, z]} rotation-x={Math.PI / 2} visible={overview}>
              <planeGeometry args={[1.6, 0.5]} />
              <meshBasicMaterial color={light.lamps > 0 ? '#FFE7BF' : '#F2EFEA'} toneMapped={false} />
            </mesh>
          )),
        )}
        <pointLight position={[0, H - 0.3, 0.6]} color={light.lamps > 0 ? '#FFD9A3' : '#FFF6EA'} intensity={light.lamps > 0 ? 9 * light.lamps : 4.5} distance={10} decay={1.3} />
      </group>

      {/* alfombras bajo cada fila de escritorios, con el color del área */}
      {[BACK, FRONT].map((z) => (
        <Furn key={z} name="rugRounded" position={[f.id === 'direccion' ? -1.6 : 0, 0.012, z - 0.3]} scale={[f.id === 'direccion' ? 3.4 : f.id === 'marketing' ? 5.4 : 3.8, 1, 2.1]} tint={{ carpet: tintMix(f.tint, 0.22), carpetDarker: tintMix(f.tint, 0.36) }} />
      ))}
      <Decor id={f.id} />
      {/* cartel del equipo en la pared lateral (se ve en el recorrido y al entrar al piso) */}
      {(focused || showcased) && <WallSign name={f.name} width={5.4} position={[-W / 2 + 0.135, 1.25, -0.6]} rotation-y={Math.PI / 2} />}
      {f.id === 'direccion' && <SupervisorDesk showTag={focused} lamps={light.lamps} />}

      {agents.map((a) => (
        <Station key={a.id} agent={a} position={[SPOTS[a.id][0], 0, SPOTS[a.id][2]]} lamps={light.lamps} dark={light.dark} showTag={focused} interactive={focused} animate={focused || showcased} />
      ))}

      {overview && !touring && (
        <Html position={[-W / 2 - 0.4, 0.9, D / 2]} center zIndexRange={[9, 0]}>
          <button className="floor-tag" style={{ ['--c' as string]: f.tint }} onClick={() => setFloor(f.id)}>
            <span className="floor-n">{f.n}</span>
            <span className="flex flex-col items-start leading-tight">
              <span>{f.name}</span>
              {need ? <span className="floor-sub need">{need === 1 ? '1 te necesita' : `${need} te necesitan`}</span> : <span className="floor-sub">{busy ? `${busy} trabajando` : 'En pausa'}</span>}
            </span>
          </button>
        </Html>
      )}
    </group>
  )
}

export function SupervisorDesk({ showTag, lamps, walls = true }: { showTag: boolean; lamps: number; walls?: boolean }) {
  const setChat = useCrew((s) => s.setChat)
  const panelOpen = useCrew((s) => s.selected !== null)
  const [hover, setHover] = useState(false)
  return (
    <group position={[2.8, 0, 0.2]}>
      {/* oficina vidriada de Bruno (en planta libre va sin paredes) */}
      {walls && (
        <>
      <mesh position={[0, 1.2, 2.3]}>
        <boxGeometry args={[4.2, 2.4, 0.03]} />
        <meshPhysicalMaterial color="#CFE6F2" transparent opacity={0.2} roughness={0.05} />
      </mesh>
      <mesh position={[-2.1, 1.2, 0]}>
        <boxGeometry args={[0.03, 2.4, 4.6]} />
        <meshPhysicalMaterial color="#CFE6F2" transparent opacity={0.2} roughness={0.05} />
      </mesh>
        </>
      )}
      <group
        scale={1.3}
        onClick={(e) => {
          e.stopPropagation()
          setChat(true)
        }}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <Furn name="desk" scale={[1.5, 1, 1.15]} />
        <CurvedMonitor glow="#9BB8D8" dark={false} />
        <Furn name="chairDesk" position={[0, 0, CHAIR_Z]} scale={CHAIR_SCALE} tint={{ carpet: '#1F2A37' }} />
        <Character model={SUPERVISOR.model} pose="sit" position={SEAT} scale={CHAR_SCALE} animate={showTag} />
      </group>
      {showTag && hover && !panelOpen && (
        <Html position={[0, 1.6, -0.2]} center zIndexRange={[9, 0]} style={{ pointerEvents: 'none' }}>
          <div className="tag flex items-center gap-2 rounded-full py-1 pl-1 pr-3">
            <span className="size-7 overflow-hidden rounded-full" style={{ background: SUPERVISOR.soft }}>
              <img src={SUPERVISOR.avatar} alt="" className="size-full object-cover" />
            </span>
            <span className="flex flex-col text-left leading-tight">
              <span className="text-[13px] font-semibold">Bruno</span>
              <span className="tag-sub text-[11px]">Supervisor</span>
            </span>
          </div>
        </Html>
      )}
    </group>
  )
}

function Ground({ visible }: { visible: boolean }) {
  return (
    <group visible={visible}>
      <mesh position={[0, BASE / 2 - 0.02, 0]} receiveShadow castShadow>
        <boxGeometry args={[W + 1.2, BASE, D + 1.2]} />
        <meshStandardMaterial color={PAL.edge} roughness={0.9} />
      </mesh>
      <RoundedBox args={[W + 4, 0.3, D + 4.5]} radius={0.12} position={[0, -0.16, 0.5]} receiveShadow>
        <meshStandardMaterial color={PAL.plaza} roughness={0.9} />
      </RoundedBox>
      <mesh position={[0, 0.005, D / 2 + 1.7]} receiveShadow>
        <boxGeometry args={[W + 3.4, 0.01, 1.1]} />
        <meshStandardMaterial color={PAL.street} roughness={1} />
      </mesh>
    </group>
  )
}

function Roof({ visible }: { visible: boolean }) {
  const y = floorY(FLOORS.length + 1)
  return (
    <group position={[0, y, 0]} visible={visible}>
      <mesh position={[0, -0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[W + 0.3, 0.24, D + 0.3]} />
        <meshStandardMaterial color={PAL.slab} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.18, -D / 2 + 0.05]} castShadow>
        <boxGeometry args={[W + 0.3, 0.36, 0.1]} />
        <meshStandardMaterial color={PAL.edge} />
      </mesh>
      <mesh position={[2.6, 0.45, -1]} castShadow>
        <boxGeometry args={[1.6, 0.9, 1.6]} />
        <meshStandardMaterial color={PAL.edge} />
      </mesh>
    </group>
  )
}

const BUILDING_BOX = new THREE.Box3(new THREE.Vector3(-W / 2 - 1.4, 0, -D / 2), new THREE.Vector3(W / 2 + 0.4, floorY(FLOORS.length + 1) + 0.4, D / 2))

/** espacio que tapan los paneles de la interfaz, en píxeles */
function insets(w: number, _overview = false) {
  return w >= 1024 ? { l: 16, r: 380, t: 84, b: 16 } : { l: 0, r: 0, t: 64, b: 170 }
}

function CameraRig({ floor, showcase }: { floor: FloorId | null; showcase: string | null }) {
  const shotKey = useCrew((s) => s.showcaseShot)
  const ref = useRef<CameraControls>(null)
  const drift = useRef(0)
  const lastTourFloor = useRef<FloorId | null>(null)
  const shot = useRef(0)
  const size = useThree((s) => s.size)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera

  useEffect(() => {
    const c = ref.current
    if (!c) return
    if (import.meta.env.DEV) (window as unknown as { __cc: unknown }).__cc = c
    const ins = insets(size.width, !floor && !showcase)
    // corre el centro de la imagen al centro del espacio libre entre paneles
    camera.setViewOffset(size.width, size.height, -(ins.l - ins.r) / 2, -(ins.t - ins.b) / 2, size.width, size.height)
    camera.updateProjectionMatrix()

    const tanV = Math.tan((camera.fov * Math.PI) / 360)
    const tanFree = Math.min((tanV * (size.width - ins.l - ins.r)) / size.height, (tanV * (size.height - ins.t - ins.b)) / size.height)
    const narrow = size.width < 1024

    let t: THREE.Vector3
    let dist: number
    let az: number
    let polar: number
    const tour = showcase ? FLOORS.find((x) => x.id === showcase) : null
    if (tour) {
      // recorrido: el equipo del piso entero, de cerca y un poco de costado
      shot.current += 1
      const side = shot.current % 2 ? 1 : -1
      t = new THREE.Vector3(0, floorY(tour.n) + 0.5, 0.45)
      // de costado (del lado de las caras), alternando dos ángulos
      dist = (narrow ? 2.9 : 2.3) / Math.sin(Math.atan(tanFree))
      az = side > 0 ? 1.15 : 0.8
      polar = side > 0 ? 1.05 : 1.12
      if (import.meta.env.DEV) {
        const q = new URLSearchParams(location.search)
        if (q.get('taz')) az = Number(q.get('taz'))
        if (q.get('tpol')) polar = Number(q.get('tpol'))
        if (q.get('tdist')) dist = Number(q.get('tdist'))
      }
      drift.current = 0.03 * -side
    } else if (!floor) {
      const sp = BUILDING_BOX.getBoundingSphere(new THREE.Sphere())
      t = sp.center
      dist = (sp.radius * (narrow ? 1.02 : 0.86)) / Math.sin(Math.atan(tanFree))
      az = 0.6
      polar = 1.2
    } else {
      // vista de piso: desde arriba, solo ese piso
      const f = FLOORS.find((x) => x.id === floor)!
      t = new THREE.Vector3(0, floorY(f.n) + 0.3, 0.4)
      const r = Math.hypot(W / 2, D / 2)
      dist = (r * (narrow ? 1.05 : 0.92)) / Math.sin(Math.atan(tanFree))
      az = 0.28
      polar = 0.62
    }
    const p = t.clone().add(new THREE.Vector3(Math.sin(polar) * Math.sin(az), Math.cos(polar), Math.sin(polar) * Math.cos(az)).multiplyScalar(dist))
    c.smoothTime = tour ? 1.3 : 0.5
    if (!tour) drift.current = 0
    // al pasar a otro piso durante el recorrido, corte directo (si no, se ve el vacío entre pisos)
    const tourFloor = (tour?.id ?? null) as FloorId | null
    const cut = !!tourFloor && !!lastTourFloor.current && tourFloor !== lastTourFloor.current
    lastTourFloor.current = tourFloor
    // solo desarrollo: ?cam=x,y,z,tx,ty,tz fija la cámara para revisar de cerca
    const cam = import.meta.env.DEV ? new URLSearchParams(location.search).get('cam') : null
    if (cam) {
      const v = cam.split(',').map(Number)
      c.setLookAt(v[0], v[1], v[2], v[3], v[4], v[5], false)
      return
    }
    c.setLookAt(p.x, p.y, p.z, t.x, t.y, t.z, !cut)
  }, [floor, showcase, shotKey, size.width, size.height, camera])

  // mientras muestra a alguien, la cámara gira despacito alrededor
  useFrame((_, dt) => {
    if (drift.current && ref.current) ref.current.rotate(drift.current * dt, 0, true)
  })

  return (
    <CameraControls
      ref={ref}
      makeDefault
      minPolarAngle={0.3}
      maxPolarAngle={1.45}
      minAzimuthAngle={-0.6}
      maxAzimuthAngle={1.4}
      minDistance={4}
      maxDistance={80}
      truckSpeed={0}
      smoothTime={0.5}
    />
  )
}

export default function BuildingScene({ light }: { style: BuildingStyle; light: Light }) {
  const floor = useCrew((s) => s.floor)
  const select = useCrew((s) => s.select)
  const selected = useCrew((s) => s.selected)
  const showcase = useCrew((s) => s.showcase)
  const showFloor = showcase
  const spots = useMemo(() => SPOTS, [])
  return (
    <div className="scene-area absolute inset-0" style={{ pointerEvents: selected ? 'none' : 'auto' }}>
      <Canvas shadows dpr={[1, 1.75]} camera={{ position: [18, 14, 22], fov: 30, near: 0.1, far: 300 }} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }} onPointerMissed={() => select(null)}>
        <AdaptiveDpr />
        {light.dark && !floor && <Stars radius={70} depth={30} count={1600} factor={3} saturation={0} fade speed={0.5} />}
        <hemisphereLight args={light.hemi} />
        <directionalLight
          position={light.sun.pos}
          intensity={light.sun.intensity}
          color={light.sun.color}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-12}
          shadow-camera-right={12}
          shadow-camera-top={18}
          shadow-camera-bottom={-8}
          shadow-camera-far={70}
          shadow-bias={-0.0004}
        />
        <Ground visible={!floor && !showcase} />
        {FLOORS.map((f) => (
          <Floor key={f.id} f={f} light={light} focused={floor === f.id} overview={!floor} showcased={showFloor === f.id} touring={!!showcase} />
        ))}
        <Roof visible={!floor && !showcase} />
        {!floor && !showcase && <Packets spots={spots} lift={0.3} y={1} bulge={[0, 0, 4.4]} />}
        <CameraRig floor={floor} showcase={showcase} />
      </Canvas>
    </div>
  )
}
