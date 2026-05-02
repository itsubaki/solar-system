export const ASTRONOMICAL_UNIT = 149_600_000 // km
export const MS_PER_DAY = 1000 * 60 * 60 * 24
export const FULL_TURN = Math.PI * 2

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