import { ASTRONOMICAL_UNIT } from "./orbit"

export interface PoleDirection {
    longitude: number
    latitude: number
}

export interface OrbitPhase {
    eccentricity: number
    /** Reference-plane longitude of periapsis (varpi). */
    longitudeOfPeriapsis: number
    /** Reference-plane mean longitude at J2000. */
    meanLongitudeAtJ2000: number
}

export interface OrbitPlane {
    inclination: number
    longitudeOfAscendingNode: number
    referenceFrame?: "scene" | "parentEquator" | "laplace"
    referencePoleDirection?: PoleDirection
}

export interface PlanetOrbitRates {
    semiMajorAxisAuPerCentury: number
    eccentricityPerCentury: number
    inclinationPerCentury: number
    meanLongitudePerCentury: number
    longitudeOfPeriapsisPerCentury: number
    longitudeOfAscendingNodePerCentury: number
}

export interface PlanetData {
    name: string
    radius: number
    distance: number
    orbitalPeriod: number
    rotationPeriod: number
    poleDirection: PoleDirection
    orbitPlane: OrbitPlane
    orbitPhase: OrbitPhase
    orbitRates?: PlanetOrbitRates
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
    poleDirection: PoleDirection
    orbitPlane: OrbitPlane
    color: string
    orbitPhase: OrbitPhase
}

export interface RingData {
    innerRadius: number
    outerRadius: number
    color: string
    outerColor?: string
    innerAlpha?: number
    outerAlpha?: number
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
        orbitPhase: {
            eccentricity: 0.07957631994408416,
            longitudeOfPeriapsis: 153.54938555433483,
            meanLongitudeAtJ2000: 385.0891185587054,
        },
        poleDirection: { longitude: 291.421, latitude: 66.758 },
        orbitPlane: {
            inclination: 10.58788658206854,
            longitudeOfAscendingNode: 80.24963090816965,
        },
        orbitalPeriod: 1679.910572771899,
        rotationPeriod: 9.07417 / 24,
        color: "#9A9A96",
        description: "The largest object in the asteroid belt and the only dwarf planet in the inner solar system."
    },
    {
        name: "Pluto",
        radius: 1188.3,
        distance: ASTRONOMICAL_UNIT * 39.48,
        orbitPhase: {
            eccentricity: 0.24880766,
            longitudeOfPeriapsis: 224.06676,
            meanLongitudeAtJ2000: 238.92881,
        },
        poleDirection: { longitude: 137.351, latitude: -22.816 },
        orbitPlane: {
            inclination: 17.16,
            longitudeOfAscendingNode: 110.299,
        },
        orbitalPeriod: 90560,
        rotationPeriod: 6.39,
        color: "#B89C7A",
        description: "A dwarf planet in the Kuiper Belt with a strongly inclined, eccentric orbit."
    },
    {
        name: "Haumea",
        radius: 1740 / 2,
        distance: ASTRONOMICAL_UNIT * 43.00549889718357,
        orbitPhase: {
            eccentricity: 0.1957748236999078,
            longitudeOfPeriapsis: 362.685623066236,
            meanLongitudeAtJ2000: 585.0132756143271,
        },
        poleDirection: { longitude: 0, latitude: 90 },
        orbitPlane: {
            inclination: 28.20840581678499,
            longitudeOfAscendingNode: 121.7972905747552,
        },
        orbitalPeriod: 103011.1918775399,
        rotationPeriod: 3.9154 / 24,
        color: "#E6E6E6",
        description: "An elongated dwarf planet in the Kuiper Belt that spins so quickly its shape is stretched like a football."
    },
    {
        name: "Makemake",
        radius: 715,
        distance: ASTRONOMICAL_UNIT * 45.51068193198885,
        orbitPhase: {
            eccentricity: 0.1604249925523523,
            longitudeOfPeriapsis: 376.3443476128863,
            meanLongitudeAtJ2000: 545.664625586251,
        },
        poleDirection: { longitude: 0, latitude: 90 },
        orbitPlane: {
            inclination: 29.03230611452533,
            longitudeOfAscendingNode: 79.26892142638791,
        },
        orbitalPeriod: 112142.0372181563,
        rotationPeriod: 22.8266 / 24,
        color: "#C96F4A",
        description: "A reddish dwarf planet in the Kuiper Belt and one of the brightest known objects beyond Neptune."
    },
    {
        name: "Eris",
        radius: 1200,
        distance: ASTRONOMICAL_UNIT * 67.99638658496472,
        orbitPhase: {
            eccentricity: 0.4369649682100509,
            longitudeOfPeriapsis: 186.7594587351884,
            meanLongitudeAtJ2000: 397.2088478471641,
        },
        poleDirection: { longitude: 0, latitude: 90 },
        orbitPlane: {
            inclination: 43.86893125983033,
            longitudeOfAscendingNode: 36.02717321924018,
        },
        orbitalPeriod: 204798.6919173598,
        rotationPeriod: 25.9 / 24,
        color: "#E7EDF3",
        description: "A distant dwarf planet in the scattered disk, with a highly inclined and strongly eccentric orbit beyond Pluto."
    },
    {
        name: "Sedna",
        radius: 497.5,
        distance: ASTRONOMICAL_UNIT * 518.57,
        orbitPhase: {
            eccentricity: 0.85491,
            longitudeOfPeriapsis: 455.6,
            meanLongitudeAtJ2000: 813.2,
        },
        poleDirection: { longitude: 0, latitude: 90 },
        orbitPlane: {
            inclination: 11.93,
            longitudeOfAscendingNode: 144.25,
        },
        orbitalPeriod: 4160647.5,
        rotationPeriod: 10.27 / 24,
        color: "#A64E3C",
        description: "A very distant likely dwarf planet beyond the Kuiper Belt, traveling on an extremely elongated orbit through the scattered outer solar system."
    },
    {
        name: "Quaoar",
        radius: 555,
        distance: ASTRONOMICAL_UNIT * 43.49,
        orbitPhase: {
            eccentricity: 0.0396,
            longitudeOfPeriapsis: 188.9,
            meanLongitudeAtJ2000: 255.3,
        },
        poleDirection: { longitude: 0, latitude: 90 },
        orbitPlane: {
            inclination: 7.99,
            longitudeOfAscendingNode: 188.9,
        },
        orbitalPeriod: 104687.7,
        rotationPeriod: 17.68 / 24,
        color: "#9C5F53",
        description: "A large trans-Neptunian object in the classical Kuiper Belt, often considered a likely dwarf planet with a relatively low-inclination orbit."
    },
    {
        name: "Orcus",
        radius: 455,
        distance: ASTRONOMICAL_UNIT * 39.17,
        orbitPhase: {
            eccentricity: 0.227,
            longitudeOfPeriapsis: 72.2,
            meanLongitudeAtJ2000: 238.1,
        },
        poleDirection: { longitude: 0, latitude: 90 },
        orbitPlane: {
            inclination: 20.57,
            longitudeOfAscendingNode: 268.7,
        },
        orbitalPeriod: 89556.2,
        rotationPeriod: 10.47 / 24,
        color: "#8EA3B0",
        description: "A resonant trans-Neptunian object beyond Neptune, regarded as a likely dwarf planet and often compared with Pluto because of its similar orbital period."
    },
    {
        name: "Gonggong",
        radius: 615,
        distance: ASTRONOMICAL_UNIT * 67.38,
        orbitPhase: {
            eccentricity: 0.5004,
            longitudeOfPeriapsis: 207.7,
            meanLongitudeAtJ2000: 279.7,
        },
        poleDirection: { longitude: 0, latitude: 90 },
        orbitPlane: {
            inclination: 30.63,
            longitudeOfAscendingNode: 336.8,
        },
        orbitalPeriod: 202157.1,
        rotationPeriod: 22.4 / 24,
        color: "#A6464B",
        description: "A reddish distant trans-Neptunian object in the scattered disk, considered a likely dwarf planet on a steeply inclined and eccentric orbit."
    }
]

export const PLANETS: PlanetData[] = [
    {
        name: "Mercury",
        radius: 2439.7,
        distance: ASTRONOMICAL_UNIT * 0.38709927,
        orbitPhase: {
            eccentricity: 0.20563593,
            longitudeOfPeriapsis: 77.45779628,
            meanLongitudeAtJ2000: 252.2503235,
        },
        poleDirection: { longitude: 318.41, latitude: 82.99 },
        orbitPlane: {
            inclination: 7.00497902,
            longitudeOfAscendingNode: 48.33076593,
        },
        orbitRates: {
            semiMajorAxisAuPerCentury: 0.00000037,
            eccentricityPerCentury: 0.00001906,
            inclinationPerCentury: -0.00594749,
            meanLongitudePerCentury: 149472.67411175,
            longitudeOfPeriapsisPerCentury: 0.16047689,
            longitudeOfAscendingNodePerCentury: -0.12534081,
        },
        orbitalPeriod: 87.969256442,
        rotationPeriod: 58.6,
        color: "#B5A7A7",
        description: "The smallest planet and closest to the Sun."
    },
    {
        name: "Venus",
        radius: 6051.8,
        distance: ASTRONOMICAL_UNIT * 0.72333566,
        orbitPhase: {
            eccentricity: 0.00677672,
            longitudeOfPeriapsis: 131.60246718,
            meanLongitudeAtJ2000: 181.9790995,
        },
        poleDirection: { longitude: 30.187, latitude: 88.761 },
        orbitPlane: {
            inclination: 3.39467605,
            longitudeOfAscendingNode: 76.67984255,
        },
        orbitRates: {
            semiMajorAxisAuPerCentury: 0.0000039,
            eccentricityPerCentury: -0.00004107,
            inclinationPerCentury: -0.0007889,
            meanLongitudePerCentury: 58517.81538729,
            longitudeOfPeriapsisPerCentury: 0.00268329,
            longitudeOfAscendingNodePerCentury: -0.27769418,
        },
        orbitalPeriod: 224.700801166,
        rotationPeriod: -243,
        color: "#E6C87A",
        description: "Similar in size to Earth, with a thick toxic atmosphere."
    },
    {
        name: "Earth",
        radius: 6371,
        distance: ASTRONOMICAL_UNIT * 1.00000261,
        orbitPhase: {
            eccentricity: 0.01671123,
            longitudeOfPeriapsis: 102.93768193,
            meanLongitudeAtJ2000: 100.46457166,
        },
        poleDirection: { longitude: 90, latitude: 66.561 },
        orbitPlane: {
            inclination: -0.00001531,
            longitudeOfAscendingNode: 0,
        },
        orbitRates: {
            semiMajorAxisAuPerCentury: 0.00000562,
            eccentricityPerCentury: -0.00004392,
            inclinationPerCentury: -0.01294668,
            meanLongitudePerCentury: 35999.37244981,
            longitudeOfPeriapsisPerCentury: 0.32327364,
            longitudeOfAscendingNodePerCentury: 0,
        },
        orbitalPeriod: 365.256367131,
        rotationPeriod: 1,
        color: "#6B93D6",
        satellites: [
            {
                name: "Moon",
                radius: 1737.4,
                distance: 384_400,
                orbitalPeriod: 27.322,
                poleDirection: { longitude: 214.453, latitude: 88.43 },
                orbitPlane: {
                    inclination: 5.16,
                    longitudeOfAscendingNode: 125.08,
                    referenceFrame: "scene",
                },
                color: "#C4C4C4",
                orbitPhase: {
                    eccentricity: 0.0554,
                    longitudeOfPeriapsis: 443.23,
                    meanLongitudeAtJ2000: 578.5,
                }
            }
        ],
        description: "Our home planet, the only known planet with life."
    },
    {
        name: "Mars",
        radius: 3389.5,
        distance: ASTRONOMICAL_UNIT * 1.52371034,
        orbitPhase: {
            eccentricity: 0.0933941,
            longitudeOfPeriapsis: -23.94362959,
            meanLongitudeAtJ2000: -4.55343205,
        },
        poleDirection: { longitude: 352.908, latitude: 63.282 },
        orbitPlane: {
            inclination: 1.84969142,
            longitudeOfAscendingNode: 49.55953891,
        },
        orbitRates: {
            semiMajorAxisAuPerCentury: 0.00001847,
            eccentricityPerCentury: 0.00007882,
            inclinationPerCentury: -0.00813131,
            meanLongitudePerCentury: 19140.30268499,
            longitudeOfPeriapsisPerCentury: 0.44441088,
            longitudeOfAscendingNodePerCentury: -0.29257343,
        },
        orbitalPeriod: 686.979731533,
        rotationPeriod: 1.03,
        color: "#C1440E",
        satellites: [
            {
                name: "Phobos",
                radius: 11.267,
                distance: 9_375,
                orbitalPeriod: 0.3187,
                poleDirection: { longitude: 352.908, latitude: 63.282 },
                orbitPlane: {
                    inclination: 1.1,
                    longitudeOfAscendingNode: 169.2,
                    referenceFrame: "laplace",
                    referencePoleDirection: { longitude: 352.946, latitude: 63.285 },
                },
                color: "#8B7355",
                orbitPhase: {
                    eccentricity: 0.015,
                    longitudeOfPeriapsis: 385.5,
                    meanLongitudeAtJ2000: 575.2,
                }
            },
            {
                name: "Deimos",
                radius: 6.2,
                distance: 23_457,
                orbitalPeriod: 1.2625,
                poleDirection: { longitude: 352.908, latitude: 63.282 },
                orbitPlane: {
                    inclination: 1.8,
                    longitudeOfAscendingNode: 54.3,
                    referenceFrame: "laplace",
                    referencePoleDirection: { longitude: 352.719, latitude: 64.17 },
                },
                color: "#8B7355",
                orbitPhase: {
                    eccentricity: 0,
                    longitudeOfPeriapsis: 54.3,
                    meanLongitudeAtJ2000: 259.3,
                }
            }
        ],
        description: "The Red Planet, with the largest volcano in the Solar System."
    },
    {
        name: "Jupiter",
        radius: 69911,
        distance: ASTRONOMICAL_UNIT * 5.202887,
        orbitPhase: {
            eccentricity: 0.04838624,
            longitudeOfPeriapsis: 14.72847983,
            meanLongitudeAtJ2000: 34.39644051,
        },
        poleDirection: { longitude: 247.818, latitude: 87.783 },
        orbitPlane: {
            inclination: 1.30439695,
            longitudeOfAscendingNode: 100.47390909,
        },
        orbitRates: {
            semiMajorAxisAuPerCentury: -0.00011607,
            eccentricityPerCentury: -0.00013253,
            inclinationPerCentury: -0.00183714,
            meanLongitudePerCentury: 3034.74612775,
            longitudeOfPeriapsisPerCentury: 0.21252668,
            longitudeOfAscendingNodePerCentury: 0.20469106,
        },
        orbitalPeriod: 4332.817127523,
        rotationPeriod: 0.41,
        color: "#D8CA9D",
        satellites: [
            {
                name: "Io",
                radius: 1821.6,
                distance: 421_800,
                orbitalPeriod: 1.762732,
                poleDirection: { longitude: 247.706, latitude: 87.787 },
                orbitPlane: {
                    inclination: 0,
                    longitudeOfAscendingNode: 0,
                    referenceFrame: "laplace",
                    referencePoleDirection: { longitude: 248.23, latitude: 87.794 },
                },
                color: "#E6C87A",
                orbitPhase: {
                    eccentricity: 0.004,
                    longitudeOfPeriapsis: 49.1,
                    meanLongitudeAtJ2000: 380,
                }
            },
            {
                name: "Europa",
                radius: 1560.8,
                distance: 671_100,
                orbitalPeriod: 3.525463,
                poleDirection: { longitude: 247.93, latitude: 87.801 },
                orbitPlane: {
                    inclination: 0.5,
                    longitudeOfAscendingNode: 184,
                    referenceFrame: "laplace",
                    referencePoleDirection: { longitude: 248.23, latitude: 87.794 },
                },
                color: "#C4B896",
                orbitPhase: {
                    eccentricity: 0.009,
                    longitudeOfPeriapsis: 229,
                    meanLongitudeAtJ2000: 574.4,
                }
            },
            {
                name: "Ganymede",
                radius: 2634.1,
                distance: 1_070_400,
                orbitalPeriod: 7.155588,
                poleDirection: { longitude: 248.671, latitude: 87.875 },
                orbitPlane: {
                    inclination: 0.2,
                    longitudeOfAscendingNode: 58.5,
                    referenceFrame: "laplace",
                    referencePoleDirection: { longitude: 248.395, latitude: 87.903 },
                },
                color: "#8B7355",
                orbitPhase: {
                    eccentricity: 0.001,
                    longitudeOfPeriapsis: 256.8,
                    meanLongitudeAtJ2000: 581.6,
                }
            },
            {
                name: "Callisto",
                radius: 2410.3,
                distance: 1_882_700,
                orbitalPeriod: 16.69044,
                poleDirection: { longitude: 252.485, latitude: 88.191 },
                orbitPlane: {
                    inclination: 0.3,
                    longitudeOfAscendingNode: 309.1,
                    referenceFrame: "laplace",
                    referencePoleDirection: { longitude: 252.494, latitude: 88.16 },
                },
                color: "#5C4033",
                orbitPhase: {
                    eccentricity: 0.007,
                    longitudeOfPeriapsis: 352.9,
                    meanLongitudeAtJ2000: 440.3,
                }
            }
        ],
        description: "The largest planet, a gas giant with a Great Red Spot storm."
    },
    {
        name: "Saturn",
        radius: 58232,
        distance: ASTRONOMICAL_UNIT * 9.53667594,
        orbitPhase: {
            eccentricity: 0.05386179,
            longitudeOfPeriapsis: 92.59887831,
            meanLongitudeAtJ2000: 49.95424423,
        },
        poleDirection: { longitude: 79.528, latitude: 61.948 },
        orbitPlane: {
            inclination: 2.48599187,
            longitudeOfAscendingNode: 113.66242448,
        },
        orbitRates: {
            semiMajorAxisAuPerCentury: -0.0012506,
            eccentricityPerCentury: -0.00050991,
            inclinationPerCentury: 0.00193609,
            meanLongitudePerCentury: 1222.49362201,
            longitudeOfPeriapsisPerCentury: -0.41897216,
            longitudeOfAscendingNodePerCentury: -0.28867794,
        },
        orbitalPeriod: 10755.884336133,
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
                distance: 1_221_900,
                orbitalPeriod: 15.945448,
                poleDirection: { longitude: 79.528, latitude: 61.948 },
                orbitPlane: {
                    inclination: 0.3,
                    longitudeOfAscendingNode: 78.6,
                    referenceFrame: "laplace",
                    referencePoleDirection: { longitude: 79.467, latitude: 62.596 },
                },
                color: "#E6A243",
                orbitPhase: {
                    eccentricity: 0.029,
                    longitudeOfPeriapsis: 156.9,
                    meanLongitudeAtJ2000: 168.6,
                }
            }
        ],
        description: "Known for its stunning ring system made of ice and rock."
    },
    {
        name: "Uranus",
        radius: 25362,
        distance: ASTRONOMICAL_UNIT * 19.18916464,
        orbitPhase: {
            eccentricity: 0.04725744,
            longitudeOfPeriapsis: 170.9542763,
            meanLongitudeAtJ2000: 313.23810451,
        },
        poleDirection: { longitude: 257.647, latitude: 7.722 },
        orbitPlane: {
            inclination: 0.77263783,
            longitudeOfAscendingNode: 74.01692503,
        },
        orbitRates: {
            semiMajorAxisAuPerCentury: -0.00196176,
            eccentricityPerCentury: -0.00004397,
            inclinationPerCentury: -0.00242939,
            meanLongitudePerCentury: 428.48202785,
            longitudeOfPeriapsisPerCentury: 0.40805281,
            longitudeOfAscendingNodePerCentury: 0.04240589,
        },
        orbitalPeriod: 30687.401443598,
        rotationPeriod: -0.72,
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
        distance: ASTRONOMICAL_UNIT * 30.06992276,
        orbitPhase: {
            eccentricity: 0.00859048,
            longitudeOfPeriapsis: 44.96476227,
            meanLongitudeAtJ2000: -55.12002969,
        },
        poleDirection: { longitude: 319.235, latitude: 61.974 },
        orbitPlane: {
            inclination: 1.77004347,
            longitudeOfAscendingNode: 131.78422574,
        },
        orbitRates: {
            semiMajorAxisAuPerCentury: 0.00026291,
            eccentricityPerCentury: 0.00005105,
            inclinationPerCentury: 0.00035372,
            meanLongitudePerCentury: 218.45945325,
            longitudeOfPeriapsisPerCentury: -0.32241464,
            longitudeOfAscendingNodePerCentury: -0.00508664,
        },
        orbitalPeriod: 60189.659016278,
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
                distance: 354_800,
                orbitalPeriod: 5.876994,
                poleDirection: { longitude: 114.683, latitude: -44.115 },
                orbitPlane: {
                    inclination: 157.3,
                    longitudeOfAscendingNode: 178.1,
                    referenceFrame: "laplace",
                    referencePoleDirection: { longitude: 319.535, latitude: 61.513 },
                },
                color: "#C4C4C4",
                orbitPhase: {
                    eccentricity: 0,
                    longitudeOfPeriapsis: 178.1,
                    meanLongitudeAtJ2000: 241.1,
                }
            }
        ],
        description: "The windiest planet with supersonic storms."
    }
]
