# solar-system

An interactive 3D simulator of the Solar System.

The sky uses fixed J2000 directions and follows the camera's world position,
so moving through the Solar System does not introduce artificial galaxy parallax.
Satellite reference planes use the ascending node on the ICRF equator as the
longitude origin, following [JPL's mean-element conventions](https://ssd.jpl.nasa.gov/sats/elem/).
Their nodes and arguments of periapsis precess with the published periods;
positions and cached orbit curves share the same continuously updated frame.
Triton uses the current JPL equatorial elements. These are mean-element visual
approximations, not precise ephemerides; use JPL Horizons for accurate positions.

The locked `@react-three/drei@10.7.9` dependency has a pnpm patch for
[Html root lifecycle issue #2867](https://github.com/pmndrs/drei/issues/2867).
It reuses each label's React root during effect replay and portal moves, and
defers final teardown until after React finishes committing. `pnpm install`
applies the patch automatically; `lib/html-lifecycle.test.ts` checks the installed
dependency's lifecycle behavior. Recheck this patch when upgrading drei.

Fiber 9 also creates a deprecated `THREE.Clock` internally
([upstream issue #3741](https://github.com/pmndrs/react-three-fiber/issues/3741)).
`lib/three-console.ts` filters that exact warning through Three.js's logging hook
until Fiber's Timer migration is available. Remove the filter when upgrading to
a version that no longer constructs `Clock`.
