# Phase 27: Country Wizard - Pattern Map

**Mapped:** 2026-04-15
**Files analyzed:** 7 new/modified files
**Analogs found:** 7 / 7

## File Classification

| New/Modified File                                                     | Role      | Data Flow        | Closest Analog                                                   | Match Quality |
| --------------------------------------------------------------------- | --------- | ---------------- | ---------------------------------------------------------------- | ------------- |
| `frontend/src/routes/_protected/dossiers/countries/create.tsx`        | route     | request-response | `frontend/src/routes/_protected/dossiers/create.tsx`             | role-match    |
| `frontend/src/components/dossier/wizard/config/country.config.ts`     | config    | transform        | `frontend/src/components/dossier/wizard/defaults/index.ts`       | role-match    |
| `frontend/src/components/dossier/wizard/steps/CountryDetailsStep.tsx` | component | request-response | `frontend/src/components/dossier/wizard/SharedBasicInfoStep.tsx` | exact         |
| `frontend/src/components/dossier/wizard/review/CountryReviewStep.tsx` | component | request-response | `frontend/src/components/dossier/wizard/SharedBasicInfoStep.tsx` | role-match    |
| `frontend/src/components/dossier/wizard/hooks/useCountryAutoFill.ts`  | hook      | request-response | `frontend/src/hooks/useDossierNameSimilarity.ts`                 | role-match    |
| `frontend/src/routes/_protected/dossiers/countries/index.tsx`         | route     | CRUD             | self (MODIFY)                                                    | exact         |
| `frontend/src/i18n/en/form-wizard.json` + `ar/form-wizard.json`       | config    | transform        | self (MODIFY)                                                    | exact         |

---

## Pattern Assignments

### `frontend/src/routes/_protected/dossiers/countries/create.tsx` (route, request-response)

**Analog:** `frontend/src/routes/_protected/dossiers/create.tsx` (for route shell) +
`frontend/src/components/dossier/wizard/hooks/useCreateDossierWizard.ts` (for composition pattern)

**Route declaration pattern** — copy the `createFileRoute` call verbatim, adjusting path:

```typescript
// Analog: frontend/src/routes/_protected/dossiers/create.tsx lines 8-13
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/dossiers/countries/create')({
  component: CreateCountryPage,
})
```

**Page component pattern** — inline component (not a separate page file), uses hook + shell:

```typescript
// Pattern from RESEARCH.md §Code Examples (confirmed against useCreateDossierWizard.ts)
import type { ReactElement } from 'react'
import { useCreateDossierWizard } from '@/components/dossier/wizard/hooks/useCreateDossierWizard'
import { CreateWizardShell } from '@/components/dossier/wizard/CreateWizardShell'
import { SharedBasicInfoStep } from '@/components/dossier/wizard/SharedBasicInfoStep'
import { CountryDetailsStep } from '@/components/dossier/wizard/steps/CountryDetailsStep'
import { CountryReviewStep } from '@/components/dossier/wizard/review/CountryReviewStep'
import { countryWizardConfig } from '@/components/dossier/wizard/config/country.config'
import type { CountryFormData } from '@/components/dossier/wizard/schemas/country.schema'

function CreateCountryPage(): ReactElement {
  const wizard = useCreateDossierWizard<CountryFormData>(countryWizardConfig)
  return (
    <CreateWizardShell wizard={wizard}>
      <SharedBasicInfoStep form={wizard.form} dossierType="country" />
      <CountryDetailsStep form={wizard.form} />
      <CountryReviewStep form={wizard.form} onEditStep={wizard.setCurrentStep} />
    </CreateWizardShell>
  )
}
```

---

### `frontend/src/components/dossier/wizard/config/country.config.ts` (config, transform)

**Analog:** `frontend/src/components/dossier/wizard/defaults/index.ts` (for `countryDefaults` shape) + `frontend/src/components/dossier/wizard/config/types.ts` (for `WizardConfig<T>` interface)

**WizardConfig<T> interface** (types.ts lines 10-17):

```typescript
export interface WizardConfig<T extends FieldValues> {
  type: DossierType
  schema: ZodSchema<T>
  defaultValues: T
  steps: WizardStepConfig[]
  filterExtensionData: (data: T) => DossierExtensionData | undefined
  onSuccess?: (dossierId: string, type: DossierType) => void
}
```

**countryDefaults shape** (defaults/index.ts lines 13-20) — use as `defaultValues`:

```typescript
const countryDefaults: CountryFormData = {
  ...baseDefaults,
  iso_code_2: '',
  iso_code_3: '',
  capital_en: '',
  capital_ar: '',
  region: '',
}
```

**Full config object to produce:**

```typescript
import { countrySchema, type CountryFormData } from '../schemas/country.schema'
import { getDefaultsForType } from '../defaults'
import type { WizardConfig } from './types'
import { Globe, FileText, CheckCircle } from 'lucide-react'

export const countryWizardConfig: WizardConfig<CountryFormData> = {
  type: 'country',
  schema: countrySchema,
  defaultValues: getDefaultsForType<CountryFormData>('country'),
  steps: [
    {
      id: 'basic',
      title: 'form-wizard:steps.basicInfo',
      description: 'form-wizard:steps.basicInfoDesc',
      icon: FileText,
    },
    {
      id: 'country-details',
      title: 'form-wizard:steps.countryDetails',
      description: 'form-wizard:steps.countryDetailsDesc',
      icon: Globe,
    },
    {
      id: 'review',
      title: 'form-wizard:steps.review',
      description: 'form-wizard:steps.reviewDesc',
      icon: CheckCircle,
    },
  ],
  filterExtensionData: (data: CountryFormData) => ({
    iso_code_2: data.iso_code_2 !== '' ? data.iso_code_2 : undefined,
    iso_code_3: data.iso_code_3 !== '' ? data.iso_code_3 : undefined,
    capital_en: data.capital_en !== '' ? data.capital_en : undefined,
    capital_ar: data.capital_ar !== '' ? data.capital_ar : undefined,
    region: data.region !== '' ? data.region : undefined,
  }),
}
```

**Note:** The i18n step keys (`form-wizard:steps.basicInfo`, etc.) do not yet exist in `en/form-wizard.json`. They must be added as part of this phase (see i18n section below).

---

### `frontend/src/components/dossier/wizard/steps/CountryDetailsStep.tsx` (component, request-response)

**Analog:** `frontend/src/components/dossier/wizard/SharedBasicInfoStep.tsx` — exact same patterns for FormWizardStep, FormField, grid layout, bilingual inputs, Select, `useDirection()`, `min-h-11`.

**Imports pattern** (SharedBasicInfoStep.tsx lines 1-33):

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
import type { CountryFormData } from '../schemas/country.schema'
```

**Step wrapper pattern** (SharedBasicInfoStep.tsx line 56):

```typescript
<FormWizardStep stepId="country-details" className="space-y-6">
```

**Bilingual two-column grid pattern** (SharedBasicInfoStep.tsx lines 68-125):

```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <FormField
    control={form.control}
    name="capital_en"
    render={({ field }) => (
      <FormItem>
        <FormLabel>{t('form-wizard:countryDetails.capitalEn')}</FormLabel>
        <FormControl>
          <Input {...field} placeholder="..." className="min-h-11" />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
  <FormField
    control={form.control}
    name="capital_ar"
    render={({ field }) => (
      <FormItem>
        <FormLabel>{t('form-wizard:countryDetails.capitalAr')}</FormLabel>
        <FormControl>
          <Input {...field} placeholder="..." className="min-h-11" dir={direction} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</div>
```

**Select (dropdown) pattern** (SharedBasicInfoStep.tsx lines 242-261):

```typescript
<Select onValueChange={field.onChange} defaultValue={field.value as string}>
  <FormControl>
    <SelectTrigger className="min-h-11">
      <SelectValue placeholder={t('form-wizard:countryDetails.selectRegion')} />
    </SelectTrigger>
  </FormControl>
  <SelectContent>
    <SelectItem value="asia">{t('form-wizard:regions.asia')}</SelectItem>
    <SelectItem value="africa">{t('form-wizard:regions.africa')}</SelectItem>
    <SelectItem value="europe">{t('form-wizard:regions.europe')}</SelectItem>
    <SelectItem value="americas">{t('form-wizard:regions.americas')}</SelectItem>
    <SelectItem value="oceania">{t('form-wizard:regions.oceania')}</SelectItem>
  </SelectContent>
</Select>
```

**ISO code field special handling** — `className="min-h-11 uppercase"` and `maxLength` (mirrors `abbreviation` field in SharedBasicInfoStep.tsx lines 133-145):

```typescript
<Input {...field} className="min-h-11 uppercase" maxLength={2} />
```

**Props interface:**

```typescript
interface CountryDetailsStepProps {
  form: UseFormReturn<CountryFormData>
}
```

---

### `frontend/src/components/dossier/wizard/review/CountryReviewStep.tsx` (component, request-response)

**Analog:** `frontend/src/components/dossier/wizard/SharedBasicInfoStep.tsx` — same FormWizardStep wrapper, same `useTranslation`, same `useDirection` usage. No exact review step exists yet — this is the first.

**Step wrapper** (stepId must match config):

```typescript
<FormWizardStep stepId="review" className="space-y-4">
```

**form.watch() for live values** (critical — not getValues, per RESEARCH.md Pitfall 5):

```typescript
const values = form.watch()
```

**Review section card pattern** (from RESEARCH.md §Pattern 3):

```typescript
interface ReviewSectionProps {
  title: string
  onEdit: () => void
  children: React.ReactNode
}

function ReviewSection({ title, onEdit, children }: ReviewSectionProps): ReactElement {
  const { t } = useTranslation('form-wizard')
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-base">{title}</h3>
        <Button variant="ghost" size="sm" onClick={onEdit} className="min-h-11 min-w-11">
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

**Props interface:**

```typescript
interface CountryReviewStepProps {
  form: UseFormReturn<CountryFormData>
  onEditStep: (step: number) => void
}
```

**Usage:**

```typescript
<ReviewSection title={t('form-wizard:steps.basicInfo')} onEdit={() => onEditStep(0)}>
  {/* name_en, name_ar, abbreviation, description summary */}
</ReviewSection>
<ReviewSection title={t('form-wizard:steps.countryDetails')} onEdit={() => onEditStep(1)}>
  {/* iso_code_2, iso_code_3, region, capital_en, capital_ar */}
</ReviewSection>
```

---

### `frontend/src/components/dossier/wizard/hooks/useCountryAutoFill.ts` (hook, request-response)

**Analog:** `frontend/src/hooks/useDossierNameSimilarity.ts` — same pattern: `useQuery` from TanStack Query, debounced enabled condition (`nameEn.length >= 3`), `useEffect` to react to query result.

**Imports pattern** (useDossierNameSimilarity.ts lines 1-12):

```typescript
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { CountryFormData } from '../schemas/country.schema'
```

**Query pattern** (useDossierNameSimilarity.ts lines 8-10 — STALE_TIME import):

```typescript
import { STALE_TIME } from '@/lib/query-tiers'
// Use STALE_TIME.REFERENCE (5 min) for reference data
```

**Core hook structure** (mirrors useDossierNameSimilarity pattern):

```typescript
export function useCountryAutoFill(nameEn: string, form: UseFormReturn<CountryFormData>): void {
  const { data: match } = useQuery({
    queryKey: ['country-reference', nameEn],
    queryFn: () => fetchCountryReference(nameEn),
    enabled: nameEn.length >= 3,
    staleTime: STALE_TIME.REFERENCE,
  })

  useEffect(() => {
    if (match == null) return
    const current = form.getValues()
    // Only fill fields still at empty default — never overwrite user edits
    if (current.iso_code_2 === '') form.setValue('iso_code_2', match.code ?? '')
    if (current.iso_code_3 === '') form.setValue('iso_code_3', match.code3 ?? '')
    if (current.region === '') form.setValue('region', match.region ?? '')
    if (current.capital_en === '') form.setValue('capital_en', match.capital_en ?? '')
    if (current.capital_ar === '') form.setValue('capital_ar', match.capital_ar ?? '')
  }, [match, form])
}
```

**Return type:** `void` — side-effect only hook, no return value needed.

**fetchCountryReference helper** — calls `GET /api/countries?search=<nameEn>&limit=1`. At implementation time verify the response shape against the actual endpoint in `backend/src/api/countries.ts` (see RESEARCH.md Open Question 2).

---

### `frontend/src/routes/_protected/dossiers/countries/index.tsx` (MODIFY — route, CRUD)

**Analog:** self — modify the existing "Create Country" button in `CountriesListPage`.

**Current pattern** (index.tsx lines 99-105) — two occurrences to update:

```typescript
// CURRENT (line 100):
<Link to="/dossiers/create">

// REPLACE WITH:
<Link to="/dossiers/countries/create">
```

**Both button locations to change:**

1. `PageHeader actions` prop — line 100: `<Link to="/dossiers/create">`
2. Empty state CTA — line 186: `<Link to="/dossiers/create">`

No other changes to this file.

---

### `frontend/src/i18n/en/form-wizard.json` + `ar/form-wizard.json` (MODIFY — config, transform)

**Analog:** `frontend/src/i18n/en/form-wizard.json` (self) — extend with new keys only, never remove existing keys.

**Current file structure** (form-wizard.json lines 1-39) shows flat keys + nested `validation`, `progress` objects.

**Keys to add to `en/form-wizard.json`:**

```json
{
  "steps": {
    "basicInfo": "Basic Information",
    "basicInfoDesc": "Enter the country's name and general details",
    "countryDetails": "Country Details",
    "countryDetailsDesc": "Enter ISO codes, region, and capital",
    "review": "Review",
    "reviewDesc": "Review and confirm all details"
  },
  "countryDetails": {
    "isoCode2": "ISO Alpha-2",
    "isoCode3": "ISO Alpha-3",
    "isoCode2Placeholder": "e.g. SA",
    "isoCode3Placeholder": "e.g. SAU",
    "region": "Region",
    "selectRegion": "Select region",
    "capitalEn": "Capital (English)",
    "capitalAr": "Capital (Arabic)",
    "capitalEnPlaceholder": "e.g. Riyadh",
    "capitalArPlaceholder": "e.g. الرياض"
  },
  "regions": {
    "asia": "Asia",
    "africa": "Africa",
    "europe": "Europe",
    "americas": "Americas",
    "oceania": "Oceania"
  },
  "review": {
    "edit": "Edit"
  }
}
```

**Keys to add to `ar/form-wizard.json`** (Arabic equivalents — same key structure):

```json
{
  "steps": {
    "basicInfo": "المعلومات الأساسية",
    "basicInfoDesc": "أدخل اسم الدولة والتفاصيل العامة",
    "countryDetails": "تفاصيل الدولة",
    "countryDetailsDesc": "أدخل رموز ISO والمنطقة والعاصمة",
    "review": "مراجعة",
    "reviewDesc": "راجع وأكد جميع التفاصيل"
  },
  "countryDetails": {
    "isoCode2": "رمز ISO ألفا-2",
    "isoCode3": "رمز ISO ألفا-3",
    "isoCode2Placeholder": "مثال: SA",
    "isoCode3Placeholder": "مثال: SAU",
    "region": "المنطقة",
    "selectRegion": "اختر المنطقة",
    "capitalEn": "العاصمة (بالإنجليزية)",
    "capitalAr": "العاصمة (بالعربية)",
    "capitalEnPlaceholder": "مثال: Riyadh",
    "capitalArPlaceholder": "مثال: الرياض"
  },
  "regions": {
    "asia": "آسيا",
    "africa": "أفريقيا",
    "europe": "أوروبا",
    "americas": "الأمريكتان",
    "oceania": "أوقيانوسيا"
  },
  "review": {
    "edit": "تعديل"
  }
}
```

---

## Shared Patterns

### RTL Direction on Arabic Inputs

**Source:** `frontend/src/components/dossier/wizard/SharedBasicInfoStep.tsx` lines 116-120
**Apply to:** All `<Input>` and `<Textarea>` for Arabic fields in CountryDetailsStep and CountryReviewStep

```typescript
const { direction } = useDirection()
// ...
<Input {...field} className="min-h-11" dir={direction} />
```

### Touch Targets

**Source:** `frontend/src/components/dossier/wizard/SharedBasicInfoStep.tsx` lines 89, 137, 247
**Apply to:** All interactive elements

```typescript
className = 'min-h-11' // inputs
className = 'min-h-11 min-w-11' // buttons
```

### FormWizardStep Wrapper

**Source:** `frontend/src/components/dossier/wizard/SharedBasicInfoStep.tsx` line 56
**Apply to:** CountryDetailsStep, CountryReviewStep — each must be wrapped in `<FormWizardStep stepId="...">` where `stepId` matches the config step `id`.

### i18n Hook

**Source:** `frontend/src/components/dossier/wizard/SharedBasicInfoStep.tsx` line 52
**Apply to:** CountryDetailsStep, CountryReviewStep, countryWizardConfig

```typescript
const { t } = useTranslation(['dossier', 'form-wizard'])
```

### No Explicit `any`, Explicit Return Types

**Source:** `CLAUDE.md` — ESLint rules enforced
**Apply to:** All new files — every exported function must declare return type (`ReactElement`, `void`, etc.)

### Logical CSS Properties (RTL-safe)

**Source:** `CLAUDE.md` Web/Tailwind RTL section
**Apply to:** All new components — use `me-*`, `ms-*`, `ps-*`, `pe-*`, `text-start`, `text-end` never `ml-*`, `mr-*`, `text-left`, `text-right`

---

## No Analog Found

None — all files have sufficient analogs in the codebase.

---

## Metadata

**Analog search scope:** `frontend/src/components/dossier/wizard/`, `frontend/src/routes/_protected/dossiers/`, `frontend/src/hooks/`, `frontend/src/i18n/`
**Files scanned:** 12 source files read directly
**Pattern extraction date:** 2026-04-15
