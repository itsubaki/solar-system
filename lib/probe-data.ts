import { ASTRONOMICAL_UNIT } from "./orbit"
import type { PoleDirection } from "./planet-data"

export interface EscapeTrajectoryData {
    startDate: string
    referenceDate: string
    startDistanceAu: number
    referenceDistanceAu: number
    speedAuPerYear: number
}

export interface ProbeDirectionData {
    eclipticLongitudeDegrees: number
    eclipticLatitudeDegrees: number
}

export interface ProbeData {
    name: string
    radius: number
    displayRadius: number
    distance: number
    poleDirection: PoleDirection
    direction: ProbeDirectionData
    color: string
    emissive?: string
    emissiveIntensity?: number
    escapeTrajectory: EscapeTrajectoryData
    description: string
}

export const PROBES: ProbeData[] = [
    {
        name: "Voyager 1",
        radius: 0.0018,
        displayRadius: 5000,
        distance: ASTRONOMICAL_UNIT * 170.425289,
        poleDirection: { longitude: 0, latitude: 90 },
        direction: {
            eclipticLongitudeDegrees: 256.729,
            eclipticLatitudeDegrees: 35.157,
        },
        color: "#9FD8FF",
        emissive: "#E6F6FF",
        emissiveIntensity: 0.8,
        escapeTrajectory: {
            startDate: "1977-09-05T12:56:00Z",
            referenceDate: "2026-05-01T00:00:00Z",
            startDistanceAu: 1,
            referenceDistanceAu: 170.425289,
            speedAuPerYear: 3.569,
        },
        description: "NASA's farthest spacecraft, launched in 1977 and now moving through interstellar space beyond the heliosphere."
    },
    {
        name: "Voyager 2",
        radius: 0.0018,
        displayRadius: 5000,
        distance: ASTRONOMICAL_UNIT * 142.756110,
        poleDirection: { longitude: 0, latitude: 90 },
        direction: {
            eclipticLongitudeDegrees: 290.689,
            eclipticLatitudeDegrees: -38.418,
        },
        color: "#FFE3A1",
        emissive: "#FFF7DD",
        emissiveIntensity: 0.8,
        escapeTrajectory: {
            startDate: "1977-08-20T14:29:00Z",
            referenceDate: "2026-05-01T00:00:00Z",
            startDistanceAu: 1,
            referenceDistanceAu: 142.756110,
            speedAuPerYear: 3.219,
        },
        description: "The only probe to visit Uranus and Neptune, continuing outward on an interstellar mission after its 1977 launch."
    },
    {
        name: "New Horizons",
        radius: 0.00135,
        displayRadius: 5000,
        distance: ASTRONOMICAL_UNIT * 64.51563312195802,
        poleDirection: { longitude: 0, latitude: 90 },
        direction: {
            eclipticLongitudeDegrees: 288.4243549488826,
            eclipticLatitudeDegrees: 1.9959965324198068,
        },
        color: "#C7D4E8",
        emissive: "#F3F7FF",
        emissiveIntensity: 0.8,
        escapeTrajectory: {
            startDate: "2006-01-19T19:00:00Z",
            referenceDate: "2026-05-01T00:00:00Z",
            startDistanceAu: 1,
            referenceDistanceAu: 64.51563312195802,
            speedAuPerYear: 2.867961989977944,
        },
        description: "NASA's Pluto and Arrokoth explorer, launched in 2006 and now continuing deeper into the Kuiper Belt."
    }
]
