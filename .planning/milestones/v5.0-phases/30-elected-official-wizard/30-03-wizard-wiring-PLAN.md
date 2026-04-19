---
phase: 30-elected-official-wizard
plan: 03
type: execute
wave: 2
depends_on: ['30-01']
files_modified:
  - frontend/src/routes/_protected/dossiers/elected-officials/create.tsx
  - frontend/src/routes/_protected/dossiers/elected-officials/index.tsx
  - frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx
autonomous: true
requirements: [ELOF-01, ELOF-04]
requirements_addressed: [ELOF-01, ELOF-04]
tags: [v5.0, routing, wizard-wiring, review-step, tanstack-router]

must_haves:
  truths:
    - 'Navigating to /dossiers/elected-officials/create renders the wizard shell with 4 step chips'
    - "Elected Officials list page's 'Add' button links to /dossiers/elected-officials/create (not /dossiers/create)"
    - "Review step shows an 'Office & Term' card ONLY when person_subtype === 'elected_official'"
    - "Review step's Office & Term card displays: office_name_en, office_name_ar, country_id (resolved to name or ID), organization_id (optional), district pair, party pair, term_start, term_end (or 'ongoing' when empty)"
    - "Clicking 'Edit' on the Office & Term section calls onEditStep(2) — navigating the wizard back to step 3 (index 2)"
    - 'Standard person wizard (from /dossiers/persons/create) still renders only 3 steps; the conditional review block does not render for standard persons'
  artifacts:
    - path: 'frontend/src/routes/_protected/dossiers/elected-officials/create.tsx'
      provides: 'New TanStack Router file route for the Elected Official wizard'
      exports: ['Route']
    - path: 'frontend/src/routes/_protected/dossiers/elected-officials/index.tsx'
      provides: 'Updated list page with typed Create button link'
      contains: '/dossiers/elected-officials/create'
    - path: 'frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx'
      provides: 'Extended review step with conditional office/term section'
      contains: 'elected_official'
  key_links:
    - from: 'frontend/src/routes/_protected/dossiers/elected-officials/create.tsx'
      to: 'electedOfficialWizardConfig + useCreateDossierWizard + CreateWizardShell'
      via: 'named imports + component composition'
      pattern: 'electedOfficialWizardConfig'
    - from: 'frontend/src/routes/_protected/dossiers/elected-officials/index.tsx'
      to: '/dossiers/elected-officials/create'
      via: '<Link to="..." /> on PageHeader Create button'
      pattern: '/dossiers/elected-officials/create'
    - from: 'frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx'
      to: 'OfficeTermStep (step index 2)'
      via: 'onEditStep(2) call inside conditional ReviewSection'
      pattern: "onEditStep\\(2\\)"
---

<objective>
Wire the Office/Term step into a navigable wizard: create the `/dossiers/elected-officials/create`
route (D-03), point the Elected Officials list page's Create button at it (D-18), and extend
PersonReviewStep with a conditional "Office & Term" section (D-07) so users see their office/term
entries on the final Review step before submit.

Purpose: Plan 30-01 provided the schema, Plan 30-02 built the step component — this plan makes
them reachable and reviewable end-to-end. After this plan lands, an authenticated user can navigate
from /dossiers/elected-officials → click Create → fill all 4 steps → land on a working dossier
detail page.

Output:

- create.tsx route file for /dossiers/elected-officials/create
- Updated list page index.tsx with typed Create button link
- PersonReviewStep.tsx extended with a conditional ReviewSection for elected-official data
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

# Prior Phase 30 SUMMARYs (reference — types + config this plan consumes):

@.planning/phases/30-elected-official-wizard/30-01-SUMMARY.md

# Files being modified (read full contents before editing):

@frontend/src/routes/\_protected/dossiers/elected-officials/index.tsx
@frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx

# Reference files (mirror Phase 28's persons create route):

@frontend/src/routes/\_protected/dossiers/persons/create.tsx
</context>

<interfaces>
<!-- Patterns this plan replicates or extends. -->

From frontend/src/routes/\_protected/dossiers/persons/create.tsx (Phase 28 D-22 convention):

```typescript
import { createFileRoute, Link } from '@tanstack/react-router'
import { useCreateDossierWizard } from '@/components/dossier/wizard/hooks/useCreateDossierWizard'
import { CreateWizardShell } from '@/components/dossier/wizard/CreateWizardShell'
import { SharedBasicInfoStep } from '@/components/dossier/wizard/SharedBasicInfoStep'
import { PersonDetailsStep } from '@/components/dossier/wizard/steps/PersonDetailsStep'
import { PersonReviewStep } from '@/components/dossier/wizard/review/PersonReviewStep'
import { personWizardConfig } from '@/components/dossier/wizard/config/person.config'

export const Route = createFileRoute('/_protected/dossiers/persons/create')({
  component: CreatePersonPage,
})

function CreatePersonPage(): ReactElement {
  const wizard = useCreateDossierWizard<PersonFormData>(personWizardConfig)
  return (
    <div className="space-y-4">
      <Link to="/dossiers/persons" className="...">...</Link>
      <h1 className="text-lg font-semibold">{t('person.page_title')}</h1>
      <CreateWizardShell wizard={wizard}>
        <SharedBasicInfoStep form={wizard.form} dossierType="person" />
        <PersonDetailsStep form={wizard.form} />
        <PersonReviewStep form={wizard.form} onEditStep={wizard.setCurrentStep} />
      </CreateWizardShell>
    </div>
  )
}
```

Phase 30 version adds OfficeTermStep as the 3rd step (index 2) and uses
electedOfficialWizardConfig (from Plan 30-01).

From frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx (review section pattern):

```typescript
<ReviewSection
  title={t('form-wizard:review.person_details')}
  onEdit={() => onEditStep(1)}  // step index 1 = person-details step
>
  <ReviewField label={...} value={...} />
</ReviewSection>
```

For elected-official, the Office & Term section will call `onEditStep(2)` (step index 2 = office-term step).

Current Elected Officials list page index.tsx (lines 38-44):

```typescript
<Button asChild className="min-h-11 min-w-11 w-full sm:w-auto">
  <Link to="/dossiers/create">       {/* ← change to "/dossiers/elected-officials/create" */}
    <Plus className="h-4 w-4 me-2" />
    {t('list.add')}
  </Link>
</Button>
```

</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Create /dossiers/elected-officials/create route file</name>
  <files>frontend/src/routes/_protected/dossiers/elected-officials/create.tsx</files>
  <read_first>
    - frontend/src/routes/_protected/dossiers/persons/create.tsx (full — exact template to mirror)
    - frontend/src/components/dossier/wizard/config/person.config.ts (confirm electedOfficialWizardConfig export name — from Plan 30-01)
    - .planning/phases/30-elected-official-wizard/30-CONTEXT.md (§D-03)
  </read_first>
  <action>
Create a NEW file at `frontend/src/routes/_protected/dossiers/elected-officials/create.tsx` with this EXACT content:

```typescript
/**
 * Elected Official Wizard Route (Phase 30 D-03)
 *
 * Composes SharedBasicInfoStep, PersonDetailsStep, OfficeTermStep, and PersonReviewStep
 * into a 4-step wizard via useCreateDossierWizard + CreateWizardShell.
 *
 * Uses electedOfficialWizardConfig which pre-seeds person_subtype='elected_official'
 * in defaults and returns a 4-step array. Submits to the persons endpoint (DossierType='person'),
 * with is_current_term auto-derived at submit time by filterExtensionData.
 */
import type { ReactElement } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'

import { useCreateDossierWizard } from '@/components/dossier/wizard/hooks/useCreateDossierWizard'
import { CreateWizardShell } from '@/components/dossier/wizard/CreateWizardShell'
import { SharedBasicInfoStep } from '@/components/dossier/wizard/SharedBasicInfoStep'
import { PersonDetailsStep } from '@/components/dossier/wizard/steps/PersonDetailsStep'
import { OfficeTermStep } from '@/components/dossier/wizard/steps/OfficeTermStep'
import { PersonReviewStep } from '@/components/dossier/wizard/review/PersonReviewStep'
import { electedOfficialWizardConfig } from '@/components/dossier/wizard/config/person.config'
import type { PersonFormData } from '@/components/dossier/wizard/schemas/person.schema'

export const Route = createFileRoute('/_protected/dossiers/elected-officials/create')({
  component: CreateElectedOfficialPage,
})

function CreateElectedOfficialPage(): ReactElement {
  const { t } = useTranslation('form-wizard')
  const wizard = useCreateDossierWizard<PersonFormData>(electedOfficialWizardConfig)

  return (
    <div className="space-y-4">
      <Link
        to="/dossiers/elected-officials"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground min-h-11"
      >
        <ChevronLeft className="h-4 w-4 me-1" />
        {t('elected_official.back_to_list', 'Back to Elected Officials')}
      </Link>
      <h1 className="text-lg font-semibold">{t('elected_official.page_title')}</h1>
      <CreateWizardShell wizard={wizard}>
        <SharedBasicInfoStep form={wizard.form} dossierType="person" />
        <PersonDetailsStep form={wizard.form} />
        <OfficeTermStep form={wizard.form} />
        <PersonReviewStep form={wizard.form} onEditStep={wizard.setCurrentStep} />
      </CreateWizardShell>
    </div>
  )
}
```

**Note on route tree regeneration:** TanStack Router uses `@tanstack/router-vite-plugin` (per Phase 28 D-22 precedent). The dev server regenerates `routeTree.gen.ts` automatically when a new route file appears under `src/routes/`. During CI/typecheck, run `pnpm -C frontend dev --help 2>/dev/null || true` to ensure plugin is reachable, then `pnpm -C frontend typecheck` — if the generated tree is stale, the typecheck will fail with "route path not registered". If that happens, run:

```
cd frontend && pnpm tsr generate
```

to regenerate explicitly, then re-run typecheck.

After creation, confirm typecheck passes: `pnpm -C frontend typecheck`.
</action>
<verify>
<automated>cd frontend && pnpm typecheck 2>&1 | tail -15</automated>
</verify>
<acceptance_criteria> - File exists at `frontend/src/routes/_protected/dossiers/elected-officials/create.tsx` - File exports `Route` as a named export: `grep -q "export const Route = createFileRoute" <path>` → exit 0 - File imports `electedOfficialWizardConfig`: `grep -q "electedOfficialWizardConfig" <path>` → exit 0 - File imports `OfficeTermStep`: `grep -q "OfficeTermStep" <path>` → exit 0 - File contains literal string `/_protected/dossiers/elected-officials/create` inside the createFileRoute call - The CreateWizardShell children count is exactly 4 (SharedBasicInfoStep, PersonDetailsStep, OfficeTermStep, PersonReviewStep) — verify via: `grep -E "Step form={wizard.form}" <path> | wc -l` → 4 (OfficeTermStep + PersonDetailsStep + PersonReviewStep + SharedBasicInfoStep each appear once) - `pnpm -C frontend typecheck` exits 0 - File ends without a trailing semicolon on the last statement (single-quote + no-semi style per CLAUDE.md)
</acceptance_criteria>
<done>
Route file exists, imports correct config + OfficeTermStep, typecheck passes,
route tree regenerated (via vite plugin) so navigation works.
</done>
</task>

<task type="auto">
  <name>Task 2: Update Elected Officials list page Create button link</name>
  <files>frontend/src/routes/_protected/dossiers/elected-officials/index.tsx</files>
  <read_first>
    - frontend/src/routes/_protected/dossiers/elected-officials/index.tsx (full — 52 lines)
    - .planning/phases/30-elected-official-wizard/30-CONTEXT.md (§D-18)
  </read_first>
  <action>
In `frontend/src/routes/_protected/dossiers/elected-officials/index.tsx`, change exactly one line:

Line 39, current:

```
            <Link to="/dossiers/create">
```

Replace with:

```
            <Link to="/dossiers/elected-officials/create">
```

Do NOT change any other line. Do NOT reformat whitespace. Do NOT "improve" adjacent code.
Keep all existing imports, the validateSearch shape, and the `<ElectedOfficialListTable />` usage.

Then run `pnpm -C frontend typecheck`.
</action>
<verify>
<automated>grep -q 'to="/dossiers/elected-officials/create"' frontend/src/routes/\_protected/dossiers/elected-officials/index.tsx && ! grep -q 'to="/dossiers/create"' frontend/src/routes/\_protected/dossiers/elected-officials/index.tsx && cd frontend && pnpm typecheck 2>&1 | tail -10</automated>
</verify>
<acceptance_criteria> - `grep -c 'to="/dossiers/elected-officials/create"' frontend/src/routes/_protected/dossiers/elected-officials/index.tsx` == 1 - `grep -c 'to="/dossiers/create"' frontend/src/routes/_protected/dossiers/elected-officials/index.tsx` == 0 (old link gone) - File line count is within ±2 of the original (i.e., only one line's content changed, no blocks added/removed) - File still contains `<ElectedOfficialListTable />` unchanged - File still contains `<PageHeader` and `Plus className="h-4 w-4 me-2"` unchanged - `pnpm -C frontend typecheck` exits 0
</acceptance_criteria>
<done>
List page Create button now routes to the Phase 30 typed create route; all other list page
behavior unchanged; typecheck passes.
</done>
</task>

<task type="auto">
  <name>Task 3: Extend PersonReviewStep with conditional Office & Term section</name>
  <files>frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx</files>
  <read_first>
    - frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx (full — 123 lines)
    - frontend/src/components/dossier/wizard/review/ReviewComponents.tsx (ReviewSection + ReviewField signatures — if needed)
    - .planning/phases/30-elected-official-wizard/30-CONTEXT.md (§D-07)
  </read_first>
  <action>
In `frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx`, add a NEW `ReviewSection` block immediately AFTER the existing "Person Details section" `</ReviewSection>` closing tag (around line 120) and BEFORE the `</FormWizardStep>` closing tag.

The exact block to insert:

```tsx
{
  /* Phase 30 D-07: Office & Term section — rendered ONLY for elected-official subtype */
}
{
  values.person_subtype === 'elected_official' && (
    <ReviewSection title={t('form-wizard:review.office_term')} onEdit={() => onEditStep(2)}>
      <ReviewField
        label={t('form-wizard:elected_official.office_name_en')}
        value={values.office_name_en}
      />
      <ReviewField
        label={t('form-wizard:elected_official.office_name_ar')}
        value={values.office_name_ar}
      />
      <ReviewField label={t('form-wizard:elected_official.country')} value={values.country_id} />
      <ReviewField
        label={t('form-wizard:elected_official.organization')}
        value={values.organization_id}
      />
      <ReviewField
        label={t('form-wizard:elected_official.district_en')}
        value={values.district_en}
      />
      <ReviewField
        label={t('form-wizard:elected_official.district_ar')}
        value={values.district_ar}
      />
      <ReviewField label={t('form-wizard:elected_official.party_en')} value={values.party_en} />
      <ReviewField label={t('form-wizard:elected_official.party_ar')} value={values.party_ar} />
      <ReviewField label={t('form-wizard:elected_official.term_start')} value={values.term_start} />
      <ReviewField
        label={t('form-wizard:elected_official.term_end')}
        value={
          values.term_end !== undefined && values.term_end !== ''
            ? values.term_end
            : t('form-wizard:elected_official.term_end_help')
        }
      />
    </ReviewSection>
  )
}
```

Do NOT modify any of the existing two ReviewSection blocks (Basic Info, Person Details).
Do NOT change the imports or the `values = form.watch()` line — they are already correct.

Then run `pnpm -C frontend typecheck` and lint.

**Note on file size:** This adds ~45 lines, bringing the total to ~170 LOC — well under the
200 LOC threshold in the Claude's Discretion note in the CONTEXT. No extraction needed.
</action>
<verify>
<automated>cd frontend && pnpm typecheck 2>&1 | tail -10 && pnpm lint src/components/dossier/wizard/review/PersonReviewStep.tsx 2>&1 | tail -10</automated>
</verify>
<acceptance_criteria> - `grep -c "person_subtype === 'elected_official'" frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx` == 1 - `grep -q "onEditStep(2)" frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx` → exit 0 - `grep -q "form-wizard:review.office_term" frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx` → exit 0 - `grep -q "form-wizard:elected_official.office_name_en" frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx` → exit 0 - `grep -q "form-wizard:elected_official.term_end" frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx` → exit 0 - The existing two ReviewSection blocks are unchanged (basic_info + person_details still present; grep for each still returns 1 match) - File total LOC between 155 and 200 - `pnpm -C frontend typecheck` exits 0 - `pnpm -C frontend lint <path>` exits 0 - Existing behavior preserved for standard persons: when person_subtype !== 'elected_official', the new block short-circuits and renders null
</acceptance_criteria>
<done>
PersonReviewStep now renders a third ReviewSection only for elected_official subtype,
showing all 10 office/term/constituency/party fields. Standard person wizard review
output is unchanged. Typecheck + lint pass.
</done>
</task>

</tasks>

<verification>
Run at plan close:
1. `cd frontend && pnpm typecheck` → exits 0
2. `cd frontend && pnpm lint src/routes/_protected/dossiers/elected-officials/create.tsx src/components/dossier/wizard/review/PersonReviewStep.tsx` → exits 0
3. `grep -q "/dossiers/elected-officials/create" frontend/src/routes/_protected/dossiers/elected-officials/index.tsx` → exit 0
4. `grep -q "OfficeTermStep" frontend/src/routes/_protected/dossiers/elected-officials/create.tsx` → exit 0
5. `grep -q "person_subtype === 'elected_official'" frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx` → exit 0

Manual spot-check (not required for PASS, but useful): `pnpm -C frontend dev`, navigate to
http://localhost:5173/dossiers/elected-officials, click the Create button, verify the wizard
shell renders 4 step chips labeled (in EN): Basic Information, Person Details, Office & Term, Review.
</verification>

<success_criteria>

- `/dossiers/elected-officials/create` route resolves to CreateElectedOfficialPage component
- Elected Officials list Create button links to the new typed route
- Review step renders 3 sections (Basic, Person Details, Office & Term) for elected officials
- Review step renders 2 sections (Basic, Person Details) for standard persons (unchanged)
- Office & Term edit button navigates to step index 2 (the OfficeTermStep)
- TypeScript and ESLint both pass
  </success_criteria>

<output>
After all 3 tasks complete, create `.planning/phases/30-elected-official-wizard/30-03-SUMMARY.md`
documenting: new route file path, list page link change, PersonReviewStep LOC delta,
and a note confirming the standard persons wizard is unaffected (grep output showing
/dossiers/persons/create still uses personWizardConfig with 3 steps).
</output>
