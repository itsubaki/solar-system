import { beforeEach, describe, expect, it, vi } from "vitest"
import { Group, PerspectiveCamera, Vector3 } from "three"
import type { Camera } from "three"

const frames = vi.hoisted(() => [] as Array<(state: { camera: Camera }) => void>)
vi.mock("react", async (importOriginal) => ({
    ...await importOriginal<typeof import("react")>(),
    useMemo: (create: () => unknown) => create(),
    useRef: (current: unknown) => ({ current }),
}))
vi.mock("@react-three/drei", () => ({ Html: () => null }))
vi.mock("@react-three/fiber", () => ({ useFrame: (callback: typeof frames[number]) => frames.push(callback) }))

import { Stars } from "./stars"

describe("camera-relative background sky", () => {
    beforeEach(() => { frames.length = 0 })

    it("preserves celestial directions and label alignment when moving beyond the sky radius", () => {
        const element = Stars()
        const sky = new Group()
        element.props.ref.current = sky
        const camera = new PerspectiveCamera()
        const direction = new Vector3(0.7, 0.4, -0.5).normalize()
        for (const position of [[2, 2, 2], [32, 1, 0.4], [-30, 101, 139], [3000, 2000, -4000]]) {
            camera.position.set(...position as [number, number, number])
            frames[0]({ camera })
            const visibleDirection = direction.clone().multiplyScalar(1300).applyMatrix4(sky.matrixWorld).sub(camera.position).normalize()
            const labelDirection = direction.clone().multiplyScalar(1196).applyMatrix4(sky.matrixWorld).sub(camera.position).normalize()
            expect(visibleDirection.distanceTo(direction)).toBeLessThan(1e-12)
            expect(labelDirection.distanceTo(visibleDirection)).toBeLessThan(1e-12)
        }
    })

    it("uses world camera position when the camera is nested in a translated group", () => {
        const element = Stars()
        const sky = new Group()
        element.props.ref.current = sky
        const rig = new Group()
        const camera = new PerspectiveCamera()
        rig.position.set(100, -200, 300)
        camera.position.set(2, 2, 2)
        rig.add(camera)
        frames[0]({ camera })
        expect(sky.position.toArray()).toEqual([102, -198, 302])
    })
})
