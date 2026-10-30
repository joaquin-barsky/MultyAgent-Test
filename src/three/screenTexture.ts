import * as THREE from 'three'
import { RESULTS } from '../data/results'

// Lo que se ve en el monitor curvo de cada agente: una mini pantalla con su trabajo. Una textura por agente, dibujada una vez.
const W = 768
const H = 196
const cache = new Map<string, THREE.CanvasTexture>()

function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath()
  c.roundRect(x, y, w, h, r)
  c.fill()
}

function draw(c: CanvasRenderingContext2D, id: string, color: string, imgs: HTMLImageElement[]) {
  const r = RESULTS[id]
  c.fillStyle = '#0E161D'
  c.fillRect(0, 0, W, H)
  // barra superior de la "app"
  c.fillStyle = '#18232C'
  c.fillRect(0, 0, W, 30)
  c.fillStyle = color
  rr(c, 14, 9, 12, 12, 6)
  c.fillStyle = 'rgba(255,255,255,0.55)'
  rr(c, 36, 11, 150, 8, 4)
  c.fillStyle = 'rgba(255,255,255,0.18)'
  rr(c, W - 120, 11, 100, 8, 4)
  // barra lateral
  c.fillStyle = '#131D25'
  c.fillRect(0, 30, 88, H - 30)
  for (let i = 0; i < 5; i++) {
    c.fillStyle = i === 1 ? color : 'rgba(255,255,255,0.16)'
    rr(c, 16, 46 + i * 28, 56, 10, 5)
  }
  const x0 = 104
  const y0 = 44
  const cw = W - x0 - 16
  if (!r) return
  switch (r.kind) {
    case 'post':
    case 'video':
    case 'gallery': {
      const n = Math.max(1, imgs.length)
      const size = Math.min(132, (cw - (n - 1) * 10) / Math.min(n, 4))
      imgs.slice(0, 4).forEach((img, i) => {
        if (img.complete && img.naturalWidth) c.drawImage(img, x0 + i * (size + 10), y0, size, size)
        else {
          c.fillStyle = 'rgba(255,255,255,0.1)'
          c.fillRect(x0 + i * (size + 10), y0, size, size)
        }
      })
      if (r.kind !== 'gallery') {
        const tx = x0 + size + 22
        c.fillStyle = 'rgba(255,255,255,0.85)'
        rr(c, tx, y0 + 6, 230, 14, 7)
        for (let i = 0; i < 4; i++) {
          c.fillStyle = 'rgba(255,255,255,0.28)'
          rr(c, tx, y0 + 36 + i * 22, 320 - i * 50, 9, 4)
        }
        c.fillStyle = color
        rr(c, tx, y0 + 120, 110, 16, 8)
      }
      break
    }
    case 'chat':
      r.msgs.slice(-4).forEach((m, i) => {
        const w = Math.min(420, 120 + m.text.length * 5)
        c.fillStyle = m.me ? color : 'rgba(255,255,255,0.2)'
        rr(c, m.me ? W - 16 - w : x0, y0 + i * 36, w, 26, 13)
      })
      break
    case 'doc':
      c.fillStyle = 'rgba(255,255,255,0.85)'
      rr(c, x0, y0, 260, 14, 7)
      r.lines.forEach((_, i) => {
        c.fillStyle = color
        rr(c, x0, y0 + 32 + i * 28, 10, 10, 5)
        c.fillStyle = 'rgba(255,255,255,0.3)'
        rr(c, x0 + 22, y0 + 33 + i * 28, 300 + ((i * 97) % 180), 9, 4)
      })
      break
    case 'stats': {
      const bw = (cw - 3 * 14) / 4
      r.items.forEach((_, i) => {
        c.fillStyle = '#18232C'
        rr(c, x0 + i * (bw + 14), y0, bw, 56, 10)
        c.fillStyle = color
        rr(c, x0 + i * (bw + 14) + 12, y0 + 14, bw * 0.5, 14, 7)
      })
      for (let i = 0; i < 12; i++) {
        const h = 20 + ((i * 37) % 60)
        c.fillStyle = i === 11 ? color : 'rgba(255,255,255,0.22)'
        rr(c, x0 + i * (cw / 12), H - 16 - h, cw / 12 - 8, h, 4)
      }
      break
    }
  }
}

export function screenTexture(id: string, color: string) {
  const hit = cache.get(id)
  if (hit) return hit
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const c = cv.getContext('2d')!
  const r = RESULTS[id]
  const srcs = r && (r.kind === 'post' || r.kind === 'video') ? [r.img] : r && r.kind === 'gallery' ? r.imgs : []
  const imgs = srcs.map((s) => {
    const img = new Image()
    img.src = s
    return img
  })
  draw(c, id, color, imgs)
  const t = new THREE.CanvasTexture(cv)
  t.colorSpace = THREE.SRGBColorSpace
  // se mira desde adentro de la curva: se espeja para que no quede al revés
  t.wrapS = THREE.RepeatWrapping
  t.repeat.x = -1
  imgs.forEach((img) =>
    img.addEventListener('load', () => {
      draw(c, id, color, imgs)
      t.needsUpdate = true
    }),
  )
  cache.set(id, t)
  return t
}
