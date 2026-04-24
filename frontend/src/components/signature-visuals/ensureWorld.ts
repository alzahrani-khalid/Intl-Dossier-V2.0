/**
 * Phase 37 — Lazy loader for d3-geo + topojson-client + world-atlas.
 *
 * Called on first `<GlobeLoader>` mount; the resolved promise is memoized at
 * module scope so repeat mounts reuse the same fetch and the d3/topojson
 * bundles stay on their own lazy chunk (D-05).
 *
 * Handoff source: /tmp/inteldossier-handoff/inteldossier/project/src/loader.jsx
 * lines 10-33. The handoff used UMD <script> injection + global `window.d3`;
 * we use Vite dynamic `import()` with `.default` extraction per RESEARCH
 * Pitfall 1 (Vite wraps JSON imports in an ES-module namespace).
 */
import type { GeoPermissibleObjects } from 'd3-geo'

export interface EnsureWorldResult {
  countries: GeoPermissibleObjects
  graticule: GeoPermissibleObjects
  d3: typeof import('d3-geo')
}

let _worldPromise: Promise<EnsureWorldResult> | null = null

export function ensureWorld(): Promise<EnsureWorldResult> {
  if (_worldPromise !== null) return _worldPromise
  _worldPromise = (async (): Promise<EnsureWorldResult> => {
    const [d3, topojson, worldModule] = await Promise.all([
      import('d3-geo'),
      import('topojson-client'),
      import('world-atlas/countries-110m.json'),
    ])
    const world = (worldModule as { default: unknown }).default
    const countries = topojson.feature(
      world as Parameters<typeof topojson.feature>[0],
      (world as { objects: { countries: unknown } }).objects
        .countries as Parameters<typeof topojson.feature>[1],
    ) as unknown as GeoPermissibleObjects
    const graticule = d3.geoGraticule10() as unknown as GeoPermissibleObjects
    return { countries, graticule, d3 }
  })()
  return _worldPromise
}

/**
 * Test-only escape hatch — lets specs reset the memoized promise between
 * cases so mocks don't bleed across tests.
 */
export function __resetEnsureWorldForTests(): void {
  _worldPromise = null
}
