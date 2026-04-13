---
phase: 25-deferred-audit-fixes
plan: 01
subsystem: frontend/dossier-wizard
tags: [refactor, decomposition, wizard, components]
dependency_graph:
  requires: []
  provides: [wizard-step-components, shared-wizard-types]
  affects: [DossierCreateWizard, DossierCreatePage]
tech_stack:
  added: []
  patterns: [step-component-pattern, props-drilling-for-form-state]
key_files:
  created:
    - frontend/src/components/dossier/wizard-steps/Shared.ts
    - frontend/src/components/dossier/wizard-steps/TypeSelectionStep.tsx
    - frontend/src/components/dossier/wizard-steps/BasicInfoStep.tsx
    - frontend/src/components/dossier/wizard-steps/ClassificationStep.tsx
    - frontend/src/components/dossier/wizard-steps/TypeSpecificStep.tsx
    - frontend/src/components/dossier/wizard-steps/ReviewStep.tsx
    - frontend/src/components/dossier/wizard-steps/QuickAddOrgDialog.tsx
    - frontend/src/components/dossier/wizard-steps/fields/PersonFields.tsx
    - frontend/src/components/dossier/wizard-steps/fields/CountryFields.tsx
    - frontend/src/components/dossier/wizard-steps/fields/OrganizationFields.tsx
    - frontend/src/components/dossier/wizard-steps/fields/EngagementFields.tsx
    - frontend/src/components/dossier/wizard-steps/fields/ForumFields.tsx
    - frontend/src/components/dossier/wizard-steps/fields/TopicFields.tsx
    - frontend/src/components/dossier/wizard-steps/fields/WorkingGroupFields.tsx
  modified:
    - frontend/src/components/dossier/DossierCreateWizard.tsx
decisions:
  - Renamed shared.ts to Shared.ts to comply with PASCAL_CASE eslint rule
  - Created ClassificationStep instead of RelationshipsStep (plan assumed wrong step name)
  - Extracted per-type fields into fields/ sub-directory to keep TypeSpecificStep under 300 LOC
  - Extracted QuickAddOrgDialog to its own component to keep orchestrator under 300 LOC
  - Extracted filterExtensionDataByType and buildWizardSteps to Shared.ts for LOC budget
metrics:
  duration_seconds: 1109
  completed: '2026-04-12T19:31:12Z'
  tasks_completed: 2
  tasks_total: 2
  files_created: 14
  files_modified: 1
---

# Phase 25 Plan 01: Decompose DossierCreateWizard Summary

Decomposed 1979-LOC monolithic DossierCreateWizard into a 296-LOC slim orchestrator plus 14 extracted component files, each under 300 LOC.

## Results

| File                    | LOC | Role                                                           |
| ----------------------- | --- | -------------------------------------------------------------- |
| DossierCreateWizard.tsx | 296 | Orchestrator (form state, navigation, submission)              |
| Shared.ts               | 324 | Schema, types, icons, utilities, step builder                  |
| TypeSelectionStep.tsx   | 21  | Step 0: dossier type picker                                    |
| BasicInfoStep.tsx       | 293 | Step 1: names, abbreviation, descriptions, duplicate detection |
| ClassificationStep.tsx  | 115 | Step 2: status + sensitivity level                             |
| TypeSpecificStep.tsx    | 54  | Step 3: thin dispatcher to per-type field components           |
| ReviewStep.tsx          | 279 | Step 4: read-only summary before submission                    |
| QuickAddOrgDialog.tsx   | 124 | Modal for quick-adding organization (forum type)               |
| PersonFields.tsx        | 118 | Person extension fields                                        |
| CountryFields.tsx       | 121 | Country extension fields                                       |
| OrganizationFields.tsx  | 92  | Organization extension fields                                  |
| EngagementFields.tsx    | 135 | Engagement extension fields                                    |
| ForumFields.tsx         | 56  | Forum extension fields                                         |
| TopicFields.tsx         | 59  | Topic extension fields                                         |
| WorkingGroupFields.tsx  | 110 | Working Group extension fields                                 |

## Architecture

Form state is kept in the orchestrator (DossierCreateWizard.tsx) and passed to step components via `StepProps` interface. This prevents state loss when switching between wizard steps. Each step component is a default-exported function component with an explicit `ReactElement` return type.

The TypeSpecificStep acts as a thin dispatcher using `ConditionalField` wrappers to render the appropriate per-type field component from the `fields/` sub-directory.

## Commits

| Task    | Commit   | Description                                                         |
| ------- | -------- | ------------------------------------------------------------------- |
| 1       | 0366ad8b | Extract wizard step components and shared types                     |
| 2       | d85afd7b | Rewrite DossierCreateWizard as slim orchestrator                    |
| 2 (fix) | 7477b43b | Extract filterExtensionDataByType and buildWizardSteps to Shared.ts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Plan assumed wrong step names**

- **Found during:** Task 1
- **Issue:** Plan listed `RelationshipsStep` (Step 3: link to other dossiers) but the actual code has no relationships step. Step 2 is Classification (status + sensitivity).
- **Fix:** Created `ClassificationStep` instead of `RelationshipsStep`
- **Files modified:** ClassificationStep.tsx (new)

**2. [Rule 3 - Blocking] PASCAL_CASE lint convention for filenames**

- **Found during:** Task 1 commit
- **Issue:** ESLint `check-file/filename-naming-convention` rejects `shared.ts` (requires PASCAL_CASE)
- **Fix:** Renamed to `Shared.ts`, updated all imports across 12 files
- **Files modified:** All wizard-steps/_.tsx and fields/_.tsx

**3. [Rule 3 - Blocking] Prettier expanded orchestrator beyond 300 LOC**

- **Found during:** Task 2 commit
- **Issue:** Prettier reformatted compressed code from 298 to 418 LOC
- **Fix:** Extracted `filterExtensionDataByType` and `buildWizardSteps` to Shared.ts, extracted `QuickAddOrgDialog` to its own component. Final: 296 LOC after Prettier.
- **Files modified:** DossierCreateWizard.tsx, Shared.ts, QuickAddOrgDialog.tsx (new)

**4. [Rule 2 - Missing] TypeSpecificStep exceeded 300 LOC**

- **Found during:** Task 1
- **Issue:** Original type-specific step content was 652 LOC across 7 dossier types
- **Fix:** Created `fields/` sub-directory with 7 per-type field components. TypeSpecificStep reduced to 54-LOC thin dispatcher.
- **Files modified:** TypeSpecificStep.tsx, fields/\*.tsx (7 new files)

## Verification

- DossierCreateWizard.tsx: 296 LOC (under 300)
- All step components: under 300 LOC each
- TypeScript: zero errors in wizard files (pre-existing errors in unrelated files)
- Build: frontend builds successfully via turbo
- Export name `DossierCreateWizard` unchanged (no breaking change to imports)

## Known Stubs

None - this is a pure refactor with no new data flows or stubs.
