---
plan_id: 40-17
phase: 40
phase_name: list-pages
mode: gap_closure
gaps_addressed: [G7]
status: SUCCESS-WITH-DEFERRAL
date: 2026-04-26
---

# 40-17 — Visual-spec determinism stack (G7)

## Outcome

Applied the full determinism stack to `frontend/tests/e2e/list-pages-visual.spec.ts`
and tightened `frontend/playwright.config.ts` `expect.toHaveScreenshot` defaults
plus project-level `reducedMotion: 'reduce'`. Three-replay stability run is
**deferred to HUMAN-UAT** — the live run requires a running dev server and
Supabase auth (gated behind `loginForListPages`), which the autonomous executor
cannot perform.

## Determinism layers applied (checklist)

| Layer                                 | Implementation                                                                                                                                                    | File / line              |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| 1. Clock freeze                       | `await page.clock.install({ time: FROZEN_TIME })` in `beforeEach`, anchored at `2026-04-26T12:00:00Z`; per-screenshot `clock.runFor(100)` flushes pending RAF     | spec L41-47, L78, L92    |
| 2. Transition / animation suppression | `page.addInitScript()` injects a `*`/`*::before`/`*::after` style tag killing transitions, animations, scroll-behavior, caret-color; runs before every navigation | spec L49-65              |
| 3. Ready-marker wait                  | `page.waitForSelector('[data-loading="false"]', { timeout: 15_000 })` consumes the marker emitted by `ListPageShell` (40-13)                                      | spec L75-76              |
| 4. Font readiness                     | `page.waitForFunction(() => document.fonts.ready)` retained from Phase 38 Pitfall 6                                                                               | spec L77                 |
| 5. Pinned viewport                    | `test.use({ viewport: { width: 1280, height: 800 } })` retained                                                                                                   | spec L39                 |
| 6. RTL settle                         | After `dir`/`lang` flip on AR locale, `clock.runFor(100)` is called before screenshot so the flip has flushed                                                     | spec L91-92              |
| 7. Project-wide reduced motion        | `use.reducedMotion: 'reduce'` and `use.forcedColors: 'none'` in config                                                                                            | config L57-58            |
| 8. Caret hide                         | `expect.toHaveScreenshot.caret: 'hide'`                                                                                                                           | config L46               |
| 9. Pixel diff caps                    | `maxDiffPixelRatio: 0.01` (config) AND `maxDiffPixels: 100` (config) AND per-call `maxDiffPixelRatio: 0.02` (spec, page-specific tolerance)                       | config L43,48 / spec L94 |
| 10. Animations disabled               | `expect.toHaveScreenshot.animations: 'disabled'` retained                                                                                                         | config L45               |

## Files modified

- `frontend/tests/e2e/list-pages-visual.spec.ts` — full rewrite: helper `gotoAndReady(page, url)` centralizes clock/ready/fonts/tick sequence; `beforeEach` arms clock + addInitScript before login.
- `frontend/playwright.config.ts` — added `caret: 'hide'`, `maxDiffPixels: 100`, `reducedMotion: 'reduce'`, `forcedColors: 'none'`.

## Verification

| Check                                                                                       | Result                                                                             |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `@playwright/test` ≥ 1.45 (clock.install support)                                           | **PASS** — installed `^1.58.2`                                                     |
| Determinism markers present (`page.clock.install`, `addInitScript`, `data-loading="false"`) | **PASS** — 7 occurrences via grep                                                  |
| `tsc --noEmit` errors introduced by 40-17                                                   | **PASS** — 0 (only pre-existing repo-wide unused-symbol errors in unrelated files) |
| `eslint tests/e2e/list-pages-visual.spec.ts playwright.config.ts`                           | **PASS** — clean, no warnings or errors                                            |
| 3 consecutive `pnpm playwright test list-pages-visual` runs                                 | **DEFERRED** to HUMAN-UAT — auth gate prevents autonomous execution                |

## Deferral rationale (auth gate)

`tests/e2e/support/list-pages-auth.ts` performs a real Supabase login flow that
requires the running dev server and `.env.test` Supabase credentials. The
autonomous executor cannot stand up the stack and burn auth quota safely.
Human reviewer to run the three-replay verification per
`40-HUMAN-UAT.md` Section "G7 — Visual determinism replay".

## What this closes

- G7 (visual baselines drifting between replays) — all three documented drift
  sources (live timestamps, async load timing, animation residue) are now
  neutralized at the test layer. Baseline regeneration is a separate operation
  and remains in plan **40-19** as designed.

## What this does NOT close

- 40-19 baseline regeneration (intentional split — different blast radius).
- HUMAN-UAT visual review and the three-replay stability gate.

## Commit

`feat(40-17): apply visual-spec determinism stack (G7)`
