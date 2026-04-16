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
