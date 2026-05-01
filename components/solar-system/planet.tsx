"use client"

import { useRef, useState, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { Html, Line } from "@react-three/drei"
import { DoubleSide, Vector3, Color } from "three"
import type { Group, Mesh } from "three"
import type { PlanetData, SatelliteData } from "@/lib/planet-data"
import { getPlanetOrbitPath, getPlanetOrbitPosition, getSatelliteOrbitPath, getSatelliteOrbitPosition, degToRad } from "@/lib/planet-angle"
import { ringVertexShader, ringFragmentShader } from "@/lib/ring-shader"

type FocusTargetRef = {
    current: Vector3 | null
}

const BASE_ORBIT_LINE_WIDTH = 0.01
const BASE_CAMERA_DISTANCE = Math.sqrt(12)
const MIN_ORBIT_LINE_WIDTH = 0.002
const MAX_ORBIT_LINE_WIDTH = 0.08

export function Planet({
    data,
    onSelect,
    isSelected,
    focusTargetRef,
    cameraDistance,
    simTimeRef,
    scale,
}: {
    data: PlanetData
    onSelect: (planet: PlanetData | null) => void
    isSelected: boolean
    focusTargetRef?: FocusTargetRef | null
    cameraDistance: number
    simTimeRef: { current: Date }
    scale: {
        distance: number,
        radius: number,
    }
}) {
    const groupRef = useRef<Group>(null)
    const planetRef = useRef<Mesh>(null)
    const worldPositionRef = useRef(new Vector3())
    const [hovered, setHovered] = useState(false)
    const distance = data.distance * scale.distance
    const radius = data.radius * scale.radius
    const orbitalInclination = degToRad(data.orbitalInclination)
    const longitudeOfAscendingNode = degToRad(data.longitudeOfAscendingNode)
    const initialOrbitPosition = useMemo(() => getPlanetOrbitPosition(data), [data])
    const orbitPoints = useMemo(
        () => getPlanetOrbitPath(data).map((point) => [
            distance * point.x,
            0,
            distance * point.z,
        ] as [number, number, number]),
        [data, distance]
    )
    const ringUniforms = useMemo(
        () => data.rings?.map((ring) => ({
            innerColor: { value: new Color(ring.color) },
            outerColor: { value: new Color("white") },
            innerAlpha: { value: 0.7 },
            outerAlpha: { value: 0.1 },
        })) ?? [],
        [data.rings]
    )

    let rotationSpeed = (2 * Math.PI) / (data.rotationPeriod * 10)
    if (data.name === "Venus") {
        // Venus has a retrograde rotation
        rotationSpeed *= -1
    }

    useFrame((_, delta) => {
        if (groupRef.current) {
            const orbitPosition = getPlanetOrbitPosition(data, simTimeRef.current)
            groupRef.current.position.set(
                distance * orbitPosition.x,
                0,
                distance * orbitPosition.z
            )
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
    const orbitLineWidth = useMemo(() => {
        const scaledWidth = BASE_ORBIT_LINE_WIDTH * (cameraDistance / BASE_CAMERA_DISTANCE)
        return Math.min(MAX_ORBIT_LINE_WIDTH, Math.max(MIN_ORBIT_LINE_WIDTH, scaledWidth))
    }, [cameraDistance])

    return (
        <group rotation={[0, longitudeOfAscendingNode, 0]}>
            <group rotation={[0, 0, orbitalInclination]}>
                <Line
                    points={orbitPoints}
                    color="#4fc3f7"
                    transparent
                    opacity={0.4}
                    lineWidth={orbitLineWidth}
                    worldUnits
                />

                <group
                    ref={groupRef}
                    position={[
                        distance * initialOrbitPosition.x,
                        0,
                        distance * initialOrbitPosition.z,
                    ]}
                >
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
                                uniforms={ringUniforms[i]}
                            />
                        </mesh>
                    ))}

                    {/* {data.satellites?.map((satellite) => (
                        <Satellite
                            key={satellite.name}
                            satellite={{ ...satellite, parentPlanetName: data.name }}
                            simTimeRef={simTimeRef}
                            scale={{
                                distance: scale.distance,
                                radius: scale.radius,
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
    )
}

function Satellite({
    simTimeRef,
    satellite,
    scale,
}: {
    simTimeRef: { current: Date }
    satellite: SatelliteData & { parentPlanetName: string }
    scale: {
        distance: number,
        radius: number,
    }
}) {
    const groupRef = useRef<Group>(null)
    const [hovered, setHovered] = useState(false)
    const distance = satellite.distance * scale.distance
    const radius = satellite.radius * scale.radius
    const initialOrbitPosition = useMemo(
        () => getSatelliteOrbitPosition(satellite.parentPlanetName, satellite),
        [satellite]
    )
    const orbitPoints = useMemo(
        () => getSatelliteOrbitPath(satellite.parentPlanetName, satellite).map((point) => [
            distance * point.x,
            0,
            distance * point.z,
        ] as [number, number, number]),
        [distance, satellite]
    )

    useFrame(() => {
        if (!groupRef.current) {
            return
        }

        const orbitPosition = getSatelliteOrbitPosition(
            satellite.parentPlanetName,
            satellite,
            simTimeRef.current
        )
        groupRef.current.position.set(
            distance * orbitPosition.x,
            0,
            distance * orbitPosition.z
        )
    })

    return (
        <>
            <Line
                points={orbitPoints}
                color="#4fc3f7"
                transparent
                opacity={0.25}
                lineWidth={0.002}
                worldUnits
            />

            <group
                ref={groupRef}
                position={[
                    distance * initialOrbitPosition.x,
                    0,
                    distance * initialOrbitPosition.z,
                ]}
            >
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
        </>
    )
}
