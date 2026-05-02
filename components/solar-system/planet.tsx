"use client"

import { useRef, useState, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import { DoubleSide, Vector3, Color, Quaternion } from "three"
import type { Group, Mesh } from "three"
import type { PlanetData, SatelliteData } from "@/lib/planet-data"
import { getPlanetOrbitPath, getPlanetOrbitPosition, getSatelliteOrbitPath, getSatelliteOrbitPosition, degToRad } from "@/lib/planet-angle"
import { ringVertexShader, ringFragmentShader } from "@/lib/ring-shader"

type FocusTargetRef = {
    current: Vector3 | null
}

type OrbitPoint = [number, number, number]

const SCENE_UP = new Vector3(0, 1, 0)
const SCENE_FORWARD = new Vector3(0, 0, 1)

function OrbitLine({
    points,
    color,
}: {
    points: OrbitPoint[]
    color: string
}) {
    const positions = useMemo(() => new Float32Array(points.flat()), [points])

    return (
        <line>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                    count={positions.length / 3}
                />
            </bufferGeometry>
            <lineBasicMaterial color={color} />
        </line>
    )
}

function AxialTiltIndicator({
    radius,
    quaternion,
    highlighted,
}: {
    radius: number
    quaternion: Quaternion
    highlighted: boolean
}) {
    const axisLength = radius * 2.8
    const axisRadius = Math.max(radius * 0.03, 0.0015)

    return (
        <group quaternion={quaternion}>
            <mesh>
                <cylinderGeometry args={[axisRadius, axisRadius, axisLength, 12]} />
                <meshBasicMaterial
                    color={highlighted ? "#dbeafe" : "#94a3b8"}
                    transparent
                    opacity={highlighted ? 0.45 : 0.22}
                    depthWrite={false}
                />
            </mesh>
        </group>
    )
}

function getPoleVector(longitude: number, latitude: number) {
    const lambda = degToRad(longitude)
    const beta = degToRad(latitude)
    const cosBeta = Math.cos(beta)

    return new Vector3(
        cosBeta * Math.cos(lambda),
        Math.sin(beta),
        -cosBeta * Math.sin(lambda)
    )
}

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
    void cameraDistance
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
            outerColor: { value: new Color(ring.outerColor ?? "white") },
            innerAlpha: { value: ring.innerAlpha ?? 0.7 },
            outerAlpha: { value: ring.outerAlpha ?? 0.1 },
        })) ?? [],
        [data.rings]
    )
    const orbitPlaneQuaternion = useMemo(() => {
        const nodeRotation = new Quaternion().setFromAxisAngle(SCENE_UP, longitudeOfAscendingNode)
        const inclinationRotation = new Quaternion().setFromAxisAngle(
            new Vector3(0, 0, 1),
            orbitalInclination
        )

        return nodeRotation.multiply(inclinationRotation)
    }, [longitudeOfAscendingNode, orbitalInclination])
    const localPoleVector = useMemo(() => {
        return getPoleVector(
            data.poleDirection.longitude,
            data.poleDirection.latitude
        )
            .applyQuaternion(orbitPlaneQuaternion.clone().invert())
            .normalize()
    }, [data.poleDirection.latitude, data.poleDirection.longitude, orbitPlaneQuaternion])
    const axisQuaternion = useMemo(() => {
        return new Quaternion().setFromUnitVectors(SCENE_UP, localPoleVector)
    }, [localPoleVector])
    const ringQuaternion = useMemo(() => {
        return new Quaternion().setFromUnitVectors(SCENE_FORWARD, localPoleVector)
    }, [localPoleVector])

    let rotationSpeed = (2 * Math.PI) / (data.rotationPeriod * 10)
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
    return (
        <group rotation={[0, longitudeOfAscendingNode, 0]}>
            <group rotation={[0, 0, orbitalInclination]}>
                <OrbitLine points={orbitPoints} color={data.color} />

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

                    <AxialTiltIndicator
                        radius={radius}
                        quaternion={axisQuaternion}
                        highlighted={hovered || isSelected}
                    />

                    {Array.isArray(data.rings) && (
                        <group quaternion={ringQuaternion}>
                            {data.rings.map((ring, i) => (
                                <mesh key={i}>
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
                        </group>
                    )}

                    <Html
                        position={[0, radius + 0.1, 0]}
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
        () => getSatelliteOrbitPosition(satellite),
        [satellite]
    )
    const orbitPoints = useMemo(
        () => getSatelliteOrbitPath(satellite).map((point) => [
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
            <OrbitLine points={orbitPoints} color="#8fd3ff" />

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
