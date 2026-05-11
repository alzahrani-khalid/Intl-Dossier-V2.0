# Phase 37: signature-visuals - Research

**Researched:** 2026-04-24
**Domain:** SVG visual primitives (d3-geo orthographic globe, RTL-aware sparkline/donut, flag glyphs) for a React 19 + Vite 7 + Tailwind v4 monorepo
**Confidence:** HIGH (most decisions locked in CONTEXT.md; unknowns narrow to version pinning and hook implementation)

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Handoff fidelity & file organization**

- **D-01:** Port `/tmp/inteldossier-handoff/.../loader.jsx` + `glyph.jsx` as a **verbatim TS rewrite** — 1:1 preservation of every d3 call, timing constant, SVG path, and viewBox. Screenshots are pixel-parity anchors.
- **D-02:** All primitives under `frontend/src/components/signature-visuals/` with a barrel `index.ts`. Files: `GlobeLoader.tsx`, `FullscreenLoader.tsx`, `GlobeSpinner.tsx`, `DossierGlyph.tsx`, `Sparkline.tsx`, `Donut.tsx`, `flags/` subfolder, `index.ts`.
- **D-03:** Startup `<FullscreenLoader open={!hydrated}>` mounts at **AppShell Suspense boundary**.
- **D-04:** Dual trigger API: `window.__showGlobeLoader(ms)` gated behind `import.meta.env.DEV` + declarative `<FullscreenLoader open ms>`; both converge on shared state.

**d3-geo + topojson loading**

- **D-05:** Lazy dynamic import on first `<GlobeLoader>` mount — `await import('d3-geo')`, `await import('topojson-client')`, `await import('world-atlas/countries-110m.json')`.
- **D-06:** Topojson from the `world-atlas` npm package — no vendored JSON.
- **D-07:** Progressive render: rings + halo paint immediately from CSS; mesh fills in when chunk resolves.
- **D-08:** Graceful degradation on load failure: keep rings + halo animating, drop land mesh, emit one `console.warn`.

**24 flags + symbol fallbacks**

- **D-09:** 24 flag `<path>` defs copied verbatim from handoff `glyph.jsx`. ISO set: SA, AE, ID, EG, QA, JO, BH, OM, KW, PK, MA, TR, CN, IT, FR, DE, GB, US, JP, KR, IN, BR, EU, UN.
- **D-10:** Non-country types render Unicode symbols in soft-tinted circles: forum diamond-open, person filled-circle, topic diamond-filled, organization triangle. Tint via `color-mix(in srgb, <accent> 12%, var(--surface-raised))`.
- **D-11:** Unknown ISO falls back to soft-tinted circle with 1–2 uppercase initials from country name.
- **D-12:** One TSX per flag (`flags/sa.tsx`, `flags/ae.tsx`, …) + `flags/index.ts` exporting a map keyed by lowercase ISO.

**Animation runtime & reduced-motion**

- **D-13:** CSS `@keyframes` for rings/halo + `requestAnimationFrame` for globe rotation. `framer-motion` is NOT a Phase 37 dependency despite being installed.
- **D-14:** Reduced-motion = full stop — cancel rAF, pin globe at lambda=0, set ring/halo `animation: none`.
- **D-15:** DossierGlyph, Sparkline, Donut have NO intrinsic animation under either motion preference.
- **D-16:** Dual-layer reduced-motion detection: `@media (prefers-reduced-motion: reduce)` CSS + `useReducedMotion()` hook.

### Claude's Discretion

- Sparkline prop contract: default `<Sparkline data={number[]} />`.
- Donut prop contract: default `<Donut value={number} variants={[ok, risk, bad]} />`.
- Tokenization touchpoints: `--ink`, `--bg`, `--surface-raised`, `--line`.
- Backdrop-filter fallback: if `backdrop-filter: blur(3px)` unsupported, fall back to `color-mix(in srgb, var(--bg) 95%, transparent)` no-blur.
- Prefetch hint (`<link rel="modulepreload" …>`) — plan-time perf decision.
- Exact CSS animation timing-functions — refine per screenshot comparison.

### Deferred Ideas (OUT OF SCOPE)

- Sparkline/Donut data contract refinements (Phase 38).
- Tokenization touchpoint audit — `--glyph-fallback-tint` token (Phase 40).
- Backdrop-filter legacy fallback matrix.
- Reference-image diffing in CI (future testing phase).
- Entry animations on DossierGlyph/Sparkline/Donut (Phase 38+).
- modulepreload hint in index.html (plan-time refinement).
- Prefetch flag assets.
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID     | Description                                                                                                                                                                                     | Research Support                                                                                                                                             |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| VIZ-01 | 1.6s startup `<GlobeLoader>` splash — orthographic d3-geo, topojson countries-110m, 16 deg/sec on -18 deg tilt, three whirl rings at 3.2s/5.5s/8s, pulsing halo                                 | d3-geo `geoOrthographic()`, `geoPath()`, `geoGraticule10()`; topojson-client `feature()`; world-atlas `countries-110m.json`. All three lazy-loaded per D-05. |
| VIZ-02 | `window.__showGlobeLoader(ms)` + `<FullscreenLoader>` trigger; backdrop = `color-mix(in srgb, var(--bg) 82%, transparent)` + `backdrop-filter: blur(3px)`                                       | Zustand store or module-scoped signal + `useSyncExternalStore`; CSS `backdrop-filter` with feature-query fallback.                                           |
| VIZ-03 | Inline `<GlobeSpinner>` (40x40 SVG, 1.4s whirl arc + 2.8s reverse stylized globe) inheriting `currentColor`                                                                                     | Pure SVG + CSS `@keyframes` rotate; no d3. Mirrors `pull-to-refresh-indicator.tsx` pattern.                                                                  |
| VIZ-04 | `<DossierGlyph>` -> 24 flag SVGs (ISO list) clipped to circle, 1px `rgba(0,0,0,0.15)` hairline; non-country fallback symbols in soft-tinted circles                                             | TSX flag components + barrel map; DossierType union from `frontend/src/types/dossier-context.types.ts` (line 71).                                            |
| VIZ-05 | `<Sparkline data={…}>` (80x22 polyline, min-max normalized, trailing dot, `scaleX(-1)` in RTL) + `<Donut value={…} variants={[ok,risk,bad]}>` (stacked `strokeDasharray` + center percent pill) | `useDirection()` from design-system hooks for RTL flag; SVG polyline math inline; dasharray = circumference \* fraction.                                     |

</phase_requirements>

## Summary

Phase 37 is a **verbatim TS port** of two battle-tested JSX files (`loader.jsx` + `glyph.jsx`) into `frontend/src/components/signature-visuals/`, plus two derivative primitives (Sparkline, Donut) inferred from the handoff `dashboard.jsx` consumer. Risk is low: the design, timings, viewBoxes, d3 call order, and SVG paths are already known and locked.

Three runtime deps are missing from `frontend/package.json` and must be added at plan time: **`d3-geo`**, **`topojson-client`**, **`world-atlas`** (plus `@types/d3-geo` and `@types/topojson-client` for TS strict mode). All three are lazy-loaded on first `<GlobeLoader>` mount via dynamic `import()` — Vite 7 auto-splits them into a deferred chunk.

The two non-trivial integration points are: (1) the `<FullscreenLoader>` Suspense mount in `AppShell.tsx` at `frontend/src/components/layout/AppShell.tsx` and (2) a new `useReducedMotion()` hook (no existing implementation in the codebase — `framer-motion` exposes one but is banned per D-13). The hook is ~12 lines of matchMedia + `useSyncExternalStore`.

**Primary recommendation:** Port verbatim, pin `d3-geo@3.1.1` + `topojson-client@3.1.0` + `world-atlas@2.0.2` (matching handoff CDN versions), ship a tiny `useReducedMotion` hook under `frontend/src/design-system/hooks/`, mount `<FullscreenLoader>` inside the root `<Suspense>` in AppShell, and land Vitest + Playwright + axe-core validation covering the five VIZ requirements.

## Architectural Responsibility Map

| Capability                                                        | Primary Tier                   | Secondary Tier   | Rationale                                                                              |
| ----------------------------------------------------------------- | ------------------------------ | ---------------- | -------------------------------------------------------------------------------------- |
| Globe rendering (d3-geo projection + rAF)                         | Browser / Client               | —                | d3-geo is a client-only lib; rotation is visual-only, no server participation          |
| Flag SVG assets                                                   | CDN / Static (via Vite bundle) | Browser / Client | Static SVGs bundled and code-split; consumer renders inline                            |
| World topojson data                                               | CDN / Static (via Vite asset)  | Browser / Client | JSON bundled as deferred chunk; fetched lazily on first mount                          |
| Reduced-motion detection                                          | Browser / Client               | —                | Pure matchMedia — no server role                                                       |
| RTL direction detection (Sparkline flip)                          | Browser / Client               | —                | Reads `useDirection()` -> Zustand `id.locale` hydrated by Phase 34 pre-paint bootstrap |
| Token consumption (`--ink`, `--bg`, `--surface-raised`, `--line`) | Browser / Client               | —                | CSS var reads — no JS coupling to Phase 33 DesignProvider                              |
| Suspense fallback mount                                           | Frontend Server (SSR boundary) | Browser / Client | AppShell root is the hydration seam; splash renders until React hydrates               |

## Standard Stack

### Core

| Library                  | Version | Purpose                                              | Why Standard                                                                                                                                  |
| ------------------------ | ------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `d3-geo`                 | 3.1.1   | Orthographic projection + path generator + graticule | [CITED: handoff loader.jsx uses d3@7.8.5 umd; d3-geo@3.1.1 is its geo submodule] Canonical for SVG globe rendering; tree-shakeable ES modules |
| `topojson-client`        | 3.1.0   | Decode topojson -> GeoJSON FeatureCollection         | [CITED: handoff loader.jsx line 24] Standard pair with world-atlas; ~14KB gzipped                                                             |
| `world-atlas`            | 2.0.2   | Pre-built topojson (countries-110m.json ~120KB)      | [CITED: handoff loader.jsx line 26] Maintained by Mike Bostock; the canonical topojson source                                                 |
| `@types/d3-geo`          | 3.x     | TS types for d3-geo                                  | Required for TS strict mode                                                                                                                   |
| `@types/topojson-client` | 3.x     | TS types for topojson-client                         | Required for TS strict mode                                                                                                                   |

**Version verification:** [ASSUMED] — plan task MUST run `npm view d3-geo version`, `npm view topojson-client version`, `npm view world-atlas version`, `npm view @types/d3-geo version`, `npm view @types/topojson-client version` before writing `pnpm add` commands. Versions above match handoff unpkg URLs; upgrade to latest patch if registry shows newer.

### Supporting

| Library   | Version           | Purpose                                                        | When to Use                                                                                                               |
| --------- | ----------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `zustand` | already `^5.0.12` | Trigger state for `__showGlobeLoader` <-> `<FullscreenLoader>` | Only if we need cross-tree state; a module-scoped signal + `useSyncExternalStore` is simpler for a single boolean+timeout |
| `clsx`    | already `^2.1.1`  | Conditional class composition                                  | Merge RTL flip class + base classes                                                                                       |

### Alternatives Considered

| Instead of                                | Could Use                                      | Tradeoff                                                                                                                                                      |
| ----------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `d3-geo` standalone                       | full `d3` umd bundle                           | Handoff uses full d3 via CDN (`d3.geoOrthographic`, `d3.geoPath`, `d3.geoGraticule10`) but this ships ~280KB vs ~45KB for d3-geo alone. Port uses submodules. |
| `world-atlas` npm                         | Vendor `countries-110m.json` in repo           | D-06 forbids — keeps dep versioned and tree-shakeable                                                                                                         |
| `framer-motion` `useReducedMotion`        | Hand-rolled matchMedia hook                    | D-13 bans framer-motion for Phase 37; hook is 12 LOC                                                                                                          |
| `vite-plugin-svgr` for flags              | Inline TSX `<svg>` with `<path>`               | D-12 locks TSX-per-flag for git-friendly diffs and tree-shaking                                                                                               |
| `flag-icons` (already installed `^7.5.0`) | Use this package instead of 24 hand-drawn SVGs | D-09 forbids — handoff flag paths are the design source; `flag-icons` is retained for any other UI                                                            |

**Installation:**

```bash
pnpm --filter frontend add d3-geo@^3.1.1 topojson-client@^3.1.0 world-atlas@^2.0.2
pnpm --filter frontend add -D @types/d3-geo @types/topojson-client
```

## Architecture Patterns

### System Architecture Diagram

```
+------------------------- AppShell.tsx -----------------------------+
|  <Suspense fallback={<FullscreenLoader open={true} />}>            |
|    +-- routes render here                                          |
|  </Suspense>                                                       |
|                                                                    |
|  Imperative: window.__showGlobeLoader(ms)   [DEV only]             |
|       |                                                            |
|       v                                                            |
|  shared signal / zustand store                                     |
|       |                                                            |
|       v                                                            |
|  <FullscreenLoader open ms>                                        |
|       |                                                            |
|       +-- backdrop (color-mix + backdrop-filter)                   |
|       +-- <GlobeLoader size={120}>                                 |
|             |                                                      |
|             +-- CSS rings (paint immediately)                      |
|             +-- CSS halo (paint immediately)                       |
|             +-- host <div ref> --> useEffect                       |
|                                     |                              |
|                                     v                              |
|                 ensureWorld() [memoized promise]                   |
|                   +-- await import('d3-geo')                       |
|                   +-- await import('topojson-client')              |
|                   +-- await import('world-atlas/countries-110m.json')|
|                   |                                                |
|                   v                                                |
|                 d3.geoOrthographic().scale(96).clipAngle(90)       |
|                   |                                                |
|                   v                                                |
|                 rAF loop: rotate([lambda, -18]) every frame        |
|                   | (unless prefers-reduced-motion -> pin lambda=0)|
|                   v                                                |
|                 svg.select(sphere/grat/land).attr('d', path)       |
+--------------------------------------------------------------------+

       +-- GlobeSpinner (inline, currentColor, 40x40 SVG) ---+
       |   pure CSS @keyframes rotate                        |
       |   no d3                                             |
       +-----------------------------------------------------+

       +-- DossierGlyph -----------------------------------+
       |   props: { type, iso?, name?, size? }             |
       |   +-- type === 'country' + iso in 24-set -> flag  |
       |   +-- type === 'country' + unknown iso -> initials|
       |   +-- type in {forum, person, topic, organization}|
       |         -> symbol in soft-tinted circle           |
       +---------------------------------------------------+

       +-- Sparkline --------------------------------------+
       |   props: { data: number[] }                       |
       |   SVG 80x22, polyline min-max normalized          |
       |   trailing dot at data[last]                      |
       |   useDirection()==='rtl' -> transform: scaleX(-1) |
       +---------------------------------------------------+

       +-- Donut ------------------------------------------+
       |   props: { value: number, variants: [ok,risk,bad]}|
       |   3 stacked <circle strokeDasharray=…>            |
       |   center pill showing percent                     |
       +---------------------------------------------------+
```

### Recommended Project Structure

```
frontend/src/
  components/
    signature-visuals/
      index.ts                    # barrel
      GlobeLoader.tsx             # d3 + rAF
      FullscreenLoader.tsx        # overlay + GlobeLoader
      GlobeSpinner.tsx            # inline currentColor SVG
      globe-loader.css            # rings/halo @keyframes, reduced-motion media query
      DossierGlyph.tsx            # resolver + circle clip + hairline
      Sparkline.tsx               # polyline + trailing dot
      Donut.tsx                   # stacked dasharray + percent pill
      ensureWorld.ts              # lazy d3/topojson/world-atlas loader (memoized)
      globeLoaderSignal.ts        # shared state for window global <-> <FullscreenLoader open>
      flags/
        index.ts                  # { sa, ae, id, eg, … } keyed map
        sa.tsx
        ae.tsx
        ... (24 total)
  design-system/
    hooks/
      useReducedMotion.ts         # NEW — matchMedia + useSyncExternalStore
      index.ts                    # add export
```

### Pattern 1: Lazy d3-geo import (verbatim port)

**What:** First `<GlobeLoader>` mount triggers a memoized promise that resolves d3-geo, topojson-client, and world-atlas in parallel.
**When to use:** Only inside GlobeLoader; the spinner does not touch d3.
**Example:**

```typescript
// Source: handoff loader.jsx lines 10-33
// frontend/src/components/signature-visuals/ensureWorld.ts
import type { GeoPermissibleObjects } from 'd3-geo'

let _worldPromise: Promise<EnsureWorldResult> | null = null

interface EnsureWorldResult {
  countries: GeoPermissibleObjects
  graticule: GeoPermissibleObjects
  d3: typeof import('d3-geo')
}

export function ensureWorld(): Promise<EnsureWorldResult> {
  if (_worldPromise !== null) return _worldPromise
  _worldPromise = (async () => {
    const [d3, topojson, worldModule] = await Promise.all([
      import('d3-geo'),
      import('topojson-client'),
      import('world-atlas/countries-110m.json'),
    ])
    const world = (worldModule as { default: unknown }).default
    const countries = topojson.feature(
      world as Parameters<typeof topojson.feature>[0],
      (world as { objects: { countries: unknown } }).objects.countries as Parameters<
        typeof topojson.feature
      >[1],
    )
    const graticule = d3.geoGraticule10()
    return { countries, graticule, d3 }
  })()
  return _worldPromise
}
```

[CITED: handoff loader.jsx lines 10-33]

### Pattern 2: rAF rotation loop with reduced-motion guard

```typescript
// Source: handoff loader.jsx lines 38-80, augmented with D-14 reduced-motion gate
useEffect((): (() => void) => {
  let raf = 0
  let cancelled = false
  ;(async (): Promise<void> => {
    const { countries, graticule, d3 } = await ensureWorld()
    if (cancelled || hostRef.current === null) return
    const svg = d3.select(hostRef.current).append('svg').attr('viewBox', '-100 -100 200 200')
    const projection = d3.geoOrthographic().scale(96).translate([0, 0]).clipAngle(90)
    const path = d3.geoPath(projection)
    // ... sphere, graticule, land appends ...
    const start = performance.now()
    const tick = (now: number): void => {
      if (cancelled) return
      const lambda = reducedMotion ? 0 : ((((now - start) / 1000) * speed) % 360) - 180
      projection.rotate([lambda, -18])
      sphere.attr('d', path)
      grat.attr('d', path)
      land.attr('d', path)
      if (!reducedMotion) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
  })().catch((err) => console.warn('GlobeLoader: topojson failed to load', err))
  return (): void => {
    cancelled = true
    if (raf !== 0) cancelAnimationFrame(raf)
  }
}, [speed, reducedMotion])
```

[CITED: handoff loader.jsx lines 38-80; reduced-motion fold-in per D-14]

### Pattern 3: useReducedMotion hook (new)

```typescript
// frontend/src/design-system/hooks/useReducedMotion.ts
import { useSyncExternalStore } from 'react'

const query = '(prefers-reduced-motion: reduce)'

function subscribe(cb: () => void): () => void {
  const mql = window.matchMedia(query)
  mql.addEventListener('change', cb)
  return (): void => mql.removeEventListener('change', cb)
}

function getSnapshot(): boolean {
  return window.matchMedia(query).matches
}

function getServerSnapshot(): boolean {
  return false
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
```

[CITED: React 19 `useSyncExternalStore` is the correct primitive for matchMedia subscriptions]

### Pattern 4: Sparkline RTL flip via useDirection

```typescript
// Source: existing design-system hook (verified at frontend/src/design-system/hooks/useLocale.ts + useDesignDirection.ts)
import { useDirection } from '@/design-system/hooks'
// or read Zustand id.locale directly via useLocale() if useDirection is not re-exported

export function Sparkline({ data }: { data: number[] }): JSX.Element {
  const dir = useDirection()
  const style = dir === 'rtl' ? { transform: 'scaleX(-1)' } : undefined
  // ... 80x22 polyline math ...
  return <svg width={80} height={22} style={style}>{/* ... */}</svg>
}
```

`scaleX(-1)` is the VIZ-05 sanctioned treatment. Text labels inside the sparkline (if any) must not be inside the scaled group. [CITED: VIZ-05 requirement line]

### Anti-Patterns to Avoid

- **Using d3 globally via UMD CDN** — handoff did this for prototype speed; production must use ES submodules for tree-shaking and CSP compliance.
- **`textAlign: 'right'` for RTL text** — project RTL guidelines in CLAUDE.md mandate `text-start`/`text-end`, not `text-left`/`text-right`.
- **Manual `.reverse()` on Sparkline data in RTL** — double-flip. Use `scaleX(-1)` ONLY.
- **Mounting GlobeLoader eagerly** — always lazy; d3+topojson+world-atlas is ~180KB.
- **Using `framer-motion`'s `useReducedMotion`** — D-13 bans framer-motion for Phase 37.
- **Inline raw HTML injection for flag paths** — all flag SVGs MUST be authored as TSX with explicit `<path d="…">` children. Never inject untrusted string content into SVG; never use React's risky HTML-setting prop for any flag content.
- **Dynamic `import('world-atlas/countries-110m.json')` without verifying Vite JSON asset handling** — Vite natively imports JSON, but the default `?url` vs `?inline` behavior needs confirmation; see Open Question O-1.

## Don't Hand-Roll

| Problem                                             | Don't Build                                     | Use Instead                                                            | Why                                                                            |
| --------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Orthographic globe projection                       | Custom lat/long -> XY math                      | `d3-geo` `geoOrthographic()`                                           | Handles clipping, rotation composition, scale factors, edge cases              |
| Topojson decoding                                   | Custom topojson -> GeoJSON walker               | `topojson-client` `feature()`                                          | Arc-sharing logic is non-trivial                                               |
| World country boundaries                            | Vendored JSON                                   | `world-atlas` npm                                                      | Versioned, tree-shakeable, maintained by Bostock                               |
| Reduced-motion detection                            | Custom `document.addEventListener('change', …)` | `useSyncExternalStore(matchMedia)`                                     | React 19 primitive; handles SSR and concurrent rendering correctly             |
| Flag rendering                                      | Generic `<img>` with external URL               | Inline TSX SVG                                                         | No network roundtrip, no FOUC, currentColor-compatible, tree-shakeable         |
| RTL direction detection                             | `document.dir` read in effect                   | `useDirection()` / `useLocale()` from design-system hooks              | Subscribes to `id.locale` Zustand store; pre-hydrated by Phase 34 bootstrap.js |
| Trigger state (`__showGlobeLoader` <-> `open` prop) | Custom event bus                                | Module-scoped signal + `useSyncExternalStore`, OR a tiny zustand store | Both safely handle cross-tree reads without re-renders of the whole app        |

**Key insight:** Every primitive in Phase 37 either uses an existing library (d3-geo, topojson-client) OR is a verbatim port of known-correct SVG markup — there is NO novel algorithmic code. Plans should treat this phase as "transcribe + type + test", not "design".

## Runtime State Inventory

Not applicable — Phase 37 is greenfield component authoring with no rename/refactor/migration. No stored data, no live service config, no OS-registered state, no secret/env renames, no build artifacts carry "devos-" / legacy names.

## Common Pitfalls

### Pitfall 1: Vite JSON import returns `{ default }` wrapper

**What goes wrong:** `await import('world-atlas/countries-110m.json')` returns `{ default: { type: 'Topology', … } }`, not the Topology directly. Passing the wrapper to `topojson.feature()` crashes.
**Why it happens:** Vite/ESM JSON imports wrap the value in a `default` export namespace.
**How to avoid:** Always extract `.default` before passing to topojson-client. Port pattern must update from handoff (which used UMD `fetch().then(r=>r.json())` — no wrapper).
**Warning signs:** `TypeError: Cannot read properties of undefined (reading 'objects')` at topojson.feature call site.

### Pitfall 2: rAF leak on Suspense unmount

**What goes wrong:** If `<GlobeLoader>` unmounts mid-frame, the rAF callback tries to mutate a detached SVG.
**Why it happens:** `cancelAnimationFrame` only cancels the _next_ frame; a currently-executing callback completes.
**How to avoid:** Use the `cancelled` boolean flag inside `tick()` as handoff does (loader.jsx line 64) — AND check `hostRef.current !== null` before d3 mutations.
**Warning signs:** Console error `Cannot read properties of null (reading 'appendChild')` during rapid navigation.

### Pitfall 3: backdrop-filter unsupported -> invisible modal

**What goes wrong:** Old Firefox + older Safari don't support `backdrop-filter: blur(3px)`. Without fallback, the semi-transparent layer looks washed out and unreadable.
**Why it happens:** `backdrop-filter` was behind a flag in Firefox until v103; older Webkit needs `-webkit-backdrop-filter`.
**How to avoid:** Use `@supports not (backdrop-filter: blur(3px))` fallback with `color-mix(in srgb, var(--bg) 95%, transparent)` (no blur). Per D-08 Claude's Discretion.
**Warning signs:** Design QA against screenshot shows faint/washed backdrop in Firefox.

### Pitfall 4: Reduced-motion skip breaks progressive render

**What goes wrong:** If `reducedMotion === true` and we `return` early from the effect, the globe never renders the land mesh (static globe is still correct behavior — but must render ONCE).
**Why it happens:** Conditional short-circuit on reduced-motion skips the d3.select/append path.
**How to avoid:** Always run the d3 setup + a single `projection.rotate([0, -18])` + initial path update. Only skip the rAF tick loop.
**Warning signs:** Reduced-motion users see only rings + halo with no country outlines.

### Pitfall 5: Symbol fallback tint color-mix unsupported

**What goes wrong:** `color-mix(in srgb, …)` is relatively new (Baseline mid-2023). Users on Safari <16.2 see a transparent circle.
**Why it happens:** No fallback provided.
**How to avoid:** Use `@supports (color: color-mix(in srgb, red, blue))` feature query to provide a solid-color fallback (e.g., `var(--surface-raised)`).
**Warning signs:** QA screenshot shows blank glyph circles.

### Pitfall 6: DossierType union mismatch

**What goes wrong:** `<DossierGlyph type="working_group" />` crashes because the handoff glyph.jsx only handles `country | forum | person | topic | organization`.
**Why it happens:** Codebase has 8 dossier types (ROADMAP lists: country, organization, forum, engagement, topic, working_group, person, elected_official) but handoff only defined 5.
**How to avoid:** DossierGlyph accepts `DossierType` union from `frontend/src/types/dossier-context.types.ts` — for unsupported types, render initials fallback (reuse D-11 path).
**Warning signs:** TS error at consumer sites in Phases 38-40.

### Pitfall 7: Sparkline trailing dot outside viewBox in RTL

**What goes wrong:** The trailing dot sits at `data[length-1]`'s X coordinate; after `scaleX(-1)` that X becomes physically on the left edge, potentially clipped by stroke width.
**Why it happens:** `scaleX(-1)` flips around X=0, pushing content off canvas unless origin is shifted.
**How to avoid:** Apply `transform: scaleX(-1) translateX(-100%)` OR `transform-origin: center` on the flipped group.
**Warning signs:** RTL QA shows missing trailing dot or clipped stroke.

## Code Examples

### GlobeSpinner (verbatim port, no d3)

```typescript
// Source: handoff loader.jsx lines 121-144
// frontend/src/components/signature-visuals/GlobeSpinner.tsx
interface GlobeSpinnerProps {
  size?: 16 | 20 | 24 | 32 | 48
  'aria-label'?: string
}

export function GlobeSpinner({ size = 20, 'aria-label': ariaLabel = 'Loading' }: GlobeSpinnerProps): JSX.Element {
  return (
    <span
      className="globe-spinner"
      style={{ width: size, height: size, display: 'inline-flex' }}
      role="status"
      aria-label={ariaLabel}
    >
      <svg viewBox="0 0 40 40" width={size} height={size}>
        <g className="gs-whirl">
          <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor"
            strokeWidth="1.4" strokeLinecap="round"
            strokeDasharray="14 90" opacity="0.55" />
        </g>
        <g className="gs-globe">
          <circle cx="20" cy="20" r="11" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.85" />
          <ellipse cx="20" cy="20" rx="11" ry="4.5" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.55" />
          <ellipse cx="20" cy="20" rx="4.5" ry="11" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.55" />
        </g>
      </svg>
    </span>
  )
}
```

Accompanying CSS (globe-loader.css):

```css
.gs-whirl {
  transform-origin: center;
  animation: gs-whirl 1.4s linear infinite;
}
.gs-globe {
  transform-origin: center;
  animation: gs-globe 2.8s linear infinite reverse;
}
@keyframes gs-whirl {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
@keyframes gs-globe {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .gs-whirl,
  .gs-globe {
    animation: none;
  }
}
```

[CITED: VIZ-03 requirement timings (1.4s + 2.8s reverse) + handoff loader.jsx spinner markup]

### DossierGlyph resolver skeleton

```typescript
// Source: verbatim port from handoff glyph.jsx + D-09/10/11 locked decisions
// frontend/src/components/signature-visuals/DossierGlyph.tsx
import { flags, type FlagKey } from './flags'
import type { DossierType } from '@/types/dossier-context.types'

const SYMBOL_MAP: Partial<Record<DossierType, string>> = {
  forum: '\u25C7',         // diamond-open
  person: '\u25CF',        // filled-circle
  topic: '\u25C6',         // diamond-filled
  organization: '\u25B2',  // filled-triangle
}

interface DossierGlyphProps {
  type: DossierType
  iso?: string     // country ISO alpha-2 (lowercase)
  name?: string    // fallback for initials
  size?: number    // default 32
  accent?: string  // CSS color for symbol tint
}

export function DossierGlyph({ type, iso, name, size = 32, accent = 'var(--ink)' }: DossierGlyphProps): JSX.Element {
  if (type === 'country' && iso !== undefined) {
    const key = iso.toLowerCase() as FlagKey
    const FlagSvg = flags[key]
    if (FlagSvg !== undefined) {
      return (
        <span style={{ width: size, height: size, display: 'inline-block' }}>
          <svg viewBox="0 0 32 32" width={size} height={size}>
            <defs><clipPath id={`clip-${key}`}><circle cx="16" cy="16" r="16" /></clipPath></defs>
            <g clipPath={`url(#clip-${key})`}><FlagSvg /></g>
            <circle cx="16" cy="16" r="15.5" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
          </svg>
        </span>
      )
    }
    return <InitialsBadge name={name ?? iso} size={size} />
  }
  const symbol = SYMBOL_MAP[type]
  if (symbol !== undefined) {
    return (
      <span
        style={{
          width: size, height: size, display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center',
          borderRadius: '50%',
          background: `color-mix(in srgb, ${accent} 12%, var(--surface-raised))`,
          color: accent,
          fontSize: size * 0.5,
        }}
      >{symbol}</span>
    )
  }
  return <InitialsBadge name={name ?? '?'} size={size} />
}
```

### Donut via stacked strokeDasharray

```typescript
// Source: VIZ-05 spec + handoff dashboard.jsx Donut usage
interface DonutProps {
  value: number                       // 0-100 percentage for center pill
  variants: [number, number, number]  // [ok, risk, bad] percentages summing <= 100
  size?: number
}

export function Donut({ value, variants, size = 72 }: DonutProps): JSX.Element {
  const r = 14
  const c = 2 * Math.PI * r   // circumference
  const [ok, risk, bad] = variants
  const segOk   = (ok   / 100) * c
  const segRisk = (risk / 100) * c
  const segBad  = (bad  / 100) * c
  return (
    <svg viewBox="0 0 36 36" width={size} height={size}>
      <circle cx="18" cy="18" r={r} fill="none" stroke="var(--surface-raised)" strokeWidth="4" />
      <circle cx="18" cy="18" r={r} fill="none" stroke="var(--ok)"   strokeWidth="4"
              strokeDasharray={`${segOk} ${c}`} strokeDashoffset={0} transform="rotate(-90 18 18)" />
      <circle cx="18" cy="18" r={r} fill="none" stroke="var(--risk)" strokeWidth="4"
              strokeDasharray={`${segRisk} ${c}`} strokeDashoffset={-segOk} transform="rotate(-90 18 18)" />
      <circle cx="18" cy="18" r={r} fill="none" stroke="var(--bad)"  strokeWidth="4"
              strokeDasharray={`${segBad} ${c}`} strokeDashoffset={-(segOk + segRisk)} transform="rotate(-90 18 18)" />
      <text x="18" y="19" textAnchor="middle" fontSize="8" fill="var(--ink)" fontWeight="600">
        {Math.round(value)}%
      </text>
    </svg>
  )
}
```

## State of the Art

| Old Approach                          | Current Approach                                                        | When Changed            | Impact                                        |
| ------------------------------------- | ----------------------------------------------------------------------- | ----------------------- | --------------------------------------------- |
| Full d3 UMD bundle via CDN script tag | ES submodule imports (`d3-geo`, `topojson-client`) via Vite lazy import | d3 v4+ (2016) / Vite 2+ | ~280KB -> ~45KB; tree-shakeable; CSP-friendly |
| `document.dir` read + effect          | `useSyncExternalStore(matchMedia)` / design-system `useDirection()`     | React 18+               | Concurrent-rendering safe                     |
| `setTimeout`-driven animations        | `@keyframes` + `requestAnimationFrame`                                  | Always                  | 60fps, GPU-accelerated                        |
| `<img>` flag sprites                  | Inline `<svg>` React components                                         | Since 2020              | currentColor, no network, tree-shakeable      |
| `prefers-reduced-motion` CSS only     | CSS media query + JS hook (defense in depth)                            | D-16                    | Catches JS-driven d3 rotation that CSS cannot |

**Deprecated/outdated:**

- CDN-loaded d3 UMD — handoff prototype only; MUST NOT ship.
- `framer-motion useReducedMotion` — banned for Phase 37 per D-13.
- `flag-icons` npm package for these 24 flags — D-09 locks hand-drawn paths from handoff.

## Environment Availability

| Dependency               | Required By                    | Available | Version                                            | Fallback                            |
| ------------------------ | ------------------------------ | --------- | -------------------------------------------------- | ----------------------------------- |
| Node.js                  | Build                          | Yes       | 20.19+ (per CLAUDE.md)                             | —                                   |
| pnpm                     | Install                        | Yes       | 10.29.1+                                           | —                                   |
| Vite                     | Build + lazy import            | Yes       | ^7.3.1                                             | —                                   |
| Vitest                   | Unit tests                     | Yes       | ^4.1.2                                             | —                                   |
| Playwright               | E2E                            | Yes       | ^1.58.2                                            | —                                   |
| axe-core                 | A11y                           | Yes       | `@axe-core/playwright ^4.11.1`, `jest-axe ^10.0.0` | —                                   |
| `d3-geo`                 | GlobeLoader                    | No        | —                                                  | MUST add at plan time — no fallback |
| `topojson-client`        | GlobeLoader                    | No        | —                                                  | MUST add at plan time — no fallback |
| `world-atlas`            | GlobeLoader                    | No        | —                                                  | MUST add at plan time — no fallback |
| `@types/d3-geo`          | TS strict                      | No        | —                                                  | MUST add — or declare `*.d.ts` shim |
| `@types/topojson-client` | TS strict                      | No        | —                                                  | MUST add — or declare shim          |
| `framer-motion`          | (forbidden per D-13)           | Yes       | ^12.38.0                                           | —                                   |
| `react-i18next`          | Reserved (not used this phase) | Yes       | ^17.0.0                                            | —                                   |

**Missing dependencies with no fallback:**

- `d3-geo`, `topojson-client`, `world-atlas`, `@types/d3-geo`, `@types/topojson-client` — planner MUST include an install task in Wave 0.

**Missing dependencies with fallback:** None.

## Validation Architecture

Phase validation is REQUIRED — `workflow.nyquist_validation: true` in `.planning/config.json`.

### Test Framework

| Property           | Value                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------- |
| Unit framework     | Vitest `^4.1.2` + `@testing-library/react` `^16.3.2`                                  |
| E2E framework      | Playwright `^1.58.2`                                                                  |
| A11y               | `jest-axe` `^10.0.0` (unit) + `@axe-core/playwright` `^4.11.1` (E2E)                  |
| Config file        | `frontend/vitest.config.ts` (exists) + `frontend/playwright.config.ts` (exists)       |
| Quick run command  | `pnpm --filter frontend test -- signature-visuals`                                    |
| Full suite command | `pnpm --filter frontend test && pnpm --filter frontend test:e2e -- signature-visuals` |

### Phase Requirements -> Test Map

| Req ID        | Behavior                                                                                    | Test Type   | Automated Command                                                                     | File Exists?         |
| ------------- | ------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------- | -------------------- |
| VIZ-01        | `<GlobeLoader>` mounts, 1.6s splash lifecycle                                               | integration | `vitest run src/components/signature-visuals/__tests__/GlobeLoader.test.tsx`          | Wave 0               |
| VIZ-01        | d3-geo projection rotates at 16 deg/sec (sample 3 ticks, assert delta-lambda)               | unit        | `vitest run src/components/signature-visuals/__tests__/rotation.test.ts`              | Wave 0               |
| VIZ-01        | Ring CSS animation durations are 3.2s / 5.5s / 8s (getComputedStyle)                        | integration | `vitest run src/components/signature-visuals/__tests__/rings.test.tsx`                | Wave 0               |
| VIZ-01        | Reduced-motion pins lambda=0, cancels rAF                                                   | unit        | `vitest run src/components/signature-visuals/__tests__/reduced-motion.test.tsx`       | Wave 0               |
| VIZ-02        | `window.__showGlobeLoader(1600)` opens `<FullscreenLoader>` for 1600ms                      | E2E         | `playwright test e2e/signature-visuals/fullscreen-loader.spec.ts`                     | Wave 0               |
| VIZ-02        | Backdrop computed style includes `color-mix` + `backdrop-filter: blur(3px)`                 | E2E         | `playwright test e2e/signature-visuals/backdrop.spec.ts`                              | Wave 0               |
| VIZ-02        | `import.meta.env.DEV === false` -> window global NOT exposed                                | unit        | `vitest run src/components/signature-visuals/__tests__/dev-gate.test.ts`              | Wave 0               |
| VIZ-03        | `<GlobeSpinner>` renders 40x40, inherits currentColor                                       | unit        | `vitest run src/components/signature-visuals/__tests__/GlobeSpinner.test.tsx`         | Wave 0               |
| VIZ-03        | Whirl 1.4s + globe 2.8s reverse animations                                                  | unit        | included in GlobeSpinner.test.tsx                                                     | Wave 0               |
| VIZ-04        | All 24 ISO codes resolve to flag SVG (snapshot)                                             | unit        | `vitest run src/components/signature-visuals/__tests__/DossierGlyph.flags.test.tsx`   | Wave 0               |
| VIZ-04        | 4 symbol fallbacks render for forum/person/topic/organization                               | unit        | `vitest run src/components/signature-visuals/__tests__/DossierGlyph.symbols.test.tsx` | Wave 0               |
| VIZ-04        | Unknown ISO renders initials fallback                                                       | unit        | included in DossierGlyph.test.tsx                                                     | Wave 0               |
| VIZ-04        | 1px `rgba(0,0,0,0.15)` hairline asserted on flag                                            | unit        | included in DossierGlyph.flags.test.tsx                                               | Wave 0               |
| VIZ-05        | Sparkline polyline points correct for `[1,2,3,4,5]`                                         | unit        | `vitest run src/components/signature-visuals/__tests__/Sparkline.test.tsx`            | Wave 0               |
| VIZ-05        | Sparkline has `transform: scaleX(-1)` when `useDirection()==='rtl'`                         | unit        | included in Sparkline.test.tsx (mock useDirection)                                    | Wave 0               |
| VIZ-05        | Donut stroke-dasharray segments sum to variant percentages                                  | unit        | `vitest run src/components/signature-visuals/__tests__/Donut.test.tsx`                | Wave 0               |
| VIZ-05        | Donut center pill shows `{value}%` rounded                                                  | unit        | included in Donut.test.tsx                                                            | Wave 0               |
| Cross-cutting | axe-core a11y on `<FullscreenLoader open>` (`role="status"`, `aria-live="polite"`)          | E2E         | `playwright test e2e/signature-visuals/a11y.spec.ts`                                  | Wave 0               |
| Cross-cutting | Bundle size — signature-visuals chunk without d3 <= 15KB gzipped; d3 chunk <= 100KB gzipped | CI          | `pnpm --filter frontend size-limit` (config entry to add)                             | Config update needed |

### Sampling Rate

- **Per task commit:** `pnpm --filter frontend test -- signature-visuals` (runs affected Vitest suites)
- **Per wave merge:** full Vitest + Playwright signature-visuals E2E specs
- **Phase gate:** Full suite green + `size-limit` green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `frontend/src/components/signature-visuals/__tests__/` directory — does not exist
- [ ] `frontend/src/components/signature-visuals/__tests__/GlobeLoader.test.tsx`
- [ ] `frontend/src/components/signature-visuals/__tests__/rotation.test.ts`
- [ ] `frontend/src/components/signature-visuals/__tests__/rings.test.tsx`
- [ ] `frontend/src/components/signature-visuals/__tests__/reduced-motion.test.tsx`
- [ ] `frontend/src/components/signature-visuals/__tests__/GlobeSpinner.test.tsx`
- [ ] `frontend/src/components/signature-visuals/__tests__/DossierGlyph.flags.test.tsx`
- [ ] `frontend/src/components/signature-visuals/__tests__/DossierGlyph.symbols.test.tsx`
- [ ] `frontend/src/components/signature-visuals/__tests__/Sparkline.test.tsx`
- [ ] `frontend/src/components/signature-visuals/__tests__/Donut.test.tsx`
- [ ] `frontend/src/components/signature-visuals/__tests__/dev-gate.test.ts`
- [ ] `frontend/e2e/signature-visuals/fullscreen-loader.spec.ts`
- [ ] `frontend/e2e/signature-visuals/backdrop.spec.ts`
- [ ] `frontend/e2e/signature-visuals/a11y.spec.ts`
- [ ] `frontend/e2e/signature-visuals/rtl-sparkline.spec.ts` — covers VIZ-05 RTL mirror via Playwright screenshot-diff
- [ ] `.size-limit.json` entry for signature-visuals chunk budget
- [ ] Test helper: mock `useReducedMotion()` + mock `ensureWorld()` for deterministic tests — add to `frontend/src/test/signature-visuals-mocks.ts`

## Security Domain

`security_enforcement` is not explicitly false in `.planning/config.json`. Required section follows.

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                                                                                                     |
| --------------------- | ------- | -------------------------------------------------------------------------------------------------------------------- |
| V2 Authentication     | no      | N/A (no user input)                                                                                                  |
| V3 Session Management | no      | N/A (stateless visual primitives)                                                                                    |
| V4 Access Control     | no      | N/A (no data fetching)                                                                                               |
| V5 Input Validation   | yes     | Validate `iso` prop (2-3 char lowercase ASCII), `data` array length (cap at e.g. 500), `value` range 0-100           |
| V6 Cryptography       | no      | N/A                                                                                                                  |
| V7 Error Logging      | yes     | `console.warn` only for topojson load failure (no PII); no Sentry breadcrumb for expected degradation                |
| V10 Malicious Code    | yes     | Flag SVGs are static inline TSX paths authored in repo — never injected from a string, never fetched from user input |
| V14 Config            | yes     | `window.__showGlobeLoader` global MUST be gated behind `import.meta.env.DEV` (D-04)                                  |

### Known Threat Patterns for this stack

| Pattern                                                | STRIDE    | Standard Mitigation                                                                                              |
| ------------------------------------------------------ | --------- | ---------------------------------------------------------------------------------------------------------------- |
| XSS via user-supplied `name` prop -> initials fallback | Tampering | Render via React text node (auto-escaped); reject non-string props with TS                                       |
| XSS via user-supplied SVG path (future flag additions) | Tampering | Lock down: all flag SVGs are static inline TSX authored in-repo, NEVER fetched, NEVER injected from string props |
| `window.__showGlobeLoader` abused in prod              | Elevation | `import.meta.env.DEV` gate at module level; Playwright test asserts global absent in prod build                  |
| Topojson URL tampered via CDN                          | Tampering | Vendored via npm (world-atlas), not CDN — Subresource Integrity not needed                                       |
| Clickjacking via `<FullscreenLoader>` overlay          | Spoofing  | Overlay has `pointer-events: none` during splash; button handlers still reachable                                |

## Assumptions Log

| #   | Claim                                                                                                                                                                        | Section                 | Risk if Wrong                                                                                                                                                                                       |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | `d3-geo@^3.1.1`, `topojson-client@^3.1.0`, `world-atlas@^2.0.2` are current on npm                                                                                           | Standard Stack          | LOW — plan must `npm view <pkg> version` before pnpm add. Wrong version causes install failure or stale data, no runtime harm                                                                       |
| A2  | Vite 7 `import('world-atlas/countries-110m.json')` returns `{ default: Topology }`                                                                                           | Pitfall 1               | MEDIUM — if structure differs, runtime TypeError; caught by Wave 0 integration test                                                                                                                 |
| A3  | `frontend/src/design-system/hooks/useDirection` exists and returns `'rtl' \| 'ltr'`                                                                                          | Pattern 4               | LOW — verified via grep; `useLocale` and `useDesignDirection` both present                                                                                                                          |
| A4  | `AppShell.tsx` root has (or can have) a `<Suspense>` boundary for the splash                                                                                                 | Architecture            | MEDIUM — if AppShell is not Suspense-wrapped, add a wrapper at App level. Phase 36 left AppShell.tsx at `frontend/src/components/layout/AppShell.tsx` — verified exists                             |
| A5  | All 24 flag paths in handoff `glyph.jsx` are self-contained (no external image refs)                                                                                         | D-09                    | LOW — handoff is a single JSX file, paths are inline                                                                                                                                                |
| A6  | The 5-member DossierType subset (country/organization/forum/person/topic) covers Phase 38-40 consumer needs; working_group/engagement/elected_official fall back to initials | Pitfall 6               | MEDIUM — if Phase 38 dashboard pins working_group cards, initials may be wrong visual; acceptable per D-11 fallback language                                                                        |
| A7  | `color-mix(in srgb, …)` has adequate support in project's browser matrix                                                                                                     | Pitfall 5               | LOW — Baseline 2023; project CLAUDE.md doesn't define a matrix, assume modern-evergreen                                                                                                             |
| A8  | `backdrop-filter: blur(3px)` falls back gracefully via `@supports`                                                                                                           | D-08, Pitfall 3         | LOW — fallback is explicit in D-08 Claude's Discretion                                                                                                                                              |
| A9  | Bundle-size targets (15KB chunk + 100KB d3 chunk gzipped) are feasible                                                                                                       | Validation Architecture | MEDIUM — needs `size-limit` config check; d3-geo alone ~45KB, world-atlas ~120KB uncompressed / ~35KB gzipped, topojson-client ~14KB. Total d3 chunk ~95KB gzipped — budget sized with 5KB headroom |
| A10 | `useSyncExternalStore` is SSR-safe when project enables SSR                                                                                                                  | Pattern 3               | LOW — project is CSR (Vite SPA); SSR not in scope                                                                                                                                                   |
| A11 | Phase 36 AppShell already coordinates Suspense fallback; Phase 37 only adds the component                                                                                    | D-03                    | LOW — if AppShell lacks Suspense, Phase 37 plan must include a 1-line wrapper at App.tsx                                                                                                            |

**Total assumed claims:** 11. Discuss-phase addressed most architectural questions; planner should re-verify A1 (pinned versions) and A9 (bundle budget) before writing install + size-limit tasks.

## Open Questions

1. **Vite JSON import ergonomics for `world-atlas/countries-110m.json`**
   - What we know: Vite 7 natively imports `.json` as ES module with a `default` export.
   - What's unclear: Whether `import('world-atlas/countries-110m.json')` works out of the box OR requires `vite.config.ts` to add the `countries-110m.json` path to `optimizeDeps.include` / `assetsInclude`.
   - Recommendation: Wave 0 integration test (GlobeLoader mounts, ensureWorld resolves) will confirm. If failure, add `assetsInclude: ['**/world-atlas/*.json']` to vite.config.ts.

2. **Where does `useReducedMotion()` live?**
   - What we know: No existing implementation in `frontend/src/hooks/` or `frontend/src/design-system/`.
   - What's unclear: Whether it belongs in `frontend/src/design-system/hooks/` (co-located with `useLocale`, `useDirection`) or `frontend/src/hooks/` (with other feature hooks).
   - Recommendation: Place in `frontend/src/design-system/hooks/useReducedMotion.ts` — aligns with existing `useDesignDirection.ts` and makes it available to all token-consuming components.

3. **Trigger state: zustand store vs module-scoped signal?**
   - What we know: The trigger API needs to be readable by both `window.__showGlobeLoader` (imperative) and `<FullscreenLoader>` (declarative).
   - What's unclear: Whether to use a new zustand slice (already `zustand@^5.0.12`) or a tiny module-scoped `let state = …` + `useSyncExternalStore`.
   - Recommendation: Module-scoped signal — simpler, <20 LOC, zero new zustand slices. Plan tasks can override if conventions differ.

4. **Sparkline direction source: `useDirection()` vs `dir` prop vs `:dir(rtl)` CSS?**
   - What we know: Project has `useDirection()` available; Phase 34 bootstrap.js pre-paints `html.dir`.
   - What's unclear: Which is canonical. `:dir(rtl)` is pure-CSS and needs no hook subscription.
   - Recommendation: Use `:dir(rtl) .sparkline-svg { transform: scaleX(-1); }` as primary, with `useDirection()` as a belt-and-braces fallback readable by tests. Lowest runtime cost.

5. **Exact d3-geo submodule vs full d3-geo-projection?**
   - What we know: Handoff uses `d3.geoOrthographic`, `d3.geoPath`, `d3.geoGraticule10`. All three are in the `d3-geo` package.
   - What's unclear: None — `d3-geo-projection` (different pkg) provides exotic projections only. Not needed.
   - Recommendation: `d3-geo` alone — confirmed.

6. **Size-limit budget for d3 lazy chunk**
   - What we know: d3-geo ~45KB + topojson-client ~14KB + world-atlas countries-110m.json ~120KB uncompressed.
   - What's unclear: Gzipped total — needs empirical measurement.
   - Recommendation: Wave 0 task: run `pnpm --filter frontend build` and measure chunk size, then set `.size-limit.json` budget at measured + 10% headroom.

7. **Should `<GlobeSpinner>` accept arbitrary sizes (not just 16/20/24/32/48)?**
   - What we know: VIZ-03 specifies 40x40 `viewBox` but handoff allows `size` prop.
   - What's unclear: Whether to lock to the 5-value union or allow `number`.
   - Recommendation: Allow `number` with default 20 — matches handoff; consumer can pass any size. Limits too tight cause downstream friction.

8. **Does `AppShell.tsx` currently have a Suspense boundary to replace/augment?**
   - What we know: `frontend/src/components/layout/AppShell.tsx` exists (Phase 36).
   - What's unclear: Current Suspense structure.
   - Recommendation: Planner opens AppShell.tsx in task 37-01 and either wraps existing children in `<Suspense fallback={<FullscreenLoader open />}>` or elevates to App.tsx root.

## Project Constraints (from CLAUDE.md)

The following directives MUST be honored by all Phase 37 plans:

- **Tech stack lock:** React 19, Vite 7, Tailwind v4, TypeScript strict. No framework migrations. `framer-motion` exists but is forbidden for Phase 37 per D-13.
- **RTL logical properties:** Use `ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`, `start-*`, `end-*`, `rounded-s-*`, `rounded-e-*`. NEVER `ml-*`, `mr-*`, `left-*`, `right-*`, `text-left`, `text-right`, `rounded-l-*`, `rounded-r-*`.
- **Mobile-first:** Minimum 44x44 touch targets for interactive elements. GlobeSpinner when used inside a button must not reduce touch area below 44x44.
- **HeroUI v3 hierarchy:** If any Phase 37 primitive needs a HeroUI component (e.g., for a future Donut tooltip), follow the HeroUI v3 -> Aceternity -> Kibo-UI -> shadcn order. Phase 37 primitives are hand-rolled SVG — no HeroUI needed.
- **Naming:** PascalCase `.tsx` components, camelCase hooks prefixed `use`, `.types.ts` suffix for types.
- **Code style:** No semicolons (Prettier config), single quotes, trailing commas, 100-char line width, 2-space indent.
- **TypeScript strict:** Explicit return types required; no `any`; no floating promises; strict boolean expressions.
- **Testing:** Vitest for unit/integration, Playwright for E2E, axe-core for a11y.
- **No direct repo edits outside GSD workflow:** Phase 37 work flows through `/gsd:execute-phase`.
- **Dossier-centric:** `<DossierGlyph>` type prop MUST accept the canonical `DossierType` union from `frontend/src/types/dossier-context.types.ts` (8 types) — Phase 37 handles 5 visually, 3 fall back to initials.
- **Work management terminology:** Not applicable (no assignees/priorities/statuses in visual primitives).
- **i18next:** Phase 37 primitives are non-textual; only `<FullscreenLoader label={…}>` and GlobeSpinner `aria-label` need i18n. Consumer supplies translated string.

## Sources

### Primary (HIGH confidence)

- **Handoff source of truth:**
  - `/tmp/inteldossier-handoff/inteldossier/project/src/loader.jsx` — GlobeLoader/FullscreenLoader/GlobeSpinner reference (147 lines, read in full)
  - `/tmp/inteldossier-handoff/inteldossier/project/src/glyph.jsx` — DossierGlyph reference (flag paths live here)
  - `/tmp/inteldossier-handoff/inteldossier/project/src/dashboard.jsx` — Sparkline/Donut consumer patterns
  - `/tmp/inteldossier-handoff/inteldossier/project/src/themes.jsx` — token var names (Phase 33 carry-forward)
- **Phase docs:**
  - `.planning/phases/37-signature-visuals/37-CONTEXT.md` (16 locked decisions)
  - `.planning/REQUIREMENTS.md` lines 48-60 (VIZ-01...VIZ-05)
  - `.planning/ROADMAP.md` lines 194-215 (Phase 37 success criteria)
  - `.planning/config.json` (nyquist_validation: true)
- **Codebase:**
  - `frontend/package.json` (versions verified)
  - `frontend/src/design-system/hooks/` (useLocale, useDesignDirection verified)
  - `frontend/src/components/layout/AppShell.tsx` (exists; Phase 36)
  - `frontend/src/types/dossier-context.types.ts` line 71 (DossierType union)

### Secondary (MEDIUM confidence)

- `CLAUDE.md` (project-wide RTL + HeroUI + naming directives)
- Prior CONTEXT.md (33, 34, 36) referenced by name

### Tertiary (LOW confidence)

- d3-geo / topojson-client / world-atlas exact semver on npm — MUST be verified by planner (A1). Training-era knowledge pins them to known-stable majors.

## Metadata

**Confidence breakdown:**

- Standard stack: MEDIUM -> HIGH after planner runs `npm view` for exact versions
- Architecture: HIGH — verbatim port, no novel design
- Pitfalls: HIGH — 7 concrete pitfalls with detection criteria
- Validation: HIGH — 19 test mappings with exact file paths and commands
- Security: HIGH — ASVS categories triaged, window global explicitly gated

**Research date:** 2026-04-24
**Valid until:** 2026-05-24 (stable primitives + stable d3-geo package; revisit only if d3-geo v4 or topojson-client v4 ships)
