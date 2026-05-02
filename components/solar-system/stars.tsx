"use client"

import { useMemo } from "react"
import * as THREE from "three"

type Vec3 = [number, number, number]

type PointLayerData = {
    positions: Float32Array
    colors: Float32Array
}

type BackgroundLayers = {
    stars: PointLayerData
    milkyWay: PointLayerData
    galacticCore: PointLayerData
    andromeda: PointLayerData
    orionNebula: PointLayerData
    largeMagellanicCloud: PointLayerData
    smallMagellanicCloud: PointLayerData
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
        const warmness = 0.75 + centerBoost * 0.2 + random() * 0.1
        const color: Vec3 = [0.55 * warmness, 0.57 * warmness, 0.66 * warmness]

        pushPoint(positions, colors, galacticToEcliptic(wrappedLongitude, latitude), radius, color)
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
        const intensity = 0.78 + random() * 0.2
        const color: Vec3 = [1.0 * intensity, 0.8 * intensity, 0.52 * intensity]

        pushPoint(positions, colors, galacticToEcliptic(longitude, latitude), radius, color)
    }

    return buildPointLayer(positions, colors)
}

function createAndromeda(random: () => number) {
    const positions: number[] = []
    const colors: number[] = []
    const centerEquatorial = equatorialFromRaDec(
        ANDROMEDA_RIGHT_ASCENSION,
        ANDROMEDA_DECLINATION
    )
    const rightAscension = degToRad(ANDROMEDA_RIGHT_ASCENSION)
    const declination = degToRad(ANDROMEDA_DECLINATION)
    const north: Vec3 = [
        -Math.sin(declination) * Math.cos(rightAscension),
        -Math.sin(declination) * Math.sin(rightAscension),
        Math.cos(declination),
    ]
    const east: Vec3 = [-Math.sin(rightAscension), Math.cos(rightAscension), 0]
    const positionAngle = degToRad(ANDROMEDA_POSITION_ANGLE)
    const majorAxis = normalize(addVectors(scaleVector(north, Math.cos(positionAngle)), scaleVector(east, Math.sin(positionAngle))))
    const minorAxis = normalize(addVectors(scaleVector(north, -Math.sin(positionAngle)), scaleVector(east, Math.cos(positionAngle))))

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
    const majorAxis = normalize(
        addVectors(
            scaleVector(north, Math.cos(positionAngle)),
            scaleVector(east, Math.sin(positionAngle))
        )
    )
    const minorAxis = normalize(
        addVectors(
            scaleVector(north, -Math.sin(positionAngle)),
            scaleVector(east, Math.cos(positionAngle))
        )
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

function createBackgroundLayers(): BackgroundLayers {
    const random = createRng(0x51f15eed)

    return {
        stars: createBaseStars(random),
        milkyWay: createMilkyWay(random),
        galacticCore: createGalacticCore(random),
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
            count: 1300,
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
            count: 900,
            majorSigmaDegrees: 1.7,
            minorSigmaDegrees: 1.1,
            positionAngleDegrees: 55,
            color: [0.74, 0.8, 1.0],
            thickness: STAR_SHELL_THICKNESS * 0.2,
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

    return (
        <>
            <PointLayer data={layers.milkyWay} size={0.26} opacity={0.16} blending={THREE.AdditiveBlending} />
            <PointLayer data={layers.galacticCore} size={0.36} opacity={0.3} blending={THREE.AdditiveBlending} />
            <PointLayer data={layers.andromeda} size={0.34} opacity={0.22} blending={THREE.AdditiveBlending} />
            <PointLayer data={layers.orionNebula} size={0.28} opacity={0.24} blending={THREE.AdditiveBlending} />
            <PointLayer data={layers.largeMagellanicCloud} size={0.32} opacity={0.22} blending={THREE.AdditiveBlending} />
            <PointLayer data={layers.smallMagellanicCloud} size={0.3} opacity={0.2} blending={THREE.AdditiveBlending} />
            <PointLayer data={layers.stars} size={0.15} opacity={0.85} />
        </>
    )
}
