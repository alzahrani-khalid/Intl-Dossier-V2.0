---
phase: 32-person-native-basic-info
plan: 32-03-review-identity-card
type: plan
created: 2026-04-18
requirements: [PBI-07]
depends_on: [32-02-person-basic-info-step]
owner: agent
autonomous: true
estimated_wave: 3
---

# Plan 32-03: PersonReviewStep Identity Card + Display Helpers

## Goal

Replace the generic "Basic Information" card in `PersonReviewStep` with a new "Identity" card (D-17) containing two sub-sections — Identity (honorific, name pairs, known-as, nationality, DOB, gender, photo preview) and Biographical summary (description EN/AR, tags) — per D-18. Wire the Identity card's "Edit" button to `onEditStep(0)` (D-20). Render `—` placeholders for missing fields on legacy drafts (D-21). The Basic Info card is not rendered for persons; card order becomes Identity → PersonDetails → OfficeTerm (elected_official only) → submit CTA (D-19).

## Requirements addressed

- **PBI-07** — Step 4 (Review) of elected-official wizard and Step 3 of person wizard render an "Identity" card with all 11 new identity values. Missing values show `—`. "Edit" returns to Step 1.

## Dependencies

- **Plan 32-02** — schema must expose the 11 new fields and `filterExtensionData` must populate `extensionData` with them; otherwise the review step has nothing to render.

## Files to modify / create

| Path                                                                      | Action           | Rationale                                                                                                      |
| ------------------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------- |
| `frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx`      | modify           | Replace Basic Info card with Identity card for person/elected_official subtypes (D-17, D-18, D-19, D-20, D-21) |
| `frontend/src/components/dossier/wizard/review/PersonReviewStep.test.tsx` | create or modify | Vitest — covers populated + legacy-draft cases (PBI-07 acceptance)                                             |
| `frontend/src/lib/honorific-display.ts`                                   | optional create  | Small helper to render `[honorific] [first] [last]` consistently with Plan 32-04's list helper, if shared      |

## Tasks

### Task 1: Modify `PersonReviewStep.tsx` — new Identity card

**Files:** `frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx` (modify)
**Decisions applied:** D-17, D-18, D-19, D-20, D-21, D-33
**Acceptance:** When `person_subtype ∈ {standard, elected_official}`, the rendered tree contains:

- A card with heading `t('wizard.person_identity.review.card_title')`
- An Identity sub-section showing the 11 fields (or `—` when any is null/empty)
- A Biographical summary sub-section separated by a subtle divider, showing description_en, description_ar, tags
- An "Edit" affordance that calls `onEditStep(0)` when clicked (PBI-07 acceptance)
- The old Basic Information card is NOT rendered for persons (D-17)
- Card order: Identity → PersonDetails → OfficeTerm (elected_official only) → submit (D-19)
  **Autonomous:** true

Implementation sketch (drop into the existing component; preserve existing PersonDetails + OfficeTerm cards unchanged):

```tsx
// frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx
// Phase 32 D-17..D-21: Identity card replaces Basic Information for persons.

import { useTranslation } from 'react-i18next'
import { useDirection } from '@/hooks/useDirection'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil } from 'lucide-react'

const DASH = '—'

interface IdentityCardProps {
  data: PersonFormData
  onEditStep: (index: number) => void
  // If your country resolution is already loaded (e.g. via a TanStack Query hook),
  // pass in the resolved country dossier name + ISO-2 code.
  nationality?: { name_en: string; name_ar: string; iso_2: string | null } | null
}

/** D-21: show `—` when the value is missing/empty. */
const fallback = (v: string | null | undefined): string =>
  v === undefined || v === null || v.trim() === '' ? DASH : v

function IdentityCard({ data, onEditStep, nationality }: IdentityCardProps): JSX.Element {
  const { t, i18n } = useTranslation('form-wizard')
  const { direction } = useDirection()
  const isRTL = i18n.language === 'ar'

  const genderLabel =
    data.gender === 'female'
      ? t('wizard.person_identity.gender.female')
      : data.gender === 'male'
        ? t('wizard.person_identity.gender.male')
        : DASH

  const nationalityLabel = nationality
    ? `${isRTL ? nationality.name_ar : nationality.name_en}${nationality.iso_2 ? ` (${nationality.iso_2})` : ''}`
    : DASH

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('wizard.person_identity.review.card_title')}</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="min-h-11 min-w-11"
          onClick={() => onEditStep(0)}
          aria-label={t('common.edit')}
        >
          <Pencil className="h-4 w-4 me-2" />
          {t('common.edit')}
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {/* Identity sub-section (D-18) */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DefinitionRow
            label={t('wizard.person_identity.honorific.label')}
            value={fallback(data.honorific_en)}
            valueAr={fallback(data.honorific_ar)}
          />
          <DefinitionRow
            label={t('wizard.person_identity.first_name.label_en')}
            value={fallback(data.first_name_en)}
          />
          <DefinitionRow
            label={t('wizard.person_identity.last_name.label_en')}
            value={fallback(data.last_name_en)}
          />
          <DefinitionRow
            label={t('wizard.person_identity.first_name.label_ar')}
            value={fallback(data.first_name_ar)}
            dir="rtl"
          />
          <DefinitionRow
            label={t('wizard.person_identity.last_name.label_ar')}
            value={fallback(data.last_name_ar)}
            dir="rtl"
          />
          <DefinitionRow
            label={t('wizard.person_identity.known_as.label_en')}
            value={fallback(data.known_as_en)}
          />
          <DefinitionRow
            label={t('wizard.person_identity.known_as.label_ar')}
            value={fallback(data.known_as_ar)}
            dir="rtl"
          />
          <DefinitionRow
            label={t('wizard.person_identity.nationality.label')}
            value={nationalityLabel}
          />
          <DefinitionRow
            label={t('wizard.person_identity.dob.label')}
            value={fallback(data.date_of_birth)}
          />
          <DefinitionRow label={t('wizard.person_identity.gender.label')} value={genderLabel} />
          {/* Photo preview — render thumbnail if URL present, else dash. D-21 */}
          <div className="col-span-full flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {t('wizard.person_identity.photo_url.label')}
            </span>
            {data.photo_url ? (
              <img
                src={data.photo_url}
                alt=""
                loading="lazy"
                className="h-16 w-16 rounded-md object-cover"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : (
              <span>{DASH}</span>
            )}
          </div>
        </section>

        {/* D-18 divider */}
        <hr className="border-t" />

        {/* Biographical summary sub-section (D-18) */}
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">
            {t('wizard.person_identity.review.biographical_summary_heading')}
          </h3>
          <DefinitionRow
            label={t('wizard.basicInfo.description_en')}
            value={fallback(data.description_en)}
          />
          <DefinitionRow
            label={t('wizard.basicInfo.description_ar')}
            value={fallback(data.description_ar)}
            dir="rtl"
          />
          <div className="flex flex-wrap gap-2">
            {(data.tags ?? []).length === 0 ? (
              <span>{DASH}</span>
            ) : (
              (data.tags ?? []).map((tag: string) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))
            )}
          </div>
        </section>
      </CardContent>
    </Card>
  )
}

// Keep PersonDetails + OfficeTerm cards rendered as they are today. Card order per D-19:
// [IdentityCard] → [PersonDetailsCard] → [OfficeTermCard if elected_official] → [submit].
// The old BasicInfoCard is NOT rendered for persons (D-17) — delete or guard its render.
```

Implementer notes:

- **D-17 enforcement:** find the existing "Basic Information" card render in `PersonReviewStep.tsx` and wrap its JSX in a condition that excludes `person_subtype ∈ {'standard','elected_official'}`. Easiest: if this review step is already person-specific (it is — the filename is PersonReviewStep), just delete the Basic Information card outright and render `IdentityCard` in its place.
- **D-20 Edit wiring:** the Edit button on the Identity card MUST call `onEditStep(0)` (Step 1 is the new PersonBasicInfoStep). Use whatever prop the existing card uses for its edit handler.
- **Nationality resolution:** if `PersonReviewStep` already consumes a hook or query that enriches the country dossier, pass `name_en/name_ar/iso_2` through. If not, use a light `useQuery` call against the dossiers-by-id endpoint, keyed by `data.nationality_id`. (Implementer checks existing hooks in `frontend/src/hooks/` and `frontend/src/domains/countries/` for a ready-made enrichment; do NOT invent a new API.)
- **Photo preview:** the SPEC implies a preview. Render at 64×64 with `object-cover` + rounded corners; on `onError` (broken URL), hide the `<img>` and fall back to `—`. Lazy-load via `loading="lazy"`.
- **RTL:** every AR value row uses `dir="rtl"`; never `textAlign: "right"` (D-33). Use logical Tailwind (`me-2`, `ms-*`) only.
- **Touch targets:** the Edit button meets `min-h-11 min-w-11`.

### Task 2: Vitest — `PersonReviewStep.test.tsx`

**Files:** `frontend/src/components/dossier/wizard/review/PersonReviewStep.test.tsx` (create or modify)
**Decisions applied:** —
**Acceptance:** `pnpm --filter frontend test -- PersonReviewStep` passes. Covers PBI-07 acceptance:

1. **Populated case:** given form data with all 11 identity values populated + a resolved `nationality` prop, render PersonReviewStep and assert each of the 11 values appears exactly once in the rendered DOM. Expected DOM occurrences tested via `screen.getAllByText` counts.
2. **Legacy draft case:** given form data with all 11 identity values undefined/null (simulating a legacy localStorage draft), render and assert `—` appears in each row (photo preview also shows `—`, not a broken image).
3. **Edit wiring:** mount with a spy `onEditStep`; click the Identity card's Edit button; assert `onEditStep` was called with `0` (not 1, not undefined). Matches PBI-07 acceptance.
4. **No Basic Information card:** `screen.queryByText(/basic information/i)` returns null (D-17). If the card title uses an i18n key, query by that key's EN string.
5. **Card order:** using `getAllByRole('region')` or `getAllByText` with heading matchers, assert order Identity → PersonDetails → (if elected_official) OfficeTerm.
6. **Bilingual render:** when `i18n.language === 'ar'`, the Identity card title reads `t('wizard.person_identity.review.card_title')` resolved to Arabic (`"الهوية"`). Use `changeLanguage('ar')` in test setup.

**Autonomous:** true

Use `@testing-library/react` + `userEvent`. If an existing `PersonReviewStep.test.tsx` is present, extend it; otherwise create fresh. Mock any country-enrichment hook at the module boundary so tests don't hit Supabase.

## Tests

- Vitest: `PersonReviewStep.test.tsx` (Task 2) — 6 cases covering populated / legacy-draft / edit-wiring / basic-info absence / card-order / bilingual rendering

## Verification commands

```bash
pnpm --filter frontend typecheck
pnpm --filter frontend test -- PersonReviewStep

# D-17 acceptance — Basic Information card removed for persons
grep -n 'Basic Information' frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx || echo "OK: no Basic Information heading"
```

## Rollback

- `git revert` the commit for `PersonReviewStep.tsx` — restores the original Basic Information card. The test file revert also restores the prior test behavior. No other files touched in this plan.

## Threat model

| Threat                                                             | Severity | Mitigation                                                                                                           |
| ------------------------------------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------- |
| Broken `photo_url` rendered as image (UI regression)               | Low      | `<img onError>` hides the element and the `—` fallback remains visible. `loading="lazy"` avoids render-blocking.     |
| XSS via rendered strings (names, description, honorific free-text) | Low      | All values rendered via JSX interpolation — React escapes automatically. No raw-HTML injection anywhere in the card. |
| Legacy draft with `null`/`undefined` fields crashes render         | Low      | `fallback()` helper and nullish-coalesced array access on `data.tags`. Tests cover the all-null case (Task 2 #2).    |
| Edit button on mobile too small to hit reliably                    | Low      | Button sized `min-h-11 min-w-11` per CLAUDE.md; verified in Task 2's render.                                         |
| Incorrect nationality resolution (wrong country joined)            | Low      | Nationality prop is strongly typed; if enrichment query fails, card shows `—` instead of a wrong country.            |
