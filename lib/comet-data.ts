import { ASTRONOMICAL_UNIT } from "./orbit"
import type { OrbitPlane, PoleDirection } from "./planet-data"

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
    orbitPlane: OrbitPlane
    orbitalPeriod: number
    color: string
    emissive?: string
    emissiveIntensity?: number
    orbitalElements: CometOrbitalElements
    description: string
}

export const COMETS: CometData[] = [
    {
        name: "Halley",
        radius: 5.5,
        displayRadius: 4500,
        distance: ASTRONOMICAL_UNIT * 17.92863504856923,
        poleDirection: { longitude: 0, latitude: 90 },
        orbitPlane: {
            inclination: 162.1905300439129,
            longitudeOfAscendingNode: 59.09894720612437,
        },
        orbitalPeriod: 27728.04608790421,
        color: "#AEE7E8",
        emissive: "#E6FBFF",
        emissiveIntensity: 0.35,
        orbitalElements: {
            eccentricity: 0.9679359956953211,
            perihelionDistanceAu: 0.5748638313743413,
            argumentOfPerihelion: 112.2414314637764,
            perihelionDate: "1986-02-08T11:22:00.435Z",
        },
        description: "A short-period comet visible from Earth roughly every 75 years, famous for its bright tail and retrograde orbit."
    },
    {
        name: "Encke",
        radius: 2.4,
        displayRadius: 3200,
        distance: ASTRONOMICAL_UNIT * 2.219688710074586,
        poleDirection: { longitude: 0, latitude: 90 },
        orbitPlane: {
            inclination: 11.41227811179314,
            longitudeOfAscendingNode: 334.1935846036774,
        },
        orbitalPeriod: 1207.915450927171,
        color: "#F6E6AF",
        emissive: "#FFF7D9",
        emissiveIntensity: 0.28,
        orbitalElements: {
            eccentricity: 0.8477496967533629,
            perihelionDistanceAu: 0.3379482792219925,
            argumentOfPerihelion: 187.1342463695676,
            perihelionDate: "2023-10-22T03:35:18.402Z",
        },
        description: "2P/Encke is a short-period comet with one of the smallest known orbital periods, returning to the inner solar system about every 3.3 years."
    }
]
