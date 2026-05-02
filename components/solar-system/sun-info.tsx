"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SUN_DATA } from "@/lib/planet-data"
import { X } from "lucide-react"

export function SunInfo({
    onClose,
}: {
    onClose: () => void
}) {
    return (
        <Card className="absolute top-6 right-6 w-84 bg-card/90 backdrop-blur-md border-border">
            <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-full shadow-lg"
                        style={{ backgroundColor: SUN_DATA.color }}
                    />
                    <CardTitle className="text-lg">{SUN_DATA.name}</CardTitle>
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
                    {SUN_DATA.description}
                </p>

                <div className="grid grid-cols-[3fr_7fr] gap-3 pt-2 border-t border-border">
                    <div>
                        <p className="text-[10px] text-muted-foreground">Radius</p>
                        <p className="text-xs font-medium text-foreground">
                            {SUN_DATA.radius.toLocaleString()} km
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-foreground">Type</p>
                        <p className="text-xs font-medium text-foreground">
                            G-type main-sequence star
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
