import { describe, expect, it } from "vitest"

import {
    MAX_CAMERA_DISTANCE,
    MIN_CAMERA_DISTANCE,
    ZOOM_SLIDER_MAX,
    ZOOM_SLIDER_MIN,
    clampCameraDistance,
    getCameraDistanceFromSliderValue,
    getZoomSliderValue,
} from "./camera-controls"

describe("camera controls", () => {
    it("clamps camera distance to the supported range", () => {
        expect(clampCameraDistance(MIN_CAMERA_DISTANCE / 10)).toBe(MIN_CAMERA_DISTANCE)
        expect(clampCameraDistance(MAX_CAMERA_DISTANCE * 10)).toBe(MAX_CAMERA_DISTANCE)
        expect(clampCameraDistance(42)).toBe(42)
    })

    it("maps slider bounds to the supported camera range", () => {
        expect(getCameraDistanceFromSliderValue(ZOOM_SLIDER_MIN)).toBeCloseTo(MAX_CAMERA_DISTANCE)
        expect(getCameraDistanceFromSliderValue(ZOOM_SLIDER_MAX)).toBeCloseTo(MIN_CAMERA_DISTANCE)
    })

    it("converts camera distance back to the slider scale", () => {
        expect(getZoomSliderValue(MAX_CAMERA_DISTANCE)).toBeCloseTo(ZOOM_SLIDER_MIN)
        expect(getZoomSliderValue(MIN_CAMERA_DISTANCE)).toBeCloseTo(ZOOM_SLIDER_MAX)
    })

    it("round trips representative slider values", () => {
        for (const sliderValue of [ZOOM_SLIDER_MIN, 20, 50, 80, ZOOM_SLIDER_MAX]) {
            const cameraDistance = getCameraDistanceFromSliderValue(sliderValue)
            expect(getZoomSliderValue(cameraDistance)).toBeCloseTo(sliderValue, 10)
        }
    })
})
