"use client"

import { useMemo, useRef, useState } from "react"
import { Html } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { Vector3 } from "three"
import type { Group } from "three"
import type { SatelliteData } from "@/lib/planet-data"
import { getSatelliteOrbitPath, getSatelliteOrbitPosition } from "@/lib/planet-angle"
import { AxialTiltIndicator, getAxisQuaternion, getLocalPoleVector, getOrbitPlaneQuaternion, OrbitLine, type FocusTargetRef } from "./orbit"

export function Satellite({
    simTimeRef,
    satellite,
    onSelect,
    isSelected,
    focusTargetRef,
    scale,
}: {
    simTimeRef: { current: Date }
    satellite: SatelliteData & { parentPlanetName: string }
    onSelect: (satellite: SatelliteData & { parentPlanetName: string }) => void
    isSelected: boolean
    focusTargetRef?: FocusTargetRef | null
    scale: {
        distance: number,
        radius: number,
    }
}) {
    const groupRef = useRef<Group>(null)
    const worldPositionRef = useRef(new Vector3())
    const [hovered, setHovered] = useState(false)
    const distance = satellite.distance * scale.distance
    const radius = satellite.radius * scale.radius
    const orbitPlaneQuaternion = useMemo(() => {
        return getOrbitPlaneQuaternion(satellite.orbitPlane)
    }, [satellite.orbitPlane])
    const localPoleVector = useMemo(() => {
        return getLocalPoleVector(satellite.poleDirection, orbitPlaneQuaternion)
    }, [orbitPlaneQuaternion, satellite.poleDirection])
    const axisQuaternion = useMemo(() => {
        return getAxisQuaternion(localPoleVector)
    }, [localPoleVector])
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

        if (focusTargetRef) {
            groupRef.current.getWorldPosition(worldPositionRef.current)
            if (focusTargetRef.current) {
                focusTargetRef.current.copy(worldPositionRef.current)
                return
            }

            focusTargetRef.current = worldPositionRef.current.clone()
        }
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
                    onClick={() => onSelect(satellite)}
                >
                    <sphereGeometry args={[radius, 16, 16]} />
                    <meshStandardMaterial
                        color={satellite.color}
                        roughness={0.9}
                        emissive={satellite.color}
                        emissiveIntensity={hovered || isSelected ? 0.3 : 0.1}
                    />
                </mesh>

                <AxialTiltIndicator
                    radius={radius}
                    quaternion={axisQuaternion}
                    highlighted={hovered || isSelected}
                />

                <Html
                    position={[0, radius + 0.02, 0]}
                    center
                    style={{ pointerEvents: "auto", userSelect: "none" }}
                >
                    <div
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap backdrop-blur-sm border border-border/40 ${isSelected ? "bg-primary text-primary-foreground" : "bg-card/70 text-muted-foreground"}`}
                        style={{ cursor: "pointer" }}
                        onClick={(event) => {
                            event.stopPropagation()
                            onSelect(satellite)
                        }}
                    >
                        {satellite.name}
                    </div>
                </Html>
            </group>
        </>
    )
}
