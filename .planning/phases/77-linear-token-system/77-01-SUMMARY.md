---
phase: 77-linear-token-system
plan: 01
subsystem: testing
tags: [playwright, visual-regression, baseline, supabase-staging, rtl, design-tokens]
requires:
  - phase: 46-visual-baseline-regeneration
    provides: the 12-spec visual baseline matrix + seeded b0000002-* staging fixture + capture protocol
  - phase: 76-rtl-infrastructure-bridge-shadcn-logical-properties
    provides: stable RTL/direction infra so token changes are the only moving variable
provides:
  - VERIFY-01 pre-swap (Bureau/default-light) Playwright visual baseline committed BEFORE any directions.ts change
  - theme+locale pin on all 12 visual specs (Pitfall-6 forward-compat for the Phase-77 light→dark default flip)
  - dashboard-widgets snapshot pathTemplate repaired (was orphaned to a gitignored path by a testDir change)
  - human-signed capture log (77-BASELINE-VALIDATION.md) with pin-state audit, PNG inventory, replay proof, coverage statement
affects: [phase-77, phase-80, visual-regression, directions.ts, token-swap]
tech-stack:
  added: []
  patterns:
    - 'Explicit id.theme pin via page.addInitScript before first paint (locks the baseline theme across a default flip)'
    - 'Frozen clock must track the today-anchored staging seed for date-windowed widgets'
key-files:
  created:
    - .planning/phases/77-linear-token-system/77-BASELINE-VALIDATION.md
  modified:
    - frontend/tests/e2e/activity-page-visual.spec.ts
    - frontend/tests/e2e/after-actions-page-visual.spec.ts
    - frontend/tests/e2e/briefs-page-visual.spec.ts
    - frontend/tests/e2e/calendar-visual.spec.ts
    - frontend/tests/e2e/dashboard-visual.spec.ts
    - frontend/tests/e2e/dashboard-widgets-visual.spec.ts
    - frontend/tests/e2e/dossier-drawer-visual.spec.ts
    - frontend/tests/e2e/kanban-visual.spec.ts
    - frontend/tests/e2e/list-pages-visual.spec.ts
    - frontend/tests/e2e/settings-page-visual.spec.ts
    - frontend/tests/e2e/tasks-page-visual.spec.ts
    - frontend/tests/e2e/tasks-tab-visual.spec.ts
    - frontend/playwright.config.ts
    - 'frontend/tests/e2e/*-snapshots/ + __snapshots__/dashboard-widgets/ (43 regenerated PNGs)'
key-decisions:
  - 'Pin id.theme=light on all 12 specs (id.dir NOT pinned — post-swap coercion makes it meaningless)'
  - 'Exclude calendar-visual + dashboard-visual as non-baselined stubs (0 committed PNGs; dashboard-visual dark shots would falsify the mandated no-expansion/light-dominant coverage statement)'
  - 'Rule-3: align dashboard-widgets FROZEN_TIME (2026-05-08 → 2026-07-02) with the today-anchored seed so WeekAhead renders non-empty'
  - 'Rule-3: fix dashboard-widgets pathTemplate ({testDir} → {testDir}/{testFileDir}) to un-orphan its committed, git-tracked snapshot dir'
patterns-established:
  - 'Pin-state audit: every visual spec pins {theme, locale} explicitly so a default-theme flip cannot silently invalidate a baseline'
  - 'Baseline order-gate: capture + human-review + commit BEFORE any token-literal change (no laundering)'
requirements-completed: [VERIFY-01]
duration: ~55 min
completed: 2026-07-02
---

# Phase 77 Plan 01: VERIFY-01 Pre-Swap Visual Baseline Summary

**Committed the pre-swap (Bureau/default-light) Playwright visual baseline — 43 human-reviewed PNGs across 10 specs, all 12 specs theme+locale-pinned — in git BEFORE any `directions.ts` literal changes, so Phase 80 can diff Linear against a trustworthy pre-Linear oracle.**

## Performance

- **Duration:** ~55 min
- **Completed:** 2026-07-02
- **Tasks:** 3 (2 auto + 1 blocking human-verify checkpoint)
- **Files modified:** 12 specs + `playwright.config.ts` + 43 PNGs + capture log (~57 across 2 commits)

## Accomplishments

- Pinned `id.theme` (+ deterministic locale) on all 12 `tests/e2e/*-visual.spec.ts` so the Phase-77 light→dark default flip can't silently change what Phase 80 re-compares (Pitfall 6). Grep gate 12/12; `type-check` green.
- Refreshed the 3 deterministic `b0000002-*` `engagement_dossiers` staging rows (dates only, idempotent) so WeekAhead + VipVisits render non-empty; verified via `get_upcoming_events(NULL, 14)` returning 3 events incl. Dr. Sari Widodo (`person_iso='ID'`).
- Captured 43 `-chromium-darwin` baseline PNGs across the 10 baselined specs on this Mac (`--update-snapshots`), then proved reproducibility with a replay (no `--update-snapshots`): 43/43 pass (CI-parity `--retries=2`; 1 documented shell-chrome flake absorbed).
- Wrote and committed the human-signed `77-BASELINE-VALIDATION.md` (pin-state audit, seed SQL, PNG inventory, replay proof, explicit no-expansion coverage statement).

## Task Commits

1. **Task 1: Pin theme+locale in all 12 visual specs** - `dfef0dd3` (test)
2. **Task 2: Seed refresh + local capture + replay proof + capture log** - artifacts committed in Task 3 (no standalone commit; per plan the capture is committed only after human review)
3. **Task 3: Commit the human-approved baseline (specs + 43 PNGs + config fix + log)** - `14191cb8` (test)

**Plan metadata (this SUMMARY):** committed next (docs).

## Files Created/Modified

- `frontend/tests/e2e/*-visual.spec.ts` (12) - Added explicit `id.theme` pin via `page.addInitScript`; fixed calendar's dead `i18nextLng` locale key; realigned dashboard-widgets `FROZEN_TIME`.
- `frontend/playwright.config.ts` - `chromium-dashboard-widgets` pathTemplate `{testDir}` → `{testDir}/{testFileDir}` (un-orphan the committed snapshot dir).
- `frontend/tests/e2e/*-snapshots/` + `__snapshots__/dashboard-widgets/` - 43 regenerated Bureau/light baseline PNGs (42 changed + 1 byte-identical).
- `.planning/phases/77-linear-token-system/77-BASELINE-VALIDATION.md` - Capture log / human-review artifact.

## Decisions Made

- **Pin `id.theme`, not `id.dir`** — the default flips light→dark this phase, so theme must be pinned; `id.dir` coercion post-swap makes pinning it meaningless (per plan).
- **Exclude `calendar-visual` + `dashboard-visual`** as non-baselined stubs (0 committed PNGs each), same disposition as `theme-visual.spec.ts`. `dashboard-visual` would newly baseline **dark** shots, which would falsify the mandated coverage statement ("light-dominant; dark only via qa-sweep; no expansion"). Both were still theme+locale-pinned for forward-compat.
- **Baseline = existing 12-spec matrix as-is; committed-PNG total unchanged at 51** (43 regenerated baselined + 8 untouched qa-sweep). No coverage expansion.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] dashboard-widgets frozen clock realigned to the today-anchored seed**

- **Found during:** Task 2 (capture) — WeekAhead rendered empty; `.week-row` never appeared.
- **Issue:** `get_upcoming_events` filters server-side by real `NOW()` (today) while WeekAhead buckets client-side by the browser's frozen clock and drops events outside today→next-week (`useUpcomingEvents.ts:32-46`). `FROZEN_TIME` was hardcoded to `2026-05-08`, ~8 weeks behind the refreshed seed → empty widget → false-empty baseline (the exact failure 46-01 guards against).
- **Fix:** `FROZEN_TIME` `2026-05-08T12:00:00Z` → `2026-07-02T12:00:00Z` (align frozen clock with the today-anchored seed). Same fix-class as 46-01's Rule-3 seed refresh.
- **Files modified:** `frontend/tests/e2e/dashboard-widgets-visual.spec.ts`
- **Verification:** dashboard-widgets 8/8 pass with a non-empty `week-ahead.png`; full replay green.
- **Committed in:** `14191cb8` (baseline commit) — human-ratified at the checkpoint.

**2. [Rule 3 - Blocking] dashboard-widgets snapshot pathTemplate un-orphaned**

- **Found during:** Task 2 (capture) — `--update-snapshots` wrote to a gitignored path, leaving committed baselines untouched.
- **Issue:** `testDir` was widened from `frontend/tests/e2e` to `frontend/tests` (a11y discovery), which silently moved the custom template's output from `frontend/tests/e2e/__snapshots__/` (committed, force-added) to `frontend/tests/__snapshots__/` (gitignored) — decoupling the spec from its baseline.
- **Fix:** pathTemplate `{testDir}/__snapshots__/…` → `{testDir}/{testFileDir}/__snapshots__/…`, pinning output back to the committed, git-tracked dir. Blast radius: only the `chromium-dashboard-widgets` project.
- **Files modified:** `frontend/playwright.config.ts`
- **Verification:** `--update-snapshots` now writes to `frontend/tests/e2e/__snapshots__/dashboard-widgets/` (7 `M` + 1 identical); replay reads and passes.
- **Committed in:** `14191cb8` (baseline commit) — human-ratified at the checkpoint.

---

**Total deviations:** 2 auto-fixed (both Rule 3 - blocking), plus 1 documented scope interpretation (stub exclusion, §5 of the capture log).
**Impact on plan:** Both auto-fixes were necessary to produce a valid, non-empty, git-tracked dashboard baseline (the alternative was an empty/orphaned dashboard baseline). No other spec affected; the token-swap surface (`directions.ts`) was not touched.

## Issues Encountered

- Two fullPage specs (`briefs` AR, `tasks-tab`) flaked on the first high-concurrency replay pass (app-shell notification-pulse + avatar flicker — the documented flake class). Confirmed transient: a lower-concurrency re-run passed 6/6, and the CI-parity `--retries=2` replay was green. Baseline PNGs unchanged between passes → reproducible, not laundered.

## User Setup Required

None - no external service configuration required. (Staging seed refresh was applied via the Supabase MCP during Task 2.)

## Next Phase Readiness

- **VERIFY-01 gate satisfied:** the pre-swap baseline (pinned specs + 43 recaptured PNGs + human-reviewed log) is committed at `14191cb8`, and `git log` confirms it precedes any `directions.ts` change. Plans 77-03+ (the token literal swap) are unblocked.
- **TOKEN-01 note:** the plan frontmatter co-lists `TOKEN-01`, but this plan only gates it — `directions.ts` was verified untouched, so `TOKEN-01` remains OPEN for the swap plans (77-03+). Only `VERIFY-01` is completed here.
- **Follow-up (fragility):** `dashboard-widgets` `FROZEN_TIME` now tracks the capture date; a future recapture must re-align it with a re-refreshed seed (inherent 46-era design fragility, not introduced here).

---

_Phase: 77-linear-token-system_
_Completed: 2026-07-02_
