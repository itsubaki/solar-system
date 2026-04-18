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
    radius: 0.0465,
    color: "#FDB813",
    emissive: "#FDB813",
    emissiveIntensity: 5,
    description: "The Sun is a G-type main-sequence star at the center of our Solar System."
}

export const PLANETS: PlanetData[] = [
    {
        name: "Mercury",
        radius: (2439.7 / 71492) * 3,
        distance: 3.871,
        orbitalPeriod: 88,
        rotationPeriod: 58.6,
        color: "#B5A7A7",
        description: "The smallest planet and closest to the Sun."
    },
    {
        name: "Venus",
        radius: (6051.8 / 71492) * 3,
        distance: 7.233,
        orbitalPeriod: 225,
        rotationPeriod: 243,
        color: "#E6C87A",
        description: "Similar in size to Earth, with a thick toxic atmosphere."
    },
    {
        name: "Earth",
        radius: (6371 / 71492) * 3,
        distance: 10.0,
        orbitalPeriod: 365,
        rotationPeriod: 1,
        color: "#6B93D6",
        satellites: [
            {
                name: "Moon",
                radius: (1737.4 / 71492) * 3,
                distance: (6371 / 71492) * 3 + 0.8,
                orbitalPeriod: 27,
                color: "#C4C4C4"
            }
        ],
        description: "Our home planet, the only known planet with life."
    },
    {
        name: "Mars",
        radius: (3389.5 / 71492) * 3,
        distance: 15.237,
        orbitalPeriod: 687,
        rotationPeriod: 1.03,
        color: "#C1440E",
        satellites: [
            {
                name: "Phobos",
                radius: (11.267 / 71492) * 3,
                distance: (3389.5 / 71492) * 3 + 0.5,
                orbitalPeriod: 0.3,
                color: "#8B7355"
            },
            {
                name: "Deimos",
                radius: (6.2 / 71492) * 3,
                distance: (3389.5 / 71492) * 3 + 0.7,
                orbitalPeriod: 1.3,
                color: "#8B7355"
            }
        ],
        description: "The Red Planet, with the largest volcano in the Solar System."
    },
    {
        name: "Jupiter",
        radius: 1.0 * 3,
        distance: 52.026,
        orbitalPeriod: 4333,
        rotationPeriod: 0.41,
        color: "#D8CA9D",
        satellites: [
            {
                name: "Io",
                radius: (1821.6 / 71492) * 3,
                distance: 1.0 * 3 + 1.5,
                orbitalPeriod: 1.8,
                color: "#E6C87A"
            },
            {
                name: "Europa",
                radius: (1560.8 / 71492) * 3,
                distance: 1.0 * 3 + 1.8,
                orbitalPeriod: 3.5,
                color: "#C4B896"
            },
            {
                name: "Ganymede",
                radius: (2634.1 / 71492) * 3,
                distance: 1.0 * 3 + 2.2,
                orbitalPeriod: 7.2,
                color: "#8B7355"
            },
            {
                name: "Callisto",
                radius: (2410.3 / 71492) * 3,
                distance: 1.0 * 3 + 2.6,
                orbitalPeriod: 16.7,
                color: "#5C4033"
            }
        ],
        description: "The largest planet, a gas giant with a Great Red Spot storm."
    },
    {
        name: "Saturn",
        radius: (60268 / 71492) * 3,
        distance: 95.549,
        orbitalPeriod: 10759,
        rotationPeriod: 0.45,
        color: "#F4D59E",
        rings: [
            {
                innerRadius: (60268 / 71492) * (66900 / 58232) * 3,
                outerRadius: (60268 / 71492) * (74510 / 58232) * 3,
                color: "#E0D7C6"
            },
            {
                innerRadius: (60268 / 71492) * (74658 / 58232) * 3,
                outerRadius: (60268 / 71492) * (92000 / 58232) * 3,
                color: "#E5D7B9"
            },
            {
                innerRadius: (60268 / 71492) * (92000 / 58232) * 3,
                outerRadius: (60268 / 71492) * (117580 / 58232) * 3,
                color: "#F4D59E"
            },
            {
                innerRadius: (60268 / 71492) * (122170 / 58232) * 3,
                outerRadius: (60268 / 71492) * (136775 / 58232) * 3,
                color: "#F4D59E"
            },
            {
                innerRadius: (60268 / 71492) * (140180 / 58232) * 3,
                outerRadius: (60268 / 71492) * (140680 / 58232) * 3,
                color: "#E3E3F7"
            },
        ],
        satellites: [
            {
                name: "Titan",
                radius: (2574.7 / 71492) * 3,
                distance: (60268 / 71492) * 3 + 5,
                orbitalPeriod: 16,
                color: "#E6A243"
            }
        ],
        description: "Known for its stunning ring system made of ice and rock."
    },
    {
        name: "Uranus",
        radius: (25362 / 71492) * 3,
        distance: 192.184,
        orbitalPeriod: 30687,
        rotationPeriod: 0.72,
        color: "#B5E3E3",
        rings: [
            {
                innerRadius: (25362 / 71492) * (51149 / 25362) * 3,
                outerRadius: (25362 / 71492) * (51710 / 25362) * 3,
                color: "#B5E3E3"
            },
            {
                innerRadius: (25362 / 71492) * (47176 / 25362) * 3,
                outerRadius: (25362 / 71492) * (47462 / 25362) * 3,
                color: "#A0C8C8"
            },
            {
                innerRadius: (25362 / 71492) * (45619 / 25362) * 3,
                outerRadius: (25362 / 71492) * (45929 / 25362) * 3,
                color: "#7FC7C7"
            },
            {
                innerRadius: (25362 / 71492) * (44718 / 25362) * 3,
                outerRadius: (25362 / 71492) * (44918 / 25362) * 3,
                color: "#E3D7F7"
            },
            {
                innerRadius: (25362 / 71492) * (41837 / 25362) * 3,
                outerRadius: (25362 / 71492) * (42067 / 25362) * 3,
                color: "#D7F7E3"
            },
            {
                innerRadius: (25362 / 71492) * (41837 / 25362) * 3,
                outerRadius: (25362 / 71492) * (41939 / 25362) * 3,
                color: "#F7E3D7"
            },
            {
                innerRadius: (25362 / 71492) * (41939 / 25362) * 3,
                outerRadius: (25362 / 71492) * (42067 / 25362) * 3,
                color: "#E3F7D7"
            },
            {
                innerRadius: (25362 / 71492) * (42067 / 25362) * 3,
                outerRadius: (25362 / 71492) * (42190 / 25362) * 3,
                color: "#D7E3F7"
            }
        ],
        description: "An ice giant that rotates on its side."
    },
    {
        name: "Neptune",
        radius: (24622 / 71492) * 3,
        distance: 301.104,
        orbitalPeriod: 60190,
        rotationPeriod: 0.67,
        color: "#5B5DDF",
        satellites: [
            {
                name: "Triton",
                radius: (1353.4 / 71492) * 3,
                distance: (24622 / 71492) * 3 + 1.2,
                orbitalPeriod: 5.9,
                color: "#C4C4C4"
            }
        ],
        description: "The windiest planet with supersonic storms."
    }
]
