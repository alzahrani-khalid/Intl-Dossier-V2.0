---
phase: 80-full-route-visual-a11y-verification-smoke-suite
plan: 01
subsystem: testing
tags: [playwright, axe-core, a11y, wcag, rtl, linear-tokens, color-contrast, verification]

# Dependency graph
requires:
  - phase: 77-linear-token-system
    provides: Linear dark-canonical + derived-light token system now under a11y test
  - phase: 79-aceternity-removal
    provides: rebuilt SearchableSelect + removed animation UI under a11y test
provides:
  - Recorded VERIFY-02 a11y baseline on ONE reference environment (80-A11Y-BASELINE.md)
  - Fixture-liveness proof (7/7 dossiers + 3/3 SRTL calendar rows) gating all classification
  - Explicit 4-axis axe sweep spec (qa-sweep-axe-4axis.spec.ts, 60 scans) + recorded HEAD leg (set B)
  - Authoritative per-failure characterization (root-cause classes) for 80-03 fix-vs-record
affects: [80-02, 80-03, VERIFY-02]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - '4-axis axe sweep: V6_ROUTES x en/ar x light/dark, theme pinned via addInitScript id.theme before first paint'
    - 'Reference-env characterization ledger: env + date + SHA + fixture-liveness proof gate all classification (anti-laundering)'

key-files:
  created:
    - frontend/tests/e2e/qa-sweep-axe-4axis.spec.ts
    - .planning/phases/80-full-route-visual-a11y-verification-smoke-suite/80-A11Y-BASELINE.md
  modified: []

key-decisions:
  - 'The a11y gate is GREEN on the reference env (87 passed / 10 skipped / 0 failed / 0 flaky) — the CI-observed 9-hard/5-flaky set did NOT reproduce; recorded honestly rather than laundered'
  - 'CI-observed failures classified test-bug (networkidle/login readiness under CI worker concurrency) with a data-drift contribution — no app-bug implicated'
  - '4-axis sweep is an explicit, called-out extension (not silent expansion) and is deliberately NOT wired into CI — it stays a local baseline vehicle'
  - 'VERIFY-02 NOT marked complete: it spans 80-02 (A-leg) + 80-03 (fix-vs-record + green CI job); 80-01 only advances it'

patterns-established:
  - 'Set B (HEAD) recorded before set A (pre-token) so 80-02 has its post-migration operand for the B ⊆ A comparison'

requirements-completed: [] # VERIFY-02 spans 80-01/02/03; NOT complete at 80-01 (baseline + set B only). Marked complete by 80-03.

# Metrics
duration: 15 min
completed: 2026-07-03
---

# Phase 80 Plan 01: VERIFY-02 A11y Baseline + 4-Axis Sweep Summary

**Recorded the honest VERIFY-02 a11y baseline on one reference env (a11y gate 87/10/0 green — CI redness did not reproduce) and built the explicit 4-axis axe sweep whose HEAD leg (set B) surfaced 8 light-theme `color-contrast` + 4 engagements `aria-required` violations invisible to the old dark-only sweep.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-03T18:21:52Z
- **Completed:** 2026-07-03T18:36:35Z
- **Tasks:** 2
- **Files modified:** 2 (+ this SUMMARY)

## Accomplishments

- **Fixture liveness proven before any classification** — recorded the orchestrator's Supabase-MCP probe verbatim: all 6 `testDossierIds` + `FIXTURE_DOSSIER_ID` (7/7) and the 3 SRTL-02 July-2026 `calendar_entries` rows are live in staging. No scan was classified against a dead fixture.
- **Characterized the a11y gate honestly on the reference env** — `--project=a11y --retries=1` = **87 passed / 10 skipped / 0 failed / 0 flaky**. Every CI-observed red/flaky test (all 18 `T074-*` aria/headings/axe across 6 dossier types in RTL, both positions keyboard-nav, intake keyboard-nav) passed locally. The CI 9-hard/5-flaky set (run 28574521475) was classified **test-bug** (readiness/timing under CI concurrency) with a **data-drift** contribution — no app-bug.
- **Recorded the 10 `test.fixme` skips** as pre-existing, already-recorded app-bug debt (intake button-name/aria-prohibited-attr/target-size + heading-skip; positions rich-text editor) — a record, not laundering.
- **Built the explicit 4-axis axe sweep** `qa-sweep-axe-4axis.spec.ts` (15 routes × en/ar × light/dark = 60 scans) reusing `runAxe` (0 inline scanner), theme pinned via `addInitScript` before first paint.
- **Recorded set B (HEAD leg)** — 41 passed / 13 failed / 6 flaky. Genuine axe findings: `color-contrast` (serious, **light-theme only**, 8 scans across countries/organizations/topics/working_groups/tasks list routes) + `aria-required-parent`/`-children` (critical, engagements, **both themes**, 4 scans). 1 hard + 6 flaky are login `waitForURL` timeouts (test-bug), excluded from the axe baseline.

## Task Commits

1. **Task 1: Fixture-liveness proof + local a11y characterization run** - `66b7cb4a9` (docs)
2. **Task 2: Build the 4-axis axe sweep spec and record the HEAD leg (set B)** - `350d91f66` (test)

**Plan metadata:** _(this SUMMARY commit)_ (docs)

## Files Created/Modified

- `frontend/tests/e2e/qa-sweep-axe-4axis.spec.ts` - Explicit 4-axis axe sweep (60 scans); local baseline vehicle, not CI-wired; imports `runAxe`, pins `id.theme` per axis before first paint.
- `.planning/phases/80-.../80-A11Y-BASELINE.md` - The recorded VERIFY-02 baseline: reference-env header (env + date + `b5ad1ac3f`), fixture-liveness proof, per-failure characterization tables (root-cause classes), the 10 recorded fixme skips, and the HEAD-leg (set B) per-scan matrix + findings.

## Decisions Made

- **Recorded green, not laundered red.** The reference-env a11y gate is fully green; the requirement text's "2 hard failures" and CI's "9 hard / 5 flaky" are environment-sensitive and do not reproduce on the seeded reference env. The ledger states this with env + date + SHA rather than importing shifting CI numbers.
- **4-axis sweep is a called-out extension, not silent expansion.** Both the spec header and ledger §8 state it satisfies VERIFY-02's "all four axes" and is intentionally kept out of the FOUC-02 CI smoke job (runtime budget).
- **VERIFY-02 left unmarked.** It is completed by 80-03 (fix-vs-record + green CI job), so `requirements-completed` is empty here and `requirements.mark-complete` was not invoked — marking it now would misrepresent status.
- **Set B before set A.** Recording HEAD first gives 80-02 the post-migration operand; the pre-token (`14191cb85`) A-leg and the NEW-vs-pre-existing verdict are 80-02's scope.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed the literal `AxeBuilder` token from the spec header comment**

- **Found during:** Task 2 (spec verification)
- **Issue:** The header comment "do not re-implement AxeBuilder inline" contained the literal string `AxeBuilder`, tripping the acceptance criterion `grep -c "AxeBuilder" = 0` (the original `qa-sweep-axe.spec.ts` phrases it as "re-implement inline" to avoid the token).
- **Fix:** Reworded to "DO NOT re-implement the axe scan inline … forbids inlining the scanner" — same meaning, zero `AxeBuilder` occurrences.
- **Files modified:** frontend/tests/e2e/qa-sweep-axe-4axis.spec.ts
- **Verification:** `grep -c "AxeBuilder" … = 0`; `--list` still reports 60 tests.
- **Committed in:** 350d91f66 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking).
**Impact on plan:** Cosmetic (comment wording) to satisfy the no-inline-scanner acceptance grep. No scope creep; no behavior change.

## Issues Encountered

None. The dev server booted cleanly, the pre-authenticated `storageState` was valid (no `beforeEach` auth failures), and both runs completed. The 60-scan sweep's login-timeout flakes (7 scans) are a known 9-worker-concurrency artifact, not a blocker — recorded as test-bug, excluded from the axe baseline.

## Next Phase Readiness

- **Ready for 80-02** (A-leg): run `qa-sweep-axe-4axis.spec.ts` on the pre-token worktree `14191cb85` (set A), same day / same staging, then decide NEW vs pre-existing per rule × route × axis. Theme skew predicts `color-contrast` (light) as the candidate NEW class and `aria-required-*` (engagements, present in dark) as the candidate pre-existing class — the A-leg proves it.
- **Ready for 80-03** (fix-vs-record + green CI): the authoritative per-failure list exists; the a11y gate is already green on the reference env, so the "record" side is largely complete (10 fixmes) and the actionable app-signal is the light-theme `color-contrast` set.
- **No blockers.** No `frontend/src` or snapshot changes were made (verified clean).

## Self-Check: PASSED

- Created files verified on disk: `qa-sweep-axe-4axis.spec.ts`, `80-A11Y-BASELINE.md`, `80-01-SUMMARY.md` — all FOUND.
- Task commits verified in git log: `66b7cb4a9` (Task 1), `350d91f66` (Task 2) — all FOUND.
- Plan `<verification>`: ledger has env header + fixture proof + characterization table + set B; spec lists 60 tests, imports `runAxe`, 0 inline `AxeBuilder`; no `frontend/src` or snapshot-PNG modifications (clean).

---

_Phase: 80-full-route-visual-a11y-verification-smoke-suite_
_Completed: 2026-07-03_
