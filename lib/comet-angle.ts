import type { CometData } from "./comet-data"

const MS_PER_DAY = 1000 * 60 * 60 * 24
const FULL_TURN = Math.PI * 2
const KM_PER_AU = 149_600_000

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
    const baselineDistanceAu = comet.distance / KM_PER_AU
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
    const baselineDistanceAu = comet.distance / KM_PER_AU
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

function degToRad(degrees: number) {
    return (degrees * Math.PI) / 180
}

function normalizeRadians(angle: number) {
    return ((angle % FULL_TURN) + FULL_TURN) % FULL_TURN
}

function solveKeplerEquation(meanAnomaly: number, eccentricity: number) {
    let eccentricAnomaly = meanAnomaly

    for (let i = 0; i < 8; i += 1) {
        eccentricAnomaly -= (eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly) / (1 - eccentricity * Math.cos(eccentricAnomaly))
    }

    return eccentricAnomaly
}
