"use client"

import { Suspense, useState, useEffect, useMemo, useRef, useCallback } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { Spherical, Vector3 } from "three"
import { ASTRONOMICAL_UNIT } from "@/lib/orbit"
import { PLANETS, DWARF_PLANETS, type PlanetData, type SatelliteData } from "@/lib/planet-data"
import { COMETS, type CometData } from "@/lib/comet-data"
import { PROBES, type ProbeData } from "@/lib/probe-data"
import { Clock } from "./clock"
import { Comet } from "./comet"
import { CometInfo } from "./comet-info"
import { Sun } from "./sun"
import { SunInfo } from "./sun-info"
import { Planet } from "./planet"
import { Probe } from "./probe"
import { Stars } from "./stars"
import { PlanetInfo } from "./planet-info"
import { ProbeInfo } from "./probe-info"
import { SatelliteInfo } from "./satellite-info"

type OrbitControlsRef = {
    target: Vector3
    update: () => void
}

type FocusTargetRef = {
    current: Vector3 | null
}

type SelectedSatellite = SatelliteData & { parentPlanetName: string }
type SelectableTarget =
    | { type: "sun" }
    | { type: "planet"; planet: PlanetData }
    | { type: "satellite"; satellite: SelectedSatellite }
    | { type: "comet"; comet: CometData }
    | { type: "probe"; probe: ProbeData }

const ORBIT_SPEED_OPTIONS = [
    { label: "Real-time", multiplier: 1 },
    { label: "1 min / sec", multiplier: 60 },
    { label: "1 hour / sec", multiplier: 3600 },
    { label: "1 day / sec", multiplier: 86400 },
    { label: "1 week / sec", multiplier: 604800 },
    { label: "30 days / sec", multiplier: 2592000 },
    { label: "1 year / sec", multiplier: 31536000 },
] as const

type PlanetScaleOption = {
    scale: number
    label: string
    sup: string
}
const PLANET_SCALE_OPTIONS: readonly PlanetScaleOption[] = [
    { scale: 1, label: "x1", sup: "0" },
    { scale: 10, label: "x10", sup: "3" },
    { scale: 100, label: "x100", sup: "6" },
    { scale: 1000, label: "x1,000", sup: "9" },
    { scale: 2000, label: "x2,000", sup: "9.903" },
    { scale: 3000, label: "x3,000", sup: "10.431" },
]

const DEFAULT_CAMERA_TARGET = new Vector3(0, 0, 0)
const DEFAULT_CAMERA_POSITION = new Vector3(2, 2, 2)
const DEFAULT_CAMERA_POSITION_ARRAY = [2, 2, 2] as const
const DEFAULT_CAMERA_OFFSET = DEFAULT_CAMERA_POSITION.clone().sub(DEFAULT_CAMERA_TARGET)
const MIN_CAMERA_DISTANCE = 0.15
const MAX_CAMERA_DISTANCE = 400
const KEY_ROTATE_PIXELS = 10
const KEY_ZOOM_FACTOR = 0.95
const DWARF_PLANET_NAMES = new Set(DWARF_PLANETS.map((planet) => planet.name))

function getVisiblePlanets(showDwarfPlanets: boolean) {
    return [...(showDwarfPlanets ? [...PLANETS, ...DWARF_PLANETS] : PLANETS)]
        .sort((leftPlanet, rightPlanet) => leftPlanet.distance - rightPlanet.distance)
}

function getSelectableTargets(
    planets: PlanetData[],
    showSatellites: boolean,
    showComets: boolean,
    showProbes: boolean
): SelectableTarget[] {
    const targets: SelectableTarget[] = [{ type: "sun" as const }]

    targets.push(...planets.flatMap((planet) => {
        const targets: SelectableTarget[] = [{ type: "planet", planet }]

        if (!showSatellites || !Array.isArray(planet.satellites)) {
            return targets
        }

        return [
            ...targets,
            ...planet.satellites.map((satellite) => ({
                type: "satellite" as const,
                satellite: {
                    ...satellite,
                    parentPlanetName: planet.name,
                },
            })),
        ]
    }))

    if (showComets) {
        targets.push(...COMETS.map((comet) => ({ type: "comet" as const, comet })))
    }

    if (showProbes) {
        targets.push(...PROBES.map((probe) => ({ type: "probe" as const, probe })))
    }

    return targets
}

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
        maxPolarAngle={Math.PI}
        minDistance={MIN_CAMERA_DISTANCE}
        maxDistance={MAX_CAMERA_DISTANCE}
        autoRotate={false}
    />
}

function Scene({
    selectedComet,
    selectedPlanet,
    selectedProbe,
    selectedSatellite,
    selectedSun,
    showDwarfPlanets,
    showComets,
    showProbes,
    onSelectComet,
    onSelectPlanet,
    onSelectProbe,
    onSelectSatellite,
    onSelectSun,
    planetScaleOption,
    simTimeRef,
}: {
    selectedComet: CometData | null
    selectedPlanet: PlanetData | null
    selectedProbe: ProbeData | null
    selectedSatellite: SelectedSatellite | null
    selectedSun: boolean
    showDwarfPlanets: boolean
    showComets: boolean
    showProbes: boolean
    onSelectComet: (comet: CometData | null) => void
    onSelectPlanet: (planet: PlanetData | null) => void
    onSelectProbe: (probe: ProbeData | null) => void
    onSelectSatellite: (satellite: SelectedSatellite) => void
    onSelectSun: () => void
    planetScaleOption: PlanetScaleOption
    simTimeRef: { current: Date }
}) {
    const visiblePlanets = useMemo(
        () => getVisiblePlanets(showDwarfPlanets),
        [showDwarfPlanets]
    )
    const focusedPlanetPositionRef = useRef<Vector3 | null>(null)
    const [cameraDistance, setCameraDistance] = useState(DEFAULT_CAMERA_OFFSET.length())
    const lastCameraDistanceRef = useRef(DEFAULT_CAMERA_OFFSET.length())

    useFrame(({ camera }) => {
        const currentTarget = focusedPlanetPositionRef.current ?? DEFAULT_CAMERA_TARGET
        const nextCameraDistance = camera.position.distanceTo(currentTarget)
        if (Math.abs(nextCameraDistance - lastCameraDistanceRef.current) < 0.005) return

        lastCameraDistanceRef.current = nextCameraDistance
        setCameraDistance(nextCameraDistance)
    })

    useEffect(() => {
        if (selectedSun) {
            if (focusedPlanetPositionRef.current) {
                focusedPlanetPositionRef.current.set(0, 0, 0)
            } else {
                focusedPlanetPositionRef.current = new Vector3(0, 0, 0)
            }
            return
        }

        if (selectedSun || selectedPlanet || selectedProbe || selectedComet || selectedSatellite) {
            return
        }

        if (focusedPlanetPositionRef.current) {
            focusedPlanetPositionRef.current.set(0, 0, 0)
            return
        }

        focusedPlanetPositionRef.current = new Vector3(0, 0, 0)
    }, [selectedComet, selectedPlanet, selectedProbe, selectedSatellite, selectedSun])

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
                onSelect={onSelectSun}
                focusTargetRef={focusedPlanetPositionRef}
                isSelected={selectedSun}
                scale={{
                    radius: 1 / ASTRONOMICAL_UNIT,
                }}
            />

            {visiblePlanets.map((planet) => (
                <Planet
                    key={planet.name}
                    data={planet}
                    onSelect={onSelectPlanet}
                    onSelectSatellite={onSelectSatellite}
                    selectedSatellite={selectedSatellite}
                    isSelected={selectedPlanet?.name === planet.name}
                    showSatellites={planetScaleOption.scale === 1}
                    focusTargetRef={selectedPlanet?.name === planet.name || selectedSatellite?.parentPlanetName === planet.name ? focusedPlanetPositionRef : null}
                    cameraDistance={cameraDistance}
                    simTimeRef={simTimeRef}
                    scale={{
                        distance: 1 / ASTRONOMICAL_UNIT,
                        radius: 1 / ASTRONOMICAL_UNIT * planetScaleOption.scale,
                    }}
                />
            ))}

            {showComets && COMETS.map((comet) => (
                <Comet
                    key={comet.name}
                    data={comet}
                    onSelect={onSelectComet}
                    isSelected={selectedComet?.name === comet.name}
                    focusTargetRef={selectedComet?.name === comet.name ? focusedPlanetPositionRef : null}
                    simTimeRef={simTimeRef}
                    scale={{
                        distance: 1 / ASTRONOMICAL_UNIT,
                        radius: 1 / ASTRONOMICAL_UNIT * planetScaleOption.scale,
                    }}
                />
            ))}

            {showProbes && PROBES.map((probe) => (
                <Probe
                    key={probe.name}
                    data={probe}
                    onSelect={onSelectProbe}
                    isSelected={selectedProbe?.name === probe.name}
                    focusTargetRef={selectedProbe?.name === probe.name ? focusedPlanetPositionRef : null}
                    simTimeRef={simTimeRef}
                    scale={{
                        distance: 1 / ASTRONOMICAL_UNIT,
                        radius: 1 / ASTRONOMICAL_UNIT * planetScaleOption.scale,
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
    const [showDwarfPlanets, setShowDwarfPlanets] = useState(false)
    const [showComets, setShowComets] = useState(false)
    const [showProbes, setShowProbes] = useState(false)
    const [showPlanetInfo, setShowPlanetInfo] = useState(false)
    const [selectedComet, setSelectedComet] = useState<CometData | null>(null)
    const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(null)
    const [selectedProbe, setSelectedProbe] = useState<ProbeData | null>(null)
    const [selectedSatellite, setSelectedSatellite] = useState<SelectedSatellite | null>(null)
    const [selectedSun, setSelectedSun] = useState(false)
    const [displaySimTime, setDisplaySimTime] = useState(() => new Date())
    const simTimeRef = useRef(displaySimTime)
    const orbitSpeedScale = ORBIT_SPEED_OPTIONS[orbitSpeedIndex].multiplier
    const planetScaleOption = PLANET_SCALE_OPTIONS[planetScaleIndex]
    const showSatellites = planetScaleOption.scale === 1
    const visiblePlanets = useMemo(
        () => getVisiblePlanets(showDwarfPlanets),
        [showDwarfPlanets]
    )
    const selectableTargets = useMemo(
        () => getSelectableTargets(visiblePlanets, showSatellites, showComets, showProbes),
        [showComets, showProbes, showSatellites, visiblePlanets]
    )

    const selectTarget = useCallback((target: SelectableTarget) => {
        if (target.type === "sun") {
            setSelectedComet(null)
            setSelectedProbe(null)
            setSelectedSun(true)
            setSelectedPlanet(null)
            setSelectedSatellite(null)
            return
        }

        setSelectedSun(false)

        if (target.type === "satellite") {
            setSelectedComet(null)
            setSelectedProbe(null)
            setSelectedPlanet(null)
            setSelectedSatellite(target.satellite)
            return
        }

        if (target.type === "planet") {
            setSelectedComet(null)
            setSelectedProbe(null)
            setSelectedSatellite(null)
            setSelectedPlanet(target.planet)
            return
        }

        setSelectedSatellite(null)
        setSelectedPlanet(null)

        if (target.type === "comet") {
            setSelectedProbe(null)
            setSelectedComet(target.comet)
            return
        }

        setSelectedComet(null)
        setSelectedProbe(target.probe)
    }, [])

    const getSelectedTargetIndex = useCallback(() => {
        if (selectedSun) {
            return selectableTargets.findIndex((target) => target.type === "sun")
        }

        if (selectedComet) {
            return selectableTargets.findIndex(
                (target) => target.type === "comet" && target.comet.name === selectedComet.name
            )
        }

        if (selectedProbe) {
            return selectableTargets.findIndex(
                (target) => target.type === "probe" && target.probe.name === selectedProbe.name
            )
        }

        if (selectedSatellite) {
            return selectableTargets.findIndex(
                (target) =>
                    target.type === "satellite" &&
                    target.satellite.name === selectedSatellite.name &&
                    target.satellite.parentPlanetName === selectedSatellite.parentPlanetName
            )
        }

        if (selectedPlanet) {
            return selectableTargets.findIndex(
                (target) => target.type === "planet" && target.planet.name === selectedPlanet.name
            )
        }

        return -1
    }, [selectableTargets, selectedComet, selectedPlanet, selectedProbe, selectedSatellite, selectedSun])

    const toggleComets = useCallback(() => {
        setShowComets((prev) => {
            const next = !prev
            if (!next) {
                setSelectedComet(null)
                if (selectedComet) {
                    setShowPlanetInfo(false)
                }
            }
            return next
        })
    }, [selectedComet])

    const toggleDwarfPlanets = useCallback(() => {
        setShowDwarfPlanets((prev) => {
            const next = !prev
            if (!next && selectedPlanet && DWARF_PLANET_NAMES.has(selectedPlanet.name)) {
                setSelectedPlanet(null)
                setSelectedSatellite(null)
                setShowPlanetInfo(false)
            }
            return next
        })
    }, [selectedPlanet])

    const updatePlanetScaleIndex = useCallback((updater: (prev: number) => number) => {
        setPlanetScaleIndex((prev) => {
            const next = updater(prev)
            if (PLANET_SCALE_OPTIONS[next].scale !== 1) {
                setSelectedSatellite(null)
                if (selectedSatellite) {
                    setShowPlanetInfo(false)
                }
            }
            return next
        })
    }, [selectedSatellite])

    const toggleProbes = useCallback(() => {
        setShowProbes((prev) => {
            const next = !prev
            if (!next) {
                setSelectedProbe(null)
                if (selectedProbe) {
                    setShowPlanetInfo(false)
                }
            }
            return next
        })
    }, [selectedProbe])

    useEffect(() => {
        let frameId: number
        let lastReal = Date.now()
        let lastPublished = lastReal

        const tick = () => {
            const now = Date.now()
            const elapsedMilliseconds = now - lastReal
            lastReal = now

            simTimeRef.current = new Date(
                simTimeRef.current.getTime() + elapsedMilliseconds * orbitSpeedScale
            )

            if (now - lastPublished >= 250) {
                lastPublished = now
                setDisplaySimTime(new Date(simTimeRef.current.getTime()))
            }

            frameId = requestAnimationFrame(tick)
        }

        frameId = requestAnimationFrame(tick)

        return () => {
            cancelAnimationFrame(frameId)
        }
    }, [orbitSpeedScale])

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
                    setSelectedComet(null);
                    setSelectedPlanet(null);
                    setSelectedProbe(null);
                    setSelectedSatellite(null);
                    setSelectedSun(false);
                    setShowPlanetInfo(false);
                    break;
                case ">":
                    event.preventDefault();
                    if (selectableTargets.length === 0) return;
                    let nextIndex = 0;
                    const currentIndex = getSelectedTargetIndex();
                    if (currentIndex >= 0) {
                        nextIndex = (currentIndex + 1) % selectableTargets.length;
                    }
                    selectTarget(selectableTargets[nextIndex]);
                    break;
                case "<":
                    event.preventDefault();
                    if (selectableTargets.length === 0) return;
                    let prevIndex = selectableTargets.length - 1;
                    const previousIndex = getSelectedTargetIndex();
                    if (previousIndex >= 0) {
                        prevIndex = (previousIndex - 1 + selectableTargets.length) % selectableTargets.length;
                    }
                    selectTarget(selectableTargets[prevIndex]);
                    break;
                case "a":
                    event.preventDefault();
                    setOrbitSpeedIndex((prev) => Math.max(0, prev - 1));
                    break;
                case "s":
                    event.preventDefault();
                    setOrbitSpeedIndex((prev) => Math.min(ORBIT_SPEED_OPTIONS.length - 1, prev + 1));
                    break;
                case "z":
                    event.preventDefault();
                    updatePlanetScaleIndex((prev) => Math.max(0, prev - 1));
                    break;
                case "x":
                    event.preventDefault();
                    updatePlanetScaleIndex((prev) => Math.min(PLANET_SCALE_OPTIONS.length - 1, prev + 1));
                    break;
                case "c":
                    event.preventDefault();
                    toggleComets();
                    break;
                case "d":
                    event.preventDefault();
                    toggleDwarfPlanets();
                    break;
                case "p":
                    event.preventDefault();
                    toggleProbes();
                    break;
                default:
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [getSelectedTargetIndex, selectTarget, selectableTargets, selectedComet, selectedPlanet, selectedProbe, toggleComets, toggleDwarfPlanets, toggleProbes, updatePlanetScaleIndex]);

    const selectNextPlanet = () => {
        if (selectableTargets.length === 0) return;
        let nextIndex = 0;
        const currentIndex = getSelectedTargetIndex();
        if (currentIndex >= 0) {
            nextIndex = (currentIndex + 1) % selectableTargets.length;
        }
        selectTarget(selectableTargets[nextIndex]);
    };

    const selectPrevPlanet = () => {
        if (selectableTargets.length === 0) return;
        let prevIndex = selectableTargets.length - 1;
        const currentIndex = getSelectedTargetIndex();
        if (currentIndex >= 0) {
            prevIndex = (currentIndex - 1 + selectableTargets.length) % selectableTargets.length;
        }
        selectTarget(selectableTargets[prevIndex]);
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
                    onClick={() => updatePlanetScaleIndex((prev) => (prev + 1) % PLANET_SCALE_OPTIONS.length)}
                >
                    Planet radius {planetScaleOption.label} (volume x10<sup>{planetScaleOption.sup}</sup>)
                </button>
            </div>

            <div
                className="absolute left-0 top-0 z-50 m-4 rounded-xl bg-transparent p-4 text-xs text-card-foreground pointer-events-none select-none hidden sm:block"
                style={{ maxWidth: 260 }}
            >
                <div className="font-semibold mb-2">Shortcuts</div>
                <ul className="space-y-1">
                    <li><b>Arrow keys</b>: Rotate camera</li>
                    <li><b>r</b> / <b>R</b>: Reset</li>
                    <li><b>+</b> / <b>-</b>: Zoom</li>
                    <li><b>&lt;</b> / <b>&gt;</b>: Move</li>
                    <li><b>a</b> / <b>s</b>: Orbit speed</li>
                    <li><b>z</b> / <b>x</b>: Planet radius</li>
                    <li><b>d</b>: Dwarfs</li>
                    <li><b>c</b>: Comets</li>
                    <li><b>p</b>: Probes</li>
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
                className="absolute bottom-0 left-0 z-40 flex flex-col gap-2 sm:hidden"
                style={{
                    left: "calc(env(safe-area-inset-left) + 1rem)",
                    bottom: "calc(env(safe-area-inset-bottom) + 1.5rem)",
                }}
            >
                <button
                    type="button"
                    className={`rounded-full px-2 py-1 text-[10px] font-medium transition focus:outline-none ${showDwarfPlanets ? "bg-primary text-primary-foreground" : "bg-background/65 text-foreground ring-1 ring-white/15 backdrop-blur-sm"}`}
                    aria-pressed={showDwarfPlanets}
                    onClick={toggleDwarfPlanets}
                >
                    Dwarfs
                </button>

                <button
                    type="button"
                    className={`rounded-full px-2 py-1 text-[10px] font-medium transition focus:outline-none ${showComets ? "bg-primary text-primary-foreground" : "bg-background/65 text-foreground ring-1 ring-white/15 backdrop-blur-sm"}`}
                    aria-pressed={showComets}
                    onClick={toggleComets}
                >
                    Comets
                </button>

                <button
                    type="button"
                    className={`rounded-full px-2 py-1 text-[10px] font-medium transition focus:outline-none ${showProbes ? "bg-primary text-primary-foreground" : "bg-background/65 text-foreground ring-1 ring-white/15 backdrop-blur-sm"}`}
                    aria-pressed={showProbes}
                    onClick={toggleProbes}
                >
                    Probes
                </button>
            </div>

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
                            selectedComet={selectedComet}
                            selectedPlanet={selectedPlanet}
                            selectedProbe={selectedProbe}
                            selectedSatellite={selectedSatellite}
                            selectedSun={selectedSun}
                            showDwarfPlanets={showDwarfPlanets}
                            showComets={showComets}
                            showProbes={showProbes}
                            onSelectSun={() => {
                                if (selectedSun) {
                                    setShowPlanetInfo((prev) => !prev)
                                } else {
                                    setSelectedComet(null)
                                    setSelectedPlanet(null)
                                    setSelectedProbe(null)
                                    setSelectedSatellite(null)
                                    setSelectedSun(true)
                                    setShowPlanetInfo(true)
                                }
                            }}
                            onSelectComet={(comet) => {
                                if (comet && selectedComet && comet.name === selectedComet.name) {
                                    setShowPlanetInfo((prev) => !prev);
                                } else {
                                    setSelectedComet(comet);
                                    setSelectedPlanet(null);
                                    setSelectedProbe(null);
                                    setSelectedSatellite(null);
                                    setSelectedSun(false);
                                    setShowPlanetInfo(!!comet);
                                }
                            }}
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
                                    setSelectedComet(null);
                                    setSelectedPlanet(planet);
                                    setSelectedProbe(null);
                                    setSelectedSatellite(null);
                                    setSelectedSun(false);
                                    setShowPlanetInfo(!!planet);
                                }
                            }}
                            onSelectProbe={(probe) => {
                                if (probe && selectedProbe && probe.name === selectedProbe.name) {
                                    setShowPlanetInfo((prev) => {
                                        if (prev) {
                                            return false;
                                        } else {
                                            return true;
                                        }
                                    });
                                } else {
                                    setSelectedComet(null);
                                    setSelectedProbe(probe);
                                    setSelectedPlanet(null);
                                    setSelectedSatellite(null);
                                    setSelectedSun(false);
                                    setShowPlanetInfo(!!probe);
                                }
                            }}
                            onSelectSatellite={(satellite) => {
                                if (
                                    selectedSatellite &&
                                    satellite.name === selectedSatellite.name &&
                                    satellite.parentPlanetName === selectedSatellite.parentPlanetName
                                ) {
                                    setShowPlanetInfo((prev) => !prev)
                                } else {
                                    setSelectedComet(null)
                                    setSelectedProbe(null)
                                    setSelectedSun(false)
                                    setSelectedPlanet(null)
                                    setSelectedSatellite(satellite)
                                    setShowPlanetInfo(true)
                                }
                            }}
                            planetScaleOption={planetScaleOption}
                            simTimeRef={simTimeRef}
                        />
                    </Suspense>
                </Canvas>
            </div>

            {selectedSun && showPlanetInfo && (
                <div className="relative z-20">
                    <SunInfo onClose={() => setShowPlanetInfo(false)} />
                </div>
            )}

            {selectedSatellite && showPlanetInfo && (
                <div className="relative z-20">
                    <SatelliteInfo
                        satellite={selectedSatellite}
                        onClose={() => setShowPlanetInfo(false)}
                    />
                </div>
            )}

            {selectedPlanet && showPlanetInfo && (
                <div className="relative z-20">
                    <PlanetInfo
                        planet={selectedPlanet}
                        onClose={() => setShowPlanetInfo(false)}
                    />
                </div>
            )}

            {selectedComet && showPlanetInfo && (
                <div className="relative z-20">
                    <CometInfo
                        comet={selectedComet}
                        onClose={() => setShowPlanetInfo(false)}
                    />
                </div>
            )}

            {selectedProbe && showPlanetInfo && (
                <div className="relative z-20">
                    <ProbeInfo
                        probe={selectedProbe}
                        simTime={displaySimTime}
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
                <Clock simTime={displaySimTime} />

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
