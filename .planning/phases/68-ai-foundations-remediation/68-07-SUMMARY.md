---
phase: 68-ai-foundations-remediation
plan: 07
subsystem: testing
tags: [i18n, lint, ci, eslint, guard]

requires:
  - phase: 68-01
    provides: scripts/check-i18n-namespaces.mjs (already string+array capable)
provides:
  - REMED-06 i18n namespace guard wired into the frontend Lint CI context
affects: [68-08]

tech-stack:
  added: []
  patterns:
    - 'Guard folds into existing lint script (&&-chained) — no new CI context, D-12 preserved'

key-files:
  created: []
  modified:
    - frontend/package.json

key-decisions:
  - 'Task 1 (harden script) was a no-op: the plan-01 script already handled string + array forms, all-offenders reporting, and file+line errors'
  - "Kept the guard's own clear error format rather than the plan's suggested literal string — acceptance is behavioral (exit codes + identify file/ns), which is met"

patterns-established:
  - 'i18n namespace registry guard runs as the last && step of frontend lint'

requirements-completed: [REMED-06]

duration: 12min
completed: 2026-06-14
---

# Phase 68 — Plan 07 Summary

**The i18n namespace guard is now part of the frontend `lint` script, so any PR adding a `useTranslation()` call to an unregistered namespace fails the required Lint context — closing the silent-English-fallback root cause without adding a new CI context.**

## Performance

- **Duration:** ~12 min
- **Completed:** 2026-06-14
- **Tasks:** 2 (Task 1 no-op; Task 2 lint wiring)
- **Files modified:** 1

## Task Commits

1. **Task 1 (harden guard)** — no change required; the plan-01 script already meets all behaviors (string + array forms, all-offenders, file+line, exit 0/1).
2. **Task 2 (wire into lint)** — `04a99554` (feat)

## Verification — VERBATIM

- `grep -c 'check-i18n-namespaces' frontend/package.json` → **1** ✅
- `grep -c 'check-i18n-namespaces' .github/workflows/ci.yml` → **0** ✅ (D-12: not added to CI separately)
- Clean: `pnpm --filter intake-frontend run lint` → **exit 0**; guard ran after eslint: `i18n namespace check OK: 1671 file(s) scanned, 785 static namespace literal(s) checked against 122 registered namespaces, 3 dynamic reference(s) skipped.`
- Canary (eslint-clean `P68LintCanary.tsx` with `useTranslation('p68-canary-unregistered')`): `pnpm --filter intake-frontend run lint` → **exit 1**, caught by the guard (not eslint):
  `i18n namespace check FAILED … frontend/src/P68LintCanary.tsx:4: useTranslation('p68-canary-unregistered') — unregistered namespace`. Canary removed.

New lint script:
`cd .. && eslint -c eslint.config.mjs --max-warnings 0 'frontend/src/**/*.{ts,tsx}' && node scripts/check-i18n-namespaces.mjs`

## Deviations from Plan

None in behavior. Task 1's hardening was unnecessary — the plan-01 script already satisfied every Task-1 acceptance criterion (both `useTranslation` forms, reports all offenders, no false positives across 785 literals / 122 namespaces).

## False positives during development

One genuine offender (not a false positive) was found and fixed during plan 01: `EscalationDialog.tsx` listed `waitingQueue` (a key in common.json) as a namespace. Fixed there (`a77dac1f`). The clean codebase now has zero offenders.

## Next Phase Readiness

- REMED-06 complete and CI-enforced. Wave 2 done (68-02 + 68-07). Wave 3 (68-03, 68-04, 68-06) is unblocked.

---

_Phase: 68-ai-foundations-remediation_
_Completed: 2026-06-14_
