import { PlanetData, SatelliteData } from "./planet-data"

const MS_PER_DAY = 1000 * 60 * 60 * 24
const J2000_EPOCH_UTC = Date.UTC(2000, 0, 1, 12, 0, 0)

type OrbitPhase = {
    eccentricity: number
    longitudeOfPeriapsis: number
    meanLongitudeAtJ2000: number
}

type OrbitState = {
    angle: number
    radiusScale: number
    x: number
    z: number
}

export const SATELLITE_ORBITAL_PHASES: Record<string, Record<string, {
    eccentricity: number
    longitudeOfPeriapsis: number
    meanLongitudeAtJ2000: number
}>> = {
    Earth: {
        Moon: {
            eccentricity: 0.0549,
            longitudeOfPeriapsis: 318.15, // deg
            meanLongitudeAtJ2000: 115.3654, // deg
        },
    },
    Jupiter: {
        Io: {
            eccentricity: 0.0041,
            longitudeOfPeriapsis: 84.129,
            meanLongitudeAtJ2000: 171.0169,
        },
        Europa: {
            eccentricity: 0.0094,
            longitudeOfPeriapsis: 88.970,
            meanLongitudeAtJ2000: 41.923,
        },
        Ganymede: {
            eccentricity: 0.0013,
            longitudeOfPeriapsis: 192.417,
            meanLongitudeAtJ2000: 63.552,
        },
        Callisto: {
            eccentricity: 0.0074,
            longitudeOfPeriapsis: 52.643,
            meanLongitudeAtJ2000: 24.833,
        },
    },
    Mars: {
        Phobos: {
            eccentricity: 0.0151,
            longitudeOfPeriapsis: 150.057,
            meanLongitudeAtJ2000: 177.617,
        },
        Deimos: {
            eccentricity: 0.0002,
            longitudeOfPeriapsis: 260.729,
            meanLongitudeAtJ2000: 53.316,
        },
    },
    Saturn: {
        Titan: {
            eccentricity: 0.0288,
            longitudeOfPeriapsis: 186.585,
            meanLongitudeAtJ2000: 28.051,
        },
    },
    Neptune: {
        Triton: {
            eccentricity: 0.000016,
            longitudeOfPeriapsis: 0,
            meanLongitudeAtJ2000: 0,
        },
    },
}

const PLANET_ORBITAL_PHASES: Record<string, {
    eccentricity: number
    longitudeOfPerihelion: number
    meanLongitudeAtJ2000: number
}> = {
    Mercury: {
        eccentricity: 0.20563069,
        longitudeOfPerihelion: 77.45645,
        meanLongitudeAtJ2000: 252.25084,
    },
    Venus: {
        eccentricity: 0.00677323,
        longitudeOfPerihelion: 131.53298,
        meanLongitudeAtJ2000: 181.97973,
    },
    Earth: {
        eccentricity: 0.01671022,
        longitudeOfPerihelion: 102.94719,
        meanLongitudeAtJ2000: 100.46435,
    },
    Mars: {
        eccentricity: 0.09341233,
        longitudeOfPerihelion: -23.94363,
        meanLongitudeAtJ2000: -4.55343,
    },
    Ceres: {
        eccentricity: 0.07957631994408416,
        longitudeOfPerihelion: 153.54938555433483,
        meanLongitudeAtJ2000: 385.0891185587054,
    },
    Jupiter: {
        eccentricity: 0.04839266,
        longitudeOfPerihelion: 14.72848,
        meanLongitudeAtJ2000: 34.39644,
    },
    Saturn: {
        eccentricity: 0.0541506,
        longitudeOfPerihelion: 92.59888,
        meanLongitudeAtJ2000: 49.95424,
    },
    Uranus: {
        eccentricity: 0.04716771,
        longitudeOfPerihelion: 170.95428,
        meanLongitudeAtJ2000: 313.2381,
    },
    Neptune: {
        eccentricity: 0.00858587,
        longitudeOfPerihelion: 44.96476,
        meanLongitudeAtJ2000: -55.12003,
    },
    Pluto: {
        eccentricity: 0.24880766,
        longitudeOfPerihelion: 224.06676,
        meanLongitudeAtJ2000: 238.92881,
    },
    Haumea: {
        eccentricity: 0.1957748236999078,
        longitudeOfPerihelion: 362.685623066236,
        meanLongitudeAtJ2000: 585.0132756143271,
    },
    Makemake: {
        eccentricity: 0.1604249925523523,
        longitudeOfPerihelion: 376.3443476128863,
        meanLongitudeAtJ2000: 545.664625586251,
    },
    Eris: {
        eccentricity: 0.4369649682100509,
        longitudeOfPerihelion: 186.7594587351884,
        meanLongitudeAtJ2000: 397.2088478471641,
    },
}

export function getSatelliteOrbitAngle(
    planetName: string,
    satellite: SatelliteData,
    at = new Date()
): number {
    return getSatelliteOrbitPosition(planetName, satellite, at).angle
}

export function getInitialOrbitAngle(planet: PlanetData, at = new Date()) {
    return getPlanetOrbitPosition(planet, at).angle
}

export function getPlanetOrbitPosition(planet: PlanetData, at = new Date()): OrbitState {
    const orbitalPhase = PLANET_ORBITAL_PHASES[planet.name]
    if (!orbitalPhase) {
        return getCircularOrbitState(planet.orbitalPeriod, at)
    }

    return getOrbitState(
        planet.orbitalPeriod,
        {
            eccentricity: orbitalPhase.eccentricity,
            longitudeOfPeriapsis: orbitalPhase.longitudeOfPerihelion,
            meanLongitudeAtJ2000: orbitalPhase.meanLongitudeAtJ2000,
        },
        at
    )
}

export function getSatelliteOrbitPosition(
    planetName: string,
    satellite: SatelliteData,
    at = new Date()
): OrbitState {
    const phase = SATELLITE_ORBITAL_PHASES[planetName]?.[satellite.name]
    if (!phase) {
        return getCircularOrbitState(satellite.orbitalPeriod, at)
    }

    return getOrbitState(satellite.orbitalPeriod, phase, at)
}

export function getPlanetOrbitPath(planet: PlanetData, segments = 256) {
    const orbitalPhase = PLANET_ORBITAL_PHASES[planet.name]
    if (!orbitalPhase) {
        return getCircularOrbitPath(segments)
    }

    return getOrbitPathPoints(
        orbitalPhase.eccentricity,
        degToRad(orbitalPhase.longitudeOfPerihelion),
        segments
    )
}

export function getSatelliteOrbitPath(
    planetName: string,
    satellite: SatelliteData,
    segments = 128
) {
    const phase = SATELLITE_ORBITAL_PHASES[planetName]?.[satellite.name]
    if (!phase) {
        return getCircularOrbitPath(segments)
    }

    return getOrbitPathPoints(
        phase.eccentricity,
        degToRad(phase.longitudeOfPeriapsis),
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

function getCircularOrbitState(orbitalPeriod: number, at: Date): OrbitState {
    const elapsedDays = (at.getTime() - J2000_EPOCH_UTC) / MS_PER_DAY
    const longitude = normalizeRadians(((Math.PI * 2) / orbitalPeriod) * elapsedDays)

    return {
        angle: normalizeRadians(-longitude),
        radiusScale: 1,
        x: Math.cos(longitude),
        z: -Math.sin(longitude),
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
