import type { CometData } from "./comet-data"
import {
    ASTRONOMICAL_UNIT,
    FULL_TURN,
    degToRad,
    getElapsedDaysFromIsoDate,
    getOrbitPlanePoint,
    getOrbitalPlaneState,
    getSceneAngle,
    rotateOrbitPointToScene,
} from "./orbit"

type CometOrbitState = {
    angle: number
    radiusScale: number
    x: number
    y: number
    z: number
}

export function getCometOrbitPosition(comet: CometData, at = new Date()): CometOrbitState {
    const { orbitalElements } = comet
    const semiMajorAxisAu = orbitalElements.perihelionDistanceAu / (1 - orbitalElements.eccentricity)
    const meanMotion = FULL_TURN / comet.orbitalPeriod
    const baselineDistanceAu = comet.distance / ASTRONOMICAL_UNIT
    const elapsedDays = getElapsedDaysFromIsoDate(orbitalElements.perihelionDate, at)
    const orbitState = getOrbitalPlaneState(
        meanMotion * elapsedDays,
        orbitalElements.eccentricity,
        degToRad(orbitalElements.argumentOfPerihelion),
        semiMajorAxisAu / baselineDistanceAu
    )
    const worldPosition = getWorldOrbitPoint(
        orbitState.x,
        orbitState.z,
        degToRad(comet.orbitPlane.longitudeOfAscendingNode),
        degToRad(comet.orbitPlane.inclination)
    )

    return {
        angle: getSceneAngle(worldPosition),
        radiusScale: orbitState.radiusScale,
        x: worldPosition.x,
        y: worldPosition.y,
        z: worldPosition.z,
    }
}

export function getCometOrbitPath(comet: CometData, segments = 512) {
    const { orbitalElements } = comet
    const semiMajorAxisAu = orbitalElements.perihelionDistanceAu / (1 - orbitalElements.eccentricity)
    const baselineDistanceAu = comet.distance / ASTRONOMICAL_UNIT
    const argumentOfPerihelion = degToRad(orbitalElements.argumentOfPerihelion)
    const longitudeOfAscendingNode = degToRad(comet.orbitPlane.longitudeOfAscendingNode)
    const orbitalInclination = degToRad(comet.orbitPlane.inclination)
    const points: Array<{ x: number; y: number; z: number }> = []

    for (let i = 0; i <= segments; i += 1) {
        const eccentricAnomaly = (FULL_TURN * i) / segments
        const point = getOrbitPlanePoint(
            eccentricAnomaly,
            orbitalElements.eccentricity,
            argumentOfPerihelion,
            semiMajorAxisAu / baselineDistanceAu
        )

        points.push(
            getWorldOrbitPoint(
                point.x,
                point.z,
                longitudeOfAscendingNode,
                orbitalInclination
            )
        )
    }

    return points
}

function getWorldOrbitPoint(
    orbitPlaneX: number,
    orbitPlaneZ: number,
    longitudeOfAscendingNode: number,
    orbitalInclination: number
) {
    return rotateOrbitPointToScene(
        orbitPlaneX,
        orbitPlaneZ,
        longitudeOfAscendingNode,
        orbitalInclination
    )
}
