---
phase: 37
slug: signature-visuals
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-24
---

# Phase 37 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.x (unit/integration) + Playwright 1.4x (E2E) + axe-core (a11y) + size-limit (bundle budget) |
| **Config file** | `frontend/vitest.config.ts`, `frontend/playwright.config.ts`, `.size-limit.json` (Wave 0 creates) |
| **Quick run command** | `pnpm --filter frontend test -- --run signature-visuals` |
| **Full suite command** | `pnpm --filter frontend test && pnpm --filter frontend e2e -- signature-visuals && pnpm --filter frontend size` |
| **Estimated runtime** | ~60 seconds (unit ~5s, integration ~10s, E2E ~40s, size-limit ~5s) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter frontend test -- --run signature-visuals`
- **After every plan wave:** Run `pnpm --filter frontend test && pnpm --filter frontend e2e -- signature-visuals`
- **Before `/gsd-verify-work`:** Full suite (incl. size-limit + axe) must be green
- **Max feedback latency:** 15 seconds (unit quick-run)

---

## Per-Task Verification Map

> Populated by gsd-planner from RESEARCH.md §Validation Architecture (19 test mappings). Each `-TT` row below is a placeholder that the planner replaces with concrete Task IDs.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 37-00-01 | 00 | 0 | Infra | — | deps added w/ pinned versions | unit | `pnpm --filter frontend ls d3-geo topojson-client world-atlas` | ❌ W0 | ⬜ pending |
| 37-00-02 | 00 | 0 | Infra | — | size-limit budget < 100KB gzip | ci | `pnpm --filter frontend size` | ❌ W0 | ⬜ pending |
| 37-01-01 | 01 | 1 | VIZ-04 | T-37-01 (DOM injection) | useReducedMotion returns matchMedia value, SSR-safe | unit | `vitest run useReducedMotion.test.tsx` | ❌ W0 | ⬜ pending |
| 37-02-01 | 02 | 1 | VIZ-01 | — | GlobeLoader rAF cancels on unmount | integration | `vitest run GlobeLoader.test.tsx` | ❌ W0 | ⬜ pending |
| 37-02-02 | 02 | 1 | VIZ-01 | — | Globe rotation rate 16°/sec within ±0.5° tolerance | integration | `vitest run GlobeLoader.rotation.test.tsx` | ❌ W0 | ⬜ pending |
| 37-02-03 | 02 | 1 | VIZ-01 | — | Rings have keyframe durations 3.2s/5.5s/8s | integration | `vitest run GlobeLoader.rings.test.tsx` | ❌ W0 | ⬜ pending |
| 37-02-04 | 02 | 1 | VIZ-01 | — | Graceful degradation: topojson load failure emits single console.warn, no throw | integration | `vitest run GlobeLoader.degrade.test.tsx` | ❌ W0 | ⬜ pending |
| 37-02-05 | 02 | 1 | VIZ-01 / a11y | — | Reduced-motion pins λ=0, CSS animations set to none | integration | `vitest run GlobeLoader.reducedMotion.test.tsx` | ❌ W0 | ⬜ pending |
| 37-03-01 | 03 | 2 | VIZ-02 | T-37-02 (public global) | FullscreenLoader opens/closes on trigger signal | integration | `vitest run FullscreenLoader.test.tsx` | ❌ W0 | ⬜ pending |
| 37-03-02 | 03 | 2 | VIZ-02 | T-37-02 | `window.__showGlobeLoader` defined only in DEV (undefined in prod build) | integration | `vitest run FullscreenLoader.devGate.test.tsx` | ❌ W0 | ⬜ pending |
| 37-03-03 | 03 | 2 | VIZ-02 | — | Backdrop uses `color-mix(in srgb, var(--bg) 82%, transparent)` with `backdrop-filter: blur(3px)` | integration | `vitest run FullscreenLoader.backdrop.test.tsx` | ❌ W0 | ⬜ pending |
| 37-04-01 | 04 | 2 | VIZ-03 | — | GlobeSpinner inherits `currentColor` (stroke attribute resolves to parent color) | integration | `vitest run GlobeSpinner.test.tsx` | ❌ W0 | ⬜ pending |
| 37-04-02 | 04 | 2 | VIZ-03 | — | Spinner SVG is 40×40 with 1.4s + 2.8s stylized arcs | integration | `vitest run GlobeSpinner.anatomy.test.tsx` | ❌ W0 | ⬜ pending |
| 37-05-01 | 05 | 2 | VIZ-04 | — | DossierGlyph resolves 24 ISO codes (parameterized test) | unit | `vitest run DossierGlyph.flags.test.tsx` | ❌ W0 | ⬜ pending |
| 37-05-02 | 05 | 2 | VIZ-04 | — | Non-country types render symbol glyphs (forum ◇, person ●, topic ◆, organization ▲) | unit | `vitest run DossierGlyph.symbols.test.tsx` | ❌ W0 | ⬜ pending |
| 37-05-03 | 05 | 2 | VIZ-04 | — | Unknown ISO falls back to initials (1–2 chars, no crash) | unit | `vitest run DossierGlyph.initials.test.tsx` | ❌ W0 | ⬜ pending |
| 37-05-04 | 05 | 2 | VIZ-04 | — | Hairline stroke `rgba(0,0,0,0.15)` present on circle clip | unit | `vitest run DossierGlyph.hairline.test.tsx` | ❌ W0 | ⬜ pending |
| 37-06-01 | 06 | 2 | VIZ-05 | — | Sparkline min-max normalizes and renders trailing dot at latest point | unit | `vitest run Sparkline.test.tsx` | ❌ W0 | ⬜ pending |
| 37-06-02 | 06 | 2 | VIZ-05 / RTL | — | Sparkline visually flips via `scaleX(-1)` when `dir=rtl` | integration | `vitest run Sparkline.rtl.test.tsx` | ❌ W0 | ⬜ pending |
| 37-07-01 | 07 | 2 | VIZ-05 | — | Donut strokeDasharray segments sum ≤100 and render stacked | unit | `vitest run Donut.test.tsx` | ❌ W0 | ⬜ pending |
| 37-07-02 | 07 | 2 | VIZ-05 | — | Center percentage pill renders value with `--font-display` cascade | unit | `vitest run Donut.pill.test.tsx` | ❌ W0 | ⬜ pending |
| 37-08-01 | 08 | 3 | VIZ-01..05 | — | AppShell startup splash renders ~1.6s then hydrates (E2E) | e2e | `playwright test signature-visuals/appshell.spec.ts` | ❌ W0 | ⬜ pending |
| 37-08-02 | 08 | 3 | VIZ-01..05 / a11y | — | No axe violations on GlobeLoader, FullscreenLoader, DossierGlyph, Donut | e2e | `playwright test signature-visuals/a11y.spec.ts` | ❌ W0 | ⬜ pending |
| 37-08-03 | 08 | 3 | VIZ-02 | T-37-02 | Prod build lacks `window.__showGlobeLoader` global | e2e | `playwright test signature-visuals/prod-gate.spec.ts` | ❌ W0 | ⬜ pending |
| 37-08-04 | 08 | 3 | VIZ-05 / RTL | — | RTL page flips Sparkline visually (screenshot comparison) | e2e | `playwright test signature-visuals/sparkline-rtl.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `frontend/package.json` — add `d3-geo`, `topojson-client`, `world-atlas`, `@types/d3-geo`, `@types/topojson-client` (exact semver from `npm view` at plan time)
- [ ] `frontend/src/design-system/hooks/useReducedMotion.ts` — new 12-line `matchMedia` + `useSyncExternalStore` hook
- [ ] `frontend/src/design-system/hooks/useReducedMotion.test.tsx` — unit stubs for REQ-VIZ-04 reduced-motion gate
- [ ] `frontend/src/components/signature-visuals/` — folder scaffold + `index.ts` barrel
- [ ] `frontend/src/components/signature-visuals/flags/` — folder scaffold + `flags/index.ts` ISO-map
- [ ] `frontend/src/components/signature-visuals/__tests__/` — 12 unit/integration test stubs (one per row above W0-marked)
- [ ] `frontend/e2e/signature-visuals/` — 4 E2E spec stubs (appshell, a11y, prod-gate, sparkline-rtl)
- [ ] `frontend/.size-limit.json` — budget entry for lazy d3 chunk (≤ 100KB gzip)
- [ ] `frontend/vitest.config.ts` — verify `environment: 'jsdom'` + `@testing-library/jest-dom` setup (already configured, confirm)
- [ ] `frontend/playwright.config.ts` — verify RTL locale fixture + axe-core integration (confirm existing config supports)
- [ ] `frontend/public/world-atlas/` — NO vendored JSON (D-06 uses `world-atlas` npm package; confirm vite.config.ts resolves `world-atlas/countries-110m.json` correctly via lazy dynamic import)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Pixel-parity vs handoff screenshots | VIZ-01, VIZ-05 | Visual regression infra out of scope (deferred per CONTEXT `deferred` section); `globe-loader.png`, `tajawal-donut.png`, `tajawal-donut2.png` are pixel-parity anchors | During code review: render `<GlobeLoader>` and `<Donut>` Storybook/dev-route and compare side-by-side with handoff PNGs at 1x zoom; accept ±2px tolerance on ring positions |
| Vestibular reduced-motion comfort | VIZ-01, WCAG 2.3.3 | Subjective — automated test confirms animations stop but human judgment confirms "feels still, not jittery" | Toggle `prefers-reduced-motion: reduce` in devtools, reload, confirm globe is static + no flicker + rings still visible as static rings |
| Backdrop-filter fallback rendering | VIZ-02 | Legacy browser detection requires real browser, not jsdom | Open app in older Firefox (or simulate via `@supports not (backdrop-filter: blur(3px))`); confirm 95%-opacity backdrop is rendered without blur |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
