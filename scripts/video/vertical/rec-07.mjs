// Tomas verticales para el video "24 horas en mi empresa" (VIDS orik-07-24-horas). Igual que rec.mjs, pero con sus
// propias tomas (shots-07.mjs), carpeta de salida por argumento y un modo de fotos para probar encuadres y luces.
//   node rec-07.mjs <carpeta de salida> [toma1,toma2]            graba (todas si no se nombran)
//   node rec-07.mjs <carpeta de salida> [toma1,toma2] --fotos    saca una foto del primer y del último punto de cada toma
// Necesita el dev server en el puerto 5191 (?rec, solo desarrollo).
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { SHOTS } from './shots-07.mjs'

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const FOTOS = process.argv.includes('--fotos')
const OUT = path.resolve(args[0] ?? 'tomas-06')
const only = args[1]?.split(',')
fs.mkdirSync(OUT, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const TMP = path.join(os.tmpdir(), 'orik-rec-07')

const launch = () => puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, userDataDir: path.join(TMP, 'prof'), args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--hide-scrollbars'] })

for (const s of SHOTS) {
  if (only && !only.includes(s.n)) continue
  const b = await launch()
  const p = await b.newPage()
  await p.setViewport({ width: 540, height: 960, deviceScaleFactor: 2 })
  const [p0, t0] = s.keys[0]
  await p.goto(`http://localhost:5191/?rec&v=1&${s.q}&cam=${[...p0, ...t0].join(',')}`, { waitUntil: 'networkidle2' })
  await p.waitForFunction(() => !!window.__cc, { timeout: 30000 })
  // una tecla saca el recorrido automático si arrancó mientras cargaba (pasa con la caché fría)
  await p.keyboard.press('Shift')
  await sleep(s.settle ?? 4000)
  await p.keyboard.press('Shift')
  await p.evaluate((key) => window.__cc.setLookAt(...key[0], ...key[1], false), s.keys[0])
  await sleep(600)

  if (FOTOS) {
    for (const [k, key] of [[0, s.keys[0]], [1, s.keys.at(-1)]]) {
      await p.evaluate((key) => window.__cc.setLookAt(...key[0], ...key[1], false), key)
      await sleep(500)
      await p.screenshot({ path: path.join(OUT, `${s.n}_${k}.jpg`), type: 'jpeg', quality: 88 })
    }
    await b.close()
    console.log(s.n, 'fotos')
    continue
  }

  const dir = path.join(TMP, 'frames', s.n)
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  const cdp = await p.createCDPSession()
  const stamps = []
  cdp.on('Page.screencastFrame', async (f) => {
    stamps.push(f.metadata.timestamp)
    fs.writeFileSync(`${dir}/${String(stamps.length - 1).padStart(5, '0')}.jpg`, Buffer.from(f.data, 'base64'))
    await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {})
  })
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1080, maxHeight: 1920, everyNthFrame: 1 })
  // la cámara recorre los puntos clave: `curva` 'salida' arranca rápido y frena largo; por defecto acelera y frena
  await p.evaluate((keys, dur, curva) => new Promise((done) => {
    const cc = window.__cc
    const ease = curva === 'salida' ? (x) => 1 - Math.pow(1 - x, 3) : curva === 'lineal' ? (x) => x : (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
    const lerp = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k)
    const start = performance.now()
    const step = () => {
      const u = Math.min(1, (performance.now() - start) / (dur * 1000))
      const seg = Math.min(keys.length - 2, Math.floor(u * (keys.length - 1)))
      const k = ease(u * (keys.length - 1) - seg)
      const pos = lerp(keys[seg][0], keys[seg + 1][0], k)
      const tgt = lerp(keys[seg][1], keys[seg + 1][1], k)
      cc.setLookAt(...pos, ...tgt, false)
      if (u < 1) requestAnimationFrame(step)
      else done()
    }
    step()
  }), s.keys, s.dur, s.curva ?? '')
  await sleep(150)
  await cdp.send('Page.stopScreencast')
  await cdp.detach()

  // a 30 fps constantes según la hora real de cada cuadro
  const t = stamps.map((x) => x - stamps[0])
  const list = t.map((x, i) => `file '${String(i).padStart(5, '0')}.jpg'\nduration ${((t[i + 1] ?? x + 1 / 30) - x).toFixed(4)}`).join('\n')
  fs.writeFileSync(`${dir}/list.txt`, list + `\nfile '${String(t.length - 1).padStart(5, '0')}.jpg'\n`)
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', `${dir}/list.txt`, '-vf', 'fps=30,scale=1080:1920:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-movflags', '+faststart', path.join(OUT, `${s.n}.mp4`)])
  await b.close()
  console.log(s.n, 'cuadros', stamps.length, 'fps medio', (stamps.length / t.at(-1)).toFixed(1))
}
