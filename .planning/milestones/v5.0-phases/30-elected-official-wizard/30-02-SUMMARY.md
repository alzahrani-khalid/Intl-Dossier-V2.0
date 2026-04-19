---
phase: 30-elected-official-wizard
plan: 02
subsystem: frontend/wizard
tags: [v5.0, wizard, step-component, i18n, rtl, dossier-picker, elected-official]
dependency_graph:
  requires: [30-01]
  provides: [OfficeTermStep component, elected_official i18n namespace]
  affects: [30-03, 30-04]
tech_stack:
  added: []
  patterns: [bilingual-grid, DossierPicker-single-select, FormWizardStep wrapper, useDirection RTL]
key_files:
  created:
    - frontend/src/components/dossier/wizard/steps/OfficeTermStep.tsx
  modified:
    - frontend/src/i18n/en/form-wizard.json
    - frontend/src/i18n/ar/form-wizard.json
decisions:
  - Mirrored PersonDetailsStep bilingual grid pattern (EN first in JSX per RTL rule 1)
  - Used DossierPicker with filterByDossierType prop as established in Phase 29 (no new variant)
  - Arabic inputs carry dir={direction} from useDirection(); no textAlign:right anywhere
  - is_current_term omitted from UI per D-05; auto-derived at submit
  - stepId="office-term" matches wizard config step.id expected by Plan 30-03
metrics:
  duration: 15m
  completed: 2026-04-17
  tasks_completed: 2
  files_changed: 3
---

# Phase 30 Plan 02: Office Term Step — Summary

**One-liner:** `OfficeTermStep.tsx` with 4 sections (Office/Constituency/Party/Term), 2 DossierPickers (country required, org optional), 6 bilingual text inputs, 2 date inputs, and 30+ i18n keys added to both EN and AR form-wizard.json.

## Tasks Completed

| Task | Name                                    | Commit   | Files                                                                            |
| ---- | --------------------------------------- | -------- | -------------------------------------------------------------------------------- |
| 1    | Add i18n keys to en/ar form-wizard.json | 5fe1e482 | `frontend/src/i18n/en/form-wizard.json`, `frontend/src/i18n/ar/form-wizard.json` |
| 2    | Create OfficeTermStep.tsx component     | 8c5eca77 | `frontend/src/components/dossier/wizard/steps/OfficeTermStep.tsx`                |

## Component Structure

**File:** `frontend/src/components/dossier/wizard/steps/OfficeTermStep.tsx`
**LOC:** 293 lines
**Export:** `export function OfficeTermStep({ form }: OfficeTermStepProps): ReactElement`

**Section structure:**

1. **Office** — `office_name_en` + `office_name_ar` bilingual grid + `country_id` DossierPicker (required) + `organization_id` DossierPicker (optional)
2. **Constituency** — `district_en` + `district_ar` bilingual grid (both optional)
3. **Party** — `party_en` + `party_ar` bilingual grid (both optional)
4. **Term** — `term_start` (date, required) + `term_end` (date, optional)

**DossierPicker prop signatures (canonical Phase 29 form):**

```tsx
// Country (required)
<DossierPicker
  value={field.value ?? ''}
  onChange={(id): void => field.onChange(id ?? '')}
  filterByDossierType="country"
  placeholder={t('form-wizard:elected_official.country_ph')}
/>

// Organization (optional)
<DossierPicker
  value={field.value ?? ''}
  onChange={(id): void => field.onChange(id ?? '')}
  filterByDossierType="organization"
  placeholder={t('form-wizard:elected_official.organization_ph')}
/>
```

## i18n Keys Added

**EN file:** 84 insertions — `steps.officeTerm`, `steps.officeTermDesc`, `review.office_term`, full `elected_official` namespace
**AR file:** 84 insertions — same structure with Arabic translations

Keys added under `elected_official.*`:

- `page_title`, `back_to_list`
- `sections.{office,constituency,party,term}`
- `office_name_en`, `office_name_ar`, `office_name_en_ph`, `office_name_ar_ph`
- `country`, `country_ph`, `country_help`
- `organization`, `organization_ph`, `organization_help`
- `district_en`, `district_ar`, `district_en_ph`, `district_ar_ph`
- `party_en`, `party_ar`, `party_en_ph`, `party_ar_ph`
- `term_start`, `term_end`, `term_end_help`
- `validation.{office_name_required,country_required,term_start_required,term_end_after_start}`

## RTL Compliance Audit

Grep scan results on `OfficeTermStep.tsx`:

- `ml-*`, `mr-*`, `pl-*`, `pr-*`, `text-left`, `text-right`: **0 matches** (PASS)
- `textAlign.*right`: **0 matches** (PASS)
- Arabic inputs with `dir={direction}`: `office_name_ar`, `district_ar`, `party_ar` — **3 of 3** (PASS)
- EN fields first in JSX for each bilingual grid: **4 grids** all correct (PASS)
- `.reverse()` calls: **0** (PASS)
- Logical properties used: `ms-1`, `text-start` — correct throughout

## Verification Results

- Both i18n files parse as valid JSON: PASS
- `grep -q '"officeTerm"'` EN + AR: PASS
- `grep -q '"elected_official"'` EN + AR: PASS
- `grep -q '"office_term"'` EN review namespace: PASS
- All 10 FormField names present: PASS
- 4 bilingual grids (`grid grid-cols-1 sm:grid-cols-2 gap-4`): PASS
- 2 DossierPicker instances: PASS (country + organization)
- 2 `type="date"` inputs: PASS
- `stepId="office-term"`: PASS
- Lint (eslint): 0 errors, 0 warnings
- TypeCheck: No errors in OfficeTermStep.tsx (pre-existing errors in other files are unrelated)
- LOC 293: within 150–320 range (PASS)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — component wires to real form data via `form.control` passed in from the wizard shell. No hardcoded empty values flow to UI rendering. DossierPicker renders real data from the API.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. This plan is purely UI + i18n.

## Self-Check: PASSED

- `frontend/src/components/dossier/wizard/steps/OfficeTermStep.tsx` — FOUND
- `frontend/src/i18n/en/form-wizard.json` (with elected_official namespace) — FOUND
- `frontend/src/i18n/ar/form-wizard.json` (with elected_official namespace) — FOUND
- Commit `5fe1e482` (i18n) — FOUND
- Commit `8c5eca77` (OfficeTermStep) — FOUND
