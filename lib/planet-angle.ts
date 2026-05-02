import { OrbitPhase, PlanetData, SatelliteData } from "./planet-data"
import {
    FULL_TURN,
    MS_PER_DAY,
    degToRad,
    normalizeRadians,
    solveKeplerEquation,
} from "./orbit"

const J2000_EPOCH_UTC = Date.UTC(2000, 0, 1, 12, 0, 0)

type OrbitState = {
    angle: number
    radiusScale: number
    x: number
    z: number
}

export function getPlanetOrbitPosition(planet: PlanetData, at = new Date()): OrbitState {
    return getOrbitState(
        planet.orbitalPeriod,
        planet.orbitPhase,
        planet.orbitPlane.longitudeOfAscendingNode,
        at
    )
}

export function getSatelliteOrbitPosition(
    satellite: SatelliteData,
    at = new Date()
): OrbitState {
    return getOrbitState(
        satellite.orbitalPeriod,
        satellite.orbitPhase,
        satellite.orbitPlane.longitudeOfAscendingNode,
        at
    )
}

export function getPlanetOrbitPath(planet: PlanetData, segments = 256) {
    return getOrbitPathPoints(
        planet.orbitPhase.eccentricity,
        getArgumentOfPeriapsis(
            planet.orbitPhase,
            planet.orbitPlane.longitudeOfAscendingNode
        ),
        segments
    )
}

export function getSatelliteOrbitPath(
    satellite: SatelliteData,
    segments = 128
) {
    return getOrbitPathPoints(
        satellite.orbitPhase.eccentricity,
        getArgumentOfPeriapsis(
            satellite.orbitPhase,
            satellite.orbitPlane.longitudeOfAscendingNode
        ),
        segments
    )
}

function getOrbitState(
    orbitalPeriod: number,
    phase: OrbitPhase,
    longitudeOfAscendingNode: number,
    at: Date
): OrbitState {
    const elapsedDays = (at.getTime() - J2000_EPOCH_UTC) / MS_PER_DAY
    const meanMotion = FULL_TURN / orbitalPeriod
    const argumentOfPeriapsis = getArgumentOfPeriapsis(
        phase,
        longitudeOfAscendingNode
    )
    const meanAnomalyAtJ2000 = degToRad(
        phase.meanLongitudeAtJ2000 - phase.longitudeOfPeriapsis
    )
    const meanAnomaly = normalizeRadians(meanAnomalyAtJ2000 + meanMotion * elapsedDays)
    const eccentricAnomaly = solveKeplerEquation(meanAnomaly, phase.eccentricity)
    const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + phase.eccentricity) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - phase.eccentricity) * Math.cos(eccentricAnomaly / 2)
    )
    const longitude = trueAnomaly + argumentOfPeriapsis
    const radiusScale = 1 - phase.eccentricity * Math.cos(eccentricAnomaly)

    return {
        angle: normalizeRadians(-longitude),
        radiusScale,
        x: radiusScale * Math.cos(longitude),
        z: -radiusScale * Math.sin(longitude),
    }
}

function getArgumentOfPeriapsis(phase: OrbitPhase, longitudeOfAscendingNode: number) {
    return degToRad(phase.longitudeOfPeriapsis - longitudeOfAscendingNode)
}

function getOrbitPathPoints(eccentricity: number, argumentOfPeriapsis: number, segments: number) {
    const semiMinorAxis = Math.sqrt(1 - eccentricity * eccentricity)
    const points: Array<{ x: number; z: number }> = []

    for (let i = 0; i <= segments; i += 1) {
        const eccentricAnomaly = (FULL_TURN * i) / segments
        const localX = Math.cos(eccentricAnomaly) - eccentricity
        const localZ = semiMinorAxis * Math.sin(eccentricAnomaly)

        points.push({
            x: localX * Math.cos(argumentOfPeriapsis) - localZ * Math.sin(argumentOfPeriapsis),
            z: -(localX * Math.sin(argumentOfPeriapsis) + localZ * Math.cos(argumentOfPeriapsis)),
        })
    }

    return points
}
