import * as THREE from 'three'
import { useProgress, type CameraControls } from '@react-three/drei'

let played = false
let live = false

/** si el usuario ya fue a otro lado (un piso, el recorrido), el vuelo de entrada no lo pisa */
export const cancelIntro = () => {
  live = false
}
export const introPending = () => live

/** primera vez que se abre la página: la cámara arranca lejos y más arriba, y cuando terminan de cargar los modelos baja girando hasta la oficina */
export function introFly(c: CameraControls, p: THREE.Vector3, t: THREE.Vector3) {
  if (played) return false
  played = true
  const q = new URLSearchParams(location.search)
  if (q.get('piso') || q.get('agente') || q.get('cam')) return false
  const s = new THREE.Spherical().setFromVector3(p.clone().sub(t))
  const far = new THREE.Vector3().setFromSpherical(new THREE.Spherical(Math.min(68, s.radius * 2.4), Math.max(0.37, s.phi - 0.6), s.theta - 1.3)).add(t)
  c.setLookAt(far.x, far.y, far.z, t.x, t.y, t.z, false)
  live = true
  const t0 = performance.now()
  const go = () => {
    // espera a que se vea la oficina (como mucho 6 s), si no el vuelo pasa con la pantalla vacía
    const pr = useProgress.getState()
    const ready = !pr.active && pr.total > 0
    if (!ready && performance.now() - t0 < 7000) return void setTimeout(go, 120)
    setTimeout(() => {
      if (!live) return
      live = false
      c.smoothTime = 2.1
      c.setLookAt(p.x, p.y, p.z, t.x, t.y, t.z, true)
    }, 450)
  }
  go()
  return true
}
