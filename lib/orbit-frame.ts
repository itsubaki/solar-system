import { Matrix4, Quaternion, Vector3 } from "three"
import { degToRad, J2000_OBLIQUITY } from "./orbit"
import type { OrbitPlane, PoleDirection } from "./planet-data"

const SCENE_UP = new Vector3(0, 1, 0)
// ICRF north expressed in the scene's J2000 ecliptic coordinates.
const EQUATORIAL_NORTH = new Vector3(0, Math.cos(J2000_OBLIQUITY), -Math.sin(J2000_OBLIQUITY))

export function getPoleVector(longitude: number, latitude: number) {
    const lambda = degToRad(longitude)
    const beta = degToRad(latitude)
    return new Vector3(Math.cos(beta) * Math.cos(lambda), Math.sin(beta), -Math.cos(beta) * Math.sin(lambda))
}

export function getOrbitPlaneQuaternion(orbitPlane: OrbitPlane) {
    return new Quaternion().setFromAxisAngle(SCENE_UP, degToRad(orbitPlane.longitudeOfAscendingNode))
        .multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), degToRad(orbitPlane.inclination)))
}

export function getEquatorPlaneQuaternion(poleDirection: PoleDirection) {
    const pole = getPoleVector(poleDirection.longitude, poleDirection.latitude).normalize()
    // JPL measures nodes from the reference plane's ascending node on the ICRF
    // equator, not from an arbitrary shortest rotation to the reference pole.
    const node = new Vector3().crossVectors(EQUATORIAL_NORTH, pole)
    if (node.lengthSq() < 1e-20) node.set(1, 0, 0)
    node.normalize()
    const forward = new Vector3().crossVectors(node, pole).normalize()
    return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(node, pole, forward))
}

export function getOrbitFrameQuaternion(
    orbitPlane: OrbitPlane,
    parentPoleDirection?: PoleDirection,
    parentOrbitPlaneQuaternion?: Quaternion
) {
    const worldFrame = getOrbitPlaneQuaternion(orbitPlane)
    const referencePole = orbitPlane.referenceFrame === "laplace"
        ? orbitPlane.referencePoleDirection
        : orbitPlane.referenceFrame === "parentEquator" ? parentPoleDirection : undefined

    if (referencePole) worldFrame.premultiply(getEquatorPlaneQuaternion(referencePole))
    // Satellites are nested inside the planet's orbit group. Cancel that
    // transform for every absolute reference frame, including the Moon's.
    if (parentOrbitPlaneQuaternion) worldFrame.premultiply(parentOrbitPlaneQuaternion.clone().invert())
    return worldFrame
}
