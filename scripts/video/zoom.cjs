const fs = require('fs')
const { frames, marks } = JSON.parse(fs.readFileSync('frames.json'))
const start = marks.loaded + 0.4
const end = marks.fin
// se saca el rato en que la vista del edificio está cargando (pantalla vacía): corte directo
const cut = JSON.parse(fs.readFileSync('cut.json'))
const cutA = marks.edificio + cut.a
const cutB = marks.edificio + cut.b
const cutLen = cutB - cutA
const vt = (t) => (t >= cutB ? t - cutLen : t) - start
const m = (k) => vt(marks[k])
const idx = frames.map((t, i) => [t, i]).filter(([t]) => t >= start && t <= end && !(t >= cutA && t < cutB))
const NL = String.fromCharCode(10)
let L = 'ffconcat version 1.0' + NL
for (let k = 0; k < idx.length; k++) {
  const d = k < idx.length - 1 ? vt(idx[k + 1][0]) - vt(idx[k][0]) : 0.05
  L += 'file frames/' + String(idx[k][1]).padStart(5, '0') + '.jpg' + NL + 'duration ' + d.toFixed(4) + NL
}
L += 'file frames/' + String(idx.at(-1)[1]).padStart(5, '0') + '.jpg' + NL
fs.writeFileSync('list.txt', L)
console.log('dur', (vt(idx.at(-1)[0]) - vt(idx[0][0])).toFixed(2))
// tramos con la pantalla quieta: [desde, hasta, centro x, centro y]
const segs = [
  [m('zona') + 2.0, m('agente'), 0.45, 0.5],
  [m('agente') + 0.9, m('memoria'), 0.4, 0.42],
  [m('memoria') + 0.9, m('tablero'), 0.42, 0.42],
  [m('tablero') + 0.8, m('bruno'), 0.38, 0.45],
  [m('bruno') + 0.3, m('repaso'), 1.0, 0.62],
  [m('repaso') + 0.8, m('noche'), 0.35, 1.0],
  [m('noche') + 0.6, m('edificio'), 0.42, 0.5],
  [vt(cutB) + 0.1, vt(end) + 0.5, 0.42, 0.5],
]
const A = 0.045
const S = (x) => `(${x})*(${x})*(3-2*(${x}))`
const terms = []
const cx = []
const cy = []
for (const [a, c0, x, y] of segs) {
  const b = c0 - 0.05 // termina de acercarse justo antes de que se mueva el cursor
  const c = c0 + 0.45 // y se aleja mientras el cursor va al próximo botón
  terms.push(`if(between(t,${a.toFixed(3)},${b.toFixed(3)}),${S(`(t-${a.toFixed(3)})/${(b - a).toFixed(3)}`)},if(between(t,${b.toFixed(3)},${c.toFixed(3)}),1-${S(`(t-${b.toFixed(3)})/${(c - b).toFixed(3)}`)},0))`)
  cx.push([a - 0.1, c, x])
  cy.push([a - 0.1, c, y])
}
const Z = `(1+${A}*(${terms.join('+')}))`
const pick = (arr, def) => arr.reduceRight((acc, [a, c, v]) => `if(between(t,${a.toFixed(3)},${c.toFixed(3)}),${v},${acc})`, String(def))
const vf = `fps=30,scale=w='trunc(1920*${Z}/2)*2':h='trunc(1080*${Z}/2)*2':eval=frame:flags=lanczos,crop=1920:1080:x='(iw-1920)*${pick(cx, 0.5)}':y='(ih-1080)*${pick(cy, 0.5)}',format=yuv420p`
fs.writeFileSync('vf.txt', vf)
console.log(segs.map((s) => s.slice(0, 2).map((v) => v.toFixed(1)).join('-')).join(' '))
