"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ASTRONOMICAL_UNIT } from "@/lib/orbit"
import type { CometData } from "@/lib/comet-data"
import { X } from "lucide-react"

export function CometInfo({
    comet,
    onClose,
}: {
    comet: CometData
    onClose: () => void
}) {
    return (
        <Card className="absolute top-6 right-6 w-84 bg-card/90 backdrop-blur-md border-border">
            <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-full shadow-lg"
                        style={{ backgroundColor: comet.color }}
                    />
                    <CardTitle className="text-lg">{comet.name}</CardTitle>
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
                    {comet.description}
                </p>

                <div className="grid grid-cols-[3fr_7fr] gap-3 pt-2 border-t border-border">
                    <div>
                        <p className="text-[10px] text-muted-foreground">Nucleus Radius</p>
                        <p className="text-xs font-medium text-foreground">
                            {comet.radius.toLocaleString()} km
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-foreground">Reference Distance</p>
                        <p className="text-xs font-medium text-foreground">
                            {Math.round(comet.distance).toLocaleString()} km / {(comet.distance / ASTRONOMICAL_UNIT).toFixed(2)} AU
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-foreground">Orbital Period</p>
                        <p className="text-xs font-medium text-foreground">
                            {(Math.abs(comet.orbitalPeriod) / 365.25).toFixed(1)} years
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-foreground">Perihelion</p>
                        <p className="text-xs font-medium text-foreground">
                            {comet.orbitalElements.perihelionDistanceAu.toFixed(3)} AU
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
