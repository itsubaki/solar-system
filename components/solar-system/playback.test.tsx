import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const hooks = vi.hoisted(() => ({
    speedIndex: 0,
    stateIndex: 0,
    effects: [] as Array<() => void | (() => void)>,
    refs: [] as Array<{ current: unknown }>,
    frames: [] as Array<() => void>,
}))
vi.mock("react", async (importOriginal) => ({
    ...await importOriginal<typeof import("react")>(),
    useState: (initial: unknown) => {
        const index = hooks.stateIndex++
        return [index === 0 ? hooks.speedIndex : typeof initial === "function" ? initial() : initial, vi.fn()]
    },
    useEffect: (effect: () => void) => { hooks.effects.push(effect) },
    useMemo: (create: () => unknown) => create(),
    useCallback: (callback: unknown) => callback,
    useRef: (current: unknown) => {
        const ref = { current }
        hooks.refs.push(ref)
        return ref
    },
}))
vi.mock("@react-three/drei", () => ({ Html: () => null, PerspectiveCamera: () => null, OrbitControls: () => null }))
vi.mock("@react-three/fiber", () => ({ Canvas: () => null, useFrame: vi.fn(), useThree: vi.fn() }))


import { SolarSystem } from "./solar-system"

describe("local playback across month boundaries", () => {
    beforeEach(() => {
        hooks.stateIndex = 0
        hooks.effects.length = 0
        hooks.refs.length = 0
        hooks.frames.length = 0
        vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Unexpected runtime data request") }))
        vi.useFakeTimers({ toFake: ["Date"] })
        vi.setSystemTime(new Date("2026-11-30T23:59:59Z"))
        vi.stubGlobal("requestAnimationFrame", (callback: () => void) => { hooks.frames.push(callback); return hooks.frames.length })
        vi.stubGlobal("cancelAnimationFrame", vi.fn())
    })
    afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

    it.each([{ index: 0, speed: 1 }, { index: 6, speed: 31536000 }])(
        "advances every frame at speed $speed without fetching any data", ({ index, speed }) => {
            hooks.speedIndex = index
            SolarSystem()
            const start = Date.now()
            const cleanup = hooks.effects[0]()
            const simulation = hooks.refs.find((ref) => ref.current instanceof Date) as { current: Date }
            for (const elapsed of [1000, 2000, 3000]) {
                vi.setSystemTime(start + elapsed)
                hooks.frames.shift()!()
                expect(simulation.current.getTime()).toBe(start + elapsed * speed)
            }
            expect(fetch).not.toHaveBeenCalled()
            if (typeof cleanup === "function") cleanup()
        }
    )
})
