"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { ASTRONOMICAL_UNIT } from "@/lib/orbit"
import type { PlanetData } from "@/lib/planet-data"

export function PlanetInfo({
    planet,
    onClose,
}: {
    planet: PlanetData
    onClose: () => void
}) {
    return (
        <Card className="absolute top-6 right-6 w-92 bg-card/90 backdrop-blur-md border-border">
            <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-full shadow-lg"
                        style={{ backgroundColor: planet.color ?? "#888" }}
                    />
                    <CardTitle className="text-lg">{planet.name ?? ""}</CardTitle>
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
                <p className="text-xs text-muted-foreground leading-relaxed">
                    {planet.description ?? ""}
                </p>

                <div className="grid grid-cols-[3.5fr_6.5fr] gap-3 pt-2 border-t border-border">
                    <div >
                        <p className="text-[10px] text-muted-foreground">Radius</p>
                        <p className="text-xs font-medium text-foreground">
                            {planet.radius.toLocaleString()} km
                        </p>
                    </div>
                    <div >
                        <p className="text-[10px] text-muted-foreground">Distance from the Sun</p>
                        <p className="text-xs font-medium text-foreground">
                            {Math.round(planet.distance).toLocaleString()} km / {(planet.distance / ASTRONOMICAL_UNIT).toFixed(2)} AU
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-foreground">Orbital Period</p>
                        <p className="text-xs font-medium text-foreground">
                            {Math.round(planet.orbitalPeriod).toLocaleString() ?? ""} days
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-foreground">Day Length</p>
                        <p className="text-xs font-medium text-foreground">
                            {(Math.abs(planet.rotationPeriod).toLocaleString() ?? "")} Earth days
                        </p>
                    </div>
                    {/* {planet.satellites && planet.satellites.length > 0 && (
                        <div className="col-span-2">
                            <p className="text-xs text-muted-foreground">Satellites</p>
                            <p className="text-sm font-medium text-foreground">
                                {planet.satellites.map(m => m.name ?? "").join(", ")}
                            </p>
                        </div>
                    )} */}
                </div>
            </CardContent>
        </Card>
    )
}
