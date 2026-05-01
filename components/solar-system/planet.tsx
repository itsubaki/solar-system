"use client"

import { useRef, useState, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import { DoubleSide, Vector3, Color } from "three"
import type { Group, Mesh } from "three"
import type { PlanetData, SatelliteData } from "@/lib/planet-data"
import { getSatelliteOrbitAngle, degToRad } from "@/lib/planet-angle"
import { ringVertexShader, ringFragmentShader } from "@/lib/ring-shader"

type FocusTargetRef = {
    current: Vector3 | null
}

const SECONDS_PER_DAY = 60 * 60 * 24 // 86400 seconds per day
const BASE_ORBIT_LINE_WIDTH = 0.01
const BASE_CAMERA_DISTANCE = Math.sqrt(12)
const MIN_ORBIT_LINE_WIDTH = 0.002
const MAX_ORBIT_LINE_WIDTH = 0.08

export function Planet({
    data,
    initialOrbitAngle = 0,
    onSelect,
    isSelected,
    focusTargetRef,
    cameraDistance,
    scale,
}: {
    data: PlanetData
    initialOrbitAngle?: number
    onSelect: (planet: PlanetData | null) => void
    isSelected: boolean
    focusTargetRef?: FocusTargetRef | null
    cameraDistance: number
    scale: {
        distance: number,
        radius: number,
        orbitSpeed: number,
    }
}) {
    const groupRef = useRef<Group>(null)
    const planetRef = useRef<Mesh>(null)
    const worldPositionRef = useRef(new Vector3())
    const [hovered, setHovered] = useState(false)

    const orbitalSpeed = ((2 * Math.PI) / (data.orbitalPeriod * SECONDS_PER_DAY)) * scale.orbitSpeed
    let rotationSpeed = (2 * Math.PI) / (data.rotationPeriod * 10)
    if (data.name === "Venus") {
        // Venus has a retrograde rotation
        rotationSpeed *= -1
    }

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
                return
            }

            focusTargetRef.current = worldPositionRef.current.clone()
        }
    })

    const distance = data.distance * scale.distance
    const radius = data.radius * scale.radius
    const orbitalInclination = degToRad(data.orbitalInclination)
    const longitudeOfAscendingNode = degToRad(data.longitudeOfAscendingNode)
    const orbitLineWidth = useMemo(() => {
        const scaledWidth = BASE_ORBIT_LINE_WIDTH * (cameraDistance / BASE_CAMERA_DISTANCE)
        return Math.min(MAX_ORBIT_LINE_WIDTH, Math.max(MIN_ORBIT_LINE_WIDTH, scaledWidth))
    }, [cameraDistance])

    return (
        <group rotation={[0, longitudeOfAscendingNode, 0]}>
            <group rotation={[0, 0, orbitalInclination]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[
                        distance - orbitLineWidth,
                        distance + orbitLineWidth,
                        128,
                    ]} />
                    <meshBasicMaterial color="#4fc3f7" transparent opacity={0.4} side={DoubleSide} />
                </mesh>

                <group ref={groupRef} rotation={[0, initialOrbitAngle, 0]}>
                    <group position={[distance, 0, 0]}>
                        <mesh
                            ref={planetRef}
                            onPointerOver={() => setHovered(true)}
                            onPointerOut={() => setHovered(false)}
                            onClick={() => {
                                onSelect(data)
                            }}
                        >
                            <sphereGeometry args={[radius, 32, 32]} />
                            <meshStandardMaterial
                                color={data.color}
                                emissive={data.emissive || data.color}
                                emissiveIntensity={hovered || isSelected ? 0.3 : 0.05}
                                roughness={0.8}
                                metalness={0.1}
                            />
                        </mesh>

                        {Array.isArray(data.rings) && data.rings.map((ring, i) => (
                            <mesh key={i} rotation={[Math.PI / 2 + degToRad(data.obliquity), 0, 0]}>
                                <ringGeometry args={[ring.innerRadius * scale.radius, ring.outerRadius * scale.radius, 64]} />
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

                        {/* {data.satellites?.map((satellite) => (
                            <Satellite
                                key={satellite.name}
                                satellite={{ ...satellite, parentPlanetName: data.name }}
                                scale={{
                                    distance: scale.distance,
                                    radius: scale.radius,
                                    orbitSpeed: scale.orbitSpeed,
                                }}
                            />
                        ))} */}

                        <Html
                            position={[0, radius + 0.02, 0]}
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
                                    onSelect(data);
                                }}
                            >
                                {data.name}
                            </div>
                        </Html>
                    </group>
                </group>
            </group>
        </group>
    )
}

function Satellite({
    satellite,
    scale,
}: {
    satellite: SatelliteData & { parentPlanetName: string }
    scale: {
        distance: number,
        radius: number,
        orbitSpeed: number,
    }
}) {
    const groupRef = useRef<Group>(null)
    const [hovered, setHovered] = useState(false)
    const initialAngle = getSatelliteOrbitAngle(satellite.parentPlanetName, satellite)
    let orbitalSpeed = ((2 * Math.PI) / (satellite.orbitalPeriod * SECONDS_PER_DAY)) * scale.orbitSpeed
    if (satellite.parentPlanetName === "Neptune" && satellite.name === "Triton") {
        orbitalSpeed *= -1
    }

    useFrame((_, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * orbitalSpeed
        }
    })

    const distance = satellite.distance * scale.distance
    const radius = satellite.radius * scale.radius

    return (
        <group ref={groupRef} rotation={[0, initialAngle, 0]}>
            <group position={[distance, 0, 0]}>
                <mesh
                    onPointerOver={() => setHovered(true)}
                    onPointerOut={() => setHovered(false)}
                >
                    <sphereGeometry args={[radius, 16, 16]} />
                    <meshStandardMaterial
                        color={satellite.color}
                        roughness={0.9}
                        emissive={satellite.color}
                        emissiveIntensity={hovered ? 0.3 : 0.1}
                    />
                </mesh>


                <Html
                    position={[0, radius + 0.02, 0]}
                    center
                    style={{ pointerEvents: "none", userSelect: "none" }}
                >
                    <div
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap bg-card/70 text-muted-foreground backdrop-blur-sm border border-border/40"
                    >
                        {satellite.name}
                    </div>
                </Html>
            </group>
        </group>
    )
}
