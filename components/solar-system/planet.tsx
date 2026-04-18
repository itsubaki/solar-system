"use client"

import { useRef, useState, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import { DoubleSide, Vector3, Color } from "three"
import type { Group, Mesh } from "three"
import type { PlanetData, SatelliteData } from "@/lib/planet-data"
import { getSatelliteOrbitAngle } from "@/lib/planet-angle"
import { ringVertexShader, ringFragmentShader } from "./ring-shader"

type FocusTargetRef = {
    current: Vector3 | null
}

const SECONDS_PER_DAY = 86400

interface PlanetProps {
    data: PlanetData
    initialOrbitAngle?: number
    orbitSpeedScale: number
    showOrbits: boolean
    showLabels: boolean
    onSelect: (planet: PlanetData | null) => void
    isSelected: boolean
    focusTargetRef?: FocusTargetRef | null
}

export function Planet({
    data,
    initialOrbitAngle = 0,
    orbitSpeedScale,
    showOrbits,
    showLabels,
    onSelect,
    isSelected,
    focusTargetRef
}: PlanetProps) {
    const groupRef = useRef<Group>(null)
    const planetRef = useRef<Mesh>(null)
    const worldPositionRef = useRef(new Vector3())
    const [hovered, setHovered] = useState(false)

    const orbitalSpeed = ((2 * Math.PI) / (data.orbitalPeriod * SECONDS_PER_DAY)) * orbitSpeedScale
    const rotationSpeed = (2 * Math.PI) / (data.rotationPeriod * 10)

    useFrame((_, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * orbitalSpeed
        }

        if (planetRef.current) {
            planetRef.current.rotation.y += delta * rotationSpeed
        }

        if (focusTargetRef && planetRef.current) {
            planetRef.current.getWorldPosition(worldPositionRef.current)
            if (focusTargetRef.current) {
                focusTargetRef.current.copy(worldPositionRef.current)
            } else {
                focusTargetRef.current = worldPositionRef.current.clone()
            }
        }
    })

    return (
        <group ref={groupRef} rotation={[0, initialOrbitAngle, 0]}>
            {showOrbits && (
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[data.distance - 0.03, data.distance + 0.03, 128]} />
                    <meshBasicMaterial color="#4fc3f7" transparent opacity={0.4} side={DoubleSide} />
                </mesh>
            )}

            <group position={[data.distance, 0, 0]}>
                <mesh
                    ref={planetRef}
                    onClick={() => {
                        if (!isSelected) {
                            onSelect(data)
                        }
                    }}
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

                {Array.isArray(data.rings) && data.rings.map((ring, i) => (
                    <mesh key={i} rotation={[Math.PI / 2.5, 0, 0]}>
                        <ringGeometry args={[ring.innerRadius, ring.outerRadius, 64]} />
                        <shaderMaterial
                            attach="material"
                            vertexShader={ringVertexShader}
                            fragmentShader={ringFragmentShader}
                            transparent
                            side={DoubleSide}
                            uniforms={useMemo(() => ({
                                innerColor: { value: new Color(ring.color) },
                                outerColor: { value: new Color("white") },
                                innerAlpha: { value: 0.7 },
                                outerAlpha: { value: 0.1 },
                            }), [ring.color])}
                        />
                    </mesh>
                ))}

                {data.satellites?.map((satellite) => (
                    <Satellite
                        key={satellite.name}
                        satellite={{ ...satellite, parentPlanetName: data.name }}
                        orbitSpeedScale={orbitSpeedScale}
                        showLabels={showLabels}
                    />
                ))}

                {(showLabels || hovered || isSelected) && (
                    <Html
                        position={[0, data.radius + 0.3, 0]}
                        center
                        style={{
                            pointerEvents: "auto",
                            userSelect: "none",
                        }}
                    >
                        <div
                            className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-all ${isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-card/80 text-card-foreground backdrop-blur-sm"
                                }`}
                            style={{ cursor: "pointer" }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!isSelected) {
                                    onSelect(data);
                                }
                            }}
                        >
                            {data.name}
                        </div>
                    </Html>
                )}
            </group>
        </group>
    )
}

interface SatelliteProps {
    satellite: SatelliteData & { parentPlanetName: string }
    orbitSpeedScale: number
    showLabels: boolean
}

function Satellite({
    satellite,
    orbitSpeedScale,
    showLabels,
}: SatelliteProps) {
    const groupRef = useRef<Group>(null)
    const [hovered, setHovered] = useState(false)
    const initialAngle = getSatelliteOrbitAngle(satellite.parentPlanetName, satellite)
    let orbitalSpeed = ((2 * Math.PI) / (satellite.orbitalPeriod * SECONDS_PER_DAY)) * orbitSpeedScale
    if (satellite.parentPlanetName === "Neptune" && satellite.name === "Triton") {
        orbitalSpeed *= -1
    }

    useFrame((_, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * orbitalSpeed
        }
    })

    return (
        <group ref={groupRef} rotation={[0, initialAngle, 0]}>
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
                        emissiveIntensity={hovered ? 0.3 : 0.1}
                    />
                </mesh>

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
