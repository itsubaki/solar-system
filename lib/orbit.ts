export const ASTRONOMICAL_UNIT = 149_600_000 // km
export const MS_PER_DAY = 1000 * 60 * 60 * 24
export const FULL_TURN = Math.PI * 2

type ScenePoint = {
    x: number
    y: number
    z: number
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
