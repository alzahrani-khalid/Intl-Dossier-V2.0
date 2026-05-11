---
phase: 29-complex-type-wizards
plan: 06
subsystem: dossiers-create-wizards
tags: [e2e, playwright, integration, verification, tanstack-router]
requires:
  - 29-01 (DossierPicker multi-select)
  - 29-02 (DB migrations: wg parent_body, forums organizing_body)
  - 29-03 (Forum wizard route + steps)
  - 29-04 (Working Group wizard route + steps)
  - 29-05 (Engagement wizard route + steps + participants)
provides:
  - Playwright E2E coverage for all three new create-flows
  - Verification that routeTree.gen.ts registers all three /create routes
  - Frontend workspace typecheck green with zero Phase-29 regressions
affects:
  - tests/e2e
  - .planning/phases/29-complex-type-wizards
tech-stack:
  added: []
  patterns:
    - Role-scoped Playwright fixtures (adminPage) + uniqueId helper
    - Bilingual locator regex (EN|AR) in every assertion for resilience
    - 3-test file for engagement (main flow + date refinement + chip UX)
key-files:
  created:
    - tests/e2e/forum-create.spec.ts
    - tests/e2e/working-group-create.spec.ts
    - tests/e2e/engagement-create.spec.ts
  modified: []
decisions:
  - Live-server Playwright run deferred to human UAT — plan frontmatter
    declares `autonomous: false` and this worktree cannot trivially start
    the dev server for a parent-dependent run. Specs validated via
    `pnpm exec playwright test --list` (5 tests parsed across 3 files).
  - Task 1 required no code changes — routeTree.gen.ts was already correct
    (merged from main commit 9b51e260 before this plan started). Verified
    all three identifiers present via grep.
metrics:
  duration: ~20min
  completed: 2026-04-16
---

# Phase 29 Plan 06: Integration + Verification Summary

Integration sweep that adds Playwright E2E coverage for the three new
wizards shipped in 29-03/04/05 and validates the monorepo-wide
typecheck/lint state after merging the Phase-29 wave.

## Tasks

### Task 1 — Regenerate routeTree + monorepo typecheck/lint sweep

**No file changes required.** `frontend/src/routeTree.gen.ts` already
contained all three new create-route identifiers after main's commit
`9b51e260` was merged into this worktree at agent start.

Route-tree verification:

- `ProtectedDossiersForumsCreateRoute` — present
- `ProtectedDossiersWorking_groupsCreateRoute` — present (underscore
  preserved per TanStack Router plugin convention)
- `ProtectedDossiersEngagementsCreateRoute` — present
- `/dossiers/{forums,working_groups,engagements}/create` literal
  occurrences in routeTree.gen.ts: 39 total across `id`, `path`,
  and typed route-map entries.

**Typecheck (`pnpm typecheck`)** — exit 2. All errors originate in the
**backend** workspace (`intake-backend:type-check`): pre-existing
TS6133/TS6196 "declared but never used" warnings in
`backend/src/types/**` and `backend/src/utils/**`. **Zero errors in
`intake-frontend:type-check`.** Per the prompt's explicit carve-out
("pre-existing TS6133/TS6196 unused-decl errors in unrelated files are
out of scope per prior plan precedent — do NOT attempt to clean them")
these are left untouched and flagged below under _Deferred Issues_.

**Lint (`pnpm lint`)** — exit 1. `intake-frontend:lint` reports
**734 problems (56 errors, 678 warnings)**. Rule breakdown of the 56
errors: 52 × `@typescript-eslint/no-explicit-any` (hooks, services,
types), 2 × `no-useless-escape`, 1 × `unused-imports/no-unused-imports`,
1 × `react-hooks/rules-of-hooks`. **Zero lint errors originate from
Phase-29 files** (`/dossier/wizard/**`, `/routes/_protected/dossiers/
{forums,working_groups,engagements}/create.tsx`, new `tests/e2e/*-create.spec.ts`) —
confirmed via ripgrep over the log. Also out of scope per precedent.

**Vitest** — not re-run in this worktree; the 29-03/04/05 summaries
each record their own green vitest runs. No files in this plan touch
app code, so regressions are structurally impossible from this plan.

**Commit:** none (no code changes).

### Task 2 — Add three Playwright E2E specs

Created:

- `tests/e2e/forum-create.spec.ts` — 1 test. Navigates list → Create
  button → fills name_en/name_ar → steps through 3-step wizard →
  submits → asserts UUID redirect + heading. Uses bilingual EN|AR
  locators throughout.
- `tests/e2e/working-group-create.spec.ts` — 1 test. Same shell, plus
  picks status=Active, fills mandate_en/mandate_ar, leaves
  established_date and parent_body_id blank (per D-11 optional).
- `tests/e2e/engagement-create.spec.ts` — 3 tests:
  1. **main flow** (ENGM-01/03/05) — 4-step wizard, type=bilateral_meeting,
     category=diplomatic, start=today, end=today+1, blank participants,
     submit → detail redirect.
  2. **ENGM-02 date refinement** — sets end=yesterday/start=today, attempts
     Next, asserts URL stays on `/create` and `form-wizard:validation.
end_after_start` error appears in EN or AR.
  3. **ENGM-04 chip UX** — on Participants step, types in Countries
     picker, clicks first option, asserts a remove-affordance button
     (✕ / "Remove" / "إزالة") renders, clicks it, asserts chip hidden.

All three files follow the repo conventions: no semicolons, single
quotes, explicit return types `: Promise<void>`, import `test, expect`
from `./support/fixtures` (role-scoped `adminPage` + `uniqueId`).
Credentials come from the `admin.json` storage state loaded by
`playwright.config.ts`, so specs never reference `process.env.
TEST_USER_EMAIL` directly — following the Phase-18 / current-codebase
auth fixture pattern.

**Verification:** `pnpm exec playwright test tests/e2e/forum-create.spec.ts
tests/e2e/working-group-create.spec.ts tests/e2e/engagement-create.spec.ts
--list` discovered **8 tests in 4 files** (setup + 5 new cases across
the 3 new files). No parse errors.

**Commit:** `03a5f3e3` — `test(29-06): add E2E specs for forum/WG/engagement create wizards`

### Task 3 — Human checkpoint (DEFERRED, `autonomous: false`)

This is the blocking `checkpoint:human-verify` task. Per the plan
frontmatter it **requires the user** to walk through the three
wizards in both English and Arabic locales and confirm bilingual
visual polish + verify DB rows via Supabase MCP. Not attempted —
awaiting human UAT.

## Must-Have Coverage

| #   | Truth                                                                                      | Status                                                                                                                                                                                                                                                      |
| --- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Three `/create` routes registered in `routeTree.gen.ts` and resolvable by TanStack Router  | **PASS** — all three `ProtectedDossiers{Forums,Working_groups,Engagements}CreateRoute` identifiers present; 39 literal `/create` occurrences                                                                                                                |
| 2   | `pnpm typecheck` and `pnpm lint` pass with zero **Phase-29** regressions                   | **PASS (scope-qualified)** — `intake-frontend:type-check` has 0 errors; backend TS6133/TS6196 errors are pre-existing per prompt carve-out. Lint: 0 errors in Phase-29 files; the 56 pre-existing `no-explicit-any` errors live in unrelated hooks/services |
| 3   | Three Playwright specs exist and pass against a running dev server                         | **PARTIAL** — 3 specs exist and parse cleanly (verified via `--list`); **live-server run awaits human UAT per autonomous: false**                                                                                                                           |
| 4   | Human verifies visual + DB state for one create-flow per wizard in both Arabic and English | **DEFERRED** — awaiting human UAT (Task 3 checkpoint)                                                                                                                                                                                                       |

## Per-Requirement Signal Map

| REQ      | Signal source                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------ |
| FORUM-01 | routeTree grep + `tests/e2e/forum-create.spec.ts` (URL assertion on `/dossiers/forums/create`)   |
| FORUM-02 | `tests/e2e/forum-create.spec.ts` (Forum Details step heading assertion)                          |
| FORUM-03 | `tests/e2e/forum-create.spec.ts` (Review + submit + UUID redirect)                               |
| WG-01    | routeTree grep + `tests/e2e/working-group-create.spec.ts` (URL assertion)                        |
| WG-02    | `tests/e2e/working-group-create.spec.ts` (status Active + mandate_en/ar fills)                   |
| WG-03    | `tests/e2e/working-group-create.spec.ts` (Review + submit)                                       |
| ENGM-01  | routeTree grep + `tests/e2e/engagement-create.spec.ts` main flow                                 |
| ENGM-02  | `tests/e2e/engagement-create.spec.ts` test 2 (date refinement)                                   |
| ENGM-03  | `tests/e2e/engagement-create.spec.ts` test 1 Participants heading + test 3 three-section chip UX |
| ENGM-04  | `tests/e2e/engagement-create.spec.ts` test 3 (chip add/remove)                                   |
| ENGM-05  | `tests/e2e/engagement-create.spec.ts` test 1 (stepper has 4 items)                               |

Every REQ has at least one automated signal; ENGM-04 and the
bilingual visual polish additionally receive a human-verification
signal once Task 3 runs.

## Deviations from Plan

**None.** All Rule-1..4 triggers were absent:

- Task 1 `action` called for a forced route-tree regeneration; that
  work already shipped in main's commit `9b51e260` which was merged
  into this worktree. Skipping a no-op Build was the correct call,
  not a deviation.
- Backend TS6133/TS6196 errors and frontend `no-explicit-any` errors
  are pre-existing and explicitly scoped out by the prompt.

## Deferred Issues (out of scope per prompt)

1. **Backend unused-decl errors** — `backend/src/types/ai-suggestions.types.ts`
   (4 unused type exports), `backend/src/types/contact-directory.types.ts`
   and `database.types.ts` (Supabase-generated `Tables`, `TablesInsert`,
   `TablesUpdate`, `Enums`, `CompositeTypes`, `Constants` unused),
   `backend/src/utils/logger.ts` (7 unused helpers), `backend/src/utils/
validation.ts` (5 unused schemas/params), plus `intake-entity-links.types.ts`.
   Rule `TS6133` / `TS6196`. Recommend future cleanup plan scoping to
   auto-generated files vs. hand-authored utilities.
2. **Frontend `@typescript-eslint/no-explicit-any` × 52** — spread
   across `frontend/src/hooks/*`, `frontend/src/services/*`,
   `frontend/src/types/heroui-react.d.ts`, a couple of pages. Blocking
   a blanket "0 lint errors" bar for the monorepo; not introduced by
   Phase 29.
3. **Single `react-hooks/rules-of-hooks` error** — should be investigated
   in a follow-up quick plan.

## What Remains for Human UAT

**Task 3 (Human Verification) is blocking-open.** To close this plan
the user must:

1. `pnpm install` in the main working tree (or reuse this worktree).
2. `pnpm dev` from repo root and visit `http://localhost:5173`.
3. Log in with `.env.test` credentials.
4. **Forum wizard — EN:** `/dossiers/forums` → Create → fill EN+AR names
   → Next → (optional) pick organizing body via DossierPicker → Next →
   Review → Submit → confirm redirect to `/dossiers/:id`.
5. **Forum wizard — AR:** switch language, repeat, confirm Create
   button on start (LEFT in RTL), Arabic labels throughout, name_ar on
   selected-dossier card.
6. **WG wizard — EN & AR:** full flow; confirm status dropdown shows
   4 options (Active/Inactive/Pending/Suspended / نشط/غير نشط/قيد
   الانتظار/معلق), mandate EN/AR stacked with RTL text direction on
   the Arabic textarea, parent body picker filters to organizations.
7. **Engagement wizard — EN & AR:** 4 steps visible; type (10 options),
   category (8 options) selects; test end_date < start_date error
   surface in both locales; Participants step — search + pick 2-3
   dossiers per section, confirm chips appear beneath each combobox in
   a horizontally-scrollable row; in AR confirm chip-row RTL scroll
   and first-picked chip on the RIGHT.
8. After submit, run Supabase MCP SELECT against
   `engagement_participants` to confirm rows carry correct
   `participant_type` and `role='delegate'`.

Optionally, once the dev server is running, the user (or a subsequent
agent with MCP access) may execute:

```
pnpm exec playwright test tests/e2e/forum-create.spec.ts \
  tests/e2e/working-group-create.spec.ts \
  tests/e2e/engagement-create.spec.ts --reporter=line
```

to prove the automated must-have truth #3 green.

## Commits

- `03a5f3e3` — `test(29-06): add E2E specs for forum/WG/engagement create wizards` (3 files, +262 lines)

No additional commits — Task 1 required no code changes.

## Self-Check: PASSED

- [x] `tests/e2e/forum-create.spec.ts` exists (committed)
- [x] `tests/e2e/working-group-create.spec.ts` exists (committed)
- [x] `tests/e2e/engagement-create.spec.ts` exists (committed)
- [x] Commit `03a5f3e3` present in `git log`
- [x] `pnpm exec playwright test --list` discovers 5 new test cases
- [x] Zero lint errors or typecheck errors originate from Phase-29 code
- [x] routeTree.gen.ts registers all three `/create` routes
