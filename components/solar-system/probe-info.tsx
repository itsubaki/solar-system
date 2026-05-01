"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ASTRONOMICAL_UNIT } from "@/lib/planet-data"
import type { ProbeData } from "@/lib/probe-data"
import { X } from "lucide-react"

export function ProbeInfo({
    probe,
    onClose,
}: {
    probe: ProbeData
    onClose: () => void
}) {
    return (
        <Card className="absolute top-6 right-6 w-84 bg-card/90 backdrop-blur-md border-border">
            <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-full shadow-lg"
                        style={{ backgroundColor: probe.color }}
                    />
                    <CardTitle className="text-lg">{probe.name}</CardTitle>
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
                    {probe.description}
                </p>

                <div className="grid grid-cols-[3fr_7fr] gap-3 pt-2 border-t border-border">
                    <div>
                        <p className="text-[10px] text-muted-foreground">Body Size</p>
                        <p className="text-xs font-medium text-foreground">
                            {probe.radius.toLocaleString()} km
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-foreground">Distance from the Sun</p>
                        <p className="text-xs font-medium text-foreground">
                            {Math.round(probe.distance).toLocaleString()} km / {(probe.distance / ASTRONOMICAL_UNIT).toFixed(2)} AU
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-foreground">Trajectory</p>
                        <p className="text-xs font-medium text-foreground">3D outbound vector</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-foreground">Mission</p>
                        <p className="text-xs font-medium text-foreground">Interstellar probe</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-foreground">Ecliptic Direction</p>
                        <p className="text-xs font-medium text-foreground">
                            {probe.direction.eclipticLongitudeDegrees.toFixed(1)}°, {probe.direction.eclipticLatitudeDegrees >= 0 ? "+" : ""}
                            {probe.direction.eclipticLatitudeDegrees.toFixed(1)}°
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-foreground">Reference</p>
                        <p className="text-xs font-medium text-foreground">{probe.direction.source}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
