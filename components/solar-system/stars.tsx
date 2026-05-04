"use client"

import { useMemo } from "react"
import { Html } from "@react-three/drei"
import * as THREE from "three"

type Vec3 = [number, number, number]

type PointLayerData = {
    positions: Float32Array
    colors: Float32Array
}

type BackgroundLayers = {
    stars: PointLayerData
    brightStars: PointLayerData
    milkyWay: PointLayerData
    milkyWayGlow: PointLayerData
    milkyWayBulge: PointLayerData
    galacticCore: PointLayerData
    zodiacalLight: PointLayerData
    darkLanes: PointLayerData
    darkLanesFine: PointLayerData
    andromeda: PointLayerData
    orionNebula: PointLayerData
    largeMagellanicCloud: PointLayerData
    smallMagellanicCloud: PointLayerData
    pleiades: PointLayerData
    hyades: PointLayerData
    omegaCentauri: PointLayerData
}

type BrightStar = {
    raDegrees: number
    decDegrees: number
    color: Vec3
    magnitude: number
}

type BackgroundLabel = {
    name: string
    position: readonly [number, number, number]
}

const BACKGROUND_RADIUS = 1000
const STAR_SHELL_THICKNESS = 40
const OBLIQUITY = degToRad(23.439291111)
const GALACTIC_TO_EQUATORIAL_MATRIX: readonly [Vec3, Vec3, Vec3] = [
    [-0.0548755604, 0.4941094279, -0.867666149],
    [-0.8734370902, -0.44482963, -0.1980763734],
    [-0.4838350155, 0.7469822445, 0.4559837762],
]
const ANDROMEDA_RIGHT_ASCENSION = 10.6847083
const ANDROMEDA_DECLINATION = 41.26875
const ANDROMEDA_POSITION_ANGLE = 35
const ORION_NEBULA_RIGHT_ASCENSION = 83.82208
const ORION_NEBULA_DECLINATION = -5.39111
const LARGE_MAGELLANIC_CLOUD_RIGHT_ASCENSION = 80.89375
const LARGE_MAGELLANIC_CLOUD_DECLINATION = -69.75611
const SMALL_MAGELLANIC_CLOUD_RIGHT_ASCENSION = 13.15833
const SMALL_MAGELLANIC_CLOUD_DECLINATION = -72.80028
const PLEIADES_RIGHT_ASCENSION = 56.75
const PLEIADES_DECLINATION = 24.1167
const HYADES_RIGHT_ASCENSION = 66.75
const HYADES_DECLINATION = 15.87
const OMEGA_CENTAURI_RIGHT_ASCENSION = 201.697
const OMEGA_CENTAURI_DECLINATION = -47.4794
const LABEL_RADIUS = BACKGROUND_RADIUS * 0.92
const BRIGHT_STARS: readonly BrightStar[] = [
    { raDegrees: 101.2872, decDegrees: -16.7161, color: [0.9, 0.96, 1.0], magnitude: -1.46 },
    { raDegrees: 95.9879, decDegrees: -52.6957, color: [0.72, 0.82, 1.0], magnitude: -0.74 },
    { raDegrees: 213.9153, decDegrees: 19.1824, color: [1.0, 0.86, 0.64], magnitude: -0.05 },
    { raDegrees: 279.2347, decDegrees: 38.7837, color: [0.72, 0.83, 1.0], magnitude: 0.03 },
    { raDegrees: 79.1723, decDegrees: 45.998, color: [0.72, 0.8, 1.0], magnitude: 0.08 },
    { raDegrees: 78.6345, decDegrees: -8.2016, color: [1.0, 0.7, 0.54], magnitude: 0.12 },
    { raDegrees: 114.8255, decDegrees: 5.225, color: [0.78, 0.86, 1.0], magnitude: 0.34 },
    { raDegrees: 88.7929, decDegrees: 7.4071, color: [1.0, 0.76, 0.66], magnitude: 0.42 },
    { raDegrees: 104.6564, decDegrees: -28.9721, color: [0.84, 0.9, 1.0], magnitude: 1.5 },
    { raDegrees: 24.4286, decDegrees: -57.2368, color: [0.94, 0.96, 1.0], magnitude: 0.46 },
]

function degToRad(degrees: number) {
    return (degrees * Math.PI) / 180
}

function createRng(seed: number) {
    let state = seed >>> 0

    return () => {
        state = (1664525 * state + 1013904223) >>> 0
        return state / 4294967296
    }
}

function sampleGaussian(random: () => number, sigma = 1) {
    const u1 = Math.max(random(), 1e-8)
    const u2 = random()
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * sigma
}

function normalize(vector: Vec3): Vec3 {
    const length = Math.hypot(vector[0], vector[1], vector[2]) || 1
    return [vector[0] / length, vector[1] / length, vector[2] / length]
}

function addVectors(left: Vec3, right: Vec3): Vec3 {
    return [left[0] + right[0], left[1] + right[1], left[2] + right[2]]
}

function scaleVector(vector: Vec3, scalar: number): Vec3 {
    return [vector[0] * scalar, vector[1] * scalar, vector[2] * scalar]
}

function multiplyMatrixVector(matrix: readonly [Vec3, Vec3, Vec3], vector: Vec3): Vec3 {
    return [
        matrix[0][0] * vector[0] + matrix[0][1] * vector[1] + matrix[0][2] * vector[2],
        matrix[1][0] * vector[0] + matrix[1][1] * vector[1] + matrix[1][2] * vector[2],
        matrix[2][0] * vector[0] + matrix[2][1] * vector[1] + matrix[2][2] * vector[2],
    ]
}

function sphericalToVector(longitudeDegrees: number, latitudeDegrees: number): Vec3 {
    const longitude = degToRad(longitudeDegrees)
    const latitude = degToRad(latitudeDegrees)
    const cosLatitude = Math.cos(latitude)

    return [
        cosLatitude * Math.cos(longitude),
        cosLatitude * Math.sin(longitude),
        Math.sin(latitude),
    ]
}

function equatorialToEcliptic(vector: Vec3): Vec3 {
    return normalize([
        vector[0],
        Math.cos(OBLIQUITY) * vector[1] + Math.sin(OBLIQUITY) * vector[2],
        -Math.sin(OBLIQUITY) * vector[1] + Math.cos(OBLIQUITY) * vector[2],
    ])
}

function galacticToEcliptic(longitudeDegrees: number, latitudeDegrees: number): Vec3 {
    return equatorialToEcliptic(
        multiplyMatrixVector(
            GALACTIC_TO_EQUATORIAL_MATRIX,
            sphericalToVector(longitudeDegrees, latitudeDegrees)
        )
    )
}

function equatorialFromRaDec(raDegrees: number, decDegrees: number): Vec3 {
    return sphericalToVector(raDegrees, decDegrees)
}

function scenePositionFromEcliptic(direction: Vec3, radius: number) {
    return [
        radius * direction[0],
        radius * direction[2],
        -radius * direction[1],
    ] as const
}

function getScenePositionFromGalactic(longitudeDegrees: number, latitudeDegrees: number, radius = LABEL_RADIUS) {
    return scenePositionFromEcliptic(
        galacticToEcliptic(longitudeDegrees, latitudeDegrees),
        radius
    )
}

function getScenePositionFromRaDec(raDegrees: number, decDegrees: number, radius = LABEL_RADIUS) {
    return scenePositionFromEcliptic(
        equatorialToEcliptic(equatorialFromRaDec(raDegrees, decDegrees)),
        radius
    )
}

function createBackgroundLabels(): BackgroundLabel[] {
    return [
        {
            name: "Milky Way",
            position: getScenePositionFromGalactic(10, 7),
        },
        {
            name: "Galactic Core",
            position: getScenePositionFromGalactic(0, 0),
        },
        {
            name: "Andromeda Galaxy",
            position: getScenePositionFromRaDec(ANDROMEDA_RIGHT_ASCENSION, ANDROMEDA_DECLINATION),
        },
        {
            name: "Orion Nebula",
            position: getScenePositionFromRaDec(ORION_NEBULA_RIGHT_ASCENSION, ORION_NEBULA_DECLINATION),
        },
        {
            name: "Large Magellanic Cloud",
            position: getScenePositionFromRaDec(
                LARGE_MAGELLANIC_CLOUD_RIGHT_ASCENSION,
                LARGE_MAGELLANIC_CLOUD_DECLINATION
            ),
        },
        {
            name: "Small Magellanic Cloud",
            position: getScenePositionFromRaDec(
                SMALL_MAGELLANIC_CLOUD_RIGHT_ASCENSION,
                SMALL_MAGELLANIC_CLOUD_DECLINATION
            ),
        },
        {
            name: "Pleiades",
            position: getScenePositionFromRaDec(PLEIADES_RIGHT_ASCENSION, PLEIADES_DECLINATION),
        },
        {
            name: "Hyades",
            position: getScenePositionFromRaDec(HYADES_RIGHT_ASCENSION, HYADES_DECLINATION),
        },
        {
            name: "Omega Centauri",
            position: getScenePositionFromRaDec(
                OMEGA_CENTAURI_RIGHT_ASCENSION,
                OMEGA_CENTAURI_DECLINATION
            ),
        },
    ]
}

function getEquatorialAxes(
    raDegrees: number,
    decDegrees: number,
    positionAngleDegrees: number
) {
    const centerEquatorial = equatorialFromRaDec(raDegrees, decDegrees)
    const rightAscension = degToRad(raDegrees)
    const declination = degToRad(decDegrees)
    const north: Vec3 = [
        -Math.sin(declination) * Math.cos(rightAscension),
        -Math.sin(declination) * Math.sin(rightAscension),
        Math.cos(declination),
    ]
    const east: Vec3 = [-Math.sin(rightAscension), Math.cos(rightAscension), 0]
    const positionAngle = degToRad(positionAngleDegrees)

    return {
        centerEquatorial,
        majorAxis: normalize(
            addVectors(
                scaleVector(north, Math.cos(positionAngle)),
                scaleVector(east, Math.sin(positionAngle))
            )
        ),
        minorAxis: normalize(
            addVectors(
                scaleVector(north, -Math.sin(positionAngle)),
                scaleVector(east, Math.cos(positionAngle))
            )
        ),
    }
}

function wrapDegrees(angleDegrees: number) {
    return ((angleDegrees + 180) % 360 + 360) % 360 - 180
}

function pushPoint(
    positions: number[],
    colors: number[],
    direction: Vec3,
    radius: number,
    color: Vec3
) {
    const [x, y, z] = scenePositionFromEcliptic(direction, radius)
    positions.push(x, y, z)
    colors.push(color[0], color[1], color[2])
}

function buildPointLayer(positions: number[], colors: number[]): PointLayerData {
    return {
        positions: new Float32Array(positions),
        colors: new Float32Array(colors),
    }
}

function brightnessFromMagnitude(magnitude: number) {
    return Math.pow(10, -0.4 * (magnitude + 1.46))
}

function createBaseStars(random: () => number) {
    const positions: number[] = []
    const colors: number[] = []

    for (let index = 0; index < 3600; index += 1) {
        const longitude = random() * 360
        const latitude = Math.asin(2 * random() - 1) * 180 / Math.PI
        const radius = BACKGROUND_RADIUS + random() * STAR_SHELL_THICKNESS
        const tone = random()
        const twinkle = 0.75 + random() * 0.25
        let color: Vec3

        if (tone < 0.68) {
            color = [0.88 * twinkle, 0.9 * twinkle, 0.96 * twinkle]
        } else if (tone < 0.84) {
            color = [0.72 * twinkle, 0.82 * twinkle, 1.02 * twinkle]
        } else {
            color = [1.02 * twinkle, 0.93 * twinkle, 0.72 * twinkle]
        }

        pushPoint(positions, colors, sphericalToVector(longitude, latitude), radius, color)
    }

    return buildPointLayer(positions, colors)
}

function createMilkyWay(random: () => number) {
    const positions: number[] = []
    const colors: number[] = []

    for (let index = 0; index < 6200; index += 1) {
        const clusterMix = random()
        const longitude =
            clusterMix < 0.5
                ? random() * 360
                : clusterMix < 0.82
                    ? sampleGaussian(random, 28)
                    : 180 + sampleGaussian(random, 20)
        const wrappedLongitude = ((longitude % 360) + 360) % 360
        const centerBoost = Math.exp(-(wrapDegrees(wrappedLongitude) ** 2) / (2 * 34 ** 2))
        const anticenterBoost = Math.exp(-(wrapDegrees(wrappedLongitude - 180) ** 2) / (2 * 42 ** 2))
        const latitudeSigma = 4.5 + centerBoost * 5 + anticenterBoost * 1.5
        const latitude = sampleGaussian(random, latitudeSigma)
        const radius = BACKGROUND_RADIUS + random() * (STAR_SHELL_THICKNESS * 0.6)
        const warmness = 0.72 + centerBoost * 0.18 + random() * 0.08
        const blueShift = 0.82 + anticenterBoost * 0.08
        const color: Vec3 = [
            (0.46 + centerBoost * 0.06) * warmness,
            (0.47 + centerBoost * 0.03) * warmness,
            0.58 * warmness * blueShift,
        ]

        pushPoint(positions, colors, galacticToEcliptic(wrappedLongitude, latitude), radius, color)
    }

    return buildPointLayer(positions, colors)
}

function createMilkyWayGlow(random: () => number) {
    const positions: number[] = []
    const colors: number[] = []

    for (let index = 0; index < 7600; index += 1) {
        const clusterMix = random()
        const longitude =
            clusterMix < 0.56
                ? sampleGaussian(random, 26)
                : clusterMix < 0.84
                    ? 180 + sampleGaussian(random, 34)
                    : random() * 360
        const wrappedLongitude = ((longitude % 360) + 360) % 360
        const centerBoost = Math.exp(-(wrapDegrees(wrappedLongitude) ** 2) / (2 * 30 ** 2))
        const anticenterBoost = Math.exp(-(wrapDegrees(wrappedLongitude - 180) ** 2) / (2 * 54 ** 2))
        const latitudeSigma = 10.5 + centerBoost * 6.5 + anticenterBoost * 3.2
        const laneOffset = (1.8 + centerBoost * 2.8 + anticenterBoost * 0.9) * (random() < 0.5 ? -1 : 1)
        const latitude = sampleGaussian(random, latitudeSigma) + laneOffset
        const radius = BACKGROUND_RADIUS + random() * (STAR_SHELL_THICKNESS * 0.3)
        const intensity = 0.34 + centerBoost * 0.28 + anticenterBoost * 0.1 + random() * 0.06
        const color: Vec3 = [
            (0.24 + anticenterBoost * 0.03) * intensity,
            (0.44 + centerBoost * 0.05) * intensity,
            (0.66 + centerBoost * 0.08 + anticenterBoost * 0.04) * intensity,
        ]

        pushPoint(positions, colors, galacticToEcliptic(wrappedLongitude, latitude), radius, color)
    }

    return buildPointLayer(positions, colors)
}

function createMilkyWayBulge(random: () => number) {
    const positions: number[] = []
    const colors: number[] = []

    for (let index = 0; index < 4200; index += 1) {
        const longitude = sampleGaussian(random, 18)
        const latitude = sampleGaussian(random, 8.5)
        const radialSpread = 0.55 + random() * 0.45
        const radius = BACKGROUND_RADIUS + random() * (STAR_SHELL_THICKNESS * 0.18)
        const intensity = (0.34 + random() * 0.16) * radialSpread
        const color: Vec3 = [
            0.92 * intensity,
            0.6 * intensity,
            0.34 * intensity,
        ]

        pushPoint(positions, colors, galacticToEcliptic(longitude, latitude), radius, color)
    }

    return buildPointLayer(positions, colors)
}

function createGalacticCore(random: () => number) {
    const positions: number[] = []
    const colors: number[] = []

    for (let index = 0; index < 1600; index += 1) {
        const longitude = sampleGaussian(random, 9)
        const latitude = sampleGaussian(random, 3.8)
        const radius = BACKGROUND_RADIUS + random() * (STAR_SHELL_THICKNESS * 0.35)
        const intensity = 0.52 + random() * 0.16
        const color: Vec3 = [1.0 * intensity, 0.72 * intensity, 0.4 * intensity]

        pushPoint(positions, colors, galacticToEcliptic(longitude, latitude), radius, color)
    }

    return buildPointLayer(positions, colors)
}

function createAndromeda(random: () => number) {
    const positions: number[] = []
    const colors: number[] = []
    const { centerEquatorial, majorAxis, minorAxis } = getEquatorialAxes(
        ANDROMEDA_RIGHT_ASCENSION,
        ANDROMEDA_DECLINATION,
        ANDROMEDA_POSITION_ANGLE
    )

    for (let index = 0; index < 1400; index += 1) {
        const majorOffset = sampleGaussian(random, degToRad(0.75))
        const minorOffset = sampleGaussian(random, degToRad(0.2))
        const equatorialDirection = normalize(
            addVectors(
                centerEquatorial,
                addVectors(scaleVector(majorAxis, majorOffset), scaleVector(minorAxis, minorOffset))
            )
        )
        const radius = BACKGROUND_RADIUS + random() * (STAR_SHELL_THICKNESS * 0.25)
        const intensity = 0.75 + random() * 0.2
        const color: Vec3 = [0.78 * intensity, 0.84 * intensity, 1.0 * intensity]

        pushPoint(positions, colors, equatorialToEcliptic(equatorialDirection), radius, color)
    }

    return buildPointLayer(positions, colors)
}

function createDiffuseObject({
    random,
    raDegrees,
    decDegrees,
    count,
    majorSigmaDegrees,
    minorSigmaDegrees,
    positionAngleDegrees,
    color,
    thickness,
}: {
    random: () => number
    raDegrees: number
    decDegrees: number
    count: number
    majorSigmaDegrees: number
    minorSigmaDegrees: number
    positionAngleDegrees: number
    color: Vec3
    thickness: number
}) {
    const positions: number[] = []
    const colors: number[] = []
    const { centerEquatorial, majorAxis, minorAxis } = getEquatorialAxes(
        raDegrees,
        decDegrees,
        positionAngleDegrees
    )

    for (let index = 0; index < count; index += 1) {
        const majorOffset = sampleGaussian(random, degToRad(majorSigmaDegrees))
        const minorOffset = sampleGaussian(random, degToRad(minorSigmaDegrees))
        const equatorialDirection = normalize(
            addVectors(
                centerEquatorial,
                addVectors(scaleVector(majorAxis, majorOffset), scaleVector(minorAxis, minorOffset))
            )
        )
        const radius = BACKGROUND_RADIUS + random() * thickness
        const intensity = 0.72 + random() * 0.24

        pushPoint(
            positions,
            colors,
            equatorialToEcliptic(equatorialDirection),
            radius,
            [color[0] * intensity, color[1] * intensity, color[2] * intensity]
        )
    }

    return buildPointLayer(positions, colors)
}

function createClusterStars({
    random,
    raDegrees,
    decDegrees,
    count,
    majorSigmaDegrees,
    minorSigmaDegrees,
    positionAngleDegrees,
    color,
}: {
    random: () => number
    raDegrees: number
    decDegrees: number
    count: number
    majorSigmaDegrees: number
    minorSigmaDegrees: number
    positionAngleDegrees: number
    color: Vec3
}) {
    const positions: number[] = []
    const colors: number[] = []
    const { centerEquatorial, majorAxis, minorAxis } = getEquatorialAxes(
        raDegrees,
        decDegrees,
        positionAngleDegrees
    )

    for (let index = 0; index < count; index += 1) {
        const majorOffset = sampleGaussian(random, degToRad(majorSigmaDegrees))
        const minorOffset = sampleGaussian(random, degToRad(minorSigmaDegrees))
        const equatorialDirection = normalize(
            addVectors(
                centerEquatorial,
                addVectors(scaleVector(majorAxis, majorOffset), scaleVector(minorAxis, minorOffset))
            )
        )
        const radius = BACKGROUND_RADIUS + random() * (STAR_SHELL_THICKNESS * 0.05)
        const intensity = 0.28 + random() * 0.52

        pushPoint(
            positions,
            colors,
            equatorialToEcliptic(equatorialDirection),
            radius,
            [color[0] * intensity, color[1] * intensity, color[2] * intensity]
        )
    }

    return buildPointLayer(positions, colors)
}

function createZodiacalLight(random: () => number) {
    const positions: number[] = []
    const colors: number[] = []

    for (let index = 0; index < 4200; index += 1) {
        const longitude = random() * 360
        const latitude = sampleGaussian(random, 6.5)
        const elongationBoost = 0.45 + 0.2 * Math.cos(degToRad(wrapDegrees(longitude))) ** 2
        const radius = BACKGROUND_RADIUS + random() * (STAR_SHELL_THICKNESS * 0.2)
        const color: Vec3 = [0.2 * elongationBoost, 0.18 * elongationBoost, 0.12 * elongationBoost]

        pushPoint(positions, colors, sphericalToVector(longitude, latitude), radius, color)
    }

    return buildPointLayer(positions, colors)
}

function createDarkLanes(random: () => number) {
    const positions: number[] = []
    const colors: number[] = []

    for (let index = 0; index < 2800; index += 1) {
        const clusterMix = random()
        const longitude =
            clusterMix < 0.45
                ? sampleGaussian(random, 18)
                : clusterMix < 0.8
                    ? 78 + sampleGaussian(random, 16)
                    : 180 + sampleGaussian(random, 26)
        const latitude = sampleGaussian(random, 2.4 + random() * 2.1)
        const radius = BACKGROUND_RADIUS + random() * (STAR_SHELL_THICKNESS * 0.08)
        const darkness = 0.24 + random() * 0.18
        const color: Vec3 = [0.012 * darkness, 0.016 * darkness, 0.028 * darkness]

        pushPoint(positions, colors, galacticToEcliptic(longitude, latitude), radius, color)
    }

    return buildPointLayer(positions, colors)
}

function createFineDarkLanes(random: () => number) {
    const positions: number[] = []
    const colors: number[] = []

    for (let index = 0; index < 2200; index += 1) {
        const longitudeAnchor =
            random() < 0.7
                ? sampleGaussian(random, 14)
                : 62 + sampleGaussian(random, 12)
        const longitude = longitudeAnchor + sampleGaussian(random, 3.2)
        const latitude = sampleGaussian(random, 0.95 + random() * 0.85)
        const radius = BACKGROUND_RADIUS + random() * (STAR_SHELL_THICKNESS * 0.04)
        const darkness = 0.28 + random() * 0.18
        const color: Vec3 = [0.01 * darkness, 0.014 * darkness, 0.024 * darkness]

        pushPoint(positions, colors, galacticToEcliptic(longitude, latitude), radius, color)
    }

    return buildPointLayer(positions, colors)
}

function createBrightStars(random: () => number) {
    const positions: number[] = []
    const colors: number[] = []

    for (const star of BRIGHT_STARS) {
        const { centerEquatorial, majorAxis, minorAxis } = getEquatorialAxes(
            star.raDegrees,
            star.decDegrees,
            0
        )

        pushPoint(
            positions,
            colors,
            equatorialToEcliptic(centerEquatorial),
            BACKGROUND_RADIUS + random() * (STAR_SHELL_THICKNESS * 0.05),
            [
                star.color[0] * (0.5 + brightnessFromMagnitude(star.magnitude) * 0.5),
                star.color[1] * (0.5 + brightnessFromMagnitude(star.magnitude) * 0.5),
                star.color[2] * (0.5 + brightnessFromMagnitude(star.magnitude) * 0.5),
            ]
        )

        for (let haloIndex = 0; haloIndex < 18; haloIndex += 1) {
            const majorOffset = sampleGaussian(random, degToRad(0.12))
            const minorOffset = sampleGaussian(random, degToRad(0.12))
            const direction = normalize(
                addVectors(
                    centerEquatorial,
                    addVectors(scaleVector(majorAxis, majorOffset), scaleVector(minorAxis, minorOffset))
                )
            )
            const intensity = brightnessFromMagnitude(star.magnitude) * (0.12 + random() * 0.16)

            pushPoint(
                positions,
                colors,
                equatorialToEcliptic(direction),
                BACKGROUND_RADIUS + random() * (STAR_SHELL_THICKNESS * 0.08),
                [
                    star.color[0] * intensity,
                    star.color[1] * intensity,
                    star.color[2] * intensity,
                ]
            )
        }
    }

    return buildPointLayer(positions, colors)
}

function createBackgroundLayers(): BackgroundLayers {
    const random = createRng(0x51f15eed)

    return {
        stars: createBaseStars(random),
        brightStars: createBrightStars(random),
        milkyWay: createMilkyWay(random),
        milkyWayGlow: createMilkyWayGlow(random),
        milkyWayBulge: createMilkyWayBulge(random),
        galacticCore: createGalacticCore(random),
        zodiacalLight: createZodiacalLight(random),
        darkLanes: createDarkLanes(random),
        darkLanesFine: createFineDarkLanes(random),
        andromeda: createAndromeda(random),
        orionNebula: createDiffuseObject({
            random,
            raDegrees: ORION_NEBULA_RIGHT_ASCENSION,
            decDegrees: ORION_NEBULA_DECLINATION,
            count: 900,
            majorSigmaDegrees: 1.1,
            minorSigmaDegrees: 0.55,
            positionAngleDegrees: 48,
            color: [0.88, 0.54, 1.0],
            thickness: STAR_SHELL_THICKNESS * 0.2,
        }),
        largeMagellanicCloud: createDiffuseObject({
            random,
            raDegrees: LARGE_MAGELLANIC_CLOUD_RIGHT_ASCENSION,
            decDegrees: LARGE_MAGELLANIC_CLOUD_DECLINATION,
            count: 850,
            majorSigmaDegrees: 2.8,
            minorSigmaDegrees: 1.5,
            positionAngleDegrees: 190,
            color: [0.72, 0.82, 0.98],
            thickness: STAR_SHELL_THICKNESS * 0.25,
        }),
        smallMagellanicCloud: createDiffuseObject({
            random,
            raDegrees: SMALL_MAGELLANIC_CLOUD_RIGHT_ASCENSION,
            decDegrees: SMALL_MAGELLANIC_CLOUD_DECLINATION,
            count: 620,
            majorSigmaDegrees: 1.7,
            minorSigmaDegrees: 1.1,
            positionAngleDegrees: 55,
            color: [0.74, 0.8, 1.0],
            thickness: STAR_SHELL_THICKNESS * 0.2,
        }),
        pleiades: createClusterStars({
            random,
            raDegrees: PLEIADES_RIGHT_ASCENSION,
            decDegrees: PLEIADES_DECLINATION,
            count: 180,
            majorSigmaDegrees: 0.9,
            minorSigmaDegrees: 0.6,
            positionAngleDegrees: 115,
            color: [0.72, 0.84, 1.0],
        }),
        hyades: createClusterStars({
            random,
            raDegrees: HYADES_RIGHT_ASCENSION,
            decDegrees: HYADES_DECLINATION,
            count: 220,
            majorSigmaDegrees: 2.4,
            minorSigmaDegrees: 1.4,
            positionAngleDegrees: 40,
            color: [1.0, 0.84, 0.66],
        }),
        omegaCentauri: createClusterStars({
            random,
            raDegrees: OMEGA_CENTAURI_RIGHT_ASCENSION,
            decDegrees: OMEGA_CENTAURI_DECLINATION,
            count: 240,
            majorSigmaDegrees: 0.42,
            minorSigmaDegrees: 0.42,
            positionAngleDegrees: 0,
            color: [0.92, 0.9, 0.8],
        }),
    }
}

function PointLayer({
    data,
    opacity,
    size,
    blending = THREE.NormalBlending,
}: {
    data: PointLayerData
    opacity: number
    size: number
    blending?: THREE.Blending
}) {
    return (
        <points renderOrder={-1}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[data.positions, 3]}
                    count={data.positions.length / 3}
                />
                <bufferAttribute
                    attach="attributes-color"
                    args={[data.colors, 3]}
                    count={data.colors.length / 3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={size}
                vertexColors
                transparent
                opacity={opacity}
                depthWrite={false}
                sizeAttenuation
                blending={blending}
            />
        </points>
    )
}

export function Stars() {
    const layers = useMemo(() => createBackgroundLayers(), [])
    const labels = useMemo(() => createBackgroundLabels(), [])

    return (
        <>
            <PointLayer data={layers.zodiacalLight} size={0.34} opacity={0.02} blending={THREE.AdditiveBlending} />
            <PointLayer data={layers.milkyWayGlow} size={1.35} opacity={0.05} blending={THREE.AdditiveBlending} />
            <PointLayer data={layers.milkyWayGlow} size={0.84} opacity={0.13} blending={THREE.AdditiveBlending} />
            <PointLayer data={layers.milkyWay} size={0.38} opacity={0.28} blending={THREE.AdditiveBlending} />
            <PointLayer data={layers.milkyWayBulge} size={1.0} opacity={0.1} blending={THREE.AdditiveBlending} />
            <PointLayer data={layers.milkyWayBulge} size={0.62} opacity={0.16} blending={THREE.AdditiveBlending} />
            <PointLayer data={layers.galacticCore} size={0.7} opacity={0.16} blending={THREE.AdditiveBlending} />
            <PointLayer data={layers.galacticCore} size={0.38} opacity={0.32} blending={THREE.AdditiveBlending} />
            <PointLayer data={layers.andromeda} size={0.2} opacity={0.05} blending={THREE.AdditiveBlending} />
            <PointLayer data={layers.orionNebula} size={0.18} opacity={0.06} blending={THREE.AdditiveBlending} />
            <PointLayer data={layers.largeMagellanicCloud} size={0.22} opacity={0.06} blending={THREE.AdditiveBlending} />
            <PointLayer data={layers.smallMagellanicCloud} size={0.2} opacity={0.05} blending={THREE.AdditiveBlending} />
            <PointLayer data={layers.pleiades} size={0.12} opacity={0.48} blending={THREE.AdditiveBlending} />
            <PointLayer data={layers.hyades} size={0.12} opacity={0.44} blending={THREE.AdditiveBlending} />
            <PointLayer data={layers.omegaCentauri} size={0.11} opacity={0.38} blending={THREE.AdditiveBlending} />
            <PointLayer data={layers.stars} size={0.13} opacity={0.58} />
            <PointLayer data={layers.darkLanes} size={0.72} opacity={0.28} />
            <PointLayer data={layers.darkLanesFine} size={0.3} opacity={0.24} />

            {labels.map((label) => (
                <Html
                    key={label.name}
                    position={label.position}
                    sprite
                    center
                    style={{
                        pointerEvents: "none",
                        userSelect: "none",
                    }}
                >
                    <div
                        className="whitespace-nowrap bg-transparent px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/78"
                        style={{ transform: `translate(${0}px, ${-30}px)` }}
                    >
                        {label.name}
                    </div>
                </Html>
            ))}
        </>
    )
}
