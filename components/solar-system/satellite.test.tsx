import { beforeEach, describe, expect, it, vi } from "vitest"
import { BufferGeometry, Float32BufferAttribute, Group, Vector3 } from "three"
import { PLANETS } from "../../lib/planet-data"
import { getPlanetOrbitPlane } from "../../lib/planet-angle"
import { getOrbitPlaneQuaternion } from "../../lib/orbit-frame"
import { getCalculatedSatelliteState } from "../../lib/satellite-model"
import { ASTRONOMICAL_UNIT, MS_PER_DAY } from "../../lib/orbit"

const frames = vi.hoisted(() => [] as Array<() => void>)
vi.mock("react", async (importOriginal) => ({
    ...await importOriginal<typeof import("react")>(),
    useMemo: (create: () => unknown) => create(),
    useRef: (current: unknown) => ({ current }),
    useState: (value: unknown) => [value, vi.fn()],
}))
vi.mock("@react-three/drei", () => ({ Html: () => null }))
vi.mock("@react-three/fiber", () => ({ useFrame: (callback: () => void) => frames.push(callback) }))

import { Satellite } from "./satellite"

describe("rendered mean-element satellites", () => {
    beforeEach(() => { frames.length = 0 })

    it.each(PLANETS.flatMap((planet) => (planet.satellites ?? []).map((satellite) => ({ planet, satellite, name: satellite.name }))))(
        "renders $name in the correct world direction with matching focus and trajectory", async ({ planet, satellite }) => {
            const time = { current: new Date("2026-11-28T00:07:00Z") }
            const parentRotation = getOrbitPlaneQuaternion(getPlanetOrbitPlane(planet, time.current))
            const focus = { current: null as Vector3 | null }
            const element = Satellite({ satellite: { ...satellite, parentPlanetName: planet.name },
                parentPoleDirection: planet.poleDirection, parentOrbitPlaneQuaternion: parentRotation,
                simTimeRef: time, onSelect: vi.fn(), isSelected: true, dimOrbit: false, focusTargetRef: focus,
                scale: { distance: 1 / ASTRONOMICAL_UNIT, radius: 1 / ASTRONOMICAL_UNIT } })
            const parent = new Group()
            parent.quaternion.copy(parentRotation)
            parent.position.set(1, 2, 3)
            const root = new Group()
            parent.add(root)
            element.props.ref.current = root
            const pathElement = element.props.children[0]
            const path = new Group()
            root.add(path)
            pathElement.props.ref.current = path
            const geometry = new BufferGeometry().setAttribute("position", new Float32BufferAttribute(new Float32Array(257 * 3), 3))
            pathElement.props.children.props.geometryRef.current = geometry
            const body = new Group()
            root.add(body)
            element.props.children[1].props.ref.current = body

            frames[0]()
            const world = body.getWorldPosition(new Vector3())
            const expected = new Vector3(...Object.values(getCalculatedSatelliteState(satellite.name, time.current)!.position) as [number, number, number])
                .multiplyScalar(1 / ASTRONOMICAL_UNIT).add(parent.position)
            expect(world.distanceTo(expected) * ASTRONOMICAL_UNIT).toBeLessThan(2)
            expect(focus.current!.distanceTo(world)).toBeLessThan(1e-12)
            const positions = geometry.getAttribute("position")
            const pathCenter = new Vector3().fromBufferAttribute(positions, 0).applyMatrix4(root.matrixWorld)
            expect(pathCenter.distanceTo(world) * ASTRONOMICAL_UNIT).toBeLessThan(0.2)

            // Advance between path refreshes and measure against actual line
            // segments, not merely against the mathematical interpolation.
            time.current = new Date(time.current.getTime() + satellite.orbitalPeriod * MS_PER_DAY / 32)
            frames[0]()
            const point = body.getWorldPosition(new Vector3())
            let closest = Infinity
            for (let i = 1; i < positions.count; i++) {
                const a = new Vector3().fromBufferAttribute(positions, i - 1).applyMatrix4(root.matrixWorld)
                const b = new Vector3().fromBufferAttribute(positions, i).applyMatrix4(root.matrixWorld)
                const delta = b.clone().sub(a)
                const t = Math.max(0, Math.min(1, point.clone().sub(a).dot(delta) / delta.lengthSq()))
                closest = Math.min(closest, point.distanceTo(a.addScaledVector(delta, t)))
            }
            expect(closest * ASTRONOMICAL_UNIT).toBeLessThan(satellite.radius)
        }
    )
})
