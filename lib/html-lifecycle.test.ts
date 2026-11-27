import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { afterEach, describe, expect, it, vi } from "vitest"

// Exercise the installed dependency so a missing patch also fails this regression.
const require = createRequire(import.meta.url)
const source = readFileSync(require.resolve("@react-three/drei/web/Html.js"), "utf8")
const effect = source.match(/React\.useLayoutEffect\(\(\) => \{\n(    if \(group\.current\) \{[\s\S]*?)\n  \}, \[target, transform\]\);/)
if (!effect) throw new Error("Could not locate the drei Html root lifecycle")

const runEffect = new Function("context", `
    const { ReactDOM, root, pendingUnmount, group, el, target, scene,
        camera, size, calculatePosition, transform, prepend } = context;
    ${effect[1]}
`) as (context: object) => () => void

function createFixture() {
    const domRoot = { render: vi.fn(), unmount: vi.fn() }
    const root = { current: null as typeof domRoot | null }
    const pendingUnmount = { current: null as ReturnType<typeof setTimeout> | null }
    const el = { parentNode: null as object | null, style: { cssText: "" } }
    const createRoot = vi.fn(() => domRoot)
    const target = {
        appendChild: vi.fn(() => { el.parentNode = target }),
        removeChild: vi.fn(() => { el.parentNode = null }),
    }
    const setup = (parent: typeof target | null = target) => runEffect({
        ReactDOM: { createRoot },
        root,
        pendingUnmount,
        group: { current: {} },
        el,
        target: parent,
        scene: { updateMatrixWorld: vi.fn() },
        camera: {},
        size: {},
        calculatePosition: () => [0, 0],
        transform: false,
        prepend: false,
    })

    return { domRoot, root, el, target, createRoot, setup }
}

afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
})

describe("drei Html root lifecycle patch", () => {
    it("defers root teardown until after the renderer commit", () => {
        vi.useFakeTimers()
        const fixture = createFixture()
        const cleanup = fixture.setup()

        cleanup()
        expect(fixture.el.parentNode).toBeNull()
        expect(fixture.domRoot.unmount).not.toHaveBeenCalled()

        vi.runAllTimers()
        expect(fixture.domRoot.unmount).toHaveBeenCalledOnce()
        expect(fixture.root.current).toBeNull()
    })

    it("reuses the root when StrictMode replays effects", () => {
        vi.useFakeTimers()
        const fixture = createFixture()
        fixture.setup()()
        const cleanup = fixture.setup()

        vi.runAllTimers()
        expect(fixture.createRoot).toHaveBeenCalledOnce()
        expect(fixture.domRoot.unmount).not.toHaveBeenCalled()
        expect(fixture.el.parentNode).toBe(fixture.target)

        cleanup()
        vi.runAllTimers()
        expect(fixture.domRoot.unmount).toHaveBeenCalledOnce()
    })

    it("reuses the root when the portal target changes", () => {
        vi.useFakeTimers()
        const fixture = createFixture()
        const newTarget = {
            appendChild: vi.fn(() => { fixture.el.parentNode = newTarget }),
            removeChild: vi.fn(() => { fixture.el.parentNode = null }),
        }
        fixture.setup()()
        const cleanup = fixture.setup(newTarget)

        vi.runAllTimers()
        expect(fixture.createRoot).toHaveBeenCalledOnce()
        expect(fixture.domRoot.unmount).not.toHaveBeenCalled()
        expect(fixture.el.parentNode).toBe(newTarget)

        cleanup()
        vi.runAllTimers()
        expect(fixture.domRoot.unmount).toHaveBeenCalledOnce()
    })

    it("cleans up safely when there is no portal target", () => {
        vi.useFakeTimers()
        const fixture = createFixture()
        const cleanup = fixture.setup(null)

        expect(cleanup).not.toThrow()
        vi.runAllTimers()
        expect(fixture.domRoot.unmount).toHaveBeenCalledOnce()
    })
})
