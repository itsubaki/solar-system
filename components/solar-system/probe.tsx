"use client"

import { Html } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useMemo, useRef, useState } from "react"
import { Vector3 } from "three"
import type { Group, Mesh } from "three"
import type { ProbeData } from "@/lib/probe-data"
import { getProbeTrajectoryPath, getProbeTrajectoryPosition } from "@/lib/probe-angle"

type FocusTargetRef = {
    current: Vector3 | null
}

type OrbitPoint = [number, number, number]

function TrajectoryLine({
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

export function Probe({
    data,
    onSelect,
    isSelected,
    focusTargetRef,
    simTimeRef,
    scale,
}: {
    data: ProbeData
    onSelect: (probe: ProbeData | null) => void
    isSelected: boolean
    focusTargetRef?: FocusTargetRef | null
    simTimeRef: { current: Date }
    scale: {
        distance: number
        radius: number
    }
}) {
    const groupRef = useRef<Group>(null)
    const probeRef = useRef<Mesh>(null)
    const worldPositionRef = useRef(new Vector3())
    const [hovered, setHovered] = useState(false)
    const distance = data.distance * scale.distance
    const radius = data.displayRadius * scale.radius
    const orbitalInclination = degToRad(data.orbitalInclination)
    const longitudeOfAscendingNode = degToRad(data.longitudeOfAscendingNode)
    const initialTrajectoryPosition = useMemo(() => getProbeTrajectoryPosition(data), [data])
    const trajectoryPoints = useMemo(
        () => getProbeTrajectoryPath(data).map((point) => [
            distance * point.x,
            0,
            distance * point.z,
        ] as [number, number, number]),
        [data, distance]
    )

    useFrame(() => {
        if (groupRef.current) {
            const trajectoryPosition = getProbeTrajectoryPosition(data, simTimeRef.current)
            groupRef.current.position.set(
                distance * trajectoryPosition.x,
                0,
                distance * trajectoryPosition.z
            )
        }

        if (focusTargetRef && probeRef.current) {
            probeRef.current.getWorldPosition(worldPositionRef.current)
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
                <TrajectoryLine points={trajectoryPoints} color={data.color} />

                <group
                    ref={groupRef}
                    position={[
                        distance * initialTrajectoryPosition.x,
                        0,
                        distance * initialTrajectoryPosition.z,
                    ]}
                >
                    <mesh
                        ref={probeRef}
                        onPointerOver={() => setHovered(true)}
                        onPointerOut={() => setHovered(false)}
                        onClick={() => onSelect(data)}
                    >
                        <sphereGeometry args={[radius, 16, 16]} />
                        <meshStandardMaterial
                            color={data.color}
                            emissive={data.emissive || data.color}
                            emissiveIntensity={hovered || isSelected ? 0.45 : data.emissiveIntensity ?? 0.15}
                            roughness={0.7}
                            metalness={0.2}
                        />
                    </mesh>

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
                            onClick={(event) => {
                                event.stopPropagation()
                                onSelect(data)
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

function degToRad(degrees: number) {
    return (degrees * Math.PI) / 180
}
