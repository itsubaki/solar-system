import { describe, expect, it } from "vitest"

import { cn } from "./utils"

describe("utils", () => {
    it("joins truthy class names", () => {
        expect(cn("flex", undefined, false, "items-center")).toBe(
            "flex items-center"
        )
    })

    it("keeps the last conflicting Tailwind utility", () => {
        expect(cn("px-2", "text-sm", "px-4")).toBe("text-sm px-4")
    })
})
