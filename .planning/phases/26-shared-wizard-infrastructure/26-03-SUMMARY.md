---
phase: 26-shared-wizard-infrastructure
plan: 03
subsystem: frontend/wizard-components
tags: [wizard, shell, basic-info, classification, i18n, rtl]
dependency_graph:
  requires: [26-01, 26-02]
  provides: [CreateWizardShell, SharedBasicInfoStep]
  affects: [type-specific-wizards-27-30]
tech_stack:
  added: []
  patterns: [FormProvider-wrapper, collapsible-details-section, generic-form-components]
key_files:
  created:
    - frontend/src/components/dossier/wizard/CreateWizardShell.tsx
    - frontend/src/components/dossier/wizard/SharedBasicInfoStep.tsx
  modified:
    - frontend/src/i18n/en/form-wizard.json
    - frontend/src/i18n/ar/form-wizard.json
key_decisions:
  - Used FormProvider directly instead of double-wrapping with Form (Form=FormProvider)
  - Added dossierType prop to SharedBasicInfoStep for AIFieldAssist integration
  - AIFieldAssist onGenerate typed as GeneratedFields callback (matching actual component API)
metrics:
  duration: 287s
  completed: 2026-04-15
  tasks: 2/2
  files: 4
---

# Phase 26 Plan 03: Wizard Shell and SharedBasicInfoStep Summary

CreateWizardShell wraps FormWizard with FormProvider and draft indicator; SharedBasicInfoStep merges bilingual fields with collapsible classification section per INFRA-06.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create CreateWizardShell component | c275605a | CreateWizardShell.tsx |
| 2 | Create SharedBasicInfoStep + i18n keys | d5a2d1c5 | SharedBasicInfoStep.tsx, en/form-wizard.json, ar/form-wizard.json |

## Implementation Details

### CreateWizardShell (Task 1)
- Thin compositional wrapper around FormWizard per D-05
- Provides FormProvider context so nested step components can use useFormContext()
- Draft saved indicator with Save icon + fade-in animation at top
- Responsive container: max-w-2xl mx-auto with responsive padding
- Generic over FieldValues via CreateWizardReturn<T> props
- Does NOT duplicate step indicators, animations, or action bar (all delegated to FormWizard)
- actionBarMode="auto" (sticky on mobile, inline on desktop)
- allowStepNavigation=true (click completed steps)

### SharedBasicInfoStep (Task 2)
- Merges old BasicInfoStep + ClassificationStep into single step component
- Classification fields (status, sensitivity_level) in collapsible `<details>` section, collapsed by default
- Bilingual name fields (name_en, name_ar) with FieldLabelWithHelp and contextual help
- Bilingual description fields (description_en, description_ar) with RTL direction via useDirection()
- Abbreviation field with maxLength=20 and uppercase styling
- Tags field for comma-separated entry
- Duplicate warning conditional render
- AIFieldAssist integration with dossierType prop for type-aware AI generation
- All form field names cast as Path<T> for generic type safety
- All interactive elements have min-h-11 (44px touch targets)

### i18n Keys Added (9 new keys per language)
- classificationTitle, create_type, empty_heading, empty_body
- validation_error, submission_error, discard_draft, discard_confirm, draft_restored

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] AIFieldAssist props mismatch**
- **Found during:** Task 2
- **Issue:** Plan specified `onAIGenerate?: () => void` but AIFieldAssist requires `dossierType: DossierType` and `onGenerate: (fields: GeneratedFields) => void`
- **Fix:** Added `dossierType?: DossierType` and changed `onAIGenerate` to accept `GeneratedFields` parameter to match actual AIFieldAssist API
- **Files modified:** SharedBasicInfoStep.tsx

**2. [Rule 1 - Bug] Double FormProvider wrapping**
- **Found during:** Task 1
- **Issue:** Plan showed both `<FormProvider>` and `<Form>` wrapping, but Form=FormProvider in form.tsx, causing double context nesting
- **Fix:** Used only `<FormProvider>` (which is what Form re-exports), removed redundant Form import
- **Files modified:** CreateWizardShell.tsx

## Known Stubs

None -- all components are fully functional with real form field bindings.

## Self-Check: PASSED

- [x] CreateWizardShell.tsx exists and exports CreateWizardShell
- [x] SharedBasicInfoStep.tsx exists and exports SharedBasicInfoStep
- [x] SharedBasicInfoStep contains `<details` for classification
- [x] classificationTitle key in both en and ar form-wizard.json
- [x] Commit c275605a found (Task 1)
- [x] Commit d5a2d1c5 found (Task 2)
- [x] No text-right or physical direction classes in new files
- [x] TypeScript compiles clean (no errors from new files)
