import { describe, expect, it } from "vitest"
import { getCalculatedSatelliteState, getMeanSatellitePositionKm } from "./satellite-model"
import { getEarthCenterFromBarycenter, getPlanetPositionKm, getSatellitePathKm } from "./body-position"
import { PLANETS } from "./planet-data"
import { getPlanetOrbitPlane, getPlanetOrbitPosition } from "./planet-angle"
import { getOrbitPlaneQuaternion } from "./orbit-frame"
import { MS_PER_DAY } from "./orbit"
import { Vector3 } from "three"

describe("mean-element satellite approximation", () => {
    it.each(["1700-01-01", "2000-01-01", "2026-12-01", "2100-01-01", "3000-01-01"])(
        "keeps positions and closed paths inside the orbital radius bounds at %s", (date) => {
            const at = new Date(date)
            for (const planet of PLANETS) for (const satellite of planet.satellites ?? []) {
                const state = getCalculatedSatelliteState(satellite.name, at)!
                const path = getSatellitePathKm(satellite, at)
                expect(path).toHaveLength(257)
                expect(path[0]).toEqual(state.position)
                expect(path.at(-1)).toEqual(state.position)
                for (const point of [state.position, ...path]) {
                    const radius = Math.hypot(point.x, point.y, point.z)
                    expect(radius).toBeGreaterThanOrEqual(satellite.distance * (1 - satellite.orbitPhase.eccentricity) - 1e-6)
                    expect(radius).toBeLessThanOrEqual(satellite.distance * (1 + satellite.orbitPhase.eccentricity) + 1e-6)
                }
            }
        }
    )

    it("closes an unprecessed ellipse after a full orbital period", () => {
        const parent = PLANETS.find((planet) => planet.name === "Earth")!
        const satellite = { ...parent.satellites![0], precession: undefined }
        const at = new Date("2026-11-28T00:00:00Z")
        const first = getMeanSatellitePositionKm(satellite, parent, at)
        const last = getMeanSatellitePositionKm(satellite, parent, new Date(at.getTime() + satellite.orbitalPeriod * MS_PER_DAY))
        expect(Math.hypot(first.x - last.x, first.y - last.y, first.z - last.z)).toBeLessThan(.001)
    })

    it("has no discontinuity when crossing a month boundary", () => {
        const at = Date.UTC(2026, 11, 1)
        for (const planet of PLANETS) for (const satellite of planet.satellites ?? []) {
            const before = getCalculatedSatelliteState(satellite.name, new Date(at - 1))!.position
            const after = getCalculatedSatelliteState(satellite.name, new Date(at + 1))!.position
            expect(Math.hypot(after.x - before.x, after.y - before.y, after.z - before.z)).toBeLessThan(.05)
        }
    })

    it("returns null for unknown satellite names", () => {
        expect(getCalculatedSatelliteState("unknown", new Date())).toBeNull()
        expect(getCalculatedSatelliteState("constructor", new Date())).toBeNull()
    })

    it("puts the Earth's center and the Moon around their mass-weighted barycenter", () => {
        const barycenter = { x: 149600000, y: 10, z: 20 }
        const moonRelative = { x: 384400, y: 1000, z: -2000 }
        const earth = getEarthCenterFromBarycenter(barycenter, moonRelative)
        const ratio = 4902.800118 / 398600.435507
        for (const axis of ["x", "y", "z"] as const) {
            const moon = earth[axis] + moonRelative[axis]
            expect((earth[axis] + ratio * moon) / (1 + ratio)).toBeCloseTo(barycenter[axis], 7)
        }
        expect(barycenter.x - earth.x).toBeGreaterThan(4600)
    })

    it("actually applies the Earth-center correction in the planet rendering position", () => {
        const earth = PLANETS.find((p) => p.name === "Earth")!
        const at = new Date("2026-11-28T00:07:00Z")
        const orbital = getPlanetOrbitPosition(earth, at)
        const barycenter = new Vector3(orbital.x, 0, orbital.z).multiplyScalar(earth.distance)
            .applyQuaternion(getOrbitPlaneQuaternion(getPlanetOrbitPlane(earth, at)))
        const corrected = getPlanetPositionKm(earth, at)
        const offset = Math.hypot(corrected.x - barycenter.x, corrected.y - barycenter.y, corrected.z - barycenter.z)
        expect(offset).toBeGreaterThan(4000)
        expect(offset).toBeLessThan(5100)
    })
})
