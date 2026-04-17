"use client"

import { useEffect, useState } from "react"

export function Clock() {
    const [time, setTime] = useState<string>("")

    useEffect(() => {
        const update = () => {
            const now = new Date()
            const y = now.getFullYear()
            const m = String(now.getMonth() + 1).padStart(2, '0')
            const d = String(now.getDate()).padStart(2, '0')
            const date = `${y}/${m}/${d}`
            const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            setTime(`${date} ${time}`)
        }
        update()
        const timer = setInterval(update, 1000)
        return () => clearInterval(timer)
    }, [])

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
        }}>{time}</div>
    )
}
