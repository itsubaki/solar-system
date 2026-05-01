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
        name: "1P/Halley",
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
    },
    {
        name: "2P/Encke",
        radius: 2.4,
        displayRadius: 3200,
        distance: ASTRONOMICAL_UNIT * 2.22,
        poleDirection: { longitude: 0, latitude: 90 },
        orbitalInclination: 11.78,
        longitudeOfAscendingNode: 334.57,
        orbitalPeriod: 3.30 * 365.25,
        color: "#F6E6AF",
        emissive: "#FFF7D9",
        emissiveIntensity: 0.28,
        orbitalElements: {
            eccentricity: 0.8483,
            perihelionDistanceAu: 0.336,
            argumentOfPerihelion: 186.55,
            perihelionDate: "2023-10-22T00:00:00Z",
        },
        description: "2P/Encke is a short-period comet with one of the smallest known orbital periods, returning to the inner solar system about every 3.3 years."
    }
]
