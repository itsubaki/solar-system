import type { CometData } from "./comet-data"
import {
    ASTRONOMICAL_UNIT,
    FULL_TURN,
    MS_PER_DAY,
    degToRad,
    normalizeRadians,
    solveKeplerEquation,
} from "./orbit"

type CometOrbitState = {
    angle: number
    radiusScale: number
    x: number
    y: number
    z: number
}

export function getCometOrbitPosition(comet: CometData, at = new Date()): CometOrbitState {
    const { orbitalElements } = comet
    const semiMajorAxisAu = orbitalElements.perihelionDistanceAu / (1 - orbitalElements.eccentricity)
    const meanMotion = FULL_TURN / comet.orbitalPeriod
    const elapsedDays = (at.getTime() - Date.parse(orbitalElements.perihelionDate)) / MS_PER_DAY
    const meanAnomaly = normalizeRadians(meanMotion * elapsedDays)
    const eccentricAnomaly = solveKeplerEquation(meanAnomaly, orbitalElements.eccentricity)
    const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + orbitalElements.eccentricity) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - orbitalElements.eccentricity) * Math.cos(eccentricAnomaly / 2)
    )
    const radiusAu = semiMajorAxisAu * (1 - orbitalElements.eccentricity * Math.cos(eccentricAnomaly))
    const baselineDistanceAu = comet.distance / ASTRONOMICAL_UNIT
    const radiusScale = radiusAu / baselineDistanceAu
    const worldPosition = getWorldOrbitPoint(
        radiusScale,
        trueAnomaly,
        degToRad(orbitalElements.argumentOfPerihelion),
        degToRad(comet.orbitPlane.longitudeOfAscendingNode),
        degToRad(comet.orbitPlane.inclination)
    )

    return {
        angle: normalizeRadians(Math.atan2(-worldPosition.z, worldPosition.x)),
        radiusScale,
        x: worldPosition.x,
        y: worldPosition.y,
        z: worldPosition.z,
    }
}

export function getCometOrbitPath(comet: CometData, segments = 512) {
    const { orbitalElements } = comet
    const semiMajorAxisAu = orbitalElements.perihelionDistanceAu / (1 - orbitalElements.eccentricity)
    const baselineDistanceAu = comet.distance / ASTRONOMICAL_UNIT
    const argumentOfPerihelion = degToRad(orbitalElements.argumentOfPerihelion)
    const longitudeOfAscendingNode = degToRad(comet.orbitPlane.longitudeOfAscendingNode)
    const orbitalInclination = degToRad(comet.orbitPlane.inclination)
    const points: Array<{ x: number; y: number; z: number }> = []

    for (let i = 0; i <= segments; i += 1) {
        const eccentricAnomaly = (FULL_TURN * i) / segments
        const trueAnomaly = 2 * Math.atan2(
            Math.sqrt(1 + orbitalElements.eccentricity) * Math.sin(eccentricAnomaly / 2),
            Math.sqrt(1 - orbitalElements.eccentricity) * Math.cos(eccentricAnomaly / 2)
        )
        const radiusAu = semiMajorAxisAu * (1 - orbitalElements.eccentricity * Math.cos(eccentricAnomaly))
        const radiusScale = radiusAu / baselineDistanceAu

        points.push(
            getWorldOrbitPoint(
                radiusScale,
                trueAnomaly,
                argumentOfPerihelion,
                longitudeOfAscendingNode,
                orbitalInclination
            )
        )
    }

    return points
}

function getWorldOrbitPoint(
    radiusScale: number,
    trueAnomaly: number,
    argumentOfPerihelion: number,
    longitudeOfAscendingNode: number,
    orbitalInclination: number
) {
    const argumentOfLatitude = trueAnomaly + argumentOfPerihelion
    const standardX = radiusScale * (
        Math.cos(longitudeOfAscendingNode) * Math.cos(argumentOfLatitude) -
        Math.sin(longitudeOfAscendingNode) * Math.sin(argumentOfLatitude) * Math.cos(orbitalInclination)
    )
    const standardY = radiusScale * (
        Math.sin(longitudeOfAscendingNode) * Math.cos(argumentOfLatitude) +
        Math.cos(longitudeOfAscendingNode) * Math.sin(argumentOfLatitude) * Math.cos(orbitalInclination)
    )
    const standardZ = radiusScale * Math.sin(argumentOfLatitude) * Math.sin(orbitalInclination)

    return {
        x: standardX,
        y: standardZ,
        z: -standardY,
    }
}
