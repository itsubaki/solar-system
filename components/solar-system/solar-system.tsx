"use client"

import { Suspense, useState, useEffect, useMemo, useRef, useCallback } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { PerspectiveCamera } from "@react-three/drei"
import { Vector3 } from "three"
import {
    DEFAULT_CAMERA_DISTANCE,
    DEFAULT_CAMERA_POSITION_ARRAY,
    ZOOM_SLIDER_MAX,
    ZOOM_SLIDER_MIN,
    getCameraDistanceFromSliderValue,
    getZoomSliderValue,
    isShortcutBlockedTarget,
} from "@/lib/camera-controls"
import { ASTRONOMICAL_UNIT } from "@/lib/orbit"
import { PLANETS, DWARF_PLANETS, type PlanetData, type SatelliteData } from "@/lib/planet-data"
import { COMETS, type CometData } from "@/lib/comet-data"
import { PROBES, type ProbeData } from "@/lib/probe-data"
import { Clock } from "./clock"
import { Sun } from "./sun"
import { SunInfo } from "./sun-info"
import { Planet } from "./planet"
import { PlanetInfo } from "./planet-info"
import { SatelliteInfo } from "./satellite-info"
import { Comet } from "./comet"
import { CometInfo } from "./comet-info"
import { Probe } from "./probe"
import { ProbeInfo } from "./probe-info"
import { Stars } from "./stars"
import { PlanetOrbitControls } from "./orbit-controls"

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

type ObjectScaleOption = {
    scale: number
    label: string
    sup: string
}

const OBJECT_SCALE_OPTIONS: readonly ObjectScaleOption[] = [
    { scale: 1, label: "x1", sup: "0" },
    { scale: 10, label: "x10", sup: "3" },
    { scale: 100, label: "x100", sup: "6" },
    { scale: 1000, label: "x1,000", sup: "9" },
    { scale: 2000, label: "x2,000", sup: "9.903" },
    { scale: 3000, label: "x3,000", sup: "10.431" },
]

const DEFAULT_CAMERA_TARGET = new Vector3(0, 0, 0)
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
    objectScaleOption,
    desiredCameraDistance,
    onCameraDistanceChange,
    onDesiredCameraDistanceChange,
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
    objectScaleOption: ObjectScaleOption
    desiredCameraDistance: number | null
    onCameraDistanceChange: (distance: number) => void
    onDesiredCameraDistanceChange: (distance: number) => void
    simTimeRef: { current: Date }
}) {
    const visiblePlanets = useMemo(
        () => getVisiblePlanets(showDwarfPlanets),
        [showDwarfPlanets]
    )
    const hasSelection = selectedSun || !!selectedPlanet || !!selectedSatellite || !!selectedComet || !!selectedProbe
    const shouldDimOrbits = hasSelection && !selectedSun
    const focusedPlanetPositionRef = useRef<Vector3 | null>(null)
    const [cameraDistance, setCameraDistance] = useState(DEFAULT_CAMERA_DISTANCE)
    const lastCameraDistanceRef = useRef(DEFAULT_CAMERA_DISTANCE)

    useFrame(({ camera }) => {
        const currentTarget = focusedPlanetPositionRef.current ?? DEFAULT_CAMERA_TARGET
        const nextCameraDistance = camera.position.distanceTo(currentTarget)
        if (Math.abs(nextCameraDistance - lastCameraDistanceRef.current) < 0.005) return

        lastCameraDistanceRef.current = nextCameraDistance
        setCameraDistance(nextCameraDistance)
        onCameraDistanceChange(nextCameraDistance)
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
                near={0.001}
                far={2000}
                onUpdate={(nextCamera) => nextCamera.lookAt(DEFAULT_CAMERA_TARGET)}
            />

            <PlanetOrbitControls
                focusTarget={focusedPlanetPositionRef}
                desiredCameraDistance={desiredCameraDistance}
                onDesiredCameraDistanceChange={onDesiredCameraDistanceChange}
            />

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
                    hasSelection={hasSelection}
                    dimOrbit={shouldDimOrbits && selectedPlanet?.name !== planet.name}
                    showSatellites={objectScaleOption.scale === 1}
                    focusTargetRef={selectedPlanet?.name === planet.name || selectedSatellite?.parentPlanetName === planet.name ? focusedPlanetPositionRef : null}
                    cameraDistance={cameraDistance}
                    simTimeRef={simTimeRef}
                    scale={{
                        distance: 1 / ASTRONOMICAL_UNIT,
                        radius: 1 / ASTRONOMICAL_UNIT * objectScaleOption.scale,
                    }}
                />
            ))}

            {showComets && COMETS.map((comet) => (
                <Comet
                    key={comet.name}
                    data={comet}
                    onSelect={onSelectComet}
                    isSelected={selectedComet?.name === comet.name}
                    dimOrbit={shouldDimOrbits && selectedComet?.name !== comet.name}
                    focusTargetRef={selectedComet?.name === comet.name ? focusedPlanetPositionRef : null}
                    simTimeRef={simTimeRef}
                    scale={{
                        distance: 1 / ASTRONOMICAL_UNIT,
                        radius: 1 / ASTRONOMICAL_UNIT * objectScaleOption.scale,
                    }}
                />
            ))}

            {showProbes && PROBES.map((probe) => (
                <Probe
                    key={probe.name}
                    data={probe}
                    onSelect={onSelectProbe}
                    isSelected={selectedProbe?.name === probe.name}
                    dimOrbit={shouldDimOrbits && selectedProbe?.name !== probe.name}
                    focusTargetRef={selectedProbe?.name === probe.name ? focusedPlanetPositionRef : null}
                    simTimeRef={simTimeRef}
                    scale={{
                        distance: 1 / ASTRONOMICAL_UNIT,
                        radius: 1 / ASTRONOMICAL_UNIT * objectScaleOption.scale,
                    }}
                />
            ))}

            <ambientLight intensity={0.05} />
        </>
    )
}

export function SolarSystem() {
    const [orbitSpeedIndex, setOrbitSpeedIndex] = useState(0)
    const [objectScaleIndex, setObjectScaleIndex] = useState(0)
    const [showDwarfPlanets, setShowDwarfPlanets] = useState(false)
    const [showComets, setShowComets] = useState(false)
    const [showProbes, setShowProbes] = useState(false)
    const [showPlanetInfo, setShowPlanetInfo] = useState(false)
    const [selectedComet, setSelectedComet] = useState<CometData | null>(null)
    const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(null)
    const [selectedProbe, setSelectedProbe] = useState<ProbeData | null>(null)
    const [selectedSatellite, setSelectedSatellite] = useState<SelectedSatellite | null>(null)
    const [selectedSun, setSelectedSun] = useState(false)
    const [cameraDistance, setCameraDistance] = useState(DEFAULT_CAMERA_DISTANCE)
    const [desiredCameraDistance, setDesiredCameraDistance] = useState<number | null>(DEFAULT_CAMERA_DISTANCE)
    const [displaySimTime, setDisplaySimTime] = useState(() => new Date())
    const simTimeRef = useRef(displaySimTime)
    const orbitSpeedScale = ORBIT_SPEED_OPTIONS[orbitSpeedIndex].multiplier
    const objectScaleOption = OBJECT_SCALE_OPTIONS[objectScaleIndex]
    const showSatellites = objectScaleOption.scale === 1
    const zoomSliderValue = getZoomSliderValue(desiredCameraDistance ?? cameraDistance)
    const zoomSliderThumbTop = `${((ZOOM_SLIDER_MAX - zoomSliderValue) / (ZOOM_SLIDER_MAX - ZOOM_SLIDER_MIN)) * 100}%`

    const visiblePlanets = useMemo(
        () => getVisiblePlanets(showDwarfPlanets),
        [showDwarfPlanets]
    )

    const selectableTargets = useMemo(
        () => getSelectableTargets(visiblePlanets, showSatellites, showComets, showProbes),
        [showComets, showProbes, showSatellites, visiblePlanets]
    )

    const handleCameraDistanceChange = useCallback((nextCameraDistance: number) => {
        setCameraDistance(nextCameraDistance)
    }, [])

    const handleDesiredCameraDistanceChange = useCallback((nextCameraDistance: number) => {
        setDesiredCameraDistance(nextCameraDistance)
    }, [])

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

    const updateObjectScaleIndex = useCallback((updater: (prev: number) => number) => {
        setObjectScaleIndex((prev) => {
            const next = updater(prev)
            if (OBJECT_SCALE_OPTIONS[next].scale !== 1) {
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

    const selectNextTarget = useCallback(() => {
        if (selectableTargets.length === 0) return

        let nextIndex = 0
        const currentIndex = getSelectedTargetIndex()
        if (currentIndex >= 0) {
            nextIndex = (currentIndex + 1) % selectableTargets.length
        }

        selectTarget(selectableTargets[nextIndex])
    }, [getSelectedTargetIndex, selectTarget, selectableTargets])

    const selectPrevTarget = useCallback(() => {
        if (selectableTargets.length === 0) return

        let previousIndex = selectableTargets.length - 1
        const currentIndex = getSelectedTargetIndex()
        if (currentIndex >= 0) {
            previousIndex = (currentIndex - 1 + selectableTargets.length) % selectableTargets.length
        }

        selectTarget(selectableTargets[previousIndex])
    }, [getSelectedTargetIndex, selectTarget, selectableTargets])

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
            const activeElement = document.activeElement
            const isTypingTarget = isShortcutBlockedTarget(activeElement)
            if (isTypingTarget || event.metaKey || event.ctrlKey || event.altKey) return

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
                    selectNextTarget();
                    break;
                case "<":
                    event.preventDefault();
                    selectPrevTarget();
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
                    updateObjectScaleIndex((prev) => Math.max(0, prev - 1));
                    break;
                case "x":
                    event.preventDefault();
                    updateObjectScaleIndex((prev) => Math.min(OBJECT_SCALE_OPTIONS.length - 1, prev + 1));
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
    }, [selectNextTarget, selectPrevTarget, toggleComets, toggleDwarfPlanets, toggleProbes, updateObjectScaleIndex]);

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
                    aria-label="Change object scale"
                    onClick={() => updateObjectScaleIndex((prev) => (prev + 1) % OBJECT_SCALE_OPTIONS.length)}
                >
                    Object scale {objectScaleOption.label} (volume x10<sup>{objectScaleOption.sup}</sup>)
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
                    <li><b>z</b> / <b>x</b>: Object scale</li>
                    <li><b>d</b>: Dwarfs</li>
                    <li><b>c</b>: Comets</li>
                    <li><b>p</b>: Probes</li>
                </ul>
            </div>

            <button
                aria-label="Previous target"
                className="absolute left-0 top-1/2 z-50 -translate-y-1/2 text-4xl font-bold text-card-foreground bg-transparent border-none p-2 m-0 focus:outline-none select-none block sm:hidden transition-colors hover:bg-primary/15 hover:text-primary"
                style={{ pointerEvents: "auto", background: "none" }}
                onClick={selectPrevTarget}
                tabIndex={0}
            >
                &lt;
            </button>

            <button
                aria-label="Next target"
                className="absolute right-0 top-1/2 z-50 -translate-y-1/2 text-4xl font-bold text-card-foreground bg-transparent border-none p-2 m-0 focus:outline-none select-none block sm:hidden transition-colors hover:bg-primary/15 hover:text-primary"
                style={{ pointerEvents: "auto", background: "none" }}
                onClick={selectNextTarget}
                tabIndex={0}
            >
                &gt;
            </button>

            <div
                className="absolute bottom-0 left-0 z-40 flex items-end gap-3 sm:hidden"
                style={{
                    left: "calc(env(safe-area-inset-left) + 1rem)",
                    bottom: "calc(env(safe-area-inset-bottom) + 1.5rem)",
                }}
            >
                <div className="flex flex-col items-center gap-2 rounded-full bg-background/65 px-2 py-2 text-[18px] font-medium text-foreground ring-1 ring-white/15 backdrop-blur-sm">
                    <span className="leading-none">+</span>
                    <div className="relative flex h-24 items-center justify-center">
                        <div className="pointer-events-none absolute left-1/2 top-0 h-24 w-1 -translate-x-1/2 rounded-full bg-white/20" />
                        <div
                            className="pointer-events-none absolute left-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_0_2px_rgba(10,14,24,0.9)]"
                            style={{ top: zoomSliderThumbTop }}
                        />
                        <input
                            type="range"
                            min={ZOOM_SLIDER_MIN}
                            max={ZOOM_SLIDER_MAX}
                            step={1}
                            aria-label="Zoom"
                            className="absolute w-24 -rotate-90 appearance-none border-0 bg-transparent opacity-0 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                            value={zoomSliderValue}
                            onChange={(event) => {
                                setDesiredCameraDistance(
                                    getCameraDistanceFromSliderValue(Number(event.target.value))
                                )
                            }}
                        />
                    </div>
                    <span className="leading-none">-</span>
                </div>

                <div className="flex flex-col gap-4">
                    <button
                        type="button"
                        className={`rounded-full px-2 py-1 text-[12px] font-medium transition focus:outline-none ${showDwarfPlanets ? "bg-primary text-primary-foreground" : "bg-background/65 text-foreground ring-1 ring-white/15 backdrop-blur-sm"}`}
                        aria-pressed={showDwarfPlanets}
                        onClick={toggleDwarfPlanets}
                    >
                        Dwarfs
                    </button>

                    <button
                        type="button"
                        className={`rounded-full px-2 py-1 text-[12px] font-medium transition focus:outline-none ${showComets ? "bg-primary text-primary-foreground" : "bg-background/65 text-foreground ring-1 ring-white/15 backdrop-blur-sm"}`}
                        aria-pressed={showComets}
                        onClick={toggleComets}
                    >
                        Comets
                    </button>

                    <button
                        type="button"
                        className={`rounded-full px-2 py-1 text-[12px] font-medium transition focus:outline-none ${showProbes ? "bg-primary text-primary-foreground" : "bg-background/65 text-foreground ring-1 ring-white/15 backdrop-blur-sm"}`}
                        aria-pressed={showProbes}
                        onClick={toggleProbes}
                    >
                        Probes
                    </button>
                </div>
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
                            objectScaleOption={objectScaleOption}
                            desiredCameraDistance={desiredCameraDistance}
                            onCameraDistanceChange={handleCameraDistanceChange}
                            onDesiredCameraDistanceChange={handleDesiredCameraDistanceChange}
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
