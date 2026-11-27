import { describe, expect, it } from "vitest"
import { COMETS } from "./comet-data"
import { getCometOrbitPath, getCometOrbitPosition } from "./comet-angle"
import { DWARF_PLANETS, PLANETS } from "./planet-data"
import {
    getPlanetOrbitPath,
    getPlanetOrbitPlane,
    getPlanetOrbitPosition,
    getSatelliteOrbitPath,
    getSatelliteOrbitPosition,
    getSatelliteOrbitState,
} from "./planet-angle"
import { ASTRONOMICAL_UNIT, degToRad, getOrbitPathSegmentCount, MS_PER_DAY, rotateOrbitPointToScene } from "./orbit"

type Point = { x: number; y?: number; z: number }
const EPOCH = new Date("2026-11-27T00:00:00Z")

// Measure distance to the rendered chords, rather than to an ideal ellipse.
function distanceToPath(point: Point, path: Point[]) {
    let closestSquared = Infinity
    for (let i = 1; i < path.length; i += 1) {
        const a = path[i - 1]
        const b = path[i]
        const dx = b.x - a.x
        const dy = (b.y ?? 0) - (a.y ?? 0)
        const dz = b.z - a.z
        const px = point.x - a.x
        const py = (point.y ?? 0) - (a.y ?? 0)
        const pz = point.z - a.z
        const t = Math.max(0, Math.min(1, (px * dx + py * dy + pz * dz) / (dx * dx + dy * dy + dz * dz)))
        closestSquared = Math.min(closestSquared, (px - t * dx) ** 2 + (py - t * dy) ** 2 + (pz - t * dz) ** 2)
    }
    return Math.sqrt(closestSquared)
}

function toRenderPoint(point: Point, distance: number) {
    return {
        x: Math.fround(point.x * distance / ASTRONOMICAL_UNIT),
        y: Math.fround((point.y ?? 0) * distance / ASTRONOMICAL_UNIT),
        z: Math.fround(point.z * distance / ASTRONOMICAL_UNIT),
    }
}

describe("orbit paths at radius scale x1", () => {
    it("bounds the circle chord error by a quarter of the body radius", () => {
        const distance = 30 * ASTRONOMICAL_UNIT
        const radius = 24_622
        const segments = getOrbitPathSegmentCount(distance, radius)

        expect(distance * (1 - Math.cos(Math.PI / segments))).toBeLessThanOrEqual(radius / 4)
        expect(getOrbitPathSegmentCount(1, 1, 128)).toBe(128)
    })

    it.each([...PLANETS, ...DWARF_PLANETS])("keeps $name on its rendered orbit", (planet) => {
        const path = getPlanetOrbitPath(planet, undefined, EPOCH).map((point) => toRenderPoint(point, planet.distance))
        // Include the interval between published simulation times at the fastest speed.
        for (const days of [0.123, 0.456, 0.789, 92]) {
            const position = getPlanetOrbitPosition(planet, new Date(EPOCH.getTime() + days * MS_PER_DAY))
            const point = {
                x: position.x * planet.distance / ASTRONOMICAL_UNIT,
                z: position.z * planet.distance / ASTRONOMICAL_UNIT,
            }
            expect(distanceToPath(point, path)).toBeLessThan(planet.radius / ASTRONOMICAL_UNIT)
        }
    })

    it.each(PLANETS.flatMap((planet) => planet.satellites ?? []))("keeps $name on its rendered orbit", (satellite) => {
        const path = getSatelliteOrbitPath(satellite, undefined, EPOCH).map((point) => toRenderPoint(point, satellite.distance))
        for (const days of [0.123, 0.456, 0.789, 92, 36525]) {
            const at = new Date(EPOCH.getTime() + days * MS_PER_DAY)
            const position = getSatelliteOrbitPosition(satellite, at)
            const apsisRotation = getSatelliteOrbitState(satellite, at).argumentOfPeriapsis -
                getSatelliteOrbitState(satellite, EPOCH).argumentOfPeriapsis
            const rotatedPath = path.map((point) => rotateOrbitPointToScene(point.x, point.z, apsisRotation, 0))
            expect(distanceToPath({
                x: position.x * satellite.distance / ASTRONOMICAL_UNIT,
                z: position.z * satellite.distance / ASTRONOMICAL_UNIT,
            }, rotatedPath)).toBeLessThan(satellite.radius / ASTRONOMICAL_UNIT)
        }
    })

    it.each(COMETS)("keeps $name on its rendered orbit", (comet) => {
        const path = getCometOrbitPath(comet).map((point) => toRenderPoint(point, comet.distance))
        for (const days of [0.123, 0.456, 0.789]) {
            const position = getCometOrbitPosition(comet, new Date(EPOCH.getTime() + days * MS_PER_DAY))
            expect(distanceToPath({
                x: position.x * comet.distance / ASTRONOMICAL_UNIT,
                y: position.y * comet.distance / ASTRONOMICAL_UNIT,
                z: position.z * comet.distance / ASTRONOMICAL_UNIT,
            }, path)).toBeLessThan(comet.displayRadius / ASTRONOMICAL_UNIT)
        }
    })

    it("keeps the path and orbit plane aligned after advancing the simulation", () => {
        const planet = PLANETS.find((planet) => planet.name === "Mercury")!
        const at = new Date("2126-11-27T00:00:00Z")
        const plane = getPlanetOrbitPlane(planet, at)
        const toScene = (point: Point) => rotateOrbitPointToScene(
            point.x,
            point.z,
            degToRad(plane.longitudeOfAscendingNode),
            degToRad(plane.inclination)
        )
        const path = getPlanetOrbitPath(planet, undefined, at).map(toScene)
        const position = toScene(getPlanetOrbitPosition(planet, at))

        expect(distanceToPath(position, path) * planet.distance).toBeLessThan(planet.radius / 4)
    })
})
