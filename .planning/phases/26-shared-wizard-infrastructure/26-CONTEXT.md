# Phase 26: Shared Wizard Infrastructure - Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Extract reusable building blocks from the existing monolithic `DossierCreateWizard` so any of the 8 type-specific wizards (Phases 27-30) can be composed from shared parts without duplicating logic. Deliverables: `useCreateDossierWizard<T>` hook, `CreateWizardShell` component, per-type Zod schemas, `getDefaultsForType()` factory, parameterized draft persistence, and old draft migration.

</domain>

<decisions>
## Implementation Decisions

### Hook Extraction Scope

- **D-01:** `useCreateDossierWizard<T>` is an all-in-one hook that owns: form state (react-hook-form), draft persistence, AI field assist, duplicate detection, and API submission. Type-specific wizards pass a config object and render steps — one hook call handles the rest.
- **D-02:** The hook exposes the react-hook-form `form` object directly (watch, setValue, trigger, etc.) alongside wizard-specific state. No abstraction layer over form access.

### Draft Storage Strategy

- **D-03:** Silent migration for INFRA-07 — old `dossier-create-draft` localStorage key is migrated to per-type keys automatically on first load. No toast or notification to the user.

### Claude's Discretion

- **D-04:** Draft storage mechanism (localStorage vs IndexedDB vs unified) — Claude evaluates tradeoffs during planning. The codebase has `useFormDraft` (localStorage) and `AutoSaveFormWrapper` (IndexedDB). INFRA-05 specifies localStorage key pattern. Choose the approach that best balances simplicity, reliability, and consistency with existing patterns.
- **D-05:** `CreateWizardShell` design approach — Claude evaluates whether thin config adapter, full replacement, or compositional wrapper best serves the app. FormWizard already handles step indicators, RTL, animations, bilingual labels. The Shell should add dossier-specific value without duplicating FormWizard capabilities.
- **D-06:** Contextual help panel deferred to Phase 31 (UX Polish). The Shell may include a hook point for help content but should not build the panel itself.

### Schema Composition

- **D-07:** Base + merge pattern for Zod schemas. A `baseDossierSchema` defines shared fields (name_en, name_ar, abbreviation, description, status, sensitivity). Each type extends via `.merge()`: `countrySchema = baseDossierSchema.merge(countryFields)`. Type-safe, each type validates only its own fields.
- **D-08:** Per-type schema files in a dedicated directory: `schemas/base.schema.ts`, `schemas/country.schema.ts`, `schemas/organization.schema.ts`, etc. Each file stays small and focused.
- **D-09:** `getDefaultsForType(type)` returns form field defaults only (status, sensitivity, type-specific field values). Step configuration and field metadata (required/optional, which steps to show) come from separate per-type config objects.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Wizard Implementation

- `frontend/src/components/dossier/DossierCreateWizard.tsx` — Current monolithic wizard to extract from
- `frontend/src/components/dossier/wizard-steps/Shared.ts` — Current dossierSchema, defaultValues, buildWizardSteps
- `frontend/src/components/dossier/wizard-steps/` — Step components: BasicInfoStep, ClassificationStep, TypeSelectionStep, TypeSpecificStep, ReviewStep

### Reusable UI Components

- `frontend/src/components/ui/form-wizard.tsx` — FormWizard stepper + useFormDraft hook (localStorage draft persistence)
- `frontend/src/components/forms/AutoSaveFormWrapper.tsx` — IndexedDB-based auto-save with progress tracking
- `frontend/src/components/ui/heroui-forms.tsx` — HeroUI form field wrappers
- `frontend/src/components/ui/form.tsx` — shadcn Form re-export

### Type System

- `frontend/src/types/progressive-form.types.ts` — FieldImportance, FieldStatus, ProgressiveFieldConfig types
- `frontend/src/types/form-auto-save.types.ts` — FormDraft types for auto-save

### Form Components

- `frontend/src/components/forms/FormFieldGroup.tsx` — Field grouping
- `frontend/src/components/forms/ProgressiveFormField.tsx` — Progressive disclosure fields
- `frontend/src/components/forms/FormCompletionProgress.tsx` — Completion progress indicator

### i18n

- `frontend/src/i18n/ar/form-wizard.json` — Arabic wizard translations
- `frontend/src/i18n/en/form-wizard.json` — English wizard translations

### Routes

- `frontend/src/routes/_protected/dossiers/create.tsx` — Current dossier creation route
- `frontend/src/routes/_protected/contacts/create.tsx` — Contacts creation route
- `frontend/src/routes/_protected/persons/create.tsx` — Persons creation route

### Requirements

- `.planning/REQUIREMENTS.md` §Shared Infrastructure — INFRA-01 through INFRA-07

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `FormWizard` component: Full-featured stepper with RTL, animations, step validation, draft indicators, bilingual labels, and sticky action bar mode
- `useFormDraft<T>` hook: localStorage-based draft with deep merge, meaningful content detection, and auto-cleanup
- `AutoSaveFormWrapper`: IndexedDB-based with debounce, TTL, progress tracking, and unsaved-changes blocking
- `useDirection()` hook: Centralized RTL detection
- `zodResolver` from `@/lib/form-resolver`: Custom resolver adapter
- `useCreateDossier` mutation hook: TanStack Query mutation for dossier creation API
- `useAIFieldAssist` hook: AI-generated field suggestions
- Rich form component library: FormFieldGroup, FormSelect, FormInput, FormTextarea, FormCheckbox, FormRadio (Aceternity variants)
- `ProgressiveFormField`: Progressive disclosure with field importance levels

### Established Patterns

- react-hook-form + zodResolver for form state and validation
- `FormProvider` wrapping form content
- `useDirection()` for RTL — never prop-drilled
- Step rendering via switch/case on currentStep index
- Draft key pattern: `dossier-create-{type}` (partially implemented with initialType)
- `getDossierDetailPath()` for post-creation navigation
- `buildWizardSteps()` generates step config from translations

### Integration Points

- Routes: `_protected/dossiers/create.tsx` currently renders DossierCreateWizard
- Navigation: `getDossierDetailPath()` for post-creation redirect
- API: `useCreateDossier` mutation + `createDossier` service function
- AI: `useAIFieldAssist` hook with `GeneratedFields` type
- i18n: `dossier`, `form-wizard`, `contextual-help` namespaces

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User trusts Claude's judgment on draft storage mechanism (D-04) and Shell design approach (D-05).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 26-shared-wizard-infrastructure_
_Context gathered: 2026-04-15_
