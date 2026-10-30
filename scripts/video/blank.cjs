const fs = require('fs')
const sharp = require('../node_modules/sharp')
const { frames, marks } = JSON.parse(fs.readFileSync(__dirname + '/frames.json'))
;(async () => {
  const out = []
  for (let i = 0; i < frames.length; i++) {
    if (frames[i] < marks.edificio) continue
    if (frames[i] > marks.edificio + 3) break
    const st = await sharp(`${__dirname}/frames/${String(i).padStart(5, '0')}.jpg`).extract({ left: 100, top: 150, width: 1300, height: 800 }).stats()
    out.push([i, (frames[i] - marks.edificio).toFixed(2), st.channels[0].stdev.toFixed(1)])
  }
  console.log(out.filter((_, k) => k % 6 === 0).map((x) => x.join(':')).join('  '))
  fs.writeFileSync(__dirname + '/blank.json', JSON.stringify(out))
})()
