"use client"

import { useMemo, useRef, useState } from "react"
import { Html } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { Quaternion, Vector3 } from "three"
import type { BufferGeometry, Group } from "three"
import type { PoleDirection, SatelliteData } from "@/lib/planet-data"
import { J2000_EPOCH_UTC, MS_PER_DAY } from "@/lib/orbit"
import { getSatellitePathKm } from "@/lib/body-position"
import { getCalculatedSatelliteState } from "@/lib/satellite-model"
import { AxialTiltIndicator, getAxisQuaternion, getLocalPoleVector, getObjectLabelOffset, OrbitLine, type FocusTargetRef } from "./orbit"

const IDENTITY_QUATERNION = new Quaternion()

export function Satellite({
    simTimeRef,
    satellite,
    onSelect,
    isSelected,
    dimOrbit,
    orbitOpacity,
    focusTargetRef,
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
    const pathGeometryRef = useRef<BufferGeometry>(null)
    const lastPathTimeRef = useRef<number | null>(null)
    const worldPositionRef = useRef(new Vector3())
    const [hovered, setHovered] = useState(false)
    const radius = satellite.radius * scale.radius
    const orbitPlaneQuaternion = useMemo(() => parentOrbitPlaneQuaternion.clone().invert(), [parentOrbitPlaneQuaternion])
    const axisQuaternion = useMemo(() => getAxisQuaternion(getLocalPoleVector(satellite.poleDirection, IDENTITY_QUATERNION)), [satellite.poleDirection])
    const initialState = useMemo(() => getCalculatedSatelliteState(satellite.name, new Date(J2000_EPOCH_UTC))!, [satellite.name])
    const orbitPoints = useMemo(
        () => getSatellitePathKm(satellite, new Date(J2000_EPOCH_UTC)).map((point) => [
            scale.distance * point.x, scale.distance * point.y, scale.distance * point.z,
        ] as [number, number, number]),
        [scale.distance, satellite]
    )

    useFrame(() => {
        if (!groupRef.current) {
            return
        }

        const at = simTimeRef.current
        const state = getCalculatedSatelliteState(satellite.name, at)!
        frameRef.current?.quaternion.copy(parentOrbitPlaneQuaternion).invert()
        const geometry = pathGeometryRef.current
        if (geometry && (lastPathTimeRef.current === null ||
            Math.abs(at.getTime() - lastPathTimeRef.current) > Math.abs(satellite.orbitalPeriod) * MS_PER_DAY / 128)) {
            const attribute = geometry.getAttribute("position")
            getSatellitePathKm(satellite, at).forEach((point, i) =>
                attribute.setXYZ(i, point.x * scale.distance, point.y * scale.distance, point.z * scale.distance))
            attribute.needsUpdate = true
            geometry.computeBoundingSphere()
            lastPathTimeRef.current = at.getTime()
        }
        groupRef.current.position.set(state.position.x, state.position.y, state.position.z).multiplyScalar(scale.distance)

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
                <OrbitLine geometryRef={pathGeometryRef} points={orbitPoints} color={satellite.color} opacity={orbitOpacity ?? (dimOrbit ? 0.18 : 0.72)} />
            </group>

            <group
                ref={groupRef}
                position={[
                    scale.distance * initialState.position.x,
                    scale.distance * initialState.position.y,
                    scale.distance * initialState.position.z,
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
