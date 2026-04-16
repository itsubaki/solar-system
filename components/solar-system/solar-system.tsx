"use client"

import { Suspense, useState, useEffect, useRef } from "react"
import { Canvas, useThree } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { Spherical, Vector3 } from "three"
import { Sun } from "./sun"
import { Planet } from "./planet"
import { Stars } from "./stars"
import { PlanetInfo } from "./planet-info"
import { PLANETS, type PlanetData } from "@/lib/planet-data"

type OrbitControlsRef = {
  target: Vector3
  update: () => void
}

const DEFAULT_CAMERA_POSITION = new Vector3(30, 30, 30)
const DEFAULT_CAMERA_TARGET = new Vector3(0, 0, 0)
const DEFAULT_CAMERA_POSITION_ARRAY = [30, 30, 30] as const
const MIN_CAMERA_DISTANCE = 5
const MAX_CAMERA_DISTANCE = 80
const KEY_ROTATE_PIXELS = 48
const KEY_ZOOM_FACTOR = 0.9

function InvertedOrbitControls() {
  const { camera, gl } = useThree()
  const controlsRef = useRef<OrbitControlsRef | null>(null)

  useEffect(() => {
    if (!controlsRef.current) return

    const controls = controlsRef.current
    const element = gl.domElement
    const rotateSpeed = 1
    const spherical = new Spherical()
    const offset = new Vector3()

    const syncCamera = () => {
      camera.lookAt(controls.target)
      controls.update()
    }

    controls.target.copy(DEFAULT_CAMERA_TARGET)
    camera.position.copy(DEFAULT_CAMERA_POSITION)
    syncCamera()

    const orbitByPixels = (deltaX: number, deltaY: number) => {
      offset.copy(camera.position).sub(controls.target)
      spherical.setFromVector3(offset)

      spherical.theta -= (2 * Math.PI * deltaX * rotateSpeed) / element.clientHeight
      spherical.phi += (2 * Math.PI * deltaY * rotateSpeed) / element.clientHeight
      spherical.makeSafe()

      offset.setFromSpherical(spherical)
      camera.position.copy(controls.target).add(offset)
      syncCamera()
    }

    const zoomByFactor = (factor: number) => {
      offset.copy(camera.position).sub(controls.target)
      spherical.setFromVector3(offset)
      spherical.radius = Math.min(
        MAX_CAMERA_DISTANCE,
        Math.max(MIN_CAMERA_DISTANCE, spherical.radius * factor)
      )
      offset.setFromSpherical(spherical)
      camera.position.copy(controls.target).add(offset)
      syncCamera()
    }

    const resetCamera = () => {
      controls.target.copy(DEFAULT_CAMERA_TARGET)
      camera.position.copy(DEFAULT_CAMERA_POSITION)
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

      isRotating = true
      lastX = event.clientX
      lastY = event.clientY
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!isRotating) return

      const deltaX = event.clientX - lastX
      const deltaY = event.clientY - lastY

      lastX = event.clientX
      lastY = event.clientY

      orbitByPixels(deltaX, deltaY)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement
      const isTypingTarget =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true"

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
          if (event.code === "NumpadAdd") {
            event.preventDefault()
            zoomByFactor(KEY_ZOOM_FACTOR)
          } else if (event.code === "NumpadSubtract") {
            event.preventDefault()
            zoomByFactor(1 / KEY_ZOOM_FACTOR)
          }
      }
    }

    element.addEventListener("pointerdown", onPointerDown)
    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", endRotation)
    window.addEventListener("pointercancel", endRotation)
    window.addEventListener("keydown", onKeyDown)

    return () => {
      element.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", endRotation)
      window.removeEventListener("pointercancel", endRotation)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [camera, gl])

  return <OrbitControls
    ref={(instance) => {
      controlsRef.current = instance
    }}
    enablePan
    enableZoom
    enableRotate={false}
    minDistance={MIN_CAMERA_DISTANCE}
    maxDistance={MAX_CAMERA_DISTANCE}
    autoRotate={false}
  />
}

function Scene({
  selectedPlanet,
  onSelectPlanet,
}: {
  selectedPlanet: PlanetData | null
  onSelectPlanet: (planet: PlanetData | null) => void
}) {
  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={DEFAULT_CAMERA_POSITION_ARRAY}
        fov={60}
        onUpdate={(nextCamera) => nextCamera.lookAt(DEFAULT_CAMERA_TARGET)}
      />
      <InvertedOrbitControls />

      {/* Ambient light for general visibility */}
      <ambientLight intensity={0.05} />

      {/* Stars background */}
      <Stars />

      {/* Sun at center */}
      <Sun />

      {/* Planets */}
      {PLANETS.map((planet) => (
        <Planet
          key={planet.name}
          data={planet}
          timeScale={1}
          showOrbits
          showLabels
          onSelect={onSelectPlanet}
          isSelected={selectedPlanet?.name === planet.name}
        />
      ))}
    </>
  )
}

export function SolarSystem() {
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(null)

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-background">
      <div
        className="absolute inset-0"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingRight: "env(safe-area-inset-right)",
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
        }}
      >
        <Canvas className="size-full">
          <Suspense fallback={null}>
            <Scene
              selectedPlanet={selectedPlanet}
              onSelectPlanet={setSelectedPlanet}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Planet Info Panel */}
      {selectedPlanet && (
        <div className="relative z-20">
          <PlanetInfo
            planet={selectedPlanet}
            onClose={() => setSelectedPlanet(null)}
          />
        </div>
      )}

      {/* Title */}
      <div
        className="absolute left-1/2 z-10 -translate-x-1/2 text-center pointer-events-none"
        style={{
          top: "calc(env(safe-area-inset-top) + 1.5rem)",
        }}
      >
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          Solar System
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Interactive 3D Simulator
        </p>
      </div>
    </div>
  )
}
