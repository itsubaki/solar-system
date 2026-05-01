"use client"

import { useSyncExternalStore } from "react"

function formatDateTime(simTime: Date) {
    const y = simTime.getFullYear()
    const m = String(simTime.getMonth() + 1).padStart(2, '0')
    const d = String(simTime.getDate()).padStart(2, '0')
    const hours = String(simTime.getHours()).padStart(2, '0')
    const minutes = String(simTime.getMinutes()).padStart(2, '0')
    const seconds = String(simTime.getSeconds()).padStart(2, '0')

    return `${y}/${m}/${d} ${hours}:${minutes}:${seconds}`
}

export function Clock({
    simTime,
}: {
    simTime: Date,
}) {
    const isMounted = useSyncExternalStore(
        () => () => { },
        () => true,
        () => false,
    )

    const text = isMounted ? formatDateTime(simTime) : "0000/00/00 00:00:00"

    return (
        <div style={{
            position: 'relative',
            background: 'rgba(0,0,0,0.5)',
            color: 'white',
            padding: '6px',
            borderRadius: 8,
            fontSize: 12,
            fontFamily: 'monospace',
            letterSpacing: 1,
            pointerEvents: 'none',
            userSelect: 'none',
            minWidth: 120,
            textAlign: 'center',
        }}>{text}</div>
    )
}
