# Phase 26: Shared Wizard Infrastructure - Research

**Researched:** 2026-04-15
**Domain:** React form wizard extraction / composable hook architecture
**Confidence:** HIGH

## Summary

Phase 26 extracts reusable building blocks from the existing monolithic `DossierCreateWizard` (297 lines) so the 8 type-specific wizards in Phases 27-31 can be composed from shared parts. The existing codebase already contains all the primitives needed: `FormWizard` (stepper + animations + RTL), `useFormDraft` (localStorage persistence), `useCreateDossier` (TanStack mutation), `useAIFieldAssist` (AI field generation), and per-type field components in `wizard-steps/fields/`. The monolithic `Shared.ts` contains a single flat Zod schema with all type-specific fields in one `extension_data` object and a single `defaultValues` constant.

The primary work is decomposition, not creation. The hook `useCreateDossierWizard<T>` encapsulates form state (react-hook-form), draft persistence (reusing `useFormDraft`), AI assist, duplicate detection, and submission. The `CreateWizardShell` wraps the existing `FormWizard` with dossier-specific orchestration (draft indicators, type-aware labels). Per-type Zod schemas split the monolithic schema into `baseDossierSchema` + per-type extensions via `.merge()`. The `getDefaultsForType()` factory replaces the flat `defaultValues`. Draft migration (INFRA-07) is a one-time silent migration from `dossier-create-draft` to `dossier-create-{type}` keys.

**Primary recommendation:** Use localStorage via the existing `useFormDraft` hook for draft persistence (D-04) and build `CreateWizardShell` as a thin compositional wrapper around `FormWizard` (D-05) that adds dossier-specific config without duplicating stepper logic.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** `useCreateDossierWizard<T>` is an all-in-one hook that owns: form state (react-hook-form), draft persistence, AI field assist, duplicate detection, and API submission. Type-specific wizards pass a config object and render steps -- one hook call handles the rest.
- **D-02:** The hook exposes the react-hook-form `form` object directly (watch, setValue, trigger, etc.) alongside wizard-specific state. No abstraction layer over form access.
- **D-03:** Silent migration for INFRA-07 -- old `dossier-create-draft` localStorage key is migrated to per-type keys automatically on first load. No toast or notification to the user.
- **D-07:** Base + merge pattern for Zod schemas. A `baseDossierSchema` defines shared fields (name_en, name_ar, abbreviation, description, status, sensitivity). Each type extends via `.merge()`: `countrySchema = baseDossierSchema.merge(countryFields)`. Type-safe, each type validates only its own fields.
- **D-08:** Per-type schema files in a dedicated directory: `schemas/base.schema.ts`, `schemas/country.schema.ts`, `schemas/organization.schema.ts`, etc. Each file stays small and focused.
- **D-09:** `getDefaultsForType(type)` returns form field defaults only (status, sensitivity, type-specific field values). Step configuration and field metadata come from separate per-type config objects.

### Claude's Discretion

- **D-04:** Draft storage mechanism (localStorage vs IndexedDB vs unified) -- Claude evaluates tradeoffs.
- **D-05:** `CreateWizardShell` design approach -- thin config adapter, full replacement, or compositional wrapper.
- **D-06:** Contextual help panel deferred to Phase 31. The Shell may include a hook point for help content but should not build the panel itself.

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID       | Description                                                                            | Research Support                                                                                     |
| -------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| INFRA-01 | Shared `useCreateDossierWizard<T>` hook extracted from existing wizard                 | Decomposition of DossierCreateWizard.tsx; reuse useFormDraft, useCreateDossier, useAIFieldAssist     |
| INFRA-02 | `CreateWizardShell` component wrapping FormWizard with progress, navigation, bilingual | Thin wrapper over FormWizard; adds dossier-specific draft indicator, type-aware labels               |
| INFRA-03 | Per-type Zod schemas extending shared base schema                                      | Split monolithic dossierSchema into baseDossierSchema + per-type .merge() extensions                 |
| INFRA-04 | `getDefaultsForType(type)` factory returning smart defaults                            | Replace flat defaultValues with per-type factory using base defaults + type-specific spread          |
| INFRA-05 | Draft persistence parameterized per type (`dossier-create-{type}` keys)                | useFormDraft already supports dynamic keys; hook passes `dossier-create-${config.type}`              |
| INFRA-06 | Classification fields merged into BasicInfoStep as collapsible section                 | Move status/sensitivity from ClassificationStep into BasicInfoStep with details/summary or Accordion |
| INFRA-07 | Draft migration from old format to per-type keys                                       | Silent migration on mount: parse old key, detect type, save to new key, delete old key               |

</phase_requirements>

## Architectural Responsibility Map

| Capability            | Primary Tier     | Secondary Tier   | Rationale                                          |
| --------------------- | ---------------- | ---------------- | -------------------------------------------------- |
| Form state management | Browser / Client | --               | react-hook-form runs entirely client-side          |
| Draft persistence     | Browser / Client | --               | localStorage is browser-only storage               |
| Schema validation     | Browser / Client | --               | Zod validates on client before submission          |
| AI field assist       | API / Backend    | Browser / Client | Backend generates fields, client consumes via hook |
| Duplicate detection   | API / Backend    | Browser / Client | Backend checks duplicates, client displays results |
| Dossier creation      | API / Backend    | --               | Edge Function handles insert + extension data      |
| Step navigation / UI  | Browser / Client | --               | FormWizard stepper is pure client-side             |

## Standard Stack

### Core

| Library                 | Version   | Purpose                  | Why Standard                                                            |
| ----------------------- | --------- | ------------------------ | ----------------------------------------------------------------------- |
| react-hook-form         | 7.72.0    | Form state management    | Already installed, project standard [VERIFIED: frontend/node_modules]   |
| zod                     | 4.3.6     | Schema validation        | Already installed, project standard [VERIFIED: frontend/node_modules]   |
| @hookform/resolvers     | 5.2.2     | Zod-to-RHF bridge        | Already installed via form-resolver.ts adapter [VERIFIED: npm registry] |
| @tanstack/react-query   | v5        | Server state (mutations) | Already used by useCreateDossier [VERIFIED: codebase]                   |
| framer-motion           | installed | Step animations          | Already used by FormWizard [VERIFIED: codebase]                         |
| sonner                  | installed | Toast notifications      | Already used for draft/success/error toasts [VERIFIED: codebase]        |
| i18next / react-i18next | installed | Bilingual labels         | Already used throughout wizard [VERIFIED: codebase]                     |

### Supporting

| Library                  | Version   | Purpose                          | When to Use                                    |
| ------------------------ | --------- | -------------------------------- | ---------------------------------------------- |
| lucide-react             | installed | Icons (step indicators, buttons) | All wizard UI icons [VERIFIED: codebase]       |
| class-variance-authority | installed | Variant management for Shell     | Button/container variants [VERIFIED: codebase] |

### Alternatives Considered

| Instead of                  | Could Use                       | Tradeoff                                                                                                                                                                                                                             |
| --------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| localStorage (useFormDraft) | IndexedDB (AutoSaveFormWrapper) | IndexedDB adds async complexity, TTL management, and idb-keyval dependency; localStorage is synchronous, simpler, and already proven in current wizard. For draft persistence of < 50KB form data, localStorage is the right choice. |
| Compositional Shell wrapper | Full Shell replacement          | Full replacement would duplicate FormWizard's stepper/animation/RTL logic; wrapper adds only dossier-specific concerns on top                                                                                                        |

**No new packages needed.** All dependencies are already installed.

## Architecture Patterns

### System Architecture Diagram

```
Type-Specific Wizard (e.g., CountryCreateWizard)
    |
    |-- config: { type, schema, defaults, steps[] }
    |
    v
useCreateDossierWizard<T>(config)
    |
    |-- form: useForm<T>({ resolver: zodResolver(config.schema), defaultValues })
    |-- draft: useFormDraft<T>(`dossier-create-${config.type}`, defaults)
    |-- mutation: useCreateDossier()
    |-- ai: useAIFieldAssist()
    |-- migration: migrateLegacyDraft() [one-time, silent]
    |
    v
CreateWizardShell
    |
    |-- wraps FormWizard with dossier-specific props
    |-- passes steps[], handlers, draft state
    |-- renders children (step content from type-specific wizard)
    |
    v
FormWizard (existing, unchanged)
    |-- StepIndicator, Progress, AnimatePresence
    |-- Action bar (Next/Back/Save Draft/Create)
```

### Recommended Project Structure

```
frontend/src/components/dossier/wizard/
  hooks/
    useCreateDossierWizard.ts     # INFRA-01: All-in-one hook
    useDraftMigration.ts          # INFRA-07: Silent migration logic
  schemas/
    base.schema.ts                # INFRA-03: baseDossierSchema
    country.schema.ts             # Per-type schema (used by Phase 27)
    organization.schema.ts        # Per-type schema (used by Phase 28)
    topic.schema.ts               # Per-type schema (used by Phase 28)
    person.schema.ts              # Per-type schema (used by Phase 28)
    forum.schema.ts               # Per-type schema (used by Phase 29)
    working-group.schema.ts       # Per-type schema (used by Phase 29)
    engagement.schema.ts          # Per-type schema (used by Phase 29)
    elected-official.schema.ts    # Per-type schema (used by Phase 30)
  defaults/
    index.ts                      # INFRA-04: getDefaultsForType() factory
    base.defaults.ts              # Shared defaults
    country.defaults.ts           # Per-type defaults (Phase 27+)
  config/
    types.ts                      # WizardConfig<T> type definition
    steps.ts                      # Shared step builder utilities
  CreateWizardShell.tsx           # INFRA-02: Wrapper around FormWizard
  SharedBasicInfoStep.tsx         # INFRA-06: Shared BasicInfo with classification
```

### Pattern 1: Generic Hook with Config Object

**What:** `useCreateDossierWizard<T>` accepts a typed config and returns all wizard state
**When to use:** Every type-specific wizard calls this once
**Example:**

```typescript
// Source: Extracted from existing DossierCreateWizard.tsx pattern
interface WizardConfig<T extends FieldValues> {
  type: DossierType
  schema: ZodSchema<T>
  defaultValues: T
  steps: WizardStep[]
  filterExtensionData: (data: T) => DossierExtensionData | undefined
  onSuccess?: (dossierId: string, type: DossierType) => void
}

function useCreateDossierWizard<T extends FieldValues>(config: WizardConfig<T>) {
  const draftKey = `dossier-create-${config.type}`
  const { draft, saveDraft, clearDraft, hasDraft, isDraftSaving } = useFormDraft<T>(
    draftKey,
    config.defaultValues,
  )

  const form = useForm<T>({
    resolver: zodResolver(config.schema),
    defaultValues: draft as DefaultValues<T>,
    mode: 'onChange',
  })

  // ... draft migration, AI assist, submission logic

  return {
    form, // D-02: direct access to RHF form object
    currentStep,
    setCurrentStep,
    steps: config.steps,
    hasDraft,
    isDraftSaving,
    handleComplete,
    handleCancel,
    handleSaveDraft,
    handleAIGenerate,
    isSubmitting: mutation.isPending,
  }
}
```

### Pattern 2: Base + Merge Schema Composition

**What:** Per-type schemas extend a shared base via Zod `.merge()`
**When to use:** Every type-specific schema definition
**Example:**

```typescript
// Source: D-07 decision + existing dossierSchema structure [VERIFIED: codebase]
// schemas/base.schema.ts
export const baseDossierSchema = z.object({
  name_en: z.string().min(2),
  name_ar: z.string().min(2),
  abbreviation: z.string().max(20).optional().or(z.literal('')),
  description_en: z.string().optional(),
  description_ar: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived', 'deleted']).default('active'),
  sensitivity_level: z.number().min(1).max(4).default(1),
  tags: z.array(z.string()).optional(),
})

// schemas/country.schema.ts
const countryFields = z.object({
  iso_code_2: z.string().length(2).optional().or(z.literal('')),
  iso_code_3: z.string().length(3).optional().or(z.literal('')),
  capital_en: z.string().optional(),
  capital_ar: z.string().optional(),
  region: z.string().optional(),
})
export const countrySchema = baseDossierSchema.merge(countryFields)
export type CountryFormData = z.infer<typeof countrySchema>
```

### Pattern 3: Defaults Factory

**What:** `getDefaultsForType()` returns type-safe defaults per dossier type
**When to use:** Initializing form state in wizard config
**Example:**

```typescript
// Source: D-09 decision + existing defaultValues structure [VERIFIED: codebase]
const baseDefaults = {
  name_en: '',
  name_ar: '',
  abbreviation: '',
  description_en: '',
  description_ar: '',
  status: 'active' as const,
  sensitivity_level: 1,
  tags: [],
}

const countryDefaults = {
  ...baseDefaults,
  iso_code_2: '',
  iso_code_3: '',
  capital_en: '',
  capital_ar: '',
  region: '',
}

export function getDefaultsForType(type: DossierType) {
  const map: Record<DossierType, unknown> = {
    country: countryDefaults,
    organization: organizationDefaults,
    // ... etc
  }
  return map[type]
}
```

### Pattern 4: CreateWizardShell as Compositional Wrapper

**What:** Thin component wrapping FormWizard with dossier-specific concerns
**When to use:** Every type-specific wizard renders inside this Shell
**Example:**

```typescript
// Source: D-05 decision + existing FormWizard API [VERIFIED: codebase]
interface CreateWizardShellProps {
  wizard: ReturnType<typeof useCreateDossierWizard>
  children: React.ReactNode
  className?: string
}

export function CreateWizardShell({ wizard, children, className }: CreateWizardShellProps) {
  const { t } = useTranslation(['dossier', 'form-wizard'])
  return (
    <div className={cn('w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8', className)}>
      <FormProvider {...wizard.form}>
        <Form {...wizard.form}>
          <form onSubmit={(e) => e.preventDefault()}>
            <FormWizard
              steps={wizard.steps}
              currentStep={wizard.currentStep}
              onStepChange={wizard.setCurrentStep}
              onComplete={wizard.handleComplete}
              onCancel={wizard.handleCancel}
              onSaveDraft={wizard.handleSaveDraft}
              isLoading={wizard.isSubmitting}
              isDraftSaving={wizard.isDraftSaving}
              hasDraft={wizard.hasDraft}
              canComplete={wizard.canComplete}
              completeButtonText={t('dossier:form.create')}
              allowStepNavigation={true}
              namespace="form-wizard"
              actionBarMode="auto"
            >
              {children}
            </FormWizard>
          </form>
        </Form>
      </FormProvider>
    </div>
  )
}
```

### Anti-Patterns to Avoid

- **Monolithic schema with all types:** The current `extension_data` object has all 7 types' fields in one schema. Per-type schemas (D-07/D-08) eliminate this -- each type validates only its own fields.
- **Flat defaultValues for all types:** Current `defaultValues` initializes all extension fields to empty strings regardless of type. The factory pattern (D-09) returns only relevant defaults.
- **Duplicating FormWizard logic:** The Shell must NOT re-implement step indicators, animations, or navigation. It wraps `FormWizard` and passes config.
- **`extension_data` nesting in per-type schemas:** The new per-type schemas should have type-specific fields at the top level (e.g., `countrySchema` has `iso_code_2` directly), not nested under `extension_data`. The hook's `filterExtensionData` callback maps flat form fields to the API's `extensionData` shape at submission time.

## Don't Hand-Roll

| Problem                       | Don't Build                      | Use Instead                       | Why                                                                         |
| ----------------------------- | -------------------------------- | --------------------------------- | --------------------------------------------------------------------------- |
| Form state management         | Custom state + onChange handlers | react-hook-form 7.72.0            | Already used; handles validation, dirty tracking, nested fields             |
| Schema validation             | Manual if/else validators        | Zod 4.3.6 + zodResolver           | Already used; type inference, composable with .merge()                      |
| Draft persistence             | Custom IndexedDB wrapper         | useFormDraft from form-wizard.tsx | Already proven; handles deep merge, meaningful content detection, auto-save |
| Step animations               | Custom CSS transitions           | FormWizard's Framer Motion        | Already handles RTL-aware slide direction                                   |
| Toast notifications           | Custom notification system       | sonner (already installed)        | Already used for draft/success/error toasts                                 |
| Mutation + cache invalidation | Manual fetch + setState          | useCreateDossier (TanStack Query) | Already handles optimistic updates, error handling                          |

**Key insight:** This phase is an extraction/decomposition exercise, not a greenfield build. Every primitive already exists -- the work is composing them into a generic, type-parameterized API.

## Common Pitfalls

### Pitfall 1: Zod `.merge()` Type Inference with `zodResolver`

**What goes wrong:** Zod 4's `.merge()` creates schemas where `.default()` values produce different input/output types, causing TypeScript errors with `useForm<T>`.
**Why it happens:** The project already has a `zodResolver` wrapper in `lib/form-resolver.ts` that casts through `any` to work around this. Per-type schemas using `.merge()` inherit the same issue.
**How to avoid:** Always use the project's `zodResolver` from `@/lib/form-resolver`, not the direct `@hookform/resolvers/zod` import. The wrapper handles the type gap.
**Warning signs:** TypeScript errors about `Resolver<T>` type mismatch when passing merged schemas to `useForm`.

### Pitfall 2: Draft Migration Data Loss

**What goes wrong:** Old `dossier-create-draft` key contains data without a `type` field (or with type set later), making it impossible to determine which per-type key to migrate to.
**Why it happens:** The old wizard allows type selection as step 0, so early drafts may not have a type.
**How to avoid:** In migration logic, if old draft has no `type` field, keep it under the old key (don't migrate) and let it be picked up by the fallback path. Only migrate drafts with a clear type.
**Warning signs:** User's existing draft disappears after upgrade.

### Pitfall 3: Hook Re-render Cascades

**What goes wrong:** `useCreateDossierWizard` returns too many unstable references, causing child components to re-render on every keystroke.
**Why it happens:** Returning `form.watch()` values directly (like current `formValues = form.watch()`) triggers re-renders on every field change.
**How to avoid:** Don't spread `form.watch()` into the return value. Let consumers call `form.watch('fieldName')` for specific fields. The hook should return stable references (memoized handlers, the form object itself).
**Warning signs:** Noticeable input lag, especially on mobile devices.

### Pitfall 4: Classification Section Collapse State

**What goes wrong:** Collapsible classification section (INFRA-06) resets to collapsed on every step transition.
**Why it happens:** FormWizard uses `AnimatePresence` which unmounts step content, losing local state.
**How to avoid:** Store collapse state in the wizard hook or use a ref that persists across step mounts. Since classification is in BasicInfoStep (always step 1), this is less critical but still important for UX.
**Warning signs:** User expands classification, navigates away and back, finds it collapsed again.

### Pitfall 5: Schema-to-API Shape Mismatch

**What goes wrong:** Per-type schemas have fields at top level (e.g., `iso_code_2`) but the API expects them nested under `extensionData`.
**Why it happens:** D-07 specifies flat per-type schemas, but `CreateDossierRequest` has `extensionData?: DossierExtensionData`.
**How to avoid:** The `WizardConfig` must include a `filterExtensionData` callback (similar to existing `filterExtensionDataByType`) that maps flat form fields to the nested API shape at submission time. This mapping lives in the hook's `handleComplete`.
**Warning signs:** API returns 400 errors because extension fields are sent at the top level instead of nested.

## Code Examples

### Draft Migration (INFRA-07)

```typescript
// Source: D-03 decision + existing useFormDraft pattern [VERIFIED: codebase]
function migrateLegacyDraft(): void {
  const OLD_KEY = 'dossier-create-draft'
  try {
    const raw = localStorage.getItem(OLD_KEY)
    if (!raw) return

    const parsed = JSON.parse(raw)
    const type = parsed.type as DossierType | undefined
    if (!type) return // Can't migrate without type -- leave old key intact

    const newKey = `dossier-create-${type}`
    // Don't overwrite if per-type draft already exists
    if (localStorage.getItem(newKey)) {
      localStorage.removeItem(OLD_KEY)
      return
    }

    // Remove type field from migrated data (it's now implicit in the key)
    const { type: _, ...draftData } = parsed
    localStorage.setItem(newKey, JSON.stringify(draftData))
    localStorage.removeItem(OLD_KEY)
  } catch {
    // Silent failure per D-03 -- don't block wizard initialization
  }
}
```

### SharedBasicInfoStep with Classification (INFRA-06)

```typescript
// Source: Existing BasicInfoStep + ClassificationStep patterns [VERIFIED: codebase]
// Merges classification fields into BasicInfoStep as collapsible section
export function SharedBasicInfoStep({ form, onAIGenerate }: SharedBasicInfoStepProps) {
  const { t } = useTranslation(['dossier', 'form-wizard'])
  const { isRTL } = useDirection()

  return (
    <div className="space-y-6">
      {/* Bilingual name fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormInput name="name_en" label={t('dossier:form.nameEn')} required />
        <FormInput name="name_ar" label={t('dossier:form.nameAr')} required dir="rtl" />
      </div>

      {/* AI assist button */}
      {/* ... existing AI generate pattern ... */}

      {/* Classification (collapsible, collapsed by default) */}
      <details className="group border rounded-lg">
        <summary className="flex items-center justify-between p-4 cursor-pointer min-h-11">
          <span className="text-sm font-medium">{t('dossier:create.classificationTitle')}</span>
        </summary>
        <div className="p-4 pt-0 space-y-4">
          {/* Status and sensitivity fields from ClassificationStep */}
        </div>
      </details>
    </div>
  )
}
```

## State of the Art

| Old Approach                      | Current Approach                      | When Changed          | Impact                                                                        |
| --------------------------------- | ------------------------------------- | --------------------- | ----------------------------------------------------------------------------- |
| Single flat schema for all types  | Per-type schemas via `.merge()`       | This phase            | Each type validates only its own fields; eliminates phantom validation errors |
| Monolithic wizard component       | Hook + Shell + per-type renderers     | This phase            | Type-specific wizards are 30-50 lines each instead of 300+                    |
| Single `dossier-create-draft` key | Per-type `dossier-create-{type}` keys | This phase            | Drafts don't collide across types                                             |
| Classification as separate step   | Collapsible section in BasicInfo      | This phase (INFRA-06) | Reduces wizard step count by 1 for all types                                  |

**Deprecated/outdated:**

- `DossierCreateWizard.tsx`: Will be superseded by type-specific wizards in Phases 27-31, removed in Phase 31 (UX-03)
- `wizard-steps/Shared.ts` monolithic schema: Replaced by per-type schemas in `wizard/schemas/`
- `wizard-steps/ClassificationStep.tsx`: Merged into SharedBasicInfoStep per INFRA-06

## Assumptions Log

| #   | Claim                                                                                                                   | Section                               | Risk if Wrong                                                                             |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------- |
| A1  | `details/summary` HTML element is sufficient for classification collapse (no need for HeroUI Accordion)                 | INFRA-06 / Code Examples              | Minor -- would need to swap to Accordion component; both are simple                       |
| A2  | Per-type schema fields should be at top level (not nested under `extension_data`) with a mapping callback at submission | Architecture Patterns / Anti-Patterns | Medium -- if kept nested, schema composition gets more complex but API mapping is simpler |
| A3  | Old drafts without a `type` field should be left unmigrated (kept under old key)                                        | Pitfall 2 / Code Examples             | Low -- these drafts would be orphaned but no data loss                                    |

## Open Questions

1. **Duplicate detection API**
   - What we know: The hook should handle duplicate detection per INFRA-01. The existing wizard does not implement this.
   - What's unclear: Which API endpoint or Edge Function supports duplicate checking. The `createDossier` function may return duplicate warnings, or there may be a separate check endpoint.
   - Recommendation: Implement as a pre-submission check via a new query (e.g., `GET /dossiers?name_en=X&type=Y&limit=1`). If API returns matches, show inline warning. This is a soft check -- user can proceed.

2. **`elected_official` type handling in schemas**
   - What we know: Elected officials use `person_subtype: 'elected_official'` on the person dossier type (not a separate dossier type). Phase 30 builds this.
   - What's unclear: Whether the base infrastructure needs a `person_subtype` discriminator in schemas now or if Phase 30 handles it.
   - Recommendation: Include `person_subtype` as optional field in person schema. Phase 30 extends with office/term fields.

## Validation Architecture

### Test Framework

| Property           | Value                                               |
| ------------------ | --------------------------------------------------- |
| Framework          | Vitest 4.1.2                                        |
| Config file        | `frontend/vitest.config.ts`                         |
| Quick run command  | `cd frontend && pnpm vitest run --reporter=verbose` |
| Full suite command | `cd frontend && pnpm test`                          |

### Phase Requirements to Test Map

| Req ID   | Behavior                                                | Test Type | Automated Command                                                                                           | File Exists? |
| -------- | ------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------- | ------------ |
| INFRA-01 | useCreateDossierWizard returns form, handlers, state    | unit      | `cd frontend && pnpm vitest run src/components/dossier/wizard/hooks/useCreateDossierWizard.test.ts -x`      | Wave 0       |
| INFRA-03 | Per-type schemas extend base and validate correctly     | unit      | `cd frontend && pnpm vitest run src/components/dossier/wizard/schemas/__tests__/schemas.test.ts -x`         | Wave 0       |
| INFRA-04 | getDefaultsForType returns correct defaults per type    | unit      | `cd frontend && pnpm vitest run src/components/dossier/wizard/defaults/__tests__/defaults.test.ts -x`       | Wave 0       |
| INFRA-05 | Draft key parameterized per type                        | unit      | Covered by INFRA-01 hook test                                                                               | Wave 0       |
| INFRA-07 | Legacy draft migration works silently                   | unit      | `cd frontend && pnpm vitest run src/components/dossier/wizard/hooks/__tests__/useDraftMigration.test.ts -x` | Wave 0       |
| INFRA-02 | CreateWizardShell renders FormWizard with correct props | unit      | `cd frontend && pnpm vitest run src/components/dossier/wizard/__tests__/CreateWizardShell.test.tsx -x`      | Wave 0       |
| INFRA-06 | Classification section renders collapsed in BasicInfo   | unit      | `cd frontend && pnpm vitest run src/components/dossier/wizard/__tests__/SharedBasicInfoStep.test.tsx -x`    | Wave 0       |

### Sampling Rate

- **Per task commit:** `cd frontend && pnpm vitest run --reporter=verbose`
- **Per wave merge:** `cd frontend && pnpm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `frontend/src/components/dossier/wizard/hooks/__tests__/useCreateDossierWizard.test.ts` -- covers INFRA-01, INFRA-05
- [ ] `frontend/src/components/dossier/wizard/schemas/__tests__/schemas.test.ts` -- covers INFRA-03
- [ ] `frontend/src/components/dossier/wizard/defaults/__tests__/defaults.test.ts` -- covers INFRA-04
- [ ] `frontend/src/components/dossier/wizard/hooks/__tests__/useDraftMigration.test.ts` -- covers INFRA-07
- [ ] `frontend/src/components/dossier/wizard/__tests__/CreateWizardShell.test.tsx` -- covers INFRA-02
- [ ] `frontend/src/components/dossier/wizard/__tests__/SharedBasicInfoStep.test.tsx` -- covers INFRA-06

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                                                                   |
| --------------------- | ------- | ---------------------------------------------------------------------------------- |
| V2 Authentication     | no      | N/A -- wizard uses existing auth context                                           |
| V3 Session Management | no      | N/A -- no session changes                                                          |
| V4 Access Control     | no      | N/A -- existing RLS policies on dossier creation                                   |
| V5 Input Validation   | yes     | Zod schema validation on client; server-side validation in Edge Function unchanged |
| V6 Cryptography       | no      | N/A -- no crypto operations                                                        |

### Known Threat Patterns

| Pattern                       | STRIDE                 | Standard Mitigation                                                                                          |
| ----------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| localStorage data exposure    | Information Disclosure | Draft data is non-sensitive (dossier names/descriptions); no credentials stored. Cleared on form completion. |
| Client-side validation bypass | Tampering              | Server-side validation in Edge Function is unchanged and remains the authoritative check                     |

## Sources

### Primary (HIGH confidence)

- Codebase analysis: `DossierCreateWizard.tsx`, `wizard-steps/Shared.ts`, `form-wizard.tsx` -- current implementation fully read
- Codebase analysis: `dossier-api.ts` -- CreateDossierRequest interface, DossierType enum, extension types
- Codebase analysis: `form-resolver.ts` -- zodResolver wrapper for Zod 4 compatibility
- npm registry: react-hook-form 7.72.1, zod 4.3.6, @hookform/resolvers 5.2.2 [VERIFIED]

### Secondary (MEDIUM confidence)

- UI Spec: `26-UI-SPEC.md` -- visual contract for Shell, step layout, RTL rules
- CONTEXT.md: D-01 through D-09 decisions from discuss phase

### Tertiary (LOW confidence)

- None -- all findings verified against codebase

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- all libraries already installed and in use
- Architecture: HIGH -- extraction from well-understood existing code
- Pitfalls: HIGH -- identified from real patterns in the codebase

**Research date:** 2026-04-15
**Valid until:** 2026-05-15 (stable -- internal refactoring, no external dependency changes)
