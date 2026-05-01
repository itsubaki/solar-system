import { ASTRONOMICAL_UNIT, type PoleDirection } from "./planet-data"

export interface EscapeTrajectoryData {
    startDate: string
    startDistanceAu: number
    speedAuPerYear: number
    maxDistanceAu: number
    headingDegrees?: number
}

export interface ProbeData {
    name: string
    radius: number
    displayRadius: number
    distance: number
    poleDirection: PoleDirection
    orbitalInclination: number
    longitudeOfAscendingNode: number
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
        distance: ASTRONOMICAL_UNIT * 166,
        poleDirection: { longitude: 0, latitude: 90 },
        orbitalInclination: 35,
        longitudeOfAscendingNode: 255,
        color: "#9FD8FF",
        emissive: "#E6F6FF",
        emissiveIntensity: 0.8,
        escapeTrajectory: {
            startDate: "1977-09-05T12:56:00Z",
            startDistanceAu: 1,
            speedAuPerYear: 3.39,
            maxDistanceAu: 190,
        },
        description: "NASA's farthest spacecraft, launched in 1977 and now moving through interstellar space beyond the heliosphere."
    },
    {
        name: "Voyager 2",
        radius: 0.0018,
        displayRadius: 5000,
        distance: ASTRONOMICAL_UNIT * 139,
        poleDirection: { longitude: 0, latitude: 90 },
        orbitalInclination: -31,
        longitudeOfAscendingNode: 289,
        color: "#FFE3A1",
        emissive: "#FFF7DD",
        emissiveIntensity: 0.8,
        escapeTrajectory: {
            startDate: "1977-08-20T14:29:00Z",
            startDistanceAu: 1,
            speedAuPerYear: 2.84,
            maxDistanceAu: 160,
        },
        description: "The only probe to visit Uranus and Neptune, continuing outward on an interstellar mission after its 1977 launch."
    }
]
