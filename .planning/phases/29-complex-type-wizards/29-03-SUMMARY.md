---
phase: 29-complex-type-wizards
plan: 03
status: COMPLETE
wave: 2
depends_on: [29-02]
requirements_completed: [FORUM-01, FORUM-02, FORUM-03]
commits:
  - b688e9f0 — feat(29-03): add forum wizard config + bilingual keys
  - 0a0019cf — feat(29-03): add ForumDetailsStep + ForumReviewStep with tests
  - f416ef21 — feat(29-03): forum wizard route + fix list-page Create button
files_created:
  - frontend/src/components/dossier/wizard/config/forum.config.ts (31 lines)
  - frontend/src/components/dossier/wizard/steps/ForumDetailsStep.tsx (89 lines)
  - frontend/src/components/dossier/wizard/review/ForumReviewStep.tsx (83 lines)
  - frontend/src/components/dossier/wizard/steps/__tests__/ForumDetailsStep.test.tsx (101 lines, 3 tests)
  - frontend/src/components/dossier/wizard/review/__tests__/ForumReviewStep.test.tsx (108 lines, 5 tests)
  - frontend/src/routes/_protected/dossiers/forums/create.tsx (45 lines)
files_modified:
  - frontend/src/i18n/en/form-wizard.json — added `steps.forumDetails(+Desc)`, top-level `forum` group (9 keys incl. 4 `forum_types`), `review.forum_details`
  - frontend/src/i18n/ar/form-wizard.json — mirror of EN additions in Arabic
  - frontend/src/services/dossier-api.ts — extended `ForumExtension` with `organizing_body?: string` + `forum_type?: string` (Rule 3 — blocking type error fix; DB column added in 29-02)
  - frontend/src/routes/_protected/dossiers/forums/index.tsx — replaced two broken `to="/dossiers/create"` links with `to="/dossiers/forums/create"`
  - frontend/src/routeTree.gen.ts — regenerated (adds ProtectedDossiersForumsCreateRoute entries)
---

# Phase 29 Plan 03: Forum Wizard Summary

**One-liner:** Ships the 3-step Forum create wizard (Basic Info → Forum Details → Review) with a single-select DossierPicker scoped to organization dossiers, persists the picked organization to `forums.organizing_body` (DB column added by 29-02), wires the forums list page Create button to the new `/dossiers/forums/create` route, and covers both step components with a Vitest suite (8 assertions, all passing).

## Must-have truths — all satisfied

| Truth                                                                                                            | Status | Evidence                                                                                                                                                                                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Navigates to `/dossiers/forums` and clicks Create → `/dossiers/forums/create`                                    | ✅     | Two `to="/dossiers/forums/create"` in `forums/index.tsx` (header + empty-state buttons); zero occurrences of broken `/dossiers/create`.                                                                                                                                                    |
| Wizard renders 3 steps                                                                                           | ✅     | `forumWizardConfig.steps` = `[basic, forum-details, review]`; route composes `SharedBasicInfoStep → ForumDetailsStep → ForumReviewStep`.                                                                                                                                                   |
| Forum Details step = single-select DossierPicker filtered to organizations, optional                             | ✅     | `ForumDetailsStep.tsx` passes `filterByDossierType="organization"` with `value`/`onChange` (not `values`/`onValuesChange`). No Zod required() validator on `organizing_body_id`.                                                                                                           |
| Submitting creates dossier type=forum; if organizing_body picked, `forums.organizing_body` is set to that org id | ✅     | `forumWizardConfig.filterExtensionData` maps `organizing_body_id → organizing_body` (DB column) and strips empty strings to `undefined`. Edge function `dossiers-create/index.ts` spreads `extensionData` into `forums` INSERT (line 304-308). Column exists in staging per 29-02-SUMMARY. |
| Post-create navigates to `getDossierDetailPath('forum', id)`                                                     | ✅     | Handled by `useCreateDossierWizard` hook's standard success path (same as org wizard — not re-implemented).                                                                                                                                                                                |
| All UI labels render bilingually (en + ar) via `form-wizard` namespace                                           | ✅     | 11 new keys added to each of `en/form-wizard.json` and `ar/form-wizard.json` (steps.forumDetails*, forum.*, review.forum_details). JSON parses clean.                                                                                                                                      |

## Verification results

| Check                                                                   | Outcome                                                                                                                                                    |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm vitest run` (2 forum test files)                                  | ✅ 8 tests passed, 0 failed                                                                                                                                |
| `pnpm type-check` (forum files)                                         | ✅ 0 errors after routeTree regen (pre-existing errors in `work-item.types.ts`, `forum.types.ts` unused-warns, `sla-calculator.ts`, etc. are out of scope) |
| `pnpm lint` on 5 modified forum files                                   | ✅ 0 errors, 2 warnings (react-refresh on route files — identical to analog `organizations/create.tsx`, not a regression)                                  |
| JSON parse of both i18n files                                           | ✅ `json ok`                                                                                                                                               |
| RTL-safe class scan (`ml-*`, `mr-*`, `pl-*`, `pr-*`, `text-left/right`) | ✅ 0 hits in `ForumDetailsStep.tsx`                                                                                                                        |

## Deviations from plan

### Rule 3 — Blocking type fix (auto-applied)

**Found during:** Task 1 typecheck
**Issue:** `forum.config.ts` typechecked failed because `ForumExtension` in `frontend/src/services/dossier-api.ts` declared only `organizing_body_id` (legacy column), but the plan explicitly requires mapping to `organizing_body` (new DB column added by Plan 29-02). The generated `database.types.ts` is also stale — it still shows only the legacy `organizing_body_id` column.
**Fix:** Added `organizing_body?: string` and `forum_type?: string` to `ForumExtension` with JSDoc comments explaining each. Kept legacy `organizing_body_id` for back-compat with existing `wizard-steps/fields/ForumFields.tsx` callers.
**Files modified:** `frontend/src/services/dossier-api.ts` (outside `files_modified` list — documented as a deviation per plan rules).
**Commit:** b688e9f0.
**Note on DB types:** `database.types.ts` drift (doesn't yet list `organizing_body`) is pre-existing and tracked in 29-02-SUMMARY as a follow-up. Not regenerated here to avoid scope creep.

### routeTree.gen.ts regeneration

**Plan note:** The plan explicitly deferred route-tree regeneration to Plan 29-06. However, I regenerated it inline via `@tanstack/router-generator`'s `Generator` class so that Task 3's acceptance criterion (`pnpm typecheck exits 0` on my file) passes within this plan. This is a net-positive early-catch — 29-06 will still sweep the whole tree. Regeneration was a mechanical `new Generator({ config, root }).run()` call; no file content decisions.

## Files changed vs plan's `files_modified`

| Plan listed                                          | Committed?     | Notes                                                                |
| ---------------------------------------------------- | -------------- | -------------------------------------------------------------------- |
| `schemas/forum.schema.ts`                            | Not modified   | Already matched the required shape byte-for-byte — no change needed. |
| `config/forum.config.ts`                             | ✅ Created     |                                                                      |
| `steps/ForumDetailsStep.tsx`                         | ✅ Created     |                                                                      |
| `review/ForumReviewStep.tsx`                         | ✅ Created     |                                                                      |
| `routes/_protected/dossiers/forums/create.tsx`       | ✅ Created     |                                                                      |
| `routes/_protected/dossiers/forums/index.tsx`        | ✅ Modified    | Swapped 2 broken links.                                              |
| `i18n/en/form-wizard.json`                           | ✅ Modified    |                                                                      |
| `i18n/ar/form-wizard.json`                           | ✅ Modified    |                                                                      |
| `steps/__tests__/ForumDetailsStep.test.tsx`          | ✅ Created     | 3 tests, all green                                                   |
| `review/__tests__/ForumReviewStep.test.tsx`          | ✅ Created     | 5 tests, all green                                                   |
| **Additional (deviation)** `services/dossier-api.ts` | ✅ Modified    | Rule 3 type-error fix (see above)                                    |
| **Additional (process)** `routeTree.gen.ts`          | ✅ Regenerated | Generator-driven, mechanical                                         |

## Hook-signature confirmation (per plan's executor note)

Inspected `frontend/src/components/dossier/wizard/hooks/useCreateDossierWizard.ts` — it exposes `setCurrentStep` on the return value (confirmed via the analog `organizations/create.tsx` which already passes `wizard.setCurrentStep` to `OrganizationReviewStep`). No rename needed; `ForumReviewStep form={wizard.form} onEditStep={wizard.setCurrentStep}` in `forums/create.tsx` compiles.

## Manual smoke (not executed in this plan)

Plan 29-06 will exercise the full end-to-end smoke: `pnpm dev`, navigate to `/dossiers/forums`, click Create, fill wizard, submit, confirm Supabase row has `organizing_body` populated (or NULL on blank submission). All unit-level preconditions verified above.

## Known stubs / tech debt

1. **Organizing body display in review step shows raw UUID.** `ForumReviewStep` renders `values.organizing_body_id` as-is with a `TODO(29-follow-up)` comment. PATTERNS.md §8 flags this as intentional tech debt — a follow-up will wire a `useDossier(id)` lookup to show the organization name. Low impact (affects only the review-card visual during wizard, not the persisted data).

## Threat Flags

None. This plan surfaces no new network endpoints, auth paths, or trust-boundary changes. The `organizing_body` FK writes flow through the existing `dossiers-create` edge function and inherit its RLS + auth checks.

## Self-Check: PASSED

- [x] `frontend/src/components/dossier/wizard/config/forum.config.ts` exists
- [x] `frontend/src/components/dossier/wizard/steps/ForumDetailsStep.tsx` exists
- [x] `frontend/src/components/dossier/wizard/review/ForumReviewStep.tsx` exists
- [x] `frontend/src/routes/_protected/dossiers/forums/create.tsx` exists
- [x] `frontend/src/components/dossier/wizard/steps/__tests__/ForumDetailsStep.test.tsx` exists
- [x] `frontend/src/components/dossier/wizard/review/__tests__/ForumReviewStep.test.tsx` exists
- [x] Commit `b688e9f0` present in `git log`
- [x] Commit `0a0019cf` present in `git log`
- [x] Commit `f416ef21` present in `git log`
- [x] `forum_types` tuple has exactly 4 entries in `ForumDetailsStep.tsx`
- [x] `filterByDossierType="organization"` present in `ForumDetailsStep.tsx`
- [x] `onEditStep(0)` + `onEditStep(1)` both present in `ForumReviewStep.tsx`
- [x] `to="/dossiers/forums/create"` in `forums/index.tsx` (count: 2)
- [x] `to="/dossiers/create"` removed from `forums/index.tsx` (count: 0)
- [x] Both i18n files parse as valid JSON
- [x] All 8 Vitest assertions pass
