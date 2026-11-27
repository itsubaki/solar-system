import { getConsoleFunction, setConsoleFunction } from "three"

type ThreeLogger = Parameters<typeof setConsoleFunction>[0] & {
    solarSystemClockWarningFilter?: boolean
}

const LEGACY_CLOCK_WARNING = "THREE.Clock: This module has been deprecated. Please use THREE.Timer instead."

export function installThreeConsoleFilter() {
    const previous = getConsoleFunction() as ThreeLogger | null
    if (previous?.solarSystemClockWarningFilter) return

    // Fiber 9 still requires Clock's API. Remove this filter after migrating to
    // a version using Timer: https://github.com/pmndrs/react-three-fiber/issues/3741
    const logger: ThreeLogger = (level, message, ...params) => {
        if (level === "warn" && message === LEGACY_CLOCK_WARNING) return

        if (previous) {
            previous(level, message, ...params)
        } else {
            console[level](message, ...params)
        }
    }
    logger.solarSystemClockWarningFilter = true
    setConsoleFunction(logger)
}
