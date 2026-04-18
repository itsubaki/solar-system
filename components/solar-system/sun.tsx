"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import type { Mesh, Vector3 } from "three"
import { ASTRONOMICAL_UNIT, SUN_DATA } from "@/lib/planet-data"

type FocusTargetRef = {
    current: Vector3 | null
}

export function Sun({
    onSelect,
    focusTargetRef,
    scale,
}: {
    onSelect?: () => void
    focusTargetRef?: FocusTargetRef | null
    scale: { radius: number }
}) {
    const meshRef = useRef<Mesh>(null)

    useFrame((_, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.1
        }
    })

    const handleClick = () => {
        if (focusTargetRef && focusTargetRef.current) {
            focusTargetRef.current.set(0, 0, 0)
        } else if (focusTargetRef) {
            focusTargetRef.current = new (require("three").Vector3)(0, 0, 0)
        }

        if (onSelect) onSelect()
    }

    const radius = SUN_DATA.radius * scale.radius
    return (
        <group>
            <mesh ref={meshRef} onClick={handleClick}>
                <sphereGeometry args={[radius, 64, 64]} />
                <meshStandardMaterial
                    color={SUN_DATA.color}
                    emissive={SUN_DATA.emissive}
                    emissiveIntensity={SUN_DATA.emissiveIntensity}
                />
            </mesh>

            <mesh scale={1.2}>
                <sphereGeometry args={[radius, 32, 32]} />
                <meshBasicMaterial
                    color="#FDB813"
                    transparent
                    opacity={0.3}
                />
            </mesh>

            <pointLight
                color="#FFF5E0"
                intensity={10}
                distance={100}
                decay={2}
            />
        </group>
    )
}
