---
phase: 86-feature-completion
plan: 05
subsystem: verification
tags: [phase-gate, e2e, playwright, render-signoff, rtl, i18n, codex]

# Dependency graph
requires:
  - phase: 86-01/02/03/04
    provides: the three new surfaces (MoU create dialog, /users/create, /users/:id) + ConsistencyPanel retirement
provides:
  - phase-wide green automated gate battery (vitest, lint, type-check, FEAT-04 grep gates, MoU E2E)
  - consolidated human/orchestrator render sign-off across EN/LTR + AR/RTL at 1400 and 1024 (criterion 5)
  - one fix-forward defect closure (MoU signatory .uuid() over-strictness)
  - two triaged out-of-scope findings routed to Phase 88 / Phase 90
affects: [phase-86 completion, Phase 88 security-hygiene tail, Phase 90 CORS migration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'delegated E2E run to a codex pane agent (herdr visible pane); orchestrator triaged findings'
    - 'render sign-off via headless Playwright capture matrix (3 surfaces x 2 locales x 2 widths, dark)'

key-files:
  created:
    - .planning/phases/86-feature-completion/86-05-SUMMARY.md
  modified:
    - frontend/src/components/mous/CreateMouDialog.tsx
    - frontend/src/components/mous/__tests__/CreateMouDialog.test.tsx
    - frontend/tests/e2e/mou-create.spec.ts

key-decisions:
  - 'MoU signatory validation relaxed from z.string().uuid() to z.string(): the app id space includes non-RFC-4122 seed UUIDs (7 country/org dossiers incl. UAE); the picker guarantees a real id and the mous edge fn re-validates server-side (commit e57bd74e).'
  - 'create-user / assign-role browser failure is a PRE-EXISTING deployed-backend defect (POST hangs ~12s -> 500, error escapes the CORS wrapper), NOT Phase 86 code — frontend invokes via supabase.functions.invoke correctly. Routed to Phase 88/90 + ops.'
  - 'IN-04 .or() PostgREST filter-interpolation in UsersListPage predates Phase 86 (authored 2026-01-14) and is already scheduled for Phase 88 — recorded, not fixed here.'

status: passed
---

# Phase 86 Plan 05: Feature-Completion Gate Summary

## Accomplishments

Ran the consolidated phase-exit battery and the single house-practice render
sign-off for the three new surfaces built in waves 1–2 (MoU create dialog,
`/users/create`, `/users/:id`). The E2E run was delegated to a codex agent in a
visible herdr pane; the orchestrator triaged its two findings, fixed the one
in-scope defect, and performed the render sign-off.

## Task 1 — Automated battery (green)

| Gate                                                                           | Result                                                             |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `vitest run` (full frontend)                                                   | ✓ 1491 passed / 1 skipped / 25 todo (was 1490; +1 MoU regression)  |
| `lint --max-warnings 0` (eslint + i18n + rtl + bootstrap-parity + date-format) | ✓ pass                                                             |
| `type-check` (tsc --noEmit)                                                    | ✓ pass                                                             |
| FEAT-04 grep gates (ConsistencyPanel / ConsistencyCheck / consistency_check)   | ✓ all zero in frontend/src                                         |
| Security gates (no `from('mous')` writes; new-code `.or(` interpolation)       | ✓ no mous writes; the one `.or(` is pre-existing (Phase 88 IN-04)  |
| `mou-create.spec.ts` (E2E, live :5173 → staging)                               | ✓ 2/2 (create flow + AR/RTL) after fix                             |
| `user-management.spec.ts` (E2E)                                                | ⚠ blocked by pre-existing `create-user` backend 500 (see findings) |

## Task 2 — Render sign-off (PASS)

Captured 12 screenshots via headless Playwright (authenticated) — 3 surfaces ×
{EN/LTR, AR/RTL} × {1400, 1024}, dark mode — and reviewed each. Verdict:

- All three surfaces render correctly in both locales at both analyst widths.
- RTL fully correct: mirrored sidebar/heading/grid, end-placed primary buttons,
  flipped select chevrons, Tajawal applied, start-aligned labels, zero raw i18n
  keys (إنشاء مذكرة تفاهم / إنشاء مستخدم / نظرة عامة / تعيين الدور; role مشاهد; status نشط).
- Linear dark tokens throughout: flat surfaces, 1px `var(--line)` borders, token
  radii, `.btn-primary`/`.btn-ghost`, no shadows/gradients.
- No ConsistencyPanel UI/strings remain (also grep-verified).
- Performed by the orchestrator at the developer's explicit direction ("you do
  the testing"); evidence delivered to the developer.

## Deviations from Plan

- **Fix-forward (in scope, product defect closure).** The gate E2E surfaced a real
  86-01 defect: `CreateMouDialog`'s `z.string().uuid()` (strict RFC-4122) rejected
  7 country/org dossiers (incl. UAE) that carry non-RFC "pretty" seed UUIDs,
  disabling submit. Relaxed to `z.string()` (id is picker-supplied + server
  re-validated), added a regression unit test, and fixed the E2E picker selectors.
  Commit `e57bd74e`. MoU E2E then went 2/2. This was a product-defect the plan
  would normally route to gap closure, but it is a 2-line client-validation
  correction with a test, so it was closed inline per the developer's "fix-forward"
  choice.
- **E2E delegated to codex** (herdr visible pane) rather than run inline, at the
  developer's request. Codex applied only a test-selector fix; no product source.

## Issues Encountered / Out-of-scope findings (routed)

1. **create-user / assign-role fail from the browser (Phase 88/90 + ops).** The
   deployed `create-user` POST hangs ~12s then 500s (rate-limit/admin path);
   because the throw escapes before the try/catch, the wildcard `corsHeaders` are
   not emitted, so the browser reports "no ACAO / net::ERR_FAILED". Frontend wiring
   is correct (`supabase.functions.invoke`). Root cause is server-side and
   pre-existing (functions deployed 2026-06-28). This blocks the live create/mutate
   round-trip for user management; the UI renders correctly. Owner: Phase 90 (CORS
   migration off deprecated wildcard `corsHeaders`) + backend/ops (rate-limit
   backend). `user-management.spec.ts` stays red until this is resolved.
2. **IN-04 `.or()` filter interpolation in `UsersListPage` (Phase 88).** Pre-existing
   (authored 2026-01-14), already on the Phase 88 roadmap line.

## Verification Status

- Task 1 battery: green (with the two findings above documented, not papered over).
- Task 2 render sign-off: PASS (orchestrator-performed at developer direction).
- Criterion 5 (EN/LTR + AR/RTL correctness at 1400 & 1024): met.

## Next Phase Readiness

FEAT-01/02/03/04 delivered at the frontend layer. The user-management _mutation_
round-trip is gated on the pre-existing backend fix (Phase 88/90). MoU create is
fully live-verified. Phase 86 is ready for verification + completion.

## Self-Check: PASSED

- All six Task-1 gate groups run and recorded (E2E user-mgmt blocked by documented
  pre-existing backend, not a Phase-86 regression).
- Render sign-off complete across the full locale × width matrix.
- One in-scope defect fixed with a regression test; two out-of-scope findings routed.
