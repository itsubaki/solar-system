"use client"

export function Clock({
    simTime,
}: {
    simTime: Date,
}) {
    const y = simTime.getFullYear()
    const m = String(simTime.getMonth() + 1).padStart(2, '0')
    const d = String(simTime.getDate()).padStart(2, '0')
    const date = `${y}/${m}/${d}`
    const time = simTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

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
        }}>{date} {time}</div>
    )
}
