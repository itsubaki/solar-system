import { afterEach, describe, expect, it, vi } from "vitest"
import { Clock, error, getConsoleFunction, setConsoleFunction, warn } from "three"
import { installThreeConsoleFilter } from "./three-console"

const originalLogger = getConsoleFunction()
const clockMessage = "Clock: This module has been deprecated. Please use THREE.Timer instead."

afterEach(() => {
    setConsoleFunction(originalLogger)
    vi.restoreAllMocks()
})

describe("Three.js legacy clock warning filter", () => {
    it("filters the deprecation warning when Fiber creates a clock", () => {
        const output = vi.spyOn(console, "warn").mockImplementation(() => {})
        installThreeConsoleFilter()

        const clock = new Clock()
        expect(clock.getDelta()).toBe(0)
        expect(clock.running).toBe(true)
        expect(output).not.toHaveBeenCalled()
    })

    it("preserves other warnings and their parameters", () => {
        const output = vi.spyOn(console, "warn").mockImplementation(() => {})
        const details = { material: "test" }
        installThreeConsoleFilter()

        warn("Material: unknown property", details)
        expect(output).toHaveBeenCalledWith("THREE.Material: unknown property", details)
    })

    it("does not filter errors even if they contain the same message", () => {
        const output = vi.spyOn(console, "error").mockImplementation(() => {})
        installThreeConsoleFilter()

        error(clockMessage)
        expect(output).toHaveBeenCalledWith(`THREE.${clockMessage}`)
    })

    it("preserves an existing custom Three.js logger", () => {
        const previous = vi.fn()
        setConsoleFunction(previous)
        installThreeConsoleFilter()

        warn(clockMessage)
        expect(previous).not.toHaveBeenCalled()
        warn("Other warning", 123)
        expect(previous).toHaveBeenCalledWith("warn", "THREE.Other warning", 123)
    })

    it("installs once across repeated initialization and hot reloads", () => {
        installThreeConsoleFilter()
        const logger = getConsoleFunction()
        installThreeConsoleFilter()

        expect(getConsoleFunction()).toBe(logger)
    })
})
