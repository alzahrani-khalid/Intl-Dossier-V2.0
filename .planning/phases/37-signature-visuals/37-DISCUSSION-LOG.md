# Phase 37: signature-visuals - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `37-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-04-24
**Phase:** 37-signature-visuals
**Areas discussed:** Handoff fidelity, d3-geo + topojson loading, 24 flag SVGs source, Animation + reduced-motion

---

## Gray Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Handoff fidelity (Recommended) | Verbatim port vs componentize/refactor. Folds in splash mount site + file organization. | ✓ |
| d3-geo + topojson loading (Recommended) | Lazy dynamic import vs static vs bundle-local JSON. | ✓ |
| 24 flag SVGs source (Recommended) | Copy handoff verbatim vs npm flag-icons vs emoji. | ✓ |
| Animation + reduced-motion policy | CSS @keyframes vs framer-motion + prefers-reduced-motion handling. | ✓ (added in second round) |

---

## Handoff fidelity

### Port strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Verbatim TS rewrite (Recommended) | 1:1 port from JSX to TSX preserving every d3 call, timing, SVG path. Lowest risk against handoff screenshots. | ✓ |
| Componentize/refactor | Rewrite with pure React + hooks, extract subcomponents. Cleaner but must re-verify parity. | |
| Hybrid: verbatim first, refactor later | Ship verbatim port for Phase 37; file a deferred-idea for refactor. | |

**User's choice:** Verbatim TS rewrite (Recommended)
**Notes:** Preserves pixel-parity against `globe-loader.png` and `tajawal-donut*.png`; accepts imperative d3 inside a useEffect.

### File layout

| Option | Description | Selected |
|--------|-------------|----------|
| frontend/src/components/signature-visuals/ (Recommended) | Single folder with all primitives + barrel index.ts. | ✓ |
| Split across components/ui/ | Drop each into components/ui/ alongside HeroUI wrappers. | |
| Under design-system/primitives/ | Group under design-system/primitives/. | |

**User's choice:** frontend/src/components/signature-visuals/ (Recommended)
**Notes:** Matches phase name; easy imports for Phase 38–40.

### Splash mount site

| Option | Description | Selected |
|--------|-------------|----------|
| AppShell + Suspense boundary (Recommended) | Render <FullscreenLoader open={!hydrated}> at AppShell root. | ✓ |
| bootstrap.js pre-paint | Inject globe SVG via bootstrap.js before React boots. | |
| Dedicated <AppSplash> gate in main.tsx | Splash gate above <App /> that fades out after 1.6s. | |

**User's choice:** AppShell + Suspense boundary (Recommended)
**Notes:** Ties splash lifecycle to React hydration; respects route transitions for Phase 38+.

### Trigger API (VIZ-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Both: window global + <FullscreenLoader> prop (Recommended) | window.__showGlobeLoader(ms) (dev-gated) + React prop API. | ✓ |
| React-only via useGlobeLoader() hook | useGlobeLoader() hook returning {show, hide}. No window global. | |
| window global always (dev + prod) | Match handoff exactly — window.__showGlobeLoader in prod. | |

**User's choice:** Both (Recommended)
**Notes:** Window global behind `import.meta.env.DEV` gate; React prop for idiomatic consumers.

---

## d3-geo + topojson loading

### Load strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Lazy dynamic import on first mount (Recommended) | await import('d3-geo') on first <GlobeLoader> mount. Saves ~180KB initial bundle. | ✓ |
| Static import, chunked by Vite | import * as d3 from 'd3-geo' at module top. Splash is instant. | |
| Lazy + <link rel="modulepreload"> | Lazy-load + prefetch chunk in index.html. Best of both. | |

**User's choice:** Lazy dynamic import on first mount (Recommended)
**Notes:** Matches handoff exactly; progressive render (D-07) handles the flash-before-mesh case.

### Topojson source

| Option | Description | Selected |
|--------|-------------|----------|
| npm world-atlas package (Recommended) | import topo from 'world-atlas/countries-110m.json'. | ✓ |
| Bundled local file in frontend/src/assets/ | Vendor countries-110m.json into the repo. | |
| Fetched from public/ at runtime | Serve from public/countries-110m.json and fetch() on first load. | |

**User's choice:** npm world-atlas package (Recommended)
**Notes:** Versioned dep, tree-shakeable; no vendored JSON in repo.

### Load fallback

| Option | Description | Selected |
|--------|-------------|----------|
| Whirl rings + halo only, land fills in (Recommended) | Rings + halo render immediately from CSS; countries mesh paints in on load. | ✓ |
| Static circle placeholder | Plain <circle> + halo; swap to mesh on load. | |
| Hide entirely until ready | Don't render anything until d3 + topojson both resolved. | |

**User's choice:** Whirl rings + halo only, land fills in (Recommended)
**Notes:** Always looks "alive"; no flash of nothing during the 1.6s splash.

### Fail mode

| Option | Description | Selected |
|--------|-------------|----------|
| Fallback to whirl rings + halo only (Recommended) | Drop mesh silently; console.warn once. | ✓ |
| Log error, dismiss splash early | console.error + dismiss <FullscreenLoader> before 1.6s. | |
| Hard fail visible | Show '⚠ globe failed to load' in dev, silent in prod. | |

**User's choice:** Fallback to whirl rings + halo only (Recommended)
**Notes:** No user-visible error; single console.warn for dev observability.

---

## 24 flag SVGs source

### Flag source

| Option | Description | Selected |
|--------|-------------|----------|
| Copy handoff SVGs verbatim (Recommended) | Port 24 inline <path> definitions from handoff glyph.jsx. | ✓ |
| Use npm flag-icons package | ~1.2MB of flag assets; polished but visually different from handoff. | |
| Emoji flags via system font | 🇸🇦 etc. Zero bytes but Windows renders as 'SA' text. | |

**User's choice:** Copy handoff SVGs verbatim (Recommended)
**Notes:** Matches handoff screenshots exactly; each flag ~200 bytes.

### Symbol fallback

| Option | Description | Selected |
|--------|-------------|----------|
| Unicode symbols in soft-tinted circles (Recommended) | forum ◇, person ●, topic ◆, organization ▲ — matches VIZ-04 verbatim. | ✓ |
| Custom SVG paths per type | Author 4 dedicated <path> icons. | |
| lucide-react icons reused | Map to MessageSquare / User / Hash / Building2. | |

**User's choice:** Unicode symbols in soft-tinted circles (Recommended)
**Notes:** Zero bytes; VIZ-04 spec verbatim; soft tint via color-mix.

### Unknown ISO

| Option | Description | Selected |
|--------|-------------|----------|
| Fallback to initials chip (Recommended) | Soft-tinted circle with 1–2 uppercase letters from country name. | ✓ |
| Blank circle with hairline | Empty clipped circle. | |
| Generic globe icon | Small globe silhouette when ISO unknown. | |

**User's choice:** Fallback to initials chip (Recommended)
**Notes:** Never crashes; consistent with symbol-fallback visual language.

### Flag file layout

| Option | Description | Selected |
|--------|-------------|----------|
| One TSX per flag + index map (Recommended) | flags/sa.tsx, ae.tsx, … + flags/index.ts exporting keyed map. | ✓ |
| Single flags.tsx with all 24 | One file exporting 24 components. | |
| Inline <path> data in a JSON manifest | flags.json with { iso: pathData }. | |

**User's choice:** One TSX per flag + index map (Recommended)
**Notes:** Tree-shakeable; git-friendly per-flag diffs.

---

## Animation + reduced-motion

### Anim runtime

| Option | Description | Selected |
|--------|-------------|----------|
| CSS @keyframes for rings + rAF for globe (Recommended) | Rings/halo pure CSS; globe rotation via rAF. No framer for Phase 37. | ✓ |
| framer-motion for everything | Rings + halo on motion.svg; globe still needs rAF for d3 projection. | |
| motion (Vite-optimized fork) for rings, rAF for globe | Smaller bundle than framer-motion; same globe rAF. | |

**User's choice:** CSS @keyframes for rings + rAF for globe (Recommended)
**Notes:** CSS can't drive d3.geoProjection.rotate(); rAF is required for the globe.

### Reduced motion (globe)

| Option | Description | Selected |
|--------|-------------|----------|
| Full stop: static globe, no whirl rings (Recommended) | Cancel rAF, pin globe at λ=0, CSS animations 'none'. | ✓ |
| Slow down: 50% speed, keep motion | Halve rotation, double ring durations. Not WCAG 2.3.3 compliant. | |
| Fade to static poster | Pre-rendered globe PNG when reduced-motion on. | |

**User's choice:** Full stop: static globe, no whirl rings (Recommended)
**Notes:** WCAG 2.3.3 compliant; safest for vestibular sensitivity.

### Static viz (DossierGlyph / Sparkline / Donut)

| Option | Description | Selected |
|--------|-------------|----------|
| No motion by default — nothing to do (Recommended) | Primitives are already static per VIZ-04/05; document, skip motion. | ✓ |
| Add subtle entry animations, guard with reduced-motion | Fade-in on mount; respect preference. | |
| Add animations without a motion gate | Explicitly not recommended. | |

**User's choice:** No motion by default — nothing to do (Recommended)
**Notes:** In scope for VIZ-04/05 is static rendering; entry animations belong to Phase 38+ consumers.

### Reduced-motion detection

| Option | Description | Selected |
|--------|-------------|----------|
| CSS @media + useReducedMotion() hook (Recommended) | Dual-layer: @media for CSS anims + hook for rAF loop. | ✓ |
| Hook only (framer-motion's useReducedMotion) | Gate everything in JS. | |
| CSS media query only | Can't stop the globe rAF loop. | |

**User's choice:** CSS @media + useReducedMotion() hook (Recommended)
**Notes:** Defense-in-depth — the media query catches CSS-driven pieces even if JS fails.

---

## Claude's Discretion

- **Sparkline + Donut data contracts** — user opted to skip; handoff-derived defaults captured in CONTEXT.md `<decisions>` → Claude's Discretion section.
- **Tokenization touchpoints** — user opted to skip; handoff uses `var(--ink)` verbatim, port literally.
- **Exact CSS timing-functions** — handoff uses `linear` for rings; Claude may refine per screenshot comparison.
- **Backdrop-filter fallback** — plan-time decision for older browsers.
- **modulepreload hint** — plan-time perf decision.

## Deferred Ideas

See `37-CONTEXT.md` `<deferred>` section — no scope-creep ideas surfaced during discussion. Deferred items are all refinements for later phases (data contract overloads, CI visual diffing, entry animations on consumer pages).
