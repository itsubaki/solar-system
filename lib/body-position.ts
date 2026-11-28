import { Vector3 } from "three"
import { PLANETS, type PlanetData, type SatelliteData } from "./planet-data"
import { getPlanetOrbitPlane, getPlanetOrbitPosition, getSatelliteOrbitState } from "./planet-angle"
import { getOrbitFrameQuaternion, getOrbitPlaneQuaternion } from "./orbit-frame"
import { getMeanSatellitePositionKm } from "./satellite-model"
import { getOrbitPlanePoint, type ScenePoint } from "./orbit"

// DE440 gravitational parameters: https://ssd.jpl.nasa.gov/astro_par.html
const MOON_MASS_FRACTION = 4902.800118 / (398600.435507 + 4902.800118)

export function getSatellitePositionKm(satellite: SatelliteData, parent: PlanetData, at: Date): ScenePoint {
    return getMeanSatellitePositionKm(satellite, parent, at)
}

export function getEarthCenterFromBarycenter(barycenter: ScenePoint, moonFromEarth: ScenePoint): ScenePoint {
    return {
        x: barycenter.x - MOON_MASS_FRACTION * moonFromEarth.x,
        y: barycenter.y - MOON_MASS_FRACTION * moonFromEarth.y,
        z: barycenter.z - MOON_MASS_FRACTION * moonFromEarth.z,
    }
}

export function getPlanetPositionKm(planet: PlanetData, at: Date): ScenePoint {
    const state = getPlanetOrbitPosition(planet, at)
    const point = new Vector3(state.x, 0, state.z).multiplyScalar(planet.distance)
        .applyQuaternion(getOrbitPlaneQuaternion(getPlanetOrbitPlane(planet, at)))
    const moon = planet.name === "Earth" ? planet.satellites?.find((s) => s.name === "Moon") : undefined
    return moon ? getEarthCenterFromBarycenter(point, getSatellitePositionKm(moon, planet, at)) : point
}

// Draw the same mean-element ellipse and reference frame used by the body.
// Start at its current anomaly so the first/last vertices meet its position.
export function getSatellitePathKm(satellite: SatelliteData, at: Date, segments = 256): ScenePoint[] {
    const parent = PLANETS.find((planet) => planet.satellites?.some((body) => body.name === satellite.name))
    if (!parent) throw new Error(`Unknown satellite: ${satellite.name}`)
    const orbit = getSatelliteOrbitState(satellite, at)
    const eccentricity = satellite.orbitPhase.eccentricity
    const anomaly = orbit.position.trueAnomaly
    const eccentric = Math.atan2(Math.sqrt(1 - eccentricity * eccentricity) * Math.sin(anomaly),
        eccentricity + Math.cos(anomaly))
    const frame = getOrbitFrameQuaternion(orbit.plane, parent.poleDirection)
    const current = getMeanSatellitePositionKm(satellite, parent, at)
    return Array.from({ length: segments + 1 }, (_, i) => {
        if (i === 0 || i === segments) return { ...current }
        const local = getOrbitPlanePoint(eccentric + i * 2 * Math.PI / segments,
            eccentricity, orbit.argumentOfPeriapsis)
        const point = new Vector3(local.x, 0, local.z).multiplyScalar(satellite.distance).applyQuaternion(frame)
        return { x: point.x, y: point.y, z: point.z }
    })
}
