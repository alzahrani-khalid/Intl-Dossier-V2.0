---
phase: 27-country-wizard
plan: 01
subsystem: ui
tags: [react, wizard, i18n, tanstack-query, zod, country-dossier]

requires:
  - phase: 26-shared-wizard-infrastructure
    provides: WizardConfig types, base schema, defaults, FormWizardStep, SharedBasicInfoStep

provides:
  - countryWizardConfig with 3-step wizard definition
  - useCountryAutoFill hook for reference data lookup
  - CountryDetailsStep component with ISO/region/capital fields
  - EN/AR i18n keys for country wizard (steps, fields, regions)

affects: [27-02-country-wizard-route]

tech-stack:
  added: []
  patterns: [type-specific wizard config, auto-fill hook with empty-field guard]

key-files:
  created:
    - frontend/src/components/dossier/wizard/config/country.config.ts
    - frontend/src/components/dossier/wizard/hooks/useCountryAutoFill.ts
    - frontend/src/components/dossier/wizard/steps/CountryDetailsStep.tsx
    - frontend/src/components/dossier/wizard/hooks/__tests__/useCountryAutoFill.test.ts
    - frontend/src/components/dossier/wizard/steps/__tests__/CountryDetailsStep.test.tsx
  modified:
    - frontend/src/i18n/en/form-wizard.json
    - frontend/src/i18n/ar/form-wizard.json

key-decisions:
  - "Used STALE_TIME.NORMAL (5 min) for country reference queries since reference data changes infrequently"
  - "Auto-fill returns undefined instead of null to align with TanStack Query's undefined data convention"
  - "Region values stored as lowercase keys (asia, africa, etc.) with i18n display labels"

patterns-established:
  - "Type-specific wizard config: import schema + defaults, define steps array, implement filterExtensionData"
  - "Auto-fill hook pattern: useQuery with enabled guard, useEffect that checks empty fields before setValue"
  - "Step component pattern: FormWizardStep wrapper, FormField for each field, useDirection for RTL"

requirements-completed: [CTRY-01, CTRY-02]

duration: 12min
completed: 2026-04-15
---

# Phase 27 Plan 01: Country Wizard Building Blocks Summary

**Country wizard config with 3-step definition, auto-fill hook querying reference data on name >= 3 chars, and CountryDetailsStep with ISO/region/capital fields plus bilingual i18n**

## Performance

- **Duration:** 12 min
- **Started:** 2026-04-15T19:45:22Z
- **Completed:** 2026-04-15T19:57:22Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Country wizard config wiring Phase 26 infrastructure (schema, defaults, 3 steps, filterExtensionData with ISO uppercase)
- Auto-fill hook that queries GET /api/countries?search= and fills only empty form fields
- CountryDetailsStep with ISO code inputs (maxLength, uppercase, font-mono), region dropdown (6 options), bilingual capital fields with RTL direction
- Complete EN/AR i18n keys for steps, fields, regions, and review labels

## Task Commits

Each task was committed atomically:

1. **Task 1: Country wizard config, auto-fill hook, and i18n keys** - `7943ad20` (feat)
2. **Task 2: CountryDetailsStep component with auto-fill integration** - `991d703b` (feat)

## Files Created/Modified
- `frontend/src/components/dossier/wizard/config/country.config.ts` - WizardConfig<CountryFormData> with 3 steps and filterExtensionData
- `frontend/src/components/dossier/wizard/hooks/useCountryAutoFill.ts` - Auto-fill hook with TanStack Query and empty-field guard
- `frontend/src/components/dossier/wizard/steps/CountryDetailsStep.tsx` - Country-specific form fields step component
- `frontend/src/components/dossier/wizard/hooks/__tests__/useCountryAutoFill.test.ts` - Test stub for auto-fill hook
- `frontend/src/components/dossier/wizard/steps/__tests__/CountryDetailsStep.test.tsx` - Test stub for step component
- `frontend/src/i18n/en/form-wizard.json` - Added steps, country, regions, review keys
- `frontend/src/i18n/ar/form-wizard.json` - Added Arabic equivalents

## Decisions Made
- Used STALE_TIME.NORMAL (5 min) for country reference queries -- REFERENCE tier doesn't exist in query-tiers.ts
- Auto-fill returns undefined instead of null to match TanStack Query's data typing convention
- Region values stored as lowercase keys with i18n display labels for consistency

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed optional ISO code fields in filterExtensionData**
- **Found during:** Task 1
- **Issue:** TypeScript strict mode flagged `data.iso_code_2.toUpperCase()` because schema defines iso_code_2/3 as optional
- **Fix:** Added null check `data.iso_code_2 != null &&` before accessing `.toUpperCase()`
- **Files modified:** frontend/src/components/dossier/wizard/config/country.config.ts
- **Committed in:** 7943ad20

**2. [Rule 1 - Bug] Changed fetchCountryReference return type from null to undefined**
- **Found during:** Task 1
- **Issue:** useQuery wraps return as `T | undefined`, causing type mismatch with `Promise<T | null>`
- **Fix:** Changed return type and value to `undefined` to align with TanStack Query convention
- **Files modified:** frontend/src/components/dossier/wizard/hooks/useCountryAutoFill.ts
- **Committed in:** 7943ad20

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes required for TypeScript strict mode compliance. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Self-Check: PASSED

All 5 created files verified present. Both task commits verified in git log.

## Next Phase Readiness
- All building blocks ready for Plan 02 to compose into a full wizard route
- countryWizardConfig, useCountryAutoFill, and CountryDetailsStep are exported and ready to import
- i18n keys complete for both languages

---
*Phase: 27-country-wizard*
*Completed: 2026-04-15*
