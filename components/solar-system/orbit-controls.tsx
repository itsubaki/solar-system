"use client"

import { useEffect, useRef } from "react"
import { OrbitControls } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { Spherical, Vector3 } from "three"
import {
    DEFAULT_CAMERA_POSITION_ARRAY,
    DEFAULT_CAMERA_DISTANCE,
    MAX_CAMERA_DISTANCE,
    MIN_CAMERA_DISTANCE,
    clampCameraDistance,
    isShortcutBlockedTarget,
} from "@/lib/camera-controls"
import type { FocusTargetRef } from "./orbit"

type OrbitControlsRef = {
    target: Vector3
    update: () => void
    addEventListener: (type: "change", listener: () => void) => void
    removeEventListener: (type: "change", listener: () => void) => void
}

const DEFAULT_CAMERA_TARGET = new Vector3(0, 0, 0)
const DEFAULT_CAMERA_POSITION = new Vector3(...DEFAULT_CAMERA_POSITION_ARRAY)
const DEFAULT_CAMERA_OFFSET = DEFAULT_CAMERA_POSITION.clone().sub(DEFAULT_CAMERA_TARGET)
const MAX_POLAR_ANGLE = Math.PI
const KEY_ROTATE_PIXELS = 10
const KEY_ZOOM_FACTOR = 0.95

export function PlanetOrbitControls({
    focusTarget,
    desiredCameraDistance,
    onDesiredCameraDistanceChange,
}: {
    focusTarget: FocusTargetRef
    desiredCameraDistance: number | null
    onDesiredCameraDistanceChange: (distance: number) => void
}) {
    const { camera, gl } = useThree()
    const controlsRef = useRef<OrbitControlsRef | null>(null)
    const followDeltaRef = useRef(new Vector3())
    const lastControlRadiusRef = useRef(DEFAULT_CAMERA_DISTANCE)

    useFrame(() => {
        const controls = controlsRef.current
        const focusedTarget = focusTarget.current
        if (!controls || !focusedTarget) return

        followDeltaRef.current.subVectors(focusedTarget, controls.target)
        if (followDeltaRef.current.lengthSq() === 0) return

        camera.position.add(followDeltaRef.current)
        controls.target.copy(focusedTarget)
        camera.lookAt(controls.target)
        controls.update()
    })

    useEffect(() => {
        if (!controlsRef.current) return

        const controls = controlsRef.current
        const element = gl.domElement
        const spherical = new Spherical()
        const offset = new Vector3()

        const syncCamera = () => {
            camera.lookAt(controls.target)
            controls.update()
        }

        const syncDesiredDistanceFromControls = () => {
            const currentRadius = camera.position.distanceTo(controls.target)
            if (Math.abs(currentRadius - lastControlRadiusRef.current) < 0.005) return

            lastControlRadiusRef.current = currentRadius
            onDesiredCameraDistanceChange(currentRadius)
        }

        controls.target.copy(DEFAULT_CAMERA_TARGET)
        camera.position.copy(DEFAULT_CAMERA_POSITION)
        lastControlRadiusRef.current = camera.position.distanceTo(controls.target)
        controls.addEventListener("change", syncDesiredDistanceFromControls)
        syncCamera()

        const orbitByPixels = (deltaX: number, deltaY: number) => {
            offset.copy(camera.position).sub(controls.target)
            spherical.setFromVector3(offset)

            spherical.theta -= (2 * Math.PI * deltaX) / element.clientHeight
            spherical.phi += (2 * Math.PI * deltaY) / element.clientHeight
            spherical.makeSafe()

            offset.setFromSpherical(spherical)
            camera.position.copy(controls.target).add(offset)
            syncCamera()
        }

        const zoomByFactor = (factor: number) => {
            offset.copy(camera.position).sub(controls.target)
            spherical.setFromVector3(offset)
            spherical.radius = clampCameraDistance(spherical.radius * factor)
            offset.setFromSpherical(spherical)
            camera.position.copy(controls.target).add(offset)
            onDesiredCameraDistanceChange(spherical.radius)
            syncCamera()
        }

        const resetCamera = () => {
            const resetTarget = focusTarget.current ?? DEFAULT_CAMERA_TARGET
            controls.target.copy(resetTarget)
            camera.position.copy(resetTarget).add(DEFAULT_CAMERA_OFFSET)
            syncCamera()
        }

        let isRotating = false
        let lastX = 0
        let lastY = 0

        const endRotation = () => {
            isRotating = false
        }

        const onPointerDown = (event: PointerEvent) => {
            if (event.button !== 0) return

            event.preventDefault()
            isRotating = true
            lastX = event.clientX
            lastY = event.clientY
        }

        const onPointerMove = (event: PointerEvent) => {
            if (!isRotating) return

            event.preventDefault()

            const deltaX = event.clientX - lastX
            const deltaY = event.clientY - lastY

            lastX = event.clientX
            lastY = event.clientY
            orbitByPixels(deltaX, -deltaY)
        }

        const onKeyDown = (event: KeyboardEvent) => {
            const activeElement = document.activeElement
            const isTypingTarget = isShortcutBlockedTarget(activeElement)

            if (isTypingTarget || event.metaKey || event.ctrlKey || event.altKey) return

            switch (event.key) {
                case "r":
                case "R":
                    event.preventDefault()
                    resetCamera()
                    break
                case "ArrowUp":
                    event.preventDefault()
                    orbitByPixels(0, KEY_ROTATE_PIXELS)
                    break
                case "ArrowDown":
                    event.preventDefault()
                    orbitByPixels(0, -KEY_ROTATE_PIXELS)
                    break
                case "ArrowLeft":
                    event.preventDefault()
                    orbitByPixels(-KEY_ROTATE_PIXELS, 0)
                    break
                case "ArrowRight":
                    event.preventDefault()
                    orbitByPixels(KEY_ROTATE_PIXELS, 0)
                    break
                case "+":
                    event.preventDefault()
                    zoomByFactor(KEY_ZOOM_FACTOR)
                    break
                case "-":
                    event.preventDefault()
                    zoomByFactor(1 / KEY_ZOOM_FACTOR)
                    break
                default:
                    break
            }
        }

        element.addEventListener("pointerdown", onPointerDown)
        window.addEventListener("pointermove", onPointerMove)
        window.addEventListener("pointerup", endRotation)
        window.addEventListener("pointercancel", endRotation)
        window.addEventListener("keydown", onKeyDown)

        return () => {
            controls.removeEventListener("change", syncDesiredDistanceFromControls)
            element.removeEventListener("pointerdown", onPointerDown)
            window.removeEventListener("pointermove", onPointerMove)
            window.removeEventListener("pointerup", endRotation)
            window.removeEventListener("pointercancel", endRotation)
            window.removeEventListener("keydown", onKeyDown)
        }
    }, [camera, focusTarget, gl, onDesiredCameraDistanceChange])

    useEffect(() => {
        const controls = controlsRef.current
        if (!controls || desiredCameraDistance === null) return

        const offset = new Vector3().copy(camera.position).sub(controls.target)
        const spherical = new Spherical().setFromVector3(offset)

        spherical.radius = clampCameraDistance(desiredCameraDistance)

        offset.setFromSpherical(spherical)
        camera.position.copy(controls.target).add(offset)
        camera.lookAt(controls.target)
        controls.update()
    }, [camera, desiredCameraDistance])

    return <OrbitControls
        ref={(instance) => {
            controlsRef.current = instance
        }}
        enablePan={false}
        enableZoom
        enableRotate={false}
        maxPolarAngle={MAX_POLAR_ANGLE}
        minDistance={MIN_CAMERA_DISTANCE}
        maxDistance={MAX_CAMERA_DISTANCE}
        autoRotate={false}
    />
}
