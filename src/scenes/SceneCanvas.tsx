import { Suspense, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { Bounds, OrbitControls, AdaptiveDpr } from '@react-three/drei'
import { useCrew } from '../sim/store'

export function SceneCanvas({
  children,
  camera,
  margin = 1.05,
  target = [0, 0, 0],
  polar = [0.6, 1.15],
  extra,
}: {
  extra?: ReactNode
  children: ReactNode
  camera: [number, number, number]
  margin?: number
  target?: [number, number, number]
  polar?: [number, number]
}) {
  const select = useCrew((s) => s.select)
  return (
    <div className="scene-area absolute inset-x-0 top-[118px] bottom-[160px] sm:top-[80px] lg:bottom-0 lg:left-[320px] lg:right-[350px]">
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: camera, fov: 30, near: 0.1, far: 200 }}
      gl={{ antialias: true, alpha: true }}
      onPointerMissed={() => select(null)}
      onCreated={(s) => {
        if (import.meta.env.DEV) (window as unknown as { __r3f: unknown }).__r3f = s
      }}
    >
      <AdaptiveDpr />
      {extra}
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={margin} maxDuration={0.8}>
          {children}
        </Bounds>
      </Suspense>
      <OrbitControls
        makeDefault
        target={target}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minPolarAngle={polar[0]}
        maxPolarAngle={polar[1]}
        minAzimuthAngle={-0.2}
        maxAzimuthAngle={1.75}
        minDistance={6}
        maxDistance={60}
      />
    </Canvas>
    </div>
  )
}
