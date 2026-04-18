"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import type { PlanetData } from "@/lib/planet-data"

interface PlanetInfoProps {
    planet: PlanetData
    onClose: () => void
}

export function PlanetInfo({ planet, onClose }: PlanetInfoProps) {
    return (
        <Card className="absolute top-6 right-6 w-72 bg-card/90 backdrop-blur-md border-border">
            <CardHeader className="pb-2 flex flex-row items-start justify-between">
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
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {planet.description ?? ""}
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                    <div>
                        <p className="text-xs text-muted-foreground">Orbital Period</p>
                        <p className="text-sm font-medium text-foreground">
                            {(planet.orbitalPeriod ?? "")} days
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Day Length</p>
                        <p className="text-sm font-medium text-foreground">
                            {(planet.rotationPeriod ?? "")} Earth days
                        </p>
                    </div>
                    {planet.satellites && planet.satellites.length > 0 && (
                        <div className="col-span-2">
                            <p className="text-xs text-muted-foreground">Satellites</p>
                            <p className="text-sm font-medium text-foreground">
                                {planet.satellites.map(m => m.name ?? "").join(", ")}
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
