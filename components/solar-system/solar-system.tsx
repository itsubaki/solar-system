"use client"

import { Suspense, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { Sun } from "./sun"
import { Planet } from "./planet"
import { Stars } from "./stars"
import { ControlPanel } from "./control-panel"
import { PlanetInfo } from "./planet-info"
import { PLANETS, type PlanetData } from "@/lib/planet-data"

function Scene({
  timeScale,
  showOrbits,
  showLabels,
  selectedPlanet,
  onSelectPlanet,
}: {
  timeScale: number
  showOrbits: boolean
  showLabels: boolean
  selectedPlanet: PlanetData | null
  onSelectPlanet: (planet: PlanetData | null) => void
}) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[30, 20, 30]} fov={60} />
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={5}
        maxDistance={80}
        autoRotate={false}
      />
      
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
          timeScale={timeScale}
          showOrbits={showOrbits}
          showLabels={showLabels}
          onSelect={onSelectPlanet}
          isSelected={selectedPlanet?.name === planet.name}
        />
      ))}
    </>
  )
}

export function SolarSystem() {
  const [timeScale, setTimeScale] = useState(1)
  const [showOrbits, setShowOrbits] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(null)

  return (
    <div className="relative w-full h-screen bg-background">
      <Canvas>
        <Suspense fallback={null}>
          <Scene
            timeScale={timeScale}
            showOrbits={showOrbits}
            showLabels={showLabels}
            selectedPlanet={selectedPlanet}
            onSelectPlanet={setSelectedPlanet}
          />
        </Suspense>
      </Canvas>
      
      {/* Control Panel */}
      <ControlPanel
        timeScale={timeScale}
        setTimeScale={setTimeScale}
        showOrbits={showOrbits}
        setShowOrbits={setShowOrbits}
        showLabels={showLabels}
        setShowLabels={setShowLabels}
      />
      
      {/* Planet Info Panel */}
      {selectedPlanet && (
        <PlanetInfo
          planet={selectedPlanet}
          onClose={() => setSelectedPlanet(null)}
        />
      )}

      {/* Title */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center pointer-events-none">
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
