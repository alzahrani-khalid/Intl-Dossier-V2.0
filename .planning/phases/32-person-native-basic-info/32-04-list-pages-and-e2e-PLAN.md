---
phase: 32-person-native-basic-info
plan: 32-04-list-pages-and-e2e
type: plan
created: 2026-04-18
requirements: [PBI-06]
depends_on:
  [32-01-migration-and-edge-function, 32-02-person-basic-info-step, 32-03-review-identity-card]
owner: agent
autonomous: true
estimated_wave: 4
---

# Plan 32-04: List-Page Rendering + Nationality Badge + E2E Spec

## Goal

Render `[honorific_en]? [first_name_en] [last_name_en]` as the primary label on both `/dossiers/persons` and `/dossiers/elected-officials` list pages, with a fallback to `dossiers.name_en` for legacy rows (D-15). Add a flag-emoji + ISO-2 nationality badge inline after the name when `nationality_country_id` is populated (D-11..D-14). Land a Playwright E2E spec that walks the full wizard flow end-to-end (create → submit → read-back → list-row assertion) covering PBI-05 + PBI-06 acceptance in one pass.

## Requirements addressed

- **PBI-06** — Persons and Elected Officials list pages show honorific + last name as the primary label and render a nationality badge when `nationality_country_id` is populated. Legacy rows still render via `name_en` fallback.
- **PBI-05** (E2E coverage only; main implementation is in Plan 32-01) — E2E submits a full wizard payload and asserts the row in DB.
- **PBI-02, PBI-03, PBI-07** (E2E coverage only) — E2E touches every required field; list-page read-back doubles as smoke for the review card.

## Dependencies

- **Plan 32-01** — columns must exist + Edge Function must accept new fields.
- **Plan 32-02** — wizard flow must actually submit the new fields.
- **Plan 32-03** — review card used as an assertion point during the E2E.

## Files to modify / create

| Path                                                                                                | Action | Rationale                                                              |
| --------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------- |
| `frontend/src/lib/person-display.ts`                                                                | create | Shared `formatPersonLabel()` + `isoToFlagEmoji()` helpers (D-15, D-11) |
| `frontend/src/lib/person-display.test.ts`                                                           | create | Vitest covering label rules + flag-emoji generation                    |
| `frontend/src/routes/_protected/dossiers/persons/index.tsx`                                         | modify | Swap row label to `formatPersonLabel()`; add nationality badge         |
| `frontend/src/routes/_protected/dossiers/elected-officials/index.tsx`                               | modify | Same swap + badge                                                      |
| `frontend/src/components/elected-officials/ElectedOfficialListTable.tsx`                            | modify | Row-level rendering update (table consumer of the above)               |
| Persons list query hook (e.g. `frontend/src/domains/persons/hooks/usePersonsList.ts` or equivalent) | modify | Extend select to join nationality country ISO-2 (D-16)                 |
| `tests/e2e/person-identity-fields.spec.ts`                                                          | create | Playwright E2E spec (PBI-05 + PBI-06 acceptance)                       |

The exact paths of the persons-list query hook and any elected-official list hook should be located by the implementer via `grep -rn "from('persons')" frontend/src/` and `grep -rn "ElectedOfficialListTable" frontend/src/`. Do NOT invent new data-fetching patterns — piggyback on whatever exists.

## Tasks

### Task 1: Create `person-display.ts` — label composition + flag emoji helpers

**Files:** `frontend/src/lib/person-display.ts` (create), `frontend/src/lib/person-display.test.ts` (create)
**Decisions applied:** D-11, D-15
**Acceptance:** `pnpm --filter frontend test -- person-display` passes (all 7+ cases). `formatPersonLabel` implements D-15 exactly; `isoToFlagEmoji('SA')` returns `'🇸🇦'`.
**Autonomous:** true

```ts
// frontend/src/lib/person-display.ts
// Phase 32 D-11 + D-15: shared display helpers for persons + elected-officials lists.

export interface PersonDisplayInput {
  honorific_en?: string | null
  honorific_ar?: string | null
  first_name_en?: string | null
  last_name_en?: string | null
  first_name_ar?: string | null
  last_name_ar?: string | null
  name_en?: string | null // dossiers.name_en (legacy fallback)
  name_ar?: string | null
}

/**
 * D-15: compose the list-row primary label per locale.
 * - first + last populated → "[honorific ]? first last"
 * - last only (single-word)  → "[honorific ]? last"
 * - neither populated         → fall back to dossiers.name_en / name_ar
 */
export const formatPersonLabel = (p: PersonDisplayInput, locale: 'en' | 'ar'): string => {
  const honorific = locale === 'en' ? p.honorific_en : p.honorific_ar
  const first = locale === 'en' ? p.first_name_en : p.first_name_ar
  const last = locale === 'en' ? p.last_name_en : p.last_name_ar
  const fallback = locale === 'en' ? p.name_en : p.name_ar

  const honPrefix = honorific && honorific.trim() !== '' ? `${honorific.trim()} ` : ''

  if (last && last.trim() !== '' && first && first.trim() !== '') {
    return `${honPrefix}${first.trim()} ${last.trim()}`
  }
  if (last && last.trim() !== '') {
    return `${honPrefix}${last.trim()}`
  }
  return fallback ?? ''
}

/**
 * D-11: convert an ISO-2 country code (e.g. "SA") into the flag emoji
 * via two Unicode Regional Indicator Symbols. No image asset needed.
 * Returns empty string for invalid inputs.
 */
export const isoToFlagEmoji = (iso2: string | null | undefined): string => {
  if (!iso2) return ''
  const code = iso2.trim().toUpperCase()
  if (code.length !== 2) return ''
  if (!/^[A-Z]{2}$/.test(code)) return ''
  const A = 0x41
  const REGIONAL_INDICATOR_A = 0x1f1e6
  const first = REGIONAL_INDICATOR_A + (code.charCodeAt(0) - A)
  const second = REGIONAL_INDICATOR_A + (code.charCodeAt(1) - A)
  return String.fromCodePoint(first) + String.fromCodePoint(second)
}

/**
 * D-11 composite: `🇸🇦 SA` badge text. Returns empty string when iso2 missing.
 */
export const nationalityBadgeText = (iso2: string | null | undefined): string => {
  const flag = isoToFlagEmoji(iso2)
  if (!iso2 || !flag) return ''
  return `${flag} ${iso2.trim().toUpperCase()}`
}
```

Test cases (`person-display.test.ts`):

1. `formatPersonLabel({ first_name_en:'Test', last_name_en:'Person' }, 'en')` → `"Test Person"`
2. `formatPersonLabel({ honorific_en:'H.E.', first_name_en:'Test', last_name_en:'Person' }, 'en')` → `"H.E. Test Person"`
3. `formatPersonLabel({ last_name_en:'Madonna' }, 'en')` → `"Madonna"` (single-word D-07 row)
4. `formatPersonLabel({ honorific_en:'Dr.', last_name_en:'Madonna' }, 'en')` → `"Dr. Madonna"`
5. `formatPersonLabel({ name_en:'Legacy Row Name' }, 'en')` → `"Legacy Row Name"` (legacy fallback D-15)
6. `formatPersonLabel({ first_name_ar:'محمد', last_name_ar:'الفيصل', honorific_ar:'سعادة' }, 'ar')` → `"سعادة محمد الفيصل"`
7. `isoToFlagEmoji('SA')` → `'🇸🇦'`; `isoToFlagEmoji('US')` → `'🇺🇸'`; `isoToFlagEmoji('xy')` → `'🇽🇾'` (any 2-letter is mapped — validator is "2 ASCII letters", not "real country").
8. `isoToFlagEmoji(null)` → `''`; `isoToFlagEmoji('USA')` → `''`; `isoToFlagEmoji('')` → `''`
9. `nationalityBadgeText('SA')` → `'🇸🇦 SA'`; `nationalityBadgeText(null)` → `''`

### Task 2: Extend persons-list data fetch — join nationality country ISO-2

**Files:** the persons list query hook (implementer finds via grep; likely `frontend/src/domains/persons/hooks/*.ts`), `frontend/src/components/elected-officials/ElectedOfficialListTable.tsx` (if it has its own query)
**Decisions applied:** D-16
**Acceptance:** List rows returned from the hook include `nationality_iso_2` (string or null). If the hook already returns a full dossier join, extend the join; otherwise add a left-join through `nationality_country_id → dossiers → countries`.
**Autonomous:** true

Recommended Supabase query shape (D-16 — join over denormalization):

```ts
// Example snippet for a TanStack Query persons list hook.
// The exact select depends on the existing hook; splice these joined fields in.
const { data, error } = await supabase
  .from('persons')
  .select(
    `
    id,
    honorific_en, honorific_ar,
    first_name_en, last_name_en,
    first_name_ar, last_name_ar,
    nationality_country_id,
    dossier:dossiers!persons_id_fkey (
      name_en, name_ar, type, status, sensitivity_level
    ),
    nationality:dossiers!persons_nationality_country_id_fkey (
      id,
      name_en,
      name_ar,
      countries ( iso_2 )
    )
  `,
  )
  .eq('dossier.type', 'person') // or filter by elected_official subtype for the other list
// ...existing RLS + filters...
```

Notes for the implementer:

- **Ambiguous FK disambiguation:** Supabase PostgREST requires explicit FK hints like `dossiers!persons_id_fkey` when two FKs target the same table. The relationship name may differ in this codebase — check `supabase/migrations/20260202000001_merge_elected_official_into_person.sql` or run `mcp__supabase__execute_sql "SELECT conname FROM pg_constraint WHERE conrelid = 'public.persons'::regclass"` to list constraint names. Use the actual names.
- **`countries.iso_2` column:** verify column name in existing migrations (search `countries.*iso`). If named differently (`iso_code`, `country_iso_2`), update accordingly.
- **Map output:** wherever the hook maps rows for the table, add `nationality_iso_2: row.nationality?.countries?.iso_2 ?? null` to the mapped shape.
- **Don't denormalize:** D-16 explicitly recommends join (not writing ISO-2 onto persons at write-time).
- **If the elected-officials list uses a separate hook,** apply the same pattern there. If it reuses the persons-list hook with a subtype filter, no second change needed.

### Task 3: Update persons list page rendering

**Files:** `frontend/src/routes/_protected/dossiers/persons/index.tsx` (modify), `frontend/src/components/elected-officials/ElectedOfficialListTable.tsx` (modify)
**Decisions applied:** D-11, D-12, D-13, D-14, D-15
**Acceptance:** Each list row's primary label renders via `formatPersonLabel()`; each row renders a `<Badge>` with `nationalityBadgeText(iso_2)` when `nationality_iso_2` is populated, and renders NOTHING when it is null (D-14).
**Autonomous:** true

In the persons list page (the persons/index.tsx route component), locate the row rendering JSX and replace the label expression with `formatPersonLabel(row, locale)`. Inline the badge per D-12 — after the name, same flex row:

```tsx
import { formatPersonLabel, nationalityBadgeText } from '@/lib/person-display'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'

const { i18n } = useTranslation()
const locale: 'en' | 'ar' = i18n.language === 'ar' ? 'ar' : 'en'

// ...inside the row:
<div className="flex items-center gap-2">
  <span className="text-base font-semibold text-start">
    {formatPersonLabel(row, locale)}
  </span>
  {row.nationality_iso_2 && (
    <Badge variant="secondary" className="text-xs">
      {nationalityBadgeText(row.nationality_iso_2)}
    </Badge>
  )}
</div>
```

Notes:

- **D-12 RTL ordering:** with `forceRTL(true)`, the first child (`<span>` with the name) renders on the RIGHT and the badge renders on its LEFT. That matches Arabic reading order (the qualifier follows the subject).
- **D-13 component:** use `@/components/ui/badge` (the `heroui-chip.tsx` re-export). Variant `secondary` per D-13 recommendation; implementer can flip to `outline` if it reads better against the row background in dark mode.
- **D-14:** when `row.nationality_iso_2` is null, the `&&` short-circuit renders nothing — no badge, no placeholder.
- **Logical Tailwind only:** `gap-2`, `me-*`, `ms-*`. No `ml-*`/`mr-*`.
- **Mobile:** this is a list-row primary label; the flex row wraps naturally. Verify at 320px width that the badge doesn't push the name off-screen — if it does, wrap the badge to a second line via `flex-wrap`.

For `ElectedOfficialListTable.tsx`, apply the same pattern in the row-render cell. If the table has a dedicated "Name" column renderer, splice `formatPersonLabel()` + badge in there. If the legacy column was `row.original.name_en` directly, replace with the helper.

### Task 4: Playwright E2E — `tests/e2e/person-identity-fields.spec.ts`

**Files:** `tests/e2e/person-identity-fields.spec.ts` (create)
**Decisions applied:** —
**Acceptance:** `pnpm test:e2e -- person-identity-fields` passes on staging against `zkrcjzdemdmwhearhfgg`. The spec covers PBI-02, PBI-03, PBI-05 (happy path), PBI-06, PBI-07 (Identity card visible during review).
**Autonomous:** true (E2E run itself is autonomous; uses existing test credentials)

Suggested spec outline:

```ts
// tests/e2e/person-identity-fields.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Phase 32 — Person-Native Basic Info', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Use $TEST_USER_EMAIL / $TEST_USER_PASSWORD from process.env
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL!)
    await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD!)
    await page.getByRole('button', { name: /sign in|login/i }).click()
    await expect(page).toHaveURL(/\/dossiers|\/dashboard/)
  })

  test('PBI-05 + PBI-06 + PBI-07: elected-official wizard end-to-end', async ({ page }) => {
    // Open wizard
    await page.goto('/dossiers/elected-officials/create')

    // ---- Step 1: PersonBasicInfoStep ----
    // PBI-02 assertions
    await expect(page.getByLabel(/honorific|اللقب/i)).toHaveCount(1)
    await expect(page.getByLabel(/first name.*english|الاسم الأول.*الإنجليزي/i)).toHaveCount(1)
    await expect(page.getByLabel(/last name.*english|الاسم الأخير.*الإنجليزي/i)).toHaveCount(1)
    await expect(page.getByLabel(/known as|معروف باسم/i)).toHaveCount(1)

    // Fill identity fields
    await page.getByLabel(/honorific/i).click()
    await page.getByRole('option', { name: 'H.E.' }).click()
    await page.getByLabel(/first name.*english/i).fill('Test')
    await page.getByLabel(/last name.*english/i).fill('Person')
    await page.getByLabel(/first name.*arabic/i).fill('تيست')
    await page.getByLabel(/last name.*arabic/i).fill('شخص')
    await page.getByLabel(/photo url/i).fill('https://placehold.co/64')

    // PBI-03: nationality (required), DOB, gender
    await page.getByLabel(/nationality/i).click()
    // DossierPicker picks first country option (implementer may need to search 'Saudi')
    await page
      .getByRole('option', { name: /saudi|المملكة العربية السعودية/i })
      .first()
      .click()
    await page.getByLabel(/gender/i).click()
    await page.getByRole('option', { name: /male/i }).click()

    // Next
    await page.getByRole('button', { name: /next|التالي/i }).click()

    // ---- Step 2: PersonDetailsStep (fill minimal required per existing flow) ----
    // ...existing step's minimal fields...
    await page.getByRole('button', { name: /next|التالي/i }).click()

    // ---- Step 3: OfficeTermStep (elected_official only) ----
    // ...minimal office + term fields...
    await page.getByRole('button', { name: /next|التالي/i }).click()

    // ---- Step 4: Review — PBI-07 assertions ----
    await expect(page.getByText(/^identity$|^الهوية$/i)).toBeVisible()
    await expect(page.getByText(/H\.E\./)).toBeVisible()
    await expect(page.getByText(/Test/)).toBeVisible()
    await expect(page.getByText(/Person/)).toBeVisible()
    // Biographical summary sub-heading present
    await expect(page.getByText(/biographical summary|الملخص البيوغرافي/i)).toBeVisible()

    // Submit
    const responsePromise = page.waitForResponse(/\/functions\/v1\/dossiers-create/)
    await page.getByRole('button', { name: /submit|create|إنشاء/i }).click()
    const response = await responsePromise
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.id).toBeDefined()
    const createdId = body.id as string

    // ---- PBI-06: list-page assertions ----
    await page.goto('/dossiers/elected-officials')
    const row = page.locator('tr', { has: page.getByText(/H\.E\. Test Person/) })
    await expect(row).toBeVisible()
    // nationality badge contains ISO-2 (e.g. "SA")
    await expect(row.getByText(/\b[A-Z]{2}\b/)).toBeVisible()

    // Same check on the generic persons list
    await page.goto('/dossiers/persons')
    const row2 = page.locator('tr', { has: page.getByText(/H\.E\. Test Person/) })
    await expect(row2).toBeVisible()

    // Cleanup (optional — delete the created dossier if a delete API exists)
    // Or leave as a fixture row; tagged via wizard notes if needed.
  })

  test('PBI-05 control: legacy payload without new fields still succeeds', async ({ request }) => {
    // Authenticated REST call bypassing the wizard — proves backwards compat.
    const res = await request.post('/functions/v1/dossiers-create', {
      data: {
        type: 'person',
        name_en: 'Legacy Person',
        name_ar: 'شخص قديم',
        status: 'active',
        sensitivity_level: 2,
        extensionData: {
          // No honorific/first/last/nationality/DOB/gender — simulating old client
          biography_en: 'Imported from pre-Phase-32 data',
        },
      },
    })
    expect(res.status()).toBe(200)
  })
})
```

Implementer notes:

- Replace placeholder `by-label` regexes with the actual label strings once EN + AR keys from Plan 32-02 Task 6 are confirmed.
- The DossierPicker flow (open → search → select) may need a `getByRole('combobox')` variant depending on the actual component DOM. Use the pattern from `tests/e2e/` specs written for Phase 29 (DossierPicker introduction).
- The "row contains ISO-2" assertion uses a regex for any two uppercase letters, which is robust across country choices. Tighten to `/\bSA\b/` if the test always picks Saudi.
- For the control-case test (`request.post`), the request must carry an authenticated session. Use the test context from a prior login, or use a shared auth fixture if the project has one.

### Task 5: Legacy-row visual check (manual smoke, no code)

**Files:** none
**Decisions applied:** D-15 (fallback), D-14 (no badge when null)
**Acceptance:** Before closing the phase, open `/dossiers/persons` on staging and confirm at least one pre-Phase-32 person row renders without crashing, using the `name_en` fallback (D-15). Confirm legacy rows without `nationality_country_id` show NO badge (D-14).
**Autonomous:** true (can be automated as a Playwright smoke or done as a verification-phase observation)

Optional: add a third Playwright test that seeds a minimal legacy row via `mcp__supabase__execute_sql` (INSERT into persons with only `id` + backfilled name) and asserts its list render matches `/name_en value/` with no Badge.

## Tests

- Vitest: `person-display.test.ts` (Task 1) — 9 cases covering label + flag helpers
- Playwright: `tests/e2e/person-identity-fields.spec.ts` (Task 4) — 2 tests (happy path + legacy payload)
- Manual / optional Playwright: legacy-row rendering smoke (Task 5)

## Verification commands

```bash
# Unit
pnpm --filter frontend test -- person-display

# E2E (staging)
pnpm test:e2e -- person-identity-fields

# Visual grep: confirm logical Tailwind only in the edits
grep -n 'ml-\|mr-\|pl-\|pr-\|text-left\|text-right' \
  frontend/src/routes/_protected/dossiers/persons/index.tsx \
  frontend/src/routes/_protected/dossiers/elected-officials/index.tsx \
  frontend/src/components/elected-officials/ElectedOfficialListTable.tsx \
  frontend/src/lib/person-display.ts \
  || echo "OK: no physical margin/padding/text-align properties"
```

## Rollback

- `git revert` the commit(s) for this plan. The list pages fall back to their previous row label. `person-display.ts` is a new file; reverting deletes it. The E2E spec file deletion removes the test from the suite. No DB or Edge Function changes in this plan.

## Threat model

| Threat                                                           | Severity       | Mitigation                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Broken access control on the list query's FK join                | Medium         | The join reads `dossiers` + `countries`; existing RLS on both tables still applies. Country dossiers are public-visible in this app; persons are gated by the existing policy. Manually verify the join doesn't leak a country dossier the user can't read by running the query as a non-admin test user. |
| XSS via ISO-2 code rendered in the badge                         | Low            | `iso_2` is a DB-level 2-character code; `nationalityBadgeText()` uppercases + validates via regex; React escapes on render.                                                                                                                                                                               |
| Label composition leaks PII to the wrong locale                  | Low            | `formatPersonLabel()` reads AR fields only when `locale === 'ar'`. Legacy rows with only `name_en` populated fall back consistently.                                                                                                                                                                      |
| Flag emoji renders as a placeholder box on a font-lacking system | Low (cosmetic) | Falls back to showing just the ISO-2 code; the `nationalityBadgeText()` always includes the code.                                                                                                                                                                                                         |
| E2E test leaves stale data in staging                            | Low            | Test row is tagged with a recognizable name (`Test Person`, `Legacy Person`); implementer can either add a delete step or filter out in seed scripts.                                                                                                                                                     |
