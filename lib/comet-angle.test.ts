import { describe, expect, it } from "vitest"

import { getCometOrbitPath, getCometOrbitPosition } from "./comet-angle"
import type { CometData } from "./comet-data"
import { ASTRONOMICAL_UNIT } from "./orbit"

const REFERENCE_DATE = new Date(Date.UTC(2000, 0, 1, 12, 0, 0))

const circularComet: CometData = {
    name: "Test Comet",
    radius: 1,
    displayRadius: 1,
    distance: ASTRONOMICAL_UNIT,
    poleDirection: {
        longitude: 0,
        latitude: 90,
    },
    orbitPlane: {
        inclination: 0,
        longitudeOfAscendingNode: 0,
    },
    orbitalPeriod: 100,
    color: "#fff",
    orbitalElements: {
        eccentricity: 0,
        perihelionDistanceAu: 1,
        argumentOfPerihelion: 0,
        perihelionDate: "2000-01-01T12:00:00Z",
    },
    description: "Test fixture",
}

describe("comet-angle", () => {
    it("returns the expected perihelion position at the reference date", () => {
        const position = getCometOrbitPosition(circularComet, REFERENCE_DATE)

        expect(position.angle).toBeCloseTo(0)
        expect(position.radiusScale).toBeCloseTo(1)
        expect(position.x).toBeCloseTo(1)
        expect(position.y).toBeCloseTo(0)
        expect(position.z).toBeCloseTo(0)
    })

    it("advances by a quarter turn after a quarter orbital period", () => {
        const quarterOrbitDate = new Date(
            REFERENCE_DATE.getTime() + 25 * 24 * 60 * 60 * 1000
        )
        const position = getCometOrbitPosition(circularComet, quarterOrbitDate)

        expect(position.angle).toBeCloseTo(Math.PI / 2)
        expect(position.radiusScale).toBeCloseTo(1)
        expect(position.x).toBeCloseTo(0, 8)
        expect(position.y).toBeCloseTo(0)
        expect(position.z).toBeCloseTo(-1)
    })

    it("applies the orbit plane inclination to the world position", () => {
        const inclinedComet: CometData = {
            ...circularComet,
            orbitPlane: {
                inclination: 90,
                longitudeOfAscendingNode: 0,
            },
            orbitalElements: {
                ...circularComet.orbitalElements,
                argumentOfPerihelion: 90,
            },
        }

        const position = getCometOrbitPosition(inclinedComet, REFERENCE_DATE)

        expect(position.x).toBeCloseTo(0, 8)
        expect(position.y).toBeCloseTo(1)
        expect(position.z).toBeCloseTo(0, 8)
    })

    it("builds a closed orbit path with the requested segment count", () => {
        const path = getCometOrbitPath(circularComet, 16)

        expect(path).toHaveLength(17)
        expect(path[0]?.x).toBeCloseTo(path[path.length - 1]?.x ?? 0)
        expect(path[0]?.y).toBeCloseTo(path[path.length - 1]?.y ?? 0)
        expect(path[0]?.z).toBeCloseTo(path[path.length - 1]?.z ?? 0)
    })
})
