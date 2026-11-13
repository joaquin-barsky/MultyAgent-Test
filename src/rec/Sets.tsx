// Solo desarrollo (?rec&set=…): decorados para el video "Les pregunté a mis empleados de IA qué opinan de mí" (@orik.studio, VIDS orik-05-opinan).
// Formato entrevista: cada personaje sentado solo, en un rincón con luz cálida, hablándole a cámara. Nada de esto toca la demo normal.
// Todo depende de window.__t (segundos) para grabar cuadro por cuadro (scripts/video/vertical/rec-sets.mjs); window.__cfg trae los tiempos
// de la voz. Sin __t corre solo, en loop, para mirarlo en el navegador.
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { RoundedBox, useGLTF } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { Furn } from '../three/models'

type V3 = [number, number, number]
type Cfg = { dur?: number; habla?: [number, number][]; [k: string]: unknown }
const W = window as unknown as { __t?: number; __cfg?: Cfg; __listo?: boolean; __esquinas?: () => number[][] }
const Q = new URLSearchParams(location.search)
export const SET = Q.get('set')
const T0 = performance.now()
const cfg = (): Cfg => W.__cfg ?? {}
const num = (k: string, d: number) => (typeof cfg()[k] === 'number' ? (cfg()[k] as number) : d)
/** tiempo de la escena: el que pone el grabador, o el reloj en loop para mirar en vivo (?t= congela) */
const tiempo = () => (typeof W.__t === 'number' ? W.__t : Q.has('t') ? Number(Q.get('t')) : ((performance.now() - T0) / 1000) % (cfg().dur ?? 6))

// ─── colores (marca Orik + los de cada objeto reconocible) ───
const VERDE = '#10291f', HUESO = '#ece6d6', MENTA = '#8ff0bf', MEDIO = '#1d4636', ALERTA = '#ff7a59'
const CALIDA = '#ffb46e'

// ─── utilidades ───
const cl = (x: number) => Math.min(1, Math.max(0, x))
const ramp = (t: number, a: number, b: number) => cl((t - a) / (b - a))
const suave = (x: number) => x * x * (3 - 2 * x)
const sale = (x: number) => 1 - Math.pow(1 - x, 3)
function rnd(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let r = Math.imul(s ^ (s >>> 15), 1 | s)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}
/** curva por puntos clave [tiempo, valor[]] con velocidad continua (Catmull-Rom); quieta en las puntas */
function curva(keys: [number, number[]][], t: number) {
  if (t <= keys[0][0]) return keys[0][1]
  const n = keys.length
  if (t >= keys[n - 1][0]) return keys[n - 1][1]
  let i = 0
  while (t > keys[i + 1][0]) i++
  const [t1, p1] = keys[i], [t2, p2] = keys[i + 1]
  const h = t2 - t1, u = (t - t1) / h
  const tan = (k: number) => {
    if (k <= 0 || k >= n - 1) return keys[0][1].map(() => 0)
    const [ta, pa] = keys[k - 1], [tb, pb] = keys[k + 1]
    return pa.map((_, j) => (pb[j] - pa[j]) / (tb - ta))
  }
  const m1 = tan(i), m2 = tan(i + 1)
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2
  return p1.map((_, j) => h00 * p1[j] + h10 * h * m1[j] + h01 * p2[j] + h11 * h * m2[j])
}
/** cuánto está hablando (0-1, con rampas cortas) */
const hablando = (t: number) => (cfg().habla ?? []).reduce((m, [a, b]) => Math.max(m, Math.min(ramp(t, a - 0.08, a + 0.08), 1 - ramp(t, b - 0.05, b + 0.15))), 0)

/** cámara por puntos clave: [t, x, y, z, mirax, miray, miraz, fov] */
function Camara({ keys }: { keys: [number, ...number[]][] }) {
  const { camera, size } = useThree()
  useFrame(() => {
    const v = curva(keys.map((k) => [k[0], k.slice(1)] as [number, number[]]), tiempo())
    const c = camera as THREE.PerspectiveCamera
    // ?cam=x,y,z,mx,my,mz fija la cámara (para encuadrar a ojo)
    const fija = Q.get('cam')?.split(',').map(Number)
    if (fija) v.splice(0, 6, ...fija)
    c.position.set(v[0], v[1], v[2])
    c.lookAt(v[3], v[4], v[5])
    if (v[6] && c.fov !== v[6]) {
      c.fov = v[6]
      c.updateProjectionMatrix()
    }
    c.aspect = size.width / size.height
  })
  return null
}

/** textura de canvas dibujada una vez (Geist) */
function lienzo(w: number, h: number, dibujar: (c: CanvasRenderingContext2D) => void) {
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  dibujar(cv.getContext('2d')!)
  const tx = new THREE.CanvasTexture(cv)
  tx.colorSpace = THREE.SRGBColorSpace
  tx.anisotropy = 8
  return tx
}
const G = (peso: number, px: number) => `${peso} ${px}px Geist, sans-serif`
function redondo(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath()
  c.roundRect(x, y, w, h, r)
}

// ─── personaje: sentado (o pasando de parado a sentado), cabeza viva cuando habla ───
function Persona({ model, sentado = () => 1, pos, rotY = 0, escala = 0.62, extra }: {
  model: string; sentado?: (t: number) => number; pos: (t: number) => V3; rotY?: number; escala?: number
  extra?: (huesos: Record<string, THREE.Object3D>, t: number) => void
}) {
  const { scene, animations } = useGLTF(`/models/chars/${model}.glb`)
  const obj = useMemo(() => {
    const c = SkeletonUtils.clone(scene)
    c.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) m.castShadow = m.receiveShadow = true
    })
    return c
  }, [scene])
  const { mixer, sit, idle, huesos, base } = useMemo(() => {
    const mixer = new THREE.AnimationMixer(obj)
    const sit = mixer.clipAction(animations.find((a) => a.name === 'sit')!)
    const idle = mixer.clipAction(animations.find((a) => a.name === 'idle')!)
    sit.play()
    idle.play()
    const huesos: Record<string, THREE.Object3D> = {}
    for (const n of ['head', 'torso', 'arm-left', 'arm-right', 'leg-left', 'leg-right']) huesos[n] = obj.getObjectByName(n)!
    // los clips no mueven todos los huesos: antes de cada cuadro vuelven a su pose de base (si no, los giros se acumulan)
    const base = Object.fromEntries(Object.entries(huesos).map(([k, o]) => [k, o.quaternion.clone()]))
    return { mixer, sit, idle, huesos, base }
  }, [obj, animations])
  const g = useRef<THREE.Group>(null)
  useFrame(() => {
    const t = tiempo()
    const w = sentado(t)
    sit.setEffectiveWeight(w)
    idle.setEffectiveWeight(1 - w)
    for (const k in huesos) huesos[k].quaternion.copy(base[k])
    mixer.setTime(t)
    const k = hablando(t)
    // cabeza: un balanceo lento siempre (nada quieto) y asentimientos chicos mientras habla
    huesos.head.rotation.x += 0.025 * Math.sin(t * 1.9) + k * (0.05 * Math.sin(t * 7.1) + 0.03 * Math.sin(t * 11.3))
    huesos.head.rotation.y += 0.05 * Math.sin(t * 1.1 + 0.6) + k * 0.04 * Math.sin(t * 3.7)
    huesos.head.rotation.z += k * 0.03 * Math.sin(t * 2.9)
    huesos.torso.rotation.y += 0.02 * Math.sin(t * 0.9)
    extra?.(huesos, t)
    g.current?.position.set(...pos(t))
  })
  return (
    <group ref={g} rotation-y={rotY} scale={escala}>
      <primitive object={obj} />
    </group>
  )
}

/** micrófono de pie (barra, brazo y cápsula), mirando a la boca */
function Microfono({ position, alto = 0.62, giro = 0 }: { position: V3; alto?: number; giro?: number }) {
  const negro = <meshStandardMaterial color="#141414" roughness={0.45} metalness={0.6} />
  return (
    <group position={position} rotation-y={giro}>
      <mesh position={[0, 0.006, 0]} castShadow>{<cylinderGeometry args={[0.09, 0.1, 0.012, 32]} />}{negro}</mesh>
      <mesh position={[0, alto / 2, 0]} castShadow><cylinderGeometry args={[0.007, 0.007, alto, 12]} />{negro}</mesh>
      <group position={[0, alto, 0]} rotation-x={-1.05}>
        <mesh position={[0, 0.12, 0]} castShadow><cylinderGeometry args={[0.005, 0.005, 0.24, 10]} />{negro}</mesh>
        <mesh position={[0, 0.26, 0]} rotation-x={0.5} castShadow>
          <capsuleGeometry args={[0.022, 0.06, 8, 16]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.8} metalness={0.2} />
        </mesh>
      </group>
    </group>
  )
}

/** piso de madera con tablas */
function texturaMadera() {
  const tx = lienzo(1024, 1024, (c) => {
    c.fillStyle = '#5b3d27'
    c.fillRect(0, 0, 1024, 1024)
    const r = rnd(7)
    for (let i = 0; i < 16; i++) {
      const y = i * 64
      const off = r() * 1024
      for (let x = -1024; x < 1024; x += 512) {
        c.fillStyle = `hsl(25, ${30 + r() * 12}%, ${22 + r() * 9}%)`
        c.fillRect(x + off, y + 1, 510, 62)
      }
      c.fillStyle = 'rgba(0,0,0,0.35)'
      c.fillRect(0, y, 1024, 2)
    }
  })
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping
  tx.repeat.set(3, 3)
  return tx
}

/** el rincón de la entrevista: dos paredes, piso de madera, alfombra, lámpara cálida, planta, sillón y micrófono */
function Rincon({ pared = MEDIO, lado = true, lampara = [-0.62, 0, -0.42] as V3, planta = [0.66, 0, -0.5] as V3, fondo = -0.95, mic = true }: {
  pared?: string; lado?: boolean; lampara?: V3; planta?: V3; fondo?: number; mic?: boolean
}) {
  const madera = useMemo(texturaMadera, [])
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[12, 12]} /><meshStandardMaterial map={madera} roughness={0.75} /></mesh>
      <mesh position={[0, 1.5, fondo]} receiveShadow><planeGeometry args={[12, 3]} /><meshStandardMaterial color={pared} roughness={0.95} /></mesh>
      {lado && <mesh position={[-1.25, 1.5, fondo + 6]} rotation-y={Math.PI / 2} receiveShadow><planeGeometry args={[12, 3]} /><meshStandardMaterial color={pared} roughness={0.95} /></mesh>}
      {/* zócalo */}
      <mesh position={[0, 0.03, fondo + 0.006]}><boxGeometry args={[12, 0.06, 0.012]} /><meshStandardMaterial color="#0c1f17" /></mesh>
      <Furn name="rugRound" position={[0, 0.002, 0.05]} scale={1.15} tint={{ carpet: '#6e3b2a', carpetDarker: '#4a271c' }} />
      <Furn name="../../rec/lampRoundFloor" position={lampara} scale={1.15} tint={{ lamp: 'glow:#ffb877' }} />
      <pointLight position={[lampara[0] + 0.06, 0.9, lampara[2] + 0.05]} color={CALIDA} intensity={2.2} distance={4} decay={1.6} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.002} />
      <Furn name="pottedPlant" position={planta} scale={1.1} />
      <Furn name="chairDesk" position={[0, 0, -0.08]} scale={0.75} tint={{ carpet: '#c9b48f' }} />
      {mic && <Microfono position={[0.3, 0, 0.32]} alto={0.5} giro={-0.6} />}
    </group>
  )
}

/** luces comunes: ambiente bajo, relleno frío desde cámara y un contraluz cálido */
function Luces({ ambiente = 0.35, relleno = 0.55, contra = 1.2 }: { ambiente?: number; relleno?: number; contra?: number }) {
  return (
    <>
      <hemisphereLight args={['#b8d6c8', '#1a120c', ambiente]} />
      <directionalLight position={[1.5, 2.2, 3]} intensity={relleno} color="#e9eef0" />
      <spotLight position={[-0.4, 2.2, -0.8]} angle={0.6} penumbra={0.8} intensity={contra} color={CALIDA} distance={5} decay={1.5} />
    </>
  )
}

// ═══════════════ 1 · entrada + Mora (atención al cliente): globos de WhatsApp que la tapan ═══════════════
const TEXTOS_WA = ['¿precio?', 'hola', '¿siguen?', 'info', 'urgente', '¿hacen envíos?', 'hola???', '¿horario?', 'gracias', '¿stock?']
function texturaGlobo(texto: string, verde: boolean) {
  return lienzo(512, 256, (c) => {
    c.fillStyle = verde ? '#d9fdd3' : '#ffffff'
    redondo(c, 0, 0, 512, 256, 70)
    c.fill()
    c.fillStyle = '#111b21'
    c.font = G(600, texto.length > 9 ? 64 : 84)
    c.textBaseline = 'middle'
    c.fillText(texto, 46, 112)
    c.fillStyle = '#667781'
    c.font = G(400, 40)
    c.fillText('03:12', 330, 205)
    // doble tilde azul
    c.strokeStyle = '#53bdeb'
    c.lineWidth = 9
    c.lineCap = 'round'
    for (const dx of [0, 22]) {
      c.beginPath()
      c.moveTo(432 + dx, 202)
      c.lineTo(446 + dx, 216)
      c.lineTo(474 + dx, 186)
      c.stroke()
    }
  })
}
function Globos() {
  const N = 190
  const datos = useMemo(() => {
    const r = rnd(11)
    // montaña de globos alrededor de Mora, hasta el mentón: cada globo cae a un punto de la montaña, los de abajo primero
    const lista = []
    for (let i = 0; i < N; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r())
      const x = Math.cos(a) * d * 0.66, z = 0.02 + Math.sin(a) * d * 0.55
      let y = 0.47 * (1 - Math.pow(d, 1.7)) * (0.5 + 0.5 * r()) + 0.03
      // la cara queda libre
      if (Math.hypot(x, z + 0.02) < 0.17) y = Math.min(y, 0.37)
      lista.push({ x, y, z, ry: (r() - 0.5) * 1.2 + Math.atan2(x, 1.6), rx: (r() - 0.5) * 1.0 - 0.35, rz: (r() - 0.5) * 1.0, txt: i % TEXTOS_WA.length, verde: r() < 0.5, cae: 0, giro: (r() - 0.5) * 3 })
    }
    lista.sort((p, q) => p.y - q.y)
    lista.forEach((d, i) => (d.cae = i / N))
    return lista
  }, [])
  const texturas = useMemo(() => TEXTOS_WA.flatMap((t) => [texturaGlobo(t, false), texturaGlobo(t, true)]), [])
  const refs = useRef<(THREE.Group | null)[]>([])
  useFrame(() => {
    const t = tiempo()
    const a = num('globos0', 1.45), b = num('globos1', 4.7)
    datos.forEach((d, i) => {
      const o = refs.current[i]
      if (!o) return
      // cada vez caen más seguido
      const llega = a + (b - a) * Math.pow(d.cae, 0.72)
      const caida = 0.36
      const p = (t - (llega - caida)) / caida
      if (p < 0) {
        o.visible = false
        return
      }
      o.visible = true
      const q = cl(p)
      o.position.set(d.x, d.y + (1 - q * q) * 1.6, d.z)
      o.rotation.set(d.rx + (1 - q) * d.giro, d.ry + (1 - q) * d.giro * 0.6, d.rz)
      // al tocar, se aplasta apenas y vuelve (sin rebote)
      const g = p > 1 ? Math.exp(-(t - llega) * 18) * Math.sin(Math.min(Math.PI, (t - llega) * 30)) : 0
      o.scale.set(1 + g * 0.12, 1 - g * 0.16, 1 + g * 0.12)
    })
  })
  return (
    <group>
      {datos.map((d, i) => (
        <group key={i} ref={(el) => { refs.current[i] = el }} visible={false}>
          <RoundedBox args={[0.17, 0.085, 0.03]} radius={0.014} smoothness={3} castShadow receiveShadow>
            <meshStandardMaterial color={d.verde ? '#d9fdd3' : '#ffffff'} roughness={0.5} />
          </RoundedBox>
          <mesh position={[0, 0, 0.0155]}><planeGeometry args={[0.17, 0.085]} /><meshStandardMaterial map={texturas[d.txt * 2 + (d.verde ? 1 : 0)]} transparent roughness={0.5} /></mesh>
          <mesh position={[0, 0, -0.0155]} rotation-y={Math.PI}><planeGeometry args={[0.17, 0.085]} /><meshStandardMaterial map={texturas[((d.txt + 3) % TEXTOS_WA.length) * 2 + (d.verde ? 1 : 0)]} transparent roughness={0.5} /></mesh>
        </group>
      ))}
    </group>
  )
}
function SetMora() {
  const s0 = num('sienta0', 0.3), s1 = num('sienta1', 1.0), fin = num('dur', 5.4), remate = num('remate', 4.6)
  return (
    <>
      <color attach="background" args={['#07120d']} />
      <fog attach="fog" args={['#07120d', 3, 9]} />
      <Luces />
      <group rotation-y={0.32}>
        <Rincon lampara={[-0.55, 0, -0.5]} planta={[0.62, 0, -0.62]} />
        <Persona model="character-female-b" pos={(t) => {
          const k = suave(ramp(t, s0, s1))
          return [0.62 * (1 - k), 0.25 * k + 0.0 * (1 - k), -0.1 + 0.05 * (1 - k)]
        }} sentado={(t) => suave(ramp(t, s0 + 0.15, s1))} />
        <Globos />
      </group>
      <Camara keys={[
        [0, 1.25, 1.05, 2.6, -0.15, 0.42, -0.2, 34],
        [1.1, 0.62, 0.7, 1.72, -0.02, 0.4, -0.1, 34],
        [remate - 0.15, 0.5, 0.66, 1.5, 0.0, 0.36, -0.1, 34],
        [remate + 0.3, 0.3, 0.58, 0.98, 0.0, 0.4, -0.1, 34],
        [fin, 0.27, 0.58, 0.92, 0.0, 0.41, -0.1, 34],
]} />
    </>
  )
}

// ═══════════════ 2 · Toto (ventas): muro de sobres que se ponen rojos ═══════════════
function texturaSobre() {
  return lienzo(256, 176, (c) => {
    c.fillStyle = '#ffffff'
    redondo(c, 0, 0, 256, 176, 14)
    c.fill()
    c.strokeStyle = 'rgba(0,0,0,0.28)'
    c.lineWidth = 7
    c.lineJoin = 'round'
    c.beginPath()
    c.moveTo(10, 12)
    c.lineTo(128, 100)
    c.lineTo(246, 12)
    c.stroke()
    c.beginPath()
    c.moveTo(10, 166)
    c.lineTo(100, 84)
    c.moveTo(246, 166)
    c.lineTo(156, 84)
    c.stroke()
  })
}
function texturaBloqueo() {
  return lienzo(128, 128, (c) => {
    c.strokeStyle = '#ffffff'
    c.lineWidth = 13
    c.beginPath()
    c.arc(64, 64, 46, 0, Math.PI * 2)
    c.stroke()
    c.beginPath()
    c.moveTo(32, 96)
    c.lineTo(96, 32)
    c.stroke()
  })
}
function MuroSobres() {
  const COLS = 12, FILAS = 9, N = COLS * FILAS
  const sobre = useMemo(texturaSobre, [])
  const bloqueo = useMemo(texturaBloqueo, [])
  const datos = useMemo(() => {
    const r = rnd(5)
    const orden = [...Array(N).keys()].sort(() => r() - 0.5)
    // los dos que quedan verdes: arriba a la izquierda y a la derecha de la cabeza (que se vean siempre)
    const quedan = new Set([6 * COLS + 4, 5 * COLS + 7])
    const rojos = orden.filter((i) => !quedan.has(i))
    return {
      aparece: [...Array(N).keys()].map((i) => (FILAS - 1 - Math.floor(i / COLS)) / FILAS * 0.75 + r() * 0.25),
      rojo: Object.fromEntries(rojos.map((i, k) => [i, k / rojos.length])) as Record<number, number>,
      quedan,
    }
  }, [N])
  const cuerpo = useRef<THREE.InstancedMesh>(null)
  const iconos = useRef<THREE.InstancedMesh>(null)
  const m = useMemo(() => new THREE.Matrix4(), [])
  const col = useMemo(() => new THREE.Color(), [])
  const verde = useMemo(() => new THREE.Color(MENTA), [])
  const rojo = useMemo(() => new THREE.Color(ALERTA), [])
  useFrame(() => {
    const t = tiempo()
    const a0 = num('sobres0', 0.25), a1 = num('sobres1', 2.2), r0 = num('rojos0', 2.6), r1 = num('rojos1', 4.5)
    for (let i = 0; i < N; i++) {
      const cx = (i % COLS) - (COLS - 1) / 2, cy = Math.floor(i / COLS)
      const x = cx * 0.205, y = 0.2 + cy * 0.15
      const ap = sale(ramp(t, a0 + datos.aparece[i] * (a1 - a0 - 0.25), a0 + datos.aparece[i] * (a1 - a0 - 0.25) + 0.25))
      const k = datos.rojo[i]
      // se ponen rojos uno por uno, cada vez más rápido
      const tr = k === undefined ? 1e9 : r0 + (r1 - r0) * Math.pow(k, 0.62)
      const pr = ramp(t, tr, tr + 0.12)
      const golpe = pr > 0 && pr < 1 ? Math.sin(pr * Math.PI) * 0.18 : 0
      const s = ap * (1 + golpe)
      m.compose(new THREE.Vector3(x, y, 0.012 + golpe * 0.04), new THREE.Quaternion(), new THREE.Vector3(s, s, s))
      cuerpo.current!.setMatrixAt(i, m)
      col.copy(verde).lerp(rojo, pr)
      if (datos.quedan.has(i) && t > r1) col.copy(verde).multiplyScalar(1 + 0.25 * Math.sin(t * 9) ** 2)
      cuerpo.current!.setColorAt(i, col)
      const si = pr * s
      m.compose(new THREE.Vector3(x + 0.055, y - 0.03, 0.03), new THREE.Quaternion(), new THREE.Vector3(si, si, si))
      iconos.current!.setMatrixAt(i, m)
    }
    cuerpo.current!.instanceMatrix.needsUpdate = true
    if (cuerpo.current!.instanceColor) cuerpo.current!.instanceColor.needsUpdate = true
    iconos.current!.instanceMatrix.needsUpdate = true
  })
  return (
    <group position={[0, 0, -0.93]}>
      <instancedMesh ref={cuerpo} args={[undefined, undefined, N]} castShadow>
        <boxGeometry args={[0.18, 0.124, 0.012]} />
        <meshStandardMaterial map={sobre} roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={iconos} args={[undefined, undefined, N]}>
        <planeGeometry args={[0.07, 0.07]} />
        <meshBasicMaterial map={bloqueo} transparent />
      </instancedMesh>
    </group>
  )
}
function SetToto() {
  const fin = num('dur', 5)
  return (
    <>
      <color attach="background" args={['#07120d']} />
      <fog attach="fog" args={['#07120d', 3, 9]} />
      <Luces relleno={0.6} contra={0.8} />
      <Rincon lado={false} lampara={[-0.95, 0, -0.55]} planta={[0.95, 0, -0.6]} />
      <MuroSobres />
      <Persona model="character-male-d" pos={() => [0, 0.25, -0.1]} />
      <Camara keys={[
        [0, -0.1, 0.56, 2.05, 0, 0.36, -0.4, 36],
        [fin * 0.5, 0.05, 0.54, 1.92, 0, 0.36, -0.4, 36],
        [fin, 0.16, 0.52, 1.74, 0, 0.37, -0.4, 36],
      ]} />
    </>
  )
}

// ═══════════════ 3 · Simón (supervisor): 3:00, oficina a oscuras, la cara iluminada por el celular ═══════════════
function Reloj({ position }: { position: V3 }) {
  const esfera = useMemo(() => lienzo(512, 512, (c) => {
    c.fillStyle = HUESO
    c.beginPath()
    c.arc(256, 256, 250, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = VERDE
    for (let i = 0; i < 12; i++) {
      c.save()
      c.translate(256, 256)
      c.rotate((i / 12) * Math.PI * 2)
      c.fillRect(-7, -232, 14, i % 3 === 0 ? 56 : 32)
      c.restore()
    }
  }), [])
  return (
    <group position={position}>
      <mesh rotation-x={Math.PI / 2}><cylinderGeometry args={[0.2, 0.2, 0.03, 48]} /><meshStandardMaterial color="#1b1b1b" roughness={0.5} /></mesh>
      <mesh position={[0, 0, 0.016]}><circleGeometry args={[0.18, 48]} /><meshStandardMaterial map={esfera} roughness={0.7} emissive="#ffffff" emissiveMap={esfera} emissiveIntensity={0.18} /></mesh>
      {/* 3:00 en punto: horaria a las 3, minutero a las 12 */}
      <mesh position={[0.045, 0, 0.022]}><boxGeometry args={[0.1, 0.018, 0.006]} /><meshStandardMaterial color={VERDE} /></mesh>
      <mesh position={[0, 0.065, 0.026]}><boxGeometry args={[0.012, 0.14, 0.006]} /><meshStandardMaterial color={VERDE} /></mesh>
      <mesh position={[0, 0, 0.03]}><circleGeometry args={[0.014, 16]} /><meshStandardMaterial color={ALERTA} /></mesh>
    </group>
  )
}
function Celular({ position }: { position: V3 }) {
  const pantalla = useMemo(() => lienzo(360, 720, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 720)
    g.addColorStop(0, '#1d4636')
    g.addColorStop(1, '#0b1a14')
    c.fillStyle = g
    c.fillRect(0, 0, 360, 720)
    c.fillStyle = HUESO
    c.textAlign = 'center'
    c.font = G(600, 120)
    c.fillText('3:00', 180, 210)
    c.font = G(400, 30)
    c.fillText('jueves 13 de noviembre', 180, 256)
    c.fillStyle = 'rgba(236,230,214,0.94)'
    redondo(c, 22, 330, 316, 150, 30)
    c.fill()
    c.textAlign = 'left'
    c.fillStyle = '#10291f'
    c.font = G(600, 34)
    c.fillText('Jefe', 48, 384)
    c.font = G(400, 34)
    c.fillText('¿cómo vamos?', 48, 436)
    c.fillStyle = '#6b685f'
    c.font = G(400, 24)
    c.fillText('ahora', 262, 382)
  }), [])
  const g = useRef<THREE.Group>(null)
  const mat = useRef<THREE.MeshStandardMaterial>(null)
  const luz = useRef<THREE.PointLight>(null)
  useFrame(() => {
    const t = tiempo()
    const vibra = ((cfg().vibra as [number, number][]) ?? []).some(([a, b]) => t > a && t < b)
    const apaga = num('apaga', 99)
    const on = 1 - ramp(t, apaga, apaga + 0.08)
    if (g.current) {
      g.current.position.set(position[0] + (vibra ? Math.sin(t * 190) * 0.004 : 0), position[1], position[2] + (vibra ? Math.cos(t * 170) * 0.003 : 0))
      g.current.rotation.y = 0.35 + (vibra ? Math.sin(t * 150) * 0.05 : 0)
    }
    if (mat.current) mat.current.emissiveIntensity = 1.25 * on
    if (luz.current) luz.current.intensity = (vibra ? 1.2 : 1.0) * 0.9 * on
  })
  return (
    <group ref={g}>
      <RoundedBox args={[0.085, 0.01, 0.17]} radius={0.004} smoothness={2} position={[0, 0.005, 0]} castShadow>
        <meshStandardMaterial color="#111" roughness={0.3} metalness={0.5} />
      </RoundedBox>
      <mesh position={[0, 0.0106, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.077, 0.158]} />
        <meshStandardMaterial ref={mat} color="#000" emissive="#ffffff" emissiveMap={pantalla} emissiveIntensity={1.25} />
      </mesh>
      {/* la luz del celular va hacia la cara (arriba y atrás), no al escritorio */}
      <pointLight ref={luz} position={[0, 0.2, -0.24]} color="#cfe4ff" intensity={1} distance={0.6} decay={1.6} />
    </group>
  )
}
function SetSimon() {
  const fin = num('dur', 5.3)
  return (
    <>
      <color attach="background" args={['#03080a']} />
      <fog attach="fog" args={['#03080a', 2.5, 6]} />
      <hemisphereLight args={['#5577aa', '#000000', 0.07]} />
      {/* luz de luna por la ventana, sobre la pared y el reloj */}
      <spotLight position={[1.4, 1.6, 0.4]} target-position={[0, 0.9, -1]} angle={0.5} penumbra={1} intensity={0.9} color="#7ea0d8" distance={4} />
      <mesh position={[0, 1.5, -1]}><planeGeometry args={[10, 3]} /><meshStandardMaterial color="#0f2219" roughness={1} /></mesh>
      <mesh rotation-x={-Math.PI / 2}><planeGeometry args={[10, 10]} /><meshStandardMaterial color="#0d0f0e" roughness={0.9} /></mesh>
      <Furn name="wallWindow" position={[1.25, 0, -0.98]} scale={1.1} />
      <Reloj position={[-0.3, 0.98, -0.97]} />
      {/* escritorios vacíos en la oscuridad (para que se lea "oficina") */}
      {[[-1.5, -0.3], [1.6, -0.2], [-1.2, 1.4]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <Furn name="desk" scale={[1.5, 1, 1.15]} />
          <Furn name="computerScreen" position={[0, 0.38, -0.1]} scale={1} rotation-y={Math.PI} />
          <Furn name="chairDesk" position={[0, 0, -0.6]} scale={0.75} />
        </group>
      ))}
      <group position={[0, 0, 0]}>
        <Furn name="desk" scale={[1.5, 1, 1.15]} tint={{ wood: '#33251b' }} />
        <Furn name="chairDesk" position={[0, 0, -0.6]} scale={0.75} />
        <Celular position={[0.06, 0.383, 0.02]} />
        <Persona model="character-male-e" pos={() => [0, 0.25, -0.6]} extra={(h, t) => {
          // mira el celular y levanta la vista hacia cámara cuando habla
          const mira = 1 - hablando(t)
          h.head.rotation.x += 0.28 * mira
        }} />
      </group>
      <Camara keys={[
        [0, 0.16, 0.5, 1.5, -0.1, 0.42, -0.6, 36],
        [fin * 0.55, 0.08, 0.52, 1.24, -0.08, 0.43, -0.6, 36],
        [fin, 0.04, 0.54, 1.0, -0.06, 0.44, -0.6, 36],
      ]} />
    </>
  )
}

// ═══════════════ 4 · Lola (recursos humanos): sola en un piso enorme vacío ═══════════════
function texturaPiso() {
  const tx = lienzo(512, 512, (c) => {
    c.fillStyle = '#22362d'
    c.fillRect(0, 0, 512, 512)
    c.strokeStyle = 'rgba(236,230,214,0.2)'
    c.lineWidth = 3
    c.strokeRect(0, 0, 512, 512)
  })
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping
  tx.repeat.set(60, 60)
  return tx
}
function Cartel() {
  const tx = useMemo(() => lienzo(620, 460, (c) => {
    c.fillStyle = VERDE
    redondo(c, 0, 0, 620, 460, 40)
    c.fill()
    c.fillStyle = HUESO
    c.font = G(600, 118)
    c.fillText('Recursos', 56, 236)
    c.fillText('humanos', 56, 372)
  }), [])
  return (
    // cartelito de escritorio (tipo carpa) al costado, a la altura del pecho: se lee en el medio del cuadro, lejos de los subtítulos
    <group position={[0.27, 0.383, 0.05]} rotation-y={-0.12}>
      <mesh position={[0, 0.085, 0.012]} rotation-x={-0.22}>
        <planeGeometry args={[0.24, 0.178]} />
        <meshStandardMaterial map={tx} roughness={0.7} emissive="#ffffff" emissiveMap={tx} emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[0, 0.085, -0.012]} rotation-x={0.22}>
        <planeGeometry args={[0.24, 0.178]} />
        <meshStandardMaterial color={VERDE} roughness={0.8} />
      </mesh>
    </group>
  )
}
function SetLola() {
  const piso = useMemo(texturaPiso, [])
  const fin = num('dur', 4.2)
  const columnas = useMemo(() => {
    const l: [number, number][] = []
    for (let x = -24; x <= 24; x += 6) for (let z = -30; z <= 18; z += 6) if (Math.abs(x) > 2 || Math.abs(z) > 2) l.push([x + 3, z - 3])
    return l
  }, [])
  return (
    <>
      <color attach="background" args={['#0a1712']} />
      <fog attach="fog" args={['#0a1712', 8, 46]} />
      <hemisphereLight args={['#a9c7b9', '#0b0b0b', 0.95]} />
      <spotLight position={[0, 4.5, 0.6]} target-position={[0, 0, -0.2]} angle={0.42} penumbra={0.9} intensity={6} color={CALIDA} distance={9} decay={1.2} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[2, 3, 5]} intensity={0.35} color="#e9eef0" />
      <mesh rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[120, 120]} /><meshStandardMaterial map={piso} roughness={0.85} /></mesh>
      {columnas.map(([x, z], i) => (
        <mesh key={i} position={[x, 2, z]} castShadow receiveShadow><boxGeometry args={[0.45, 4, 0.45]} /><meshStandardMaterial color="#2f4a3e" roughness={0.9} /></mesh>
      ))}
      <group>
        <Furn name="desk" scale={[1.5, 1, 1.15]} />
        {/* frente del escritorio */}
        <mesh position={[0, 0.2, 0.1]}><boxGeometry args={[1.06, 0.34, 0.012]} /><meshStandardMaterial color="#1d4636" roughness={0.8} /></mesh>
        <Cartel />
        <Furn name="chairDesk" position={[0, 0, -0.6]} scale={0.75} tint={{ carpet: '#c9b48f' }} />
        <Furn name="plantSmall2" position={[-0.42, 0.38, -0.12]} scale={1} />
        <Persona model="character-female-d" pos={() => [0, 0.25, -0.6]} />
      </group>
      <Camara keys={[
        [0, 0, 0.66, 0.3, 0, 0.5, -0.6, 32],
        [fin * 0.3, 0, 0.6, 1.0, 0, 0.42, -0.6, 32],
        [fin * 0.62, 0, 0.78, 2.3, 0, 0.3, -0.4, 34],
        [fin, 0, 6.5, 12, 0, 0.2, -1.5, 38],
      ]} />
    </>
  )
}

// ═══════════════ 5 · Nacho (contenido): da vuelta el monitor y en la pantalla está el primer cuadro del video ═══════════════
const PANT_W = 0.17, PANT_H = 0.302 // 9:16
const MON: V3 = [-0.31, 0.41, 0.06] // pie del monitor, sobre la mesita al lado de Nacho
function Monitor({ giro }: { giro: (t: number) => number }) {
  const g = useRef<THREE.Group>(null)
  const pant = useRef<THREE.Mesh>(null)
  const { camera, size } = useThree()
  useEffect(() => {
    // el grabador pide las cuatro esquinas de la pantalla en píxeles del cuadro (para pegar ahí el primer cuadro en Remotion)
    W.__esquinas = () => {
      const p = pant.current!
      p.updateWorldMatrix(true, false)
      return [[-1, 1], [1, 1], [1, -1], [-1, -1]].map(([sx, sy]) => {
        const v = new THREE.Vector3((sx * PANT_W) / 2, (sy * PANT_H) / 2, 0).applyMatrix4(p.matrixWorld).project(camera)
        return [((v.x + 1) / 2) * 1080, ((1 - v.y) / 2) * 1920]
      })
    }
  }, [camera, size])
  useFrame(() => {
    if (g.current) g.current.rotation.y = giro(tiempo())
  })
  return (
    <group position={MON}>
      <mesh position={[0, 0.006, 0]}><cylinderGeometry args={[0.05, 0.055, 0.012, 32]} /><meshStandardMaterial color="#222" metalness={0.6} roughness={0.4} /></mesh>
      <mesh position={[0, 0.04, 0]}><cylinderGeometry args={[0.009, 0.009, 0.07, 12]} /><meshStandardMaterial color="#222" metalness={0.6} roughness={0.4} /></mesh>
      <group ref={g} position={[0, 0.07 + PANT_H / 2 + 0.012, 0]}>
        <RoundedBox args={[PANT_W + 0.016, PANT_H + 0.016, 0.018]} radius={0.006} smoothness={2} position={[0, 0, -0.0095]} castShadow>
          <meshStandardMaterial color="#161616" roughness={0.4} metalness={0.3} />
        </RoundedBox>
        <mesh ref={pant} position={[0, 0, 0.0005]}>
          <planeGeometry args={[PANT_W, PANT_H]} />
          <meshStandardMaterial color="#0a1a13" emissive="#10291f" emissiveIntensity={1} />
        </mesh>
      </group>
    </group>
  )
}
function SetNacho() {
  const fin = num('dur', 5.5), g0 = num('gira0', 1.6), g1 = num('gira1', 2.25), e0 = num('entra0', 3.1)
  // al principio la pantalla mira a Nacho (+x); la da vuelta hacia cámara
  const giro = (t: number) => (Math.PI / 2) * (1 - suave(ramp(t, g0, g1)))
  // la cámara termina con la pantalla llenando el cuadro (pantalla 9:16, mismo eje, a la distancia justa para el fov)
  const fov = 34
  const d = PANT_H / 2 / Math.tan(((fov / 2) * Math.PI) / 180)
  const px = MON[0], py = MON[1] + 0.07 + PANT_H / 2 + 0.012, pz = MON[2] + 0.0005
  return (
    <>
      <color attach="background" args={['#07120d']} />
      <fog attach="fog" args={['#07120d', 3, 9]} />
      <Luces ambiente={0.35} relleno={0.55} contra={1.0} />
      <Rincon lado={false} mic={false} lampara={[0.6, 0, -0.55]} planta={[-0.85, 0, -0.62]} />
      {/* mesita al lado */}
      <mesh position={[MON[0], 0.395, MON[2]]} castShadow receiveShadow><boxGeometry args={[0.26, 0.03, 0.3]} /><meshStandardMaterial color="#6b4a32" roughness={0.7} /></mesh>
      <mesh position={[MON[0], 0.19, MON[2]]} castShadow><boxGeometry args={[0.04, 0.38, 0.04]} /><meshStandardMaterial color="#2a2a2a" /></mesh>
      <mesh position={[MON[0], 0.01, MON[2]]}><boxGeometry args={[0.2, 0.02, 0.2]} /><meshStandardMaterial color="#2a2a2a" /></mesh>
      <Monitor giro={giro} />
      <Persona model="character-male-a" pos={() => [0, 0.25, -0.08]} extra={(h, t) => {
        // mientras gira el monitor, el brazo derecho va al borde de la pantalla y la empuja
        const k = suave(ramp(t, g0 - 0.3, g0)) * (1 - suave(ramp(t, g1 + 0.05, g1 + 0.4)))
        h['arm-right'].rotation.z += Number(Q.get('az') ?? -1.3) * k
        h['arm-right'].rotation.x += Number(Q.get('ax') ?? -0.5) * k
        h.head.rotation.y += -0.45 * k
      }} />
      <Camara keys={[
        [0, 0.3, 0.6, 1.75, -0.12, 0.44, -0.05, fov],
        [g1 + 0.15, 0.12, 0.62, 1.5, -0.18, 0.48, 0, fov],
        [e0, 0.0, 0.64, 1.3, -0.24, 0.54, 0, fov],
        [fin, px, py, pz + d, px, py, pz, fov],
      ]} />
    </>
  )
}

const SETS: Record<string, () => React.ReactElement> = { mora: SetMora, toto: SetToto, simon: SetSimon, lola: SetLola, nacho: SetNacho }

function Listo() {
  useEffect(() => {
    setTimeout(() => (W.__listo = true), 600)
  }, [])
  return null
}

export default function Sets() {
  const Set = SETS[SET ?? ''] ?? SetMora
  // las texturas con texto se dibujan una sola vez: primero tiene que estar cargada Geist
  const [fuente, setFuente] = useState(false)
  useEffect(() => {
    new FontFace('Geist', "url('/rec/geist.woff2')", { weight: '100 900' }).load().then((f) => {
      document.fonts.add(f)
      setFuente(true)
    })
  }, [])
  if (!fuente) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000' }}>
      <Canvas shadows dpr={window.devicePixelRatio} camera={{ fov: 34, near: 0.02, far: 120, position: [0, 1, 3] }} gl={{ antialias: true, preserveDrawingBuffer: true }}
        onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05 }}>
        <Suspense fallback={null}>
          <Set />
          <Listo />
        </Suspense>
      </Canvas>
    </div>
  )
}
