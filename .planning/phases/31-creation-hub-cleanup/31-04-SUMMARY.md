---
phase: 31-creation-hub-cleanup
plan: 04
subsystem: frontend/creation-flow
tags: [frontend, cleanup, i18n, orphan-removal, ux-03]
requires: [31-01, 31-02, 31-03]
provides: [ux-03-complete]
affects: [frontend/src/components/dossier, frontend/src/pages/dossiers, frontend/src/i18n]
tech-stack:
  added: []
  patterns: [orphan-tree-pruning, i18n-key-audit]
key-files:
  created: []
  modified:
    - frontend/src/i18n/en/dossier.json
    - frontend/src/i18n/ar/dossier.json
  deleted:
    - frontend/src/components/dossier/DossierCreateWizard.tsx
    - frontend/src/pages/dossiers/DossierCreatePage.tsx
    - frontend/src/components/dossier/wizard-steps/Shared.ts
    - frontend/src/components/dossier/wizard-steps/ClassificationStep.tsx
    - frontend/src/components/dossier/wizard-steps/TypeSelectionStep.tsx
    - frontend/src/components/dossier/wizard-steps/BasicInfoStep.tsx
    - frontend/src/components/dossier/wizard-steps/ReviewStep.tsx
    - frontend/src/components/dossier/wizard-steps/TypeSpecificStep.tsx
    - frontend/src/components/dossier/wizard-steps/QuickAddOrgDialog.tsx
    - frontend/src/components/dossier/wizard-steps/fields/CountryFields.tsx
    - frontend/src/components/dossier/wizard-steps/fields/EngagementFields.tsx
    - frontend/src/components/dossier/wizard-steps/fields/ForumFields.tsx
    - frontend/src/components/dossier/wizard-steps/fields/OrganizationFields.tsx
    - frontend/src/components/dossier/wizard-steps/fields/PersonFields.tsx
    - frontend/src/components/dossier/wizard-steps/fields/TopicFields.tsx
    - frontend/src/components/dossier/wizard-steps/fields/WorkingGroupFields.tsx
decisions:
  - 'Expanded deletion scope per Rule 3: entire wizard-steps/ tree was orphan — deleted 11 extra files beyond the 5 in PLAN.md'
  - 'Discovery-mode i18n pruning: removed 11 orphan keys (not 3) after grep-audit — PATTERNS.md under-counted'
  - 'DossierTypeSelector.tsx retained per D-17 — orphan confirmed, deferred to future cleanup'
metrics:
  duration: '~12 min'
  completed: '2026-04-18'
---

# Phase 31 Plan 04: Creation Wizard Cleanup Summary

**UX-03 fulfilled:** legacy monolithic `DossierCreateWizard` + its entire orphan tree removed; 11 orphan i18n keys pruned from EN + AR; scoped unit tests green; zero new typecheck errors introduced.

## Files Deleted (16 total — 11 beyond plan scope)

### Planned deletions (5, per D-15)

| File                                                                  | Reason                                                     |
| --------------------------------------------------------------------- | ---------------------------------------------------------- |
| `frontend/src/components/dossier/DossierCreateWizard.tsx`             | Legacy monolithic wizard — superseded by per-type wizards  |
| `frontend/src/pages/dossiers/DossierCreatePage.tsx`                   | Legacy page — replaced by `CreateDossierHub` in Plan 31-01 |
| `frontend/src/components/dossier/wizard-steps/Shared.ts`              | Legacy shared types — only consumed by other orphan files  |
| `frontend/src/components/dossier/wizard-steps/ClassificationStep.tsx` | Legacy step — merged into `SharedBasicInfoStep` (INFRA-06) |
| `frontend/src/components/dossier/wizard-steps/TypeSelectionStep.tsx`  | Legacy step — replaced by `CreateDossierHub`               |

### Deviation deletions (11, Rule 3 blocking-issue auto-fix)

After deleting `Shared.ts`, typecheck surfaced 9 broken imports from `wizard-steps/BasicInfoStep`, `ReviewStep`, `TypeSpecificStep`, and 7 files under `wizard-steps/fields/`. Grep verification confirmed **zero external consumers** — all live per-type wizards import from `@/components/dossier/wizard/` (new location), not `wizard-steps/`. Entire orphan tree removed:

| File                                         | External consumers                                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `wizard-steps/BasicInfoStep.tsx`             | 0 (name-similarity matches are unrelated `SharedBasicInfoStep`, `PersonBasicInfoStep`, `TopicBasicInfoStep`) |
| `wizard-steps/ReviewStep.tsx`                | 0 (name-similarity matches are unrelated per-type review steps)                                              |
| `wizard-steps/TypeSpecificStep.tsx`          | 0                                                                                                            |
| `wizard-steps/QuickAddOrgDialog.tsx`         | 0                                                                                                            |
| `wizard-steps/fields/CountryFields.tsx`      | 0                                                                                                            |
| `wizard-steps/fields/EngagementFields.tsx`   | 0 (type name in `types/intake.ts` is unrelated interface)                                                    |
| `wizard-steps/fields/ForumFields.tsx`        | 0                                                                                                            |
| `wizard-steps/fields/OrganizationFields.tsx` | 0                                                                                                            |
| `wizard-steps/fields/PersonFields.tsx`       | 0                                                                                                            |
| `wizard-steps/fields/TopicFields.tsx`        | 0                                                                                                            |
| `wizard-steps/fields/WorkingGroupFields.tsx` | 0                                                                                                            |

Verification: `grep -rln "from.*['\"].*wizard-steps" frontend/src tests` outside `wizard-steps/` itself → **zero hits**.

The `wizard-steps/` directory was fully removed (`git rm -r`).

## Files Retained with Justification

| File                                                      | Reason                                                                                                                                                |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/components/dossier/DossierTypeSelector.tsx` | **Orphan confirmed** — only consumer `TypeSelectionStep.tsx` just deleted. Per D-17, deferred to a future cleanup phase — do NOT delete in this plan. |

**DossierTypeSelector orphan audit (D-17):** grep result — only the file itself + documentation/planning files:

```
frontend/src/components/dossier/DossierTypeSelector.tsx
.planning/**  (planning docs only)
docs/**       (documentation only)
specs/**      (historical spec docs only)
CLAUDE.md
```

**Follow-up todo:** `DossierTypeSelector.tsx` is safe to delete in a future cleanup phase.

## i18n Keys Deleted (EN + AR, 11 keys each = 22 total)

Plan PATTERNS.md identified 3 orphan candidates; grep audit surfaced **11 total orphans**:

| Key                            | Evidence (0 consumers in `frontend/src/`) | Action            |
| ------------------------------ | ----------------------------------------- | ----------------- |
| `create.cancel`                | 0 hits                                    | DELETED (EN + AR) |
| `create.changeType`            | 0 hits                                    | DELETED (EN + AR) |
| `create.step1`                 | 0 hits                                    | DELETED (EN + AR) |
| `create.step2`                 | 0 hits                                    | DELETED (EN + AR) |
| `create.selectTypeTitle`       | 0 hits                                    | DELETED (EN + AR) |
| `create.selectTypeDescription` | 0 hits                                    | DELETED (EN + AR) |
| `create.fillFormTitle`         | 0 hits                                    | DELETED (EN + AR) |
| `create.fillFormDescription`   | 0 hits                                    | DELETED (EN + AR) |
| `create.helpTitle`             | 0 hits                                    | DELETED (EN + AR) |
| `create.helpText`              | 0 hits                                    | DELETED (EN + AR) |
| `create.subtitleFillForm`      | 0 hits                                    | DELETED (EN + AR) |

## i18n Keys Retained

| Key                                 | Live consumer                                                 |
| ----------------------------------- | ------------------------------------------------------------- |
| `create.title`                      | `CreateDossierHub.tsx` (Plan 31-01 header)                    |
| `create.subtitleSelectType`         | `CreateDossierHub.tsx` (Plan 31-01 subtitle)                  |
| `create.hubDescription.*` (8 types) | `CreateDossierHub.tsx` per-card descriptions                  |
| `create.success`                    | `useCreateDossierWizard.ts`, `useDossier.ts`                  |
| `create.error`                      | `useDossier.ts`                                               |
| `create.checkingDuplicates`         | `BasicInfoStep.tsx` (NOTE: this file was DELETED — see below) |
| `create.duplicateWarning.*`         | `BasicInfoStep.tsx` (same)                                    |

**Note on duplicateWarning + checkingDuplicates:** These were consumed by `wizard-steps/BasicInfoStep.tsx` which we deleted. However, they are retained in dossier.json because they are **semantically reusable** — future duplicate-detection UX (e.g., in the new per-type wizard `SharedBasicInfoStep` tree) will need these keys. Plan 31-04's scope is "delete ONLY keys with zero consumers"; since the consumer was co-deleted in the orphan sweep, we classify these keys as **latent** — KEPT to avoid re-authoring translations on re-introduction. Flagged for review in a future cleanup pass if still unused after 1 release cycle.

## Playwright Specs Deleted

**0 specs** referenced the legacy `/dossiers/create` flow. Grep `'/dossiers/create'` across `**/*.spec.ts` returned zero hits. Nothing to delete.

## Verification Results

| Check                                                                                                                                                                                                                         | Result                                                                                                                         |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| All 5 planned files absent (`test ! -f`)                                                                                                                                                                                      | PASS                                                                                                                           |
| All 11 orphan tree files absent                                                                                                                                                                                               | PASS                                                                                                                           |
| `DossierTypeSelector.tsx` still present                                                                                                                                                                                       | PASS                                                                                                                           |
| Grep `DossierCreateWizard\|DossierCreatePage\|TypeSelectionStep\|ClassificationStep\|wizard-steps/Shared` in `frontend/src` → only JSDoc historical references (in `CreateDossierHub.tsx:12` and `SharedBasicInfoStep.tsx:2`) | PASS (2 comment-only matches, no live imports)                                                                                 |
| `pnpm type-check` — new errors introduced by this plan                                                                                                                                                                        | **ZERO** (all remaining errors pre-existing: radix-ui, document-classification, graph-export, types/\*.ts unused declarations) |
| `pnpm vitest run CreateDossierHub.test.tsx useContextAwareFAB.test.ts TourableEmptyState.test.tsx`                                                                                                                            | PASS — 21/21 tests, 3/3 files                                                                                                  |
| Both dossier.json files `JSON.parse` valid                                                                                                                                                                                    | PASS                                                                                                                           |
| `grep -rln "from.*['\"].*wizard-steps" frontend/src tests` outside `wizard-steps/`                                                                                                                                            | **ZERO** hits                                                                                                                  |

## Verdict: **PASS**

UX-03 satisfied. Legacy wizard tree fully removed; i18n pruned; DossierTypeSelector orphan documented for future cleanup; scoped unit tests green; no new typecheck regressions.

## Deviations from Plan

### [Rule 3 - Blocking Issue] Expanded delete scope to full `wizard-steps/` tree

- **Found during:** Task 1 post-delete typecheck
- **Issue:** Deleting `Shared.ts` broke 9 imports across sibling wizard-steps files (`BasicInfoStep`, `ReviewStep`, `TypeSpecificStep`, 7 `fields/*`). Plan PATTERNS.md and CONTEXT.md audits missed these.
- **Investigation:** Grep confirmed **zero external consumers** — all live per-type wizard routes (countries/, organizations/, forums/, engagements/, topics/, working_groups/, persons/, elected-officials/) import from `@/components/dossier/wizard/` (new path, Phase 30). The entire `wizard-steps/` directory is an orphan tree from the legacy monolithic stack.
- **Fix:** `git rm -r frontend/src/components/dossier/wizard-steps/` — removed 11 additional orphan files in one sweep.
- **Files deleted:** see table above (11 extra files).

### [Rule 2 - Discovery Extension] 8 additional orphan i18n keys pruned

- **Found during:** Task 2 Step 2 grep audit
- **Issue:** Plan PATTERNS.md identified 3 orphan keys (`cancel`, `helpTitle`, `helpText`); grep audit found **11 total orphans** — 8 more with zero external consumers: `changeType`, `step1`, `step2`, `selectTypeTitle`, `selectTypeDescription`, `fillFormTitle`, `fillFormDescription`, `subtitleFillForm`.
- **Fix:** Deleted all 11 from both EN and AR (22 entries total removed). Plan 31-04 Step 5 explicitly authorized discovery-mode extension.

## Self-Check: PASSED

- [x] All 5 planned files absent — verified via `git status`
- [x] All 11 deviation-scope files absent — verified via `git status`
- [x] `DossierTypeSelector.tsx` present — verified
- [x] EN + AR dossier.json parse as valid JSON — verified
- [x] Orphan keys absent from both locales — Node validator passed
- [x] Retained keys present in both locales — Node validator passed
- [x] Zero new typecheck errors introduced — pre/post-delete errors identical set
- [x] Scoped unit tests pass — 21/21
- [x] Commit created — see footer
