# Phase 28: Simple Type Wizards - Pattern Map

**Mapped:** 2026-04-16
**Files analyzed:** 15 new/modified files
**Analogs found:** 15 / 15

## File Classification

| New/Modified File                                                          | Role      | Data Flow        | Closest Analog                  | Match Quality |
| -------------------------------------------------------------------------- | --------- | ---------------- | ------------------------------- | ------------- |
| `frontend/src/components/dossier/wizard/config/organization.config.ts`     | config    | request-response | `config/country.config.ts`      | exact         |
| `frontend/src/components/dossier/wizard/config/topic.config.ts`            | config    | request-response | `config/country.config.ts`      | exact         |
| `frontend/src/components/dossier/wizard/config/person.config.ts`           | config    | request-response | `config/country.config.ts`      | exact         |
| `frontend/src/components/dossier/wizard/steps/OrgDetailsStep.tsx`          | component | request-response | `steps/CountryDetailsStep.tsx`  | exact         |
| `frontend/src/components/dossier/wizard/steps/PersonDetailsStep.tsx`       | component | request-response | `steps/CountryDetailsStep.tsx`  | exact         |
| `frontend/src/components/dossier/wizard/steps/TopicBasicInfoStep.tsx`      | component | request-response | `steps/CountryDetailsStep.tsx`  | role-match    |
| `frontend/src/components/dossier/wizard/review/OrganizationReviewStep.tsx` | component | request-response | `review/CountryReviewStep.tsx`  | exact         |
| `frontend/src/components/dossier/wizard/review/TopicReviewStep.tsx`        | component | request-response | `review/CountryReviewStep.tsx`  | exact         |
| `frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx`       | component | request-response | `review/CountryReviewStep.tsx`  | exact         |
| `frontend/src/routes/_protected/dossiers/organizations/create.tsx`         | route     | request-response | `dossiers/countries/create.tsx` | exact         |
| `frontend/src/routes/_protected/dossiers/topics/create.tsx`                | route     | request-response | `dossiers/countries/create.tsx` | exact         |
| `frontend/src/routes/_protected/dossiers/persons/create.tsx`               | route     | request-response | `dossiers/countries/create.tsx` | exact         |
| `frontend/src/components/dossier/wizard/schemas/organization.schema.ts`    | model     | transform        | (self -- extend existing)       | exact         |
| `frontend/src/routes/_protected/dossiers/organizations/index.tsx`          | route     | request-response | `dossiers/countries/index.tsx`  | exact         |
| `frontend/src/routes/_protected/dossiers/topics/index.tsx`                 | route     | request-response | `dossiers/countries/index.tsx`  | exact         |
| `frontend/src/routes/_protected/dossiers/persons/index.tsx`                | route     | request-response | `dossiers/countries/index.tsx`  | exact         |

## Pattern Assignments

### Config Files: `organization.config.ts`, `topic.config.ts`, `person.config.ts`

**Analog:** `frontend/src/components/dossier/wizard/config/country.config.ts` (lines 1-34)

**Imports pattern** (lines 1-4):

```typescript
import type { WizardConfig } from './types'
import type { CountryFormData } from '../schemas/country.schema'
import { countrySchema } from '../schemas/country.schema'
import { getDefaultsForType } from '../defaults'
```

**Core config pattern** (lines 6-34):

```typescript
export const countryWizardConfig: WizardConfig<CountryFormData> = {
  type: 'country',
  schema: countrySchema,
  defaultValues: getDefaultsForType<CountryFormData>('country'),
  steps: [
    {
      id: 'basic',
      title: 'form-wizard:steps.basicInfo',
      description: 'form-wizard:steps.basicInfoDesc',
    },
    {
      id: 'country-details',
      title: 'form-wizard:steps.countryDetails',
      description: 'form-wizard:steps.countryDetailsDesc',
    },
    {
      id: 'review',
      title: 'form-wizard:steps.review',
      description: 'form-wizard:steps.reviewDesc',
    },
  ],
  filterExtensionData: (data: CountryFormData) => ({
    iso_code_2:
      data.iso_code_2 != null && data.iso_code_2 !== '' ? data.iso_code_2.toUpperCase() : undefined,
    iso_code_3:
      data.iso_code_3 != null && data.iso_code_3 !== '' ? data.iso_code_3.toUpperCase() : undefined,
    capital_en: data.capital_en !== '' ? data.capital_en : undefined,
    capital_ar: data.capital_ar !== '' ? data.capital_ar : undefined,
    region: data.region !== '' ? data.region : undefined,
  }),
}
```

**Adaptation notes:**

- Topic config has only 2 steps (basic + review) -- no details step. See D-08.
- Organization `filterExtensionData` must map `founding_date` -> `established_date` and `headquarters_en`/`headquarters_ar` -> `address_en`/`address_ar`. See RESEARCH.md Pitfall 1-2.
- Person config uses `person_subtype: 'standard'` default from defaults/index.ts line 43.

---

### Details Step Components: `OrgDetailsStep.tsx`, `PersonDetailsStep.tsx`

**Analog:** `frontend/src/components/dossier/wizard/steps/CountryDetailsStep.tsx` (lines 1-152)

**Imports pattern** (lines 1-23):

```typescript
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import type { UseFormReturn } from 'react-hook-form'

import { FormWizardStep } from '@/components/ui/form-wizard'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDirection } from '@/hooks/useDirection'
```

**Props interface pattern** (lines 25-27):

```typescript
interface CountryDetailsStepProps {
  form: UseFormReturn<CountryFormData>
}
```

**FormField with Input pattern** (lines 43-60):

```typescript
<FormField
  control={form.control}
  name="iso_code_2"
  render={({ field }) => (
    <FormItem>
      <FormLabel>{t('form-wizard:country.iso_code_2')}</FormLabel>
      <FormControl>
        <Input
          {...field}
          maxLength={2}
          className="min-h-11 uppercase font-mono"
          placeholder={t('form-wizard:country.iso_code_2_ph')}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Select dropdown pattern** (lines 84-107):

```typescript
<FormField
  control={form.control}
  name="region"
  render={({ field }) => (
    <FormItem>
      <FormLabel>{t('form-wizard:country.region')}</FormLabel>
      <Select onValueChange={field.onChange} value={field.value as string}>
        <FormControl>
          <SelectTrigger className="min-h-11">
            <SelectValue placeholder={t('form-wizard:country.region_ph')} />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {REGIONS.map((region) => (
            <SelectItem key={region} value={region}>
              {t(`form-wizard:regions.${region}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Bilingual field pair pattern** (lines 110-149):

```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  {/* EN field */}
  <FormField control={form.control} name="capital_en" render={({ field }) => (
    <FormItem>
      <FormLabel>{t('form-wizard:country.capital_en')}</FormLabel>
      <FormControl>
        <Input {...field} className="min-h-11" placeholder={t('form-wizard:country.capital_en_ph')} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )} />
  {/* AR field -- note dir={direction} */}
  <FormField control={form.control} name="capital_ar" render={({ field }) => (
    <FormItem>
      <FormLabel>{t('form-wizard:country.capital_ar')}</FormLabel>
      <FormControl>
        <Input {...field} className="min-h-11" dir={direction} placeholder={t('form-wizard:country.capital_ar_ph')} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )} />
</div>
```

**RTL handling** (line 33-34):

```typescript
const { direction } = useDirection()
```

Applied to Arabic-language inputs via `dir={direction}` prop.

**Adaptation notes:**

- OrgDetailsStep: No auto-fill hook (unlike Country which uses `useCountryAutoFill`). D-05 says manual entry only.
- OrgDetailsStep: 5 fields -- `org_type` (Select), `org_code` (Input), `website` (Input type="url"), `headquarters_en`/`headquarters_ar` (bilingual pair), `founding_date` (Input type="date").
- PersonDetailsStep: 3 fields -- `title_en`/`title_ar` (bilingual Input pair, free-text per D-02), `photo_url` (Input type="url" with optional `<img>` preview), `biography_en`/`biography_ar` (bilingual Textarea pair).
- PersonDetailsStep needs `import { Textarea } from '@/components/ui/textarea'` for biography fields.

---

### Topic Inline Step: `TopicBasicInfoStep.tsx`

**Analog:** `frontend/src/components/dossier/wizard/SharedBasicInfoStep.tsx` (wraps it) + `steps/CountryDetailsStep.tsx` (Select pattern)

**Core pattern** -- wraps SharedBasicInfoStep and appends theme_category:

```typescript
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import type { UseFormReturn } from 'react-hook-form'
import { SharedBasicInfoStep } from '../SharedBasicInfoStep'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TopicFormData } from '../schemas/topic.schema'

const THEME_CATEGORIES = ['policy', 'technical', 'strategic', 'operational'] as const

export function TopicBasicInfoStep({ form }: { form: UseFormReturn<TopicFormData> }): ReactElement {
  // Renders SharedBasicInfoStep + theme_category Select inline below
}
```

**Adaptation notes:**

- This component renders `<SharedBasicInfoStep>` as its first child, then adds the theme_category Select below it (not inside a FormWizardStep -- SharedBasicInfoStep already provides that).
- Uses same Select pattern from CountryDetailsStep lines 84-107.
- Enum values from schema: `['policy', 'technical', 'strategic', 'operational']`.

---

### Review Step Components: `OrganizationReviewStep.tsx`, `TopicReviewStep.tsx`, `PersonReviewStep.tsx`

**Analog:** `frontend/src/components/dossier/wizard/review/CountryReviewStep.tsx` (lines 1-160)

**Imports pattern** (lines 8-15):

```typescript
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import type { UseFormReturn } from 'react-hook-form'
import { Pencil } from 'lucide-react'

import { FormWizardStep } from '@/components/ui/form-wizard'
import { Button } from '@/components/ui/button'
```

**ReviewSection helper** (lines 21-48):

```typescript
interface ReviewSectionProps {
  title: string
  onEdit: () => void
  children: React.ReactNode
}

function ReviewSection({ title, onEdit, children }: ReviewSectionProps): ReactElement {
  const { t } = useTranslation('form-wizard')
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="min-h-11 min-w-11 text-accent-foreground"
        >
          <Pencil className="h-4 w-4 me-1" />
          {t('review.edit')}
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        {children}
      </div>
    </div>
  )
}
```

**ReviewField helper** (lines 50-68):

```typescript
interface ReviewFieldProps {
  label: string
  value: string | undefined
}

function ReviewField({ label, value }: ReviewFieldProps): ReactElement {
  return (
    <div className="space-y-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">
        {value !== undefined && value !== '' ? (
          value
        ) : (
          <span className="text-muted-foreground italic">--</span>
        )}
      </dd>
    </div>
  )
}
```

**Main component props pattern** (lines 74-77):

```typescript
interface CountryReviewStepProps {
  form: UseFormReturn<CountryFormData>
  onEditStep: (step: number) => void
}
```

**Live data via watch pattern** (line 83):

```typescript
const values = form.watch()
```

**Review sections composition** (lines 100-158):

```typescript
<FormWizardStep stepId="review" className="space-y-4">
  <ReviewSection title={t('form-wizard:review.basic_info')} onEdit={() => onEditStep(0)}>
    <ReviewField label={t('dossier:form.nameEn')} value={values.name_en} />
    {/* ... more fields */}
  </ReviewSection>
  <ReviewSection title={t('form-wizard:review.country_details')} onEdit={() => onEditStep(1)}>
    {/* type-specific fields */}
  </ReviewSection>
</FormWizardStep>
```

**Adaptation notes:**

- TopicReviewStep: Only 1 ReviewSection (Basic Info) since there's no details step. Include `theme_category` in the Basic Info section. `onEditStep(0)` for Basic Info edit.
- OrganizationReviewStep: 2 ReviewSections. Basic Info `onEditStep(0)`, Org Details `onEditStep(1)`. Display translated `org_type` via `t('form-wizard:organization.org_types.${values.org_type}')`.
- PersonReviewStep: 2 ReviewSections. Basic Info `onEditStep(0)`, Person Details `onEditStep(1)`. Show photo_url as thumbnail `<img>` if present. Truncate biography for display.

---

### Route Files: `organizations/create.tsx`, `topics/create.tsx`, `persons/create.tsx`

**Analog:** `frontend/src/routes/_protected/dossiers/countries/create.tsx` (lines 1-45)

**Full route pattern** (lines 1-45):

```typescript
import type { ReactElement } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'

import { useCreateDossierWizard } from '@/components/dossier/wizard/hooks/useCreateDossierWizard'
import { CreateWizardShell } from '@/components/dossier/wizard/CreateWizardShell'
import { SharedBasicInfoStep } from '@/components/dossier/wizard/SharedBasicInfoStep'
// + type-specific step and review imports
// + config and schema type imports

export const Route = createFileRoute('/_protected/dossiers/{type}/create')({
  component: Create{Type}Page,
})

function Create{Type}Page(): ReactElement {
  const { t } = useTranslation('form-wizard')
  const wizard = useCreateDossierWizard<{Type}FormData>({type}WizardConfig)

  return (
    <div className="space-y-4">
      <Link
        to="/dossiers/{type}"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground min-h-11"
      >
        <ChevronLeft className="h-4 w-4 me-1" />
        {t('{type}.back_to_list')}
      </Link>
      <h1 className="text-lg font-semibold">{t('{type}.page_title')}</h1>
      <CreateWizardShell wizard={wizard}>
        <SharedBasicInfoStep form={wizard.form} dossierType="{type}" />
        {/* Type-specific steps here */}
        <{Type}ReviewStep form={wizard.form} onEditStep={wizard.setCurrentStep} />
      </CreateWizardShell>
    </div>
  )
}
```

**Adaptation notes:**

- Topic route: Only 2 children in CreateWizardShell -- `TopicBasicInfoStep` (replaces SharedBasicInfoStep) + `TopicReviewStep`. No middle details step.
- Organization route: 3 children -- `SharedBasicInfoStep` + `OrgDetailsStep` + `OrganizationReviewStep`.
- Person route: 3 children -- `SharedBasicInfoStep` + `PersonDetailsStep` + `PersonReviewStep`.

---

### List Page Modifications: `organizations/index.tsx`, `topics/index.tsx`, `persons/index.tsx`

**Analog:** `frontend/src/routes/_protected/dossiers/countries/index.tsx` (lines 99-104, 185-189)

**Create button in PageHeader** (lines 99-104):

```typescript
<Button asChild className="min-h-11 min-w-11 w-full sm:w-auto">
  <Link to="/dossiers/countries/create">
    <Plus className="h-4 w-4 me-2" />
    {t('action.create')}
  </Link>
</Button>
```

**Empty state Create button** (lines 185-189):

```typescript
<Button asChild>
  <Link to="/dossiers/countries/create">{t('action.create')}</Link>
</Button>
```

**Current state of target files (needs update):**

- All three list pages currently link to `/dossiers/create` (old monolithic wizard).
- Must change to `/dossiers/organizations/create`, `/dossiers/topics/create`, `/dossiers/persons/create` respectively.
- Two locations per file: PageHeader action button (line ~87) and empty-state button (line ~150).

---

### Schema Extension: `organization.schema.ts`

**Analog:** Self (extend existing file)

**Current state** (lines 1-16):

```typescript
import * as z from 'zod'
import { baseDossierSchema } from './base.schema'

const organizationFields = z.object({
  org_type: z.enum(['government', 'ngo', 'private', 'international', 'academic']).optional(),
  org_code: z.string().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  headquarters_en: z.string().optional(),
  headquarters_ar: z.string().optional(),
})
```

**Modification needed:** Add `founding_date: z.string().optional().or(z.literal(''))` to `organizationFields`. This maps to `established_date` in `filterExtensionData` (see RESEARCH.md Pitfall 1).

---

## Shared Patterns

### FormWizardStep Wrapper

**Source:** `frontend/src/components/ui/form-wizard` (imported in all step components)
**Apply to:** All step and review components

```typescript
<FormWizardStep stepId="step-id-matching-config" className="space-y-6">
  {/* step content */}
</FormWizardStep>
```

The `stepId` must match the `id` in the config's `steps` array.

### RTL Direction for Arabic Inputs

**Source:** `frontend/src/hooks/useDirection` (used in CountryDetailsStep line 33)
**Apply to:** OrgDetailsStep (`headquarters_ar`), PersonDetailsStep (`title_ar`, `biography_ar`)

```typescript
const { direction } = useDirection()
// On Arabic-language inputs:
<Input {...field} dir={direction} />
<Textarea {...field} dir={direction} />
```

### Touch-Friendly Sizing

**Source:** All existing wizard components
**Apply to:** All new components

- All `<Input>`, `<SelectTrigger>`: `className="min-h-11"`
- All `<Button>`: `className="min-h-11 min-w-11"`

### i18n Namespace

**Source:** All wizard components use `form-wizard` namespace
**Apply to:** All new components

```typescript
const { t } = useTranslation(['form-wizard'])
// or with multiple namespaces for review:
const { t } = useTranslation(['form-wizard', 'dossier'])
```

### Empty String to Undefined Filtering

**Source:** `country.config.ts` filterExtensionData (lines 27-33)
**Apply to:** All config filterExtensionData functions

```typescript
// Pattern: convert empty strings to undefined before sending to API
field_name: data.field_name !== '' ? data.field_name : undefined,
```

## No Analog Found

| File   | Role | Data Flow | Reason                                                             |
| ------ | ---- | --------- | ------------------------------------------------------------------ |
| (none) | --   | --        | All files have exact or role-match analogs from the country wizard |

## Metadata

**Analog search scope:** `frontend/src/components/dossier/wizard/`, `frontend/src/routes/_protected/dossiers/`
**Files scanned:** 20+
**Pattern extraction date:** 2026-04-16
