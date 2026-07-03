---
phase: 80-full-route-visual-a11y-verification-smoke-suite
plan: 02
subsystem: testing
tags:
  [a11y, axe-core, playwright, color-contrast, aria, rtl, linear-tokens, git-worktree, verify-02]

# Dependency graph
requires:
  - phase: 80-01
    provides: 'set B (HEAD 4-axis axe sweep, 60 scans) + the a11y-gate characterization; the recorded qa-sweep-axe-4axis.spec.ts overlay'
provides:
  - 'RECORDED pre-migration baseline (set A) from a real run at pre-token commit 14191cb85 — a11y project (5 specs) + the 60-scan 4-axis sweep'
  - 'Finalized A/B verdict: B ⊆ A is FALSE — 4 NEW-on-HEAD color-contrast scans isolated as migration-caused'
  - 'Plan 80-03 must-fix list (MF-1/2/3): organizations en+ar, topics en, tasks en — all Linear light color-contrast, NEVER recordable'
  - 'Recorded pre-existing baseline: countries+working_groups light contrast; engagements aria-required-* x4 (both themes)'
affects: [80-03, VERIFY-02, a11y-ci-job, plan-80-03-fix-vs-record]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Pre-token A/B via detached git worktree at an immutable commit, test-harness byte-identical so frontend/src is the only variable'
    - 'Serialized --workers=1 re-run to resolve login-concurrency-flaked cells with real axe readings (no inference)'
    - 'T-80-05 :5173 kill-guard before each leg so reuseExistingServer boots the worktree tree, not main'

key-files:
  created:
    - .planning/phases/80-full-route-visual-a11y-verification-smoke-suite/80-02-SUMMARY.md
  modified:
    - .planning/phases/80-full-route-visual-a11y-verification-smoke-suite/80-A11Y-BASELINE.md

key-decisions:
  - 'B ⊆ A is FALSE — recorded, not laundered: 4 NEW-on-HEAD Linear-light color-contrast scans are FIX-mandatory for 80-03 and may never be recorded-as-baseline'
  - 'Theme pin IS real at 14191cb85 (bootstrap.js honors id.theme) → set A light=Bureau light, dark=Bureau dark; palette family (Bureau→Linear) is the migration variable'
  - 'Resolve indeterminate (login-timed-out) set-A cells by serialized --workers=1 re-run, not by inference — anti-laundering'
  - 'Do NOT mark VERIFY-02 complete: this plan records the baseline; 80-03 fixes MF-1/2/3 and greens the CI job'

patterns-established:
  - 'Recorded-baseline A/B: same-day, same staging DB, byte-identical harness; per-scan {pre-existing, fixed-on-HEAD, NEW-on-HEAD} classification'
  - 'best-practice axe-tag divergence recorded per-spec as-is (never unified across runAxe vs dossiers-rtl-a11y)'

requirements-completed: [] # VERIFY-02 intentionally NOT completed here — 80-02 records the baseline; 80-03 fixes the must-fix items and greens the a11y CI job.

# Metrics
duration: 18min
completed: 2026-07-03
---

# Phase 80 Plan 02: VERIFY-02 Recorded Pre-token A11y Baseline (set A) + B⊆A Verdict Summary

**Recorded set A from a real pre-token run at worktree 14191cb85 and finalized the A/B verdict — B ⊆ A is FALSE: 4 NEW-on-HEAD Linear-light color-contrast scans (organizations en/ar, topics en, tasks en) isolated as migration-caused and routed to the 80-03 must-fix list; countries/working_groups light contrast + engagements aria-required-\* x4 confirmed pre-existing.**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-07-03T18:47:19Z
- **Completed:** 2026-07-03T19:05:18Z
- **Tasks:** 2
- **Files modified:** 1 (the baseline ledger)

## Accomplishments

- Built a detached git worktree at the immutable pre-token commit `14191cb85`, installed with `--frozen-lockfile` (0 new packages), copied gitignored env files, and overlaid the test-only `qa-sweep-axe-4axis.spec.ts`.
- Proved the harness is byte-identical across `14191cb85`..HEAD (`playwright.config.ts`, `v6-routes.ts`, `qa-sweep.ts`, `list-pages-auth.ts`, `global-setup.ts`, all 5 a11y specs; Playwright 1.60.0 + axe 4.11.3) → the ONLY variable is `frontend/src` (Bureau→Linear).
- Ran both suites at `14191cb85` (a11y project: 85 passed / 2 flaky→pass / 10 skipped / 0 hard-fail; 4-axis sweep: 60 scans), then a serialized `--workers=1` re-run to resolve every login-timed-out cell with a real axe reading.
- Finalized the per-scan A/B classification and the explicit **B ⊆ A: FALSE** verdict with a 4-item must-fix list for Plan 80-03.

## Task Commits

Both tasks modify the single deliverable (`80-A11Y-BASELINE.md`), committed together as one atomic docs commit:

1. **Task 1: Record the pre-token leg (set A) at 14191cb85** — `c2f370a2e` (docs) — §9 (run provenance, harness parity, both legs, same-day fairness)
2. **Task 2: A/B comparison — finalize baseline + must-fix list** — `c2f370a2e` (docs) — §10 (verdict, per-scan classification, MF-1/2/3, disposition reminders)

**Plan metadata:** (final docs commit — SUMMARY + STATE + ROADMAP)

## Files Created/Modified

- `.planning/phases/80-.../80-A11Y-BASELINE.md` — added §9 (recorded set A) + §10 (A/B verdict + must-fix list); title/status updated to reflect 80-02 finalization
- `.planning/phases/80-.../80-02-SUMMARY.md` — this summary

## Findings — the recorded A/B verdict

**B ⊆ A: FALSE.** Per-scan classification of every set-B genuine axe finding:

- **NEW-on-HEAD (migration-caused, FIX-mandatory, NEVER recordable) — 4 scans / 3 routes:**
  - MF-1 organizations list `<main>` — color-contrast (serious), Linear light, en + ar (Bureau light passed both)
  - MF-2 topics list `<main>` — color-contrast (serious), Linear light, en (Bureau passed all 4 cells)
  - MF-3 tasks list `<main>` — color-contrast (serious), Linear light, en (Bureau light passed, serialized-clean)
- **pre-existing (recorded baseline, passes B ⊆ A):**
  - color-contrast: countries [en/ar] light, working_groups [en/ar] light (Bureau light trips the same)
  - aria-required-parent/children: engagements list, all 4 [en/ar] [light/dark] (Bureau trips all 4 too — structural, theme/locale-independent)
- **fixed-on-HEAD (improvements, note only):** the Bureau→Linear **dark** migration removed multiple Bureau-dark color-contrast violations (countries/organizations/working_groups/tasks dark + non-list dashboard/calendar/activity/settings dark).

Net migration effect: dark contrast improved broadly; **the Linear light palette regressed 3 list routes** — a likely single shared list-page `<main>` chrome token under-contrasting in the light derivation (fix once, re-verify all three).

## Decisions Made

- **Recorded, not laundered.** The 4 NEW-on-HEAD scans are structurally barred from being recorded-as-baseline; they are the 80-03 fix mandate. The laundering path is closed by evidence (set A is a real run at the immutable commit).
- **Theme pin is real at 14191cb85.** `bootstrap.js` honors `id.theme`, so set A = Bureau light/dark (only `id.dir` defaults to bureau). The comparison is genuinely 4-axis; the palette family is the migration variable.
- **Resolved indeterminacy by measurement.** Login-concurrency-flaked set-A cells (tasks light, engagements [ar][dark]) got clean readings via a serialized `--workers=1` re-run rather than inference.
- **VERIFY-02 left open.** This plan satisfies VERIFY-02's _recorded-baseline precondition_ only; 80-03 fixes MF-1/2/3 and greens the a11y CI job before VERIFY-02 can be marked complete.

## Deviations from Plan

None - plan executed exactly as written. (No source or test files changed; `git status --porcelain -- frontend/` empty. The set-B HEAD legs were NOT re-run because the ledger's set-B date is already today and the only `frontend/` delta since `b5ad1ac3f` is the test-only overlay — matching the plan's same-day-fairness condition.)

## Issues Encountered

- The default-parallel set-A 4-axis run carried the same login-`waitForURL` concurrency flake documented for set B (§8.3), leaving several cells (tasks light, engagements [ar][dark]) without an axe reading. Resolved by a serialized `--workers=1` re-run of the 6 comparison-relevant routes, yielding flake-free authoritative readings that drive the verdict.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Plan 80-03 is unblocked** and reads one contract: FIX MF-1/MF-2/MF-3 (the 4 NEW-on-HEAD Linear-light color-contrast scans — never record); RECORD the 6 pre-existing scans via the `test.fixme(true, '80: recorded pre-migration baseline — …')` + `TRACKED APP A11Y DEBT` convention, or fix as discretionary genuine debt.
- Disposition reminders carried forward unchanged: `best-practice` tag divergence (do not unify), the 8 quarantined specs, the vitest `waiting-queue-a11y` T091-07 local-only baseline, and the 10 `test.fixme` skips.
- VERIFY-02 remains open until 80-03 lands the fixes/records and the a11y CI job goes green.

## Self-Check: PASSED

- FOUND: `80-02-SUMMARY.md`
- FOUND: `80-A11Y-BASELINE.md` (contains "Pre-token leg (set A)", `14191cb85`, "B ⊆ A: FALSE")
- FOUND: commit `c2f370a2` (baseline deliverable)
- VERIFIED: `git status --porcelain -- frontend/` empty (no source/test changes); no `intl-pre-token` worktree remains

---

_Phase: 80-full-route-visual-a11y-verification-smoke-suite_
_Completed: 2026-07-03_
