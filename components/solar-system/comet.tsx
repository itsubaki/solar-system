"use client"

import { Html } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useMemo, useRef, useState } from "react"
import { Group, Vector3 } from "three"
import type { Mesh } from "three"
import type { CometData } from "@/lib/comet-data"
import { getCometOrbitPath, getCometOrbitPosition } from "@/lib/comet-angle"

type FocusTargetRef = {
    current: Vector3 | null
}

type OrbitPoint = [number, number, number]

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

export function Comet({
    data,
    onSelect,
    isSelected,
    focusTargetRef,
    simTimeRef,
    scale,
}: {
    data: CometData
    onSelect: (comet: CometData | null) => void
    isSelected: boolean
    focusTargetRef?: FocusTargetRef | null
    simTimeRef: { current: Date }
    scale: {
        distance: number
        radius: number
    }
}) {
    const groupRef = useRef<Group>(null)
    const cometRef = useRef<Mesh>(null)
    const worldPositionRef = useRef(new Vector3())
    const [hovered, setHovered] = useState(false)
    const distance = data.distance * scale.distance
    const radius = data.displayRadius * scale.radius
    const initialOrbitPosition = useMemo(() => getCometOrbitPosition(data), [data])
    const orbitPoints = useMemo(
        () => getCometOrbitPath(data).map((point) => [
            distance * point.x,
            distance * point.y,
            distance * point.z,
        ] as [number, number, number]),
        [data, distance]
    )

    useFrame(() => {
        if (groupRef.current) {
            const orbitPosition = getCometOrbitPosition(data, simTimeRef.current)
            groupRef.current.position.set(
                distance * orbitPosition.x,
                distance * orbitPosition.y,
                distance * orbitPosition.z
            )
        }

        if (focusTargetRef && cometRef.current) {
            cometRef.current.getWorldPosition(worldPositionRef.current)
            if (focusTargetRef.current) {
                focusTargetRef.current.copy(worldPositionRef.current)
                return
            }

            focusTargetRef.current = worldPositionRef.current.clone()
        }
    })

    return (
        <>
            <OrbitLine points={orbitPoints} color={data.color} />

            <group
                ref={groupRef}
                position={[
                    distance * initialOrbitPosition.x,
                    distance * initialOrbitPosition.y,
                    distance * initialOrbitPosition.z,
                ]}
            >
                <mesh
                    ref={cometRef}
                    onPointerOver={() => setHovered(true)}
                    onPointerOut={() => setHovered(false)}
                    onClick={() => onSelect(data)}
                >
                    <sphereGeometry args={[radius, 16, 16]} />
                    <meshStandardMaterial
                        color={data.color}
                        emissive={data.emissive || data.color}
                        emissiveIntensity={hovered || isSelected ? 0.45 : data.emissiveIntensity ?? 0.18}
                        roughness={0.9}
                        metalness={0.02}
                    />
                </mesh>

                <mesh position={[radius * 1.6, 0, 0]}>
                    <coneGeometry args={[radius * 0.7, radius * 3.5, 12]} />
                    <meshBasicMaterial color="#dffcff" transparent opacity={hovered || isSelected ? 0.45 : 0.22} />
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
        </>
    )
}
