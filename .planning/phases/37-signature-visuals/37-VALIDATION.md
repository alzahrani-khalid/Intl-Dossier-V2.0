---
phase: 37
slug: signature-visuals
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-24
updated: 2026-04-24
---

# Phase 37 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x (unit/integration) + Playwright 1.4x (E2E) + axe-core (a11y) + size-limit (bundle budget) |
| **Config file** | `frontend/vitest.config.ts`, `frontend/playwright.config.ts`, `frontend/.size-limit.json` (Wave 0 created) |
| **Quick run command** | `pnpm --filter frontend test -- --run signature-visuals` |
| **Full suite command** | `pnpm --filter frontend test && pnpm --filter frontend test:e2e signature-visuals && pnpm --filter frontend size` |
| **Observed runtime** | unit+integration: 1.79s (89 tests); AppShell: 2.08s (12 tests); size-limit: ~10s |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter frontend test -- --run signature-visuals`
- **After every plan wave:** Run `pnpm --filter frontend test && pnpm --filter frontend test:e2e signature-visuals`
- **Before `/gsd-verify-work`:** Full suite (incl. size-limit + axe) must be green
- **Max feedback latency:** 15 seconds (unit quick-run — observed 1.79s)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 37-00-01 | 00 | 0 | Infra | — | deps added w/ pinned versions | unit | `pnpm --filter frontend ls d3-geo topojson-client world-atlas` | ✅ | ✅ green |
| 37-00-02 | 00 | 0 | Infra | — | size-limit budget entries present (runtime check deferred to Phase 38 when primitives wire into routes) | ci | `pnpm --filter frontend size` | ✅ | ⚠️ deferred — see Deviations |
| 37-01-01 | 01 | 1 | VIZ-04 | T-37-01 (unsafe-HTML injection) | useReducedMotion returns matchMedia value, SSR-safe | unit | `vitest run useReducedMotion.test.tsx` | ✅ | ✅ green (5/5) |
| 37-02-01 | 02 | 1 | VIZ-01 | — | GlobeLoader rAF cancels on unmount | integration | `vitest run GlobeLoader.test.tsx` | ✅ | ✅ green (3/3) |
| 37-02-02 | 02 | 1 | VIZ-01 | — | Globe rotation rate within tolerance | integration | `vitest run GlobeLoader.rotation.test.tsx` | ✅ | ✅ green (1/1) |
| 37-02-03 | 02 | 1 | VIZ-01 | — | Rings have keyframe durations 3.2s/5.5s/8s | integration | `vitest run GlobeLoader.rings.test.tsx` | ✅ | ✅ green (3/3) |
| 37-02-04 | 02 | 1 | VIZ-01 | — | Graceful degradation: topojson load failure emits single console.warn, no throw | integration | `vitest run GlobeLoader.degrade.test.tsx` | ✅ | ✅ green (1/1) |
| 37-02-05 | 02 | 1 | VIZ-01 / a11y | — | Reduced-motion pins rotation, CSS animations set to none | integration | `vitest run GlobeLoader.reducedMotion.test.tsx` | ✅ | ✅ green (1/1) |
| 37-03-01 | 03 | 2 | VIZ-02 | T-37-02 (public global) | FullscreenLoader opens/closes on trigger signal | integration | `vitest run FullscreenLoader.test.tsx` | ✅ | ✅ green (5/5) |
| 37-03-02 | 03 | 2 | VIZ-02 | T-37-02 | `window.__showGlobeLoader` defined only in DEV (undefined in prod build) | integration | `vitest run FullscreenLoader.devGate.test.tsx` | ✅ | ✅ green (2/2) |
| 37-03-03 | 03 | 2 | VIZ-02 | — | Backdrop uses `color-mix(in srgb, var(--bg) 82%, transparent)` with `backdrop-filter: blur(3px)` | integration | `vitest run FullscreenLoader.backdrop.test.tsx` | ✅ | ✅ green (2/2) |
| 37-04-01 | 04 | 2 | VIZ-03 | — | GlobeSpinner inherits `currentColor` (stroke attribute resolves to parent color) | integration | `vitest run GlobeSpinner.test.tsx` | ✅ | ✅ green (5/5) |
| 37-04-02 | 04 | 2 | VIZ-03 | — | Spinner SVG is 40×40 with 1.4s + 2.8s stylized arcs | integration | `vitest run GlobeSpinner.anatomy.test.tsx` | ✅ | ✅ green (5/5) |
| 37-05-01 | 05 | 2 | VIZ-04 | — | DossierGlyph resolves 24 ISO codes (parameterized test) | unit | `vitest run DossierGlyph.flags.test.tsx` | ✅ | ✅ green (25/25) |
| 37-05-02 | 05 | 2 | VIZ-04 | — | Non-country types render symbol glyphs | unit | `vitest run DossierGlyph.symbols.test.tsx` | ✅ | ✅ green (5/5) |
| 37-05-03 | 05 | 2 | VIZ-04 | — | Unknown ISO falls back to initials (1–2 chars, no crash) | unit | `vitest run DossierGlyph.initials.test.tsx` | ✅ | ✅ green (5/5) |
| 37-05-04 | 05 | 2 | VIZ-04 | — | Hairline stroke present on circle clip | unit | `vitest run DossierGlyph.hairline.test.tsx` | ✅ | ✅ green (1/1) |
| 37-05-05 | 05 | 2 | VIZ-04 | T-37-01 | Flag paths sanitized — no unsafe-HTML sinks, xlink:href, or script tags | unit | `vitest run DossierGlyph.sanitized.test.tsx` | ✅ | ✅ green (2/2) — added beyond plan |
| 37-06-01 | 06 | 2 | VIZ-05 | — | Sparkline min-max normalizes and renders trailing dot at latest point | unit | `vitest run Sparkline.test.tsx` | ✅ | ✅ green (8/8) |
| 37-06-02 | 06 | 2 | VIZ-05 / RTL | — | Sparkline visually flips via `scaleX(-1)` when `useLocale() === 'ar'` | integration | `vitest run Sparkline.rtl.test.tsx` | ✅ | ✅ green (4/4) |
| 37-07-01 | 07 | 2 | VIZ-05 | — | Donut strokeDasharray segments clamp + stack correctly | unit | `vitest run Donut.test.tsx` | ✅ | ✅ green (6/6) |
| 37-07-02 | 07 | 2 | VIZ-05 | — | Center percentage pill renders value with `--font-display` cascade | unit | `vitest run Donut.pill.test.tsx` | ✅ | ✅ green (5/5) |
| 37-08-01 | 08 | 3 | VIZ-01..05 | — | AppShell startup splash renders then hydrates (E2E) | e2e | `playwright test tests/e2e/signature-visuals/appshell.spec.ts` | ✅ | ⚠️ discovered — not executed (Phase 38 CI will run against route-wired build) |
| 37-08-02 | 08 | 3 | VIZ-01..05 / a11y | — | No axe violations on GlobeLoader, FullscreenLoader, DossierGlyph, Donut | e2e | `playwright test tests/e2e/signature-visuals/a11y.spec.ts` | ✅ | ⚠️ discovered — not executed (requires route-wired preview server) |
| 37-08-03 | 08 | 3 | VIZ-02 | T-37-02 | Prod build lacks `window.__showGlobeLoader` global | e2e | `playwright test tests/e2e/signature-visuals/prod-gate.spec.ts` | ✅ | ⚠️ discovered — not executed (requires `pnpm build && pnpm preview`) — defense-in-depth covered by unit test 37-03-02 |
| 37-08-04 | 08 | 3 | VIZ-05 / RTL | — | RTL page flips Sparkline visually | e2e | `playwright test tests/e2e/signature-visuals/sparkline-rtl.spec.ts` | ✅ | ⚠️ discovered — not executed (requires dev harness route built in Phase 38) — unit test 37-06-02 covers the SVG transform |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · ⚠️ deferred*

**Totals:** 21 automated rows ✅ green (89 tests across 19 files, 1.79s), 5 rows ⚠️ deferred (size-limit runtime + 4 E2E specs — all discovered by `playwright test --list`, execution deferred to Phase 38 when primitives are wired into routes).

---

## Wave 0 Requirements

- [x] `frontend/package.json` — `d3-geo@3.1.1`, `topojson-client@3.1.0`, `world-atlas@2.0.2` exact-pinned; `@types/d3-geo@3.1.0`, `@types/topojson-client@3.1.5` dev-deps (commit `7410f469`)
- [x] `frontend/src/design-system/hooks/useReducedMotion.ts` — 36-LOC `useSyncExternalStore` hook (commit `972a6641`)
- [x] `frontend/src/design-system/hooks/useReducedMotion.test.tsx` — 5 unit tests (commit `e99f2eba`)
- [x] `frontend/src/components/signature-visuals/` — folder + barrel (commit `922f7fc2`)
- [x] `frontend/src/components/signature-visuals/flags/` — folder + 24 flag TSX + ISO-map barrel (commits `b9449165`, `8e36d922`)
- [x] `frontend/src/components/signature-visuals/__tests__/` — 19 vitest files shipped (all plans 01–07)
- [x] `tests/e2e/signature-visuals/` — 4 Playwright specs (commits `f3077de7`, `efbc1638`, `dbf3a94e`, `3e171b6a`). **Path deviation:** plan said `frontend/e2e/signature-visuals/` but actual `testDir` is project-root `./tests/e2e/`; specs placed at correct Playwright-discoverable path.
- [x] `frontend/.size-limit.json` — 6 entries (4 preexisting + 2 signature-visuals budgets); `running: false` to skip `@size-limit/time` (commits `792f79d2`, `1f4d7af7`)
- [x] `frontend/vitest.config.ts` — existing config picks up `src/components/**/__tests__/**` glob without change
- [x] `frontend/playwright.config.ts` — existing `testDir: './tests/e2e'` picks up new specs
- [x] NO vendored JSON under `frontend/public/world-atlas/` — `ensureWorld.ts` uses dynamic `import('world-atlas/countries-110m.json')` (D-06)

---

## Manual-Only Verifications (deferred per CONTEXT.md §deferred)

| Behavior | Requirement | Status | Note |
|----------|-------------|--------|------|
| Pixel-parity vs handoff screenshots | VIZ-01, VIZ-05 | ⚠️ deferred | Visual regression infra out of scope (Phase 37 CONTEXT.md). `globe-loader.png`, `tajawal-donut.png`, `tajawal-donut2.png` anchors documented. Manual review at Phase 38 kickoff. |
| Vestibular reduced-motion comfort | VIZ-01, WCAG 2.3.3 | ⚠️ deferred | Subjective — automated `reducedMotion` test (37-02-05) confirms rAF cancellation + `animation: none`. Manual "feels still" review deferred to Phase 38 integration. |
| Backdrop-filter fallback rendering | VIZ-02 | ✅ covered | `globe-loader.css` ships `@supports not (backdrop-filter: blur(3px))` fallback (Plan 37-03 deviation logged). Unit test 37-03-03 asserts the primary `backdrop-filter` path; fallback verified by inspection. |

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s (observed: 1.79s for 89 tests)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** **granted** — 21/26 rows green, 5 deferred with documented reason (size-limit runtime + E2E require Phase 38 route wiring; defense-in-depth covered by unit tests).

---

## Deviations (binding record)

1. **Size-limit signature-visuals budgets** (row 37-00-02): `dist/assets/*d3-geo*.js` and `dist/assets/*signature-visuals*.js` chunks don't materialize yet because no route imports `<GlobeLoader>` or other primitives at build-time. AppShell's `Suspense fallback={<FullscreenLoader open />}` statically imports `FullscreenLoader` into the `_protected-*.js` route chunk — the lazy `ensureWorld()` path creates the d3 chunk only at runtime. Phase 38 widgets will be the first consumers. Budgets are ceilings, not floors, so "chunk not found" is non-blocking. Pre-existing budgets (`Initial JS`, `React vendor`, `Total JS`) already exceed their limits — this is a pre-existing health issue that predates Phase 37 and should be addressed in a separate cleanup phase.

2. **E2E spec path** (Wave 0 Req row 7): plan frontmatter declared `frontend/e2e/signature-visuals/*.spec.ts`; actual Playwright `testDir` is `./tests/e2e`, so specs were placed at `tests/e2e/signature-visuals/` (where Playwright discovers them). All 4 specs listed via `playwright test --list`; execution deferred until Phase 38 provides route-wired harness for the sparkline-rtl + appshell splash checks.

3. **jest-dom opt-out** (Wave 0 Req row 9): `frontend/tests/setup.ts` deliberately does NOT register `@testing-library/jest-dom` (pre-existing architectural decision). Phase 37 tests either use native DOM queries with `.textContent`/`toBeNull()` assertions or register jest-dom locally via `import '@testing-library/jest-dom/vitest'` per-file.

4. **Additional test row 37-05-05**: Plan 37-05 shipped 5 DossierGlyph test files instead of the 4 planned (added `DossierGlyph.sanitized.test.tsx` for T-37-01 unsafe-HTML-sink defense). Net positive — stricter security coverage.
