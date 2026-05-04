"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import { Vector3, type Mesh } from "three"
import { SUN_DATA } from "@/lib/planet-data"
import { getObjectLabelOffset } from "./orbit"

type FocusTargetRef = {
    current: Vector3 | null
}

export function Sun({
    onSelect,
    focusTargetRef,
    isSelected,
    scale,
}: {
    onSelect?: () => void
    focusTargetRef?: FocusTargetRef | null
    isSelected?: boolean
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
            focusTargetRef.current = new Vector3(0, 0, 0)
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

            <Html
                position={[0, getObjectLabelOffset(radius), 0]}
                style={{
                    pointerEvents: "auto",
                    userSelect: "none",
                    transform: "translate(-50%, -100%)",
                }}
            >
                <div
                    className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-all ${isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-card/80 text-card-foreground backdrop-blur-sm"
                        }`}
                    style={{ cursor: "pointer" }}
                    onClick={(event) => {
                        event.stopPropagation()
                        handleClick()
                    }}
                >
                    {SUN_DATA.name}
                </div>
            </Html>

            <pointLight
                color="#FFF5E0"
                intensity={10}
                distance={100}
                decay={2}
            />
        </group>
    )
}
