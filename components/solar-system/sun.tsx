"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import type { Mesh } from "three"
import { SUN_DATA } from "@/lib/planet-data"

export function Sun() {
  const meshRef = useRef<Mesh>(null)

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1
    }
  })

  return (
    <group>
      {/* Sun mesh */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[SUN_DATA.radius, 64, 64]} />
        <meshStandardMaterial
          color={SUN_DATA.color}
          emissive={SUN_DATA.emissive}
          emissiveIntensity={SUN_DATA.emissiveIntensity}
        />
      </mesh>
      
      {/* Sun glow effect */}
      <mesh scale={1.2}>
        <sphereGeometry args={[SUN_DATA.radius, 32, 32]} />
        <meshBasicMaterial
          color="#FDB813"
          transparent
          opacity={0.3}
        />
      </mesh>
      
      {/* Point light from sun */}
      <pointLight
        color="#FFF5E0"
        intensity={500}
        distance={100}
        decay={2}
      />
    </group>
  )
}
