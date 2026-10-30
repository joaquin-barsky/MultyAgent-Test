import * as THREE from 'three'

// Monitor curvo largo: la curva mira hacia la persona sentada (lado -z del escritorio)
const R = 0.78 // radio de la curva
const ARC = 0.95 // ángulo que abarca la pantalla
const HEIGHT = 0.19

export function CurvedMonitor({ glow, dark }: { glow: string | null; dark: boolean }) {
  const screen = glow ?? (dark ? '#16222A' : '#2C3A42')
  return (
    <group position={[0, 0.38, 0.02]}>
      {/* centro de la curva hacia la silla, así la pantalla es cóncava para quien la mira */}
      <group position={[0, 0.17, -R]}>
        <mesh>
          <cylinderGeometry args={[R, R, HEIGHT, 32, 1, true, -ARC / 2, ARC]} />
          <meshStandardMaterial color={screen} emissive={glow ?? '#000000'} emissiveIntensity={glow ? 0.9 : 0} roughness={0.35} side={THREE.BackSide} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[R + 0.012, R + 0.012, HEIGHT + 0.018, 32, 1, true, -ARC / 2 - 0.01, ARC + 0.02]} />
          <meshStandardMaterial color="#1E262D" roughness={0.6} side={THREE.FrontSide} />
        </mesh>
      </group>
      {/* pie */}
      <mesh position={[0, 0.045, 0.012]} castShadow>
        <boxGeometry args={[0.04, 0.09, 0.025]} />
        <meshStandardMaterial color="#2A333B" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.005, -0.01]} castShadow>
        <boxGeometry args={[0.18, 0.012, 0.11]} />
        <meshStandardMaterial color="#2A333B" roughness={0.5} />
      </mesh>
    </group>
  )
}
