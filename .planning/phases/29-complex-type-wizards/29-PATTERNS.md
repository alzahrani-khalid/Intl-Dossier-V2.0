# Phase 29: Complex Type Wizards - Pattern Map

**Mapped:** 2026-04-16
**Files analyzed:** 32 (17 new + 15 modified/tests)
**Analogs found:** 30 / 32 (93%) — the 3 wizard configs, 4 details steps, 3 review steps, 3 routes, and 6 test files all have direct Phase 27/28 precedents. Only EngagementParticipantsStep (3-section multi-select layout) and the multi-select branch of DossierPicker lack a one-to-one analog.

---

## File Classification

### Configs (new)

| New File                                                                | Role          | Data Flow        | Closest Analog                                                         | Match                     |
| ----------------------------------------------------------------------- | ------------- | ---------------- | ---------------------------------------------------------------------- | ------------------------- |
| `frontend/src/components/dossier/wizard/config/forum.config.ts`         | wizard-config | request-response | `frontend/src/components/dossier/wizard/config/organization.config.ts` | exact                     |
| `frontend/src/components/dossier/wizard/config/working-group.config.ts` | wizard-config | request-response | `frontend/src/components/dossier/wizard/config/organization.config.ts` | exact                     |
| `frontend/src/components/dossier/wizard/config/engagement.config.ts`    | wizard-config | request-response | `frontend/src/components/dossier/wizard/config/country.config.ts`      | role-match (4 steps vs 3) |

### Detail Steps (new)

| New File                                                                      | Role      | Data Flow                 | Closest Analog                                                                                                                | Match   |
| ----------------------------------------------------------------------------- | --------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------- |
| `frontend/src/components/dossier/wizard/steps/ForumDetailsStep.tsx`           | component | form-input                | `frontend/src/components/dossier/wizard/steps/OrgDetailsStep.tsx`                                                             | exact   |
| `frontend/src/components/dossier/wizard/steps/WorkingGroupDetailsStep.tsx`    | component | form-input                | `frontend/src/components/dossier/wizard/steps/OrgDetailsStep.tsx` (+ `PersonDetailsStep.tsx` for stacked bilingual textareas) | exact   |
| `frontend/src/components/dossier/wizard/steps/EngagementDetailsStep.tsx`      | component | form-input                | `frontend/src/components/dossier/wizard/steps/OrgDetailsStep.tsx` (founding_date line 144-160 = date-picker pattern)          | exact   |
| `frontend/src/components/dossier/wizard/steps/EngagementParticipantsStep.tsx` | component | form-input (array fields) | Composite: `OrgDetailsStep.tsx` (FormWizardStep skeleton) + `DossierPicker.tsx` (multi-select mode per D-01)                  | partial |

### Review Steps (new)

| New File                                                                   | Role      | Data Flow | Closest Analog                                                                                                                  | Match      |
| -------------------------------------------------------------------------- | --------- | --------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `frontend/src/components/dossier/wizard/review/ForumReviewStep.tsx`        | component | read-only | `frontend/src/components/dossier/wizard/review/OrganizationReviewStep.tsx`                                                      | exact      |
| `frontend/src/components/dossier/wizard/review/WorkingGroupReviewStep.tsx` | component | read-only | `frontend/src/components/dossier/wizard/review/OrganizationReviewStep.tsx`                                                      | exact      |
| `frontend/src/components/dossier/wizard/review/EngagementReviewStep.tsx`   | component | read-only | `frontend/src/components/dossier/wizard/review/OrganizationReviewStep.tsx` (+ chip-count rendering for participants subsection) | role-match |

### Schemas (modify)

| File                                                                     | Role   | Data Flow  | Closest Analog                                                                                           | Match      |
| ------------------------------------------------------------------------ | ------ | ---------- | -------------------------------------------------------------------------------------------------------- | ---------- |
| `frontend/src/components/dossier/wizard/schemas/forum.schema.ts`         | schema | validation | `frontend/src/components/dossier/wizard/schemas/country.schema.ts`                                       | exact      |
| `frontend/src/components/dossier/wizard/schemas/working-group.schema.ts` | schema | validation | `frontend/src/components/dossier/wizard/schemas/country.schema.ts`                                       | exact      |
| `frontend/src/components/dossier/wizard/schemas/engagement.schema.ts`    | schema | validation | `frontend/src/components/dossier/wizard/schemas/country.schema.ts` (adds array fields + date refinement) | role-match |

### Routes (new)

| New File                                                            | Role  | Data Flow        | Closest Analog                                                     | Match |
| ------------------------------------------------------------------- | ----- | ---------------- | ------------------------------------------------------------------ | ----- |
| `frontend/src/routes/_protected/dossiers/forums/create.tsx`         | route | request-response | `frontend/src/routes/_protected/dossiers/organizations/create.tsx` | exact |
| `frontend/src/routes/_protected/dossiers/working_groups/create.tsx` | route | request-response | `frontend/src/routes/_protected/dossiers/organizations/create.tsx` | exact |
| `frontend/src/routes/_protected/dossiers/engagements/create.tsx`    | route | request-response | `frontend/src/routes/_protected/dossiers/organizations/create.tsx` | exact |

### List Pages (modify)

| File                                                               | Role  | Data Flow   | Closest Analog                                                    | Match |
| ------------------------------------------------------------------ | ----- | ----------- | ----------------------------------------------------------------- | ----- |
| `frontend/src/routes/_protected/dossiers/forums/index.tsx`         | route | CRUD (list) | `frontend/src/routes/_protected/dossiers/organizations/index.tsx` | exact |
| `frontend/src/routes/_protected/dossiers/working_groups/index.tsx` | route | CRUD (list) | `frontend/src/routes/_protected/dossiers/organizations/index.tsx` | exact |
| `frontend/src/routes/_protected/dossiers/engagements/index.tsx`    | route | CRUD (list) | `frontend/src/routes/_protected/dossiers/organizations/index.tsx` | exact |

### Multi-Select Extension (modify)

| File                                                      | Role      | Data Flow        | Closest Analog                                                                  | Match       |
| --------------------------------------------------------- | --------- | ---------------- | ------------------------------------------------------------------------------- | ----------- |
| `frontend/src/components/work-creation/DossierPicker.tsx` | component | request-response | self (single-select path lines 113-395 is the reference; add `multiple` branch) | self-extend |

### Migrations (new)

| New File                                                                       | Role      | Data Flow            | Closest Analog                                                                                                                                                | Match      |
| ------------------------------------------------------------------------------ | --------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `supabase/migrations/YYYYMMDDHHMMSS_phase29_wg_parent_body.sql`                | migration | schema               | `supabase/migrations/20260110000006_working_groups_entity.sql` lines 12-23                                                                                    | exact      |
| `supabase/migrations/YYYYMMDDHHMMSS_phase29_ensure_forums_organizing_body.sql` | migration | schema (conditional) | `supabase/migrations/20260110000006_working_groups_entity.sql` lines 12-17 (ADD COLUMN IF NOT EXISTS pattern) wrapped in `DO $$` from RESEARCH §2 Migration B | role-match |

### i18n (modify)

| File                                    | Role   | Data Flow | Closest Analog                                             | Match       |
| --------------------------------------- | ------ | --------- | ---------------------------------------------------------- | ----------- |
| `frontend/src/i18n/en/form-wizard.json` | config | static    | self lines 39-60 (existing flat key convention — per A-07) | self-extend |
| `frontend/src/i18n/ar/form-wizard.json` | config | static    | self (mirror EN additions)                                 | self-extend |

### Tests (new)

| New File                                                                                     | Role | Data Flow | Closest Analog                                                                                                                | Match       |
| -------------------------------------------------------------------------------------------- | ---- | --------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `frontend/src/components/dossier/wizard/steps/__tests__/ForumDetailsStep.test.tsx`           | test | —         | `frontend/src/components/dossier/wizard/steps/__tests__/CountryDetailsStep.test.tsx`                                          | exact       |
| `frontend/src/components/dossier/wizard/steps/__tests__/WorkingGroupDetailsStep.test.tsx`    | test | —         | same                                                                                                                          | exact       |
| `frontend/src/components/dossier/wizard/steps/__tests__/EngagementDetailsStep.test.tsx`      | test | —         | same                                                                                                                          | exact       |
| `frontend/src/components/dossier/wizard/steps/__tests__/EngagementParticipantsStep.test.tsx` | test | —         | same (+ DossierPicker mock)                                                                                                   | role-match  |
| `frontend/src/components/dossier/wizard/review/__tests__/ForumReviewStep.test.tsx`           | test | —         | `frontend/src/components/dossier/wizard/review/__tests__/OrganizationReviewStep.test.tsx` (assumed present — mirror Phase 28) | exact       |
| `frontend/src/components/dossier/wizard/review/__tests__/WorkingGroupReviewStep.test.tsx`    | test | —         | same                                                                                                                          | exact       |
| `frontend/src/components/dossier/wizard/review/__tests__/EngagementReviewStep.test.tsx`      | test | —         | same                                                                                                                          | exact       |
| `frontend/src/components/work-creation/__tests__/DossierPicker.test.tsx`                     | test | —         | self-extend (single-select suite; add multi-select cases)                                                                     | self-extend |

---

## Pattern Assignments

### 1. `frontend/src/components/dossier/wizard/config/forum.config.ts` (NEW)

**Analog:** `frontend/src/components/dossier/wizard/config/organization.config.ts` (lines 1-36)

**Imports pattern** (lines 1-4):

```ts
import type { WizardConfig } from './types'
import type { OrganizationFormData } from '../schemas/organization.schema'
import { organizationSchema } from '../schemas/organization.schema'
import { getDefaultsForType } from '../defaults'
```

**Config shape** (lines 6-35):

```ts
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
    address_en: data.headquarters_en !== '' ? data.headquarters_en : undefined,
    address_ar: data.headquarters_ar !== '' ? data.headquarters_ar : undefined,
    established_date: data.founding_date !== '' ? data.founding_date : undefined,
  }),
}
```

**Deltas vs analog:**

- `type: 'forum'`, import `forumSchema` + `ForumFormData`
- Step id `'forum-details'`; i18n keys `steps.forumDetails` + `steps.forumDetailsDesc`
- `filterExtensionData` maps wizard field `organizing_body_id` → DB column `organizing_body` (strip empty string to `undefined`); optionally `forum_type` if exposed

---

### 2. `frontend/src/components/dossier/wizard/config/working-group.config.ts` (NEW)

**Analog:** `frontend/src/components/dossier/wizard/config/organization.config.ts` (same structure as above)

**Deltas:**

- `type: 'working_group'`, `workingGroupSchema`, `WorkingGroupFormData`
- Step id `'wg-details'`; i18n `steps.workingGroupDetails` / `steps.workingGroupDetailsDesc`
- `filterExtensionData` maps `wg_status`, `established_date`, `mandate_en`, `mandate_ar`, `parent_body_id` (wizard fields) → DB column names (`status`, `established_date`, `mandate_en`, `mandate_ar`, `parent_body_id`). Status enum per A-03: `active | inactive | pending | suspended`.

---

### 3. `frontend/src/components/dossier/wizard/config/engagement.config.ts` (NEW)

**Analog:** `frontend/src/components/dossier/wizard/config/country.config.ts` (lines 10-26 — 3-step shape to be extended with a 4th step)

**Country config steps skeleton** (lines 10-26):

```ts
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
  { id: 'review', title: 'form-wizard:steps.review', description: 'form-wizard:steps.reviewDesc' },
]
```

**Deltas:**

- Add 4th step: insert `{ id: 'engagement-participants', title: 'form-wizard:steps.participants', description: 'form-wizard:steps.participantsDesc' }` between details and review.
- `filterExtensionData` maps engagement fields to `engagement_type`, `engagement_category`, `location_en`, `location_ar`, `start_date`, `end_date` (all required per A-02).
- Participants arrays (`participant_country_ids`, `participant_organization_ids`, `participant_person_ids`) are NOT in `filterExtensionData` (they go to `engagement_participants` table via post-create insert per RESEARCH §6).
- Requires a `postCreate` hook on `useCreateDossierWizard` to insert participants rows — planner must add if not already present.

---

### 4. `frontend/src/components/dossier/wizard/steps/ForumDetailsStep.tsx` (NEW)

**Analog:** `frontend/src/components/dossier/wizard/steps/OrgDetailsStep.tsx` (lines 1-163)

**Imports + header** (lines 1-32):

```tsx
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import type { UseFormReturn } from 'react-hook-form'

import { FormWizardStep } from '@/components/ui/form-wizard'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDirection } from '@/hooks/useDirection'
import type { OrganizationFormData } from '../schemas/organization.schema'

interface OrgDetailsStepProps {
  form: UseFormReturn<OrganizationFormData>
}

const ORG_TYPES = ['government', 'ngo', 'private', 'international', 'academic'] as const

export function OrgDetailsStep({ form }: OrgDetailsStepProps): ReactElement {
  const { t } = useTranslation(['form-wizard'])
  const { direction } = useDirection()
```

**Select-dropdown FormField pattern** (lines 37-60):

```tsx
<FormField
  control={form.control}
  name="org_type"
  render={({ field }) => (
    <FormItem>
      <FormLabel>{t('form-wizard:organization.org_type')}</FormLabel>
      <Select onValueChange={field.onChange} value={field.value as string}>
        <FormControl>
          <SelectTrigger className="min-h-11">
            <SelectValue placeholder={t('form-wizard:organization.org_type_ph')} />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {ORG_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {t(`form-wizard:organization.org_types.${type}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Deltas for ForumDetailsStep:**

- Props: `UseFormReturn<ForumFormData>`
- Single `FormField` for `organizing_body_id` — replace the `<Select>` above with the existing single-select `DossierPicker`:
  ```tsx
  <DossierPicker
    value={field.value}
    onChange={(id) => field.onChange(id ?? '')}
    filterByDossierType="organization"
    placeholder={t('form-wizard:forum.organizingBody_ph')}
  />
  ```
- No required validation (D-10 optional).
- Import path: `@/components/work-creation/DossierPicker`.

---

### 5. `frontend/src/components/dossier/wizard/steps/WorkingGroupDetailsStep.tsx` (NEW)

**Analog:** `frontend/src/components/dossier/wizard/steps/OrgDetailsStep.tsx` (select dropdown lines 37-60 + date input lines 144-160 + bilingual pair grid lines 102-141)

**Date input pattern** (lines 144-160 of OrgDetailsStep):

```tsx
<FormField
  control={form.control}
  name="founding_date"
  render={({ field }) => (
    <FormItem>
      <FormLabel>{t('form-wizard:organization.founding_date')}</FormLabel>
      <FormControl>
        <Input {...field} type="date" className="min-h-11" />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Bilingual pair grid** (lines 102-141 OrgDetailsStep):

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <FormField control={form.control} name="headquarters_en" render={/* ... */} />
  <FormField
    control={form.control}
    name="headquarters_ar"
    render={({ field }) => (
      <FormItem>
        <FormLabel>{t('form-wizard:organization.headquarters_ar')}</FormLabel>
        <FormControl>
          <Input {...field} className="min-h-11" dir={direction} placeholder={/* ar_ph */} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</div>
```

**Bilingual stacked textareas** — use `PersonDetailsStep.tsx` biography pattern (lines 175-212):

```tsx
<FormField control={form.control} name="biography_en" render={({ field }) => (
  <FormItem>
    <FormLabel>{t('form-wizard:person.biography_en')}</FormLabel>
    <FormControl>
      <Textarea {...field} className="min-h-[88px]" placeholder={/* ... */} />
    </FormControl>
    <FormMessage />
  </FormItem>
)} />
<FormField control={form.control} name="biography_ar" render={({ field }) => (
  <FormItem>
    <FormLabel>{t('form-wizard:person.biography_ar')}</FormLabel>
    <FormControl>
      <Textarea {...field} className="min-h-[88px]" dir={direction} placeholder={/* ... */} />
    </FormControl>
    <FormMessage />
  </FormItem>
)} />
```

**Deltas for WorkingGroupDetailsStep:**

- `WG_STATUSES = ['active', 'inactive', 'pending', 'suspended'] as const` (per A-03). Render Select on `wg_status` field.
- `established_date` — Input type="date" (copy lines 144-160 verbatim, rename to `established_date`). Optional.
- `mandate_en` / `mandate_ar` — stacked (NOT grid) per D-16. Use `Textarea` from `@/components/ui/textarea`; Arabic gets `dir={direction}` (Note: CLAUDE.md says use `writingDirection: 'rtl'` for RN, but on web the established pattern is `dir={direction}` from `useDirection()` — see OrgDetailsStep line 133).
- `parent_body_id` — single-select `DossierPicker` with `filterByDossierType="organization"` (per D-12). Optional.

---

### 6. `frontend/src/components/dossier/wizard/steps/EngagementDetailsStep.tsx` (NEW)

**Analog:** `frontend/src/components/dossier/wizard/steps/OrgDetailsStep.tsx` (select + date + bilingual pair patterns as above)

**Deltas:**

- `ENGAGEMENT_TYPES` tuple per A-01/D-13 (10 values — see RESEARCH §1.2).
- `ENGAGEMENT_CATEGORIES = ['diplomatic', 'statistical', 'technical', 'economic', 'cultural', 'educational', 'research', 'other'] as const` per A-01.
- Two required date inputs (`start_date`, `end_date`) per A-02. Add Zod refinement at schema level: `.refine((d) => !d.end_date || !d.start_date || d.end_date >= d.start_date, { message: 'validation.end_after_start', path: ['end_date'] })`.
- Bilingual location pair (`location_en` + `location_ar`) using the same `grid grid-cols-1 sm:grid-cols-2 gap-4` pattern from OrgDetailsStep lines 102-141.
- No DossierPicker in this step (participants are step 3).

---

### 7. `frontend/src/components/dossier/wizard/steps/EngagementParticipantsStep.tsx` (NEW)

**Primary analog:** `frontend/src/components/dossier/wizard/steps/OrgDetailsStep.tsx` (FormWizardStep wrapper pattern lines 34-35, 161-162) + `DossierPicker.tsx` (for multi-select usage — see pattern 10 below).

**Skeleton (adapted from OrgDetailsStep lines 30-35):**

```tsx
export function EngagementParticipantsStep({
  form,
}: {
  form: UseFormReturn<EngagementFormData>
}): ReactElement {
  const { t } = useTranslation(['form-wizard'])
  return (
    <FormWizardStep stepId="engagement-participants" className="space-y-6">
      {/* Three <fieldset>/<legend> sections */}
    </FormWizardStep>
  )
}
```

**Per-section fieldset pattern** (new — no verbatim analog; structure implied by D-05/D-08):

```tsx
<fieldset className="rounded-lg border border-border p-4 space-y-3">
  <legend className="text-sm font-semibold px-2">
    {t('form-wizard:engagement.participants.countries')}
  </legend>
  <FormField
    control={form.control}
    name="participant_country_ids"
    render={({ field }) => (
      <FormItem>
        <FormControl>
          <DossierPicker
            multiple
            values={field.value ?? []}
            onValuesChange={(ids) => field.onChange(ids)}
            filterByDossierType="country"
            placeholder={t('form-wizard:engagement.participants.country_ph')}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</fieldset>
```

Repeat for `participant_organization_ids` (filter `"organization"`) and `participant_person_ids` (filter `"person"`).

**Deltas:**

- No required validation (D-06).
- Chip horizontal scroll is handled **inside** DossierPicker in multi-select mode — this step only orchestrates three sections.
- i18n keys: `engagement.participants.{countries,organizations,persons,sectionHint}` per A-07 flat convention.

---

### 8. `frontend/src/components/dossier/wizard/review/ForumReviewStep.tsx` (NEW)

**Analog:** `frontend/src/components/dossier/wizard/review/OrganizationReviewStep.tsx` (lines 1-105)

**Full-file skeleton** (OrganizationReviewStep lines 8-48):

```tsx
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import type { UseFormReturn } from 'react-hook-form'

import { FormWizardStep } from '@/components/ui/form-wizard'
import type { OrganizationFormData } from '../schemas/organization.schema'
import { ReviewSection, ReviewField } from './ReviewComponents'

interface OrganizationReviewStepProps {
  form: UseFormReturn<OrganizationFormData>
  onEditStep: (step: number) => void
}

export function OrganizationReviewStep({
  form,
  onEditStep,
}: OrganizationReviewStepProps): ReactElement {
  const { t } = useTranslation(['form-wizard', 'dossier'])
  const values = form.watch() // CRITICAL: watch() not getValues()
  // ...
  return (
    <FormWizardStep stepId="review" className="space-y-4">
      <ReviewSection title={t('form-wizard:review.basic_info')} onEdit={() => onEditStep(0)}>
        <ReviewField label={t('dossier:form.nameEn')} value={values.name_en} />
        {/* ... */}
      </ReviewSection>
      <ReviewSection title={t('form-wizard:review.org_details')} onEdit={() => onEditStep(1)}>
        <ReviewField label={t('form-wizard:organization.org_type')} value={orgTypeDisplay} />
        {/* ... */}
      </ReviewSection>
    </FormWizardStep>
  )
}
```

**Deltas for ForumReviewStep:**

- `t('form-wizard:review.forum_details')`; two sections — Basic Info + Forum Details.
- `onEditStep(1)` jumps to ForumDetailsStep.
- Display the organizing-body dossier name (not ID): the wizard must carry `selectedDossier` info forward OR use a lookup hook. Simpler: show the ID and let the executor add a name-resolver refinement if UI review shows IDs are too cryptic — tag as tech-debt.

---

### 9. `frontend/src/components/dossier/wizard/review/WorkingGroupReviewStep.tsx` + `EngagementReviewStep.tsx` (NEW)

**Analog:** same as ForumReviewStep (OrganizationReviewStep.tsx)

**EngagementReviewStep deltas (4 sections, 3 edit jumps):**

- Section 1 `onEditStep(0)` — Basic Info
- Section 2 `onEditStep(1)` — Engagement Details (type, category, location_en/ar, start_date, end_date)
- Section 3 `onEditStep(2)` — Participants (3 subsections displayed as chip **counts**, e.g. `{count} selected`):
  ```tsx
  <ReviewField
    label={t('form-wizard:engagement.participants.countries')}
    value={(values.participant_country_ids?.length ?? 0).toString()}
  />
  ```

**ReviewSection + ReviewField are shared** — imported from `./ReviewComponents` (see `frontend/src/components/dossier/wizard/review/ReviewComponents.tsx` lines 23-44 for `ReviewSection`; lines 55-68 for `ReviewField`).

---

### 10. `frontend/src/components/work-creation/DossierPicker.tsx` (MODIFY — multi-select extension)

**Self-analog:** same file, single-select path (lines 113-395).

**Current single-select props** (lines 53-67):

```ts
export interface DossierPickerProps {
  value?: string
  onChange: (dossierId: string | null, dossier?: DossierOption) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  selectedDossier?: DossierOption
  filterByDossierType?: DossierType
  allowQuickAdd?: boolean
  onQuickAdd?: (searchQuery: string) => void
}
```

**Current single-select selected-chip render block** (lines 210-229) — to be branched for multi-select:

```tsx
{
  selectedDossier && (
    <div className="flex items-center gap-2 p-3 mb-2 rounded-lg border bg-muted/50">
      {Icon && <Icon className="size-4 text-muted-foreground shrink-0" />}
      <span className="flex-1 text-sm font-medium truncate">{displayName}</span>
      <Badge variant="outline" className="text-xs">
        {selectedDossier.type}
      </Badge>
      <Button type="button" variant="ghost" size="sm" className="size-6 p-0" onClick={handleClear}>
        <X className="size-3" />
      </Button>
    </div>
  )
}
```

**Current handleSelect** (lines 182-192):

```ts
const handleSelect = useCallback(
  (dossier: DossierOption) => {
    setSelectedDossier(dossier)
    addRecentDossier(dossier)
    setRecentDossiers(getRecentDossiers())
    onChange(dossier.id, dossier)
    setOpen(false)
    setSearchQuery('')
  },
  [onChange],
)
```

**Current debounced-search effect** (lines 149-180) — `filterByDossierType` is passed straight to `autocompleteDossiers({ dossierType: filterByDossierType })` on line 161. Phase 29 does NOT require API-side array support (three separate single-type pickers), so the widened type `DossierType | DossierType[]` can be passed through with `Array.isArray(x) ? x[0] : x` until Phase 30+.

**Current recents filter** (line 357):

```tsx
.filter((d) => !filterByDossierType || d.type === filterByDossierType)
```

Widen to:

```tsx
.filter((d) => {
  if (!filterByDossierType) return true
  const types = Array.isArray(filterByDossierType) ? filterByDossierType : [filterByDossierType]
  return types.includes(d.type)
})
```

**New props to add** (per D-01):

```ts
multiple?: boolean
values?: string[]
onValuesChange?: (ids: string[], dossiers: DossierOption[]) => void
selectedDossiers?: DossierOption[]
```

**Widen existing prop** (per D-03):

```ts
filterByDossierType?: DossierType | DossierType[]
```

**Multi-select branch — chip row** (new — replaces the single-chip block above when `multiple`):

```tsx
{
  multiple && (selectedDossiers ?? []).length > 0 && (
    <div className="flex flex-row flex-nowrap gap-2 overflow-x-auto py-2 mb-2">
      {selectedDossiers!.map((d) => {
        const Icon = getDossierTypeIcon(d.type)
        const name = isRTL ? d.name_ar || d.name_en : d.name_en
        return (
          <Badge
            key={d.id}
            variant="outline"
            className="shrink-0 flex items-center gap-1 min-h-8 px-2"
          >
            <Icon className="size-3" />
            <span className="truncate max-w-[120px]">{name}</span>
            <button
              type="button"
              onClick={() => handleRemove(d.id)}
              className="min-h-6 min-w-6 flex items-center justify-center"
              aria-label={t('form.remove', 'Remove')}
            >
              <X className="size-3" />
            </button>
          </Badge>
        )
      })}
    </div>
  )
}
```

**Multi-select handleSelect:**

```ts
const handleSelect = useCallback(
  (dossier: DossierOption) => {
    if (isMulti) {
      if ((values ?? []).includes(dossier.id)) return // dedupe
      const nextIds = [...(values ?? []), dossier.id]
      const nextDossiers = [...(selectedDossiers ?? []), dossier]
      addRecentDossier(dossier)
      setRecentDossiers(getRecentDossiers())
      onValuesChange?.(nextIds, nextDossiers)
      setSearchQuery('')
      // keep popover OPEN for rapid multi-pick
      return
    }
    // existing single-select path unchanged
  },
  [isMulti, values, selectedDossiers, onValuesChange, onChange],
)
```

**CommandItem `Check` indicator** (lines 307-313) — widen:

```tsx
const isSelected = isMulti
  ? (values ?? []).includes(dossier.id)
  : value === dossier.id
<Check className={cn('size-4 shrink-0', isRTL ? 'ms-2' : 'me-2', isSelected ? 'opacity-100' : 'opacity-0')} />
```

**RTL note:** horizontal-scroll chip row automatically flips with `dir="rtl"` on the parent — no extra logic needed. `ms-*` / `me-*` logical props preserve start/end semantics.

**Secondary analog for chip UX:** `frontend/src/components/positions/PositionDossierLinker.tsx` lines 18-96 (uses `Plus` / `X` / `Badge` with `ms-2` / `me-2` pattern). PositionDossierLinker uses Cards not inline chips — adopt its icon + remove button pattern but not its card layout.

---

### 11. Route files (NEW — 3 files)

**Analog:** `frontend/src/routes/_protected/dossiers/organizations/create.tsx` (lines 1-45, full file)

**Full-file template:**

```tsx
import type { ReactElement } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'

import { useCreateDossierWizard } from '@/components/dossier/wizard/hooks/useCreateDossierWizard'
import { CreateWizardShell } from '@/components/dossier/wizard/CreateWizardShell'
import { SharedBasicInfoStep } from '@/components/dossier/wizard/SharedBasicInfoStep'
import { OrgDetailsStep } from '@/components/dossier/wizard/steps/OrgDetailsStep'
import { OrganizationReviewStep } from '@/components/dossier/wizard/review/OrganizationReviewStep'
import { organizationWizardConfig } from '@/components/dossier/wizard/config/organization.config'
import type { OrganizationFormData } from '@/components/dossier/wizard/schemas/organization.schema'

export const Route = createFileRoute('/_protected/dossiers/organizations/create')({
  component: CreateOrganizationPage,
})

function CreateOrganizationPage(): ReactElement {
  const { t } = useTranslation('form-wizard')
  const wizard = useCreateDossierWizard<OrganizationFormData>(organizationWizardConfig)

  return (
    <div className="space-y-4">
      <Link
        to="/dossiers/organizations"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground min-h-11"
      >
        <ChevronLeft className="h-4 w-4 me-1" />
        {t('organization.back_to_list', 'Back to Organizations')}
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

**Deltas per wizard:**

| Target                    | Path literal                                 | Imports                                                                                                                       | Children passed to CreateWizardShell                                                                      |
| ------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| forums/create.tsx         | `/_protected/dossiers/forums/create`         | `forumWizardConfig`, `ForumDetailsStep`, `ForumReviewStep`, `ForumFormData`                                                   | SharedBasicInfo + ForumDetailsStep + ForumReviewStep                                                      |
| working_groups/create.tsx | `/_protected/dossiers/working_groups/create` | `workingGroupWizardConfig`, `WorkingGroupDetailsStep`, `WorkingGroupReviewStep`, `WorkingGroupFormData`                       | SharedBasicInfo + WGDetailsStep + WGReviewStep                                                            |
| engagements/create.tsx    | `/_protected/dossiers/engagements/create`    | `engagementWizardConfig`, `EngagementDetailsStep`, `EngagementParticipantsStep`, `EngagementReviewStep`, `EngagementFormData` | SharedBasicInfo + EngagementDetailsStep + EngagementParticipantsStep + EngagementReviewStep (4 children!) |

**Back-link `to`** per route: `/dossiers/forums`, `/dossiers/working_groups`, `/dossiers/engagements`. Back-link label i18n: `forum.back_to_list`, `workingGroup.back_to_list`, `engagement.back_to_list`.

**Route-tree regen:** Vite restart or `@tanstack/router-plugin` auto-runs on file add (Phase 28 precedent).

---

### 12. List-page Create-button integration (MODIFY — 3 files)

**Analog:** `frontend/src/routes/_protected/dossiers/organizations/index.tsx` lines 81-93

**Canonical Create-button excerpt:**

```tsx
<PageHeader
  icon={<Building2 className="h-6 w-6" />}
  title={t('type.organization')}
  subtitle={t('typeDescription.organization')}
  actions={
    <Button asChild className="min-h-11 min-w-11 w-full sm:w-auto">
      <Link to="/dossiers/organizations/create">
        <Plus className="h-4 w-4 me-2" />
        {t('action.create')}
      </Link>
    </Button>
  }
/>
```

**Empty-state secondary Create button** (lines 148-152):

```tsx
{
  !searchQuery && (
    <Button asChild>
      <Link to="/dossiers/organizations/create">{t('action.create')}</Link>
    </Button>
  )
}
```

**Current broken state in forums/index.tsx (lines 85-92):** Links to `/dossiers/create` — wrong. Must change to `/dossiers/forums/create`.

**Deltas per list page:**

| File                     | Icon                                    | Current `to` (broken/missing) | New `to`                          |
| ------------------------ | --------------------------------------- | ----------------------------- | --------------------------------- |
| forums/index.tsx         | `MessageSquare` (already imported)      | `/dossiers/create` (line 87)  | `/dossiers/forums/create`         |
| working_groups/index.tsx | verify icon import (Users / UsersRound) | (likely same broken pattern)  | `/dossiers/working_groups/create` |
| engagements/index.tsx    | verify icon import                      | (likely same broken pattern)  | `/dossiers/engagements/create`    |

Also update empty-state secondary button if present in each file (mirrors organizations/index.tsx lines 148-152).

---

### 13. Migration files (NEW)

**Analog:** `supabase/migrations/20260110000006_working_groups_entity.sql` lines 12-23

**Analog ADD COLUMN pattern:**

```sql
ALTER TABLE working_groups
ADD COLUMN IF NOT EXISTS parent_forum_id UUID REFERENCES forums(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS description_en TEXT,
...;

COMMENT ON COLUMN working_groups.parent_forum_id IS 'Reference to parent forum dossier if working group belongs to a forum';
```

**Phase 29 Migration A** (`YYYYMMDDHHMMSS_phase29_wg_parent_body.sql`) — mirror pattern exactly (per A-04):

```sql
ALTER TABLE public.working_groups
  ADD COLUMN IF NOT EXISTS parent_body_id UUID NULL
    REFERENCES public.dossiers(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.working_groups.parent_body_id IS
  'Organization dossier that owns/hosts this working group (Phase 29)';

CREATE INDEX IF NOT EXISTS idx_working_groups_parent_body_id
  ON public.working_groups(parent_body_id)
  WHERE parent_body_id IS NOT NULL;
```

**Phase 29 Migration B** (`YYYYMMDDHHMMSS_phase29_ensure_forums_organizing_body.sql`) — conditional wrapper per A-05:

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'forums' AND column_name = 'organizing_body'
  ) THEN
    ALTER TABLE public.forums
      ADD COLUMN organizing_body UUID NULL
        REFERENCES public.organizations(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_forums_organizing_body
      ON public.forums(organizing_body)
      WHERE organizing_body IS NOT NULL;
  END IF;
END $$;
```

**Deltas:** Migration A is unconditional (`IF NOT EXISTS` on ADD COLUMN is safe). Migration B uses `DO $$ ... END $$` to be idempotent against existing column. Per CLAUDE.md user instruction, **apply both via Supabase MCP** (not CLI) in the parent orchestrator session (subagents lack DB MCP per MEMORY.md).

---

### 14. Schema modifications

**Analog:** `frontend/src/components/dossier/wizard/schemas/country.schema.ts` lines 1-14 (full file):

```ts
import * as z from 'zod'
import { baseDossierSchema } from './base.schema'

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

**Deltas per schema file (all already scaffolded, extend in place):**

**forum.schema.ts** — already correct. Keep as-is (field set matches D-09/D-10).

**working-group.schema.ts** — align enum per A-03:

```ts
wg_status: z.enum(['active', 'inactive', 'pending', 'suspended']).optional(),
established_date: z.string().optional().or(z.literal('')),
mandate_en: z.string().optional(),
mandate_ar: z.string().optional(),
parent_body_id: z.string().uuid().optional().or(z.literal('')),
```

**engagement.schema.ts** — align per A-01/A-02 (must reject the current `participant_ids` array in favor of three typed arrays):

```ts
const engagementFields = z.object({
  engagement_type: z.enum([
    'bilateral_meeting',
    'mission',
    'delegation',
    'summit',
    'working_group',
    'roundtable',
    'official_visit',
    'consultation',
    'forum_session',
    'other',
  ]),
  engagement_category: z.enum([
    'diplomatic',
    'statistical',
    'technical',
    'economic',
    'cultural',
    'educational',
    'research',
    'other',
  ]),
  location_en: z.string().optional(),
  location_ar: z.string().optional(),
  start_date: z.string().min(1), // required per A-02
  end_date: z.string().min(1),
  participant_country_ids: z.array(z.string().uuid()).default([]),
  participant_organization_ids: z.array(z.string().uuid()).default([]),
  participant_person_ids: z.array(z.string().uuid()).default([]),
})

export const engagementSchema = baseDossierSchema
  .merge(engagementFields)
  .refine((d) => !d.end_date || !d.start_date || d.end_date >= d.start_date, {
    message: 'form-wizard:validation.end_after_start',
    path: ['end_date'],
  })
```

**Breaking change note:** removing `participant_ids` + adding the 3 typed arrays will require planner to audit any callers (grep `participant_ids` to confirm none).

---

### 15. i18n additions (MODIFY)

**Analog:** `frontend/src/i18n/en/form-wizard.json` lines 39-50 (`steps`) and lines 51-60 (`country.*` flat-key convention per A-07).

**Existing convention** (lines 39-60):

```json
"steps": {
  "basicInfo": "Basic Information",
  "basicInfoDesc": "Enter the country's name and general details",
  "countryDetails": "Country Details",
  "countryDetailsDesc": "ISO codes, region, and capital information",
  "orgDetails": "Organization Details",
  "orgDetailsDesc": "Enter organization-specific information",
  "personDetails": "Person Details",
  "personDetailsDesc": "Enter person-specific information",
  "review": "Review",
  "reviewDesc": "Review and confirm details"
},
"country": {
  "page_title": "New Country Dossier",
  "back_to_list": "Back to Countries",
  "iso_code_2": "ISO Alpha-2 Code",
  ...
}
```

**Additions to `steps.*`:**

```json
"forumDetails": "Forum Details",
"forumDetailsDesc": "Set the forum type and organizing body",
"workingGroupDetails": "Working Group Details",
"workingGroupDetailsDesc": "Status, mandate, and parent body",
"engagementDetails": "Engagement Details",
"engagementDetailsDesc": "Type, category, location, and dates",
"participants": "Participants",
"participantsDesc": "Link countries, organizations, and persons"
```

**New top-level flat groups** (mirror `country.*` shape):

```json
"forum": { "page_title": "...", "back_to_list": "...", "organizing_body": "...", "organizing_body_ph": "...", "organizing_body_hint": "..." },
"workingGroup": { "page_title": "...", "status": "...", "statuses": { "active": "Active", "inactive": "Inactive", "pending": "Pending", "suspended": "Suspended" }, "establishedDate": "...", "mandateEn": "...", "mandateAr": "...", "parentBody": "..." },
"engagement": { "page_title": "...", "engagementType": "...", "types": { "bilateral_meeting": "...", ... (10 entries) }, "category": "...", "categories": { "diplomatic": "...", ... (8 entries per A-01) }, "locationEn": "...", "locationAr": "...", "startDate": "...", "endDate": "...", "participants": { "countries": "...", "organizations": "...", "persons": "...", "sectionHint": "..." } },
"review": { "forum_details": "Forum Details", "working_group_details": "Working Group Details", "engagement_details": "Engagement Details", "participants_summary": "Participants" },
"validation": { "end_after_start": "End date must be on or after start date" }
```

**Arabic mirror:** same keys in `frontend/src/i18n/ar/form-wizard.json` with Unicode Arabic translations (per RESEARCH §7 table of enum labels).

---

### 16. Test files (NEW)

**Analog:** `frontend/src/components/dossier/wizard/steps/__tests__/CountryDetailsStep.test.tsx` lines 1-60

**Vitest + i18n + useDirection mock pattern** (lines 7-16):

```tsx
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))
vi.mock('@/hooks/useDirection', () => ({
  useDirection: () => ({ direction: 'ltr', isRTL: false }),
}))
```

**Form-wizard primitive mocks** (lines 18-43):

```tsx
vi.mock('@/components/ui/form-wizard', () => ({
  FormWizardStep: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/components/ui/form', () => ({
  FormControl: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FormField: ({
    render,
  }: {
    render: (props: { field: Record<string, unknown> }) => React.ReactNode
  }) =>
    render({
      field: { value: '', onChange: vi.fn(), onBlur: vi.fn(), name: 'test', ref: vi.fn() },
    }),
  FormItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FormLabel: ({ children }: { children: React.ReactNode }) => <label>{children}</label>,
  FormMessage: () => null,
}))
```

**Mock form factory** (lines 51-58):

```tsx
function createMockForm(): UseFormReturn<CountryFormData> {
  return {
    control: {} as UseFormReturn<CountryFormData>['control'],
    watch: vi.fn().mockReturnValue(''),
    getValues: vi.fn(),
    setValue: vi.fn(),
  } as unknown as UseFormReturn<CountryFormData>
}
```

**Deltas per test file:**

- `ForumDetailsStep.test.tsx` — additionally mock `@/components/work-creation/DossierPicker` to `vi.fn(() => <div data-testid="dossier-picker" />)`; assert picker is present with `filterByDossierType="organization"`.
- `WorkingGroupDetailsStep.test.tsx` — assert 4 status options render; assert `dir={direction}` on `mandate_ar` textarea (RTL assertion per CLAUDE.md); assert date input has `type="date"`.
- `EngagementDetailsStep.test.tsx` — assert 10 engagement_type options (A-01) + 8 category options; assert start/end dates are required (submit without → FormMessage non-null).
- `EngagementParticipantsStep.test.tsx` — assert 3 DossierPicker mocks with distinct `filterByDossierType` values; assert `multiple` prop is true on all three.
- `ForumReviewStep.test.tsx` / `WorkingGroupReviewStep.test.tsx` / `EngagementReviewStep.test.tsx` — mock ReviewSection/ReviewField; assert `onEditStep(0/1/2)` is called on Edit-button click per section.
- `DossierPicker.test.tsx` (extend) — add describe block `multiple=true`: (a) 3 values render 3 chips; (b) X click calls `onValuesChange` with correct array minus removed id; (c) Check indicator `opacity-100` for selected items; (d) `filterByDossierType` array form does not throw and filters recents correctly.

---

## Shared Patterns

### S-1 — Wizard Route Composition

**Source:** `frontend/src/routes/_protected/dossiers/organizations/create.tsx` lines 20-43
**Apply to:** All 3 new route files (forums/create, working_groups/create, engagements/create)

Pass the wizard config to `useCreateDossierWizard`, wrap children in `CreateWizardShell`, pass `form` + `onEditStep: wizard.setCurrentStep` to each review step.

### S-2 — FormField + Select Dropdown

**Source:** `frontend/src/components/dossier/wizard/steps/OrgDetailsStep.tsx` lines 37-60
**Apply to:** ForumDetailsStep (forum_type or organizing-body picker), WorkingGroupDetailsStep (wg_status), EngagementDetailsStep (engagement_type, engagement_category)

Tuple of values `as const`, map to `<SelectItem>` with i18n label `form-wizard:{namespace}.{enum_key}.{value}`.

### S-3 — Bilingual Field Pair Grid

**Source:** `frontend/src/components/dossier/wizard/steps/OrgDetailsStep.tsx` lines 102-141
**Apply to:** EngagementDetailsStep (location_en + location_ar) and WorkingGroupDetailsStep (mandate_en + mandate_ar as **stacked textareas**, not grid per D-16)

`grid grid-cols-1 sm:grid-cols-2 gap-4` for inputs; Arabic field gets `dir={direction}` from `useDirection()`.

### S-4 — Date Input

**Source:** `frontend/src/components/dossier/wizard/steps/OrgDetailsStep.tsx` lines 144-160
**Apply to:** WorkingGroupDetailsStep (established_date), EngagementDetailsStep (start_date, end_date)

`<Input {...field} type="date" className="min-h-11" />`. HeroUI v3 DatePicker availability is uncertain (RESEARCH Q9) — native input is the safe fallback.

### S-5 — Review Step Skeleton

**Source:** `frontend/src/components/dossier/wizard/review/OrganizationReviewStep.tsx` lines 25-104
**Apply to:** All 3 review steps

- `const values = form.watch()` — CRITICAL: not `getValues()`.
- `ReviewSection` + `ReviewField` from `./ReviewComponents`.
- Translate enum values via `t(\`form-wizard:{namespace}.{group}.${values.field}\`)`before passing to`ReviewField`.

### S-6 — List-Page Create Button

**Source:** `frontend/src/routes/_protected/dossiers/organizations/index.tsx` lines 81-93 + lines 148-152
**Apply to:** forums/index.tsx (line 87 — CHANGE `/dossiers/create` → `/dossiers/forums/create`), working_groups/index.tsx, engagements/index.tsx

`<Button asChild className="min-h-11 min-w-11 w-full sm:w-auto">` wrapping `<Link to="/dossiers/{type}/create">` with `<Plus className="h-4 w-4 me-2" />` icon + `t('action.create')` label. Empty-state secondary button has no size class override.

### S-7 — Vitest Mock Stack for Step Tests

**Source:** `frontend/src/components/dossier/wizard/steps/__tests__/CountryDetailsStep.test.tsx` lines 1-60
**Apply to:** All 7 new test files (4 steps + 3 reviews)

Mocks: `react-i18next`, `useDirection`, `FormWizardStep`, `form` primitives, `Input`, `Select`. Factory `createMockForm()` returns a cast `UseFormReturn<T>`.

### S-8 — Participants Persistence (post-create insert)

**Source:** RESEARCH §6 (strategy, no existing code analog)
**Apply to:** engagement wizard only

After `useCreateDossier` returns `newDossierId`, batch-insert N rows into `engagement_participants` with `participant_type ∈ {country, organization, person}` and `role='delegate'`. On failure, warn via toast but do NOT roll back the dossier insert (D-06). Requires `postCreate` hook on `useCreateDossierWizard` OR inline in `engagement/create.tsx`.

---

## No Analog Found

| File                                                                            | Role      | Data Flow        | Reason                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/components/dossier/wizard/steps/EngagementParticipantsStep.tsx`   | step      | form-array       | Three-fieldset layout with multi-select DossierPickers is brand-new — build from FormWizardStep skeleton (OrgDetailsStep) + DossierPicker multi-select mode.                                                                                |
| `frontend/src/components/work-creation/DossierPicker.tsx` (multi-select branch) | component | request-response | Multi-select mode is being added in-place; the single-select code path (same file) is the nearest model. Chip row layout is partially inspired by Badge use in PositionDossierLinker but rendered inline below the combobox, not in a Card. |

---

## Metadata

**Analog search scope:**

- `frontend/src/components/dossier/wizard/**`
- `frontend/src/routes/_protected/dossiers/**`
- `frontend/src/components/work-creation/DossierPicker.tsx`
- `frontend/src/components/positions/PositionDossierLinker.tsx`
- `frontend/src/i18n/{en,ar}/form-wizard.json`
- `supabase/migrations/20260110000006_working_groups_entity.sql`

**Files scanned (verbatim):** 13

**Pattern extraction date:** 2026-04-16

**Executor notes:**

1. `forums/index.tsx` currently points Create button at `/dossiers/create` (legacy). Fix to `/dossiers/forums/create` as part of Phase 29 (not a Phase 31 cleanup).
2. Migration B must be applied BEFORE the Forum wizard ships — verify via Supabase MCP `SELECT column_name FROM information_schema.columns WHERE table_name='forums' AND column_name='organizing_body'` in the parent session.
3. `useCreateDossierWizard` may need a `postCreate?: (id: string) => Promise<void>` hook added for engagement participants insert — planner to inspect current signature and add if missing.
4. Engagement schema breaking change: removes `participant_ids` field — grep for callers before modifying.

---

## PATTERN MAPPING COMPLETE
