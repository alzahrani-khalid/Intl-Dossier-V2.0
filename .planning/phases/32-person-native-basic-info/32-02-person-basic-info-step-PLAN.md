---
phase: 32-person-native-basic-info
plan: 32-02-person-basic-info-step
type: plan
created: 2026-04-18
requirements: [PBI-01, PBI-02, PBI-03]
depends_on: [32-01-migration-and-edge-function]
owner: agent
autonomous: true
estimated_wave: 2
---

# Plan 32-02: PersonBasicInfoStep Component + Schema + Wizard Rewiring

## Goal

Create a purpose-built `PersonBasicInfoStep` (D-24 field order), extend `person.schema.ts` in place with 11 new fields + superRefine rules (D-25), extend `filterExtensionData` to compose `name_en/ar` from first+last (D-08), rename `nationality_id → nationality_country_id` (D-26), resolve curated honorific to bilingual pair (D-04), and swap step 0 in both `personWizardConfig` and `electedOfficialWizardConfig` (D-27). Remove `SharedBasicInfoStep` and `abbreviation` from the person/elected-official flows (PBI-01).

## Requirements addressed

- **PBI-01** — `PersonBasicInfoStep` replaces `SharedBasicInfoStep` at step 1 of both configs; `abbreviation` and manual `status` absent from the person/elected-official flows.
- **PBI-02** — Step renders honorific (curated + Other reveal), split first/last name (EN+AR, required), known-as (EN+AR, optional), photo_url (optional text).
- **PBI-03** — Step renders nationality (required `DossierPicker` filtered to `country`), DOB (optional), gender (optional `female`/`male`). Zod enforces required nationality + gender enum.

## Dependencies

- **Plan 32-01** — the 11 columns must exist in staging before a full end-to-end wizard submit can persist. (Component + schema can be developed in parallel, but E2E verification requires columns present.)

## Files to modify / create

| Path                                                                        | Action | Rationale                                                    |
| --------------------------------------------------------------------------- | ------ | ------------------------------------------------------------ |
| `frontend/src/components/dossier/wizard/steps/PersonBasicInfoStep.tsx`      | create | New step component (D-24 field order)                        |
| `frontend/src/components/dossier/wizard/steps/honorific-map.ts`             | create | Bilingual honorific static map (D-04)                        |
| `frontend/src/components/dossier/wizard/schemas/person.schema.ts`           | modify | Extend in place with 11 fields + superRefine (D-25)          |
| `frontend/src/components/dossier/wizard/config/person.config.ts`            | modify | Swap step 0; extend `filterExtensionData` (D-08, D-26, D-27) |
| `frontend/src/components/dossier/wizard/defaults/index.ts`                  | modify | Add defaults for 11 new identity fields                      |
| `frontend/src/i18n/en/form-wizard.json`                                     | modify | Add `wizard.person_identity.*` keys (D-32)                   |
| `frontend/src/i18n/ar/form-wizard.json`                                     | modify | Mirror Arabic translations                                   |
| `frontend/src/components/dossier/wizard/steps/PersonBasicInfoStep.test.tsx` | create | Vitest unit tests                                            |
| `frontend/src/components/dossier/wizard/schemas/person.schema.test.ts`      | create | Vitest schema tests                                          |

## Tasks

### Task 1: Create honorific bilingual map

**Files:** `frontend/src/components/dossier/wizard/steps/honorific-map.ts` (create)
**Decisions applied:** D-02, D-04
**Acceptance:** File exports `CURATED_HONORIFICS` (ordered array) and `resolveCuratedHonorific(label)` helper. Unit test (Task 7) asserts `resolveCuratedHonorific('Dr.')` returns `{ honorific_en: 'Dr.', honorific_ar: 'د.' }`.
**Autonomous:** true

Per D-02, display order is fixed: `H.E., Dr., Prof., Sen., Hon., Rep., Sheikh, Amb., Mr., Ms., Mrs., Eng., Other`. Per D-04, a static in-code map resolves EN → AR on submit. "Other" is special-cased at the component layer (no map entry).

```ts
// frontend/src/components/dossier/wizard/steps/honorific-map.ts
// Phase 32 D-02, D-04: curated honorific list + EN→AR static map.

export const HONORIFIC_OTHER = 'Other' as const

/**
 * Display order for the curated honorific dropdown (D-02).
 * "Other" is always the final option.
 */
export const CURATED_HONORIFICS = [
  'H.E.',
  'Dr.',
  'Prof.',
  'Sen.',
  'Hon.',
  'Rep.',
  'Sheikh',
  'Amb.',
  'Mr.',
  'Ms.',
  'Mrs.',
  'Eng.',
  HONORIFIC_OTHER,
] as const

export type HonorificLabel = (typeof CURATED_HONORIFICS)[number]

/**
 * D-04 static EN→AR map for curated honorifics.
 * "Other" is NOT in this map — the component captures Arabic free-text separately.
 */
const CURATED_HONORIFIC_AR: Record<Exclude<HonorificLabel, 'Other'>, string> = {
  'H.E.': 'سعادة',
  'Dr.': 'د.',
  'Prof.': 'أ.د.',
  'Sen.': 'سيناتور',
  'Hon.': 'معالي',
  'Rep.': 'ممثل',
  Sheikh: 'الشيخ',
  'Amb.': 'سفير',
  'Mr.': 'السيد',
  'Ms.': 'السيدة',
  'Mrs.': 'السيدة',
  'Eng.': 'م.',
}

/**
 * Resolve a curated honorific label to its bilingual pair.
 * Returns { honorific_en: null, honorific_ar: null } when the label is empty.
 * Returns null for 'Other' (caller must use the free-text inputs).
 */
export const resolveCuratedHonorific = (
  label: string | undefined | null,
): { honorific_en: string | null; honorific_ar: string | null } | null => {
  if (label === undefined || label === null || label === '') {
    return { honorific_en: null, honorific_ar: null }
  }
  if (label === HONORIFIC_OTHER) return null
  const ar = CURATED_HONORIFIC_AR[label as Exclude<HonorificLabel, 'Other'>]
  if (ar === undefined) return { honorific_en: null, honorific_ar: null }
  return { honorific_en: label, honorific_ar: ar }
}
```

### Task 2: Extend `person.schema.ts` in place

**Files:** `frontend/src/components/dossier/wizard/schemas/person.schema.ts` (modify)
**Decisions applied:** D-25, D-26
**Acceptance:** Schema compiles under strict TS. Unit tests (Task 8) confirm: (a) missing `nationality_id` → error with message key `nationality_required`; (b) missing `last_name_en` / `last_name_ar` → error with key `last_name_required`; (c) `gender: 'other'` → error with key `gender_invalid`; (d) all optional fields may be omitted.
**Autonomous:** true

Extend the existing schema in place (per D-25, matching Phase 30 D-15 precedent). All 11 new fields are column-level optional; schema-level required-ness is enforced via `superRefine`. The form field is named `nationality_id` per D-26; the DB rename happens in `filterExtensionData` (Task 3), not here.

Add near the existing person schema definition:

```ts
// Phase 32 D-25: extend personBasicInfoSchema in place with 11 identity fields.
import { z } from 'zod'

// Gender enum (D-25; SPEC out-of-scope excludes 'prefer not to say').
export const genderEnum = z.enum(['female', 'male'])

// Schema extension — merge into the existing personBasicInfoSchema object.
// (If the file currently exports a shape via z.object({...}), add these keys;
// if it exports via .extend(), .extend() again.)
export const personIdentityFields = {
  honorific_en: z.string().optional().nullable(),
  honorific_ar: z.string().optional().nullable(),
  honorific_selection: z.string().optional().nullable(),   // form-only, not persisted; holds the curated label or 'Other'
  first_name_en: z.string().optional().nullable(),
  last_name_en: z.string().optional().nullable(),
  first_name_ar: z.string().optional().nullable(),
  last_name_ar: z.string().optional().nullable(),
  known_as_en: z.string().optional().nullable(),
  known_as_ar: z.string().optional().nullable(),
  // photo_url already exists on the base person schema; do not re-declare.
  nationality_id: z.string().uuid().optional().nullable(),   // form field name per D-26
  date_of_birth: z.string().optional().nullable(),           // ISO date string (native <input type="date">)
  gender: genderEnum.optional().nullable(),
}

// SuperRefine — enforce required fields at the schema layer (DB columns stay nullable per D-10).
// Replace the existing .superRefine (or add one) with the rules below.
export const personBasicInfoSchema = /* existing base.extend(...) */ .extend(personIdentityFields)
  .superRefine((data, ctx) => {
    // Required: last_name_en, last_name_ar, nationality_id (D-25).
    if (!data.last_name_en || data.last_name_en.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['last_name_en'],
        message: 'last_name_required',
      })
    }
    if (!data.last_name_ar || data.last_name_ar.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['last_name_ar'],
        message: 'last_name_required',
      })
    }
    if (!data.nationality_id || data.nationality_id.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['nationality_id'],
        message: 'nationality_required',
      })
    }
    // Gender enum is already enforced by z.enum; additional safety below.
    if (data.gender !== undefined && data.gender !== null && !['female','male'].includes(data.gender as string)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['gender'],
        message: 'gender_invalid',
      })
    }
    // "Other" reveal: if honorific_selection === 'Other', both honorific_en and honorific_ar must be non-empty.
    if (data.honorific_selection === 'Other') {
      if (!data.honorific_en || data.honorific_en.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['honorific_en'],
          message: 'honorific_other_required',
        })
      }
      if (!data.honorific_ar || data.honorific_ar.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['honorific_ar'],
          message: 'honorific_other_required',
        })
      }
    }
  })
```

Note on `honorific_selection`: it is a form-only field (not a DB column). The component binds the Select to this field; on submit the value is converted to `honorific_en/ar` (curated → static map via Task 1; 'Other' → free-text inputs) inside `filterExtensionData` (Task 3).

### Task 3: Extend `person.config.ts` — step swap + filterExtensionData transforms

**Files:** `frontend/src/components/dossier/wizard/config/person.config.ts` (modify)
**Decisions applied:** D-04, D-08, D-23, D-26, D-27
**Acceptance:** `grep -n 'SharedBasicInfoStep' frontend/src/routes/_protected/dossiers/persons/create.tsx frontend/src/routes/_protected/dossiers/elected-officials/create.tsx` returns zero matches (PBI-01). `filterExtensionData` composes `name_en/ar` per D-08 and renames `nationality_id → nationality_country_id`.
**Autonomous:** true

Steps:

1. Import `PersonBasicInfoStep` + `resolveCuratedHonorific`, `HONORIFIC_OTHER` from the new files.
2. In both `personWizardConfig.steps[0]` and `electedOfficialWizardConfig.steps[0]`, replace the component reference from `SharedBasicInfoStep` → `PersonBasicInfoStep`. Update step title/description keys to `form-wizard:wizard.person_identity.step_title` / `.step_desc` (Phase 30 D-20 pattern).
3. Drop any manual `status` field wiring from the step config; rely on `defaultValues.status = 'active'` and/or Edge Function default (D-23).
4. Extend `filterExtensionData`:

```ts
// Phase 32 extension — runs inside filterExtensionData in person.config.ts.
// Executes BEFORE the dossiers-create POST.

import { HONORIFIC_OTHER, resolveCuratedHonorific } from '../steps/honorific-map'

export const filterExtensionData = (formData: PersonFormData): PersonExtensionPayload => {
  // ---- D-04: Honorific resolution ----
  let honorific_en: string | null = null
  let honorific_ar: string | null = null
  const selection = formData.honorific_selection?.trim() ?? ''
  if (selection === HONORIFIC_OTHER) {
    // Free-text path: use whatever the user typed.
    honorific_en = formData.honorific_en?.trim() || null
    honorific_ar = formData.honorific_ar?.trim() || null
  } else if (selection !== '') {
    const resolved = resolveCuratedHonorific(selection)
    honorific_en = resolved?.honorific_en ?? null
    honorific_ar = resolved?.honorific_ar ?? null
  }
  // D-05: unselected honorific → both NULL (already the case here).

  // ---- D-08: compose dossiers.name_en / name_ar from first + last ----
  // Rule: if first_name_en populated → `${first} ${last}`; else → just last.
  // D-09: composed name does NOT include honorific.
  const composeName = (first?: string | null, last?: string | null): string => {
    const f = first?.trim() ?? ''
    const l = last?.trim() ?? ''
    if (f && l) return `${f} ${l}`
    return l
  }
  const name_en = composeName(formData.first_name_en, formData.last_name_en)
  const name_ar = composeName(formData.first_name_ar, formData.last_name_ar)

  // ---- D-26: rename nationality_id → nationality_country_id at boundary ----
  const nationality_country_id = formData.nationality_id?.trim() || null

  return {
    // existing fields (title_en/ar, email, phone, biography, photo_url, socials, expertise, languages, office/term if elected)
    // ...existing fields passed through as before...
    title_en: formData.title_en ?? null,
    title_ar: formData.title_ar ?? null,
    email: formData.email ?? null,
    phone: formData.phone ?? null,
    biography_en: formData.biography_en ?? null,
    biography_ar: formData.biography_ar ?? null,
    photo_url: formData.photo_url ?? null,
    linkedin_url: formData.linkedin_url ?? null,
    twitter_url: formData.twitter_url ?? null,
    expertise_areas: formData.expertise_areas ?? null,
    languages: formData.languages ?? null,

    // ---- Phase 32 additive ----
    honorific_en,
    honorific_ar,
    first_name_en: formData.first_name_en?.trim() || null,
    last_name_en: formData.last_name_en?.trim() || null,
    first_name_ar: formData.first_name_ar?.trim() || null,
    last_name_ar: formData.last_name_ar?.trim() || null,
    known_as_en: formData.known_as_en?.trim() || null,
    known_as_ar: formData.known_as_ar?.trim() || null,
    nationality_country_id,
    date_of_birth: formData.date_of_birth || null,
    gender: formData.gender ?? null,

    // composed legal names (D-08/D-09) — written to dossiers.name_en/ar by the Edge Function.
    // These are top-level dossier fields, NOT extensionData; the wizard shell typically
    // reads them from the form's name_en/name_ar keys. Inject them back into the form
    // payload before POST (see note below).
    __composed_name_en: name_en,
    __composed_name_ar: name_ar,
    // note: `honorific_selection` is a form-only helper; it is NOT included in the extension payload.
  }
}
```

Note on composed name wiring: inspect the existing `filterExtensionData` caller (likely `useCreateDossierWizard.ts` or the page's `onSubmit`) — the caller constructs the `dossiers-create` POST body with top-level `name_en/name_ar` + nested `extensionData`. If the current flow reads `name_en` from the form directly, intercept in the same place and overwrite with `composeName(first_name_en, last_name_en)` before POST. If `filterExtensionData` is the only hook point, the cleanest path is: move composition into a `composePersonPayload` helper that returns `{ name_en, name_ar, extensionData }` and call it from the submit handler. Implementer picks whichever pattern matches the existing code shape; do NOT invent a new flow.

### Task 4: Create `PersonBasicInfoStep.tsx`

**Files:** `frontend/src/components/dossier/wizard/steps/PersonBasicInfoStep.tsx` (create)
**Decisions applied:** D-01, D-02, D-03, D-22, D-23, D-24, D-33
**Acceptance:** Component renders the 11 D-24 field order items. Honorific `Select` shows the 13 curated values; selecting 'Other' reveals two text inputs. Arabic inputs carry `dir={direction}` + `writingDirection: "rtl"` (never `textAlign: "right"`). All interactive elements meet `min-h-11 min-w-11`.
**Autonomous:** true

File skeleton (executor fleshes out JSX using existing SharedBasicInfoStep as visual reference):

```tsx
// frontend/src/components/dossier/wizard/steps/PersonBasicInfoStep.tsx
// Phase 32 D-24: replaces SharedBasicInfoStep on person + elected-official wizards.

import { useTranslation } from 'react-i18next'
import type { UseFormReturn, FieldValues } from 'react-hook-form'
import { FormField, FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { DossierPicker } from '@/components/dossier/DossierPicker'
import { AIFieldAssist } from '@/components/dossier/AIFieldAssist'
import { FieldLabelWithHelp } from '@/components/forms/ContextualHelp'
import { useDirection } from '@/hooks/useDirection'
import { ChevronDown } from 'lucide-react'
import { CURATED_HONORIFICS, HONORIFIC_OTHER } from './honorific-map'

interface PersonBasicInfoStepProps<T extends FieldValues> {
  form: UseFormReturn<T>
  // ...any other shared step props (personSubtype, etc.)
}

export function PersonBasicInfoStep<T extends FieldValues>({
  form,
}: PersonBasicInfoStepProps<T>): JSX.Element {
  const { t } = useTranslation('form-wizard')
  const { direction } = useDirection()
  const isRTL = direction === 'rtl'

  // D-03: watch honorific_selection to conditionally reveal Other inputs.
  const honorificSelection = form.watch('honorific_selection' as never)
  const showOtherInputs = honorificSelection === HONORIFIC_OTHER

  return (
    <div className="flex flex-col gap-6">
      {/* D-24 #1: AIFieldAssist (if applicable) */}
      <AIFieldAssist form={form} />

      {/* D-24 #2: Honorific select */}
      <FormField
        control={form.control}
        name={'honorific_selection' as never}
        render={({ field }) => (
          <FormItem>
            <FieldLabelWithHelp
              label={t('wizard.person_identity.honorific.label')}
              helpText={t('wizard.person_identity.honorific.helper')}
            />
            <FormControl>
              <Select value={field.value ?? ''} onValueChange={field.onChange}>
                <SelectTrigger className="min-h-11">
                  <SelectValue placeholder={t('wizard.person_identity.honorific.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {CURATED_HONORIFICS.map((label) => (
                    <SelectItem key={label} value={label}>
                      {label === HONORIFIC_OTHER
                        ? t('wizard.person_identity.honorific.other_label')
                        : label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* D-03: Other reveal — two free-text inputs side-by-side */}
      {showOtherInputs && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name={'honorific_en' as never}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('wizard.person_identity.honorific.other_en_label')}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} className="min-h-11" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={'honorific_ar' as never}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-start">
                  {t('wizard.person_identity.honorific.other_ar_label')}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    dir="rtl"
                    style={{ writingDirection: 'rtl' }}
                    className="min-h-11"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      {/* D-24 #3: First/Last name pairs. Use two 2-col grids (one for EN pair, one for AR pair)
          to preserve label→input visual coupling per locale. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* first_name_en, last_name_en — required via superRefine on last_name */}
        {/* ...FormField for first_name_en with min-h-11 input... */}
        {/* ...FormField for last_name_en (required indicator) with min-h-11 input... */}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* first_name_ar, last_name_ar — dir="rtl", writingDirection rtl */}
      </div>

      {/* D-24 #4: known_as_en / known_as_ar (optional) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* known_as_en (LTR), known_as_ar (dir rtl) */}
      </div>

      {/* D-24 #5: photo_url — single text input, full width, optional */}
      {/* ...FormField for photo_url, type="url", placeholder example, helper t('wizard.person_identity.photo_url.helper')... */}

      {/* D-24 #6: nationality — required DossierPicker filtered to country */}
      <FormField
        control={form.control}
        name={'nationality_id' as never}
        render={({ field }) => (
          <FormItem>
            <FieldLabelWithHelp
              label={t('wizard.person_identity.nationality.label')}
              helpText={t('wizard.person_identity.nationality.helper')}
              required
            />
            <FormControl>
              <DossierPicker
                value={field.value ?? null}
                onChange={field.onChange}
                filterByDossierType="country"
                required
                placeholder={t('wizard.person_identity.nationality.placeholder')}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* D-24 #7: DOB + gender in 2-col grid, both optional */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* date_of_birth — <input type="date"> with min-h-11 */}
        {/* gender — Select with only 'female' | 'male' (no 'prefer not to say') */}
      </div>

      {/* D-22 divider */}
      <hr className="border-t" />

      {/* D-24 #9: description_en + description_ar, optional, 2-col grid */}
      {/* D-24 #10: tags, single row */}
      {/* D-24 #11: collapsible Classification — sensitivity_level ONLY (D-23). No manual status. */}
      <details>
        <summary className="flex cursor-pointer items-center gap-2 text-sm">
          {t('wizard.basicInfo.classification')}
          <ChevronDown className="h-4 w-4" />
        </summary>
        <div className="mt-3">
          {/* sensitivity_level Select — same pattern as SharedBasicInfoStep line ~220 */}
        </div>
      </details>
    </div>
  )
}
```

Constraints the implementer MUST honor:

- **No `textAlign: "right"`** anywhere — `forceRTL` flips it to LEFT (project CLAUDE.md rule). Use `text-start` / `text-end` Tailwind logical utilities; for Arabic inputs use `dir="rtl"` + inline `writingDirection: 'rtl'` (D-33).
- **Logical Tailwind only:** `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`. Never `ml-*`/`mr-*`/`pl-*`/`pr-*`/`left-*`/`right-*`.
- **Touch targets:** every interactive element gets `min-h-11 min-w-11` (44×44 px).
- **Mobile-first grid:** `grid-cols-1 sm:grid-cols-2` — stack on mobile, side-by-side from `sm` up.
- **Required indicators:** `last_name_en`, `last_name_ar`, `nationality_id` show a required asterisk on their label (match SharedBasicInfoStep's existing convention).
- **HeroUI via wrappers:** use `@/components/ui/*` (not HeroUI primitives directly).
- **Rendering untrusted strings:** all user-entered strings (honorific free-text, names, photo_url) render through JSX interpolation only (React escapes by default). Do NOT inject strings into innerHTML-style props; use `<img src={photo_url}>` for any photo preview.

### Task 5: Update `defaults/index.ts`

**Files:** `frontend/src/components/dossier/wizard/defaults/index.ts` (modify)
**Decisions applied:** D-23
**Acceptance:** Person + elected-official `defaultValues` include the 11 new keys with empty-string / undefined defaults + `status: 'active'`.
**Autonomous:** true

Add to the person (and elected-official if it has its own entry) default map:

```ts
// Phase 32 identity-field defaults — safe empty values so legacy drafts don't crash (D-21).
honorific_selection: '',
honorific_en: '',
honorific_ar: '',
first_name_en: '',
last_name_en: '',
first_name_ar: '',
last_name_ar: '',
known_as_en: '',
known_as_ar: '',
nationality_id: '',
date_of_birth: '',
gender: undefined,
// D-23: manual status field is dropped from the person wizard — default to 'active'.
status: 'active',
```

### Task 6: Add i18n keys (EN + AR)

**Files:** `frontend/src/i18n/en/form-wizard.json` (modify), `frontend/src/i18n/ar/form-wizard.json` (modify)
**Decisions applied:** D-32
**Acceptance:** Both locale files include the full `wizard.person_identity.*` subtree. `pnpm lint` passes (no missing-key warnings in the i18n linter if one is configured).
**Autonomous:** true

Add under `wizard.person_identity` in EN:

```json
"person_identity": {
  "step_title": "Identity",
  "step_desc": "Personal identity, nationality, and summary",
  "honorific": {
    "label": "Honorific",
    "placeholder": "Select honorific",
    "helper": "Formal title used when addressing this person",
    "other_label": "Other (specify)",
    "other_en_label": "Other (English)",
    "other_ar_label": "Other (Arabic)"
  },
  "first_name": { "label_en": "First name (English)", "label_ar": "First name (Arabic)" },
  "last_name":  { "label_en": "Last name (English)",  "label_ar": "Last name (Arabic)" },
  "known_as":   {
    "label_en": "Known as (English)",
    "label_ar": "Known as (Arabic)",
    "helper": "Optional nickname or alternate name"
  },
  "photo_url": {
    "label": "Photo URL",
    "placeholder": "https://...",
    "helper": "Direct link to a photo (optional)"
  },
  "nationality": {
    "label": "Nationality",
    "placeholder": "Select country",
    "helper": "Country of citizenship (required)"
  },
  "dob":    { "label": "Date of birth", "helper": "Optional" },
  "gender": { "label": "Gender", "female": "Female", "male": "Male" },
  "validation": {
    "nationality_required": "Nationality is required",
    "last_name_required": "Last name is required",
    "gender_invalid": "Gender must be Female or Male",
    "honorific_other_required": "Please specify the honorific in both languages"
  },
  "review": {
    "card_title": "Identity",
    "biographical_summary_heading": "Biographical summary"
  }
}
```

Mirror in `ar/form-wizard.json` with Arabic translations. Follow Phase 30 D-20 convention. Use neutral translations where the AR equivalent is contested (e.g. `gender.female: "أنثى"`, `gender.male: "ذكر"`; `step_title: "الهوية"`; `review.card_title: "الهوية"`).

### Task 7: Vitest — `PersonBasicInfoStep.test.tsx`

**Files:** `frontend/src/components/dossier/wizard/steps/PersonBasicInfoStep.test.tsx` (create)
**Decisions applied:** —
**Acceptance:** `pnpm --filter frontend test -- PersonBasicInfoStep` passes. Covers: (a) renders honorific Select with 13 options; (b) selecting 'Other' reveals two free-text inputs; (c) deselecting 'Other' hides the reveal; (d) 4 name inputs (first_en, last_en, first_ar, last_ar) render with correct labels; (e) nationality DossierPicker renders with `filterByDossierType="country"`; (f) gender select shows only Female + Male (two options, no "prefer not to say").
**Autonomous:** true

Use `@testing-library/react`, `userEvent`, and the existing `renderWithProviders` helper (i18n + form context). Mock `DossierPicker` to return a simple `<input data-testid="nationality-picker" />` so tests don't require Supabase.

### Task 8: Vitest — `person.schema.test.ts`

**Files:** `frontend/src/components/dossier/wizard/schemas/person.schema.test.ts` (create)
**Decisions applied:** —
**Acceptance:** `pnpm --filter frontend test -- person.schema` passes. Covers (PBI-02, PBI-03 acceptance mirrors): (a) empty `nationality_id` → issue at path `['nationality_id']` with message `'nationality_required'`; (b) empty `last_name_en` / `last_name_ar` → issue at path `['last_name_en']` / `['last_name_ar']` with message `'last_name_required'`; (c) `gender: 'other'` → Zod enum parse failure OR custom issue with `'gender_invalid'`; (d) omitted `date_of_birth`, `gender`, `known_as_*`, `first_name_*` → valid; (e) `honorific_selection: 'Other'` with empty `honorific_en` → issue `'honorific_other_required'`; (f) curated selection `'Dr.'` → no honorific issues.
**Autonomous:** true

## Tests

- Vitest: `PersonBasicInfoStep.test.tsx` (Task 7) — 6+ cases
- Vitest: `person.schema.test.ts` (Task 8) — 6+ cases
- Vitest (existing): ensure no regressions in `SharedBasicInfoStep` tests (other dossier types still use it; no changes there)

## Verification commands

```bash
# From repo root:
pnpm --filter frontend typecheck
pnpm --filter frontend test -- PersonBasicInfoStep
pnpm --filter frontend test -- person.schema

# PBI-01 acceptance: SharedBasicInfoStep removed from person + elected-official wizards
grep -n 'SharedBasicInfoStep' frontend/src/routes/_protected/dossiers/persons/create.tsx frontend/src/routes/_protected/dossiers/elected-officials/create.tsx || echo "OK: zero matches"

# Negative match: abbreviation absent from the new step
grep -n 'abbreviation' frontend/src/components/dossier/wizard/steps/PersonBasicInfoStep.tsx || echo "OK: zero matches"
```

## Rollback

- `git revert` the commit(s) for this plan. The `PersonBasicInfoStep` component and new schema fields are additive files; the config change reverts the step reference back to `SharedBasicInfoStep`. Default values fall back harmlessly (extra keys in `defaultValues` are ignored by unused schemas).
- i18n keys are additive — reverting the json edits removes them cleanly.
- No DB changes in this plan (those are in 32-01).

## Threat model

| Threat                                                                                                      | Severity | Mitigation                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| XSS via user-entered strings (names, honorific free-text, photo_url)                                        | Medium   | All strings rendered via JSX interpolation (React escapes). Photo preview uses `<img src>` only — never raw-HTML injection props. URL validation in Zod narrows the surface.                     |
| Schema-bypass via mismatched field names between form and DB (`nationality_id` vs `nationality_country_id`) | Medium   | Rename happens deterministically in `filterExtensionData` (Task 3); unit test (Task 8) verifies the form-side name; end-to-end in Plan 32-04 verifies the DB-side name.                          |
| Gender value bypass (user sends a non-enum value)                                                           | Medium   | Two layers: Zod `z.enum(['female','male'])` on client + DB-level CHECK constraint (from Plan 32-01 migration). Edge Function uses `?? null` — unknown values fall through but the CHECK rejects. |
| Required-nationality bypass via direct API call                                                             | Medium   | DB column is nullable by design (D-10); required-ness is a wizard contract. Direct-API abuse is not a Phase 32 concern per SPEC Constraints; follow-up phase will tighten.                       |
| Legacy draft crashes from missing new fields                                                                | Low      | `defaultValues` (Task 5) initializes all new keys with safe empty values; review card (Plan 32-03) renders `—` for missing.                                                                      |
| Injection via honorific "Other" free-text                                                                   | Low      | Stored as plain text, rendered via JSX only; Supabase client uses parameterized inserts.                                                                                                         |
