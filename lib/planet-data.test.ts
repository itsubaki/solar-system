import { describe, expect, it } from "vitest"

import { PLANETS } from "./planet-data"

function getPlanet(name: string) {
    const planet = PLANETS.find((candidate) => candidate.name === name)

    if (!planet) {
        throw new Error(`Missing planet fixture: ${name}`)
    }

    return planet
}

function getSatellite(planetName: string, satelliteName: string) {
    const satellite = getPlanet(planetName).satellites?.find(
        (candidate) => candidate.name === satelliteName
    )

    if (!satellite) {
        throw new Error(`Missing satellite fixture: ${planetName}/${satelliteName}`)
    }

    return satellite
}

describe("planet-data", () => {
    it("keeps satellite ascending nodes from the JPL mean elements", () => {
        expect(getSatellite("Earth", "Moon").orbitPlane.longitudeOfAscendingNode).toBeCloseTo(125.08)
        expect(getSatellite("Jupiter", "Europa").orbitPlane.longitudeOfAscendingNode).toBeCloseTo(184)
        expect(getSatellite("Saturn", "Titan").orbitPlane.longitudeOfAscendingNode).toBeCloseTo(78.6)
        expect(getSatellite("Neptune", "Triton").orbitPlane.longitudeOfAscendingNode).toBeCloseTo(178.1)
    })

    it("keeps JPL Laplace-frame satellites in the Laplace reference frame", () => {
        expect(getSatellite("Mars", "Phobos").orbitPlane.referenceFrame).toBe("laplace")
        expect(getSatellite("Jupiter", "Europa").orbitPlane.referenceFrame).toBe("laplace")
        expect(getSatellite("Saturn", "Titan").orbitPlane.referenceFrame).toBe("laplace")
        expect(getSatellite("Neptune", "Triton").orbitPlane.referenceFrame).toBe("laplace")
    })

    it("represents retrograde planetary and satellite rotation/orbits consistently", () => {
        expect(getPlanet("Uranus").rotationPeriod).toBeLessThan(0)
        expect(getSatellite("Neptune", "Triton").orbitPlane.inclination).toBeGreaterThan(90)
        expect(getSatellite("Neptune", "Triton").orbitalPeriod).toBeGreaterThan(0)
    })

    it("aligns Triton's spin pole with its retrograde orbit instead of the ecliptic north pole", () => {
        expect(getSatellite("Neptune", "Triton").poleDirection.longitude).toBeCloseTo(114.683)
        expect(getSatellite("Neptune", "Triton").poleDirection.latitude).toBeCloseTo(-44.115)
    })
})
