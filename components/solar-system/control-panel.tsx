"use client"

import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Pause, RotateCcw, Eye, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ControlPanelProps {
  timeScale: number
  setTimeScale: (value: number) => void
  showOrbits: boolean
  setShowOrbits: (value: boolean) => void
  showLabels: boolean
  setShowLabels: (value: boolean) => void
}

export function ControlPanel({
  timeScale,
  setTimeScale,
  showOrbits,
  setShowOrbits,
  showLabels,
  setShowLabels,
}: ControlPanelProps) {
  const isPaused = timeScale === 0

  return (
    <Card className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md bg-card/90 backdrop-blur-md border-border">
      <CardContent className="p-4">
        {/* Time Controls */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-foreground">
              Time Speed
            </Label>
            <span className="text-xs text-muted-foreground tabular-nums">
              {timeScale.toFixed(1)}x
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setTimeScale(isPaused ? 1 : 0)}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            
            <Slider
              value={[timeScale]}
              onValueChange={([value]) => setTimeScale(value)}
              min={0}
              max={5}
              step={0.1}
              className="flex-1"
            />
            
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setTimeScale(1)}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Visibility Toggles */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Switch
              id="orbits"
              checked={showOrbits}
              onCheckedChange={setShowOrbits}
            />
            <Label htmlFor="orbits" className="text-sm flex items-center gap-1.5 cursor-pointer">
              <Eye className="h-3.5 w-3.5" />
              Orbits
            </Label>
          </div>
          
          <div className="flex items-center gap-2">
            <Switch
              id="labels"
              checked={showLabels}
              onCheckedChange={setShowLabels}
            />
            <Label htmlFor="labels" className="text-sm flex items-center gap-1.5 cursor-pointer">
              <Tag className="h-3.5 w-3.5" />
              Labels
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
