import { ASTRONOMICAL_UNIT } from "./orbit"
import type { PoleDirection } from "./planet-data"

export interface EscapeTrajectoryData {
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
        distance: ASTRONOMICAL_UNIT * 170.42531655547148,
        poleDirection: { longitude: 0, latitude: 90 },
        direction: {
            eclipticLongitudeDegrees: 256.73185393127073,
            eclipticLatitudeDegrees: 35.1538143726996,
        },
        color: "#9FD8FF",
        emissive: "#E6F6FF",
        emissiveIntensity: 0.8,
        escapeTrajectory: {
            referenceDate: "2026-05-01T00:00:00Z",
            startDistanceAu: 1,
            referenceDistanceAu: 170.42531655547148,
            speedAuPerYear: 3.561336440399333,
        },
        description: "NASA's farthest spacecraft, launched in 1977 and now moving through interstellar space beyond the heliosphere."
    },
    {
        name: "Voyager 2",
        radius: 0.0018,
        displayRadius: 5000,
        distance: ASTRONOMICAL_UNIT * 142.75611752150198,
        poleDirection: { longitude: 0, latitude: 90 },
        direction: {
            eclipticLongitudeDegrees: 290.6899748965969,
            eclipticLatitudeDegrees: -38.41565389035409,
        },
        color: "#FFE3A1",
        emissive: "#FFF7DD",
        emissiveIntensity: 0.8,
        escapeTrajectory: {
            referenceDate: "2026-05-01T00:00:00Z",
            startDistanceAu: 1,
            referenceDistanceAu: 142.75611752150198,
            speedAuPerYear: 3.1734829523991857,
        },
        description: "The only probe to visit Uranus and Neptune, continuing outward on an interstellar mission after its 1977 launch."
    },
    {
        name: "New Horizons",
        radius: 0.00135,
        displayRadius: 5000,
        distance: ASTRONOMICAL_UNIT * 64.51563938938332,
        poleDirection: { longitude: 0, latitude: 90 },
        direction: {
            eclipticLongitudeDegrees: 288.424355395938,
            eclipticLatitudeDegrees: 1.9959965407095377,
        },
        color: "#C7D4E8",
        emissive: "#F3F7FF",
        emissiveIntensity: 0.8,
        escapeTrajectory: {
            referenceDate: "2026-05-01T00:00:00Z",
            startDistanceAu: 1,
            referenceDistanceAu: 64.51563938938332,
            speedAuPerYear: 2.858763799999985,
        },
        description: "NASA's Pluto and Arrokoth explorer, launched in 2006 and now continuing deeper into the Kuiper Belt."
    }
]
