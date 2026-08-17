// @covers NAV-01
//
// Phase 97 Wave 1 (97-01) — click-through + REAL-count oracle for Elected Officials across its
// four exposure surfaces: the live sidebar, the `/dossiers` hub type card, `/compare`, and
// `/dossiers/create`.
//
// WHAT THIS KILLS. Elected Officials is the 8th declared dossier type and the nav surfaces only
// seven. Two lies are in scope, and the second is the one a naive oracle would bless:
//
//   1. UNREACHABLE. `components/layout/navigation-config.ts` carries no elected-officials row, so
//      the RENDERING sidebar (`components/layout/Sidebar.tsx`, mounted by `AppShell.tsx` as the
//      desktop `aside.appshell-aside` and again inside the mobile drawer) has no entry to click.
//      There is a SECOND, parallel nav data structure in-tree, mounted only by its own standalone
//      demo route and never by `AppShell`; an assertion against it would go green and prove
//      nothing. Every locator below is scoped to the live shell, and the demo tree is named
//      nowhere in this file.
//
//   2. THE FABRICATED ZERO. `elected_official` is not a `dossiers.type` value at all (it is
//      `persons.person_subtype`; the CHECK is 7), so `getDossierCountsByType()` can never produce
//      an EO bucket, and `DossierListPage`'s `?? { count: 0, ... }` fallback would render a
//      confident `0` on a type that has rows. RULING-P97-04 §2 is explicit: a criterion that only
//      asserts "the card appears" is SATISFIED BY THAT ZERO — a vacuous guard. So this spec
//      derives the EO total ITSELF from `/api/elected-officials` and requires the rendered count
//      chip to EQUAL it. Where no honest source exists (the active/inactive split has none), the
//      shipped `dossier-count-unavailable` em-dash must render instead of a number. And if the
//      independent derivation cannot be made at all, the card must show the em-dash too — a
//      number invented while its source is down is the same lie pointing the other way.
//
// SCOPE NAMING (RULING-P97-03 §3). "Reachable" is never a bare claim. Every title below names the
// role it proves and the viewport it proves, so a green run cannot be read as a wider claim than
// it is. Elected Officials is not admin-gated; naming the role is still required, because a reader
// of a green must not infer an admin-scoped or a mobile result from a desktop, non-admin one.
//
// PRODUCER BEFORE CONSUMER (D-10). This file lands BEFORE its subjects (97-05 / 97-06) and is
// EXPECTED RED. `data-testid="dossier-type-card-elected_official"` does not exist in-tree yet —
// 97-05 adds it, and if 97-05 renames it, it repoints this file in the SAME edit (C9). A spec
// written after the fix is a spec shaped by the fix.
//
// AUTHENTICATION: inline, from TEST_USER_EMAIL / TEST_USER_PASSWORD, and run with --no-deps. The
// Playwright `setup` project throws without six E2E_* keys that .env.test does not carry
// (E2ECRED-01, filed against Phase 101), so no storage-state fixture is usable here.
//
// NETWORK: natural. This is a reachability oracle against real dev-stack state, so nothing is
// blocked or stubbed — a green here means the real path resolved.
import { test, expect, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

// TIMING. One budget for every settle in this file, matching 95-monitoring-mounts.spec.ts.
// Generous enough to cover the query client's retry ladder so a slow-but-correct settle is not
// read as a hang; short enough that a surface stuck loading fails rather than waits.
const SETTLE_TIMEOUT = 15_000

// The analyst-workstation width this contract is authored at (root CLAUDE.md §Responsive).
const DESKTOP_1400 = { width: 1400, height: 900 }

/**
 * The copy rule: no rendered error text may carry a Postgres/PostgREST code, a permission string,
 * a vendor URL/class, or a supabase-js error class.
 *
 * Reused UNWIDENED from `95-monitoring-mounts.spec.ts:54-55`. That spec's narrowing (the bare
 * `supabase` arm was dropped because the monitoring page legitimately lists a service by that
 * name) is load-bearing, and none of the surfaces here — the dossier hub, `/compare`, the EO list
 * and the create wizard — render the bare vendor word as product copy either, so the narrowed form
 * is correct on them as well. Do not widen it back without re-reading each surface's own copy.
 */
const INTERNAL_STRING =
  /(42501|42703|42P01|permission denied|supabase\.co|supabase-js|SupabaseClient|FunctionsHttpError|FunctionsFetchError)/i

/** Sign in inline; never echo either credential value. */
const signInInline = async (page: Page): Promise<void> => {
  if (email === '' || password === '') {
    throw new Error('TEST_USER_EMAIL / TEST_USER_PASSWORD missing from .env.test')
  }
  const login = new LoginPage(page)
  await login.goto()
  await login.signIn(email, password)
  await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 })
}

/**
 * The INDEPENDENT total (RULING-P97-04 §2). This is the whole point of the count assertion: the
 * number the page renders is compared against a number this spec fetched for itself, from the
 * endpoint that owns the truth, through a code path the page's own render shares nothing with.
 *
 * `GET /api/elected-officials` sits behind the Express `authenticateToken` middleware (verified:
 * an unauthenticated request returns 401), so the bearer token is lifted out of the Supabase
 * session blob that supabase-js persists in localStorage under its `sb-<ref>-auth-token` key. The
 * value is never printed.
 *
 * Returns `null` — never a fabricated fallback — when the source cannot be read (no session blob,
 * non-2xx, or a body without a numeric `.total`). The caller turns a `null` into the em-dash
 * obligation, so a down source produces a DIFFERENT assertion rather than a weaker one.
 */
const deriveElectedOfficialTotal = async (page: Page): Promise<number | null> => {
  const accessToken = await page.evaluate((): string | null => {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i)
      if (key === null || !/^sb-.+-auth-token$/.test(key)) {
        continue
      }
      const raw = window.localStorage.getItem(key)
      if (raw === null) {
        continue
      }
      try {
        const parsed = JSON.parse(raw) as { access_token?: unknown }
        if (typeof parsed.access_token === 'string') {
          return parsed.access_token
        }
      } catch {
        // Not the session blob — keep scanning the remaining keys.
      }
    }
    return null
  })

  if (accessToken === null) {
    return null
  }

  const response = await page.request.get('/api/elected-officials?limit=1', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok()) {
    return null
  }

  const body = (await response.json()) as { total?: unknown }
  return typeof body.total === 'number' ? body.total : null
}

/**
 * The wizard's two required country selections both go through `DossierPicker`, whose trigger is
 * labelled by its own placeholder and whose popover carries a cmdk search box plus `role="option"`
 * rows. Two pickers are live on the same page in step 3, so the trigger is addressed by its
 * DISTINCT placeholder rather than by ordinal.
 *
 * BOTH roles are accepted, exactly as `support/pages/LoginPage.ts` does for the sign-out control.
 * `DossierPicker.tsx:311` sets `role="combobox"` on a `Button` rendered through `PopoverTrigger
 * asChild`, and the prop does not survive to the DOM — the rendered element is a plain `button`
 * (the same filtered-DOM-props behaviour recorded for this Button primitive in Phase 79). Widening
 * `button → button|combobox` does not weaken the oracle: it fails while no picker is mounted and
 * passes only once one is, and it keeps passing if the role leak is repaired later.
 */
const pickDossier = async (page: Page, triggerName: string, query: string): Promise<void> => {
  const trigger = page
    .getByRole('button', { name: triggerName })
    .or(page.getByRole('combobox', { name: triggerName }))
  await expect(trigger.first()).toBeVisible({ timeout: SETTLE_TIMEOUT })
  await trigger.first().click()
  await page.getByPlaceholder('Search dossiers...').fill(query)
  const firstOption = page.getByRole('option').first()
  await expect(firstOption).toBeVisible({ timeout: SETTLE_TIMEOUT })
  await firstOption.click()
}

/** Every test asserts the leak oracle — a raw server body reaching JSX trips this. */
const assertNoInternalLeak = async (page: Page): Promise<void> => {
  const bodyText = (await page.locator('body').innerText()) ?? ''
  expect(bodyText).not.toMatch(INTERNAL_STRING)
}

test.describe('NAV-01 Elected Officials is reachable on all four exposure surfaces', () => {
  test.use({ viewport: DESKTOP_1400 })

  test('sidebar row — ordinary authenticated user, desktop 1400', async ({ page }) => {
    await signInInline(page)
    await page.goto('/')

    // Scoped to the LIVE desktop aside. An unscoped `getByRole('link')` would also match the
    // command palette's page list and any demo surface, and would pass while the shipped sidebar
    // still had no row — which is precisely the state this test exists to fail on.
    const aside = page.locator('aside.appshell-aside')
    await expect(aside).toBeVisible({ timeout: SETTLE_TIMEOUT })

    const electedOfficialsRow = aside.getByRole('link', { name: 'Elected Officials', exact: true })
    await expect(electedOfficialsRow).toBeVisible({ timeout: SETTLE_TIMEOUT })

    // THE CLAIM IS THE CLICK (D-10). `page.goto` would prove the route mounts and nothing about
    // reachability.
    await electedOfficialsRow.click()

    await expect(page).toHaveURL(/\/dossiers\/elected-officials$/, { timeout: SETTLE_TIMEOUT })

    // The destination's own content settles — a row that lands on a blank region is a reachability
    // regression, not a win.
    await expect(page.getByRole('heading', { level: 1, name: 'Elected Officials' })).toBeVisible({
      timeout: SETTLE_TIMEOUT,
    })
    await expect(page.getByRole('link', { name: 'Add Elected Official' })).toBeVisible({
      timeout: SETTLE_TIMEOUT,
    })

    await assertNoInternalLeak(page)
  })

  test('hub type card — ordinary authenticated user, desktop 1400', async ({ page }) => {
    await signInInline(page)
    await page.goto('/dossiers')

    // Derived BEFORE reading the card, and from a source the render does not share: this is the
    // independent leg of the equality, not a re-read of what the page already believes.
    const derivedTotal = await deriveElectedOfficialTotal(page)

    const card = page.locator('[data-testid="dossier-type-card-elected_official"]')
    await expect(card).toBeVisible({ timeout: SETTLE_TIMEOUT })

    const countChip = card.locator('.chip')
    const unavailable = card.locator('[data-testid="dossier-count-unavailable"]')

    if (derivedTotal === null) {
      // SOURCE DOWN. The card may not render a numeric chip at all, but if it renders one it must
      // not be a number invented while the truth was unreachable. The em-dash treatment is the
      // only honest render here.
      const chipCount = await countChip.count()
      if (chipCount > 0) {
        await expect(countChip).not.toHaveText(/^\s*\d+\s*$/)
      }
      await expect(unavailable.first()).toBeVisible({ timeout: SETTLE_TIMEOUT })
    } else {
      // THE CRITERION (RULING-P97-04 §2). Equality with the independently derived total — never
      // weakened to a visibility check, and `0` is accepted only when the derivation itself is 0.
      await expect(countChip).toHaveCount(1)
      await expect(countChip).toHaveText(String(derivedTotal), { timeout: SETTLE_TIMEOUT })

      // The fields with no honest source (the active/inactive split has none: the EO total comes
      // from the persons endpoint, which carries no dossier status breakdown) render the shipped
      // em-dash rather than a defaulted figure.
      expect(await unavailable.count()).toBeGreaterThanOrEqual(1)

      if (derivedTotal > 0) {
        // No figure anywhere inside this card reads a bare `0` while the type demonstrably has
        // rows. This is the `?? { count: 0, activeCount: 0, inactiveCount: 0 }` fallback, asserted
        // against directly.
        await expect(card.getByText('0', { exact: true })).toHaveCount(0)
      }
    }

    await assertNoInternalLeak(page)
  })

  test('hub type card click destination — ordinary authenticated user, desktop 1400', async ({
    page,
  }) => {
    await signInInline(page)
    await page.goto('/dossiers')

    const card = page.locator('[data-testid="dossier-type-card-elected_official"]')
    await expect(card).toBeVisible({ timeout: SETTLE_TIMEOUT })

    await card.click()

    // UI-SPEC §NAV-01(b) default: the card navigates to the list route the pseudo-type actually
    // owns. The sibling in-place filter behaviour is FORBIDDEN here — `dossiers.type` has no
    // `elected_official` value, so that filter yields zero rows while the card's own count reads a
    // real number, which is the forbidden shape in its purest form.
    await expect(page).toHaveURL(/\/dossiers\/elected-officials$/, { timeout: SETTLE_TIMEOUT })
    await expect(page.getByRole('heading', { level: 1, name: 'Elected Officials' })).toBeVisible({
      timeout: SETTLE_TIMEOUT,
    })

    await assertNoInternalLeak(page)
  })

  test('compare selector — ordinary authenticated user, desktop 1400', async ({ page }) => {
    await signInInline(page)
    await page.goto('/compare')

    const typeTrigger = page.getByRole('combobox').first()
    await expect(typeTrigger).toBeVisible({ timeout: SETTLE_TIMEOUT })
    await typeTrigger.click()

    const electedOfficialsOption = page.getByRole('option', {
      name: 'Elected Officials',
      exact: true,
    })
    await expect(electedOfficialsOption).toBeVisible({ timeout: SETTLE_TIMEOUT })
    await electedOfficialsOption.click()

    // THE SETTLE. The result region resolves to real rows or to the SHIPPED empty state — never a
    // blank pane and never a skeleton that never resolves. A newly exposed option whose fetch arm
    // cannot be satisfied must fail honestly, not silently.
    const emptyState = page.getByText('No entities found')
    const entityRows = page.locator('button[aria-pressed]')
    await expect
      .poll(async () => (await emptyState.count()) + (await entityRows.count()), {
        timeout: SETTLE_TIMEOUT,
      })
      .toBeGreaterThan(0)

    await assertNoInternalLeak(page)
  })

  test('create hub + create submit — ordinary authenticated user, desktop 1400', async ({
    page,
  }) => {
    // Assumption A1's BEHAVIOURAL leg (condition 8): `/dossiers/create` may not expose an entry
    // whose create flow is unverified. The wizard drive below IS that verification, and it writes
    // one row to the dev stack's database, named for this spec.
    //
    // The drive is authored against the CURRENT wizard, not against the shipped
    // `elected-official-create.spec.ts` recipe, which is STALE: that spec fills
    // `getByPlaceholder(/Enter name in English/)` and step 1 has no such field any more — it is now
    // "Identity", whose required fields are `last_name_en`, `last_name_ar` and a `nationality_id`
    // country picker. Copying the stale recipe produced a 30s timeout on the first `fill`, which is
    // a TOOLING red, not a subject red (GATE-STANDARD C2). Required fields are addressed by their
    // react-hook-form `name` attribute because the required labels render as plain text rather than
    // a `<label for>`, so those inputs carry no accessible name to target.
    //
    // Six sequential steps behind an inline sign-in do not fit the 30s default budget.
    test.setTimeout(120_000)

    const nameEn = `e2e-97-01-elected-official-${Date.now()}`
    const nameAr = 'مسؤول منتخب'

    await signInInline(page)
    await page.goto('/dossiers/create')

    const hubCard = page.locator('[data-testid="hub-card-elected_official"]')
    await expect(hubCard).toBeVisible({ timeout: SETTLE_TIMEOUT })
    await hubCard.click()

    await expect(page).toHaveURL(/\/dossiers\/elected-officials\/create$/, {
      timeout: SETTLE_TIMEOUT,
    })

    const nextButton = page.getByRole('button', { name: 'Next', exact: true })

    // Step 1 — Identity: last name EN + AR and nationality are the required three.
    await page.locator('input[name="last_name_en"]').fill(nameEn)
    await page.locator('input[name="last_name_ar"]').fill(nameAr)
    await pickDossier(page, 'Select country', 'sa')
    await nextButton.click()

    // Step 2 — Person details (every field optional).
    await nextButton.click()

    // Step 3 — Office and term: one office name, the country, and the term start.
    await page.locator('input[name="office_name_en"]').fill('Senator')
    await pickDossier(page, 'Search countries…', 'sa')
    await page.locator('input[name="term_start"]').fill('2026-01-01')
    await nextButton.click()

    // Step 4 — Review and submit.
    await page.getByRole('button', { name: 'Create Dossier', exact: true }).click()

    // The behavioural claim: the create path LANDS somewhere real. A create affordance that
    // submits into a 500 is a nav entry pointing at a known-broken surface.
    //
    // The trailing tab segment is part of the shape: the detail route redirects to its `overview`
    // tab, so the id is not the last segment. The shipped `elected-official-create.spec.ts` anchors
    // its id at `$` and is stale here too — observed, filed, not fixed by this plan (that spec is
    // outside 97-01's declared files).
    await expect(page).toHaveURL(
      /\/dossiers\/(elected-officials|persons)\/[0-9a-f-]{36}(\/[a-z-]+)?$/,
      { timeout: 30_000 },
    )
    await expect(page.getByRole('heading', { name: new RegExp(nameEn, 'i') })).toBeVisible({
      timeout: SETTLE_TIMEOUT,
    })

    await assertNoInternalLeak(page)
  })
})
