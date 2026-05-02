import type { ProbeData } from "./probe-data"

const ASTRONOMICAL_UNIT = 149_600_000
const MS_PER_DAY = 1000 * 60 * 60 * 24
const PROBE_GUIDE_LINE_MAX_DISTANCE_AU = 100_000

type ProbeTrajectoryState = {
    angle: number
    radiusScale: number
    x: number
    y: number
    z: number
}

export function getProbeDistanceFromSun(probe: ProbeData, at = new Date()) {
    const distanceAu = getProbeDistanceFromSunAu(probe, at)

    return {
        au: distanceAu,
        km: distanceAu * ASTRONOMICAL_UNIT,
    }
}

export function getProbeTrajectoryPosition(probe: ProbeData, at = new Date()): ProbeTrajectoryState {
    const distanceAu = getProbeDistanceFromSunAu(probe, at)
    const baselineDistanceAu = probe.distance / ASTRONOMICAL_UNIT
    const radiusScale = distanceAu / baselineDistanceAu
    const direction = getProbeDirection(probe)

    return {
        angle: normalizeRadians(Math.atan2(-direction.z, direction.x)),
        radiusScale,
        x: radiusScale * direction.x,
        y: radiusScale * direction.y,
        z: radiusScale * direction.z,
    }
}

export function getProbeTrajectoryPath(probe: ProbeData, segments = 256) {
    const {
        startDistanceAu,
    } = probe.escapeTrajectory
    const pathDistanceAu = Math.max(startDistanceAu, PROBE_GUIDE_LINE_MAX_DISTANCE_AU)
    const baselineDistanceAu = probe.distance / ASTRONOMICAL_UNIT
    const direction = getProbeDirection(probe)
    const points: Array<{ x: number; y: number; z: number }> = []

    for (let i = 0; i <= segments; i += 1) {
        const progress = i / segments
        const distanceAu = startDistanceAu + (pathDistanceAu - startDistanceAu) * progress
        const normalizedDistance = distanceAu / baselineDistanceAu

        points.push({
            x: normalizedDistance * direction.x,
            y: normalizedDistance * direction.y,
            z: normalizedDistance * direction.z,
        })
    }

    return points
}

function getProbeDistanceFromSunAu(probe: ProbeData, at: Date) {
    const {
        referenceDate,
        startDistanceAu,
        referenceDistanceAu,
        speedAuPerYear,
    } = probe.escapeTrajectory
    const elapsedDays = (at.getTime() - Date.parse(referenceDate)) / MS_PER_DAY

    return Math.max(startDistanceAu, referenceDistanceAu + (elapsedDays / 365.25) * speedAuPerYear)
}

function getProbeDirection(probe: ProbeData) {
    const longitude = degToRad(probe.direction.eclipticLongitudeDegrees)
    const latitude = degToRad(probe.direction.eclipticLatitudeDegrees)
    const projectedRadius = Math.cos(latitude)

    return {
        x: projectedRadius * Math.cos(longitude),
        y: Math.sin(latitude),
        z: -projectedRadius * Math.sin(longitude),
    }
}

function degToRad(degrees: number) {
    return (degrees * Math.PI) / 180
}

function normalizeRadians(angle: number) {
    const fullTurn = Math.PI * 2
    return ((angle % fullTurn) + fullTurn) % fullTurn
}
