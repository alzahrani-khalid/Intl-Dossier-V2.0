# Phase 37: signature-visuals - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship four reusable signature visual primitives that Phases 38–40 will consume:

1. **`<GlobeLoader>` / `<FullscreenLoader>` / `<GlobeSpinner>`** — animated orthographic globe (d3-geo + topojson) with whirl rings and halo, in both full-screen splash and inline `currentColor` spinner form.
2. **`<DossierGlyph>`** — circular flag glyph resolving 24 hand-drawn country SVGs + symbol fallback glyphs for non-country dossier types.
3. **`<Sparkline>`** — 80×22 polyline, min-max normalized, trailing dot, RTL-flipped via `scaleX(-1)`.
4. **`<Donut>`** — stacked `strokeDasharray` segments with center percentage pill.

All primitives must be tokenized (driven by Phase 33 CSS vars), RTL-aware, and reusable. Phase 37 does NOT include the Dashboard (Phase 38), Kanban/Calendar (Phase 39), or List pages (Phase 40) that will consume them.

</domain>

<decisions>
## Implementation Decisions

### Handoff fidelity & file organization
- **D-01:** Port `/tmp/inteldossier-handoff/inteldossier/project/src/loader.jsx` and `glyph.jsx` as a **verbatim TS rewrite** — 1:1 preservation of every d3 call, timing constant, SVG path, and viewBox. The handoff screenshots (`globe-loader.png`, `tajawal-donut.png`, `tajawal-donut2.png`) are the visual source of truth.
- **D-02:** All four primitives live under **`frontend/src/components/signature-visuals/`** in a single folder with a barrel `index.ts`. Files: `GlobeLoader.tsx`, `FullscreenLoader.tsx`, `GlobeSpinner.tsx`, `DossierGlyph.tsx`, `Sparkline.tsx`, `Donut.tsx`, `flags/` subfolder, `index.ts`.
- **D-03:** The 1.6s startup `<GlobeLoader>` splash mounts at **AppShell root via a Suspense boundary** (`<FullscreenLoader open={!hydrated}>`). Ties lifecycle to React hydration; respects route transitions for Phase 38+.
- **D-04:** VIZ-02 trigger API exposes **both** imperative + declarative:
  - `window.__showGlobeLoader(ms)` — dev-only (gated behind `import.meta.env.DEV`), mirrors handoff devtools ergonomics
  - `<FullscreenLoader open ms>` — React-idiomatic for component consumers
  - Internal bridge: the window global sets the same state the component reads, so both paths converge

### d3-geo + topojson loading
- **D-05:** **Lazy dynamic import on first `<GlobeLoader>` mount** — `await import('d3-geo')`, `await import('topojson-client')`, `await import('world-atlas/countries-110m.json')`. Matches handoff, saves ~180KB from the initial bundle.
- **D-06:** Topojson sourced from the **`world-atlas`** npm package (`countries-110m.json`). Versioned dep, tree-shakeable, no vendored JSON in repo.
- **D-07:** **Progressive render while loading** — whirl rings + pulsing halo paint immediately from CSS; the countries mesh (sphere + graticule + land) fills in when the d3/topojson chunk resolves. Globe is always visually "alive".
- **D-08:** **Graceful degradation on load failure** — if the d3/topojson chunk fails (offline, CDN outage), keep rings + halo animating, drop the land mesh silently, emit a single `console.warn('GlobeLoader: topojson failed to load')`. No user-visible error.

### 24 flag SVGs + symbol fallbacks (VIZ-04)
- **D-09:** The 24 flag SVG `<path>` definitions are **copied verbatim from `/tmp/inteldossier-handoff/...glyph.jsx`** into `frontend/src/components/signature-visuals/flags/`. ISO set: SA, AE, ID, EG, QA, JO, BH, OM, KW, PK, MA, TR, CN, IT, FR, DE, GB, US, JP, KR, IN, BR, EU, UN.
- **D-10:** Non-country dossier types render **Unicode symbols in soft-tinted circles** (VIZ-04 spec verbatim): forum ◇, person ●, topic ◆, organization ▲. Soft tint via `color-mix(in srgb, <accent> 12%, var(--surface-raised))`.
- **D-11:** **Unknown ISO codes** fall back to a soft-tinted circle with 1–2 uppercase **initials** from the country name. Never crashes, visually consistent with the symbol-fallback language.
- **D-12:** Flag file layout: **one TSX per flag** (`flags/sa.tsx`, `flags/ae.tsx`, …) + **`flags/index.ts`** exporting a map `{ sa, ae, … }` keyed by lowercase ISO. Tree-shakeable, git-friendly per-flag diffs.

### Animation runtime & reduced-motion
- **D-13:** **CSS `@keyframes` for whirl rings and pulsing halo + `requestAnimationFrame` for globe rotation.** Rings use pure CSS (GPU-accelerated). Globe rotation (16°/sec on −18° tilt) uses rAF to update `d3.geoProjection.rotate([λ, 0, 0])` each frame — CSS can't drive d3 projection. `framer-motion` is NOT a Phase 37 dependency despite being installed.
- **D-14:** **Reduced-motion = full stop.** When `prefers-reduced-motion: reduce` is set: cancel the rAF loop, pin globe at λ=0, set CSS animations to `none` on rings and halo. Safest for vestibular sensitivity, WCAG 2.3.3 compliant.
- **D-15:** `DossierGlyph`, `Sparkline`, `Donut` have **no intrinsic animation** per VIZ-04/05 spec. They remain static under both normal and reduced-motion preference. Any future entry animations are Phase 38+ consumer concerns.
- **D-16:** **Dual-layer reduced-motion detection:**
  - `@media (prefers-reduced-motion: reduce)` block overrides ring/halo CSS animations to `none`
  - `useReducedMotion()` hook returns a boolean that the globe rAF loop reads to skip rotation
  - Defense-in-depth: the media query catches CSS-driven pieces even if JS fails to run

### Claude's Discretion

These areas weren't discussed explicitly — Claude uses handoff-derived defaults:

- **Sparkline prop contract** — default to `<Sparkline data={number[]} />` (minimal dumb primitive). Matches handoff `dashboard.jsx` usage. Phase 38 can extend with `{points, accessor}` overload if needed.
- **Donut prop contract** — default to `<Donut value={number} variants={[ok, risk, bad]} />` where `variants` is a 3-tuple of percentage slices summing to ≤100. Matches VIZ-05 wording.
- **Tokenization touchpoints** — primitives read `--ink` (strokes), `--bg` (backdrop), `--surface-raised` (glyph circle fill base), `--line` (flag hairline ≈ `rgba(0,0,0,0.15)` fallback). Port handoff's `var(--ink)` usage verbatim.
- **Backdrop blur fallback** — if `backdrop-filter: blur(3px)` isn't supported (older Firefox), fall back to `color-mix(in srgb, var(--bg) 95%, transparent)` without blur.
- **Prefetch hint** — whether to add `<link rel="modulepreload" href="world-atlas/...">` in `index.html` is a plan-time perf decision.
- **Exact CSS animation timing-functions** — handoff uses `linear` for rings; Claude may refine per screenshot comparison.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase-defining specs
- `.planning/ROADMAP.md` §"Phase 37: signature-visuals" (lines 194–212) — Goal, 5 Success Criteria, dependency on Phase 33 (tokens), UI hint: yes.
- `.planning/REQUIREMENTS.md` §VIZ-01 through VIZ-05 (lines 51–55) — Locked requirements including exact sizes, timings, ISO list, backdrop formula, and RTL flip rule.

### Handoff source of truth (port verbatim)
- `/tmp/inteldossier-handoff/inteldossier/project/src/loader.jsx` — `<GlobeLoader>`, `<FullscreenLoader>`, `<GlobeSpinner>` reference implementation. Includes d3-geo projection math, whirl-ring CSS, lazy-import pattern, `window.__showGlobeLoader` hook.
- `/tmp/inteldossier-handoff/inteldossier/project/src/glyph.jsx` — `<DossierGlyph>` reference: 24 flag `<path>` definitions, symbol-fallback glyphs, circle clip + hairline.
- `/tmp/inteldossier-handoff/inteldossier/project/src/dashboard.jsx` — consumer example for `<Sparkline>` and `<Donut>` prop usage (data shape reference).
- `/tmp/inteldossier-handoff/inteldossier/project/src/themes.jsx` — `buildTokens()` reference for the CSS vars the primitives consume (already ported in Phase 33).

### Handoff visual targets (pixel-parity anchors)
- `/tmp/inteldossier-handoff/inteldossier/project/screenshots/globe-loader.png` — splash visual target.
- `/tmp/inteldossier-handoff/inteldossier/project/screenshots/tajawal-donut.png` — donut rendering target.
- `/tmp/inteldossier-handoff/inteldossier/project/screenshots/tajawal-donut2.png` — donut variant states.

### Prior-phase context (carry-forward decisions)
- `.planning/phases/33-token-engine/33-CONTEXT.md` — `DesignProvider` above `LanguageProvider`; `applyTokens()` writes CSS vars on `documentElement`; `@theme` self-reference pattern (A1 SAFE for fonts, UNSAFE for shadows). Phase 37 reads `--ink`, `--bg`, `--surface-raised`, `--line` from these tokens.
- `.planning/phases/34-tweaks-drawer/34-CONTEXT.md` — `id.locale` canonical store (VIZ-05 RTL flip reads this); `bootstrap.js` pre-paints `html.dir` + `data-direction`.
- `.planning/phases/35-typography-stack/35-CONTEXT.md` — `--font-display/body/mono` cascade; Tajawal RTL handling (Donut center pill + Sparkline labels inherit these).
- `.planning/phases/36-shell-chrome/36-CONTEXT.md` — `AppShell.tsx` composition is the mount site for the startup `<FullscreenLoader>` (D-03).

### Project-level constraints
- `CLAUDE.md` §"Mobile-First & Responsive Design" — touch targets ≥44×44, base→sm→md→lg→xl→2xl breakpoints (affects `<GlobeSpinner>` inline usage in buttons).
- `CLAUDE.md` §"Arabic RTL Support Guidelines" — logical properties only (`ms-*`, `me-*`, `start-*`, `end-*`); Sparkline flip via `scaleX(-1)` is the sanctioned RTL treatment per VIZ-05.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`frontend/src/design-system/tokens/applyTokens.ts`** — writes CSS vars on `documentElement`. Phase 37 primitives consume these via plain `var(--ink)` / `var(--bg)` / `var(--surface-raised)` references — no JS coupling needed.
- **`frontend/src/design-system/DesignProvider.tsx`** — provides `useDirection()` / `useMode()` / `useLocale()` / `useClassification()` hooks. Sparkline's RTL flip can read `useDirection()` if needed; globe is direction-agnostic.
- **`framer-motion@12.38.0`** + **`motion@12.38.0`** — already installed but NOT a Phase 37 dependency per D-13. Reserved for later phases.
- **`lucide-react`** — already imported across codebase; available as a last-resort fallback but not used per D-10.
- **`pull-to-refresh-indicator.tsx`** (line 165, 175) — existing `stroke="currentColor"` SVG spinner pattern mirrors the `<GlobeSpinner>` approach (VIZ-03).
- **`background-boxes.tsx`** (line 55) — existing `currentColor` inline SVG idiom; reuse this pattern.

### Established Patterns
- **CSS-var-driven theming** (Phase 33) — `applyTokens()` already exposes `--ink`, `--bg`, `--surface-raised`, `--line`. Primitives consume via `var()`, no prop-drilling.
- **Pre-paint boot** (Phase 34) — `bootstrap.js` writes `html.dir` + `data-direction` before React boots. The AppShell Suspense splash (D-03) does NOT compete with pre-paint — it renders above already-applied vars.
- **Barrel exports** (`components/ui/index.ts` pattern) — established for re-exports and tree-shakeable consumer imports.
- **RTL logical properties** (`CLAUDE.md`) — `ms-*`/`me-*`/`ps-*`/`pe-*`; `scaleX(-1)` for visual mirror per VIZ-05.

### Integration Points
- **AppShell.tsx** (Phase 36) — `<FullscreenLoader>` mounts here as Suspense fallback (D-03).
- **Digest refresh button** in `SiteHeader.tsx` (Phase 34) — `<GlobeSpinner>` is the inline loading indicator during refresh (VIZ-03).
- **Phase 38 (Dashboard)** — `KpiStrip`, `SlaHealth` (Donut + legend + 14-day Sparkline), `Digest` widget (GlobeSpinner overlay), `RecentDossiers` + `ForumsStrip` (DossierGlyph).
- **Phase 39 (WorkBoard/Calendar)** — `kcard` anatomy uses DossierGlyph + Sparkline.
- **Phase 40 (List pages)** — DossierGlyph + GlobeSpinner for load-more rows.

### New runtime dependencies required
- `d3-geo` (lazy-loaded)
- `topojson-client` (lazy-loaded)
- `world-atlas` (lazy-loaded)

These should be added to `frontend/package.json` at plan time. All three are small, MIT-licensed, and used only by `<GlobeLoader>`.

</code_context>

<specifics>
## Specific Ideas

- "Handoff screenshots are the visual source of truth" — `globe-loader.png` and `tajawal-donut*.png` anchor pixel-parity checks.
- "Verbatim port preferred over refactor" — risk tolerance is to absorb imperative d3 inside a `useEffect` rather than drift from the screenshot reference.
- "Both trigger APIs" — the preference for exposing `window.__showGlobeLoader(ms)` alongside the React `<FullscreenLoader>` prop reflects the handoff's dev-ergonomics value, with a `DEV` gate to avoid a public prod global.
- "Progressive render beats hide-until-ready" — the globe should always appear alive, even while d3 + topojson is still streaming in.

</specifics>

<deferred>
## Deferred Ideas

- **Sparkline + Donut data contract refinements** — discuss when Phase 38 (Dashboard) starts consuming these. Minimal array-in is the Phase 37 default; hook-integrated or discriminated-union overload can be layered on.
- **Tokenization touchpoint audit** — when Phase 40 list pages render at scale, revisit whether `--glyph-fallback-tint` deserves its own token vs `color-mix()` math inline.
- **Backdrop-filter fallback for legacy browsers** — plan-time decision when verification matrix is set.
- **Reference-image diffing in CI** — `globe-loader.png` / `tajawal-donut.png` visual regression test infra is out of scope; defer to a future testing phase.
- **Entry animations on DossierGlyph/Sparkline/Donut** — out of scope per D-15; Phase 38+ may add with reduced-motion gating.
- **modulepreload hint in index.html** — small perf refinement for the splash path; plan-time decision, not a Phase 37 gray area.
- **Prefetch flag assets** — flag SVGs are tiny (~200 bytes each); no prefetch strategy needed now.

</deferred>

---

*Phase: 37-signature-visuals*
*Context gathered: 2026-04-24*
