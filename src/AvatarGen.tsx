import { Suspense, useEffect, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { AGENTS } from './data/agents'
import { Character } from './three/models'

// Herramienta de desarrollo: saca un retrato de cada personaje y lo guarda en public/avatars
function Shot({ model, onDone }: { model: string; onDone: () => void }) {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    const t = setTimeout(async () => {
      const data = gl.domElement.toDataURL('image/png')
      await fetch('/__save-avatar', { method: 'POST', body: JSON.stringify({ name: `face-${model}`, data }) })
      onDone()
    }, 900)
    return () => clearTimeout(t)
  }, [gl, model, onDone])
  return null
}

export default function AvatarGen() {
  const [i, setI] = useState(0)
  const a = AGENTS[i]
  if (!a) return <p id="done">listo</p>
  return (
    <div style={{ width: 320, height: 320 }}>
      <Canvas key={a.id} gl={{ preserveDrawingBuffer: true, alpha: true }} camera={{ position: [0.5, 0.62, 2.05], fov: 26 }} onCreated={({ camera }) => camera.lookAt(0, 0.47, 0)}>
        <ambientLight intensity={1.1} />
        <directionalLight position={[2, 3, 3]} intensity={2.2} />
        <Suspense fallback={null}>
          <Character model={a.model} pose="idle" rotation-y={0.25} />
          <Shot model={a.model} onDone={() => setI((n) => n + 1)} />
        </Suspense>
      </Canvas>
    </div>
  )
}
