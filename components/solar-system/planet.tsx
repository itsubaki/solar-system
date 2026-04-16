"use client"

import { useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import type { Group, Mesh } from "three"
import type { PlanetData } from "@/lib/planet-data"

interface PlanetProps {
  data: PlanetData
  timeScale: number
  showOrbits: boolean
  showLabels: boolean
  onSelect: (planet: PlanetData | null) => void
  isSelected: boolean
}

export function Planet({ data, timeScale, showOrbits, showLabels, onSelect, isSelected }: PlanetProps) {
  const groupRef = useRef<Group>(null)
  const planetRef = useRef<Mesh>(null)
  const [hovered, setHovered] = useState(false)

  // Convert orbital period to angular velocity (radians per second)
  const orbitalSpeed = (2 * Math.PI) / (data.orbitalPeriod * 0.1)
  const rotationSpeed = (2 * Math.PI) / (data.rotationPeriod * 10)

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * orbitalSpeed * timeScale
    }
    if (planetRef.current) {
      planetRef.current.rotation.y += delta * rotationSpeed * timeScale
    }
  })

  return (
    <group ref={groupRef}>
      {/* Orbit path */}
      {showOrbits && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[data.distance - 0.02, data.distance + 0.02, 128]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.15} />
        </mesh>
      )}

      {/* Planet group positioned at orbital distance */}
      <group position={[data.distance, 0, 0]}>
        {/* Planet sphere */}
        <mesh
          ref={planetRef}
          onClick={() => onSelect(isSelected ? null : data)}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <sphereGeometry args={[data.radius, 32, 32]} />
          <meshStandardMaterial
            color={data.color}
            emissive={data.emissive || data.color}
            emissiveIntensity={hovered || isSelected ? 0.3 : 0.05}
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>

        {/* Rings (for Saturn, Uranus) */}
        {data.rings && (
          <mesh rotation={[Math.PI / 2.5, 0, 0]}>
            <ringGeometry args={[data.rings.innerRadius, data.rings.outerRadius, 64]} />
            <meshStandardMaterial
              color={data.rings.color}
              transparent
              opacity={0.7}
              side={2}
            />
          </mesh>
        )}

        {/* Moons */}
        {data.moons?.map((moon) => (
          <Moon key={moon.name} moon={moon} timeScale={timeScale} />
        ))}

        {/* Label */}
        {(showLabels || hovered || isSelected) && (
          <Html
            position={[0, data.radius + 0.3, 0]}
            center
            style={{
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            <div className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-all ${
              isSelected 
                ? "bg-primary text-primary-foreground" 
                : "bg-card/80 text-card-foreground backdrop-blur-sm"
            }`}>
              {data.name}
            </div>
          </Html>
        )}
      </group>
    </group>
  )
}

interface MoonProps {
  moon: NonNullable<PlanetData["moons"]>[number]
  timeScale: number
}

function Moon({ moon, timeScale }: MoonProps) {
  const groupRef = useRef<Group>(null)

  const orbitalSpeed = (2 * Math.PI) / (moon.orbitalPeriod * 2)

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * orbitalSpeed * timeScale
    }
  })

  return (
    <group ref={groupRef}>
      <mesh position={[moon.distance, 0, 0]}>
        <sphereGeometry args={[moon.radius, 16, 16]} />
        <meshStandardMaterial color={moon.color} roughness={0.9} />
      </mesh>
    </group>
  )
}
