---
phase: 30-elected-official-wizard
plan: 02
type: execute
wave: 2
depends_on: ['30-01']
files_modified:
  - frontend/src/components/dossier/wizard/steps/OfficeTermStep.tsx
  - frontend/src/i18n/en/form-wizard.json
  - frontend/src/i18n/ar/form-wizard.json
autonomous: true
requirements: [ELOF-02]
requirements_addressed: [ELOF-02]
tags: [v5.0, wizard, step-component, i18n, rtl, dossier-picker]

must_haves:
  truths:
    - 'OfficeTermStep renders 4 semantic sections: Office, Constituency, Party, Term (each with a heading)'
    - 'Office section renders office_name_en + office_name_ar as a 2-column bilingual grid (EN first in JSX)'
    - "Office section renders a required-marked single-select DossierPicker for country_id filtered to 'country' dossiers"
    - "Office section renders an optional single-select DossierPicker for organization_id filtered to 'organization' dossiers"
    - 'Constituency section renders district_en + district_ar as a 2-column bilingual grid'
    - 'Party section renders party_en + party_ar as a 2-column bilingual grid'
    - 'Term section renders term_start (type=date, required) + term_end (type=date, optional)'
    - "Arabic <Input> elements receive dir={direction} via useDirection() and carry no textAlign:'right' style"
    - 'All interactive elements carry min-h-11 (>=44px touch target)'
    - 'i18n en/ar files both contain keys under wizard.elected_official.* covering: step title, step description, all field labels + placeholders, all 4 section headings, validation messages (office_name_required, country_required, term_start_required, term_end_after_start)'
  artifacts:
    - path: 'frontend/src/components/dossier/wizard/steps/OfficeTermStep.tsx'
      provides: 'Fourth wizard step component for the Elected Official variant'
      min_lines: 150
      exports: ['OfficeTermStep']
    - path: 'frontend/src/i18n/en/form-wizard.json'
      provides: 'English elected_official.* namespace + steps.officeTerm keys'
      contains: 'elected_official'
    - path: 'frontend/src/i18n/ar/form-wizard.json'
      provides: 'Arabic elected_official.* namespace + steps.officeTerm keys'
      contains: 'elected_official'
  key_links:
    - from: 'frontend/src/components/dossier/wizard/steps/OfficeTermStep.tsx'
      to: 'DossierPicker component'
      via: 'named import from @/components/work-creation/DossierPicker'
      pattern: "from '@/components/work-creation/DossierPicker'"
    - from: 'frontend/src/components/dossier/wizard/steps/OfficeTermStep.tsx'
      to: 'PersonFormData type'
      via: 'named import'
      pattern: "from '../schemas/person.schema'"
    - from: 'frontend/src/components/dossier/wizard/steps/OfficeTermStep.tsx'
      to: 'react-hook-form + i18next + useDirection'
      via: "FormField controls with t('form-wizard:elected_official.*')"
      pattern: "t\\('form-wizard:elected_official"
---

<objective>
Build the OfficeTermStep component (Phase 30 step 3 for the elected-official variant) and add
all required i18n keys in EN + AR. The step captures ELOF-02 essentials (office, constituency,
party, term_start/end) plus the country_id required DossierPicker and the optional organization_id
DossierPicker (D-12, D-13).

Purpose: With Plan 30-01 providing the schema fields and superRefine, this plan gives the user
a form to fill them. Downstream Plan 30-03 wires this step into the wizard shell and creates
the route. Plan 30-04 writes unit tests against this component.

Output:

- OfficeTermStep.tsx — new component, mirrors PersonDetailsStep conventions
- form-wizard.json (EN + AR) — 30+ new keys under `elected_official.*` plus `steps.officeTerm` + `steps.officeTermDesc`
- `review.office_term` key added for Plan 30-03 to consume
  </objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/30-elected-official-wizard/30-CONTEXT.md
@CLAUDE.md

# Phase 30 Plan 01 SUMMARY (schema types OfficeTermStep consumes):

@.planning/phases/30-elected-official-wizard/30-01-SUMMARY.md

# Files being modified (read in full before editing):

@frontend/src/i18n/en/form-wizard.json
@frontend/src/i18n/ar/form-wizard.json

# Reference files (read the section you need, not the whole file):

@frontend/src/components/dossier/wizard/steps/PersonDetailsStep.tsx
@frontend/src/components/dossier/wizard/steps/ForumDetailsStep.tsx
@frontend/src/components/dossier/wizard/steps/WorkingGroupDetailsStep.tsx
</context>

<interfaces>
<!-- Canonical patterns this step mirrors — executor should use these directly. -->

From frontend/src/components/dossier/wizard/steps/PersonDetailsStep.tsx (bilingual pair pattern):

```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <FormField
    control={form.control}
    name="title_en"
    render={({ field }) => (
      <FormItem>
        <FormLabel>{t('form-wizard:person.title_en')}</FormLabel>
        <FormControl>
          <Input {...field} className="min-h-11" placeholder={...} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
  <FormField
    control={form.control}
    name="title_ar"
    render={({ field }) => (
      <FormItem>
        <FormLabel>{t('form-wizard:person.title_ar')}</FormLabel>
        <FormControl>
          <Input {...field} className="min-h-11" dir={direction} placeholder={...} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</div>
```

Note: EN field FIRST in JSX (RTL rule — in RTL, first child renders on the right reading-start).
`dir={direction}` from `useDirection()` on Arabic inputs. NO `textAlign: 'right'`.

From frontend/src/components/dossier/wizard/steps/ForumDetailsStep.tsx (DossierPicker pattern):

```typescript
import { DossierPicker } from '@/components/work-creation/DossierPicker'

<FormField
  control={form.control}
  name="organizing_body_id"
  render={({ field }) => (
    <FormItem>
      <FormLabel>{t('form-wizard:forum.organizing_body_label')}</FormLabel>
      <FormControl>
        <DossierPicker
          value={field.value ?? ''}
          onChange={(id): void => field.onChange(id ?? '')}
          filterByDossierType="organization"
          placeholder={t('form-wizard:forum.organizing_body_placeholder')}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

Use `filterByDossierType="country"` for the country picker (required), and
`filterByDossierType="organization"` for the org picker (optional).

PersonFormData (from Plan 30-01):

```typescript
type PersonFormData = {
  // ... base + person fields
  office_name_en?: string
  office_name_ar?: string
  district_en?: string
  district_ar?: string
  party_en?: string
  party_ar?: string
  term_start?: string // ISO date string 'YYYY-MM-DD'
  term_end?: string // ISO date string, optional
  country_id?: string
  organization_id?: string
  is_current_term?: boolean
}
```

FormWizardStep wrapper — stepId MUST match the config step.id ('office-term'):

```typescript
<FormWizardStep stepId="office-term" className="space-y-6">
  {/* sections */}
</FormWizardStep>
```

</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Add i18n keys to en/form-wizard.json and ar/form-wizard.json</name>
  <files>
    frontend/src/i18n/en/form-wizard.json,
    frontend/src/i18n/ar/form-wizard.json
  </files>
  <read_first>
    - frontend/src/i18n/en/form-wizard.json (full file — JSON structure and existing keys)
    - frontend/src/i18n/ar/form-wizard.json (full file — Arabic translations must mirror EN structure exactly)
    - .planning/phases/30-elected-official-wizard/30-CONTEXT.md (§D-20)
  </read_first>
  <action>
**ENGLISH file** (`frontend/src/i18n/en/form-wizard.json`):

1. Add two new keys inside the existing `"steps": { ... }` object (before the closing brace of that object), keeping all existing keys:

   ```
   "officeTerm": "Office & Term",
   "officeTermDesc": "Office title, term, constituency, and party affiliation"
   ```

2. Add one new key inside the existing `"review": { ... }` object (before the closing brace), keeping all existing keys:

   ```
   "office_term": "Office & Term"
   ```

3. Add a NEW top-level `"elected_official"` namespace immediately after the existing `"person": { ... }` block (inside the root object). Exact structure:
   ```
   "elected_official": {
     "page_title": "Create Elected Official",
     "back_to_list": "Back to Elected Officials",
     "sections": {
       "office": "Office",
       "constituency": "Constituency",
       "party": "Party",
       "term": "Term"
     },
     "office_name_en": "Office Name (English)",
     "office_name_ar": "Office Name (Arabic)",
     "office_name_en_ph": "e.g. Minister of Foreign Affairs",
     "office_name_ar_ph": "مثال: وزير الخارجية",
     "country": "Country",
     "country_ph": "Search countries…",
     "country_help": "Required — the polity this office belongs to.",
     "organization": "Organization / Body",
     "organization_ph": "Search organizations…",
     "organization_help": "Optional — link to the ministry, parliament, or body this office belongs to.",
     "district_en": "Constituency (English)",
     "district_ar": "Constituency (Arabic)",
     "district_en_ph": "e.g. Riyadh District 3",
     "district_ar_ph": "مثال: الرياض الدائرة ٣",
     "party_en": "Political Party (English)",
     "party_ar": "Political Party (Arabic)",
     "party_en_ph": "e.g. National Coalition",
     "party_ar_ph": "مثال: الائتلاف الوطني",
     "term_start": "Term Start",
     "term_end": "Term End",
     "term_end_help": "Leave empty for ongoing terms",
     "validation": {
       "office_name_required": "Office name is required (English or Arabic)",
       "country_required": "Country is required for elected officials",
       "term_start_required": "Term start date is required",
       "term_end_after_start": "Term end must be on or after term start"
     }
   }
   ```

**ARABIC file** (`frontend/src/i18n/ar/form-wizard.json`):

Mirror the EN additions with these Arabic translations — apply the SAME structural inserts (same parent keys, same order):

1. Inside existing `"steps"` object, add:

   ```
   "officeTerm": "المنصب والولاية",
   "officeTermDesc": "عنوان المنصب والولاية والدائرة والانتماء الحزبي"
   ```

2. Inside existing `"review"` object, add:

   ```
   "office_term": "المنصب والولاية"
   ```

3. Add new top-level `"elected_official"` namespace:
   ```
   "elected_official": {
     "page_title": "إنشاء مسؤول منتخب",
     "back_to_list": "العودة إلى المسؤولين المنتخبين",
     "sections": {
       "office": "المنصب",
       "constituency": "الدائرة",
       "party": "الحزب",
       "term": "الولاية"
     },
     "office_name_en": "اسم المنصب (بالإنجليزية)",
     "office_name_ar": "اسم المنصب (بالعربية)",
     "office_name_en_ph": "e.g. Minister of Foreign Affairs",
     "office_name_ar_ph": "مثال: وزير الخارجية",
     "country": "البلد",
     "country_ph": "ابحث عن البلدان…",
     "country_help": "مطلوب — الجهة السياسية التي ينتمي إليها هذا المنصب.",
     "organization": "المنظمة / الجهة",
     "organization_ph": "ابحث عن المنظمات…",
     "organization_help": "اختياري — رابط إلى الوزارة أو البرلمان أو الجهة التابعة.",
     "district_en": "الدائرة الانتخابية (بالإنجليزية)",
     "district_ar": "الدائرة الانتخابية (بالعربية)",
     "district_en_ph": "e.g. Riyadh District 3",
     "district_ar_ph": "مثال: الرياض الدائرة ٣",
     "party_en": "الحزب السياسي (بالإنجليزية)",
     "party_ar": "الحزب السياسي (بالعربية)",
     "party_en_ph": "e.g. National Coalition",
     "party_ar_ph": "مثال: الائتلاف الوطني",
     "term_start": "بداية الولاية",
     "term_end": "نهاية الولاية",
     "term_end_help": "اتركه فارغًا للولايات الجارية",
     "validation": {
       "office_name_required": "اسم المنصب مطلوب (بالإنجليزية أو بالعربية)",
       "country_required": "البلد مطلوب للمسؤولين المنتخبين",
       "term_start_required": "تاريخ بداية الولاية مطلوب",
       "term_end_after_start": "يجب أن يكون تاريخ نهاية الولاية مساويًا لتاريخ البداية أو بعده"
     }
   }
   ```

**CRITICAL:** Maintain valid JSON syntax (trailing commas inside object bodies but not after the final member of a JSON object). Preserve existing 2-space indentation. DO NOT delete or reorder any existing keys. Both files must be valid JSON after edit — validate with `node -e "JSON.parse(require('fs').readFileSync('<path>'))"`.
</action>
<verify>
<automated>node -e "JSON.parse(require('fs').readFileSync('frontend/src/i18n/en/form-wizard.json'));JSON.parse(require('fs').readFileSync('frontend/src/i18n/ar/form-wizard.json'));console.log('both valid JSON')"</automated>
</verify>
<acceptance_criteria> - Both files parse as valid JSON (node JSON.parse succeeds without throwing) - `grep -q '"officeTerm"' frontend/src/i18n/en/form-wizard.json` → exit 0 - `grep -q '"officeTerm"' frontend/src/i18n/ar/form-wizard.json` → exit 0 - `grep -q '"elected_official"' frontend/src/i18n/en/form-wizard.json` → exit 0 - `grep -q '"elected_official"' frontend/src/i18n/ar/form-wizard.json` → exit 0 - `grep -q '"office_name_required"' frontend/src/i18n/en/form-wizard.json` → exit 0 - `grep -q '"country_required"' frontend/src/i18n/en/form-wizard.json` → exit 0 - `grep -q '"term_end_after_start"' frontend/src/i18n/ar/form-wizard.json` → exit 0 - `grep -q '"office_term"' frontend/src/i18n/en/form-wizard.json` → exit 0 (inside review namespace) - Number of top-level keys in each file matches: `jq 'keys | length' <en> == jq 'keys | length' <ar>` (structural parity) - Existing keys (country, person, forum, workingGroup, engagement, topic, organization, review, steps) all still present — diff shows only additions, no deletions
</acceptance_criteria>
<done>
Both i18n files carry the full elected_official namespace, officeTerm step labels, and
review.office_term key. Both parse as valid JSON. Existing keys untouched.
</done>
</task>

<task type="auto">
  <name>Task 2: Create OfficeTermStep.tsx component</name>
  <files>frontend/src/components/dossier/wizard/steps/OfficeTermStep.tsx</files>
  <read_first>
    - frontend/src/components/dossier/wizard/steps/PersonDetailsStep.tsx (bilingual grid pattern — lines 75-117, 175-212)
    - frontend/src/components/dossier/wizard/steps/ForumDetailsStep.tsx (DossierPicker usage — lines 27, 66-86)
    - frontend/src/components/dossier/wizard/steps/WorkingGroupDetailsStep.tsx (second DossierPicker example for reference)
    - frontend/src/components/dossier/wizard/schemas/person.schema.ts (to confirm PersonFormData shape after Plan 30-01 lands)
    - CLAUDE.md (§"MANDATORY: RTL-First Rules" — apply all 5 rules)
  </read_first>
  <action>
Create a NEW file at `frontend/src/components/dossier/wizard/steps/OfficeTermStep.tsx` with this EXACT content (mirrors PersonDetailsStep file structure, uses FormWizardStep wrapper, applies RTL rules per CLAUDE.md, uses logical properties only — ms-/me-/ps-/pe-/text-start, never ml-/mr-/text-left/text-right):

```typescript
/**
 * OfficeTermStep -- Third step of the Elected Official wizard variant (Phase 30 D-06).
 *
 * Renders 4 semantic sections:
 *   1. Office     — office_name pair (EN/AR, at-least-one required) + country (required DossierPicker) + organization (optional DossierPicker)
 *   2. Constituency — district pair (EN/AR, both optional)
 *   3. Party      — party pair (EN/AR, both optional)
 *   4. Term       — term_start (required) + term_end (optional; empty = ongoing)
 *
 * is_current_term is auto-derived at submit in electedOfficialWizardConfig.filterExtensionData — not shown in UI.
 * Required-ness for elected-official fields is enforced in personSchema.superRefine.
 */
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import type { UseFormReturn } from 'react-hook-form'

import { FormWizardStep } from '@/components/ui/form-wizard'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { DossierPicker } from '@/components/work-creation/DossierPicker'
import { useDirection } from '@/hooks/useDirection'
import type { PersonFormData } from '../schemas/person.schema'

interface OfficeTermStepProps {
  form: UseFormReturn<PersonFormData>
}

export function OfficeTermStep({ form }: OfficeTermStepProps): ReactElement {
  const { t } = useTranslation(['form-wizard'])
  const { direction } = useDirection()

  return (
    <FormWizardStep stepId="office-term" className="space-y-8">
      {/* ============ Section 1: Office ============ */}
      <section className="space-y-4" aria-labelledby="office-term-office-heading">
        <h3
          id="office-term-office-heading"
          className="text-sm font-semibold text-foreground text-start"
        >
          {t('form-wizard:elected_official.sections.office')}
        </h3>

        {/* Office name bilingual pair (at least one required — superRefine enforces) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="office_name_en"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form-wizard:elected_official.office_name_en')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    className="min-h-11"
                    placeholder={t('form-wizard:elected_official.office_name_en_ph')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="office_name_ar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form-wizard:elected_official.office_name_ar')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    className="min-h-11"
                    dir={direction}
                    placeholder={t('form-wizard:elected_official.office_name_ar_ph')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Country picker (required) */}
        <FormField
          control={form.control}
          name="country_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('form-wizard:elected_official.country')}
                <span className="ms-1 text-destructive" aria-hidden="true">*</span>
              </FormLabel>
              <FormControl>
                <DossierPicker
                  value={field.value ?? ''}
                  onChange={(id): void => field.onChange(id ?? '')}
                  filterByDossierType="country"
                  placeholder={t('form-wizard:elected_official.country_ph')}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground text-start">
                {t('form-wizard:elected_official.country_help')}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Organization picker (optional) */}
        <FormField
          control={form.control}
          name="organization_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form-wizard:elected_official.organization')}</FormLabel>
              <FormControl>
                <DossierPicker
                  value={field.value ?? ''}
                  onChange={(id): void => field.onChange(id ?? '')}
                  filterByDossierType="organization"
                  placeholder={t('form-wizard:elected_official.organization_ph')}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground text-start">
                {t('form-wizard:elected_official.organization_help')}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </section>

      {/* ============ Section 2: Constituency ============ */}
      <section className="space-y-4" aria-labelledby="office-term-constituency-heading">
        <h3
          id="office-term-constituency-heading"
          className="text-sm font-semibold text-foreground text-start"
        >
          {t('form-wizard:elected_official.sections.constituency')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="district_en"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form-wizard:elected_official.district_en')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    className="min-h-11"
                    placeholder={t('form-wizard:elected_official.district_en_ph')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="district_ar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form-wizard:elected_official.district_ar')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    className="min-h-11"
                    dir={direction}
                    placeholder={t('form-wizard:elected_official.district_ar_ph')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </section>

      {/* ============ Section 3: Party ============ */}
      <section className="space-y-4" aria-labelledby="office-term-party-heading">
        <h3
          id="office-term-party-heading"
          className="text-sm font-semibold text-foreground text-start"
        >
          {t('form-wizard:elected_official.sections.party')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="party_en"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form-wizard:elected_official.party_en')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    className="min-h-11"
                    placeholder={t('form-wizard:elected_official.party_en_ph')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="party_ar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form-wizard:elected_official.party_ar')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    className="min-h-11"
                    dir={direction}
                    placeholder={t('form-wizard:elected_official.party_ar_ph')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </section>

      {/* ============ Section 4: Term ============ */}
      <section className="space-y-4" aria-labelledby="office-term-term-heading">
        <h3
          id="office-term-term-heading"
          className="text-sm font-semibold text-foreground text-start"
        >
          {t('form-wizard:elected_official.sections.term')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="term_start"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('form-wizard:elected_official.term_start')}
                  <span className="ms-1 text-destructive" aria-hidden="true">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    type="date"
                    className="min-h-11"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="term_end"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form-wizard:elected_official.term_end')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    type="date"
                    className="min-h-11"
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground text-start">
                  {t('form-wizard:elected_official.term_end_help')}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </section>
    </FormWizardStep>
  )
}
```

**RTL compliance checklist (verify before commit):**

- No `ml-*`, `mr-*`, `pl-*`, `pr-*`, `text-left`, `text-right`, `left-*`, `right-*` anywhere in this file. Only `ms-*`, `me-*`, `text-start`, `text-end`.
- Arabic `<Input>` elements carry `dir={direction}` (from useDirection). English inputs do NOT.
- No inline `textAlign: 'right'` style anywhere (forceRTL flips it to LEFT — CLAUDE.md Rule 3).
- Each bilingual grid renders EN field first in JSX (Rule 1 — in RTL, first child renders on right = reading-start).
- Section headings use `text-start` (Rule 2 equivalent for Tailwind logical properties).
- No `.reverse()` call anywhere (Rule 4).

Then run `pnpm -C frontend typecheck` and `pnpm -C frontend lint frontend/src/components/dossier/wizard/steps/OfficeTermStep.tsx`.
</action>
<verify>
<automated>cd frontend && pnpm typecheck 2>&1 | tail -10 && pnpm lint src/components/dossier/wizard/steps/OfficeTermStep.tsx 2>&1 | tail -10</automated>
</verify>
<acceptance_criteria> - File exists at `frontend/src/components/dossier/wizard/steps/OfficeTermStep.tsx` - File exports `OfficeTermStep` as a named export: `grep -q "export function OfficeTermStep" <path>` → exit 0 - `grep -c "grid grid-cols-1 sm:grid-cols-2 gap-4" frontend/src/components/dossier/wizard/steps/OfficeTermStep.tsx` ≥ 4 (one per bilingual pair + term pair) - `grep -c "DossierPicker" frontend/src/components/dossier/wizard/steps/OfficeTermStep.tsx` ≥ 2 (country + organization) - `grep -q 'filterByDossierType="country"' frontend/src/components/dossier/wizard/steps/OfficeTermStep.tsx` → exit 0 - `grep -q 'filterByDossierType="organization"' frontend/src/components/dossier/wizard/steps/OfficeTermStep.tsx` → exit 0 - `grep -q 'type="date"' frontend/src/components/dossier/wizard/steps/OfficeTermStep.tsx` → exit 0 (at least 2 matches — term_start + term_end) - `grep -q 'from .@/components/work-creation/DossierPicker.' frontend/src/components/dossier/wizard/steps/OfficeTermStep.tsx` → exit 0 - `grep -q "stepId=\"office-term\"" frontend/src/components/dossier/wizard/steps/OfficeTermStep.tsx` → exit 0 - No forbidden RTL classes: `! grep -E "\\b(ml-[0-9]|mr-[0-9]|pl-[0-9]|pr-[0-9]|text-left|text-right|left-[0-9]|right-[0-9])\\b" frontend/src/components/dossier/wizard/steps/OfficeTermStep.tsx` → exits 0 (no matches) - No `textAlign: 'right'` anywhere: `! grep "textAlign.*right" frontend/src/components/dossier/wizard/steps/OfficeTermStep.tsx` → exit 0 - All 10 field names from PersonFormData present (one FormField `name="X"` each):
`office_name_en`, `office_name_ar`, `country_id`, `organization_id`, `district_en`, `district_ar`, `party_en`, `party_ar`, `term_start`, `term_end` — verify via:
`for f in office_name_en office_name_ar country_id organization_id district_en district_ar party_en party_ar term_start term_end; do grep -q "name=\"$f\"" frontend/src/components/dossier/wizard/steps/OfficeTermStep.tsx || echo "MISSING $f"; done` → prints nothing - `pnpm -C frontend typecheck` exits 0 - `pnpm -C frontend lint <path>` exits 0 - File line count between 150 and 320 (verifies reasonable structure, not over/underbuilt)
</acceptance_criteria>
<done>
OfficeTermStep component exists with 4 sections, 2 DossierPickers (country required, org optional),
6 bilingual text inputs + 2 date inputs, all i18n keys referenced exist in both en/ar files,
no RTL-violating classes present, typecheck + lint pass.
</done>
</task>

</tasks>

<verification>
Run at plan close:
1. `cd frontend && pnpm typecheck` → exits 0
2. `cd frontend && pnpm lint src/components/dossier/wizard/steps/OfficeTermStep.tsx` → exits 0
3. `node -e "const en=require('./frontend/src/i18n/en/form-wizard.json'); const ar=require('./frontend/src/i18n/ar/form-wizard.json'); if (!en.elected_official || !ar.elected_official) throw new Error('missing namespace'); console.log('i18n parity OK')"` → prints "i18n parity OK"
4. `grep -l "OfficeTermStep" frontend/src/components/dossier/wizard/steps/OfficeTermStep.tsx` → file is found
</verification>

<success_criteria>

- OfficeTermStep component renders 4 sections (Office, Constituency, Party, Term) with correct heading keys
- Each bilingual pair (office_name, district, party) renders EN first in JSX order (RTL rule 1)
- Each Arabic Input carries `dir={direction}` attribute
- Required country DossierPicker emits `filterByDossierType="country"`
- Optional organization DossierPicker emits `filterByDossierType="organization"`
- Both term inputs are `type="date"`
- No forbidden RTL classes or textAlign:right anywhere
- All 30+ i18n keys exist in both en and ar files with valid JSON syntax
  </success_criteria>

<output>
After both tasks complete, create `.planning/phases/30-elected-official-wizard/30-02-SUMMARY.md`
documenting: OfficeTermStep file path, LOC count, section structure, DossierPicker prop signatures
chosen (match Phase 29 canonical form), i18n key count added (EN + AR), and RTL-compliance audit
results (grep scans for forbidden classes).
</output>
