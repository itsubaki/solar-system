import { describe, expect, it } from "vitest"
import { createCatalogStarLayer, getCatalogStarDirection, getStarVisuals, HIPPARCOS_STARS } from "./star-catalog"
import { J2000_EPOCH_UTC, J2000_OBLIQUITY, MS_PER_DAY } from "./orbit"

describe("Hipparcos background", () => {
    it("contains real bright stars and identifiable constellation anchors", () => {
        expect(HIPPARCOS_STARS.length).toBeGreaterThan(8000)
        const ids = new Set(HIPPARCOS_STARS.map((star) => star[0]))
        for (const id of [32349, 30438, 69673, 91262, 27989, 24436, 11767]) expect(ids.has(id)).toBe(true)
        for (const star of HIPPARCOS_STARS) {
            expect(star[3]).toBeLessThan(6.5)
            expect(star.every(Number.isFinite)).toBe(true)
        }
    })

    it("converts ICRS to the same ecliptic axes as the planets", () => {
        const epoch = new Date(J2000_EPOCH_UTC - 8.75 * 365.25 * MS_PER_DAY)
        expect(getCatalogStarDirection([0, 0, 0, 0, 0, 0, 0], epoch)).toEqual({ x: 1, y: 0, z: -0 })
        const north = getCatalogStarDirection([0, 0, 90, 0, 0, 0, 0], epoch)
        expect(north.y).toBeCloseTo(Math.cos(J2000_OBLIQUITY), 12)
        expect(north.z).toBeCloseTo(-Math.sin(J2000_OBLIQUITY), 12)
    })

    it("propagates proper motion without a pole singularity", () => {
        const at = new Date("2100-01-01T00:00:00Z")
        const stationary = getCatalogStarDirection([0, 10, 90, 0, 0, 0, 0], at)
        const moving = getCatalogStarDirection([0, 10, 90, 0, 0, 1000, 1000], at)
        expect(Object.values(moving).every(Number.isFinite)).toBe(true)
        expect(Math.hypot(moving.x, moving.y, moving.z)).toBeCloseTo(1, 12)
        expect(Math.hypot(moving.x - stationary.x, moving.y - stationary.y, moving.z - stationary.z)).toBeGreaterThan(0.0001)
    })

    it("makes brighter catalog stars larger and brighter", () => {
        const bright = getStarVisuals(-1.4, 0), faint = getStarVisuals(6.4, 0)
        expect(bright.size).toBeGreaterThan(faint.size)
        expect(bright.brightness).toBeGreaterThan(faint.brightness)
        expect(createCatalogStarLayer(new Date(J2000_EPOCH_UTC), 1300).positions.length).toBe(HIPPARCOS_STARS.length * 3)
    })
})
