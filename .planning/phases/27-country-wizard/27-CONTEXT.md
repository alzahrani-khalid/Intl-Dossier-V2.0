# Phase 27: Country Wizard - Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the first type-specific wizard: a dedicated 3-step Country Wizard (Basic Info → Country Details → Review) accessible directly from the Countries list page at `/dossiers/countries/`. This phase validates the compositional pattern (shared hook + shell + type-specific steps) end-to-end and sets the Review step pattern for all future wizards.

</domain>

<decisions>
## Implementation Decisions

### Country Details Step Layout

- **D-01:** Claude's discretion on layout. Recommendation: two-column grid matching SharedBasicInfoStep's bilingual field pattern (ISO codes side by side, capital en/ar side by side, region below). Must be mobile-first — stack to single column on small screens.

### ISO Code & Reference Data Auto-Fill

- **D-02:** When the user enters the country name in Basic Info, look up the existing `countries` reference table (populated by `populate-countries-v2` Edge Function from REST Countries API). Auto-suggest/auto-fill ISO codes (alpha-2, alpha-3), region, and capital from the matching reference record. User can still override any auto-filled value.
- **D-03:** The `country-codes.ts` utility maps country names (en/ar) → ISO alpha-2 codes. The DB `countries` table has richer data (code, code3, region, capital, flags). Use the DB as the primary reference source for auto-fill; `country-codes.ts` can serve as a fallback for client-side quick matching.

### Region Field

- **D-04:** Region field should be a dropdown of predefined regions (sourced from the reference data), not free text. This ensures data consistency across country dossiers. If the reference data provides the region, it should be pre-selected. The region values come from the REST Countries API standard regions (e.g., asia, africa, europe, americas, oceania) — use bilingual labels.

### Review Step Design

- **D-05:** Grouped summary cards pattern — each wizard step becomes a card section (Basic Info card, Country Details card) with read-only display and an "Edit" button per section that navigates back to that step. This is the first Review step and sets the reusable pattern for all 7 future wizards (Phases 28-31).
- **D-06:** Claude's discretion on whether to build a generic `WizardReviewStep` component (takes sections config) or a `CountryReviewStep` first, extracting the generic pattern when repetition appears in Phase 28.

### Entry Point & Routing

- **D-07:** New route at `/dossiers/countries/create` — a dedicated page for the country wizard. The "Create Country" button on the Countries list page (`/dossiers/countries/`) will point directly here instead of the old `/dossiers/create`.
- **D-08:** The old `/dossiers/create` monolithic wizard route remains untouched until Phase 31 (Creation Hub and Cleanup). Both routes coexist during the transition.

### Claude's Discretion

- **D-09:** Country wizard config structure — how to organize the `WizardConfig<CountryFormData>` object (step definitions, filterExtensionData mapping, defaults). Follow Phase 26 infrastructure patterns.
- **D-10:** Whether to add country-specific i18n keys to the existing `dossier` namespace or create a new `country-wizard` namespace. Evaluate based on key count and reusability.
- **D-11:** Flag display in the wizard — whether to show the country flag (available from reference data as SVG/PNG) in the Review step or Country Details step. Nice touch but optional.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 26 Infrastructure (Direct Dependency)

- `frontend/src/components/dossier/wizard/hooks/useCreateDossierWizard.ts` — All-in-one hook to compose with
- `frontend/src/components/dossier/wizard/CreateWizardShell.tsx` — Shell component wrapping FormWizard
- `frontend/src/components/dossier/wizard/SharedBasicInfoStep.tsx` — Shared Basic Info step (bilingual names, classification)
- `frontend/src/components/dossier/wizard/config/types.ts` — WizardConfig<T>, WizardStepConfig, CreateWizardReturn<T>
- `frontend/src/components/dossier/wizard/schemas/country.schema.ts` — CountryFormData Zod schema
- `frontend/src/components/dossier/wizard/schemas/base.schema.ts` — Base dossier schema
- `frontend/src/components/dossier/wizard/defaults/index.ts` — getDefaultsForType factory

### Country Reference Data

- `supabase/functions/populate-countries-v2/index.ts` — Edge Function fetching from REST Countries API (cca2, cca3, region, subregion, capital, flags, Arabic translations)
- `frontend/src/lib/country-codes.ts` — Client-side country name → ISO code mapping (fallback)
- `supabase/migrations/20250107011_seed_countries.sql` — Seed data with code, code3, region columns

### Countries List Page (Integration Point)

- `frontend/src/routes/_protected/dossiers/countries/index.tsx` — List page where "Create Country" button lives (currently links to `/dossiers/create`)

### Existing Wizard & Form Components

- `frontend/src/components/ui/form-wizard.tsx` — FormWizard stepper + useFormDraft
- `frontend/src/components/ui/form.tsx` — shadcn Form re-export
- `frontend/src/components/forms/ContextualHelp.tsx` — FieldLabelWithHelp component

### i18n

- `frontend/src/i18n/ar/form-wizard.json` — Arabic wizard translations
- `frontend/src/i18n/en/form-wizard.json` — English wizard translations

### Requirements

- `.planning/REQUIREMENTS.md` §Country Wizard — CTRY-01, CTRY-02, CTRY-03

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `useCreateDossierWizard<T>` hook: Complete with draft persistence, AI assist, duplicate detection, submission — just pass `WizardConfig<CountryFormData>`
- `CreateWizardShell`: Wraps FormWizard with draft indicator — render step components as children
- `SharedBasicInfoStep`: Handles bilingual names, abbreviation, description, tags, classification (collapsible)
- `countrySchema`: Zod schema extending base with iso_code_2, iso_code_3, capital_en, capital_ar, region
- `country-codes.ts`: 50+ country name→ISO mappings (en + ar)
- `countries` DB table: Full reference data (code, code3, name_en, name_ar, region, flags) populated from REST Countries API

### Established Patterns

- `WizardConfig<T>` requires: type, schema, defaultValues, steps[], filterExtensionData, onSuccess
- Steps rendered as children of `CreateWizardShell` — each wrapped in `<FormWizardStep stepId="...">`
- react-hook-form + zodResolver for validation
- `useDirection()` for RTL — never prop-drilled
- `getDossierDetailPath()` for post-creation navigation
- Countries list already has debounced search, pagination, mobile card view, desktop table view

### Integration Points

- Route: New `/dossiers/countries/create` under `_protected/dossiers/countries/`
- Button: Update "Create" link on countries list from `/dossiers/create` to `/dossiers/countries/create`
- API: `useCreateDossier` mutation (already in hook) + country reference data query for auto-fill
- Navigation: Post-creation redirect to country detail via `getDossierDetailPath(id, 'country')`
- i18n: `dossier`, `form-wizard`, `contextual-help` namespaces

</code_context>

<specifics>
## Specific Ideas

- ISO codes and region should auto-fill from the existing `countries` reference table when the user enters a country name — this was explicitly requested for data integrity
- The `populate-countries-v2` Edge Function already provides rich data (cca2, cca3, region, capital, flags, Arabic translations) from the REST Countries API — leverage this
- Review step uses grouped summary cards with per-section Edit buttons — this pattern will be reused by all future wizards

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 27-country-wizard_
_Context gathered: 2026-04-15_
