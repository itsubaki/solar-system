// Approximate TT - UT (seconds), Espenak & Meeus / NASA:
// https://eclipse.gsfc.nasa.gov/SEcat5/deltatpoly.html
// This matters for the long-range planetary model. Satellite tables already
// use UTC explicitly and must not be shifted by this conversion.
function polynomial(t: number, coefficients: number[]) {
    return coefficients.reduceRight((sum, coefficient) => sum * t + coefficient, 0)
}

export function getDeltaTSeconds(year: number) {
    if (year < -500 || year >= 2150) return -20 + 32 * ((year - 1820) / 100) ** 2
    if (year < 500) return polynomial(year / 100, [10583.6, -1014.41, 33.78311, -5.952053, -0.1798452, 0.022174192, 0.0090316521])
    if (year < 1600) return polynomial((year - 1000) / 100, [1574.2, -556.01, 71.23472, 0.319781, -0.8503463, -0.005050998, 0.0083572073])
    if (year < 1700) return polynomial(year - 1600, [120, -0.9808, -0.01532, 1 / 7129])
    if (year < 1800) return polynomial(year - 1700, [8.83, 0.1603, -0.0059285, 0.00013336, -1 / 1174000])
    if (year < 1860) return polynomial(year - 1800, [13.72, -0.332447, 0.0068612, 0.0041116, -0.00037436, 0.0000121272, -0.0000001699, 0.000000000875])
    if (year < 1900) return polynomial(year - 1860, [7.62, 0.5737, -0.251754, 0.01680668, -0.0004473624, 1 / 233174])
    if (year < 1920) return polynomial(year - 1900, [-2.79, 1.494119, -0.0598939, 0.0061966, -0.000197])
    if (year < 1941) return polynomial(year - 1920, [21.2, 0.84493, -0.0761, 0.0020936])
    if (year < 1961) return polynomial(year - 1950, [29.07, 0.407, -1 / 233, 1 / 2547])
    if (year < 1986) return polynomial(year - 1975, [45.45, 1.067, -1 / 260, -1 / 718])
    if (year < 2005) return polynomial(year - 2000, [63.86, 0.3345, -0.060374, 0.0017275, 0.000651814, 0.00002373599])
    if (year < 2050) return polynomial(year - 2000, [62.92, 0.32217, 0.005589])
    return -20 + 32 * ((year - 1820) / 100) ** 2 - 0.5628 * (2150 - year)
}

// UTC leap seconds known through 2026. Retain the last published UTC offset
// for future dates, as Horizons does; unknown future leap seconds cannot be
// predicted from an Earth-rotation model (UT1 is not UTC). TT approximates TDB
// to milliseconds, negligible beside JPL's approximate planetary model.
// https://hpiers.obspm.fr/iers/bul/bulc/Leap_Second.dat
const LEAP_SECONDS: [number, number][] = [
    [Date.UTC(1972, 0), 10], [Date.UTC(1972, 6), 11], [Date.UTC(1973, 0), 12],
    [Date.UTC(1974, 0), 13], [Date.UTC(1975, 0), 14], [Date.UTC(1976, 0), 15],
    [Date.UTC(1977, 0), 16], [Date.UTC(1978, 0), 17], [Date.UTC(1979, 0), 18],
    [Date.UTC(1980, 0), 19], [Date.UTC(1981, 6), 20], [Date.UTC(1982, 6), 21],
    [Date.UTC(1983, 6), 22], [Date.UTC(1985, 6), 23], [Date.UTC(1988, 0), 24],
    [Date.UTC(1990, 0), 25], [Date.UTC(1991, 0), 26], [Date.UTC(1992, 6), 27],
    [Date.UTC(1993, 6), 28], [Date.UTC(1994, 6), 29], [Date.UTC(1996, 0), 30],
    [Date.UTC(1997, 6), 31], [Date.UTC(1999, 0), 32], [Date.UTC(2006, 0), 33],
    [Date.UTC(2009, 0), 34], [Date.UTC(2012, 6), 35], [Date.UTC(2015, 6), 36], [Date.UTC(2017, 0), 37],
]

export function getDynamicalDate(at: Date) {
    const time = at.getTime()
    const year = at.getUTCFullYear() + (at.getUTCMonth() + at.getUTCDate() / 31) / 12
    let seconds = getDeltaTSeconds(year)
    if (time >= LEAP_SECONDS[0][0]) {
        const leap = LEAP_SECONDS.findLast(([epoch]) => time >= epoch)!
        seconds = leap[1] + 32.184
    }
    return new Date(time + seconds * 1000)
}
