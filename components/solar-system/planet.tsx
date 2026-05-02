"use client"

import { useRef, useState, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import { DoubleSide, Vector3, Color } from "three"
import type { Group, Mesh } from "three"
import type { PlanetData, SatelliteData } from "@/lib/planet-data"
import { getPlanetOrbitPath, getPlanetOrbitPosition } from "@/lib/planet-angle"
import { ringVertexShader, ringFragmentShader } from "@/lib/ring-shader"
import { AxialTiltIndicator, getAxisQuaternion, getLocalPoleVector, getOrbitPlaneQuaternion, getRingQuaternion, OrbitLine, type FocusTargetRef } from "./orbit"
import { Satellite } from "./satellite"

export function Planet({
    data,
    onSelect,
    onSelectSatellite,
    selectedSatellite,
    isSelected,
    showSatellites,
    focusTargetRef,
    cameraDistance,
    simTimeRef,
    scale,
}: {
    data: PlanetData
    onSelect: (planet: PlanetData | null) => void
    onSelectSatellite: (satellite: SatelliteData & { parentPlanetName: string }) => void
    selectedSatellite: (SatelliteData & { parentPlanetName: string }) | null
    isSelected: boolean
    showSatellites: boolean
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
        return getOrbitPlaneQuaternion(data.orbitPlane)
    }, [data.orbitPlane])
    const localPoleVector = useMemo(() => {
        return getLocalPoleVector(data.poleDirection, orbitPlaneQuaternion)
    }, [data.poleDirection, orbitPlaneQuaternion])
    const axisQuaternion = useMemo(() => {
        return getAxisQuaternion(localPoleVector)
    }, [localPoleVector])
    const ringQuaternion = useMemo(() => {
        return getRingQuaternion(localPoleVector)
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
        <group quaternion={orbitPlaneQuaternion}>
            <OrbitLine points={orbitPoints} color={data.color} />

            <group
                ref={groupRef}
                position={[
                    distance * initialOrbitPosition.x,
                    0,
                    distance * initialOrbitPosition.z,
                ]}
            >
                <group quaternion={axisQuaternion}>
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
                </group>

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

                {showSatellites && Array.isArray(data.satellites) && data.satellites.map((satellite) => (
                    <Satellite
                        key={`${data.name}-${satellite.name}`}
                        satellite={{
                            ...satellite,
                            parentPlanetName: data.name,
                        }}
                        parentPoleDirection={data.poleDirection}
                        parentOrbitPlaneQuaternion={orbitPlaneQuaternion}
                        onSelect={onSelectSatellite}
                        isSelected={selectedSatellite?.name === satellite.name && selectedSatellite.parentPlanetName === data.name}
                        focusTargetRef={selectedSatellite?.name === satellite.name && selectedSatellite.parentPlanetName === data.name ? focusTargetRef : null}
                        simTimeRef={simTimeRef}
                        scale={scale}
                    />
                ))}

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
    )
}
