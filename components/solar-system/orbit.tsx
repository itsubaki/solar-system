"use client"

import { useMemo } from "react"
import { Quaternion, Vector3 } from "three"
import { getPoleVector } from "@/lib/orbit-frame"
import type { PoleDirection } from "@/lib/planet-data"

export { getOrbitPlaneQuaternion, getEquatorPlaneQuaternion, getOrbitFrameQuaternion } from "@/lib/orbit-frame"

export type FocusTargetRef = {
    current: Vector3 | null
}

type OrbitPoint = [number, number, number]

const SCENE_UP = new Vector3(0, 1, 0)
const SCENE_FORWARD = new Vector3(0, 0, 1)

export function OrbitLine({
    points,
    color,
    opacity = 1,
}: {
    points: OrbitPoint[]
    color: string
    opacity?: number
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
            <lineBasicMaterial
                color={color}
                transparent={opacity < 1}
                opacity={opacity}
            />
        </line>
    )
}

export function AxialTiltIndicator({
    radius,
    quaternion,
    highlighted,
}: {
    radius: number
    quaternion: Quaternion
    highlighted: boolean
}) {
    const axisLength = radius * 2.8
    const axisRadius = radius * 0.03

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

export function getObjectLabelOffset(anchorRadius: number) {
    const gap = Math.min(Math.max(anchorRadius * 0.2, 0.001), 0.04)

    return anchorRadius + gap
}

export function getLocalPoleVector(
    poleDirection: PoleDirection,
    orbitPlaneQuaternion: Quaternion
) {
    return getPoleVector(
        poleDirection.longitude,
        poleDirection.latitude
    )
        .applyQuaternion(orbitPlaneQuaternion.clone().invert())
        .normalize()
}

export function getAxisQuaternion(localPoleVector: Vector3) {
    return new Quaternion().setFromUnitVectors(SCENE_UP, localPoleVector)
}

export function getRingQuaternion(localPoleVector: Vector3) {
    return new Quaternion().setFromUnitVectors(SCENE_FORWARD, localPoleVector)
}
