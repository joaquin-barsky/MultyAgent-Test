import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber'
import { CameraControls, Html, Stars, AdaptiveDpr, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { FLOORS, SUPERVISOR, agentsOn, type FloorId } from '../data/agents'
import type { Light } from '../sim/daylight'
import { useCrew } from '../sim/store'
import { Character, Furn } from '../three/models'
import { Packets, type Spots } from '../three/Packets'
import { Station } from '../three/Station'

export type BuildingStyle = 'maqueta' | 'vidrio'

const W = 10
const D = 4.4
const H = 2.4
const BASE = 0.35
const floorY = (n: number) => BASE + (n - 1) * H

const PALETTE = {
  maqueta: { slab: '#F3F0EB', edge: '#E0DAD1', floor: '#E6D3B6', wall: '#FBF9F6', trim: '#FFFFFF', col: '#F6F3EE', plaza: '#FFFFFF', street: '#EDE8E0' },
  vidrio: { slab: '#2A323C', edge: '#1D232B', floor: '#D9D4CB', wall: '#39434F', trim: '#1C222A', col: '#1C222A', plaza: '#E9EDF1', street: '#CBD2D9' },
}

const XS: Record<number, number[]> = { 1: [0], 2: [-2.2, 2.2], 3: [-3.3, 0, 3.3] }

/** posición de cada agente en el edificio */
function buildSpots(): Spots {
  const s: Spots = {}
  for (const f of FLOORS) {
    const list = agentsOn(f.id)
    const xs = f.id === 'direccion' ? [-2.4] : XS[list.length]
    list.forEach((a, i) => (s[a.id] = [xs[i], floorY(f.n), 0.35]))
  }
  return s
}
const SPOTS = buildSpots()

function Decor({ id }: { id: FloorId }) {
  switch (id) {
    case 'direccion':
      return (
        <>
          <Furn name="loungeDesignSofa" position={[-4.2, 0, -1.2]} rotation-y={Math.PI / 2} tint={{ carpet: '#2E7DFF' }} />
          <Furn name="tableCoffeeGlass" position={[-3.5, 0, -1.2]} />
          <Furn name="pottedPlant" position={[4.5, 0, -1.8]} scale={1.3} />
          <Furn name="bookcaseClosedWide" position={[0, 0, -2.05]} scale={1.1} />
        </>
      )
    case 'marketing':
      return (
        <>
          <Furn name="bookcaseClosedWide" position={[-1.6, 0, -2.05]} scale={1.1} />
          <Furn name="bookcaseClosedWide" position={[1.6, 0, -2.05]} scale={1.1} />
          <Furn name="pottedPlant" position={[-4.6, 0, -1.8]} scale={1.3} />
          <Furn name="pottedPlant" position={[4.6, 0, -1.8]} scale={1.3} />
        </>
      )
    case 'finanzas':
      return (
        <>
          <Furn name="bookcaseClosed" position={[0, 0, -2.05]} scale={1.2} />
          <Furn name="books" position={[0, 0.42, -2.05]} />
          <Furn name="pottedPlant" position={[-4.6, 0, -1.8]} scale={1.3} />
          <Furn name="plantSmall3" position={[4.6, 0, -1.8]} scale={1.6} />
        </>
      )
    case 'administracion':
      return (
        <>
          <Furn name="bookcaseClosedWide" position={[0, 0, -2.05]} scale={1.1} />
          <Furn name="books" position={[0, 0.48, -2.02]} />
          <Furn name="pottedPlant" position={[4.6, 0, -1.8]} scale={1.3} />
          <Furn name="loungeDesignChair" position={[-4.3, 0, -1.4]} rotation-y={Math.PI / 2} />
        </>
      )
    case 'ventas':
      return (
        <>
          <Furn name="kitchenBar" position={[-4.4, 0, -1.95]} />
          <Furn name="kitchenBar" position={[-3.97, 0, -1.95]} />
          <Furn name="kitchenCoffeeMachine" position={[-4.4, 0.42, -1.97]} />
          <Furn name="stoolBar" position={[-4.2, 0, -1.2]} />
          <Furn name="pottedPlant" position={[4.6, 0, -1.8]} scale={1.4} />
          <Furn name="loungeDesignChair" position={[0, 0, -1.5]} />
        </>
      )
  }
}

function Floor({ f, style, light, focused, overview }: { f: (typeof FLOORS)[number]; style: BuildingStyle; light: Light; focused: boolean; overview: boolean }) {
  const pal = PALETTE[style]
  const setFloor = useCrew((s) => s.setFloor)
  const busy = useCrew((s) => agentsOn(f.id).filter((a) => s.runs[a.id].status === 'working').length)
  const [hover, setHover] = useState(false)
  const y = floorY(f.n)
  const agents = agentsOn(f.id)

  const click = (e: ThreeEvent<MouseEvent>) => {
    if (!overview) return
    e.stopPropagation()
    setFloor(f.id)
  }

  return (
    <group position={[0, y, 0]}>
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
          <meshStandardMaterial color={pal.slab} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.12, D / 2 + 0.152]}>
          <boxGeometry args={[W + 0.3, 0.24, 0.01]} />
          <meshBasicMaterial color={hover || focused ? f.tint : pal.edge} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.005, 0]} receiveShadow>
          <boxGeometry args={[W, 0.01, D]} />
          <meshStandardMaterial color={pal.floor} roughness={0.9} />
        </mesh>
        {/* fachada de atrás: muro cortina de vidrio con parantes */}
        <mesh position={[0, H / 2, -D / 2 + 0.02]}>
          <boxGeometry args={[W - 0.1, H - 0.02, 0.03]} />
          <meshStandardMaterial color={light.windows} emissive={light.windows} emissiveIntensity={light.dark ? 0.55 : 0.35} roughness={0.15} metalness={0.2} />
        </mesh>
        {Array.from({ length: W + 1 }, (_, i) => (
          <mesh key={i} position={[-W / 2 + i, H / 2, -D / 2 + 0.06]} castShadow>
            <boxGeometry args={[0.06, H, 0.06]} />
            <meshStandardMaterial color={pal.trim} roughness={0.6} />
          </mesh>
        ))}
        <mesh position={[0, 0.55, -D / 2 + 0.06]}>
          <boxGeometry args={[W, 0.05, 0.05]} />
          <meshStandardMaterial color={pal.trim} roughness={0.6} />
        </mesh>
        {/* pared lateral */}
        <mesh position={[-W / 2 + 0.06, H / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.12, H, D]} />
          <meshStandardMaterial color={pal.wall} roughness={0.9} />
        </mesh>
        {style === 'vidrio' && (
          <mesh position={[W / 2 - 0.02, H / 2, 0]}>
            <boxGeometry args={[0.04, H - 0.02, D]} />
            <meshPhysicalMaterial color="#9CC8E0" transparent opacity={0.28} roughness={0.05} metalness={0.1} />
          </mesh>
        )}
        {/* columnas */}
        {[-W / 2 + 0.12, W / 2 - 0.12].map((x) => (
          <mesh key={x} position={[x, H / 2, D / 2 - 0.12]} castShadow>
            <boxGeometry args={[0.22, H, 0.22]} />
            <meshStandardMaterial color={pal.col} roughness={0.7} />
          </mesh>
        ))}
        {/* paneles de luz en el techo */}
        {[-3, 0, 3].map((x) => (
          <mesh key={`l${x}`} position={[x, H - 0.01, 0.2]} rotation-x={Math.PI / 2}>
            <planeGeometry args={[1.6, 0.5]} />
            <meshBasicMaterial color={light.lamps > 0 ? '#FFE7BF' : '#F2EFEA'} toneMapped={false} />
          </mesh>
        ))}
        <pointLight position={[0, H - 0.3, 0.6]} color={light.lamps > 0 ? '#FFD9A3' : '#FFF6EA'} intensity={light.lamps > 0 ? 7 * light.lamps : 3.5} distance={8} decay={1.4} />
      </group>

      <Decor id={f.id} />
      {f.id === 'direccion' && <SupervisorDesk clay={style === 'maqueta'} showTag={focused} lamps={light.lamps} />}

      {agents.map((a) => (
        <Station
          key={a.id}
          agent={a}
          position={[SPOTS[a.id][0], 0, SPOTS[a.id][2]]}
          lamps={light.lamps}
          dark={light.dark}
          clay={style === 'maqueta'}
          showTag={focused}
          interactive={focused}
        />
      ))}

      {overview && (
        <Html position={[-W / 2 - 0.4, 0.9, D / 2]} center zIndexRange={[9, 0]}>
          <button className="floor-tag" style={{ ['--c' as string]: f.tint }} onClick={() => setFloor(f.id)}>
            <span className="floor-n">{f.n}</span>
            <span className="flex flex-col items-start leading-tight">
              <span>{f.name}</span>
              <span className="floor-sub">{busy ? `${busy} trabajando` : 'En pausa'}</span>
            </span>
          </button>
        </Html>
      )}
    </group>
  )
}

function SupervisorDesk({ clay, showTag, lamps }: { clay: boolean; showTag: boolean; lamps: number }) {
  const setChat = useCrew((s) => s.setChat)
  return (
    <group position={[2.6, 0, 0.1]}>
      <group scale={1.3}>
      {/* oficina vidriada */}
      <mesh position={[0, 1, 1.15]}>
        <boxGeometry args={[3.4, 2, 0.03]} />
        <meshPhysicalMaterial color="#CFE6F2" transparent opacity={0.22} roughness={0.05} />
      </mesh>
      <mesh position={[-1.7, 1, -0.3]}>
        <boxGeometry args={[0.03, 2, 2.9]} />
        <meshPhysicalMaterial color="#CFE6F2" transparent opacity={0.22} roughness={0.05} />
      </mesh>
      <group onClick={(e) => { e.stopPropagation(); setChat(true) }}>
        <Furn name="desk" />
        <Furn name="computerScreen" position={[-0.08, 0.38, -0.04]} rotation-y={Math.PI} tint={{ metalDark: 'glow:#9BB8D8' }} />
        <Furn name="lampSquareTable" position={[0.26, 0.38, -0.02]} tint={{ lamp: lamps > 0 ? 'glow:#FFD58A' : '#F3E6C4' }} />
        <Furn name="chairDesk" position={[0, 0, -0.52]} tint={{ carpet: '#1F2A37' }} />
        <Character model={SUPERVISOR.model} pose="sit" position={[0, 0.12, -0.5]} scale={0.62} clay={clay} />
      </group>
      </group>
      {showTag && (
        <Html position={[0, 1.6, -0.2]} center zIndexRange={[9, 0]}>
          <button className="tag flex items-center gap-2 rounded-full py-1 pl-1 pr-3" onClick={() => setChat(true)}>
            <span className="size-7 overflow-hidden rounded-full" style={{ background: SUPERVISOR.soft }}>
              <img src={SUPERVISOR.avatar} alt="" className="size-full object-cover" />
            </span>
            <span className="flex flex-col text-left leading-tight">
              <span className="text-[13px] font-semibold">Bruno</span>
              <span className="tag-sub text-[11px]">Supervisor, preguntale</span>
            </span>
          </button>
        </Html>
      )}
    </group>
  )
}

function Ground({ style }: { style: BuildingStyle }) {
  const pal = PALETTE[style]
  return (
    <group>
      <mesh position={[0, BASE / 2 - 0.02, 0]} receiveShadow castShadow>
        <boxGeometry args={[W + 1.2, BASE, D + 1.2]} />
        <meshStandardMaterial color={pal.edge} roughness={0.9} />
      </mesh>
      <RoundedBox args={[W + 4, 0.3, D + 4.5]} radius={0.12} position={[0, -0.16, 0.5]} receiveShadow>
        <meshStandardMaterial color={pal.plaza} roughness={0.9} />
      </RoundedBox>
      <mesh position={[0, 0.005, D / 2 + 1.7]} receiveShadow>
        <boxGeometry args={[W + 3.4, 0.01, 1.1]} />
        <meshStandardMaterial color={pal.street} roughness={1} />
      </mesh>
    </group>
  )
}

function Roof({ style }: { style: BuildingStyle }) {
  const pal = PALETTE[style]
  const y = floorY(FLOORS.length + 1)
  return (
    <group position={[0, y, 0]}>
      <mesh position={[0, -0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[W + 0.3, 0.24, D + 0.3]} />
        <meshStandardMaterial color={pal.slab} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.18, -D / 2 + 0.05]} castShadow>
        <boxGeometry args={[W + 0.3, 0.36, 0.1]} />
        <meshStandardMaterial color={pal.edge} />
      </mesh>
      <mesh position={[2.6, 0.45, -0.6]} castShadow>
        <boxGeometry args={[1.6, 0.9, 1.2]} />
        <meshStandardMaterial color={pal.edge} />
      </mesh>
    </group>
  )
}

const BUILDING_BOX = new THREE.Box3(new THREE.Vector3(-W / 2 - 1.4, 0, -D / 2), new THREE.Vector3(W / 2 + 0.4, floorY(FLOORS.length + 1) + 0.4, D / 2))

/** espacio que tapan los paneles de la interfaz, en píxeles */
function insets(w: number) {
  return w >= 1024 ? { l: 320, r: 380, t: 84, b: 16 } : { l: 0, r: 0, t: 64, b: 170 }
}

function CameraRig({ floor }: { floor: FloorId | null }) {
  const ref = useRef<CameraControls>(null)
  const size = useThree((s) => s.size)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera

  useEffect(() => {
    const c = ref.current
    if (!c) return
    if (import.meta.env.DEV) (window as unknown as { __cc: unknown }).__cc = c
    const ins = insets(size.width)
    // corre el centro de la imagen al centro del espacio libre entre paneles
    const dx = (ins.l - ins.r) / 2
    const dy = (ins.t - ins.b) / 2
    camera.setViewOffset(size.width, size.height, -dx, -dy, size.width, size.height)
    camera.updateProjectionMatrix()

    const freeW = size.width - ins.l - ins.r
    const freeH = size.height - ins.t - ins.b
    const tanV = Math.tan((camera.fov * Math.PI) / 360)
    const tanFreeH = (tanV * freeW) / size.height
    const tanFreeV = (tanV * freeH) / size.height
    const narrow = size.width < 1024

    let t: THREE.Vector3
    let dist: number
    let az: number
    let polar: number
    if (!floor) {
      const sp = BUILDING_BOX.getBoundingSphere(new THREE.Sphere())
      t = sp.center
      dist = (sp.radius * (narrow ? 1.02 : 0.86)) / Math.sin(Math.atan(Math.min(tanFreeH, tanFreeV)))
      az = 0.6
      polar = 1.2
    } else {
      const f = FLOORS.find((x) => x.id === floor)!
      t = new THREE.Vector3(0.2, floorY(f.n) + 0.95, 0.2)
      const byWidth = (W * 0.56) / tanFreeH
      const byHeight = (H * 0.95) / tanFreeV
      dist = narrow ? Math.min(byWidth, byHeight * 2.05) : Math.max(byHeight, Math.min(byWidth, byHeight * 1.22))
      az = narrow ? 0.32 : 0.45
      polar = 1.36
    }
    const p = t.clone().add(new THREE.Vector3(Math.sin(polar) * Math.sin(az), Math.cos(polar), Math.sin(polar) * Math.cos(az)).multiplyScalar(dist))
    c.setLookAt(p.x, p.y, p.z, t.x, t.y, t.z, true)
  }, [floor, size.width, size.height, camera])

  return (
    <CameraControls
      ref={ref}
      makeDefault
      minPolarAngle={0.7}
      maxPolarAngle={1.45}
      minAzimuthAngle={-0.4}
      maxAzimuthAngle={1.4}
      minDistance={4}
      maxDistance={70}
      truckSpeed={0}
      smoothTime={0.45}
    />
  )
}

export default function BuildingScene({ style, light }: { style: BuildingStyle; light: Light }) {
  const floor = useCrew((s) => s.floor)
  const select = useCrew((s) => s.select)
  const setFloor = useCrew((s) => s.setFloor)
  const spots = useMemo(() => SPOTS, [])
  return (
    <div className="scene-area absolute inset-0">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [18, 14, 22], fov: 30, near: 0.1, far: 300 }}
        gl={{ antialias: true, alpha: true }}
        onPointerMissed={() => {
          select(null)
          if (floor) setFloor(null)
        }}
      >
        <AdaptiveDpr />
        {light.dark && <Stars radius={70} depth={30} count={1600} factor={3} saturation={0} fade speed={0.5} />}
        <hemisphereLight args={light.hemi} />
        <directionalLight
          position={light.sun.pos}
          intensity={light.sun.intensity}
          color={light.sun.color}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-12}
          shadow-camera-right={12}
          shadow-camera-top={16}
          shadow-camera-bottom={-4}
          shadow-camera-far={60}
          shadow-bias={-0.0004}
        />
        <Ground style={style} />
        {FLOORS.map((f) => (
          <Floor key={f.id} f={f} style={style} light={light} focused={floor === f.id} overview={!floor} />
        ))}
        <Roof style={style} />
        <Packets spots={spots} lift={0.3} y={1} bulge={[0, 0, 3.2]} />
        <CameraRig floor={floor} />
      </Canvas>
    </div>
  )
}
