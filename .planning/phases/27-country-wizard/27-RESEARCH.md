# Phase 27: Country Wizard - Research

**Researched:** 2026-04-15
**Domain:** Type-specific wizard composition, country reference data auto-fill, review step pattern
**Confidence:** HIGH

## Summary

Phase 27 builds the first type-specific wizard on top of Phase 26's shared infrastructure. The Country Wizard is a 3-step flow (Basic Info, Country Details, Review) accessed from `/dossiers/countries/create`. All core infrastructure exists: `useCreateDossierWizard<T>`, `CreateWizardShell`, `SharedBasicInfoStep`, `countrySchema`, and `countryDefaults`. The work is primarily composition -- wiring these together with two new components (CountryDetailsStep, CountryReviewStep) and a new TanStack Router route.

The key technical challenge is the auto-fill feature (D-02/D-03): when the user enters a country name, the wizard should query the `countries` reference table (populated via REST Countries API) and auto-fill ISO codes, region, and capital. The backend already has `GET /api/countries` with search support. The `country-codes.ts` utility provides a client-side fallback for quick matching.

**Primary recommendation:** Compose existing Phase 26 infrastructure with two new step components and a country wizard config. Use `GET /api/countries?search=` for auto-fill lookup with debounce.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Claude's discretion on Country Details layout. Two-column grid matching SharedBasicInfoStep's bilingual pattern. Mobile-first stacking.
- **D-02:** Auto-fill ISO codes, region, capital from `countries` reference table when user enters country name.
- **D-03:** DB `countries` table is primary reference source; `country-codes.ts` is client-side fallback.
- **D-04:** Region field is a dropdown of predefined regions from reference data, not free text.
- **D-05:** Review step uses grouped summary cards with per-section Edit buttons. Sets reusable pattern.
- **D-06:** Claude's discretion on generic vs. specific ReviewStep approach.
- **D-07:** Route at `/dossiers/countries/create`. "Create Country" button on list page points here.
- **D-08:** Old `/dossiers/create` route untouched until Phase 31.

### Claude's Discretion

- **D-09:** Country wizard config structure (WizardConfig<CountryFormData>)
- **D-10:** i18n namespace strategy (extend `dossier` vs. new `country-wizard`)
- **D-11:** Flag display in wizard (optional nice touch)

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                             | Research Support                                                                                                              |
| ------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| CTRY-01 | User can create a country dossier via dedicated 3-step wizard (Basic Info -> Country Details -> Review) | Phase 26 infra (useCreateDossierWizard, CreateWizardShell, SharedBasicInfoStep) + new CountryDetailsStep + CountryReviewStep  |
| CTRY-02 | Country Details step captures ISO codes (2-letter, 3-letter), region, capital (bilingual)               | countrySchema already defines these fields; CountryExtension in dossier-api.ts matches; DB countries table has reference data |
| CTRY-03 | Country wizard accessible directly from Countries list page                                             | New route at `/dossiers/countries/create`; update Link on countries/index.tsx from `/dossiers/create`                         |

</phase_requirements>

## Architectural Responsibility Map

| Capability                     | Primary Tier      | Secondary Tier      | Rationale                                                                           |
| ------------------------------ | ----------------- | ------------------- | ----------------------------------------------------------------------------------- |
| Wizard form state & validation | Frontend (Client) | --                  | react-hook-form + Zod, all client-side                                              |
| Country reference data lookup  | API / Backend     | Frontend (fallback) | `GET /api/countries?search=` for DB lookup; `country-codes.ts` for offline fallback |
| Dossier creation (submit)      | API / Backend     | --                  | `useCreateDossier` mutation hits backend API                                        |
| Draft persistence              | Frontend (Client) | --                  | localStorage via useFormDraft                                                       |
| Routing & navigation           | Frontend (Client) | --                  | TanStack Router file-based routes                                                   |
| i18n translations              | Frontend (Client) | --                  | i18next JSON namespaces                                                             |

## Standard Stack

### Core (Already Installed)

| Library          | Purpose                                | Why Standard                                                   |
| ---------------- | -------------------------------------- | -------------------------------------------------------------- |
| react-hook-form  | Form state management                  | Already used by SharedBasicInfoStep and useCreateDossierWizard |
| zod              | Schema validation                      | countrySchema already defined in Phase 26                      |
| @tanstack/router | File-based routing                     | Project standard; new route file needed                        |
| @tanstack/query  | Server state for reference data lookup | Debounced query for auto-fill                                  |
| i18next          | Bilingual labels                       | Project standard                                               |
| framer-motion    | Step transitions                       | Already in FormWizard                                          |
| lucide-react     | Icons                                  | Project standard                                               |

### No New Dependencies Required

This phase requires zero new npm packages. Everything composes existing infrastructure.

## Architecture Patterns

### System Architecture Diagram

```
Countries List Page (/dossiers/countries/)
    |
    | "Create Country" button
    v
Country Wizard Route (/dossiers/countries/create)
    |
    | useCreateDossierWizard<CountryFormData>(countryWizardConfig)
    v
CreateWizardShell (FormProvider + FormWizard)
    |
    +---> Step 0: SharedBasicInfoStep (reused from Phase 26)
    |         |
    |         | name_en onChange (debounced)
    |         v
    |     useCountryAutoFill hook
    |         |
    |         | GET /api/countries?search=<name>
    |         v
    |     Auto-fill ISO codes, region, capital into form
    |
    +---> Step 1: CountryDetailsStep (NEW)
    |         |
    |         +-- ISO Code 2 (text, 2 chars, uppercase)
    |         +-- ISO Code 3 (text, 3 chars, uppercase)
    |         +-- Region (dropdown: asia/africa/europe/americas/oceania)
    |         +-- Capital EN / Capital AR (bilingual grid)
    |
    +---> Step 2: CountryReviewStep (NEW)
              |
              +-- Basic Info summary card (with Edit button -> step 0)
              +-- Country Details summary card (with Edit button -> step 1)
              +-- Submit button (via FormWizard onComplete)
                    |
                    v
              useCreateDossier mutation -> POST dossier
                    |
                    v
              Navigate to /dossiers/countries/<new-id>
```

### Recommended File Structure

```
frontend/src/
├── components/dossier/wizard/
│   ├── steps/
│   │   └── CountryDetailsStep.tsx      # NEW - Country-specific fields
│   ├── review/
│   │   └── CountryReviewStep.tsx       # NEW - Review with summary cards
│   ├── config/
│   │   └── country.config.ts           # NEW - WizardConfig<CountryFormData>
│   └── hooks/
│       └── useCountryAutoFill.ts       # NEW - Reference data auto-fill
├── routes/_protected/dossiers/countries/
│   ├── index.tsx                        # MODIFY - Update Create button link
│   └── create.tsx                       # NEW - Country wizard route
└── i18n/
    ├── en/form-wizard.json              # MODIFY - Add country wizard keys
    └── ar/form-wizard.json              # MODIFY - Add country wizard keys
```

### Pattern 1: Wizard Config Composition

**What:** Each type-specific wizard defines a `WizardConfig<T>` object and passes it to `useCreateDossierWizard`.
**When to use:** Every new wizard (this is the first instance).

```typescript
// Source: Phase 26 config/types.ts pattern
import { countrySchema, type CountryFormData } from '../schemas/country.schema'
import { getDefaultsForType } from '../defaults'
import type { WizardConfig } from '../config/types'

export const countryWizardConfig: WizardConfig<CountryFormData> = {
  type: 'country',
  schema: countrySchema,
  defaultValues: getDefaultsForType<CountryFormData>('country'),
  steps: [
    {
      id: 'basic',
      title: 'form-wizard:steps.basicInfo', // i18n key
      description: 'form-wizard:steps.basicInfoDesc',
      // icon: FileText from lucide
    },
    {
      id: 'country-details',
      title: 'form-wizard:steps.countryDetails',
      description: 'form-wizard:steps.countryDetailsDesc',
      // icon: Globe from lucide
    },
    {
      id: 'review',
      title: 'form-wizard:steps.review',
      description: 'form-wizard:steps.reviewDesc',
      // icon: CheckCircle from lucide
    },
  ],
  filterExtensionData: (data: CountryFormData) => ({
    iso_code_2: data.iso_code_2 || undefined,
    iso_code_3: data.iso_code_3 || undefined,
    capital_en: data.capital_en || undefined,
    capital_ar: data.capital_ar || undefined,
    region: data.region || undefined,
  }),
}
```

### Pattern 2: Auto-Fill from Reference Data

**What:** Debounced lookup of country reference data when user types a name.
**When to use:** Country Details step auto-population.

```typescript
// useCountryAutoFill.ts
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { CountryFormData } from '../schemas/country.schema'

export function useCountryAutoFill(nameEn: string, form: UseFormReturn<CountryFormData>): void {
  // Debounced query to GET /api/countries?search=<nameEn>&limit=1
  const { data: match } = useQuery({
    queryKey: ['country-reference', nameEn],
    queryFn: () => fetchCountryReference(nameEn),
    enabled: nameEn.length >= 3,
    staleTime: 5 * 60 * 1000, // 5 min cache
  })

  useEffect(() => {
    if (match != null) {
      // Only auto-fill if fields are still empty (user hasn't overridden)
      const current = form.getValues()
      if (current.iso_code_2 === '') form.setValue('iso_code_2', match.code)
      if (current.iso_code_3 === '') form.setValue('iso_code_3', match.code3)
      if (current.region === '') form.setValue('region', match.region)
      if (current.capital_en === '') form.setValue('capital_en', match.capital_en ?? '')
      if (current.capital_ar === '') form.setValue('capital_ar', match.capital_ar ?? '')
    }
  }, [match, form])
}
```

### Pattern 3: Review Step Summary Cards

**What:** Grouped read-only display with per-section Edit navigation.
**When to use:** Review step in every wizard.

```typescript
// CountryReviewStep.tsx - sets the reusable pattern
interface ReviewSectionProps {
  title: string
  onEdit: () => void
  children: React.ReactNode
}

function ReviewSection({ title, onEdit, children }: ReviewSectionProps): ReactElement {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-base">{title}</h3>
        <Button variant="ghost" size="sm" onClick={onEdit} className="min-h-11 min-w-11">
          {t('form-wizard:review.edit')}
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        {children}
      </div>
    </div>
  )
}
```

### Anti-Patterns to Avoid

- **Don't create a separate API endpoint for reference lookup:** The existing `GET /api/countries?search=` already supports this. No backend changes needed.
- **Don't duplicate SharedBasicInfoStep fields in CountryDetailsStep:** Country Details only has the extension fields (ISO codes, region, capital). Basic Info is handled by the shared step.
- **Don't use `textAlign: "right"` for Arabic fields:** Use `dir={direction}` from `useDirection()` hook per CLAUDE.md RTL rules.
- **Don't manually reverse arrays for RTL:** `forceRTL` handles this automatically.

## Don't Hand-Roll

| Problem                    | Don't Build                    | Use Instead                                | Why                                                        |
| -------------------------- | ------------------------------ | ------------------------------------------ | ---------------------------------------------------------- |
| Form state management      | Custom useState for each field | react-hook-form via useCreateDossierWizard | Draft persistence, validation, step navigation all handled |
| Country reference lookup   | Custom fetch + state           | TanStack Query with existing API           | Caching, deduplication, stale-while-revalidate             |
| Step navigation & progress | Custom stepper                 | FormWizard component                       | Animation, a11y, touch targets already built               |
| Draft persistence          | Custom localStorage logic      | useFormDraft (in FormWizard)               | Versioned safeParse, per-type keys                         |
| Region dropdown options    | Hard-coded array               | DB reference data regions                  | Ensures consistency with seeded data                       |

## Common Pitfalls

### Pitfall 1: Auto-Fill Overwriting User Edits

**What goes wrong:** Auto-fill triggers after user manually typed ISO codes, overwriting their input.
**Why it happens:** useEffect fires on every reference data change without checking if user has edited fields.
**How to avoid:** Only auto-fill fields that are still at their default empty value. Check `form.getValues()` before `setValue()`.
**Warning signs:** User types "SA" in ISO code, then types country name and their input disappears.

### Pitfall 2: ISO Code Validation vs. Auto-Fill Case

**What goes wrong:** DB stores uppercase ISO codes ("SA", "SAU") but user types lowercase.
**Why it happens:** countrySchema allows any case; DB constraint requires `^[A-Z]{2}$`.
**How to avoid:** Apply `.toUpperCase()` transform in `filterExtensionData` before submission, and add `uppercase` CSS class on the input field.
**Warning signs:** Form submits but backend rejects due to constraint violation.

### Pitfall 3: Route Not Generating in TanStack Router

**What goes wrong:** New `/dossiers/countries/create` route doesn't appear in routeTree.gen.ts.
**Why it happens:** TanStack Router code-gen requires the file at the exact path: `routes/_protected/dossiers/countries/create.tsx`.
**How to avoid:** Create the route file, then run `pnpm dev` or TanStack Router's codegen to regenerate `routeTree.gen.ts`.
**Warning signs:** Navigation to `/dossiers/countries/create` shows 404.

### Pitfall 4: Region Dropdown Bilingual Labels

**What goes wrong:** Region dropdown shows English-only labels ("asia", "africa") regardless of language.
**Why it happens:** Raw DB values used without i18n translation.
**How to avoid:** Map region values to i18n keys (e.g., `form-wizard:regions.asia`) with both EN and AR translations.
**Warning signs:** Arabic UI shows English region names.

### Pitfall 5: Review Step Stale Data

**What goes wrong:** Review step shows old data after user edits a field and returns.
**Why it happens:** Review reads form values on mount but doesn't re-read on step change.
**How to avoid:** Use `form.watch()` in ReviewStep to get live values, not `form.getValues()` cached in state.
**Warning signs:** User edits name in Basic Info, returns to Review, sees old name.

## Code Examples

### Country Wizard Route Page

```typescript
// frontend/src/routes/_protected/dossiers/countries/create.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useCreateDossierWizard } from '@/components/dossier/wizard/hooks/useCreateDossierWizard'
import { CreateWizardShell } from '@/components/dossier/wizard/CreateWizardShell'
import { SharedBasicInfoStep } from '@/components/dossier/wizard/SharedBasicInfoStep'
import { CountryDetailsStep } from '@/components/dossier/wizard/steps/CountryDetailsStep'
import { CountryReviewStep } from '@/components/dossier/wizard/review/CountryReviewStep'
import { countryWizardConfig } from '@/components/dossier/wizard/config/country.config'
import type { CountryFormData } from '@/components/dossier/wizard/schemas/country.schema'

export const Route = createFileRoute('/_protected/dossiers/countries/create')({
  component: CreateCountryPage,
})

function CreateCountryPage(): ReactElement {
  const wizard = useCreateDossierWizard<CountryFormData>(countryWizardConfig)

  return (
    <CreateWizardShell wizard={wizard}>
      <SharedBasicInfoStep form={wizard.form} dossierType="country" />
      <CountryDetailsStep form={wizard.form} />
      <CountryReviewStep
        form={wizard.form}
        onEditStep={wizard.setCurrentStep}
      />
    </CreateWizardShell>
  )
}
```

### Countries List Button Update

```typescript
// In countries/index.tsx -- change the Link target
<Button asChild className="min-h-11 min-w-11 w-full sm:w-auto">
  <Link to="/dossiers/countries/create">
    <Plus className="h-4 w-4 me-2" />
    {t('action.create')}
  </Link>
</Button>
```

## State of the Art

| Old Approach                                       | Current Approach                                   | When Changed       | Impact                                               |
| -------------------------------------------------- | -------------------------------------------------- | ------------------ | ---------------------------------------------------- |
| Monolithic `/dossiers/create` wizard for all types | Type-specific wizards at `/dossiers/{type}/create` | Phase 26-27 (v5.0) | Each type gets focused steps, auto-fill, validation  |
| Manual form state with useState                    | react-hook-form + Zod via useCreateDossierWizard   | Phase 26           | Draft persistence, validation, AI assist composed in |
| No reference data auto-fill                        | DB lookup + auto-fill on name entry                | Phase 27           | Better data integrity, less manual entry             |

## Assumptions Log

| #   | Claim                                                                                                                       | Section               | Risk if Wrong                                                        |
| --- | --------------------------------------------------------------------------------------------------------------------------- | --------------------- | -------------------------------------------------------------------- |
| A1  | `GET /api/countries?search=` returns reference country records (code, code3, name_en, name_ar, region) usable for auto-fill | Architecture Patterns | Would need a new API endpoint or direct Supabase query               |
| A2  | The countries reference table has capital_en/capital_ar columns (from populate-countries-v2)                                | Architecture Patterns | Auto-fill for capital would not work; need to check actual DB schema |
| A3  | FormWizard renders children by index matching currentStep                                                                   | Architecture Patterns | Step rendering would break if FormWizard uses a different mechanism  |

**Note on A2:** The `002_create_countries.sql` migration does NOT include capital columns. However, the `populate-countries-v2` Edge Function fetches capital data from REST Countries API. The actual DB may have been altered by later migrations or the seed data may store capital in a different field. This needs verification at implementation time.

## Open Questions

1. **Does the `countries` reference table have capital columns?**
   - What we know: `002_create_countries.sql` has `name_en, name_ar, iso_alpha2, iso_alpha3, region, status` only. No capital columns.
   - What we know: `populate-countries-v2` fetches capital from REST Countries API but may store it differently (possibly in a JSONB metadata column or separate table).
   - Recommendation: At implementation, query the actual DB schema. If no capital column exists, capital auto-fill can be skipped (user types it manually) or use the `country-codes.ts` fallback pattern.

2. **Does `GET /api/countries` return data suitable for auto-fill?**
   - What we know: Backend has `GET /api/countries` with search support (from `backend/src/api/countries.ts`).
   - What's unclear: Exact response shape and whether it includes all needed fields.
   - Recommendation: Test the endpoint at implementation time. If response is insufficient, use Supabase client directly from frontend (the project already uses Supabase client for some queries).

## Validation Architecture

### Test Framework

| Property           | Value                                  |
| ------------------ | -------------------------------------- |
| Framework          | Vitest + @testing-library/react        |
| Config file        | `frontend/vitest.config.ts`            |
| Quick run command  | `pnpm --filter frontend test -- --run` |
| Full suite command | `pnpm test`                            |

### Phase Requirements -> Test Map

| Req ID  | Behavior                                          | Test Type | Automated Command                                         | File Exists? |
| ------- | ------------------------------------------------- | --------- | --------------------------------------------------------- | ------------ |
| CTRY-01 | 3-step wizard renders and navigates               | unit      | `pnpm --filter frontend test -- --run CountryWizard`      | No - Wave 0  |
| CTRY-02 | CountryDetailsStep captures ISO, region, capital  | unit      | `pnpm --filter frontend test -- --run CountryDetailsStep` | No - Wave 0  |
| CTRY-02 | Auto-fill populates fields from reference data    | unit      | `pnpm --filter frontend test -- --run useCountryAutoFill` | No - Wave 0  |
| CTRY-03 | Create button links to /dossiers/countries/create | unit      | `pnpm --filter frontend test -- --run CountriesListPage`  | No - Wave 0  |

### Sampling Rate

- **Per task commit:** `pnpm --filter frontend test -- --run`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `frontend/src/components/dossier/wizard/steps/__tests__/CountryDetailsStep.test.tsx` -- covers CTRY-02
- [ ] `frontend/src/components/dossier/wizard/review/__tests__/CountryReviewStep.test.tsx` -- covers CTRY-01 (review step)
- [ ] `frontend/src/components/dossier/wizard/hooks/__tests__/useCountryAutoFill.test.ts` -- covers CTRY-02 (auto-fill)

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                                                   |
| --------------------- | ------- | ------------------------------------------------------------------ |
| V2 Authentication     | No      | Wizard is behind `_protected` route (auth already enforced)        |
| V3 Session Management | No      | Handled by Supabase Auth globally                                  |
| V4 Access Control     | Yes     | `_protected` route wrapper + `authenticateToken` middleware on API |
| V5 Input Validation   | Yes     | Zod schema (countrySchema) on client; express-validator on backend |
| V6 Cryptography       | No      | No crypto operations in wizard                                     |

### Known Threat Patterns

| Pattern                                | STRIDE    | Standard Mitigation                                       |
| -------------------------------------- | --------- | --------------------------------------------------------- |
| XSS via country name/description input | Tampering | React auto-escapes JSX; Zod string validation             |
| Invalid ISO code injection             | Tampering | Zod `.length(2)` / `.length(3)` + DB CHECK constraint     |
| Draft tampering in localStorage        | Tampering | Low risk (client-only drafts); server validates on submit |

## Sources

### Primary (HIGH confidence)

- Codebase inspection: `useCreateDossierWizard.ts`, `CreateWizardShell.tsx`, `SharedBasicInfoStep.tsx`, `config/types.ts` -- Phase 26 infrastructure verified in source
- Codebase inspection: `country.schema.ts`, `defaults/index.ts` -- Schema and defaults verified
- Codebase inspection: `countries/index.tsx` -- Current list page with `/dossiers/create` link confirmed
- Codebase inspection: `002_create_countries.sql` -- DB schema (no capital columns)
- Codebase inspection: `populate-countries-v2/index.ts` -- Edge Function fetches capital from REST Countries API
- Codebase inspection: `dossier-api.ts` -- CountryExtension interface includes iso_code_2, iso_code_3, capital_en, capital_ar, region

### Secondary (MEDIUM confidence)

- Codebase inspection: `backend/src/api/countries.ts` -- API endpoints confirmed (GET /api/countries with search)

### Tertiary (LOW confidence)

- A1/A2/A3 assumptions noted in Assumptions Log

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- all libraries already in use, no new deps
- Architecture: HIGH -- Phase 26 infrastructure fully verified in source code
- Pitfalls: HIGH -- derived from actual code patterns and schema constraints

**Research date:** 2026-04-15
**Valid until:** 2026-05-15 (stable -- no external dependency changes expected)
