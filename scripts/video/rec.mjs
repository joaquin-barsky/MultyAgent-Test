import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
const OUT = 'rec/frames'
fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, userDataDir: 'rec-prof5', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--hide-scrollbars'] })
const p = await b.newPage()
await p.setViewport({ width: 1920, height: 1080 })
// cursor visible para el video (no es parte de la página)
await p.evaluateOnNewDocument(() => {
  addEventListener('DOMContentLoaded', () => {
    const c = document.createElement('div')
    c.id = 'rc'
    c.style.cssText = 'position:fixed;left:0;top:0;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:99px;background:rgba(20,32,43,.82);border:3px solid #fff;box-shadow:0 6px 18px rgba(0,0,0,.35);z-index:99999;pointer-events:none;transform:translate(960px,640px);transition:transform .5s cubic-bezier(.45,0,.2,1)'
    document.body.appendChild(c)
    const r = document.createElement('div')
    r.id = 'rr'
    r.style.cssText = 'position:fixed;left:0;top:0;width:60px;height:60px;margin:-30px 0 0 -30px;border-radius:99px;border:3px solid rgba(255,255,255,.9);z-index:99998;pointer-events:none;opacity:0'
    document.body.appendChild(r)
  })
})
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const frames = []
const cdp = await p.createCDPSession()
cdp.on('Page.screencastFrame', async (f) => {
  const i = frames.length
  frames.push(f.metadata.timestamp)
  fs.writeFileSync(`${OUT}/${String(i).padStart(5, '0')}.jpg`, Buffer.from(f.data, 'base64'))
  await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {})
})
let cur = [960, 640]
async function moveTo(x, y) {
  cur = [x, y]
  await p.evaluate((x, y) => { document.getElementById('rc').style.transform = `translate(${x}px,${y}px)` }, x, y)
  await p.mouse.move(x, y, { steps: 8 })
  await sleep(520)
}
async function click(x, y) {
  await moveTo(x, y)
  await p.evaluate((x, y) => {
    const r = document.getElementById('rr')
    r.animate([{ opacity: 1, transform: `translate(${x}px,${y}px) scale(.4)` }, { opacity: 0, transform: `translate(${x}px,${y}px) scale(1.2)` }], { duration: 500, easing: 'ease-out' })
  }, x, y)
  await p.mouse.click(x, y)
}
async function el(sel, text) {
  return p.evaluate((sel, text) => {
    const e = [...document.querySelectorAll(sel)].find((x) => !text || x.textContent.trim().startsWith(text))
    if (!e) return null
    const r = e.getBoundingClientRect()
    return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)]
  }, sel, text)
}
async function clickEl(sel, text) {
  const pos = await el(sel, text)
  if (!pos) { console.log('no encontré', sel, text); return false }
  await click(...pos)
  return true
}
const marks = {}
const mark = (k) => (marks[k] = Date.now() / 1000)

await p.goto('https://orik-crew.vercel.app/', { waitUntil: 'domcontentloaded' })
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 })
await p.waitForFunction(() => document.body.innerText.includes('Abriendo'), { polling: 50, timeout: 20000 }).catch(() => {})
await p.waitForFunction(() => !document.body.innerText.includes('Abriendo') && !!document.querySelector('canvas'), { polling: 50, timeout: 40000 })
mark('loaded')
await sleep(5600) // vuelo de entrada
mark('zona')
await click(1240, 545)
await sleep(1700)
mark('agente')
await click(730, 450) // Cata
await sleep(2300)
if (await el('.askcard .askbtn')) { await clickEl('.askcard .askbtn'); await sleep(1300) }
mark('memoria')
await clickEl('[role=tab]', 'Memoria')
await sleep(2200)
await clickEl('button[aria-label="Cerrar"]')
await sleep(500)
mark('tablero')
// la pregunta a Bruno va antes: contesta mientras se ve el tablero
await clickEl('textarea[placeholder="Preguntale a Bruno"]')
await p.keyboard.type('¿Qué pasó hoy?', { delay: 28 })
await p.keyboard.press('Enter')
await sleep(200)
await clickEl('[role=tab]', 'Tablero')
await sleep(2600)
if (await el('.tcard .askbtn')) { await clickEl('.tcard .askbtn'); await sleep(1000) }
await clickEl('button[aria-label="Cerrar tablero"]')
mark('bruno')
await sleep(2300)
mark('repaso')
await clickEl('button', 'Repaso del día')
await sleep(500)
await clickEl('button', 'Ver el día')
await sleep(3600)
await clickEl('button[aria-label="Cerrar repaso"]')
mark('noche')
await clickEl('button', 'Modo noche')
await sleep(2200)
mark('edificio')
await clickEl('[role=tab]', 'Edificio')
await sleep(3000)
mark('fin')
await cdp.send('Page.stopScreencast')
await sleep(300)
fs.writeFileSync('rec/frames.json', JSON.stringify({ frames, marks }))
console.log('frames', frames.length, 'dur', (frames.at(-1) - frames[0]).toFixed(1), JSON.stringify(Object.fromEntries(Object.entries(marks).map(([k, v]) => [k, (v - frames[0]).toFixed(1)]))))
await b.close()
