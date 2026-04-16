"use client"

import { useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import { DoubleSide } from "three"
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
          <meshBasicMaterial color="#ffffff" transparent opacity={0.15} side={DoubleSide} />
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
              side={DoubleSide}
            />
          </mesh>
        )}

        {/* Satellites */}
        {data.satellites?.map((satellite) => (
          <Satellite key={satellite.name} satellite={satellite} timeScale={timeScale} showLabels={showLabels} />
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
            <div className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-all ${isSelected
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

interface SatelliteProps {
  satellite: NonNullable<PlanetData["satellites"]>[number]
  timeScale: number
  showLabels: boolean
}

function Satellite({ satellite, timeScale, showLabels }: SatelliteProps) {
  const groupRef = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)

  const orbitalSpeed = (2 * Math.PI) / (satellite.orbitalPeriod * 2)

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * orbitalSpeed * timeScale
    }
  })

  return (
    <group ref={groupRef}>
      <group position={[satellite.distance, 0, 0]}>
        <mesh
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <sphereGeometry args={[satellite.radius, 16, 16]} />
          <meshStandardMaterial
            color={satellite.color}
            roughness={0.9}
            emissive={satellite.color}
            emissiveIntensity={hovered ? 0.25 : 0.0}
          />
        </mesh>

        {/* Satellite label */}
        {(showLabels || hovered) && (
          <Html
            position={[0, satellite.radius + 0.15, 0]}
            center
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            <div
              className="px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap bg-card/70 text-muted-foreground backdrop-blur-sm border border-border/40"
            >
              {satellite.name}
            </div>
          </Html>
        )}
      </group>
    </group>
  )
}
