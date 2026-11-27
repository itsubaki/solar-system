# solar-system

An interactive 3D simulator of the Solar System.

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
