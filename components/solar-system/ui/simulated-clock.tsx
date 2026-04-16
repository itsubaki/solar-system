"use client"

import { useEffect, useState } from "react"

export function SimulatedClock({ orbitSpeedScale }: { orbitSpeedScale: number }) {
    const [simTime, setSimTime] = useState(() => new Date())
    useEffect(() => {
        let lastReal = Date.now()
        let frameId: number
        const tick = () => {
            const now = Date.now()
            const elapsed = (now - lastReal) / 1000 // 秒
            lastReal = now
            setSimTime((prev) => new Date(prev.getTime() + elapsed * 1000 * orbitSpeedScale))
            frameId = requestAnimationFrame(tick)
        }
        frameId = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frameId)
    }, [orbitSpeedScale])

    const y = simTime.getFullYear()
    const m = String(simTime.getMonth() + 1).padStart(2, '0')
    const d = String(simTime.getDate()).padStart(2, '0')
    const date = `${y}/${m}/${d}`
    const time = simTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

    return (
        <div style={{
            position: 'fixed',
            top: 16,
            right: 24,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.5)',
            color: 'white',
            padding: '6px 16px',
            borderRadius: 8,
            fontSize: 18,
            fontFamily: 'monospace',
            letterSpacing: 1,
            pointerEvents: 'none',
            userSelect: 'none',
        }}>{date} {time}</div>
    )
}
