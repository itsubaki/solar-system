import { describe, expect, it } from "vitest"
import { Vector3 } from "three"
import { PLANETS } from "./planet-data"
import type { SatelliteData } from "./planet-data"
import { getSatelliteOrbitPath, getSatelliteOrbitState } from "./planet-angle"
import { getOrbitFrameQuaternion } from "./orbit-frame"
import { degToRad, J2000_EPOCH_UTC, MS_PER_DAY } from "./orbit"

const moon = PLANETS.find((p) => p.name === "Earth")!.satellites![0]
const afterYears = (years: number) => new Date(J2000_EPOCH_UTC + years * 365.25 * MS_PER_DAY)

describe("satellite secular precession", () => {
    it("regresses the lunar node by 90 degrees in a quarter nodal cycle", () => {
        expect(getSatelliteOrbitState(moon, afterYears(18.6 / 4)).plane.longitudeOfAscendingNode).toBeCloseTo(125.08 - 90, 8)
        expect(getSatelliteOrbitState(moon, afterYears(-18.6 / 4)).plane.longitudeOfAscendingNode).toBeCloseTo(125.08 + 90, 8)
    })

    it("returns the lunar orbital pole to its starting orientation after 18.6 years", () => {
        const pole = (years: number) => new Vector3(0, 1, 0).applyQuaternion(getOrbitFrameQuaternion(getSatelliteOrbitState(moon, afterYears(years)).plane))
        expect(pole(0).angleTo(pole(18.6))).toBeLessThan(1e-7)
        expect(pole(0).angleTo(pole(9.3))).toBeCloseTo(degToRad(2 * 5.16), 8)
    })

    it("advances the argument of periapsis, not its longitude, over the JPL apsidal period", () => {
        const start = getSatelliteOrbitState(moon, afterYears(0))
        const later = getSatelliteOrbitState(moon, afterYears(5.997 / 4))
        expect(later.argumentOfPeriapsis - start.argumentOfPeriapsis).toBeCloseTo(Math.PI / 2, 8)
        const path = getSatelliteOrbitPath(moon, 16, afterYears(5.997 / 4))
        expect(path[0].x).toBeCloseTo((1 - moon.orbitPhase.eccentricity) * Math.cos(later.argumentOfPeriapsis), 8)
        expect(path[0].z).toBeCloseTo(-(1 - moon.orbitPhase.eccentricity) * Math.sin(later.argumentOfPeriapsis), 8)
    })

    it("preserves sidereal longitude instead of counting precession twice", () => {
        const circular: SatelliteData = { ...moon, orbitPhase: { ...moon.orbitPhase, eccentricity: 0 } }
        for (const years of [0, 1, 26.9, -10]) {
            const state = getSatelliteOrbitState(circular, afterYears(years))
            const longitude = Math.atan2(-state.position.z, state.position.x) + degToRad(state.plane.longitudeOfAscendingNode)
            const expected = degToRad(circular.orbitPhase.meanLongitudeAtJ2000 + 360 * years * 365.25 / circular.orbitalPeriod)
            expect(Math.cos(longitude)).toBeCloseTo(Math.cos(expected), 7)
            expect(Math.sin(longitude)).toBeCloseTo(Math.sin(expected), 7)
        }
    })
})
