---
phase: 29-complex-type-wizards
plan: 04
subsystem: ui
tags:
  [
    react,
    react-hook-form,
    zod,
    tanstack-router,
    i18next,
    heroui,
    rtl,
    wizard,
    working-group,
    dossier,
  ]

requires:
  - phase: 29-complex-type-wizards
    provides: 'working_groups.parent_body_id column + partial index (Plan 29-02)'
provides:
  - '3-step Working Group create wizard at /dossiers/working_groups/create'
  - 'WorkingGroupDetailsStep capturing status/established_date/bilingual mandate/parent body'
  - 'WorkingGroupReviewStep with grouped cards + per-step Edit jumps'
  - 'workingGroupWizardConfig mapping UI fields to DB columns (status, established_date, mandate_en, mandate_ar, parent_body_id)'
  - 'Working Group list-page Create button that routes to the new wizard'
  - 'Bilingual en + ar form-wizard keys for the WG wizard'
affects: [dossier-creation, working-groups, phase-29-later-plans, dossier-list-pages]

tech-stack:
  added: []
  patterns:
    - 'Reuse of existing SharedBasicInfoStep + CreateWizardShell + useCreateDossierWizard<T> pattern (identical to organization/topic/person/forum wizards)'
    - 'DossierPicker single-select for parent_body (value + onChange), filtered by dossierType'
    - 'Arabic textarea uses dir={direction} from useDirection(); zero textAlign:right usage per CLAUDE.md RTL rules'
    - 'Schema enum alignment to live DB CHECK values (A-03: active/inactive/pending/suspended)'

key-files:
  created:
    - frontend/src/components/dossier/wizard/config/working-group.config.ts
    - frontend/src/components/dossier/wizard/steps/WorkingGroupDetailsStep.tsx
    - frontend/src/components/dossier/wizard/review/WorkingGroupReviewStep.tsx
    - frontend/src/components/dossier/wizard/steps/__tests__/WorkingGroupDetailsStep.test.tsx
    - frontend/src/components/dossier/wizard/review/__tests__/WorkingGroupReviewStep.test.tsx
    - frontend/src/routes/_protected/dossiers/working_groups/create.tsx
  modified:
    - frontend/src/components/dossier/wizard/schemas/working-group.schema.ts
    - frontend/src/components/dossier/wizard/defaults/index.ts
    - frontend/src/i18n/en/form-wizard.json
    - frontend/src/i18n/ar/form-wizard.json
    - frontend/src/routes/_protected/dossiers/working_groups/index.tsx
    - frontend/src/routeTree.gen.ts

key-decisions:
  - 'Aligned wg_status enum to live DB CHECK values [active, inactive, pending, suspended] per A-03 — not the earlier "discretion" values'
  - 'Used single-select DossierPicker API (value/onChange) for parent_body — 29-01 multi-select extension not needed for WG'
  - 'Stacked mandate_en + mandate_ar textareas vertically (NOT grid) per D-16 and UI spec §4.2'
  - 'Arabic mandate textarea uses dir={direction}; no textAlign:right anywhere (CLAUDE.md Rule 3)'
  - 'Set wg_status default to undefined in defaults/index.ts (was empty string) because schema now uses z.enum().optional()'

patterns-established:
  - 'Working group wizard composition mirrors organization wizard: SharedBasicInfoStep → <TypeDetails>Step → <Type>ReviewStep under CreateWizardShell'
  - 'Deferred parent_body persistence is handled by filterExtensionData: strips empty strings to undefined before hitting extensionData'

requirements-completed: [WG-01, WG-02, WG-03]

duration: 12min
completed: 2026-04-16
---

# Phase 29 Plan 04: Working Group Wizard Summary

**3-step WG create wizard with status/mandate/parent-body fields, single-select DossierPicker parent body, RTL-compliant bilingual mandate textareas, and list-page Create button routing to the new /dossiers/working_groups/create route**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-04-16T21:26:00Z
- **Completed:** 2026-04-16T21:37:00Z
- **Tasks:** 3
- **Files modified:** 11 (6 created, 5 edited — plus auto-regen routeTree.gen.ts)

## Accomplishments

- Working Group 3-step create wizard accessible at `/dossiers/working_groups/create`
- Status select aligned to live DB CHECK (active/inactive/pending/suspended)
- Bilingual mandate capture (EN + AR) with proper RTL via `dir={direction}` — zero `textAlign:right`
- Single-select DossierPicker filtered to `organization` for parent body
- `filterExtensionData` maps UI fields → DB columns: status, established_date, mandate_en, mandate_ar, parent_body_id
- List-page Create button now correctly routes to the WG wizard (was broken: pointed to `/dossiers/create`)
- 9 unit tests (5 step + 4 review) all green

## Task Commits

Each task committed atomically on `worktree-agent-a33ac238` branch:

1. **Task 1: Schema + config + bilingual i18n** — `19ebb62f` (feat)
2. **Task 2: WorkingGroupDetailsStep + ReviewStep + tests** — `435c6939` (feat, includes test files)
3. **Task 3: Wizard route + list-page Create button** — `2f8e0a52` (feat, includes regenerated routeTree.gen.ts)

## Files Created/Modified

### Created

- `frontend/src/components/dossier/wizard/config/working-group.config.ts` — wizard config (type='working_group', 3 steps, filterExtensionData)
- `frontend/src/components/dossier/wizard/steps/WorkingGroupDetailsStep.tsx` — WG details form step
- `frontend/src/components/dossier/wizard/review/WorkingGroupReviewStep.tsx` — WG review step with Edit jumps
- `frontend/src/components/dossier/wizard/steps/__tests__/WorkingGroupDetailsStep.test.tsx` — 5 step tests (options, DossierPicker filter, date type, LTR+RTL dir)
- `frontend/src/components/dossier/wizard/review/__tests__/WorkingGroupReviewStep.test.tsx` — 4 review tests (sections, Edit callbacks, status i18n, mandate truncation)
- `frontend/src/routes/_protected/dossiers/working_groups/create.tsx` — TanStack route

### Modified

- `frontend/src/components/dossier/wizard/schemas/working-group.schema.ts` — wg_status now z.enum([...]).optional()
- `frontend/src/components/dossier/wizard/defaults/index.ts` — wg_status default changed to `undefined` (was empty string, incompatible with enum)
- `frontend/src/i18n/en/form-wizard.json` — added `steps.workingGroupDetails(Desc)`, `workingGroup` group, `review.working_group_details`
- `frontend/src/i18n/ar/form-wizard.json` — Arabic mirror
- `frontend/src/routes/_protected/dossiers/working_groups/index.tsx` — Create button + empty-state link now point to `/dossiers/working_groups/create`; useTranslation now loads both `dossier` and `form-wizard` namespaces
- `frontend/src/routeTree.gen.ts` — auto-regenerated by TanStack Router plugin to register the new route

## Verification

- **Unit tests:** `pnpm vitest run src/components/dossier/wizard/steps/__tests__/WorkingGroupDetailsStep.test.tsx src/components/dossier/wizard/review/__tests__/WorkingGroupReviewStep.test.tsx` → **9/9 passing** (5 step, 4 review)
- **JSON parse:** both en/ar form-wizard.json parse cleanly via `JSON.parse`
- **Typecheck on modified files:** `tsc --noEmit` shows **zero errors** in any Plan 29-04 file. All remaining errors are pre-existing TS6133 "declared but never used" in unrelated files (e.g., `src/types/working-group.types.ts`, `src/hooks/useWorkingGroups.ts`, `src/types/work-item.types.ts`) — out of scope per executor Rule "SCOPE BOUNDARY".
- **Route tree:** 13 references to `working_groups/create` present in `routeTree.gen.ts`
- **Acceptance greps (Task 3):** all 4 checks pass (`createFileRoute`, `workingGroupWizardConfig` imported, `SharedBasicInfoStep ... dossierType="working_group"`, index links to create)

## Must-Haves — Truth Status

| Must-have truth                                                                                | Status                                                                |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| List page has Create WG button → `/dossiers/working_groups/create`                             | ✅                                                                    |
| Wizard renders 3 steps — Basic Info, WG Details, Review                                        | ✅                                                                    |
| WG Details captures status / established_date / mandate_en+ar / parent_body_id                 | ✅                                                                    |
| Submitting creates dossier type=working_group and persists WG fields via `filterExtensionData` | ✅ (wired; runtime DB create not exercised — see "Not Verified Here") |
| Post-create navigates via `getDossierDetailPath('working_group', id)`                          | ✅ (in `useCreateDossierWizard`)                                      |
| All UI labels render bilingually (en + ar)                                                     | ✅                                                                    |

## Decisions Made

- Kept wg_status default as `undefined` in defaults/index.ts (required after enum tightening). This is the only cross-cutting change outside `files_modified` — recorded as a Rule 3 blocking fix (see Deviations).
- Used `cleanup` from `@testing-library/react` (not vitest) — required for test isolation; initially mis-imported and immediately fixed.
- `pnpm install` was required because the worktree had no `node_modules` — out of scope for the plan so `pnpm-lock.yaml` is left unstaged.
- Worktree branch was ahead of plan creation; rebased onto `main` before starting so phase 29 planning docs and Wave 1 work are present.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] defaults/index.ts type-mismatch after schema tightening**

- **Found during:** Task 1 (schema + config)
- **Issue:** `defaults/index.ts` had `wg_status: ''` but schema now uses `z.enum([...]).optional()`. Empty string would fail Zod validation at form init, making the wizard un-openable.
- **Fix:** Changed `wg_status: ''` to `wg_status: undefined` in `workingGroupDefaults`.
- **Files modified:** `frontend/src/components/dossier/wizard/defaults/index.ts` (not in plan's `files_modified`)
- **Verification:** tsc --noEmit reports zero errors on that file; runtime defaults hydrate cleanly.
- **Committed in:** `19ebb62f` (Task 1 commit)

**2. [Rule 3 - Blocking] Missing node_modules in worktree**

- **Found during:** Task 1 verify (pnpm type-check)
- **Issue:** Worktree had no `node_modules`, so tsc/vitest binaries were absent. `pnpm type-check` failed with `tsc: command not found`.
- **Fix:** Ran `pnpm install` at repo root.
- **Files modified:** `pnpm-lock.yaml` (left unstaged — not part of plan scope, repo-wide lockfile managed separately)
- **Verification:** `frontend/node_modules/.bin/tsc` exists after install.
- **Committed in:** not committed (pre-existing infra; lockfile intentionally not staged)

**3. [Rule 3 - Blocking] TanStack Router route tree not updated**

- **Found during:** Task 3 verify
- **Issue:** TanStack Router uses a Vite plugin to generate `routeTree.gen.ts`. After creating the new route file, the tree was not regenerated until Vite ran, so `createFileRoute('/_protected/dossiers/working_groups/create')` failed typecheck (TS2345: not assignable to FileRoutesByPath).
- **Fix:** Briefly started `vite dev` in background (8 s), killed it, and confirmed `routeTree.gen.ts` now contains the new route (13 references).
- **Files modified:** `frontend/src/routeTree.gen.ts`
- **Verification:** `grep -c "working_groups/create" frontend/src/routeTree.gen.ts` → 13
- **Committed in:** `2f8e0a52` (Task 3 commit)

**4. [Rule 2 - Missing critical] List page Create button targeted wrong route**

- **Found during:** Task 3 (reading existing `working_groups/index.tsx`)
- **Issue:** Existing Create button pointed to `/dossiers/create` (generic type-picker) — same bug noted in plan for forums. Per plan's explicit action, redirect to `/dossiers/working_groups/create` with the new label.
- **Fix:** Updated PageHeader action + empty-state button; added `form-wizard` namespace to useTranslation.
- **Files modified:** `frontend/src/routes/_protected/dossiers/working_groups/index.tsx`
- **Committed in:** `2f8e0a52` (Task 3 commit)

**5. [Rule 1 - Bug] Test file imported `cleanup` from vitest**

- **Found during:** Task 2 test run
- **Issue:** `cleanup is not a function` — `cleanup` must come from `@testing-library/react`.
- **Fix:** Moved `cleanup` import to the testing-library import line.
- **Files modified:** `frontend/src/components/dossier/wizard/review/__tests__/WorkingGroupReviewStep.test.tsx`
- **Verification:** 4/4 review tests pass after fix.
- **Committed in:** `435c6939` (Task 2 commit, after the fix)

---

**Total deviations:** 5 auto-fixed (3 blocking infra/route/schema-defaults, 1 missing-critical routing, 1 test bug). No scope creep — all necessary for correctness and to satisfy plan acceptance criteria.

## Issues Encountered

- Worktree branch was based on a commit predating Phase 29 (`8f28505`). Rebased onto `main` before starting so planning docs and Wave 1 work are available in the tree.
- Pre-existing TS6133 "declared but never used" errors in unrelated files (e.g., `src/types/work-item.types.ts`, `src/hooks/useWorkingGroups.ts`) are **out of scope** and left as-is per executor SCOPE BOUNDARY rule.

## Not Verified Here

Runtime DB smoke (SELECT from `working_groups` after a live create) was **NOT executed** from this worktree — the plan's manual smoke step required parent-session Supabase MCP (subagents lack Supabase MCP access per project memory). The wiring is correct: `filterExtensionData` emits `status/established_date/mandate_en/mandate_ar/parent_body_id`, and `useCreateDossierWizard` forwards these to `extensionData` which the dossier-api persists into `working_groups`. Recommend the parent session run the smoke test when assembling SUMMARY review.

## Next Phase Readiness

- WG wizard feature-complete; ready for manual smoke + staging promotion
- Wave 2 siblings (forums, topics) can use this plan's pattern verbatim
- No blockers for remaining Plan 29 work
- Consider (non-blocker): pre-existing `src/types/working-group.types.ts` TS6133 cleanup in a tech-debt plan

## Self-Check: PASSED

- `frontend/src/components/dossier/wizard/config/working-group.config.ts` — **FOUND**
- `frontend/src/components/dossier/wizard/steps/WorkingGroupDetailsStep.tsx` — **FOUND**
- `frontend/src/components/dossier/wizard/review/WorkingGroupReviewStep.tsx` — **FOUND**
- `frontend/src/routes/_protected/dossiers/working_groups/create.tsx` — **FOUND**
- `frontend/src/components/dossier/wizard/steps/__tests__/WorkingGroupDetailsStep.test.tsx` — **FOUND**
- `frontend/src/components/dossier/wizard/review/__tests__/WorkingGroupReviewStep.test.tsx` — **FOUND**
- Commit `19ebb62f` — **FOUND** (Task 1)
- Commit `435c6939` — **FOUND** (Task 2)
- Commit `2f8e0a52` — **FOUND** (Task 3)

---

_Phase: 29-complex-type-wizards_
_Completed: 2026-04-16_
