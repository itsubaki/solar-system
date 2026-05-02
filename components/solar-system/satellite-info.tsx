"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ASTRONOMICAL_UNIT } from "@/lib/orbit"
import type { SatelliteData } from "@/lib/planet-data"
import { X } from "lucide-react"

type SelectedSatellite = SatelliteData & { parentPlanetName: string }

export function SatelliteInfo({
    satellite,
    onClose,
}: {
    satellite: SelectedSatellite
    onClose: () => void
}) {
    return (
        <Card className="absolute top-6 right-6 w-84 bg-card/90 backdrop-blur-md border-border">
            <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-full shadow-lg"
                        style={{ backgroundColor: satellite.color }}
                    />
                    <div>
                        <CardTitle className="text-lg">{satellite.name}</CardTitle>
                        <p className="text-[10px] text-muted-foreground">
                            Satellite of {satellite.parentPlanetName}
                        </p>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 -mt-1 -mr-2"
                    onClick={onClose}
                >
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>

            <CardContent className="space-y-3">
                <div className="grid grid-cols-[3fr_7fr] gap-3 pt-2 border-t border-border">
                    <div>
                        <p className="text-[10px] text-muted-foreground">Radius</p>
                        <p className="text-xs font-medium text-foreground">
                            {satellite.radius.toLocaleString()} km
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-foreground">Distance from {satellite.parentPlanetName}</p>
                        <p className="text-xs font-medium text-foreground">
                            {Math.round(satellite.distance).toLocaleString()} km / {(satellite.distance / ASTRONOMICAL_UNIT).toFixed(4)} AU
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-foreground">Orbital Period</p>
                        <p className="text-xs font-medium text-foreground">
                            {Math.abs(satellite.orbitalPeriod).toLocaleString()} days
                        </p>
                    </div>

                </div>
            </CardContent>
        </Card>
    )
}
