# Phase 28: Simple Type Wizards - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can create Organization, Topic, and Person dossiers through type-specific wizards launched from their respective list pages. All three reuse the shared wizard infrastructure (Phase 26) and follow the country wizard pattern (Phase 27) without code duplication.

</domain>

<decisions>
## Implementation Decisions

### Type-Specific Fields

- **D-01:** Organization Org Details step collects 5 fields: type, code, website, headquarters location, and founding date — all on one step.
- **D-02:** Person title field is free-text input (not dropdown) — diplomatic titles are too varied for a fixed list.
- **D-03:** Person photo upload uses a simple file picker with thumbnail preview — no cropping in the wizard.
- **D-04:** Person biography is a text area on the Person Details step alongside title and photo.

### Reference Data & Auto-Fill

- **D-05:** No auto-fill for Organization — users enter all fields manually. Organizations are too diverse for a reference table.
- **D-06:** No auto-fill for Topic or Person — these are unique entries with no natural reference tables.

### Step Structure

- **D-07:** Organization: 3 steps — SharedBasicInfo → Org Details (5 fields) → Review
- **D-08:** Topic: 2 steps — SharedBasicInfo (with theme category inline) → Review. Topic is genuinely simpler; no padding with a 3rd step.
- **D-09:** Person: 3 steps — SharedBasicInfo → Person Details (title/photo/biography) → Review

### List Page Integration

- **D-10:** All three list pages use the same Create button pattern as the Countries list — consistent placement, icon, and behavior.
- **D-11:** Post-creation navigates to the new dossier's detail page using `getDossierDetailPath()` — same as country wizard.

### Claude's Discretion

- **Topic theme category:** Claude to decide input type. Recommendation: single-select dropdown from predefined categories (Security, Trade, Human Rights, Climate, etc.) — keeps the 2-step flow clean and enables filtering.
- **Topic/Person auto-fill:** Confirmed skip — no reference data lookup needed.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Wizard Infrastructure (Phase 26)

- `.planning/phases/26-shared-wizard-infrastructure/26-CONTEXT.md` — Base schema, defaults pattern, per-type config architecture
- `frontend/src/components/dossier/wizard/hooks/useCreateDossierWizard.ts` — Generic wizard hook (composing drafts, form state, submission, AI assist, duplicate detection)
- `frontend/src/components/dossier/wizard/CreateWizardShell.tsx` — Shell component wrapping FormWizard with draft indicator
- `frontend/src/components/dossier/wizard/steps/SharedBasicInfoStep.tsx` — Reusable BasicInfo step (bilingual names, abbreviation, description, tags, classification)

### Country Wizard Template (Phase 27)

- `.planning/phases/27-country-wizard/27-CONTEXT.md` — Review step grouped summary cards pattern, auto-fill pattern
- `frontend/src/components/dossier/wizard/config/country.config.ts` — Config pattern to replicate for each type
- `frontend/src/components/dossier/wizard/schemas/country.schema.ts` — Schema extension pattern via `.merge()`
- `frontend/src/components/dossier/wizard/review/CountryReviewStep.tsx` — Review step pattern with per-section Edit buttons

### Existing Schemas (already created in Phase 26)

- `frontend/src/components/dossier/wizard/schemas/organization.schema.ts` — Organization schema to extend
- `frontend/src/components/dossier/wizard/schemas/person.schema.ts` — Person schema to extend
- `frontend/src/components/dossier/wizard/schemas/topic.schema.ts` — Topic schema to extend
- `frontend/src/components/dossier/wizard/schemas/base.schema.ts` — Base schema with shared fields

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `CreateWizardShell`: Wraps FormWizard — use for all three wizards
- `useCreateDossierWizard<T>`: Generic hook — instantiate with per-type config
- `SharedBasicInfoStep`: Reuse directly as first step for all three
- `FormWizard` / `FormWizardStep`: Stepper with RTL, animations, validation, bilingual labels
- `useFormDraft<T>`: localStorage draft persistence — works with any form data type
- `useCreateDossier`: TanStack Query mutation for dossier creation API
- `getDossierDetailPath()`: Post-creation navigation utility

### Established Patterns

- **Config-driven wizards:** Each type gets a `{type}WizardConfig` with schema, defaults, steps, and `filterExtensionData`
- **react-hook-form + zodResolver:** Form state management and validation
- **i18n bilingual labels:** All step titles/descriptions use i18n keys
- **Draft persistence:** `dossier-create-{type}` localStorage key pattern
- **Review step:** Grouped summary cards with per-section "Edit" buttons (Phase 27 D-05)

### Integration Points

- **List pages:** Add Create button to Organizations, Topics, and Persons list pages
- **Routes:** Add wizard routes (e.g., `/organizations/create`, `/topics/create`, `/persons/create`)
- **Config directory:** Add `organization.config.ts`, `topic.config.ts`, `person.config.ts`
- **Steps directory:** Add `OrgDetailsStep.tsx`, `PersonDetailsStep.tsx` (Topic has no extra step)
- **Review directory:** Add `OrganizationReviewStep.tsx`, `TopicReviewStep.tsx`, `PersonReviewStep.tsx`
- **Schemas:** Extend existing schema files with wizard-specific validation

</code_context>

<specifics>
## Specific Ideas

- Organization gets headquarters + founding date beyond the original spec — user wants richer org profiles at creation time
- Person photo is wizard-scope (simple picker) — advanced cropping/editing deferred to detail page
- Topic stays lean at 2 steps — don't pad it artificially for consistency

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 28-simple-type-wizards_
_Context gathered: 2026-04-16_
