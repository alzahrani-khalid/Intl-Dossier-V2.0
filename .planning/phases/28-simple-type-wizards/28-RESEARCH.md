# Phase 28: Simple Type Wizards - Research

**Researched:** 2026-04-16
**Domain:** Wizard UI composition (Organization, Topic, Person dossier creation)
**Confidence:** HIGH

## Summary

Phase 28 implements three type-specific dossier creation wizards -- Organization (3-step), Topic (2-step), and Person (3-step) -- by replicating the country wizard pattern established in Phase 27. All shared infrastructure (hook, shell, schemas, defaults) already exists from Phase 26. The existing schemas for all three types are already defined and the defaults are already registered in `getDefaultsForType()`.

The work is primarily composition: creating config files, type-specific step components, review step components, route files, i18n keys, and updating list pages to point Create buttons at the new wizard routes. No new hooks, no new shared infrastructure, no backend changes.

**Primary recommendation:** Follow the country wizard pattern exactly -- one config file, one details step component (except Topic which has none), one review step component, one route file, and one list page update per type.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Organization Org Details step collects 5 fields: type, code, website, headquarters location, and founding date -- all on one step.
- **D-02:** Person title field is free-text input (not dropdown) -- diplomatic titles are too varied for a fixed list.
- **D-03:** Person photo upload uses a simple file picker with thumbnail preview -- no cropping in the wizard.
- **D-04:** Person biography is a text area on the Person Details step alongside title and photo.
- **D-05:** No auto-fill for Organization -- users enter all fields manually.
- **D-06:** No auto-fill for Topic or Person -- unique entries with no reference tables.
- **D-07:** Organization: 3 steps -- SharedBasicInfo -> Org Details (5 fields) -> Review
- **D-08:** Topic: 2 steps -- SharedBasicInfo (with theme category inline) -> Review. Genuinely simpler; no padding.
- **D-09:** Person: 3 steps -- SharedBasicInfo -> Person Details (title/photo/biography) -> Review
- **D-10:** All three list pages use the same Create button pattern as Countries list.
- **D-11:** Post-creation navigates to new dossier's detail page using `getDossierDetailPath()`.

### Claude's Discretion

- **Topic theme category:** Single-select dropdown from predefined categories (Security, Trade, Human Rights, Climate, etc.) recommended by user. Use `Select` component with enum values from schema.

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                | Research Support                                                                         |
| ------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| ORG-01  | Organization wizard: 3-step (Basic Info -> Org Details -> Review)          | Config pattern from `country.config.ts`, schema from `organization.schema.ts`            |
| ORG-02  | Org Details captures type/code/website + headquarters/founding_date (D-01) | Schema needs `founding_date` field added; `OrganizationExtension` has `established_date` |
| ORG-03  | Organization wizard accessible from Organizations list page                | List page exists at `dossiers/organizations/index.tsx`, needs Create button URL update   |
| TOPC-01 | Topic wizard: 2-step (Basic Info -> Review)                                | No details step needed; theme_category goes inline in SharedBasicInfoStep                |
| TOPC-02 | Basic Info includes theme category selector inline                         | Schema has `theme_category` enum; needs inline rendering in BasicInfo step               |
| TOPC-03 | Topic wizard accessible from Topics list page                              | List page exists at `dossiers/topics/index.tsx`, needs Create button URL update          |
| PRSN-01 | Person wizard: 3-step (Basic Info -> Person Details -> Review)             | Config pattern from `country.config.ts`, schema from `person.schema.ts`                  |
| PRSN-02 | Person Details captures title/photo/biography                              | Schema already has all fields; photo_url is URL string (D-03: simple file picker)        |
| PRSN-03 | Person wizard accessible from Persons list page                            | List page exists at `dossiers/persons/index.tsx`, needs Create button URL update         |

</phase_requirements>

## Architectural Responsibility Map

| Capability             | Primary Tier      | Secondary Tier | Rationale                                                |
| ---------------------- | ----------------- | -------------- | -------------------------------------------------------- |
| Wizard form state      | Frontend (Client) | --             | react-hook-form + zod, entirely client-side              |
| Draft persistence      | Frontend (Client) | --             | localStorage via useFormDraft                            |
| Dossier creation API   | API / Backend     | Database       | `useCreateDossier` mutation -> Express -> Supabase       |
| Photo URL input        | Frontend (Client) | --             | D-03: simple URL input with preview, no upload in wizard |
| Post-create navigation | Frontend (Client) | --             | `getDossierDetailPath()` client-side routing             |
| i18n translations      | Frontend (Client) | --             | form-wizard namespace JSON files                         |

## Standard Stack

### Core (Already Installed)

| Library                | Purpose               | Why Standard                                               |
| ---------------------- | --------------------- | ---------------------------------------------------------- |
| react-hook-form        | Form state management | Already used by all wizard steps [VERIFIED: codebase]      |
| zod                    | Schema validation     | Already used by all schemas [VERIFIED: codebase]           |
| @tanstack/react-router | Route definitions     | Already used for country wizard route [VERIFIED: codebase] |
| i18next                | Bilingual labels      | Already used throughout [VERIFIED: codebase]               |
| lucide-react           | Icons                 | Already used in all list/wizard pages [VERIFIED: codebase] |

### No New Dependencies

This phase requires zero new npm packages. Everything needed is already installed.

## Architecture Patterns

### System Architecture Diagram

```
List Page (Organizations/Topics/Persons)
    |
    | [Create Button click]
    v
Route: /dossiers/{type}/create
    |
    | [renders wizard page component]
    v
useCreateDossierWizard<TypeFormData>(typeWizardConfig)
    |
    +-- useFormDraft (localStorage)
    +-- useForm (react-hook-form + zodResolver)
    +-- useDossierNameSimilarity (duplicate check)
    +-- useAIFieldAssist
    +-- useCreateDossier (mutation)
    |
    v
CreateWizardShell
    |
    +-- SharedBasicInfoStep [step 0]
    +-- TypeDetailsStep [step 1, if exists]  <-- NEW per type
    +-- TypeReviewStep [last step]            <-- NEW per type
    |
    v
handleComplete() -> POST /api/dossiers -> navigate to detail
```

### Recommended File Structure (New Files)

```
frontend/src/components/dossier/wizard/
  config/
    organization.config.ts       # NEW - org wizard config
    topic.config.ts              # NEW - topic wizard config
    person.config.ts             # NEW - person wizard config
  steps/
    OrgDetailsStep.tsx           # NEW - 5 fields (type, code, website, HQ, founding)
    PersonDetailsStep.tsx        # NEW - title, photo, biography
    TopicBasicInfoStep.tsx       # NEW - wraps SharedBasicInfoStep + theme_category inline
  review/
    OrganizationReviewStep.tsx   # NEW - review sections for org
    TopicReviewStep.tsx          # NEW - review sections for topic (simpler)
    PersonReviewStep.tsx         # NEW - review sections for person

frontend/src/routes/_protected/dossiers/
  organizations/create.tsx       # NEW - org wizard route
  topics/create.tsx              # NEW - topic wizard route
  persons/create.tsx             # NEW - person wizard route (update existing)
```

### Pattern 1: Config-Driven Wizard (replicate country pattern)

**What:** Each type gets a config object matching `WizardConfig<T>` interface.
**When to use:** Every new wizard type.
**Example:**

```typescript
// Source: frontend/src/components/dossier/wizard/config/country.config.ts
import type { WizardConfig } from './types'
import type { OrganizationFormData } from '../schemas/organization.schema'
import { organizationSchema } from '../schemas/organization.schema'
import { getDefaultsForType } from '../defaults'

export const organizationWizardConfig: WizardConfig<OrganizationFormData> = {
  type: 'organization',
  schema: organizationSchema,
  defaultValues: getDefaultsForType<OrganizationFormData>('organization'),
  steps: [
    {
      id: 'basic',
      title: 'form-wizard:steps.basicInfo',
      description: 'form-wizard:steps.basicInfoDesc',
    },
    {
      id: 'org-details',
      title: 'form-wizard:steps.orgDetails',
      description: 'form-wizard:steps.orgDetailsDesc',
    },
    {
      id: 'review',
      title: 'form-wizard:steps.review',
      description: 'form-wizard:steps.reviewDesc',
    },
  ],
  filterExtensionData: (data: OrganizationFormData) => ({
    org_type: data.org_type,
    org_code: data.org_code !== '' ? data.org_code : undefined,
    website: data.website !== '' ? data.website : undefined,
    headquarters_en: data.headquarters_en !== '' ? data.headquarters_en : undefined,
    headquarters_ar: data.headquarters_ar !== '' ? data.headquarters_ar : undefined,
    established_date: data.founding_date !== '' ? data.founding_date : undefined,
  }),
}
```

### Pattern 2: Details Step Component (replicate CountryDetailsStep)

**What:** Each type-specific step uses `FormWizardStep`, `FormField`, `FormControl`, `FormItem`, `FormLabel`, `FormMessage` from form UI + `Input`/`Select`/`Textarea`.
**When to use:** OrgDetailsStep, PersonDetailsStep.

### Pattern 3: Review Step Component (replicate CountryReviewStep)

**What:** Uses `ReviewSection` (title + Edit button) and `ReviewField` (label + value) helpers. Uses `form.watch()` for live data.
**When to use:** All three review steps.

### Pattern 4: Topic Inline Theme Category

**What:** Topic has no dedicated details step. The theme_category select goes inline in the Basic Info step. Create a `TopicBasicInfoStep` that wraps `SharedBasicInfoStep` and adds the theme_category dropdown below it, OR pass the extra field as a render prop / slot.
**When to use:** Topic wizard only.

### Anti-Patterns to Avoid

- **Duplicating wizard hook logic:** Never copy `useCreateDossierWizard` internals. Always use the hook with a config.
- **Adding auto-fill hooks:** D-05/D-06 explicitly say no auto-fill for these types. Do not add `useOrgAutoFill` etc.
- **Padding Topic to 3 steps:** D-08 explicitly says Topic is 2 steps. Do not add a dummy step.
- **Using `textAlign: "right"` in form fields:** RTL rule -- use `writingDirection: "rtl"` and `dir` prop instead.

## Don't Hand-Roll

| Problem                 | Don't Build             | Use Instead                             | Why                                         |
| ----------------------- | ----------------------- | --------------------------------------- | ------------------------------------------- |
| Wizard step navigation  | Custom stepper          | `FormWizard` + `CreateWizardShell`      | Already handles RTL, animations, validation |
| Form state + validation | Manual state            | `react-hook-form` + `zodResolver`       | Already wired in `useCreateDossierWizard`   |
| Draft persistence       | Custom localStorage     | `useFormDraft` via the hook             | Already handles serialization, versioning   |
| Duplicate detection     | Custom similarity check | `useDossierNameSimilarity` via the hook | Already debounced, threshold-based          |
| Post-create navigation  | Manual routing          | `getDossierDetailPath()`                | Already maps type to correct route segment  |

## Common Pitfalls

### Pitfall 1: Organization Schema Missing founding_date

**What goes wrong:** D-01 says collect "founding date" but the current `organization.schema.ts` has no `founding_date` field. The API's `OrganizationExtension` has `established_date`.
**Why it happens:** Schema was created in Phase 26 based on requirements before D-01 added founding_date.
**How to avoid:** Add `founding_date: z.string().optional()` to `organizationFields` in the schema. Map it to `established_date` in `filterExtensionData`.
**Warning signs:** Form field renders but validation fails, or data not saved to backend.

### Pitfall 2: Organization headquarters_ar Not in Schema

**What goes wrong:** The `organization.schema.ts` has `headquarters_en` and `headquarters_ar` but `OrganizationExtension` only has `address_en`/`address_ar` and `headquarters_country_id` (a UUID reference, not a text field).
**Why it happens:** Schema fields don't perfectly match API extension type.
**How to avoid:** Map `headquarters_en`/`headquarters_ar` to `address_en`/`address_ar` in `filterExtensionData`, OR use the fields as-is and handle mapping in the backend. Check the Supabase dossier table's extension_data JSONB column for actual field names used.
**Warning signs:** Data saved but not displayed on detail page.

### Pitfall 3: Person photo_url Validation Too Strict

**What goes wrong:** Schema has `photo_url: z.string().url().optional().or(z.literal(''))` which means any non-empty value must be a valid URL. If using a file picker that stores a blob URL temporarily, validation fails.
**Why it happens:** D-03 says "simple file picker with thumbnail preview" but the schema expects a URL.
**How to avoid:** For the wizard, photo_url should accept a URL string input (paste a URL). The file picker interpretation from D-03 likely means a URL input with preview -- not actual file upload. The `PersonExtension` only stores `photo_url` as a string. Keep it as URL input with optional thumbnail preview via `<img>` tag.
**Warning signs:** User can't proceed past Person Details step.

### Pitfall 4: List Page Create Button Points to Old Route

**What goes wrong:** Organizations list currently links to `/dossiers/create` (the old monolithic wizard). Must update to `/dossiers/organizations/create`.
**Why it happens:** List pages were built before type-specific wizards existed.
**How to avoid:** Update all three list pages' Create button `to` prop and empty-state Create button.
**Warning signs:** Clicking Create goes to wrong wizard or 404.

### Pitfall 5: Topic Theme Category Not Showing in Review

**What goes wrong:** The TopicReviewStep doesn't display theme_category because it's part of SharedBasicInfoStep and the review only shows base fields.
**Why it happens:** Theme category is inline in BasicInfo but review sections are manually composed.
**How to avoid:** Include theme_category in the TopicReviewStep's Basic Info section explicitly.
**Warning signs:** User creates topic but can't see theme category in review.

### Pitfall 6: Persons Create Route Conflict

**What goes wrong:** There's already a `frontend/src/routes/_protected/persons/create.tsx` file. The new route should be at `dossiers/persons/create.tsx`.
**Why it happens:** Old route structure had `/persons/create` separate from `/dossiers/persons/`.
**How to avoid:** Create the route at `dossiers/persons/create.tsx`. Check if `persons/create.tsx` redirects or needs updating.
**Warning signs:** TanStack Router ambiguity or wrong page rendered.

## Code Examples

### Config File (Organization)

```typescript
// Source: pattern from country.config.ts [VERIFIED: codebase]
export const organizationWizardConfig: WizardConfig<OrganizationFormData> = {
  type: 'organization',
  schema: organizationSchema,
  defaultValues: getDefaultsForType<OrganizationFormData>('organization'),
  steps: [
    {
      id: 'basic',
      title: 'form-wizard:steps.basicInfo',
      description: 'form-wizard:steps.basicInfoDesc',
    },
    {
      id: 'org-details',
      title: 'form-wizard:steps.orgDetails',
      description: 'form-wizard:steps.orgDetailsDesc',
    },
    {
      id: 'review',
      title: 'form-wizard:steps.review',
      description: 'form-wizard:steps.reviewDesc',
    },
  ],
  filterExtensionData: (data) => ({
    org_type: data.org_type,
    org_code: data.org_code !== '' ? data.org_code : undefined,
    website: data.website !== '' ? data.website : undefined,
    address_en: data.headquarters_en !== '' ? data.headquarters_en : undefined,
    address_ar: data.headquarters_ar !== '' ? data.headquarters_ar : undefined,
    established_date: data.founding_date !== '' ? data.founding_date : undefined,
  }),
}
```

### Route File (Organization)

```typescript
// Source: pattern from countries/create.tsx [VERIFIED: codebase]
export const Route = createFileRoute('/_protected/dossiers/organizations/create')({
  component: CreateOrganizationPage,
})

function CreateOrganizationPage(): ReactElement {
  const { t } = useTranslation('form-wizard')
  const wizard = useCreateDossierWizard<OrganizationFormData>(organizationWizardConfig)

  return (
    <div className="space-y-4">
      <Link to="/dossiers/organizations" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground min-h-11">
        <ChevronLeft className="h-4 w-4 me-1" />
        {t('organization.back_to_list')}
      </Link>
      <h1 className="text-lg font-semibold">{t('organization.page_title')}</h1>
      <CreateWizardShell wizard={wizard}>
        <SharedBasicInfoStep form={wizard.form} dossierType="organization" />
        <OrgDetailsStep form={wizard.form} />
        <OrganizationReviewStep form={wizard.form} onEditStep={wizard.setCurrentStep} />
      </CreateWizardShell>
    </div>
  )
}
```

### Topic Inline Theme Category Approach

```typescript
// TopicBasicInfoStep -- wraps SharedBasicInfoStep and appends theme_category select
function TopicBasicInfoStep({ form }: { form: UseFormReturn<TopicFormData> }): ReactElement {
  const { t } = useTranslation('form-wizard')
  return (
    <>
      <SharedBasicInfoStep form={form} dossierType="topic" />
      {/* Theme category inline below shared fields */}
      <div className="mt-6">
        <FormField
          control={form.control}
          name="theme_category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('topic.theme_category')}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="min-h-11">
                    <SelectValue placeholder={t('topic.theme_category_ph')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {['policy', 'technical', 'strategic', 'operational'].map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {t(`topic.categories.${cat}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  )
}
```

### List Page Create Button Update

```typescript
// Source: countries/index.tsx pattern [VERIFIED: codebase]
// Change from: <Link to="/dossiers/create">
// Change to:   <Link to="/dossiers/organizations/create">
<Button asChild className="min-h-11 min-w-11 w-full sm:w-auto">
  <Link to="/dossiers/organizations/create">
    <Plus className="h-4 w-4 me-2" />
    {t('action.create')}
  </Link>
</Button>
```

## State of the Art

| Old Approach                         | Current Approach                                | When Changed       | Impact                       |
| ------------------------------------ | ----------------------------------------------- | ------------------ | ---------------------------- |
| Monolithic `/dossiers/create` wizard | Type-specific wizards per list page             | Phase 26-27 (v5.0) | Each type has tailored steps |
| Separate hook per wizard             | Generic `useCreateDossierWizard<T>` with config | Phase 26           | Zero duplication             |

## Assumptions Log

| #   | Claim                                                                                                                                                                                      | Section             | Risk if Wrong                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------- | ----------------------------------------------------------------------------------------------- |
| A1  | Person photo_url in wizard is a URL text input with preview, not an actual file upload to Supabase Storage                                                                                 | Pitfall 3           | If user expects file upload, need to add Supabase Storage integration and change the field type |
| A2  | `headquarters_en`/`headquarters_ar` should map to `address_en`/`address_ar` in OrganizationExtension                                                                                       | Pitfall 2           | Data might not display correctly on detail pages if field mapping is wrong                      |
| A3  | `founding_date` in the wizard schema maps to `established_date` in OrganizationExtension                                                                                                   | Pitfall 1           | Data loss if backend expects a different field name                                             |
| A4  | Topic theme category uses the 4 enum values from schema (policy/technical/strategic/operational), not the expanded list suggested in D-discretion (Security, Trade, Human Rights, Climate) | Claude's Discretion | Enum mismatch with schema if expanded list is used -- would need schema update                  |

## Open Questions

1. **Topic theme category values**
   - What we know: Schema defines `['policy', 'technical', 'strategic', 'operational']`. Claude's discretion note suggests "Security, Trade, Human Rights, Climate, etc."
   - What's unclear: Whether the existing 4 enum values are sufficient or if the categories should be expanded.
   - Recommendation: Use the existing 4 enum values from the schema. Expanding would require schema change, defaults change, and i18n additions. Can be enhanced later.

2. **Person photo: URL input vs file upload**
   - What we know: D-03 says "simple file picker with thumbnail preview." Schema stores `photo_url` as string URL. `PersonExtension` stores `photo_url`.
   - What's unclear: Whether "file picker" means actual file upload to storage or a URL input.
   - Recommendation: Implement as URL text input with `<img>` preview. Actual file upload would require Supabase Storage integration which is out of scope for a "simple" wizard. The detail page can add full upload later.

3. **Organization headquarters field mapping**
   - What we know: Wizard schema has `headquarters_en`/`headquarters_ar`. API has `address_en`/`address_ar` and `headquarters_country_id` (UUID).
   - What's unclear: Which API fields the wizard text inputs should map to.
   - Recommendation: Map to `address_en`/`address_ar` in filterExtensionData. The `headquarters_country_id` is a UUID reference that can be set from the detail page later.

## Validation Architecture

### Test Framework

| Property           | Value                                               |
| ------------------ | --------------------------------------------------- |
| Framework          | Vitest                                              |
| Config file        | `frontend/vitest.config.ts`                         |
| Quick run command  | `cd frontend && pnpm vitest run --reporter=verbose` |
| Full suite command | `pnpm test`                                         |

### Phase Requirements -> Test Map

| Req ID  | Behavior                                | Test Type   | Automated Command                                                                                 | File Exists? |
| ------- | --------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------- | ------------ |
| ORG-01  | Org wizard 3-step flow                  | integration | `cd frontend && pnpm vitest run src/components/dossier/wizard/config/organization.config.test.ts` | Wave 0       |
| ORG-02  | Org Details captures 5 fields           | unit        | `cd frontend && pnpm vitest run src/components/dossier/wizard/steps/OrgDetailsStep.test.tsx`      | Wave 0       |
| ORG-03  | Create button on org list page          | integration | `cd frontend && pnpm vitest run src/routes/_protected/dossiers/organizations/index.test.tsx`      | Wave 0       |
| TOPC-01 | Topic wizard 2-step flow                | integration | `cd frontend && pnpm vitest run src/components/dossier/wizard/config/topic.config.test.ts`        | Wave 0       |
| TOPC-02 | Theme category inline in BasicInfo      | unit        | `cd frontend && pnpm vitest run src/components/dossier/wizard/steps/TopicBasicInfoStep.test.tsx`  | Wave 0       |
| TOPC-03 | Create button on topics list page       | integration | `cd frontend && pnpm vitest run src/routes/_protected/dossiers/topics/index.test.tsx`             | Wave 0       |
| PRSN-01 | Person wizard 3-step flow               | integration | `cd frontend && pnpm vitest run src/components/dossier/wizard/config/person.config.test.ts`       | Wave 0       |
| PRSN-02 | Person Details captures title/photo/bio | unit        | `cd frontend && pnpm vitest run src/components/dossier/wizard/steps/PersonDetailsStep.test.tsx`   | Wave 0       |
| PRSN-03 | Create button on persons list page      | integration | `cd frontend && pnpm vitest run src/routes/_protected/dossiers/persons/index.test.tsx`            | Wave 0       |

### Sampling Rate

- **Per task commit:** `cd frontend && pnpm vitest run --reporter=verbose`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] Config test files for each type (verify schema, defaults, steps array, filterExtensionData)
- [ ] Step component test files (render fields, validate inputs)
- [ ] List page test files (verify Create button link target)

## Project Constraints (from CLAUDE.md)

- **RTL-first**: All form fields must use logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`). Arabic text inputs need `dir` prop. No `textAlign: "right"`.
- **Mobile-first**: Base styles for 320px+, then `sm:`, `md:`, `lg:` breakpoints. Min 44x44px touch targets.
- **HeroUI v3 component hierarchy**: Check HeroUI -> Aceternity -> Kibo -> shadcn. Existing wrappers in `components/ui/`.
- **No semicolons**: `"semi": false` in prettier config.
- **Single quotes**: `"singleQuote": true`.
- **Explicit return types**: Required on all functions.
- **No `any`**: Error-level enforcement.
- **i18n**: All user-visible strings via `useTranslation`. Both `en` and `ar` JSON files must be updated.

## Sources

### Primary (HIGH confidence)

- `frontend/src/components/dossier/wizard/config/country.config.ts` -- Config pattern
- `frontend/src/components/dossier/wizard/schemas/*.schema.ts` -- All type schemas
- `frontend/src/components/dossier/wizard/defaults/index.ts` -- Defaults for all types
- `frontend/src/components/dossier/wizard/hooks/useCreateDossierWizard.ts` -- Generic hook
- `frontend/src/components/dossier/wizard/review/CountryReviewStep.tsx` -- Review pattern
- `frontend/src/components/dossier/wizard/steps/CountryDetailsStep.tsx` -- Details step pattern
- `frontend/src/routes/_protected/dossiers/countries/create.tsx` -- Route page pattern
- `frontend/src/routes/_protected/dossiers/countries/index.tsx` -- List page Create button pattern
- `frontend/src/services/dossier-api.ts` -- Extension type definitions
- `frontend/src/i18n/en/form-wizard.json` -- Existing i18n keys

### Secondary (MEDIUM confidence)

- `frontend/src/routes/_protected/dossiers/organizations/index.tsx` -- Org list page (needs Create button URL fix)
- `frontend/src/routes/_protected/dossiers/topics/index.tsx` -- Topics list page
- `frontend/src/routes/_protected/dossiers/persons/index.tsx` -- Persons list page

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- all libraries already installed, patterns verified in codebase
- Architecture: HIGH -- exact replication of country wizard pattern
- Pitfalls: HIGH -- identified through schema/API type comparison

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (stable patterns, no external dependencies)
