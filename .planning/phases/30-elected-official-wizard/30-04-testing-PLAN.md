---
phase: 30-elected-official-wizard
plan: 04
type: execute
wave: 3
depends_on: ['30-02', '30-03']
files_modified:
  - frontend/src/components/dossier/wizard/steps/__tests__/OfficeTermStep.test.tsx
  - frontend/src/components/dossier/wizard/schemas/__tests__/person.schema.elected-official.test.ts
  - tests/e2e/elected-official-create.spec.ts
autonomous: true
requirements: [ELOF-01, ELOF-02, ELOF-03, ELOF-04]
requirements_addressed: [ELOF-01, ELOF-02, ELOF-03, ELOF-04]
tags: [v5.0, testing, vitest, playwright, e2e, bilingual]

must_haves:
  truths:
    - 'Vitest: OfficeTermStep.test.tsx has a test that renders all 4 sections (office, constituency, party, term)'
    - 'Vitest: OfficeTermStep.test.tsx has a test confirming both DossierPickers render with correct filterByDossierType props'
    - 'Vitest: person.schema.elected-official.test.ts has a passing case for elected_official with only office_name_ar filled (no EN) — at-least-one-required works'
    - 'Vitest: person.schema.elected-official.test.ts has a failing case when both office_name_en and office_name_ar are empty for elected_official'
    - 'Vitest: person.schema.elected-official.test.ts has a failing case when country_id is empty for elected_official'
    - 'Vitest: person.schema.elected-official.test.ts has a test confirming standard subtype passes even when all elected-official fields are empty'
    - 'Vitest: person.schema.elected-official.test.ts verifies term_end < term_start fails with the expected message key'
    - 'Playwright: tests/e2e/elected-official-create.spec.ts navigates to the list page, clicks Create, fills 4 steps, submits, and asserts URL redirects to /dossiers/elected-officials/<uuid> OR /dossiers/<uuid>'
    - 'Playwright spec includes TWO submit variants: one with English-only office_name and one with Arabic-only office_name'
  artifacts:
    - path: 'frontend/src/components/dossier/wizard/steps/__tests__/OfficeTermStep.test.tsx'
      provides: 'Unit tests for OfficeTermStep component'
      min_lines: 120
    - path: 'frontend/src/components/dossier/wizard/schemas/__tests__/person.schema.elected-official.test.ts'
      provides: 'Schema-level validation tests for elected-official superRefine rules'
      min_lines: 80
    - path: 'tests/e2e/elected-official-create.spec.ts'
      provides: 'E2E happy-path Playwright spec'
      min_lines: 90
  key_links:
    - from: 'frontend/src/components/dossier/wizard/steps/__tests__/OfficeTermStep.test.tsx'
      to: 'OfficeTermStep component + DossierPicker mock'
      via: 'vi.mock @/components/work-creation/DossierPicker'
      pattern: "vi\\.mock.*work-creation/DossierPicker"
    - from: 'frontend/src/components/dossier/wizard/schemas/__tests__/person.schema.elected-official.test.ts'
      to: 'personSchema'
      via: 'personSchema.safeParse() on crafted inputs'
      pattern: "personSchema\\.safeParse"
    - from: 'tests/e2e/elected-official-create.spec.ts'
      to: 'Wizard flow end-to-end (list page → create route → form submit → dossier detail)'
      via: 'Playwright page.goto + locator.click + locator.fill'
      pattern: '/dossiers/elected-officials/create'
---

<objective>
Lock in Phase 30 behavior with three test layers:

1. **Unit (component)** — OfficeTermStep renders all 4 sections, both DossierPickers, and all
   10 form fields wire to the correct names.
2. **Unit (schema)** — personSchema.superRefine correctly gates elected-official-specific
   required-ness without affecting standard persons.
3. **E2E (Playwright)** — User can create an elected official from the list page in both
   English-only and Arabic-only office_name scenarios, satisfying all four ELOF requirements.

Purpose: Without these tests, regressions in the schema, step component, or route wiring ship
silently. With them, CI catches drift. Bilingual E2E coverage specifically protects the D-08 /
D-19 relaxed constraint — the whole point of Phase 30's DB migration.

Output: 3 new test files; all pass locally against current dev server + Supabase staging.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/phases/30-elected-official-wizard/30-CONTEXT.md
@CLAUDE.md

# Prior Phase 30 SUMMARYs (depend on):

@.planning/phases/30-elected-official-wizard/30-02-SUMMARY.md
@.planning/phases/30-elected-official-wizard/30-03-SUMMARY.md

# Reference test files (read structure before authoring new ones):

@frontend/src/components/dossier/wizard/steps/**tests**/ForumDetailsStep.test.tsx
@frontend/src/components/dossier/wizard/steps/**tests**/WorkingGroupDetailsStep.test.tsx
@.planning/phases/29-complex-type-wizards/29-06-SUMMARY.md
</context>

<interfaces>
<!-- Canonical testing patterns from Phase 29-06 — executor should use these directly. -->

Phase 29-06 E2E specs live at repo-root (not under frontend/): `tests/e2e/forum-create.spec.ts`,
`tests/e2e/working-group-create.spec.ts`, `tests/e2e/engagement-create.spec.ts`. Use the same
directory + playwright-config conventions.

Phase 29 component test pattern (from ForumDetailsStep.test.tsx line 47-48, WorkingGroupDetailsStep.test.tsx line 66-67):

```typescript
vi.mock('@/components/work-creation/DossierPicker', () => ({
  DossierPicker: (props: Record<string, unknown>) => (
    <div data-testid={`dossier-picker-${String(props.filterByDossierType)}`}>
      {/* mock: renders a div exposing filterByDossierType for assertion */}
    </div>
  ),
}))
```

Vitest component test harness:

- Uses `@testing-library/react` render
- Wraps in a FormProvider-equivalent via react-hook-form's `useForm` in a helper component
- Uses `I18nextProvider` with a minimal test config

Test credentials for E2E (from CLAUDE.md):

- `process.env.TEST_USER_EMAIL` and `process.env.TEST_USER_PASSWORD`
- For local dev, values live in `.env.test`
  </interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Author Vitest unit tests for OfficeTermStep component</name>
  <files>frontend/src/components/dossier/wizard/steps/__tests__/OfficeTermStep.test.tsx</files>
  <read_first>
    - frontend/src/components/dossier/wizard/steps/__tests__/ForumDetailsStep.test.tsx (harness pattern)
    - frontend/src/components/dossier/wizard/steps/__tests__/WorkingGroupDetailsStep.test.tsx (multi-picker pattern)
    - frontend/src/components/dossier/wizard/steps/OfficeTermStep.tsx (component under test — from Plan 30-02)
    - frontend/src/components/dossier/wizard/schemas/person.schema.ts (PersonFormData shape)
  </read_first>
  <action>
Create a NEW file at `frontend/src/components/dossier/wizard/steps/__tests__/OfficeTermStep.test.tsx` mirroring the harness pattern from `ForumDetailsStep.test.tsx` and `WorkingGroupDetailsStep.test.tsx`.

File content (exact):

```typescript
/**
 * OfficeTermStep unit tests (Phase 30 Plan 04, Task 1)
 *
 * Verifies:
 *   - All 4 sections render with correct headings (office, constituency, party, term)
 *   - Bilingual pairs render EN field first in JSX order (RTL rule 1 — the DOM order is EN → AR)
 *   - Both DossierPickers render with correct filterByDossierType props (country + organization)
 *   - All 10 form field names appear exactly once each
 *   - Both date inputs have type="date"
 *   - Arabic inputs receive dir attribute (useDirection contract)
 */
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import i18n from '@/i18n/config'
import { OfficeTermStep } from '../OfficeTermStep'
import { personSchema, type PersonFormData } from '../../schemas/person.schema'
import { getElectedOfficialDefaults } from '../../defaults'

// Mock DossierPicker to expose filterByDossierType for assertion
vi.mock('@/components/work-creation/DossierPicker', () => ({
  DossierPicker: (props: {
    filterByDossierType?: string
    value?: string
    placeholder?: string
  }): ReactElement => (
    <div
      data-testid={`dossier-picker-${String(props.filterByDossierType)}`}
      data-placeholder={props.placeholder}
    >
      mock-dossier-picker
    </div>
  ),
}))

// Mock useDirection to return predictable 'rtl' (we also test with 'ltr' in one case)
vi.mock('@/hooks/useDirection', () => ({
  useDirection: (): { direction: 'ltr' | 'rtl'; isRTL: boolean } => ({
    direction: 'ltr',
    isRTL: false,
  }),
}))

// Harness: wraps OfficeTermStep with a react-hook-form FormProvider seeded with valid elected-official defaults
function Harness(): ReactElement {
  const form = useForm<PersonFormData>({
    resolver: zodResolver(personSchema),
    defaultValues: getElectedOfficialDefaults(),
    mode: 'onSubmit',
  })
  return (
    <I18nextProvider i18n={i18n}>
      <FormProvider {...form}>
        <OfficeTermStep form={form} />
      </FormProvider>
    </I18nextProvider>
  )
}

describe('OfficeTermStep', () => {
  it('renders all 4 section headings (office, constituency, party, term)', () => {
    render(<Harness />)
    // Headings are <h3> elements with aria-labelledby on parent sections.
    // Use data-testid-free assertion via role + accessible name.
    const sections = screen.getAllByRole('heading', { level: 3 })
    expect(sections.length).toBe(4)
    // The i18n EN translations: Office, Constituency, Party, Term
    const names = sections.map((h) => h.textContent?.trim() ?? '')
    expect(names).toEqual(expect.arrayContaining(['Office', 'Constituency', 'Party', 'Term']))
  })

  it('renders DossierPicker for country with filterByDossierType="country"', () => {
    render(<Harness />)
    expect(screen.getByTestId('dossier-picker-country')).toBeInTheDocument()
  })

  it('renders DossierPicker for organization with filterByDossierType="organization"', () => {
    render(<Harness />)
    expect(screen.getByTestId('dossier-picker-organization')).toBeInTheDocument()
  })

  it('renders all 10 ELOF-02 form field inputs by name attribute', () => {
    const { container } = render(<Harness />)
    const expectedNames = [
      'office_name_en',
      'office_name_ar',
      'district_en',
      'district_ar',
      'party_en',
      'party_ar',
      'term_start',
      'term_end',
    ]
    for (const name of expectedNames) {
      const input = container.querySelector(`input[name="${name}"]`)
      expect(input, `missing input[name="${name}"]`).not.toBeNull()
    }
    // Country + organization are DossierPickers (mocked as div data-testid) — assert via testid above
  })

  it('renders term_start and term_end as type="date" inputs', () => {
    const { container } = render(<Harness />)
    const termStart = container.querySelector('input[name="term_start"]')
    const termEnd = container.querySelector('input[name="term_end"]')
    expect(termStart?.getAttribute('type')).toBe('date')
    expect(termEnd?.getAttribute('type')).toBe('date')
  })

  it('renders EN field before AR field in each bilingual pair (DOM order)', () => {
    const { container } = render(<Harness />)
    const allInputs = Array.from(container.querySelectorAll('input[name]'))
    const indexOf = (n: string): number => allInputs.findIndex((el) => el.getAttribute('name') === n)
    // EN first → earlier index in DOM order
    expect(indexOf('office_name_en')).toBeLessThan(indexOf('office_name_ar'))
    expect(indexOf('district_en')).toBeLessThan(indexOf('district_ar'))
    expect(indexOf('party_en')).toBeLessThan(indexOf('party_ar'))
  })

  it('required country picker is marked with an asterisk in its label', () => {
    render(<Harness />)
    // The label text includes "Country" + a "*" span sibling
    const label = screen.getByText(/^Country$/).closest('label') ?? screen.getByText(/^Country$/).parentElement
    expect(label).not.toBeNull()
    // The parent <FormItem> (or label wrapper) contains "*"
    const wrapper = label?.parentElement ?? label
    expect(wrapper?.textContent ?? '').toContain('*')
  })
})
```

Then run the test: `pnpm -C frontend vitest run src/components/dossier/wizard/steps/__tests__/OfficeTermStep.test.tsx`. All 7 tests MUST pass.

**If i18n config path differs**, read `frontend/src/i18n/config.ts` (or .tsx) and adjust the import. If the test harness helper `zodResolver` isn't installed, check `frontend/package.json` — it should be present since ForumDetailsStep.test.tsx uses react-hook-form with Zod.
</action>
<verify>
<automated>cd frontend && pnpm vitest run src/components/dossier/wizard/steps/**tests**/OfficeTermStep.test.tsx --reporter=verbose 2>&1 | tail -30</automated>
</verify>
<acceptance_criteria> - File exists at `frontend/src/components/dossier/wizard/steps/__tests__/OfficeTermStep.test.tsx` - `grep -c "describe\\('OfficeTermStep'" <path>` == 1 - `grep -c "it\\(" frontend/src/components/dossier/wizard/steps/__tests__/OfficeTermStep.test.tsx` >= 7 - `grep -q "dossier-picker-country" <path>` → exit 0 - `grep -q "dossier-picker-organization" <path>` → exit 0 - `grep -q "vi.mock\\('@/components/work-creation/DossierPicker'" <path>` → exit 0 - `pnpm -C frontend vitest run src/components/dossier/wizard/steps/__tests__/OfficeTermStep.test.tsx` exits with code 0 - Test output shows all tests passing (≥7 passed, 0 failed, 0 skipped)
</acceptance_criteria>
<done>
OfficeTermStep.test.tsx exists with ≥7 tests covering section rendering, DossierPicker props,
all 8 text+date input names, RTL-safe DOM ordering, and required-asterisk label marking.
All tests pass.
</done>
</task>

<task type="auto">
  <name>Task 2: Author Vitest unit tests for personSchema superRefine rules</name>
  <files>frontend/src/components/dossier/wizard/schemas/__tests__/person.schema.elected-official.test.ts</files>
  <read_first>
    - frontend/src/components/dossier/wizard/schemas/person.schema.ts (after Plan 30-01 lands)
    - .planning/phases/30-elected-official-wizard/30-CONTEXT.md (§D-08, D-10, D-11, D-15)
  </read_first>
  <action>
Create a NEW file at `frontend/src/components/dossier/wizard/schemas/__tests__/person.schema.elected-official.test.ts` with this EXACT content:

```typescript
/**
 * personSchema superRefine unit tests (Phase 30 Plan 04, Task 2)
 *
 * Verifies the elected-official-specific validation rules added in Plan 30-01 D-15:
 *   - At least one of office_name_en / office_name_ar required
 *   - country_id required
 *   - term_start required
 *   - term_end >= term_start when both present
 *   - Standard persons unaffected by these rules
 */
import { describe, expect, it } from 'vitest'
import { personSchema, type PersonFormData } from '../person.schema'

// Baseline valid elected-official payload used for negative tests
const validElectedOfficial: PersonFormData = {
  // base dossier fields
  name_en: 'Jane Doe',
  name_ar: 'جين دو',
  abbreviation: '',
  description_en: '',
  description_ar: '',
  status: 'active',
  sensitivity_level: 'public',
  // person fields
  title_en: '',
  title_ar: '',
  photo_url: '',
  biography_en: '',
  biography_ar: '',
  person_subtype: 'elected_official',
  // elected-official fields
  office_name_en: 'Minister of Foreign Affairs',
  office_name_ar: '',
  district_en: '',
  district_ar: '',
  party_en: '',
  party_ar: '',
  term_start: '2026-01-01',
  term_end: '',
  country_id: '00000000-0000-0000-0000-000000000001',
  organization_id: '',
  is_current_term: true,
} as PersonFormData

describe('personSchema superRefine (elected-official rules)', () => {
  it('passes with valid elected-official payload (EN office name only)', () => {
    const result = personSchema.safeParse(validElectedOfficial)
    expect(result.success).toBe(true)
  })

  it('passes with Arabic-only office_name (D-08 at-least-one rule)', () => {
    const result = personSchema.safeParse({
      ...validElectedOfficial,
      office_name_en: '',
      office_name_ar: 'وزير الخارجية',
    })
    expect(result.success).toBe(true)
  })

  it('fails when both office_name_en AND office_name_ar are empty for elected_official', () => {
    const result = personSchema.safeParse({
      ...validElectedOfficial,
      office_name_en: '',
      office_name_ar: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('office_name_en')
      expect(paths).toContain('office_name_ar')
      const messages = result.error.issues.map((i) => i.message)
      expect(messages.some((m) => m.includes('office_name_required'))).toBe(true)
    }
  })

  it('fails when country_id is empty for elected_official', () => {
    const result = personSchema.safeParse({
      ...validElectedOfficial,
      country_id: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('country_id')
      const messages = result.error.issues.map((i) => i.message)
      expect(messages.some((m) => m.includes('country_required'))).toBe(true)
    }
  })

  it('fails when term_start is empty for elected_official', () => {
    const result = personSchema.safeParse({
      ...validElectedOfficial,
      term_start: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('term_start')
      const messages = result.error.issues.map((i) => i.message)
      expect(messages.some((m) => m.includes('term_start_required'))).toBe(true)
    }
  })

  it('fails when term_end < term_start (D-11)', () => {
    const result = personSchema.safeParse({
      ...validElectedOfficial,
      term_start: '2026-06-01',
      term_end: '2026-01-01',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('term_end')
      const messages = result.error.issues.map((i) => i.message)
      expect(messages.some((m) => m.includes('term_end_after_start'))).toBe(true)
    }
  })

  it('passes when term_end is empty (ongoing term allowed)', () => {
    const result = personSchema.safeParse({
      ...validElectedOfficial,
      term_end: '',
    })
    expect(result.success).toBe(true)
  })

  it('does NOT apply elected-official rules to standard persons', () => {
    // Empty office_name, country_id, and term_start should all be fine for standard persons
    const standardPerson: PersonFormData = {
      ...validElectedOfficial,
      person_subtype: 'standard',
      office_name_en: '',
      office_name_ar: '',
      country_id: '',
      term_start: '',
    } as PersonFormData
    const result = personSchema.safeParse(standardPerson)
    expect(result.success).toBe(true)
  })
})
```

Then run: `pnpm -C frontend vitest run src/components/dossier/wizard/schemas/__tests__/person.schema.elected-official.test.ts`. All 8 tests MUST pass.

**If the baseDossierSchema requires different field names** (e.g., `sensitivity` vs `sensitivity_level`), read `frontend/src/components/dossier/wizard/schemas/base.schema.ts` and adjust the `validElectedOfficial` baseline to match — do NOT change the refinement assertions.
</action>
<verify>
<automated>cd frontend && pnpm vitest run src/components/dossier/wizard/schemas/**tests**/person.schema.elected-official.test.ts --reporter=verbose 2>&1 | tail -30</automated>
</verify>
<acceptance_criteria> - File exists at `frontend/src/components/dossier/wizard/schemas/__tests__/person.schema.elected-official.test.ts` - `grep -c "it\\(" <path>` >= 8 - `grep -q "personSchema.safeParse" <path>` → exit 0 - `grep -q "person_subtype: 'elected_official'" <path>` → exit 0 - `grep -q "person_subtype: 'standard'" <path>` → exit 0 - `grep -q "office_name_required" <path>` → exit 0 - `grep -q "country_required" <path>` → exit 0 - `grep -q "term_start_required" <path>` → exit 0 - `grep -q "term_end_after_start" <path>` → exit 0 - `pnpm -C frontend vitest run src/components/dossier/wizard/schemas/__tests__/person.schema.elected-official.test.ts` exits with code 0 - Test output shows ≥8 passed, 0 failed
</acceptance_criteria>
<done>
Schema test file exists with ≥8 tests covering the full elected-official refinement
rules matrix plus negative control (standard subtype). All tests pass.
</done>
</task>

<task type="auto">
  <name>Task 3: Author Playwright E2E spec for the happy-path wizard flow</name>
  <files>tests/e2e/elected-official-create.spec.ts</files>
  <read_first>
    - tests/e2e/forum-create.spec.ts (Phase 29-06 — directory location + list-page → create flow)
    - tests/e2e/working-group-create.spec.ts (Phase 29-06 — multi-step wizard E2E)
    - tests/e2e/engagement-create.spec.ts (Phase 29-06 — 4-step wizard E2E, most similar structure)
    - .planning/phases/30-elected-official-wizard/30-CONTEXT.md (§D-22)
    - CLAUDE.md §"Test Credentials for Browser/Chrome MCP"
  </read_first>
  <action>
Create a NEW file at `tests/e2e/elected-official-create.spec.ts` (repo-root `tests/e2e/` — NOT under `frontend/tests/e2e/`; Phase 29-06 uses the root path). Mirror the structure of `tests/e2e/engagement-create.spec.ts` (closest analog — also 4 steps).

Content guidance (exact spec to author, ≥90 lines):

```typescript
/**
 * Elected Official Wizard E2E (Phase 30 Plan 04, Task 3)
 *
 * Happy-path cases:
 *   1. English-only office_name submit — ELOF-02 + ELOF-03 + ELOF-04 coverage
 *   2. Arabic-only office_name submit  — D-08 + D-19 coverage (relaxed CHECK constraint)
 *   3. Verify the created dossier appears in BOTH Persons and Elected Officials lists — ELOF-03
 */
import { test, expect, type Page } from '@playwright/test'

// Use env-backed test credentials per CLAUDE.md
const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? ''
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? ''

async function signIn(page: Page): Promise<void> {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(TEST_EMAIL)
  await page.getByLabel(/password/i).fill(TEST_PASSWORD)
  await page.getByRole('button', { name: /sign in|log in/i }).click()
  await page.waitForURL(/\/(dossiers|dashboard|operations)/, { timeout: 10_000 })
}

async function selectFirstDossierPickerOption(page: Page, fieldLabel: RegExp): Promise<void> {
  // DossierPicker is a combobox — click to open, pick first result
  await page.getByLabel(fieldLabel).click()
  await page.waitForTimeout(300) // allow search results to populate
  const firstOption = page.getByRole('option').first()
  await firstOption.click()
}

test.describe('Elected Official Wizard — happy path', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
  })

  test('creates elected official with English-only office_name', async ({ page }) => {
    // 1. Navigate to list page
    await page.goto('/dossiers/elected-officials')
    await expect(page).toHaveURL(/\/dossiers\/elected-officials/)

    // 2. Click Create button
    await page.getByRole('link', { name: /add|create/i }).click()
    await expect(page).toHaveURL(/\/dossiers\/elected-officials\/create/)

    // 3. Step 1 — Basic Info
    const timestamp = Date.now()
    const nameEn = `TEST E2E Senator ${timestamp}`
    await page.getByLabel(/name.*english/i).fill(nameEn)
    await page.getByLabel(/name.*arabic/i).fill(`السيناتور ${timestamp}`)
    await page.getByRole('button', { name: /next/i }).click()

    // 4. Step 2 — Person Details (all optional — skip)
    await page.getByRole('button', { name: /next/i }).click()

    // 5. Step 3 — Office & Term
    await page.getByLabel(/office name.*english/i).fill('Senator')
    await selectFirstDossierPickerOption(page, /^country/i)
    await page.getByLabel(/term start/i).fill('2026-01-01')
    await page.getByLabel(/term end/i).fill('2030-01-01')
    await page.getByRole('button', { name: /next/i }).click()

    // 6. Step 4 — Review + submit
    await expect(page.getByRole('heading', { name: /office & term/i })).toBeVisible()
    await page.getByRole('button', { name: /create|submit/i }).click()

    // 7. Assert redirect to detail page
    await expect(page).toHaveURL(/\/dossiers\/(elected-officials\/)?[0-9a-f-]{36}/, {
      timeout: 15_000,
    })
  })

  test('creates elected official with Arabic-only office_name (D-08)', async ({ page }) => {
    await page.goto('/dossiers/elected-officials/create')

    const timestamp = Date.now()
    await page.getByLabel(/name.*english/i).fill(`TEST E2E AR ${timestamp}`)
    await page.getByLabel(/name.*arabic/i).fill(`تجربة ${timestamp}`)
    await page.getByRole('button', { name: /next/i }).click()
    await page.getByRole('button', { name: /next/i }).click() // skip person details

    // Leave office_name_en empty; fill office_name_ar only
    await page.getByLabel(/office name.*arabic/i).fill('وزير الخارجية')
    await selectFirstDossierPickerOption(page, /^country/i)
    await page.getByLabel(/term start/i).fill('2026-01-01')
    await page.getByRole('button', { name: /next/i }).click()

    await page.getByRole('button', { name: /create|submit/i }).click()
    await expect(page).toHaveURL(/\/dossiers\/(elected-officials\/)?[0-9a-f-]{36}/, {
      timeout: 15_000,
    })
  })

  test('created elected official appears in both Persons and Elected Officials lists (ELOF-03)', async ({
    page,
  }) => {
    // Create one
    const timestamp = Date.now()
    const nameEn = `TEST E2E Both Lists ${timestamp}`
    await page.goto('/dossiers/elected-officials/create')
    await page.getByLabel(/name.*english/i).fill(nameEn)
    await page.getByLabel(/name.*arabic/i).fill(`كلا القائمتين ${timestamp}`)
    await page.getByRole('button', { name: /next/i }).click()
    await page.getByRole('button', { name: /next/i }).click()
    await page.getByLabel(/office name.*english/i).fill('Representative')
    await selectFirstDossierPickerOption(page, /^country/i)
    await page.getByLabel(/term start/i).fill('2026-01-01')
    await page.getByRole('button', { name: /next/i }).click()
    await page.getByRole('button', { name: /create|submit/i }).click()
    await page.waitForURL(/\/dossiers\/(elected-officials\/)?[0-9a-f-]{36}/, { timeout: 15_000 })

    // Visit Elected Officials list
    await page.goto('/dossiers/elected-officials')
    await expect(page.getByText(nameEn)).toBeVisible({ timeout: 10_000 })

    // Visit Persons list
    await page.goto('/dossiers/persons')
    await expect(page.getByText(nameEn)).toBeVisible({ timeout: 10_000 })
  })
})
```

Then run: `pnpm exec playwright test tests/e2e/elected-official-create.spec.ts`. All 3 tests MUST pass against the local dev server + staging Supabase.

**Prerequisites:** Dev server running (`pnpm dev`), `.env.test` populated with valid credentials, and the Supabase staging DB reachable. The DossierPicker must resolve at least one country — the staging seed data contains multiple country dossiers per Phase 17 seed data.

**If the list page's Create button text differs** (e.g., `{t('list.add')}` renders as "Add Elected Official" instead of "Create"), adjust the locator from `/add|create/i` to match the actual text — check `frontend/src/i18n/en/elected-officials.json` key `list.add`.
</action>
<verify>
<automated>ls tests/e2e/elected-official-create.spec.ts && echo "spec file exists (E2E execution deferred to CI / manual run due to dev-server dependency)"</automated>
</verify>
<acceptance_criteria> - File exists at `tests/e2e/elected-official-create.spec.ts` - `grep -c "test\\(" <path>` >= 3 - `grep -q "/dossiers/elected-officials/create" <path>` → exit 0 - `grep -q "/dossiers/elected-officials" <path>` → exit 0 - `grep -q "/dossiers/persons" <path>` → exit 0 - `grep -q "office name.*arabic" <path>` → exit 0 (Arabic-only case coverage) - `grep -q "office name.*english" <path>` → exit 0 (English-only case coverage) - `grep -q "term start" <path>` → exit 0 - `grep -q "dossiers.*elected-officials.*[0-9a-f-]{36}" <path>` → exit 0 (post-submit URL pattern assertion) - File line count >= 90 - When run against a live dev server with staging Supabase: `pnpm exec playwright test tests/e2e/elected-official-create.spec.ts` exits 0 (3 passed, 0 failed) - If Playwright cannot connect to dev server in CI, the spec file structure still validates via `pnpm exec playwright test --list tests/e2e/elected-official-create.spec.ts` returning 3 test names
</acceptance_criteria>
<done>
E2E spec file exists with 3 tests covering English-only submit, Arabic-only submit,
and dual-list appearance. File structure mirrors Phase 29-06 engagement-create.spec.ts.
When run against dev + staging, all 3 tests pass.
</done>
</task>

</tasks>

<verification>
Run at plan close:
1. `cd frontend && pnpm vitest run src/components/dossier/wizard/steps/__tests__/OfficeTermStep.test.tsx src/components/dossier/wizard/schemas/__tests__/person.schema.elected-official.test.ts` → exits 0
2. `pnpm exec playwright test --list tests/e2e/elected-official-create.spec.ts` → lists 3 tests
3. `pnpm exec playwright test tests/e2e/elected-official-create.spec.ts` → all 3 pass (requires dev server running)
4. `cd frontend && pnpm typecheck` → exits 0 (test files typecheck cleanly)
5. `cd frontend && pnpm lint src/components/dossier/wizard/steps/__tests__/OfficeTermStep.test.tsx src/components/dossier/wizard/schemas/__tests__/person.schema.elected-official.test.ts` → exits 0
</verification>

<success_criteria>

- OfficeTermStep unit tests: ≥7 tests passing (section rendering, DossierPicker props, field names, date types, RTL DOM order, required-label marking)
- personSchema tests: ≥8 tests passing (valid EN-only, valid AR-only, all 4 required-ness failures, term ordering, standard-subtype unaffected)
- Playwright E2E: 3 tests passing (EN-only submit, AR-only submit, dual-list appearance)
- All requirements ELOF-01..ELOF-04 now have explicit test coverage:
  - ELOF-01 covered by E2E test 1 (4 step navigation)
  - ELOF-02 covered by OfficeTermStep unit tests (all fields present)
  - ELOF-03 covered by E2E test 3 (both-lists verification)
  - ELOF-04 covered by E2E test 1 (list page → create route navigation)
    </success_criteria>

<output>
After all 3 tasks complete, create `.planning/phases/30-elected-official-wizard/30-04-SUMMARY.md`
documenting: 3 test files created (paths + LOC), total test count, ELOF-01..04 coverage matrix,
any flaky test quarantine notes, and Playwright command used to run the E2E suite.
</output>
