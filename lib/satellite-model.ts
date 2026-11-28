import { Vector3 } from "three"
import { PLANETS, type PlanetData, type SatelliteData } from "./planet-data"
import { getSatelliteOrbitState } from "./planet-angle"
import { getOrbitFrameQuaternion } from "./orbit-frame"
import type { ScenePoint } from "./orbit"

export type SatelliteModelState = { position: ScenePoint }
const satellites = new Map(PLANETS.flatMap((parent) =>
    (parent.satellites ?? []).map((satellite) => [satellite.name, { satellite, parent }] as const)))
let cacheTime = NaN
const states = new Map<string, SatelliteModelState>()

// Visual approximation from the repository's mean orbital elements and secular
// precession. No fitted ephemeris, imported theory or periodic coefficient table.
export function getMeanSatellitePositionKm(satellite: SatelliteData, parent: PlanetData, at: Date): ScenePoint {
    const orbit = getSatelliteOrbitState(satellite, at)
    const position = new Vector3(orbit.position.x, 0, orbit.position.z).multiplyScalar(satellite.distance)
        .applyQuaternion(getOrbitFrameQuaternion(orbit.plane, parent.poleDirection))
    return { x: position.x, y: position.y, z: position.z }
}

export function getCalculatedSatelliteState(name: string, at: Date): SatelliteModelState | null {
    const body = satellites.get(name)
    if (!body) return null
    if (cacheTime !== at.getTime()) {
        cacheTime = at.getTime()
        states.clear()
    }
    const cached = states.get(name)
    if (cached) return cached
    const state = { position: getMeanSatellitePositionKm(body.satellite, body.parent, at) }
    states.set(name, state)
    return state
}
