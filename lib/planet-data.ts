export interface PlanetData {
  name: string
  radius: number
  distance: number
  orbitalPeriod: number
  rotationPeriod: number
  color: string
  emissive?: string
  emissiveIntensity?: number
  rings?: {
    innerRadius: number
    outerRadius: number
    color: string
  }
  satellites?: {
    name: string
    radius: number
    distance: number
    orbitalPeriod: number
    color: string
  }[]
  description: string
}

const MS_PER_DAY = 1000 * 60 * 60 * 24
const J2000_EPOCH_UTC = Date.UTC(2000, 0, 1, 12, 0, 0)

const PLANET_ORBITAL_PHASES: Record<string, {
  eccentricity: number
  longitudeOfPerihelion: number
  meanLongitudeAtJ2000: number
}> = {
  Mercury: {
    eccentricity: 0.20563069,
    longitudeOfPerihelion: 77.45645,
    meanLongitudeAtJ2000: 252.25084,
  },
  Venus: {
    eccentricity: 0.00677323,
    longitudeOfPerihelion: 131.53298,
    meanLongitudeAtJ2000: 181.97973,
  },
  Earth: {
    eccentricity: 0.01671022,
    longitudeOfPerihelion: 102.94719,
    meanLongitudeAtJ2000: 100.46435,
  },
  Mars: {
    eccentricity: 0.09341233,
    longitudeOfPerihelion: -23.94363,
    meanLongitudeAtJ2000: -4.55343,
  },
  Jupiter: {
    eccentricity: 0.04839266,
    longitudeOfPerihelion: 14.72848,
    meanLongitudeAtJ2000: 34.39644,
  },
  Saturn: {
    eccentricity: 0.0541506,
    longitudeOfPerihelion: 92.59888,
    meanLongitudeAtJ2000: 49.95424,
  },
  Uranus: {
    eccentricity: 0.04716771,
    longitudeOfPerihelion: 170.95428,
    meanLongitudeAtJ2000: 313.2381,
  },
  Neptune: {
    eccentricity: 0.00858587,
    longitudeOfPerihelion: 44.96476,
    meanLongitudeAtJ2000: -55.12003,
  },
}

function degToRad(degrees: number) {
  return (degrees * Math.PI) / 180
}

function normalizeRadians(angle: number) {
  const fullTurn = Math.PI * 2
  return ((angle % fullTurn) + fullTurn) % fullTurn
}

function solveKeplerEquation(meanAnomaly: number, eccentricity: number) {
  let eccentricAnomaly = meanAnomaly

  for (let i = 0; i < 6; i += 1) {
    eccentricAnomaly -= (
      eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly
    ) / (
        1 - eccentricity * Math.cos(eccentricAnomaly)
      )
  }

  return eccentricAnomaly
}

export function getInitialOrbitAngle(planet: PlanetData, at = new Date()) {
  const orbitalPhase = PLANET_ORBITAL_PHASES[planet.name]

  if (!orbitalPhase) return 0

  const elapsedDays = (at.getTime() - J2000_EPOCH_UTC) / MS_PER_DAY
  const meanMotion = (Math.PI * 2) / planet.orbitalPeriod
  const meanAnomalyAtJ2000 = degToRad(
    orbitalPhase.meanLongitudeAtJ2000 - orbitalPhase.longitudeOfPerihelion
  )
  const meanAnomaly = normalizeRadians(meanAnomalyAtJ2000 + meanMotion * elapsedDays)
  const eccentricAnomaly = solveKeplerEquation(meanAnomaly, orbitalPhase.eccentricity)
  const trueAnomaly = 2 * Math.atan2(
    Math.sqrt(1 + orbitalPhase.eccentricity) * Math.sin(eccentricAnomaly / 2),
    Math.sqrt(1 - orbitalPhase.eccentricity) * Math.cos(eccentricAnomaly / 2)
  )
  const heliocentricLongitude = trueAnomaly + degToRad(orbitalPhase.longitudeOfPerihelion)

  return normalizeRadians(-heliocentricLongitude)
}

export const SUN_DATA = {
  name: "Sun",
  radius: 2.5,
  color: "#FDB813",
  emissive: "#FDB813",
  emissiveIntensity: 2,
  description: "The Sun is a G-type main-sequence star at the center of our Solar System."
}

export const PLANETS: PlanetData[] = [
  {
    name: "Mercury",
    radius: 0.2,
    distance: 5,
    orbitalPeriod: 88,
    rotationPeriod: 58.6,
    color: "#B5A7A7",
    description: "The smallest planet and closest to the Sun."
  },
  {
    name: "Venus",
    radius: 0.35,
    distance: 7,
    orbitalPeriod: 225,
    rotationPeriod: 243,
    color: "#E6C87A",
    description: "Similar in size to Earth, with a thick toxic atmosphere."
  },
  {
    name: "Earth",
    radius: 0.38,
    distance: 9.5,
    orbitalPeriod: 365,
    rotationPeriod: 1,
    color: "#6B93D6",
    satellites: [
      {
        name: "Moon",
        radius: 0.1,
        distance: 0.8,
        orbitalPeriod: 27,
        color: "#C4C4C4"
      }
    ],
    description: "Our home planet, the only known planet with life."
  },
  {
    name: "Mars",
    radius: 0.28,
    distance: 12,
    orbitalPeriod: 687,
    rotationPeriod: 1.03,
    color: "#C1440E",
    satellites: [
      {
        name: "Phobos",
        radius: 0.05,
        distance: 0.5,
        orbitalPeriod: 0.3,
        color: "#8B7355"
      },
      {
        name: "Deimos",
        radius: 0.03,
        distance: 0.7,
        orbitalPeriod: 1.3,
        color: "#8B7355"
      }
    ],
    description: "The Red Planet, with the largest volcano in the Solar System."
  },
  {
    name: "Jupiter",
    radius: 1.0,
    distance: 17,
    orbitalPeriod: 4333,
    rotationPeriod: 0.41,
    color: "#D8CA9D",
    satellites: [
      {
        name: "Io",
        radius: 0.12,
        distance: 1.5,
        orbitalPeriod: 1.8,
        color: "#E6C87A"
      },
      {
        name: "Europa",
        radius: 0.1,
        distance: 1.8,
        orbitalPeriod: 3.5,
        color: "#C4B896"
      },
      {
        name: "Ganymede",
        radius: 0.15,
        distance: 2.2,
        orbitalPeriod: 7.2,
        color: "#8B7355"
      },
      {
        name: "Callisto",
        radius: 0.14,
        distance: 2.6,
        orbitalPeriod: 16.7,
        color: "#5C4033"
      }
    ],
    description: "The largest planet, a gas giant with a Great Red Spot storm."
  },
  {
    name: "Saturn",
    radius: 0.85,
    distance: 23,
    orbitalPeriod: 10759,
    rotationPeriod: 0.45,
    color: "#F4D59E",
    rings: {
      innerRadius: 1.2,
      outerRadius: 2.2,
      color: "#C4A35A"
    },
    satellites: [
      {
        name: "Titan",
        radius: 0.15,
        distance: 2.5,
        orbitalPeriod: 16,
        color: "#E6A243"
      }
    ],
    description: "Known for its stunning ring system made of ice and rock."
  },
  {
    name: "Uranus",
    radius: 0.55,
    distance: 30,
    orbitalPeriod: 30687,
    rotationPeriod: 0.72,
    color: "#B5E3E3",
    rings: {
      innerRadius: 0.8,
      outerRadius: 1.1,
      color: "#4A6670"
    },
    description: "An ice giant that rotates on its side."
  },
  {
    name: "Neptune",
    radius: 0.52,
    distance: 37,
    orbitalPeriod: 60190,
    rotationPeriod: 0.67,
    color: "#5B5DDF",
    satellites: [
      {
        name: "Triton",
        radius: 0.08,
        distance: 1.2,
        orbitalPeriod: 5.9,
        color: "#C4C4C4"
      }
    ],
    description: "The windiest planet with supersonic storms."
  }
]
