import { describe, expect, it } from "vitest"

import {
    getProbeDistanceFromSun,
    getProbeTrajectoryPath,
    getProbeTrajectoryPosition,
} from "./probe-angle"
import { ASTRONOMICAL_UNIT } from "./orbit"
import type { ProbeData } from "./probe-data"

const REFERENCE_DATE = new Date(Date.UTC(2000, 0, 1, 12, 0, 0))

const probeFixture: ProbeData = {
    name: "Test Probe",
    radius: 1,
    displayRadius: 1,
    distance: ASTRONOMICAL_UNIT * 10,
    poleDirection: {
        longitude: 0,
        latitude: 90,
    },
    direction: {
        eclipticLongitudeDegrees: 90,
        eclipticLatitudeDegrees: 0,
    },
    color: "#fff",
    escapeTrajectory: {
        referenceDate: "2000-01-01T12:00:00Z",
        startDistanceAu: 3,
        referenceDistanceAu: 10,
        speedAuPerYear: 365.25,
    },
    description: "Test fixture",
}

describe("probe-angle", () => {
    it("returns the probe distance in AU and kilometers at the reference date", () => {
        const distance = getProbeDistanceFromSun(probeFixture, REFERENCE_DATE)

        expect(distance.au).toBeCloseTo(10)
        expect(distance.km).toBeCloseTo(ASTRONOMICAL_UNIT * 10)
    })

    it("clamps the distance to the configured start distance before the trajectory begins", () => {
        const earlierDate = new Date(
            REFERENCE_DATE.getTime() - 10 * 24 * 60 * 60 * 1000
        )
        const distance = getProbeDistanceFromSun(probeFixture, earlierDate)

        expect(distance.au).toBeCloseTo(3)
        expect(distance.km).toBeCloseTo(ASTRONOMICAL_UNIT * 3)
    })

    it("projects the trajectory along the configured direction", () => {
        const position = getProbeTrajectoryPosition(probeFixture, REFERENCE_DATE)

        expect(position.angle).toBeCloseTo(Math.PI / 2)
        expect(position.radiusScale).toBeCloseTo(1)
        expect(position.x).toBeCloseTo(0, 8)
        expect(position.y).toBeCloseTo(0)
        expect(position.z).toBeCloseTo(-1)
    })

    it("builds a straight guide path out to the maximum display distance", () => {
        const path = getProbeTrajectoryPath(probeFixture, 4)

        expect(path).toHaveLength(5)
        expect(path[0]?.x).toBeCloseTo(0, 8)
        expect(path[0]?.z).toBeCloseTo(-0.3)
        expect(path[path.length - 1]?.x).toBeCloseTo(0, 8)
        expect(path[path.length - 1]?.z).toBeCloseTo(-10_000)
    })
})
