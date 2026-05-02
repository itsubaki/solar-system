import { OrbitPhase, OrbitPlane, PlanetData, SatelliteData } from "./planet-data"
import {
    ASTRONOMICAL_UNIT,
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
    return getOrbitStateFromElements(getPlanetElements(planet, at))
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

export function getPlanetOrbitPath(planet: PlanetData, segments = 256, at = new Date()) {
    const elements = getPlanetElements(planet, at)

    return getOrbitPathPoints(
        elements.eccentricity,
        degToRad(elements.longitudeOfPeriapsis - elements.longitudeOfAscendingNode),
        segments,
        elements.semiMajorAxisScale
    )
}

export function getPlanetOrbitPlane(planet: PlanetData, at = new Date()): OrbitPlane {
    const elements = getPlanetElements(planet, at)

    return {
        ...planet.orbitPlane,
        inclination: elements.inclination,
        longitudeOfAscendingNode: elements.longitudeOfAscendingNode,
    }
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

function getPlanetElements(planet: PlanetData, at: Date = new Date()) {
    const elapsedDays = (at.getTime() - J2000_EPOCH_UTC) / MS_PER_DAY
    const elapsedCenturies = elapsedDays / 36525

    if (!planet.orbitRates) {
        return {
            eccentricity: planet.orbitPhase.eccentricity,
            inclination: planet.orbitPlane.inclination,
            longitudeOfAscendingNode: planet.orbitPlane.longitudeOfAscendingNode,
            longitudeOfPeriapsis: planet.orbitPhase.longitudeOfPeriapsis,
            meanLongitude: planet.orbitPhase.meanLongitudeAtJ2000 +
                (360 / planet.orbitalPeriod) * elapsedDays,
            semiMajorAxisScale: 1,
        }
    }

    const baseSemiMajorAxisAu = planet.distance / ASTRONOMICAL_UNIT
    const semiMajorAxisAu = baseSemiMajorAxisAu +
        planet.orbitRates.semiMajorAxisAuPerCentury * elapsedCenturies

    return {
        eccentricity: planet.orbitPhase.eccentricity +
            planet.orbitRates.eccentricityPerCentury * elapsedCenturies,
        inclination: planet.orbitPlane.inclination +
            planet.orbitRates.inclinationPerCentury * elapsedCenturies,
        longitudeOfAscendingNode: planet.orbitPlane.longitudeOfAscendingNode +
            planet.orbitRates.longitudeOfAscendingNodePerCentury * elapsedCenturies,
        longitudeOfPeriapsis: planet.orbitPhase.longitudeOfPeriapsis +
            planet.orbitRates.longitudeOfPeriapsisPerCentury * elapsedCenturies,
        meanLongitude: planet.orbitPhase.meanLongitudeAtJ2000 +
            planet.orbitRates.meanLongitudePerCentury * elapsedCenturies,
        semiMajorAxisScale: semiMajorAxisAu / baseSemiMajorAxisAu,
    }
}

function getOrbitStateFromElements(elements: {
    eccentricity: number
    longitudeOfAscendingNode: number
    longitudeOfPeriapsis: number
    meanLongitude: number
    semiMajorAxisScale: number
}): OrbitState {
    const argumentOfPeriapsis = degToRad(
        elements.longitudeOfPeriapsis - elements.longitudeOfAscendingNode
    )
    const meanAnomaly = normalizeRadians(degToRad(
        elements.meanLongitude - elements.longitudeOfPeriapsis
    ))
    const eccentricAnomaly = solveKeplerEquation(meanAnomaly, elements.eccentricity)
    const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + elements.eccentricity) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - elements.eccentricity) * Math.cos(eccentricAnomaly / 2)
    )
    const longitude = trueAnomaly + argumentOfPeriapsis
    const radiusScale = elements.semiMajorAxisScale *
        (1 - elements.eccentricity * Math.cos(eccentricAnomaly))

    return {
        angle: normalizeRadians(-longitude),
        radiusScale,
        x: radiusScale * Math.cos(longitude),
        z: -radiusScale * Math.sin(longitude),
    }
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

function getOrbitPathPoints(
    eccentricity: number,
    argumentOfPeriapsis: number,
    segments: number,
    semiMajorAxisScale = 1
) {
    const semiMinorAxis = Math.sqrt(1 - eccentricity * eccentricity)
    const points: Array<{ x: number; z: number }> = []

    for (let i = 0; i <= segments; i += 1) {
        const eccentricAnomaly = (FULL_TURN * i) / segments
        const localX = semiMajorAxisScale * (Math.cos(eccentricAnomaly) - eccentricity)
        const localZ = semiMajorAxisScale * semiMinorAxis * Math.sin(eccentricAnomaly)

        points.push({
            x: localX * Math.cos(argumentOfPeriapsis) - localZ * Math.sin(argumentOfPeriapsis),
            z: -(localX * Math.sin(argumentOfPeriapsis) + localZ * Math.cos(argumentOfPeriapsis)),
        })
    }

    return points
}
