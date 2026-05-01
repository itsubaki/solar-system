import { ASTRONOMICAL_UNIT, type PoleDirection } from "./planet-data"

export interface CometOrbitalElements {
    eccentricity: number
    perihelionDistanceAu: number
    argumentOfPerihelion: number
    perihelionDate: string
}

export interface CometData {
    name: string
    radius: number
    displayRadius: number
    distance: number
    poleDirection: PoleDirection
    orbitalInclination: number
    longitudeOfAscendingNode: number
    orbitalPeriod: number
    color: string
    emissive?: string
    emissiveIntensity?: number
    orbitalElements: CometOrbitalElements
    description: string
}

export const COMETS: CometData[] = [
    {
        name: "Halley's Comet",
        radius: 5.5,
        displayRadius: 4500,
        distance: ASTRONOMICAL_UNIT * 17.8,
        poleDirection: { longitude: 0, latitude: 90 },
        orbitalInclination: 162.26,
        longitudeOfAscendingNode: 58.42,
        orbitalPeriod: 75.32 * 365.25,
        color: "#AEE7E8",
        emissive: "#E6FBFF",
        emissiveIntensity: 0.35,
        orbitalElements: {
            eccentricity: 0.96714,
            perihelionDistanceAu: 0.586,
            argumentOfPerihelion: 111.33,
            perihelionDate: "1986-02-09T00:00:00Z",
        },
        description: "A short-period comet visible from Earth roughly every 75 years, famous for its bright tail and retrograde orbit."
    }
]
