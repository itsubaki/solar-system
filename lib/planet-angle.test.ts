import { describe, expect, it } from "vitest"

import {
    getPlanetOrbitPath,
    getPlanetOrbitPosition,
    getSatelliteOrbitPath,
    getSatelliteOrbitPosition,
} from "./planet-angle"
import { degToRad } from "./orbit"
import type { PlanetData, SatelliteData } from "./planet-data"

const circularPlanet: PlanetData = {
    name: "Test Planet",
    radius: 1,
    distance: 1,
    orbitalPeriod: 100,
    rotationPeriod: 1,
    poleDirection: {
        longitude: 0,
        latitude: 90,
    },
    orbitPlane: {
        inclination: 0,
        longitudeOfAscendingNode: 0,
    },
    orbitPhase: {
        eccentricity: 0,
        longitudeOfPeriapsis: 0,
        meanLongitudeAtJ2000: 0,
    },
    color: "#fff",
    description: "Test fixture",
}

const circularSatellite: SatelliteData = {
    name: "Test Satellite",
    radius: 1,
    distance: 1,
    orbitalPeriod: 10,
    poleDirection: {
        longitude: 0,
        latitude: 90,
    },
    orbitPlane: {
        inclination: 0,
        longitudeOfAscendingNode: 0,
    },
    orbitPhase: {
        eccentricity: 0,
        longitudeOfPeriapsis: 0,
        meanLongitudeAtJ2000: 0,
    },
    color: "#fff",
}

describe("planet-angle", () => {
    it("converts degrees to radians", () => {
        expect(degToRad(180)).toBeCloseTo(Math.PI)
        expect(degToRad(90)).toBeCloseTo(Math.PI / 2)
    })

    it("returns the expected circular orbit position at J2000", () => {
        const position = getPlanetOrbitPosition(
            circularPlanet,
            new Date(Date.UTC(2000, 0, 1, 12, 0, 0))
        )

        expect(position.angle).toBeCloseTo(0)
        expect(position.radiusScale).toBeCloseTo(1)
        expect(position.x).toBeCloseTo(1)
        expect(position.z).toBeCloseTo(0)
    })

    it("advances by a quarter turn after a quarter orbital period", () => {
        const quarterOrbitDate = new Date(
            Date.UTC(2000, 0, 1, 12, 0, 0) + 25 * 24 * 60 * 60 * 1000
        )
        const position = getPlanetOrbitPosition(circularPlanet, quarterOrbitDate)

        expect(position.angle).toBeCloseTo((Math.PI * 3) / 2)
        expect(position.x).toBeCloseTo(0, 8)
        expect(position.z).toBeCloseTo(-1)
    })

    it("builds a closed orbit path with the requested segment count", () => {
        const path = getPlanetOrbitPath(circularPlanet, 16)

        expect(path).toHaveLength(17)
        expect(path[0]?.x).toBeCloseTo(path[path.length - 1]?.x ?? 0)
        expect(path[0]?.z).toBeCloseTo(path[path.length - 1]?.z ?? 0)
    })

    it("returns the expected circular satellite orbit position at J2000", () => {
        const position = getSatelliteOrbitPosition(
            circularSatellite,
            new Date(Date.UTC(2000, 0, 1, 12, 0, 0))
        )

        expect(position.angle).toBeCloseTo(0)
        expect(position.radiusScale).toBeCloseTo(1)
        expect(position.x).toBeCloseTo(1)
        expect(position.z).toBeCloseTo(0)
    })

    it("builds a closed satellite orbit path with the requested segment count", () => {
        const path = getSatelliteOrbitPath(circularSatellite, 12)

        expect(path).toHaveLength(13)
        expect(path[0]?.x).toBeCloseTo(path[path.length - 1]?.x ?? 0)
        expect(path[0]?.z).toBeCloseTo(path[path.length - 1]?.z ?? 0)
    })
})
