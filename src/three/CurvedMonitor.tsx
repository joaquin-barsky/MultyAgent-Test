import * as THREE from 'three'

// Monitor curvo largo: la curva mira hacia la persona sentada (lado -z del escritorio)
const R = 0.78 // radio de la curva
const ARC = 0.95 // ángulo que abarca la pantalla
const HEIGHT = 0.19

/** content: lo que muestra la pantalla; glow: color liso (por ejemplo amarillo cuando te necesita); accent: tira de luz atrás, la que se ve desde la cámara */
export function CurvedMonitor({ content, glow, dark, accent }: { content?: THREE.Texture | null; glow?: string | null; dark: boolean; accent?: string | null }) {
  const on = !!content || !!glow
  const base = glow ?? (dark ? '#16222A' : '#2C3A42')
  const shell = dark ? '#3A4652' : '#E3E8EC'
  return (
    <group position={[0, 0.38, 0.02]}>
      {/* centro de la curva hacia la silla, así la pantalla es cóncava para quien la mira */}
      <group position={[0, 0.17, -R]}>
        <mesh>
          <cylinderGeometry args={[R, R, HEIGHT, 32, 1, true, -ARC / 2, ARC]} />
          {content && !glow ? (
            <meshBasicMaterial map={content} toneMapped={false} side={THREE.BackSide} />
          ) : (
            <meshStandardMaterial color={base} emissive={glow ?? '#000000'} emissiveIntensity={on ? 0.9 : 0} roughness={0.35} side={THREE.BackSide} />
          )}
        </mesh>
        <mesh>
          <cylinderGeometry args={[R + 0.012, R + 0.012, HEIGHT + 0.018, 32, 1, true, -ARC / 2 - 0.01, ARC + 0.02]} />
          <meshStandardMaterial color={shell} roughness={0.45} metalness={0.1} side={THREE.FrontSide} />
        </mesh>
        {/* tira de luz en la espalda del monitor: prendida mientras trabaja */}
        <mesh position-y={-HEIGHT / 2 + 0.018}>
          <cylinderGeometry args={[R + 0.016, R + 0.016, 0.009, 32, 1, true, -ARC / 2 + 0.04, ARC - 0.08]} />
          {accent ? <meshBasicMaterial color={accent} toneMapped={false} /> : <meshStandardMaterial color={dark ? '#2B3540' : '#C9D1D8'} roughness={0.5} />}
        </mesh>
      </group>
      {/* pie */}
      <mesh position={[0, 0.045, 0.012]} castShadow>
        <boxGeometry args={[0.04, 0.09, 0.025]} />
        <meshStandardMaterial color={shell} roughness={0.45} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.005, -0.01]} castShadow>
        <boxGeometry args={[0.18, 0.012, 0.11]} />
        <meshStandardMaterial color={shell} roughness={0.45} metalness={0.1} />
      </mesh>
    </group>
  )
}
