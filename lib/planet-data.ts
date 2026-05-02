export interface PoleDirection {
    longitude: number
    latitude: number
}

export interface PlanetData {
    name: string
    radius: number
    distance: number
    eccentricity: number
    longitudeOfPerihelion: number
    meanLongitudeAtJ2000: number
    poleDirection: PoleDirection
    orbitalInclination: number
    longitudeOfAscendingNode: number
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
    eccentricity: number
    longitudeOfPeriapsis: number
    meanLongitudeAtJ2000: number
}

export interface RingData {
    innerRadius: number
    outerRadius: number
    color: string
    outerColor?: string
    innerAlpha?: number
    outerAlpha?: number
}

export const ASTRONOMICAL_UNIT = 149_600_000 // km

export function getPlanetObliquity(planet: PlanetData) {
    const poleLongitude = (planet.poleDirection.longitude * Math.PI) / 180
    const poleLatitude = (planet.poleDirection.latitude * Math.PI) / 180
    const orbitalInclination = (planet.orbitalInclination * Math.PI) / 180
    const ascendingNodeLongitude = (planet.longitudeOfAscendingNode * Math.PI) / 180

    const cosPoleLatitude = Math.cos(poleLatitude)
    const poleX = cosPoleLatitude * Math.cos(poleLongitude)
    const poleY = Math.sin(poleLatitude)
    const poleZ = -cosPoleLatitude * Math.sin(poleLongitude)

    const orbitNormalX = -Math.sin(ascendingNodeLongitude) * Math.sin(orbitalInclination)
    const orbitNormalY = Math.cos(orbitalInclination)
    const orbitNormalZ = -Math.cos(ascendingNodeLongitude) * Math.sin(orbitalInclination)

    const dot = poleX * orbitNormalX + poleY * orbitNormalY + poleZ * orbitNormalZ
    const clampedDot = Math.max(-1, Math.min(1, dot))
    const angle = Math.acos(clampedDot)

    return (Math.min(angle, Math.PI - angle) * 180) / Math.PI
}

export const SUN_DATA = {
    name: "Sun",
    radius: 696_000,
    color: "#FDB813",
    emissive: "#FDB813",
    emissiveIntensity: 2,
    description: "The Sun is a G-type main-sequence star at the center of our Solar System."
}

export const DWARF_PLANETS: PlanetData[] = [
    {
        name: "Ceres",
        radius: 939.4 / 2,
        distance: ASTRONOMICAL_UNIT * 2.765615651508659,
        eccentricity: 0.07957631994408416,
        longitudeOfPerihelion: 153.54938555433483,
        meanLongitudeAtJ2000: 385.0891185587054,
        poleDirection: { longitude: 291.421, latitude: 66.758 },
        orbitalInclination: 10.58788658206854,
        longitudeOfAscendingNode: 80.24963090816965,
        orbitalPeriod: 1679.910572771899,
        rotationPeriod: 9.07417 / 24,
        color: "#9A9A96",
        description: "The largest object in the asteroid belt and the only dwarf planet in the inner solar system."
    },
    {
        name: "Pluto",
        radius: 1188.3,
        distance: ASTRONOMICAL_UNIT * 39.48,
        eccentricity: 0.24880766,
        longitudeOfPerihelion: 224.06676,
        meanLongitudeAtJ2000: 238.92881,
        poleDirection: { longitude: 137.351, latitude: -22.816 },
        orbitalInclination: 17.16,
        longitudeOfAscendingNode: 110.299,
        orbitalPeriod: 90560,
        rotationPeriod: 6.39,
        color: "#B89C7A",
        description: "A dwarf planet in the Kuiper Belt with a strongly inclined, eccentric orbit."
    },
    {
        name: "Haumea",
        radius: 1740 / 2,
        distance: ASTRONOMICAL_UNIT * 43.00549889718357,
        eccentricity: 0.1957748236999078,
        longitudeOfPerihelion: 362.685623066236,
        meanLongitudeAtJ2000: 585.0132756143271,
        poleDirection: { longitude: 0, latitude: 90 },
        orbitalInclination: 28.20840581678499,
        longitudeOfAscendingNode: 121.7972905747552,
        orbitalPeriod: 103011.1918775399,
        rotationPeriod: 3.9154 / 24,
        color: "#E6E6E6",
        description: "An elongated dwarf planet in the Kuiper Belt that spins so quickly its shape is stretched like a football."
    },
    {
        name: "Makemake",
        radius: 715,
        distance: ASTRONOMICAL_UNIT * 45.51068193198885,
        eccentricity: 0.1604249925523523,
        longitudeOfPerihelion: 376.3443476128863,
        meanLongitudeAtJ2000: 545.664625586251,
        poleDirection: { longitude: 0, latitude: 90 },
        orbitalInclination: 29.03230611452533,
        longitudeOfAscendingNode: 79.26892142638791,
        orbitalPeriod: 112142.0372181563,
        rotationPeriod: 22.8266 / 24,
        color: "#C96F4A",
        description: "A reddish dwarf planet in the Kuiper Belt and one of the brightest known objects beyond Neptune."
    },
    {
        name: "Eris",
        radius: 1200,
        distance: ASTRONOMICAL_UNIT * 67.99638658496472,
        eccentricity: 0.4369649682100509,
        longitudeOfPerihelion: 186.7594587351884,
        meanLongitudeAtJ2000: 397.2088478471641,
        poleDirection: { longitude: 0, latitude: 90 },
        orbitalInclination: 43.86893125983033,
        longitudeOfAscendingNode: 36.02717321924018,
        orbitalPeriod: 204798.6919173598,
        rotationPeriod: 25.9 / 24,
        color: "#E7EDF3",
        description: "A distant dwarf planet in the scattered disk, with a highly inclined and strongly eccentric orbit beyond Pluto."
    }
]

export const PLANETS: PlanetData[] = [
    {
        name: "Mercury",
        radius: 2439.7,
        distance: ASTRONOMICAL_UNIT * 0.39,
        eccentricity: 0.20563069,
        longitudeOfPerihelion: 77.45645,
        meanLongitudeAtJ2000: 252.25084,
        poleDirection: { longitude: 318.41, latitude: 82.99 },
        orbitalInclination: 7.005,
        longitudeOfAscendingNode: 48.331,
        orbitalPeriod: 88,
        rotationPeriod: 58.6,
        color: "#B5A7A7",
        description: "The smallest planet and closest to the Sun."
    },
    {
        name: "Venus",
        radius: 6051.8,
        distance: ASTRONOMICAL_UNIT * 0.72,
        eccentricity: 0.00677323,
        longitudeOfPerihelion: 131.53298,
        meanLongitudeAtJ2000: 181.97973,
        poleDirection: { longitude: 30.187, latitude: 88.761 },
        orbitalInclination: 3.395,
        longitudeOfAscendingNode: 76.68,
        orbitalPeriod: 225,
        rotationPeriod: -243,
        color: "#E6C87A",
        description: "Similar in size to Earth, with a thick toxic atmosphere."
    },
    {
        name: "Earth",
        radius: 6371,
        distance: ASTRONOMICAL_UNIT * 1.00,
        eccentricity: 0.01671022,
        longitudeOfPerihelion: 102.94719,
        meanLongitudeAtJ2000: 100.46435,
        poleDirection: { longitude: 90, latitude: 66.561 },
        orbitalInclination: 0,
        longitudeOfAscendingNode: 0,
        orbitalPeriod: 365,
        rotationPeriod: 1,
        color: "#6B93D6",
        satellites: [
            {
                name: "Moon",
                radius: 1737.4,
                distance: 384_399,
                orbitalPeriod: 27,
                color: "#C4C4C4",
                eccentricity: 0.0549,
                longitudeOfPeriapsis: 318.15,
                meanLongitudeAtJ2000: 115.3654
            }
        ],
        description: "Our home planet, the only known planet with life."
    },
    {
        name: "Mars",
        radius: 3389.5,
        distance: ASTRONOMICAL_UNIT * 1.52,
        eccentricity: 0.09341233,
        longitudeOfPerihelion: -23.94363,
        meanLongitudeAtJ2000: -4.55343,
        poleDirection: { longitude: 352.908, latitude: 63.282 },
        orbitalInclination: 1.85,
        longitudeOfAscendingNode: 49.558,
        orbitalPeriod: 687,
        rotationPeriod: 1.03,
        color: "#C1440E",
        satellites: [
            {
                name: "Phobos",
                radius: 11.267,
                distance: 9_376,
                orbitalPeriod: 0.3,
                color: "#8B7355",
                eccentricity: 0.0151,
                longitudeOfPeriapsis: 150.057,
                meanLongitudeAtJ2000: 177.617
            },
            {
                name: "Deimos",
                radius: 6.2,
                distance: 23_463.2,
                orbitalPeriod: 1.3,
                color: "#8B7355",
                eccentricity: 0.0002,
                longitudeOfPeriapsis: 260.729,
                meanLongitudeAtJ2000: 53.316
            }
        ],
        description: "The Red Planet, with the largest volcano in the Solar System."
    },
    {
        name: "Jupiter",
        radius: 69911,
        distance: ASTRONOMICAL_UNIT * 5.20,
        eccentricity: 0.04839266,
        longitudeOfPerihelion: 14.72848,
        meanLongitudeAtJ2000: 34.39644,
        poleDirection: { longitude: 247.818, latitude: 87.783 },
        orbitalInclination: 1.303,
        longitudeOfAscendingNode: 100.464,
        orbitalPeriod: 4333,
        rotationPeriod: 0.41,
        color: "#D8CA9D",
        satellites: [
            {
                name: "Io",
                radius: 1821.6,
                distance: 421_700,
                orbitalPeriod: 1.8,
                color: "#E6C87A",
                eccentricity: 0.0041,
                longitudeOfPeriapsis: 84.129,
                meanLongitudeAtJ2000: 171.0169
            },
            {
                name: "Europa",
                radius: 1560.8,
                distance: 671_100,
                orbitalPeriod: 3.5,
                color: "#C4B896",
                eccentricity: 0.0094,
                longitudeOfPeriapsis: 88.97,
                meanLongitudeAtJ2000: 41.923
            },
            {
                name: "Ganymede",
                radius: 2634.1,
                distance: 1_070_400,
                orbitalPeriod: 7.2,
                color: "#8B7355",
                eccentricity: 0.0013,
                longitudeOfPeriapsis: 192.417,
                meanLongitudeAtJ2000: 63.552
            },
            {
                name: "Callisto",
                radius: 2410.3,
                distance: 1_882_700,
                orbitalPeriod: 16.7,
                color: "#5C4033",
                eccentricity: 0.0074,
                longitudeOfPeriapsis: 52.643,
                meanLongitudeAtJ2000: 24.833
            }
        ],
        description: "The largest planet, a gas giant with a Great Red Spot storm."
    },
    {
        name: "Saturn",
        radius: 58232,
        distance: ASTRONOMICAL_UNIT * 9.58,
        eccentricity: 0.0541506,
        longitudeOfPerihelion: 92.59888,
        meanLongitudeAtJ2000: 49.95424,
        poleDirection: { longitude: 79.528, latitude: 61.948 },
        orbitalInclination: 2.485,
        longitudeOfAscendingNode: 113.665,
        orbitalPeriod: 10759,
        rotationPeriod: 0.45,
        color: "#F4D59E",
        rings: [
            {
                innerRadius: 66900,
                outerRadius: 74510,
                color: "#E0D7C6"
            },
            {
                innerRadius: 74658,
                outerRadius: 92000,
                color: "#E5D7B9"
            },
            {
                innerRadius: 92000,
                outerRadius: 117580,
                color: "#F4D59E"
            },
            {
                innerRadius: 122170,
                outerRadius: 136775,
                color: "#F4D59E"
            },
            {
                innerRadius: 140180,
                outerRadius: 140680,
                color: "#E3E3F7"
            },
        ],
        satellites: [
            {
                name: "Titan",
                radius: 2574.7,
                distance: 1_221_870,
                orbitalPeriod: 16,
                color: "#E6A243",
                eccentricity: 0.0288,
                longitudeOfPeriapsis: 186.585,
                meanLongitudeAtJ2000: 28.051
            }
        ],
        description: "Known for its stunning ring system made of ice and rock."
    },
    {
        name: "Uranus",
        radius: 25362,
        distance: ASTRONOMICAL_UNIT * 19.20,
        eccentricity: 0.04716771,
        longitudeOfPerihelion: 170.95428,
        meanLongitudeAtJ2000: 313.2381,
        poleDirection: { longitude: 257.647, latitude: 7.722 },
        orbitalInclination: 0.773,
        longitudeOfAscendingNode: 74.006,
        orbitalPeriod: 30687,
        rotationPeriod: 0.72,
        color: "#B5E3E3",
        rings: [
            {
                innerRadius: 37850,
                outerRadius: 41350,
                color: "#5d676d",
                outerColor: "#8b989d",
                innerAlpha: 0.32,
                outerAlpha: 0.06
            },
            {
                innerRadius: 41837.235,
                outerRadius: 41838.765,
                color: "#7c858a",
                outerColor: "#a2adb2",
                innerAlpha: 0.72,
                outerAlpha: 0.18
            },
            {
                innerRadius: 42232.86,
                outerRadius: 42235.14,
                color: "#7e888d",
                outerColor: "#a7b1b5",
                innerAlpha: 0.74,
                outerAlpha: 0.2
            },
            {
                innerRadius: 42569.835,
                outerRadius: 42572.165,
                color: "#7b8489",
                outerColor: "#a1abb0",
                innerAlpha: 0.76,
                outerAlpha: 0.22
            },
            {
                innerRadius: 44713.77,
                outerRadius: 44722.23,
                color: "#8e979b",
                outerColor: "#b9c2c6",
                innerAlpha: 0.8,
                outerAlpha: 0.24
            },
            {
                innerRadius: 45656.255,
                outerRadius: 45665.745,
                color: "#8a9398",
                outerColor: "#b6c0c5",
                innerAlpha: 0.82,
                outerAlpha: 0.26
            },
            {
                innerRadius: 47175.2,
                outerRadius: 47176.8,
                color: "#899398",
                outerColor: "#b9c5c9",
                innerAlpha: 0.78,
                outerAlpha: 0.22
            },
            {
                innerRadius: 47625.925,
                outerRadius: 47628.075,
                color: "#879095",
                outerColor: "#b3bec3",
                innerAlpha: 0.74,
                outerAlpha: 0.18
            },
            {
                innerRadius: 48297.7,
                outerRadius: 48302.3,
                color: "#8f989d",
                outerColor: "#bcc6ca",
                innerAlpha: 0.74,
                outerAlpha: 0.18
            },
            {
                innerRadius: 50022.85,
                outerRadius: 50025.15,
                color: "#93a0a6",
                outerColor: "#c6d2d7",
                innerAlpha: 0.76,
                outerAlpha: 0.2
            },
            {
                innerRadius: 51119.95,
                outerRadius: 51178.05,
                color: "#d4dee1",
                outerColor: "#f1f6f6",
                innerAlpha: 0.88,
                outerAlpha: 0.34
            },
            {
                innerRadius: 65400,
                outerRadius: 69200,
                color: "#9a6f63",
                outerColor: "#caa18d",
                innerAlpha: 0.26,
                outerAlpha: 0.04
            },
            {
                innerRadius: 89200,
                outerRadius: 106200,
                color: "#7aa6bd",
                outerColor: "#c5deea",
                innerAlpha: 0.18,
                outerAlpha: 0.02
            }
        ],
        description: "An ice giant that rotates on its side."
    },
    {
        name: "Neptune",
        radius: 24622,
        distance: ASTRONOMICAL_UNIT * 30.05,
        eccentricity: 0.00858587,
        longitudeOfPerihelion: 44.96476,
        meanLongitudeAtJ2000: -55.12003,
        poleDirection: { longitude: 319.235, latitude: 61.974 },
        orbitalInclination: 1.77,
        longitudeOfAscendingNode: 131.784,
        orbitalPeriod: 60190,
        rotationPeriod: 0.67,
        color: "#5f83b5",
        rings: [
            {
                innerRadius: 41000,
                outerRadius: 43000,
                color: "#50484a",
                outerColor: "#696062",
                innerAlpha: 0.05,
                outerAlpha: 0.008
            },
            {
                innerRadius: 53143.5,
                outerRadius: 53256.5,
                color: "#62595a",
                outerColor: "#84797a",
                innerAlpha: 0.12,
                outerAlpha: 0.03
            },
            {
                innerRadius: 53200,
                outerRadius: 57200,
                color: "#434549",
                outerColor: "#5b5d61",
                innerAlpha: 0.025,
                outerAlpha: 0.004
            },
            {
                innerRadius: 57150,
                outerRadius: 57250,
                color: "#6f6666",
                outerColor: "#928787",
                innerAlpha: 0.08,
                outerAlpha: 0.02
            },
            {
                innerRadius: 62925.5,
                outerRadius: 62940.5,
                color: "#776d6c",
                outerColor: "#9a8e8c",
                innerAlpha: 0.14,
                outerAlpha: 0.05
            }
        ],
        satellites: [
            {
                name: "Triton",
                radius: 1353.4,
                distance: 354_759,
                orbitalPeriod: 5.9,
                color: "#C4C4C4",
                eccentricity: 0.000016,
                longitudeOfPeriapsis: 0,
                meanLongitudeAtJ2000: 0
            }
        ],
        description: "The windiest planet with supersonic storms."
    }
]
