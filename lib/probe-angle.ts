import type { ProbeData } from "./probe-data"

const MS_PER_DAY = 1000 * 60 * 60 * 24
const KM_PER_AU = 149_600_000

type ProbeTrajectoryState = {
    angle: number
    radiusScale: number
    x: number
    z: number
}

export function getProbeTrajectoryPosition(probe: ProbeData, at = new Date()): ProbeTrajectoryState {
    const {
        startDate,
        startDistanceAu,
        speedAuPerYear,
        maxDistanceAu,
        headingDegrees = 0,
    } = probe.escapeTrajectory
    const elapsedDays = (at.getTime() - Date.parse(startDate)) / MS_PER_DAY
    const distanceAu = Math.min(
        maxDistanceAu,
        Math.max(startDistanceAu, startDistanceAu + (elapsedDays / 365.25) * speedAuPerYear)
    )
    const baselineDistanceAu = probe.distance / KM_PER_AU
    const heading = degToRad(headingDegrees)
    const radiusScale = distanceAu / baselineDistanceAu

    return {
        angle: normalizeRadians(-heading),
        radiusScale,
        x: radiusScale * Math.cos(heading),
        z: -radiusScale * Math.sin(heading),
    }
}

export function getProbeTrajectoryPath(probe: ProbeData, segments = 256) {
    const {
        startDistanceAu,
        maxDistanceAu,
        headingDegrees = 0,
    } = probe.escapeTrajectory
    const baselineDistanceAu = probe.distance / KM_PER_AU
    const heading = degToRad(headingDegrees)
    const points: Array<{ x: number; z: number }> = []

    for (let i = 0; i <= segments; i += 1) {
        const progress = i / segments
        const distanceAu = startDistanceAu + (maxDistanceAu - startDistanceAu) * progress
        const normalizedDistance = distanceAu / baselineDistanceAu

        points.push({
            x: normalizedDistance * Math.cos(heading),
            z: -normalizedDistance * Math.sin(heading),
        })
    }

    return points
}

function degToRad(degrees: number) {
    return (degrees * Math.PI) / 180
}

function normalizeRadians(angle: number) {
    const fullTurn = Math.PI * 2
    return ((angle % fullTurn) + fullTurn) % fullTurn
}
