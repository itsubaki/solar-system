"use client"

import { Suspense, useState, useEffect, useMemo, useRef } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { Spherical, Vector3 } from "three"
import { PLANETS, ASTRONOMICAL_UNIT, type PlanetData } from "@/lib/planet-data"
import { getInitialOrbitAngle } from "@/lib/planet-angle"
import { Clock } from "./clock"
import { Sun } from "./sun"
import { Planet } from "./planet"
import { Stars } from "./stars"
import { PlanetInfo } from "./planet-info"

type OrbitControlsRef = {
    target: Vector3
    update: () => void
}

type FocusTargetRef = {
    current: Vector3 | null
}

const ORBIT_SPEED_OPTIONS = [
    { label: "Real-time", multiplier: 1 },
    { label: "1 min / sec", multiplier: 60 },
    { label: "1 hr / sec", multiplier: 3600 },
    { label: "1 day / sec", multiplier: 86400 },
    { label: "1 week / sec", multiplier: 604800 },
    { label: "30 days / sec", multiplier: 2592000 },
    { label: "1 year / sec", multiplier: 31536000 },
] as const

const PLANET_SCALE_OPTIONS = [
    { scale: 1, label: "x1", sup: "0" },
    { scale: 10, label: "x10", sup: "3" },
    { scale: 100, label: "x100", sup: "6" },
    { scale: 1000, label: "x1,000", sup: "9" },
] as const

const DEFAULT_CAMERA_TARGET = new Vector3(0, 0, 0)
const DEFAULT_CAMERA_POSITION = new Vector3(2, 2, 2)
const DEFAULT_CAMERA_POSITION_ARRAY = [2, 2, 2] as const
const DEFAULT_CAMERA_OFFSET = DEFAULT_CAMERA_POSITION.clone().sub(DEFAULT_CAMERA_TARGET)
const MIN_CAMERA_DISTANCE = 0.15
const MAX_CAMERA_DISTANCE = 80
const KEY_ROTATE_PIXELS = 10
const KEY_ZOOM_FACTOR = 0.95

function PlanetOrbitControls({
    focusTarget,
}: {
    focusTarget: FocusTargetRef,
}) {
    const { camera, gl } = useThree()
    const controlsRef = useRef<OrbitControlsRef | null>(null)
    const followDeltaRef = useRef(new Vector3())

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
            const activeElement = document.activeElement;
            const isTypingTarget =
                activeElement instanceof HTMLInputElement ||
                activeElement instanceof HTMLTextAreaElement ||
                activeElement instanceof HTMLSelectElement ||
                activeElement?.getAttribute("contenteditable") === "true";

            if (isTypingTarget || event.metaKey || event.ctrlKey || event.altKey) return;

            switch (event.key) {
                case "r":
                case "R":
                    event.preventDefault();
                    resetCamera();
                    break;
                case "ArrowUp":
                    event.preventDefault();
                    orbitByPixels(0, KEY_ROTATE_PIXELS);
                    break;
                case "ArrowDown":
                    event.preventDefault();
                    orbitByPixels(0, -KEY_ROTATE_PIXELS);
                    break;
                case "ArrowLeft":
                    event.preventDefault();
                    orbitByPixels(-KEY_ROTATE_PIXELS, 0);
                    break;
                case "ArrowRight":
                    event.preventDefault();
                    orbitByPixels(KEY_ROTATE_PIXELS, 0);
                    break;
                case "+":
                    event.preventDefault();
                    zoomByFactor(KEY_ZOOM_FACTOR);
                    break;
                case "-":
                    event.preventDefault();
                    zoomByFactor(1 / KEY_ZOOM_FACTOR);
                    break;
                default:
                    break;
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
    }, [camera, focusTarget, gl])

    return <OrbitControls
        ref={(instance) => {
            controlsRef.current = instance
        }}
        enablePan={false}
        enableZoom
        enableRotate={false}
        maxPolarAngle={Math.PI / 2 - Math.PI / 16}
        minDistance={MIN_CAMERA_DISTANCE}
        maxDistance={MAX_CAMERA_DISTANCE}
        autoRotate={false}
    />
}

function Scene({
    orbitSpeedScale,
    selectedPlanet,
    onSelectPlanet,
    planetScale,
    planetScaleLabel,
    planetScaleSup,
}: {
    orbitSpeedScale: number
    selectedPlanet: PlanetData | null
    onSelectPlanet: (planet: PlanetData | null) => void
    planetScale: number
    planetScaleLabel: string
    planetScaleSup: string
}) {
    const focusedPlanetPositionRef = useRef<Vector3 | null>(null)
    const initialOrbitAngles = useMemo(
        () => Object.fromEntries(
            PLANETS.map((planet) => [planet.name, getInitialOrbitAngle(planet, new Date())])
        ),
        []
    )

    useEffect(() => {
        if (selectedPlanet) {
            return
        }

        if (focusedPlanetPositionRef.current) {
            focusedPlanetPositionRef.current.set(0, 0, 0)
            return
        }

        focusedPlanetPositionRef.current = new Vector3(0, 0, 0)
    }, [selectedPlanet])

    return (
        <>
            <PerspectiveCamera
                makeDefault
                position={DEFAULT_CAMERA_POSITION_ARRAY}
                fov={60}
                onUpdate={(nextCamera) => nextCamera.lookAt(DEFAULT_CAMERA_TARGET)}
            />

            <PlanetOrbitControls focusTarget={focusedPlanetPositionRef} />

            <Stars />

            <Sun
                onSelect={() => onSelectPlanet(null)}
                focusTargetRef={focusedPlanetPositionRef}
                scale={{
                    radius: 1 / ASTRONOMICAL_UNIT,
                }}
            />

            {PLANETS.map((planet) => (
                <Planet
                    key={planet.name}
                    data={planet}
                    initialOrbitAngle={initialOrbitAngles[planet.name]}
                    onSelect={onSelectPlanet}
                    isSelected={selectedPlanet?.name === planet.name}
                    focusTargetRef={selectedPlanet?.name === planet.name ? focusedPlanetPositionRef : null}
                    scale={{
                        distance: 1 / ASTRONOMICAL_UNIT,
                        radius: 1 / ASTRONOMICAL_UNIT * planetScale,
                        orbitSpeed: orbitSpeedScale,
                    }}
                />
            ))}

            <ambientLight intensity={0.05} />
        </>
    )
}

export function SolarSystem() {
    const [orbitSpeedIndex, setOrbitSpeedIndex] = useState(0)
    const [planetScaleIndex, setPlanetScaleIndex] = useState(3) // default to x1,000
    const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(null)
    const [showPlanetInfo, setShowPlanetInfo] = useState(false)
    const orbitSpeedScale = ORBIT_SPEED_OPTIONS[orbitSpeedIndex].multiplier
    const planetScale = PLANET_SCALE_OPTIONS[planetScaleIndex].scale
    const planetScaleLabel = PLANET_SCALE_OPTIONS[planetScaleIndex].label
    const planetScaleSup = PLANET_SCALE_OPTIONS[planetScaleIndex].sup

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const activeElement = document.activeElement;
            const isTypingTarget =
                activeElement instanceof HTMLInputElement ||
                activeElement instanceof HTMLTextAreaElement ||
                activeElement instanceof HTMLSelectElement ||
                activeElement?.getAttribute("contenteditable") === "true";
            if (isTypingTarget || event.metaKey || event.ctrlKey || event.altKey) return;

            switch (event.key) {
                case "R":
                    event.preventDefault();
                    setSelectedPlanet(null);
                    setShowPlanetInfo(false);
                    break;
                case ">":
                    event.preventDefault();
                    if (PLANETS.length === 0) return;
                    let nextIndex = 0;
                    if (selectedPlanet) {
                        const currentIndex = PLANETS.findIndex(p => p.name === selectedPlanet.name);
                        nextIndex = (currentIndex + 1) % PLANETS.length;
                    }
                    setSelectedPlanet(PLANETS[nextIndex]);
                    break;
                case "<":
                    event.preventDefault();
                    if (PLANETS.length === 0) return;
                    let prevIndex = PLANETS.length - 1;
                    if (selectedPlanet) {
                        const currentIndex = PLANETS.findIndex(p => p.name === selectedPlanet.name);
                        prevIndex = (currentIndex - 1 + PLANETS.length) % PLANETS.length;
                    }
                    setSelectedPlanet(PLANETS[prevIndex]);
                    break;
                case "a":
                    event.preventDefault();
                    setOrbitSpeedIndex((prev) => Math.max(0, prev - 1));
                    break;
                case "s":
                    event.preventDefault();
                    setOrbitSpeedIndex((prev) => Math.min(ORBIT_SPEED_OPTIONS.length - 1, prev + 1));
                    break;
                default:
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedPlanet]);

    const selectNextPlanet = () => {
        if (PLANETS.length === 0) return;
        let nextIndex = 0;
        if (selectedPlanet) {
            const currentIndex = PLANETS.findIndex(p => p.name === selectedPlanet.name);
            nextIndex = (currentIndex + 1) % PLANETS.length;
        }
        setSelectedPlanet(PLANETS[nextIndex]);
    };

    const selectPrevPlanet = () => {
        if (PLANETS.length === 0) return;
        let prevIndex = PLANETS.length - 1;
        if (selectedPlanet) {
            const currentIndex = PLANETS.findIndex(p => p.name === selectedPlanet.name);
            prevIndex = (currentIndex - 1 + PLANETS.length) % PLANETS.length;
        }
        setSelectedPlanet(PLANETS[prevIndex]);
    };

    return (
        <div className="relative w-full h-[100dvh] overflow-hidden bg-background">
            <div
                className="absolute left-1/2 z-10 -translate-x-1/2 text-center select-none"
                style={{
                    top: "calc(env(safe-area-inset-top) + 1.5rem)",
                }}
            >
                <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                    Solar System
                </h1>

                <button
                    type="button"
                    className="text-xs text-muted-foreground mt-1 bg-transparent border-none p-0 m-0 cursor-pointer font-normal select-none"
                    style={{ outline: "none" }}
                    aria-label="Change planet scale"
                    onClick={() => setPlanetScaleIndex((prev) => (prev + 1) % PLANET_SCALE_OPTIONS.length)}
                >
                    Planet radius {planetScaleLabel} (volume x10<sup>{planetScaleSup}</sup>)
                </button>
            </div>

            <div
                className="absolute left-0 top-0 z-50 m-4 rounded-xl bg-transparent p-4 text-xs text-card-foreground pointer-events-none select-none hidden sm:block"
                style={{ maxWidth: 260 }}
            >
                <div className="font-semibold mb-2">Shortcuts</div>
                <ul className="space-y-1">
                    <li><b>Arrow keys</b>: Rotate camera</li>
                    <li><b>r</b> / <b>R</b>: Reset camera</li>
                    <li><b>+</b> / <b>-</b>: Zoom in / out</li>
                    <li><b>&lt;</b> / <b>&gt;</b>: Previous / Next planet</li>
                    <li><b>a</b> / <b>s</b>: Adjust orbit speed</li>
                </ul>
            </div>

            <button
                aria-label="Previous planet"
                className="absolute left-0 top-1/2 z-50 -translate-y-1/2 text-4xl font-bold text-card-foreground bg-transparent border-none p-2 m-0 focus:outline-none select-none block sm:hidden transition-colors hover:bg-primary/15 hover:text-primary"
                style={{ pointerEvents: "auto", background: "none" }}
                onClick={selectPrevPlanet}
                tabIndex={0}
            >
                &lt;
            </button>

            <button
                aria-label="Next planet"
                className="absolute right-0 top-1/2 z-50 -translate-y-1/2 text-4xl font-bold text-card-foreground bg-transparent border-none p-2 m-0 focus:outline-none select-none block sm:hidden transition-colors hover:bg-primary/15 hover:text-primary"
                style={{ pointerEvents: "auto", background: "none" }}
                onClick={selectNextPlanet}
                tabIndex={0}
            >
                &gt;
            </button>

            <div
                className="absolute inset-0 z-0"
                style={{
                    paddingTop: "env(safe-area-inset-top)",
                    paddingRight: "env(safe-area-inset-right)",
                    paddingBottom: "env(safe-area-inset-bottom)",
                    paddingLeft: "env(safe-area-inset-left)",
                    touchAction: "none",
                }}
            >
                <Canvas className="size-full touch-none">
                    <Suspense fallback={null}>
                        <Scene
                            orbitSpeedScale={orbitSpeedScale}
                            selectedPlanet={selectedPlanet}
                            onSelectPlanet={(planet) => {
                                if (planet && selectedPlanet && planet.name === selectedPlanet.name) {
                                    setShowPlanetInfo((prev) => {
                                        if (prev) {
                                            return false;
                                        } else {
                                            return true;
                                        }
                                    });
                                } else {
                                    setSelectedPlanet(planet);
                                    setShowPlanetInfo(!!planet);
                                }
                            }}
                            planetScale={planetScale}
                            planetScaleLabel={planetScaleLabel}
                            planetScaleSup={planetScaleSup}
                        />
                    </Suspense>
                </Canvas>
            </div>

            {selectedPlanet && showPlanetInfo && (
                <div className="relative z-20">
                    <PlanetInfo
                        planet={selectedPlanet}
                        onClose={() => setShowPlanetInfo(false)}
                    />
                </div>
            )}

            <div
                className="absolute z-40 flex flex-col items-end gap-1"
                style={{
                    right: "calc(env(safe-area-inset-right) + 1.5rem)",
                    bottom: "calc(env(safe-area-inset-bottom) + 1.5rem)",
                }}
            >
                <Clock orbitSpeedScale={orbitSpeedScale} />

                <button
                    type="button"
                    className="rounded-full bg-primary/15 px-2 py-1 text-[10px] font-medium text-primary transition hover:bg-primary/30 focus:outline-none"
                    style={{ cursor: "pointer", minWidth: "100px", marginRight: "6px" }}
                    aria-label="Change orbit speed"
                    onClick={() => setOrbitSpeedIndex((prev) => (prev + 1) % ORBIT_SPEED_OPTIONS.length)}
                >
                    {ORBIT_SPEED_OPTIONS[orbitSpeedIndex].label}
                </button>
            </div>
        </div>
    )
}
