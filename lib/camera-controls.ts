export const DEFAULT_CAMERA_POSITION_ARRAY = [2, 2, 2] as const
export const DEFAULT_CAMERA_DISTANCE = Math.sqrt(12)
export const MIN_CAMERA_DISTANCE = 0.01
export const MAX_CAMERA_DISTANCE = 3000
export const ZOOM_SLIDER_MIN = 0
export const ZOOM_SLIDER_MAX = 100

export function clampCameraDistance(cameraDistance: number) {
    return Math.min(MAX_CAMERA_DISTANCE, Math.max(MIN_CAMERA_DISTANCE, cameraDistance))
}

export function getZoomSliderValue(cameraDistance: number) {
    const min = Math.log(MIN_CAMERA_DISTANCE)
    const max = Math.log(MAX_CAMERA_DISTANCE)
    const clampedDistance = clampCameraDistance(cameraDistance)

    return (1 - (Math.log(clampedDistance) - min) / (max - min)) * (ZOOM_SLIDER_MAX - ZOOM_SLIDER_MIN) + ZOOM_SLIDER_MIN
}

export function getCameraDistanceFromSliderValue(sliderValue: number) {
    const min = Math.log(MIN_CAMERA_DISTANCE)
    const max = Math.log(MAX_CAMERA_DISTANCE)
    const normalizedValue = 1 - (sliderValue - ZOOM_SLIDER_MIN) / (ZOOM_SLIDER_MAX - ZOOM_SLIDER_MIN)

    return Math.exp(min + normalizedValue * (max - min))
}

export function isShortcutBlockedTarget(activeElement: Element | null) {
    if (activeElement instanceof HTMLInputElement) {
        return activeElement.type !== "range"
    }

    return (
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true"
    )
}
