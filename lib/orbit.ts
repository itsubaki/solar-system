export const ASTRONOMICAL_UNIT = 149_600_000 // km
export const MS_PER_DAY = 1000 * 60 * 60 * 24
export const FULL_TURN = Math.PI * 2
export const J2000_EPOCH_UTC = Date.UTC(2000, 0, 1, 12, 0, 0)

export type ScenePoint = {
    x: number
    y: number
    z: number
}

type OrbitPlanePoint = {
    x: number
    z: number
}

type OrbitalPlaneState = OrbitPlanePoint & {
    angle: number
    radiusScale: number
    trueAnomaly: number
}

export function degToRad(degrees: number) {
    return (degrees * Math.PI) / 180
}

export function normalizeRadians(angle: number) {
    return ((angle % FULL_TURN) + FULL_TURN) % FULL_TURN
}

export function solveKeplerEquation(meanAnomaly: number, eccentricity: number) {
    let eccentricAnomaly = meanAnomaly

    for (let i = 0; i < 8; i += 1) {
        eccentricAnomaly -= (eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly) / (1 - eccentricity * Math.cos(eccentricAnomaly))
    }

    return eccentricAnomaly
}

export function getElapsedDays(fromEpochUtc: number, at: Date) {
    return (at.getTime() - fromEpochUtc) / MS_PER_DAY
}

export function getElapsedDaysFromIsoDate(isoDate: string, at: Date) {
    return getElapsedDays(Date.parse(isoDate), at)
}

export function getTrueAnomaly(eccentricAnomaly: number, eccentricity: number) {
    return 2 * Math.atan2(
        Math.sqrt(1 + eccentricity) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - eccentricity) * Math.cos(eccentricAnomaly / 2)
    )
}

export function getOrbitRadiusScale(eccentricAnomaly: number, eccentricity: number) {
    return 1 - eccentricity * Math.cos(eccentricAnomaly)
}

export function getOrbitalPlaneState(
    meanAnomaly: number,
    eccentricity: number,
    argumentOfPeriapsis: number,
    semiMajorAxisScale = 1
): OrbitalPlaneState {
    const eccentricAnomaly = solveKeplerEquation(meanAnomaly, eccentricity)
    const trueAnomaly = getTrueAnomaly(eccentricAnomaly, eccentricity)
    const longitude = trueAnomaly + argumentOfPeriapsis
    const radiusScale = semiMajorAxisScale * getOrbitRadiusScale(eccentricAnomaly, eccentricity)

    return {
        angle: normalizeRadians(-longitude),
        radiusScale,
        trueAnomaly,
        x: radiusScale * Math.cos(longitude),
        z: -radiusScale * Math.sin(longitude),
    }
}

export function getOrbitPlanePoint(
    eccentricAnomaly: number,
    eccentricity: number,
    argumentOfPeriapsis: number,
    semiMajorAxisScale = 1
): OrbitPlanePoint {
    const radiusScale = semiMajorAxisScale * getOrbitRadiusScale(eccentricAnomaly, eccentricity)
    const trueAnomaly = getTrueAnomaly(eccentricAnomaly, eccentricity)
    const longitude = trueAnomaly + argumentOfPeriapsis

    return {
        x: radiusScale * Math.cos(longitude),
        z: -radiusScale * Math.sin(longitude),
    }
}

export function getSceneAngle(point: Pick<ScenePoint, "x" | "z">) {
    return normalizeRadians(Math.atan2(-point.z, point.x))
}

export function scaleScenePoint(point: ScenePoint, scale: number): ScenePoint {
    return {
        x: point.x * scale,
        y: point.y * scale,
        z: point.z * scale,
    }
}

export function getSceneDirection(longitude: number, latitude: number): ScenePoint {
    const projectedRadius = Math.cos(latitude)

    return {
        x: projectedRadius * Math.cos(longitude),
        y: Math.sin(latitude),
        z: -projectedRadius * Math.sin(longitude),
    }
}

export function rotateOrbitPointToScene(
    localX: number,
    localZ: number,
    longitudeOfAscendingNode: number,
    inclination: number
): ScenePoint {
    const inclinedY = -localZ * Math.sin(inclination)
    const inclinedZ = localZ * Math.cos(inclination)

    return {
        x: localX * Math.cos(longitudeOfAscendingNode) + inclinedZ * Math.sin(longitudeOfAscendingNode),
        y: inclinedY,
        z: -localX * Math.sin(longitudeOfAscendingNode) + inclinedZ * Math.cos(longitudeOfAscendingNode),
    }
}
