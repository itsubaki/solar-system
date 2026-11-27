import { describe, expect, it } from "vitest"
import { Quaternion, Vector3 } from "three"
import { getEquatorPlaneQuaternion, getOrbitFrameQuaternion, getOrbitPlaneQuaternion } from "./orbit-frame"
import { PLANETS } from "./planet-data"
import { getSatelliteOrbitState } from "./planet-angle"
import { degToRad, J2000_OBLIQUITY } from "./orbit"

function equatorialToScene(x: number, y: number, z: number) {
    return new Vector3(x, -Math.sin(J2000_OBLIQUITY) * y + Math.cos(J2000_OBLIQUITY) * z,
        -Math.cos(J2000_OBLIQUITY) * y - Math.sin(J2000_OBLIQUITY) * z)
}

describe("JPL satellite reference frames", () => {
    it("uses the ICRF equator's ascending node as the Laplace longitude origin", () => {
        // JPL JUP365: Laplace pole RA=268.1°, Dec=64.5° at J2000.
        const io = PLANETS.find((p) => p.name === "Jupiter")!.satellites![0]
        const frame = getEquatorPlaneQuaternion(io.orbitPlane.referencePoleDirection!)
        const nodeRa = degToRad(268.1 + 90)
        const expectedNode = equatorialToScene(Math.cos(nodeRa), Math.sin(nodeRa), 0)
        expect(new Vector3(1, 0, 0).applyQuaternion(frame).distanceTo(expectedNode)).toBeLessThan(1e-12)
        const ra = degToRad(268.1), dec = degToRad(64.5)
        const expectedPole = equatorialToScene(Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec))
        expect(new Vector3(0, 1, 0).applyQuaternion(frame).distanceTo(expectedPole)).toBeLessThan(1e-12)
    })

    it.each(PLANETS.flatMap((planet) => (planet.satellites ?? []).map((satellite) => ({ planet, satellite, name: satellite.name }))))(
        "keeps $name's world frame independent of the parent's orbit transform", ({ planet, satellite }) => {
            const plane = getSatelliteOrbitState(satellite, new Date("2026-11-27T00:00:00Z")).plane
            const expected = getOrbitFrameQuaternion(plane, planet.poleDirection)
            for (const parent of [new Quaternion(), getOrbitPlaneQuaternion(planet.orbitPlane), new Quaternion().setFromAxisAngle(new Vector3(1, 2, 3).normalize(), 1.2)]) {
                const local = getOrbitFrameQuaternion(plane, planet.poleDirection, parent)
                expect(parent.clone().multiply(local).angleTo(expected)).toBeLessThan(1e-7)
            }
        }
    )

    it("keeps the Moon's reference plane in the ecliptic", () => {
        const plane = { inclination: 0, longitudeOfAscendingNode: 0, referenceFrame: "scene" as const }
        const parent = getOrbitPlaneQuaternion({ inclination: 20, longitudeOfAscendingNode: 80 })
        const local = getOrbitFrameQuaternion(plane, undefined, parent)
        expect(parent.multiply(local).angleTo(new Quaternion())).toBeLessThan(1e-7)
    })
})
