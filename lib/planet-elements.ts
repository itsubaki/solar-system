import { degToRad, J2000_EPOCH_UTC, MS_PER_DAY } from "./orbit"

// JPL Table 2a/2b: https://ssd.jpl.nasa.gov/planets/approx_pos.html
// J2000 ecliptic elements, valid from 3000 BC to AD 3000. Each row is
// [a, e, I, L, longitude of perihelion, longitude of ascending node].
const LONG_TERM_ELEMENTS: Record<string, { base: number[]; rates: number[]; correction?: number[] }> = {
    Mercury: { base: [0.38709843, 0.20563661, 7.00559432, 252.25166724, 77.45771895, 48.33961819], rates: [0, 0.00002123, -0.00590158, 149472.67486623, 0.15940013, -0.12214182] },
    Venus: { base: [0.72332102, 0.00676399, 3.39777545, 181.97970850, 131.76755713, 76.67261496], rates: [-0.00000026, -0.00005107, 0.00043494, 58517.81560260, 0.05679648, -0.27274174] },
    Earth: { base: [1.00000018, 0.01673163, -0.00054346, 100.46691572, 102.93005885, -5.11260389], rates: [-0.00000003, -0.00003661, -0.01337178, 35999.37306329, 0.31795260, -0.24123856] },
    Mars: { base: [1.52371243, 0.09336511, 1.85181869, -4.56813164, -23.91744784, 49.71320984], rates: [0.00000097, 0.00009149, -0.00724757, 19140.29934243, 0.45223625, -0.26852431] },
    Jupiter: { base: [5.20248019, 0.04853590, 1.29861416, 34.33479152, 14.27495244, 100.29282654], rates: [-0.00002864, 0.00018026, -0.00322699, 3034.90371757, 0.18199196, 0.13024619], correction: [-0.00012452, 0.06064060, -0.35635438, 38.35125000] },
    Saturn: { base: [9.54149883, 0.05550825, 2.49424102, 50.07571329, 92.86136063, 113.63998702], rates: [-0.00003065, -0.00032044, 0.00451969, 1222.11494724, 0.54179478, -0.25015002], correction: [0.00025899, -0.13434469, 0.87320147, 38.35125000] },
    Uranus: { base: [19.18797948, 0.04685740, 0.77298127, 314.20276625, 172.43404441, 73.96250215], rates: [-0.00020455, -0.00001550, -0.00180155, 428.49512595, 0.09266985, 0.05739699], correction: [0.00058331, -0.97731848, 0.17689245, 7.67025000] },
    Neptune: { base: [30.06952752, 0.00895439, 1.77005520, 304.22289287, 46.68158724, 131.78635853], rates: [0.00006447, 0.00000818, 0.00022400, 218.46515314, 0.01009938, -0.00606302], correction: [-0.00041348, 0.68346318, -0.10162547, 7.67025000] },
}

export const PLANET_MODEL_START = Date.UTC(-2999, 0, 1) // astronomical year -2999 = 3000 BC
export const PLANET_MODEL_END = Date.UTC(3000, 0, 1)

export function getLongTermPlanetElements(name: string, at: Date) {
    const data = LONG_TERM_ELEMENTS[name]
    if (!data) return null
    const centuries = (at.getTime() - J2000_EPOCH_UTC) / (MS_PER_DAY * 36525)
    const [a, e, inclination, meanLongitude, perihelion, node] = data.base.map((base, i) => base + data.rates[i] * centuries)
    const [b, c, s, frequency] = data.correction ?? [0, 0, 0, 0]
    return {
        semiMajorAxisAu: a, eccentricity: e, inclination,
        meanLongitude: meanLongitude + b * centuries ** 2 +
            c * Math.cos(degToRad(frequency * centuries)) + s * Math.sin(degToRad(frequency * centuries)),
        longitudeOfPeriapsis: perihelion, longitudeOfAscendingNode: node,
    }
}

export function getModernPlanetModelWeight(at: Date) {
    const time = at.getTime()
    // Both models are valid during these transitions. Smooth the elements to
    // avoid a position discontinuity at 1800 or 2050, including wrapped angles.
    const fadeIn = (time - Date.UTC(1800, 0, 1)) / (Date.UTC(1810, 0, 1) - Date.UTC(1800, 0, 1))
    const fadeOut = (Date.UTC(2050, 0, 1) - time) / (Date.UTC(2050, 0, 1) - Date.UTC(2040, 0, 1))
    const weight = Math.max(0, Math.min(1, fadeIn, fadeOut))
    return weight * weight * (3 - 2 * weight)
}

export function blendDegrees(longTerm: number, modern: number, weight: number) {
    const difference = ((modern - longTerm + 180) % 360 + 360) % 360 - 180
    return longTerm + difference * weight
}
