import type { ProbeData } from "./probe-data"
import {
    ASTRONOMICAL_UNIT,
    degToRad,
    getElapsedDaysFromIsoDate,
    getSceneAngle,
    getSceneDirection,
    scaleScenePoint,
    type ScenePoint,
} from "./orbit"

const PROBE_GUIDE_LINE_MAX_DISTANCE_AU = 100_000

type ProbeTrajectoryState = {
    angle: number
    radiusScale: number
    x: number
    y: number
    z: number
}

type ProbeTrajectorySnapshot = {
    baselineDistanceAu: number
    currentDistanceAu: number
    direction: ScenePoint
    pathDistanceAu: number
    startDistanceAu: number
}

export function getProbeDistanceFromSun(probe: ProbeData, at = new Date()) {
    const { currentDistanceAu } = getProbeTrajectorySnapshot(probe, at)

    return {
        au: currentDistanceAu,
        km: currentDistanceAu * ASTRONOMICAL_UNIT,
    }
}

export function getProbeTrajectoryPosition(probe: ProbeData, at = new Date()): ProbeTrajectoryState {
    const { baselineDistanceAu, currentDistanceAu, direction } = getProbeTrajectorySnapshot(probe, at)
    const radiusScale = currentDistanceAu / baselineDistanceAu
    const position = scaleScenePoint(direction, radiusScale)

    return {
        angle: getSceneAngle(direction),
        radiusScale,
        x: position.x,
        y: position.y,
        z: position.z,
    }
}

export function getProbeTrajectoryPath(probe: ProbeData, segments = 256) {
    const {
        baselineDistanceAu,
        direction,
        pathDistanceAu,
        startDistanceAu,
    } = getProbeTrajectorySnapshot(probe)
    const points: Array<{ x: number; y: number; z: number }> = []

    for (let i = 0; i <= segments; i += 1) {
        const progress = i / segments
        const distanceAu = startDistanceAu + (pathDistanceAu - startDistanceAu) * progress
        points.push(scaleScenePoint(direction, distanceAu / baselineDistanceAu))
    }

    return points
}

function getProbeTrajectorySnapshot(probe: ProbeData, at = new Date()): ProbeTrajectorySnapshot {
    const {
        referenceDate,
        startDistanceAu,
        referenceDistanceAu,
        speedAuPerYear,
    } = probe.escapeTrajectory
    const elapsedDays = getElapsedDaysFromIsoDate(referenceDate, at)
    const currentDistanceAu = Math.max(
        startDistanceAu,
        referenceDistanceAu + (elapsedDays / 365.25) * speedAuPerYear
    )

    return {
        baselineDistanceAu: probe.distance / ASTRONOMICAL_UNIT,
        currentDistanceAu,
        direction: getProbeDirection(probe),
        pathDistanceAu: Math.max(startDistanceAu, PROBE_GUIDE_LINE_MAX_DISTANCE_AU),
        startDistanceAu,
    }
}

function getProbeDirection(probe: ProbeData) {
    const longitude = degToRad(probe.direction.eclipticLongitudeDegrees)
    const latitude = degToRad(probe.direction.eclipticLatitudeDegrees)

    return getSceneDirection(longitude, latitude)
}
