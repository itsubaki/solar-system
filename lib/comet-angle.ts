import type { CometData } from "./comet-data"

const MS_PER_DAY = 1000 * 60 * 60 * 24
const FULL_TURN = Math.PI * 2
const KM_PER_AU = 149_600_000

type CometOrbitState = {
    angle: number
    radiusScale: number
    x: number
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
    const longitude = trueAnomaly + degToRad(orbitalElements.argumentOfPerihelion)
    const radiusAu = semiMajorAxisAu * (1 - orbitalElements.eccentricity * Math.cos(eccentricAnomaly))
    const baselineDistanceAu = comet.distance / KM_PER_AU
    const radiusScale = radiusAu / baselineDistanceAu

    return {
        angle: normalizeRadians(-longitude),
        radiusScale,
        x: radiusScale * Math.cos(longitude),
        z: -radiusScale * Math.sin(longitude),
    }
}

export function getCometOrbitPath(comet: CometData, segments = 512) {
    const { orbitalElements } = comet
    const semiMajorAxisAu = orbitalElements.perihelionDistanceAu / (1 - orbitalElements.eccentricity)
    const semiMinorAxisAu = semiMajorAxisAu * Math.sqrt(1 - orbitalElements.eccentricity * orbitalElements.eccentricity)
    const perihelionAngle = degToRad(orbitalElements.argumentOfPerihelion)
    const baselineDistanceAu = comet.distance / KM_PER_AU
    const points: Array<{ x: number; z: number }> = []

    for (let i = 0; i <= segments; i += 1) {
        const eccentricAnomaly = (FULL_TURN * i) / segments
        const localXAu = semiMajorAxisAu * (Math.cos(eccentricAnomaly) - orbitalElements.eccentricity)
        const localZAu = semiMinorAxisAu * Math.sin(eccentricAnomaly)

        points.push({
            x: (localXAu * Math.cos(perihelionAngle) - localZAu * Math.sin(perihelionAngle)) / baselineDistanceAu,
            z: -(localXAu * Math.sin(perihelionAngle) + localZAu * Math.cos(perihelionAngle)) / baselineDistanceAu,
        })
    }

    return points
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
