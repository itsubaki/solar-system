import catalog from "../data/hipparcos-bright.json"
import { degToRad, J2000_EPOCH_UTC, J2000_OBLIQUITY, MS_PER_DAY, type ScenePoint } from "./orbit"

// ESA Hipparcos I/239, NASA HEASARC mirror. ICRS axes, catalog epoch J1991.25.
// [HIP, RA degrees, Dec degrees, V magnitude, B-V, mu_RA*cos(Dec), mu_Dec].
// Proper motions are milliarcseconds per Julian year.
export const HIPPARCOS_STARS = catalog
const CATALOG_EPOCH = J2000_EPOCH_UTC - 8.75 * 365.25 * MS_PER_DAY
const MAS_TO_RAD = Math.PI / (180 * 3600000)

export function getCatalogStarDirection(star: number[], at: Date): ScenePoint {
    const [, raDegrees, decDegrees, , , pmRa, pmDec] = star
    const ra = degToRad(raDegrees), dec = degToRad(decDegrees)
    const years = (at.getTime() - CATALOG_EPOCH) / (365.25 * MS_PER_DAY)
    // Propagate in tangent vectors, avoiding division by cos(Dec) near poles.
    const east = pmRa * years * MAS_TO_RAD
    const north = pmDec * years * MAS_TO_RAD
    let x = Math.cos(dec) * Math.cos(ra) - east * Math.sin(ra) - north * Math.sin(dec) * Math.cos(ra)
    let y = Math.cos(dec) * Math.sin(ra) + east * Math.cos(ra) - north * Math.sin(dec) * Math.sin(ra)
    let z = Math.sin(dec) + north * Math.cos(dec)
    const length = Math.hypot(x, y, z)
    x /= length; y /= length; z /= length
    return { x, y: -Math.sin(J2000_OBLIQUITY) * y + Math.cos(J2000_OBLIQUITY) * z,
        z: -Math.cos(J2000_OBLIQUITY) * y - Math.sin(J2000_OBLIQUITY) * z }
}

export function getStarVisuals(magnitude: number, bv: number) {
    const warmth = Math.max(0, Math.min(1, (bv + 0.2) / 1.8))
    return {
        color: [0.65 + 0.35 * Math.min(1, warmth * 2), 0.8 + 0.2 * (1 - Math.abs(warmth * 2 - 1)), 1 - 0.55 * warmth],
        size: Math.max(1, Math.min(6, 4 - 0.45 * magnitude)),
        brightness: Math.max(0.08, Math.min(1, Math.pow(10, -0.2 * (magnitude - 1)))),
    }
}

export function createCatalogStarLayer(at: Date, radius: number) {
    const positions = new Float32Array(catalog.length * 3)
    const colors = new Float32Array(catalog.length * 3)
    const sizes = new Float32Array(catalog.length)
    const brightness = new Float32Array(catalog.length)
    catalog.forEach((star, index) => {
        const point = getCatalogStarDirection(star, at)
        positions.set([point.x * radius, point.y * radius, point.z * radius], index * 3)
        const visuals = getStarVisuals(star[3], star[4])
        colors.set(visuals.color, index * 3)
        sizes[index] = visuals.size
        brightness[index] = visuals.brightness
    })
    return { positions, colors, sizes, brightness }
}
