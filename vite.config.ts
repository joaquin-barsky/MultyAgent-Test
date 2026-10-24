import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Solo en desarrollo: guarda los avatares que renderiza /?gen=avatars
function saveAvatars(): Plugin {
  return {
    name: 'save-avatars',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__save-avatar', (req, res) => {
        let body = ''
        req.on('data', (c) => (body += c))
        req.on('end', () => {
          const { name, data } = JSON.parse(body) as { name: string; data: string }
          const safe = name.replace(/[^a-z0-9-]/gi, '')
          writeFileSync(resolve('public/avatars', `${safe}.png`), Buffer.from(data.split(',')[1], 'base64'))
          res.end('ok')
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), saveAvatars()],
})
