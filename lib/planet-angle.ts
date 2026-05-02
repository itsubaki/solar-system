import { OrbitPhase, PlanetData, SatelliteData } from "./planet-data"

const MS_PER_DAY = 1000 * 60 * 60 * 24
const J2000_EPOCH_UTC = Date.UTC(2000, 0, 1, 12, 0, 0)

type OrbitState = {
    angle: number
    radiusScale: number
    x: number
    z: number
}

export function getSatelliteOrbitAngle(
    satellite: SatelliteData,
    at = new Date()
): number {
    return getSatelliteOrbitPosition(satellite, at).angle
}

export function getInitialOrbitAngle(planet: PlanetData, at = new Date()) {
    return getPlanetOrbitPosition(planet, at).angle
}

export function getPlanetOrbitPosition(planet: PlanetData, at = new Date()): OrbitState {
    return getOrbitState(planet.orbitalPeriod, planet.orbitPhase, at)
}

export function getSatelliteOrbitPosition(
    satellite: SatelliteData,
    at = new Date()
): OrbitState {
    return getOrbitState(satellite.orbitalPeriod, satellite.orbitPhase, at)
}

export function getPlanetOrbitPath(planet: PlanetData, segments = 256) {
    return getOrbitPathPoints(
        planet.orbitPhase.eccentricity,
        degToRad(planet.orbitPhase.longitudeOfPeriapsis),
        segments
    )
}

export function getSatelliteOrbitPath(
    satellite: SatelliteData,
    segments = 128
) {
    return getOrbitPathPoints(
        satellite.orbitPhase.eccentricity,
        degToRad(satellite.orbitPhase.longitudeOfPeriapsis),
        segments
    )
}

export function degToRad(degrees: number) {
    return (degrees * Math.PI) / 180
}

function getOrbitState(orbitalPeriod: number, phase: OrbitPhase, at: Date): OrbitState {
    const elapsedDays = (at.getTime() - J2000_EPOCH_UTC) / MS_PER_DAY
    const meanMotion = (Math.PI * 2) / orbitalPeriod
    const meanAnomalyAtJ2000 = degToRad(
        phase.meanLongitudeAtJ2000 - phase.longitudeOfPeriapsis
    )
    const meanAnomaly = normalizeRadians(meanAnomalyAtJ2000 + meanMotion * elapsedDays)
    const eccentricAnomaly = solveKeplerEquation(meanAnomaly, phase.eccentricity)
    const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + phase.eccentricity) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - phase.eccentricity) * Math.cos(eccentricAnomaly / 2)
    )
    const longitude = trueAnomaly + degToRad(phase.longitudeOfPeriapsis)
    const radiusScale = 1 - phase.eccentricity * Math.cos(eccentricAnomaly)

    return {
        angle: normalizeRadians(-longitude),
        radiusScale,
        x: radiusScale * Math.cos(longitude),
        z: -radiusScale * Math.sin(longitude),
    }
}

function getOrbitPathPoints(eccentricity: number, longitudeOfPeriapsis: number, segments: number) {
    const semiMinorAxis = Math.sqrt(1 - eccentricity * eccentricity)
    const points: Array<{ x: number; z: number }> = []

    for (let i = 0; i <= segments; i += 1) {
        const eccentricAnomaly = (Math.PI * 2 * i) / segments
        const localX = Math.cos(eccentricAnomaly) - eccentricity
        const localZ = semiMinorAxis * Math.sin(eccentricAnomaly)

        points.push({
            x: localX * Math.cos(longitudeOfPeriapsis) - localZ * Math.sin(longitudeOfPeriapsis),
            z: -(localX * Math.sin(longitudeOfPeriapsis) + localZ * Math.cos(longitudeOfPeriapsis)),
        })
    }

    return points
}

function getCircularOrbitPath(segments: number) {
    const points: Array<{ x: number; z: number }> = []

    for (let i = 0; i <= segments; i += 1) {
        const angle = (Math.PI * 2 * i) / segments
        points.push({
            x: Math.cos(angle),
            z: -Math.sin(angle),
        })
    }

    return points
}

function normalizeRadians(angle: number) {
    const fullTurn = Math.PI * 2
    return ((angle % fullTurn) + fullTurn) % fullTurn
}

function solveKeplerEquation(meanAnomaly: number, eccentricity: number) {
    let eccentricAnomaly = meanAnomaly

    for (let i = 0; i < 6; i += 1) {
        eccentricAnomaly -= (eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly) / (1 - eccentricity * Math.cos(eccentricAnomaly))
    }

    return eccentricAnomaly
}
