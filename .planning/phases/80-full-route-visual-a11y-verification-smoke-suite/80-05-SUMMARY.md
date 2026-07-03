---
phase: 80-full-route-visual-a11y-verification-smoke-suite
plan: 05
subsystem: testing
tags: [playwright, visual-regression, linear-design-system, snapshots, rtl, baseline]

# Dependency graph
requires:
  - phase: 80-04
    provides: the APPROVED 43-verdict human diff-triage (39 intended-Linear + 4 within-tolerance, 0 regressions) that unblocks --update-snapshots
  - phase: 77-01
    provides: the recoverable Bureau baseline lineage (14191cb85) + the replay-proof byte-stability discipline
provides:
  - 43 committed Linear visual baselines (new lineage) — the reference for all future visual-regression work
  - closed 80-VISUAL-RECOMPARE.md ledger (§11) with recapture + replay-proof commands, 43/43 result, and lineage statement
  - VERIFY-01 requirement closed
affects: [80-06, future visual-regression work, "Visual Regression (Phase 46)" CI job]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Recapture-only-after-human-approval: --update-snapshots is hard-gated on the prior-plan human triage approval line (anti-laundering, T-80-13)"
    - "Replay-proof byte-stability: re-run WITHOUT --update-snapshots at --retries=2; zero snapshot writes proves determinism (77-01 §4)"
    - "Seed ↔ FROZEN_TIME coupling carried forward (inherent 46-era fragility) — documented in the ledger for the next recapture"

key-files:
  created:
    - .planning/phases/80-full-route-visual-a11y-verification-smoke-suite/80-05-SUMMARY.md
  modified:
    - frontend/tests/e2e/*-snapshots/** (39 Linear baseline PNGs across 9 default-path specs)
    - frontend/tests/e2e/__snapshots__/dashboard-widgets/** (Linear widget baselines)
    - .planning/phases/80-full-route-visual-a11y-verification-smoke-suite/80-VISUAL-RECOMPARE.md
    - .planning/REQUIREMENTS.md
    - .planning/STATE.md
    - .planning/ROADMAP.md

key-decisions:
  - "Recaptured strictly under the §10 human approval — hard-gate T-80-13 verified present before the run"
  - "Left the 4 within-tolerance widgets byte-identical (Playwright --update-snapshots only rewrites diffs); 39 rewritten + 4 unchanged = 43 full coverage, mirroring 77-01's 42+1 pattern"
  - "Did NOT touch playwright.config.ts thresholds (T-80-14) or FROZEN_TIME (seed current same-day); zero frontend/src changes (0 regression verdicts)"

patterns-established:
  - "Anti-laundering recapture order: replay → human review → (fix) → update, with the update gated on the recorded approval"
  - "Byte-stability proof: an update pass followed by a no-update --retries=2 pass with zero new writes"

requirements-completed: [VERIFY-01]

# Metrics
duration: 16min
completed: 2026-07-03
---

# Phase 80 Plan 05: VERIFY-01 Linear Visual Baseline Recapture Summary

**Recaptured the 43 human-ratified Playwright visual baselines as the new Linear lineage via `--update-snapshots`, proved them byte-stable with a 43/43 `--retries=2` replay, and committed PNGs + closed ledger — closing VERIFY-01 with the Bureau lineage preserved at `14191cb85`.**

## Performance

- **Duration:** ~16 min
- **Started:** 2026-07-03T20:34:00Z
- **Completed:** 2026-07-03T20:49:36Z
- **Tasks:** 3 (Task 1 seed-gate recorded, Task 2 no-regression recorded, Task 3 recapture + replay-proof + lineage commit)
- **Files modified:** 40 in the baseline commit (39 PNGs + ledger) + 4 tracking files in the metadata commit

## Accomplishments

- **Recaptured 43 Linear baselines** (the ONLY sanctioned `--update-snapshots`, gated on the 80-04 §10 approval): 39 PNGs rewritten (the 39 intended-Linear diffs) + 4 byte-identical (the within-tolerance dashboard widgets `digest`/`vip-visits`/`my-tasks`/`recent-dossiers`) = 43 full coverage. Recapture run: **43 passed (34.7s)**.
- **Replay-proof (byte-stability):** re-ran the same 10 specs WITHOUT `--update-snapshots` at `--retries=2` (CI parity) → **43 passed (33.8s), exit 0**; post-proof `git status` over both snapshot roots still exactly 39 `M` PNGs — the proof wrote **zero** snapshots, proving no fonts/clock/seed nondeterminism leak.
- **Closed the 80-VISUAL-RECOMPARE.md ledger (§11):** recorded "seed current 2026-07-03", "No regression verdicts — nothing to fix", both run commands, 43/43 result, and the lineage statement (Bureau recoverable at `14191cb85`; seed ↔ FROZEN_TIME coupling noted for the next recapture).
- **Preserved all guardrails:** `playwright.config.ts` thresholds untouched (T-80-14, not in the commit diff); `FROZEN_TIME` left at `2026-07-03T12:00:00Z` (seed current, no re-seed); the bare-name dashboard-widgets `pathTemplate` and `-chromium-darwin` default-path names kept as-is.
- **Closed VERIFY-01** across REQUIREMENTS.md (checkbox + traceability → Complete), ROADMAP.md (80-05 → done, phase 80 → 5/6), and STATE.md.

## Task Commits

1. **Tasks 1–3 (seed-gate record + no-regression record + recapture + replay-proof + closed ledger)** — `799ef3c4` (`test`)
   - Tasks 1 (seed-currency: "seed current 2026-07-03") and 2 (regressions: "No regression verdicts — nothing to fix") were record-only per the orchestrator's satisfied preconditions and the approved zero-regression triage; both are folded into ledger §11 and committed here alongside the recaptured PNGs.
   - `git show --stat 799ef3c4`: **40 files = 39 baseline PNGs + `80-VISUAL-RECOMPARE.md` only.** `playwright.config.ts`, `dashboard-widgets-visual.spec.ts` (FROZEN_TIME), and `qa-sweep` snapshots all absent.

**Plan metadata:** `<metadata-commit>` (`docs(80-05): complete VERIFY-01 visual baseline recapture plan`) — SUMMARY + STATE + ROADMAP + REQUIREMENTS.

## Files Created/Modified

- `frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/*` (14 PNGs) — Linear list-page baselines (EN+AR × 7 entity types)
- `frontend/tests/e2e/kanban-visual.spec.ts-snapshots/*` (4) — Linear kanban baselines (ltr/rtl × 1280/768)
- `frontend/tests/e2e/tasks-tab-visual.spec.ts-snapshots/*` (4) — Linear tasks-tab baselines
- `frontend/tests/e2e/settings-page-visual.spec.ts-snapshots/*` (3) — Linear settings baselines (en/ar/mobile)
- `frontend/tests/e2e/{activity,after-actions,briefs,tasks-page}-page-visual.spec.ts-snapshots/*` (8) — Linear EN+AR baselines
- `frontend/tests/e2e/dossier-drawer-visual.spec.ts-snapshots/*` (2) — Linear drawer baselines (ltr/ar @1280)
- `frontend/tests/e2e/__snapshots__/dashboard-widgets/*` (4 rewritten of 8) — Linear widget baselines (`kpi-strip`, `week-ahead`, `overdue-commitments`, `sla-health`; the other 4 byte-identical)
- `.planning/phases/80-.../80-VISUAL-RECOMPARE.md` — closed ledger (§11 recapture + replay-proof + lineage)
- `.planning/REQUIREMENTS.md` — VERIFY-01 → `[x]` + traceability → Complete
- `.planning/STATE.md` — position → 80-05 complete (5/6); `completed_plans` 30 → 31
- `.planning/ROADMAP.md` — 80-05 → `[x]`; phase 80 → 5/6

## Decisions Made

- **Recapture gated on the recorded human approval, not executor judgment** — the §10 approval line and the "EMPTY — zero regression verdicts" line were both re-verified present before running `--update-snapshots` (T-80-13 anti-laundering).
- **4 within-tolerance widgets intentionally left byte-identical** — Playwright's `--update-snapshots` only rewrites snapshots that differ; the 4 small-surface widgets re-rendered to the same bytes and needed no write. Documented as 39 + 4 = 43 so coverage is provably full (mirrors 77-01 §3's 42 + 1).
- **No threshold, config, or clock changes** — `playwright.config.ts` stays out of the diff (T-80-14); `FROZEN_TIME` stays `2026-07-03` (seed current same-day, no re-seed). Any nondeterminism would have been diagnosed, never absorbed by loosening thresholds.

## Deviations from Plan

None - plan executed exactly as written. Tasks 1 and 2 were pre-satisfied by the orchestrator's preconditions and the approved zero-regression triage (recorded in the ledger, no work required); Task 3 ran exactly as specified. No frontend/src changes were made (0 regression verdicts).

## Issues Encountered

None. Two expected observations, both non-issues:

- The recapture wrote 39 of 43 PNGs (4 within-tolerance widgets byte-identical) — expected behavior of `--update-snapshots`, matching the 80-04 triage (39 diffs + 4 within-tolerance) and the 77-01 precedent.
- The inline `${PIPESTATUS[0]}` exit-echo printed empty because the host shell is zsh (array is `$pipestatus`, 1-indexed); Playwright's own "43 passed" summary line is the authoritative pass/exit signal, corroborated by the git-clean anti-laundering check.

## User Setup Required

None - no external service configuration required. (Task 1 seed currency was satisfied by the orchestrator; executors have no Supabase MCP.)

## Next Phase Readiness

- **VERIFY-01 is closed.** The 43 Linear baselines are committed (`799ef3c4`), reproducible at `--retries=2`, and the Bureau lineage is recoverable at `14191cb85`.
- **Only 80-06 remains** in Phase 80 (FOUC-02 — RTL component smokes + calendar clock-freeze + `test-rtl-smokes` CI job + branch-protection checkpoint). Phase 80 closes when 80-06 lands.
- **Carried-forward fragility:** the dashboard-widgets baselines are date-coupled — a future recapture must re-refresh the `b0000002-*` seed AND realign `FROZEN_TIME` before running (documented in ledger §11.5).

## Self-Check: PASSED

- `80-05-SUMMARY.md` — FOUND
- Baseline commit `799ef3c4` — FOUND in history; `git show --stat` = 39 PNGs + ledger only
- 43 baselines recaptured (39 rewritten + 4 byte-identical); replay-proof 43/43 at `--retries=2`, zero writes; `playwright.config.ts` NOT in diff
- VERIFY-01 → `[x]` + traceability Complete; ROADMAP 80-05 `[x]` + phase 80 5/6; STATE `completed_plans` 31 + position 80-05 complete

---

_Phase: 80-full-route-visual-a11y-verification-smoke-suite_
_Completed: 2026-07-03_
