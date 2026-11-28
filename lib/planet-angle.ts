import type { OrbitPlane, PlanetData, SatelliteData } from "./planet-data"
import { blendDegrees, getLongTermPlanetElements, getModernPlanetModelWeight } from "./planet-elements"
import { getDynamicalDate } from "./dynamical-time"
import {
    ASTRONOMICAL_UNIT,
    FULL_TURN,
    degToRad,
    getElapsedDays,
    getOrbitPlanePoint,
    getOrbitPathSegmentCount,
    getOrbitalPlaneState,
    J2000_EPOCH_UTC,
    normalizeRadians,
} from "./orbit"

type OrbitState = {
    angle: number
    radiusScale: number
    x: number
    z: number
}

export function getPlanetOrbitPosition(planet: PlanetData, at = new Date()): OrbitState {
    return getOrbitStateFromElements(getPlanetElements(planet, at))
}

export function getPlanetOrbitPath(planet: PlanetData, segments?: number, at = new Date()) {
    const elements = getPlanetElements(planet, at)

    return getOrbitPathPoints(
        elements.eccentricity,
        degToRad(elements.longitudeOfPeriapsis - elements.longitudeOfAscendingNode),
        segments ?? getOrbitPathSegmentCount(planet.distance * elements.semiMajorAxisScale, planet.radius),
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

export function getSatelliteOrbitPosition(
    satellite: SatelliteData,
    at = new Date()
): OrbitState {
    return getSatelliteOrbitState(satellite, at).position
}

export function getSatelliteOrbitState(satellite: SatelliteData, at = new Date()) {
    const elapsedDays = getElapsedDays(J2000_EPOCH_UTC, at)
    const elapsedYears = elapsedDays / 365.25
    const precessionAngle = (period = 0) => period === 0 ? 0 : 360 * elapsedYears / period
    const longitudeOfAscendingNode = satellite.orbitPlane.longitudeOfAscendingNode +
        precessionAngle(satellite.precession?.ascendingNodePeriodYears)
    const argumentOfPeriapsis = satellite.orbitPhase.longitudeOfPeriapsis -
        satellite.orbitPlane.longitudeOfAscendingNode +
        precessionAngle(satellite.precession?.argumentOfPeriapsisPeriodYears)
    // P is sidereal: advance mean longitude, then subtract the evolving
    // periapsis longitude to obtain the anomalistic phase. Do not add the
    // precession a second time to the satellite's mean longitude.
    const meanLongitude = satellite.orbitPhase.meanLongitudeAtJ2000 + 360 * elapsedDays / satellite.orbitalPeriod
    const meanAnomaly = normalizeRadians(degToRad(meanLongitude - argumentOfPeriapsis - longitudeOfAscendingNode))

    return {
        plane: { ...satellite.orbitPlane, longitudeOfAscendingNode },
        argumentOfPeriapsis: degToRad(argumentOfPeriapsis),
        position: getOrbitalPlaneState(meanAnomaly, satellite.orbitPhase.eccentricity, degToRad(argumentOfPeriapsis)),
    }
}

export function getSatelliteOrbitPath(
    satellite: SatelliteData,
    segments = getOrbitPathSegmentCount(satellite.distance, satellite.radius, 128),
    at = new Date()
) {
    return getOrbitPathPoints(
        satellite.orbitPhase.eccentricity,
        getSatelliteOrbitState(satellite, at).argumentOfPeriapsis,
        segments
    )
}

function getPlanetElements(planet: PlanetData, at: Date = new Date()) {
    const dynamicalDate = planet.orbitRates ? getDynamicalDate(at) : at
    const elapsedDays = getElapsedDays(J2000_EPOCH_UTC, dynamicalDate)
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

    const modern = {
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
    const longTerm = getLongTermPlanetElements(planet.name, dynamicalDate)
    if (!longTerm) return modern
    const weight = getModernPlanetModelWeight(at)
    const mix = (longValue: number, modernValue: number) => longValue + (modernValue - longValue) * weight
    return {
        eccentricity: mix(longTerm.eccentricity, modern.eccentricity),
        inclination: mix(longTerm.inclination, modern.inclination),
        longitudeOfAscendingNode: blendDegrees(longTerm.longitudeOfAscendingNode, modern.longitudeOfAscendingNode, weight),
        longitudeOfPeriapsis: blendDegrees(longTerm.longitudeOfPeriapsis, modern.longitudeOfPeriapsis, weight),
        meanLongitude: blendDegrees(longTerm.meanLongitude, modern.meanLongitude, weight),
        semiMajorAxisScale: mix(longTerm.semiMajorAxisAu / baseSemiMajorAxisAu, modern.semiMajorAxisScale),
    }
}

function getOrbitStateFromElements(elements: {
    eccentricity: number
    longitudeOfAscendingNode: number
    longitudeOfPeriapsis: number
    meanLongitude: number
    semiMajorAxisScale: number
}): OrbitState {
    return getOrbitalPlaneState(
        normalizeRadians(degToRad(elements.meanLongitude - elements.longitudeOfPeriapsis)),
        elements.eccentricity,
        degToRad(elements.longitudeOfPeriapsis - elements.longitudeOfAscendingNode),
        elements.semiMajorAxisScale
    )
}

function getOrbitPathPoints(
    eccentricity: number,
    argumentOfPeriapsis: number,
    segments: number,
    semiMajorAxisScale = 1
) {
    const points: Array<{ x: number; z: number }> = []

    for (let i = 0; i <= segments; i += 1) {
        const eccentricAnomaly = (FULL_TURN * i) / segments
        points.push(
            getOrbitPlanePoint(
                eccentricAnomaly,
                eccentricity,
                argumentOfPeriapsis,
                semiMajorAxisScale
            )
        )
    }

    return points
}
