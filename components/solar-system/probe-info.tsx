"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getProbeDistanceFromSun } from "@/lib/probe-angle"
import type { ProbeData } from "@/lib/probe-data"
import { X } from "lucide-react"

export function ProbeInfo({
    probe,
    simTime,
    onClose,
}: {
    probe: ProbeData
    simTime: Date
    onClose: () => void
}) {
    const distanceFromSun = getProbeDistanceFromSun(probe, simTime)

    return (
        <Card className="absolute top-6 right-6 w-92 bg-card/90 backdrop-blur-md border-border">
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

                <div className="grid grid-cols-[3.5fr_6.5fr] gap-3 pt-2 border-t border-border">
                    <div>
                        <p className="text-[10px] text-muted-foreground">Body Size</p>
                        <p className="text-xs font-medium text-foreground">
                            {probe.radius.toLocaleString()} km
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-foreground">Distance from the Sun</p>
                        <p className="text-xs font-medium text-foreground">
                            {Math.round(distanceFromSun.km).toLocaleString()} km / {distanceFromSun.au.toFixed(2)} AU
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
