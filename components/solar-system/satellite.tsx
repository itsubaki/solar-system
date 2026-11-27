"use client"

import { useMemo, useRef, useState } from "react"
import { Html } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { Quaternion, Vector3 } from "three"
import type { Group } from "three"
import type { PoleDirection, SatelliteData } from "@/lib/planet-data"
import { getSatelliteOrbitPath, getSatelliteOrbitState } from "@/lib/planet-angle"
import { J2000_EPOCH_UTC } from "@/lib/orbit"
import { AxialTiltIndicator, getAxisQuaternion, getLocalPoleVector, getObjectLabelOffset, getOrbitFrameQuaternion, OrbitLine, type FocusTargetRef } from "./orbit"

const IDENTITY_QUATERNION = new Quaternion()

export function Satellite({
    simTimeRef,
    satellite,
    onSelect,
    isSelected,
    dimOrbit,
    orbitOpacity,
    focusTargetRef,
    parentPoleDirection,
    parentOrbitPlaneQuaternion,
    scale,
}: {
    simTimeRef: { current: Date }
    satellite: SatelliteData & { parentPlanetName: string }
    onSelect: (satellite: SatelliteData & { parentPlanetName: string }) => void
    isSelected: boolean
    dimOrbit: boolean
    orbitOpacity?: number
    focusTargetRef?: FocusTargetRef | null
    parentPoleDirection: PoleDirection
    parentOrbitPlaneQuaternion: Group["quaternion"]
    scale: {
        distance: number,
        radius: number,
    }
}) {
    const groupRef = useRef<Group>(null)
    const frameRef = useRef<Group>(null)
    const pathRef = useRef<Group>(null)
    const axisRef = useRef<Group>(null)
    const worldPositionRef = useRef(new Vector3())
    const [hovered, setHovered] = useState(false)
    const distance = satellite.distance * scale.distance
    const radius = satellite.radius * scale.radius
    const orbitPlaneQuaternion = useMemo(() => {
        return getOrbitFrameQuaternion(
            satellite.orbitPlane,
            parentPoleDirection,
            parentOrbitPlaneQuaternion
        )
    }, [parentOrbitPlaneQuaternion, parentPoleDirection, satellite.orbitPlane])
    const worldOrbitFrameQuaternion = useMemo(() => {
        return parentOrbitPlaneQuaternion.clone().multiply(orbitPlaneQuaternion)
    }, [orbitPlaneQuaternion, parentOrbitPlaneQuaternion])
    const localPoleVector = useMemo(() => {
        return getLocalPoleVector(satellite.poleDirection, worldOrbitFrameQuaternion)
    }, [satellite.poleDirection, worldOrbitFrameQuaternion])
    const axisQuaternion = useMemo(() => {
        return getAxisQuaternion(localPoleVector)
    }, [localPoleVector])
    const referenceState = useMemo(
        () => getSatelliteOrbitState(satellite, new Date(J2000_EPOCH_UTC)),
        [satellite]
    )
    const orbitPoints = useMemo(
        () => getSatelliteOrbitPath(satellite, undefined, new Date(J2000_EPOCH_UTC)).map((point) => [
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

        const state = getSatelliteOrbitState(
            satellite,
            simTimeRef.current
        )
        const orbitPosition = state.position
        const frame = getOrbitFrameQuaternion(state.plane, parentPoleDirection, parentOrbitPlaneQuaternion)
        frameRef.current?.quaternion.copy(frame)
        // Rotate a cached ellipse with the periapsis instead of rebuilding
        // its geometry, even when simulated time advances by a year/second.
        if (pathRef.current) pathRef.current.rotation.y = state.argumentOfPeriapsis - referenceState.argumentOfPeriapsis
        if (axisRef.current) {
            const worldFrame = parentOrbitPlaneQuaternion.clone().multiply(frame)
            axisRef.current.quaternion.copy(getAxisQuaternion(getLocalPoleVector(satellite.poleDirection, worldFrame)))
        }

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
        <group ref={frameRef} quaternion={orbitPlaneQuaternion}>
            <group ref={pathRef}>
                <OrbitLine points={orbitPoints} color={satellite.color} opacity={orbitOpacity ?? (dimOrbit ? 0.18 : 0.72)} />
            </group>

            <group
                ref={groupRef}
                position={[
                    distance * referenceState.position.x,
                    0,
                    distance * referenceState.position.z,
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

                <group ref={axisRef} quaternion={axisQuaternion}>
                    <AxialTiltIndicator
                        radius={radius}
                        quaternion={IDENTITY_QUATERNION}
                        highlighted={hovered || isSelected}
                    />
                </group>

                <Html
                    position={[0, getObjectLabelOffset(radius), 0]}
                    style={{
                        pointerEvents: "auto",
                        userSelect: "none",
                        transform: "translate(-50%, -100%)",
                    }}
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
        </group>
    )
}
