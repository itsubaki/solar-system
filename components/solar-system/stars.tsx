"use client"

import { useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

export function Stars() {
    const ref = useRef<THREE.Points>(null)

    const [{ positions, colors }] = useState(() => {
        const count = 5000
        const positions = new Float32Array(count * 3)
        const colors = new Float32Array(count * 3)

        for (let i = 0; i < count; i++) {
            const radius = 1000 + Math.random() * 40
            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos(2 * Math.random() - 1)

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
            positions[i * 3 + 2] = radius * Math.cos(phi)

            const colorVariation = Math.random()
            if (colorVariation < 0.7) {
                // White stars
                colors[i * 3] = 0.9 + Math.random() * 0.1
                colors[i * 3 + 1] = 0.9 + Math.random() * 0.1
                colors[i * 3 + 2] = 0.9 + Math.random() * 0.1
            } else if (colorVariation < 0.85) {
                // Blue-ish stars
                colors[i * 3] = 0.7 + Math.random() * 0.2
                colors[i * 3 + 1] = 0.8 + Math.random() * 0.2
                colors[i * 3 + 2] = 1.0
            } else {
                // Yellow-ish stars
                colors[i * 3] = 1.0
                colors[i * 3 + 1] = 0.9 + Math.random() * 0.1
                colors[i * 3 + 2] = 0.7 + Math.random() * 0.2
            }
        }

        return { positions, colors }
    })

    useFrame((_, delta) => {
        if (ref.current) {
            ref.current.rotation.y += delta * 0.002
        }
    })

    return (
        <points ref={ref} renderOrder={-1}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                    count={positions.length / 3}
                />
                <bufferAttribute
                    attach="attributes-color"
                    args={[colors, 3]}
                    count={colors.length / 3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.15}
                vertexColors
                transparent
                opacity={0.8}
                depthWrite={false}
                sizeAttenuation
            />
        </points>
    )
}
