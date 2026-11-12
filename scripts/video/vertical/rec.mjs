// Graba tomas verticales (1080x1920, 30 fps) de la demo orik-crew en ?rec.
// node rec.mjs [nombre1,nombre2]  (sin argumentos graba todas)
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import { SHOTS } from './shots.mjs'

const only = process.argv[2]?.split(',')
const OUT = 'tomas'
fs.mkdirSync(OUT, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const launch = () => puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, userDataDir: 'prof', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--hide-scrollbars'] })

for (const s of SHOTS) {
  if (only && !only.includes(s.n)) continue
  const b = await launch()
  const p = await b.newPage()
  await p.setViewport({ width: 540, height: 960, deviceScaleFactor: 2 })
  const [p0, t0] = s.keys[0]
  await p.goto(`http://localhost:5191/?rec&v=1&${s.q}&cam=${[...p0, ...t0].join(',')}`, { waitUntil: 'networkidle2' })
  await p.waitForFunction(() => !!window.__cc, { timeout: 30000 })
  await sleep(s.settle ?? 4000)

  const dir = `frames/${s.n}`
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
  // la cámara recorre los puntos clave con aceleración suave
  await p.evaluate((keys, dur) => new Promise((done) => {
    const cc = window.__cc
    const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
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
  }), s.keys, s.dur)
  await sleep(150)
  await cdp.send('Page.stopScreencast')
  await cdp.detach()

  // a 30 fps constantes según la hora real de cada cuadro
  const t = stamps.map((x) => x - stamps[0])
  const list = t.map((x, i) => `file '${String(i).padStart(5, '0')}.jpg'\nduration ${((t[i + 1] ?? x + 1 / 30) - x).toFixed(4)}`).join('\n')
  fs.writeFileSync(`${dir}/list.txt`, list + `\nfile '${String(t.length - 1).padStart(5, '0')}.jpg'\n`)
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', `${dir}/list.txt`, '-vf', 'fps=30,scale=1080:1920:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-movflags', '+faststart', `${OUT}/${s.n}.mp4`])
  await b.close()
  console.log(s.n, 'cuadros', stamps.length, 'fps medio', (stamps.length / t.at(-1)).toFixed(1))
}
