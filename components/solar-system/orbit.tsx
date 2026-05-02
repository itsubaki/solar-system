"use client"

import { Quaternion, Vector3 } from "three"
import { degToRad } from "@/lib/orbit"
import type { OrbitPlane, PoleDirection } from "@/lib/planet-data"

export type FocusTargetRef = {
    current: Vector3 | null
}

type OrbitPoint = [number, number, number]

const SCENE_UP = new Vector3(0, 1, 0)
const SCENE_FORWARD = new Vector3(0, 0, 1)

export function OrbitLine({
    points,
    color,
}: {
    points: OrbitPoint[]
    color: string
}) {
    const positions = new Float32Array(points.flat())

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

export function getOrbitPlaneQuaternion(orbitPlane: OrbitPlane) {
    const nodeRotation = new Quaternion().setFromAxisAngle(
        SCENE_UP,
        degToRad(orbitPlane.longitudeOfAscendingNode)
    )
    const inclinationRotation = new Quaternion().setFromAxisAngle(
        new Vector3(1, 0, 0),
        degToRad(orbitPlane.inclination)
    )

    return nodeRotation.multiply(inclinationRotation)
}

export function getEquatorPlaneQuaternion(poleDirection: PoleDirection) {
    return new Quaternion().setFromUnitVectors(
        SCENE_UP,
        getPoleVector(poleDirection.longitude, poleDirection.latitude).normalize()
    )
}

export function getOrbitFrameQuaternion(
    orbitPlane: OrbitPlane,
    parentPoleDirection?: PoleDirection,
    parentOrbitPlaneQuaternion?: Quaternion
) {
    const orbitPlaneQuaternion = getOrbitPlaneQuaternion(orbitPlane)

    if (orbitPlane.referenceFrame !== "parentEquator" || !parentPoleDirection) {
        return orbitPlaneQuaternion
    }

    if (!parentOrbitPlaneQuaternion) {
        return getEquatorPlaneQuaternion(parentPoleDirection).multiply(orbitPlaneQuaternion)
    }

    const parentLocalPoleVector = getLocalPoleVector(
        parentPoleDirection,
        parentOrbitPlaneQuaternion
    )

    return getAxisQuaternion(parentLocalPoleVector).multiply(orbitPlaneQuaternion)
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
