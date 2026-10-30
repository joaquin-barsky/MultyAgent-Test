const fs = require('fs')
const b = JSON.parse(fs.readFileSync('blank.json')).map(([i, t, s]) => [i, Number(t), Number(s)])
const base = b[0][2]
const a = b.find(([, t, s]) => t > 0.4 && s < base - 3)
const e = a && b.find(([, t, s]) => t > a[1] && s > base - 2)
fs.writeFileSync('cut.json', JSON.stringify(a && e ? { a: a[1], b: e[1] } : null))
console.log('base', base, 'cut', a?.[1], e?.[1])
