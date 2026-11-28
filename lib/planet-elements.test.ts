import { describe, expect, it } from "vitest"
import { Vector3 } from "three"
import { PLANETS } from "./planet-data"
import { blendDegrees, getLongTermPlanetElements, getModernPlanetModelWeight, PLANET_MODEL_START, PLANET_MODEL_END } from "./planet-elements"
import { getPlanetOrbitPlane, getPlanetOrbitPosition } from "./planet-angle"
import { getOrbitPlaneQuaternion } from "./orbit-frame"
import { getDeltaTSeconds, getDynamicalDate } from "./dynamical-time"

function position(name: string, at: Date) {
    const planet = PLANETS.find((planet) => planet.name === name)!
    const state = getPlanetOrbitPosition(planet, at)
    return new Vector3(state.x, 0, state.z).multiplyScalar(planet.distance)
        .applyQuaternion(getOrbitPlaneQuaternion(getPlanetOrbitPlane(planet, at)))
}

describe("long-range planetary approximation", () => {
    it("includes the outer-planet correction terms", () => {
        const at = new Date("2000-01-01T12:00:00Z")
        expect(getLongTermPlanetElements("Neptune", at)!.meanLongitude).toBeCloseTo(304.22289287 + 0.68346318, 10)
        expect(getLongTermPlanetElements("Jupiter", at)!.meanLongitude).toBeCloseTo(34.33479152 + 0.06064060, 10)
    })

    it("keeps the modern fit at present-day dates and uses the long-range fit outside it", () => {
        expect(getModernPlanetModelWeight(new Date("2026-11-28"))).toBe(1)
        expect(getModernPlanetModelWeight(new Date("1700-01-01"))).toBe(0)
        expect(getModernPlanetModelWeight(new Date("2100-01-01"))).toBe(0)
        expect(blendDegrees(359, 1, 0.5)).toBeCloseTo(360)
    })

    it("is continuous through the transition boundaries, including wrapped Neptune longitudes", () => {
        for (const year of [1800, 1810, 2040, 2050]) for (const planet of PLANETS) {
            const time = Date.UTC(year, 0, 1)
            expect(position(planet.name, new Date(time - 1)).distanceTo(position(planet.name, new Date(time + 1)))).toBeLessThan(1)
        }
    })

    it("keeps physical ellipses throughout the supported dates", () => {
        for (const at of [new Date(PLANET_MODEL_START), new Date("0001-01-01"), new Date(PLANET_MODEL_END)]) for (const planet of PLANETS) {
            const elements = getLongTermPlanetElements(planet.name, at)!
            expect(elements.eccentricity).toBeGreaterThanOrEqual(0)
            expect(elements.eccentricity).toBeLessThan(1)
            expect(elements.semiMajorAxisAu).toBeGreaterThan(0)
            expect(position(planet.name, at).toArray().every(Number.isFinite)).toBe(true)
        }
    })

    it("converts UTC to dynamical time without applying future UT1 predictions as leap seconds", () => {
        for (const date of ["2026-11-28", "2100-01-01", "3000-01-01"]) {
            const at = new Date(date)
            expect(getDynamicalDate(at).getTime() - at.getTime()).toBe(69184)
        }
        const j2000 = new Date("2000-01-01T12:00:00Z")
        expect(getDynamicalDate(j2000).getTime() - j2000.getTime()).toBe(64184)
        expect(getDeltaTSeconds(2000)).toBeCloseTo(63.86)
    })
})
