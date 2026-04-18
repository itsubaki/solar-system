export interface PlanetData {
    name: string
    radius: number
    distance: number
    orbitalPeriod: number
    rotationPeriod: number
    color: string
    emissive?: string
    emissiveIntensity?: number
    rings?: RingData[]
    satellites?: SatelliteData[]
    description: string
}

export interface SatelliteData {
    name: string
    radius: number
    distance: number
    orbitalPeriod: number
    color: string
    eccentricity?: number
    longitudeOfPeriapsis?: number
    meanLongitudeAtJ2000?: number
}

export interface RingData {
    innerRadius: number
    outerRadius: number
    color: string
}

export const SUN_DATA = {
    name: "Sun",
    radius: 696_000 / 149_600_000 * 10, // radius / 1AU( = 149,600,000 km) * 10(scaleAU) 
    ratio: 1 / 149_600_000 * 10 * 1000,
    scaleAU: 10,
    color: "#FDB813",
    emissive: "#FDB813",
    emissiveIntensity: 2,
    description: "The Sun is a G-type main-sequence star at the center of our Solar System."
}

export const PLANETS: PlanetData[] = [
    {
        name: "Mercury",
        radius: 2439.7 * SUN_DATA.ratio,
        distance: 0.39 * SUN_DATA.scaleAU,
        orbitalPeriod: 88,
        rotationPeriod: 58.6,
        color: "#B5A7A7",
        description: "The smallest planet and closest to the Sun."
    },
    {
        name: "Venus",
        radius: 6051.8 * SUN_DATA.ratio,
        distance: 0.72 * SUN_DATA.scaleAU,
        orbitalPeriod: 225,
        rotationPeriod: 243,
        color: "#E6C87A",
        description: "Similar in size to Earth, with a thick toxic atmosphere."
    },
    {
        name: "Earth",
        radius: 6371 * SUN_DATA.ratio,
        distance: 1.00 * SUN_DATA.scaleAU,
        orbitalPeriod: 365,
        rotationPeriod: 1,
        color: "#6B93D6",
        satellites: [
            {
                name: "Moon",
                radius: 1737.4 * SUN_DATA.ratio,
                distance: 6371 * SUN_DATA.ratio + 1,
                orbitalPeriod: 27,
                color: "#C4C4C4"
            }
        ],
        description: "Our home planet, the only known planet with life."
    },
    {
        name: "Mars",
        radius: 3389.5 * SUN_DATA.ratio,
        distance: 1.52 * SUN_DATA.scaleAU,
        orbitalPeriod: 687,
        rotationPeriod: 1.03,
        color: "#C1440E",
        satellites: [
            {
                name: "Phobos",
                radius: 11.267 * SUN_DATA.ratio,
                distance: 3389.5 * SUN_DATA.ratio + 0.5,
                orbitalPeriod: 0.3,
                color: "#8B7355"
            },
            {
                name: "Deimos",
                radius: 6.2 * SUN_DATA.ratio,
                distance: 3389.5 * SUN_DATA.ratio + 0.7,
                orbitalPeriod: 1.3,
                color: "#8B7355"
            }
        ],
        description: "The Red Planet, with the largest volcano in the Solar System."
    },
    {
        name: "Jupiter",
        radius: 69911 * SUN_DATA.ratio,
        distance: 5.20 * SUN_DATA.scaleAU,
        orbitalPeriod: 4333,
        rotationPeriod: 0.41,
        color: "#D8CA9D",
        satellites: [
            {
                name: "Io",
                radius: 1821.6 * SUN_DATA.ratio,
                distance: 69911 * SUN_DATA.ratio + 1.5,
                orbitalPeriod: 1.8,
                color: "#E6C87A"
            },
            {
                name: "Europa",
                radius: 1560.8 * SUN_DATA.ratio,
                distance: 69911 * SUN_DATA.ratio + 1.8,
                orbitalPeriod: 3.5,
                color: "#C4B896"
            },
            {
                name: "Ganymede",
                radius: 2634.1 * SUN_DATA.ratio,
                distance: 69911 * SUN_DATA.ratio + 2.2,
                orbitalPeriod: 7.2,
                color: "#8B7355"
            },
            {
                name: "Callisto",
                radius: 2410.3 * SUN_DATA.ratio,
                distance: 69911 * SUN_DATA.ratio + 2.6,
                orbitalPeriod: 16.7,
                color: "#5C4033"
            }
        ],
        description: "The largest planet, a gas giant with a Great Red Spot storm."
    },
    {
        name: "Saturn",
        radius: 58232 * SUN_DATA.ratio,
        distance: 9.58 * SUN_DATA.scaleAU,
        orbitalPeriod: 10759,
        rotationPeriod: 0.45,
        color: "#F4D59E",
        rings: [
            {
                innerRadius: SUN_DATA.ratio * 66900,
                outerRadius: SUN_DATA.ratio * 74510,
                color: "#E0D7C6"
            },
            {
                innerRadius: SUN_DATA.ratio * 74658,
                outerRadius: SUN_DATA.ratio * 92000,
                color: "#E5D7B9"
            },
            {
                innerRadius: SUN_DATA.ratio * 92000,
                outerRadius: SUN_DATA.ratio * 117580,
                color: "#F4D59E"
            },
            {
                innerRadius: SUN_DATA.ratio * 122170,
                outerRadius: SUN_DATA.ratio * 136775,
                color: "#F4D59E"
            },
            {
                innerRadius: SUN_DATA.ratio * 140180,
                outerRadius: SUN_DATA.ratio * 140680,
                color: "#E3E3F7"
            },
        ],
        satellites: [
            {
                name: "Titan",
                radius: 2574.7 * SUN_DATA.ratio,
                distance: 58232 * SUN_DATA.ratio * 5,
                orbitalPeriod: 16,
                color: "#E6A243"
            }
        ],
        description: "Known for its stunning ring system made of ice and rock."
    },
    {
        name: "Uranus",
        radius: 25362 * SUN_DATA.ratio,
        distance: 19.20 * SUN_DATA.scaleAU,
        orbitalPeriod: 30687,
        rotationPeriod: 0.72,
        color: "#B5E3E3",
        rings: [
            {
                innerRadius: SUN_DATA.ratio * 51149,
                outerRadius: SUN_DATA.ratio * 51710,
                color: "#B5E3E3"
            },
            {
                innerRadius: SUN_DATA.ratio * 47176,
                outerRadius: SUN_DATA.ratio * 47462,
                color: "#A0C8C8"
            },
            {
                innerRadius: SUN_DATA.ratio * 45619,
                outerRadius: SUN_DATA.ratio * 45929,
                color: "#7FC7C7"
            },
            {
                innerRadius: SUN_DATA.ratio * 44718,
                outerRadius: SUN_DATA.ratio * 44918,
                color: "#E3D7F7"
            },
            {
                innerRadius: SUN_DATA.ratio * 41837,
                outerRadius: SUN_DATA.ratio * 42067,
                color: "#D7F7E3"
            },
            {
                innerRadius: SUN_DATA.ratio * 41837,
                outerRadius: SUN_DATA.ratio * 41939,
                color: "#F7E3D7"
            },
            {
                innerRadius: SUN_DATA.ratio * 41939,
                outerRadius: SUN_DATA.ratio * 42067,
                color: "#E3F7D7"
            },
            {
                innerRadius: SUN_DATA.ratio * 42067,
                outerRadius: SUN_DATA.ratio * 42190,
                color: "#D7E3F7"
            }
        ],
        description: "An ice giant that rotates on its side."
    },
    {
        name: "Neptune",
        radius: 24622 * SUN_DATA.ratio,
        distance: 30.05 * SUN_DATA.scaleAU,
        orbitalPeriod: 60190,
        rotationPeriod: 0.67,
        color: "#5B5DDF",
        satellites: [
            {
                name: "Triton",
                radius: 1353.4 * SUN_DATA.ratio,
                distance: 24622 * SUN_DATA.ratio + 1.2,
                orbitalPeriod: 5.9,
                color: "#C4C4C4"
            }
        ],
        description: "The windiest planet with supersonic storms."
    }
]
