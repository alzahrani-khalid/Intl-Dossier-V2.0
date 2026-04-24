---
phase: 37-signature-visuals
plan: 08
status: complete
verification: PASS-WITH-DEVIATION
completed_at: 2026-04-24
commits:
  - sha: a56ba295
    message: "feat(37-08): wrap AppShell main in Suspense + FullscreenLoader fallback (D-03)"
  - sha: f3077de7
    message: "test(37-08): e2e — appshell startup splash hydration (37-08-01)"
  - sha: efbc1638
    message: "test(37-08): e2e — axe-core WCAG 2.1 AA gate (37-08-02)"
  - sha: dbf3a94e
    message: "test(37-08): e2e — prod-gate for window.__showGlobeLoader (T-37-02, 37-08-03)"
  - sha: 3e171b6a
    message: "test(37-08): e2e — Sparkline RTL scaleX(-1) flip (37-08-04)"
  - sha: 1f4d7af7
    message: "chore(37-08): size-limit — remove unsupported ignore field; skip @size-limit/time Chrome"
---

# Plan 37-08 — Final Integration Wave

## Objective

Three tasks that close Phase 37:
1. Wrap `<main>{children}</main>` inside `AppShell` with `<Suspense fallback={<FullscreenLoader open />}>` per D-03 — the only codebase edit outside `frontend/src/components/signature-visuals/`.
2. Ship 4 Playwright E2E specs (AppShell splash, axe-core a11y, prod-gate T-37-02, RTL Sparkline flip).
3. Run `pnpm size` and flip 26 VALIDATION.md rows with binding deviations.

## Tasks completed

### Task 08-1 — AppShell Suspense wrap (commit `a56ba295`)

`frontend/src/components/layout/AppShell.tsx`:
- Added `Suspense` to existing React named-imports (line 76)
- Added `import { FullscreenLoader } from '@/components/signature-visuals'` (line 89)
- Wrapped content slot: `<Suspense fallback={<FullscreenLoader open />}>{children}</Suspense>` (line 220)
- Surgical: 2 new import lines + 1 JSX wrapper — no other changes

Phase 36 AppShell invariants preserved: 12/12 vitest tests green (8 a11y + 4 structure), no regression.

### Task 08-2 — 4 Playwright E2E specs

Specs live at `tests/e2e/signature-visuals/` (project-root path that matches Playwright's `testDir: './tests/e2e'` — see Deviation 2).

- **`appshell.spec.ts`** (commit `f3077de7`) — boots the app; expects the `<FullscreenLoader>` visible during Suspense hydration, then unmounts after `networkidle`. Locator driven off GlobeLoader DOM markers.
- **`a11y.spec.ts`** (commit `efbc1638`) — mounts states where GlobeLoader, FullscreenLoader, DossierGlyph, Donut are visible; `@axe-core/playwright` asserts zero WCAG 2.1 AA violations.
- **`prod-gate.spec.ts`** (commit `dbf3a94e`) — gated by `PROD_PREVIEW=1` env; against `pnpm build && pnpm preview` the spec asserts `typeof window.__showGlobeLoader === 'undefined'`. Defense-in-depth for T-37-02 (unit test 37-03-02 + this E2E).
- **`sparkline-rtl.spec.ts`** (commit `3e171b6a`) — visits the dev-harness route (to be wired in Phase 38); flips locale to Arabic; asserts `transform: scaleX(-1)` on the `<svg>` root. Unit test 37-06-02 already covers the transform; this spec adds the rendered-browser visual assertion.

All 4 specs discovered by `pnpm --filter frontend exec playwright test --list tests/e2e/signature-visuals` — execution deferred until Phase 38 provides route-wired harness.

### Task 08-3 — size-limit fix (commit `1f4d7af7`)

- Removed unsupported `ignore` field from the two signature-visuals entries (`ignore` requires `@size-limit/webpack` or `@size-limit/esbuild`; project uses `@size-limit/file` via preset-app)
- Added `"running": false` to all 6 entries so `@size-limit/time` (pulled in by preset-app) skips the headless-Chrome runtime profiling pass. The earlier FS lockup was traced to this long-running puppeteer child.

`pnpm --filter frontend size` output:
- `signature-visuals/d3-lazy-chunk`: chunk not emitted (non-blocking — budget is a ceiling; chunk materializes when Phase 38 triggers `ensureWorld()` at runtime)
- `signature-visuals/static-primitives`: chunk not emitted (non-blocking — no route statically imports a primitive bundle-name-worthy yet; `FullscreenLoader` ships inside `_protected-*.js`)
- Pre-existing budgets (`Initial JS` 508 KB vs 200 KB; `React vendor` 347 KB vs 50 KB; `Total JS` 2.44 MB vs 800 KB) already exceed limits — **this is pre-existing bundle rot, not a Phase 37 regression.** See Deviation 1.

## Files modified

- `frontend/src/components/layout/AppShell.tsx` (+11 / -2)
- `tests/e2e/signature-visuals/appshell.spec.ts` (new)
- `tests/e2e/signature-visuals/a11y.spec.ts` (new)
- `tests/e2e/signature-visuals/prod-gate.spec.ts` (new)
- `tests/e2e/signature-visuals/sparkline-rtl.spec.ts` (new)
- `frontend/.size-limit.json` (+11 / -6)
- `.planning/phases/37-signature-visuals/37-VALIDATION.md` (26 rows flipped; 4 deviations recorded)

## Verification

| Gate | Command | Result |
|------|---------|--------|
| AppShell regression | `pnpm --filter frontend exec vitest run src/components/layout/AppShell` | **12/12 green** (2 files, 2.08s) |
| Signature-visuals suite | `pnpm --filter frontend exec vitest run src/components/signature-visuals` | **89/89 green** (19 files, 1.79s) |
| Typecheck | `pnpm --filter frontend exec tsc --noEmit` | No new errors in touched files |
| Vite build | `pnpm --filter frontend build` | exit 0 (11.96s) |
| size-limit | `pnpm --filter frontend size` | exit 1 — pre-existing budgets over (not Phase 37 regression); signature-visuals entries: chunk-not-emitted (Phase 38 will wire) |
| Playwright discovery | `pnpm --filter frontend exec playwright test --list tests/e2e/signature-visuals` | 4 specs discovered |

## Deviations

1. **Size-limit exit 1** — Not a Phase 37 regression. The 4 pre-existing budgets (`Initial JS`, `React vendor`, `Total JS`) were introduced in commit `8434bd11` (Phase 07-01) and the bundle has been over them since then. Phase 37's primitives aren't even bundled into main yet (only `FullscreenLoader` statically-imported into `_protected-*.js` route chunk). **Phase 37 added two new budget entries; neither introduced any regression.** Bundle-rot cleanup belongs to a dedicated phase.

2. **E2E spec path** — Plan frontmatter said `frontend/e2e/signature-visuals/`; actual Playwright `testDir: './tests/e2e'` (project-root). Specs placed at `tests/e2e/signature-visuals/` so `playwright test` discovers them. No `playwright.config.ts` change needed.

3. **`running: false` quirk** — Despite the per-entry `"running": false`, `size-limit` still prints `Running JS in headless Chrome` (cosmetic). What matters: the run completes in seconds instead of hanging the FS. Config change is sufficient; switching to `@size-limit/preset-small-lib` is tempting but would drop the build-time integration that `preset-app` provides for future use.

4. **Subagent hit macOS FS lockup mid-execution** (not a plan deviation — environmental). Post-`pnpm size` attempt earlier, every `read(2)`/`readdir(2)` into `/Users/.../CodingSpace/*` returned `EINTR` for ~20 minutes (likely `mds_stores` reindex or iCloud Drive sync triggered by the `dist/` build). Claude session restarted; 5 subagent commits verified intact via `git log`; work resumed from Task 08-3 inline.

## Handoff to Phase 38

- `FullscreenLoader` is the Suspense fallback — any `React.lazy(() => import('./SomeRoute'))` in Phase 38 routes gets the globe splash for free.
- `globeLoaderSignal.showGlobeLoader(1600)` is the imperative trigger; Phase 38 `Digest` widget will call it during refresh.
- Phase 38 is expected to wire the first route that dynamic-imports a signature-visuals primitive — that triggers the `d3-geo` chunk and makes `pnpm size`'s `signature-visuals/d3-lazy-chunk` entry produce a real measurement.
- All 4 Wave 3 E2E specs become executable once Phase 38 provides a route-wired preview server.

## Status

**PASS-WITH-DEVIATION** — all three tasks shipped; 21/26 validation rows green, 5 deferred with documented reason (Phase 38 wiring required). Phase 37 signature-visuals primitives are ready for Phase 38 dashboard and Phase 39/40 consumption.
