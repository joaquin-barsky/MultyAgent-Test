// Graba los decorados de ?rec&set=… (src/rec/Sets.tsx) CUADRO POR CUADRO: pone window.__t, espera dos cuadros y saca la foto.
// Así lo que pasa en la escena cae justo en los tiempos de la voz, sin depender de la velocidad de la máquina.
//   node rec-sets.mjs <set> <cfg.json> <salida.mp4> [--fotos 0,1.5,3]   (con --fotos solo saca esos cuadros como jpg)
// cfg.json: { dur, habla: [[a,b]…], …tiempos del set } en segundos de la escena. Necesita el dev server en el puerto 5191.
// Si el set tiene pantalla (nacho), deja <salida>.esquinas.json con las 4 esquinas de la pantalla en cada cuadro (1080x1920).
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execFileSync } from 'node:child_process'

const [set, cfgPath, salida] = process.argv.slice(2)
const iF = process.argv.indexOf('--fotos')
const fotos = iF > 0 ? process.argv[iF + 1].split(',').map(Number) : null
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
const FPS = 30
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, userDataDir: path.join(os.tmpdir(), 'orik-rec-sets'), args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--hide-scrollbars'] })
const p = await b.newPage()
p.on('pageerror', (e) => console.log('error en la página:', e.message))
await p.setViewport({ width: 540, height: 960, deviceScaleFactor: 2 })
await p.evaluateOnNewDocument((c) => { window.__cfg = c; window.__t = 0 }, cfg)
await p.goto(`http://localhost:5191/?rec&set=${set}${process.env.EXTRA ?? ''}`, { waitUntil: 'load', timeout: 120000 })
await p.waitForFunction(() => window.__listo === true, { timeout: 60000 })
await sleep(3000)

// el cuadro se lee del canvas mismo (preserveDrawingBuffer): la foto de la página a veces sale antes de que el compositor lo pinte
const cuadro = async (t) => {
  const url = await p.evaluate((t) => new Promise((r) => {
    window.__t = t
    requestAnimationFrame(() => requestAnimationFrame(() => r(document.querySelector('canvas').toDataURL('image/jpeg', 0.94))))
  }), t)
  return Buffer.from(url.split(',')[1], 'base64')
}

if (fotos) {
  const dir = path.dirname(salida)
  fs.mkdirSync(dir, { recursive: true })
  for (const t of fotos) {
    // la primera foto a veces sale antes de que suban las sombras: se descarta una
    await cuadro(t)
    fs.writeFileSync(`${salida.replace(/\.mp4$/, '')}_${t.toFixed(2)}.jpg`, await cuadro(t))
  }
} else {
  const dir = path.join(os.tmpdir(), 'orik-frames-sets', set)
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  const n = Math.ceil(cfg.dur * FPS) + 1
  const esquinas = []
  await cuadro(0)
  for (let i = 0; i < n; i++) {
    fs.writeFileSync(`${dir}/${String(i).padStart(5, '0')}.jpg`, await cuadro(i / FPS))
    esquinas.push(await p.evaluate(() => (window.__esquinas ? window.__esquinas() : null)))
    if (i % 30 === 0) process.stdout.write(`${set} ${i}/${n}\r`)
  }
  fs.mkdirSync(path.dirname(salida), { recursive: true })
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', `${dir}/%05d.jpg`, '-vf', 'scale=1080:1920:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-crf', '15', '-preset', 'slow', '-movflags', '+faststart', salida])
  if (esquinas[0]) fs.writeFileSync(salida.replace(/\.mp4$/, '.esquinas.json'), JSON.stringify(esquinas.map((e) => e.map((v) => v.map((x) => +x.toFixed(1))))))
  console.log(`${set}: ${n} cuadros → ${salida}`)
}
await b.close()
