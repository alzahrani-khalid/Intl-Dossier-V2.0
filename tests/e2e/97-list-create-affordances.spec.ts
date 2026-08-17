// @covers NAV-03
//
// Phase 97 Wave 1 (97-02) — the eight-page create-affordance oracle for criterion 3.
//
// WHAT THIS KILLS. RESEARCH Pitfall 4, stated plainly: SEVEN of the eight dossier list pages
// already pass an `onCreate` handler, and pass it into `ListEmptyState` and nowhere else. So the
// button exists only on a page that has nothing on it. A sweep that greps `onCreate` reports 8/8
// done; a spec that opens an empty list sees a create button and goes green — and an analyst
// looking at a list WITH ROWS IN IT still has no way to create anything. Both are confident lies
// about the same surface.
//
// The affordance is therefore only proven WITH ROWS PRESENT, which makes data-presence a
// PRECONDITION of this oracle rather than an assumption behind it. Every test establishes rows
// first and fails by name (`DATA-PRECONDITION UNMET for <segment>`) if the list settles empty —
// that outcome is UNABLE TO MEASURE (C2), never a pass, and never counted as the subject's red.
// These specs also never call `test.skip()`: a skip exits 0 and would read as a pass.
//
// The affordance is located in the page HEADER region (`header.page-head`, rendered by
// `ListPageShell` for seven pages and by `PageHeader` for elected-officials) — never in the empty
// state, which is exactly the position the current tree gets wrong.
//
// AUTHENTICATION: inline, from TEST_USER_EMAIL / TEST_USER_PASSWORD, and run with --no-deps. The
// Playwright `setup` project throws without six E2E_* keys that .env.test does not carry
// (E2ECRED-01, filed against Phase 101), so no storage-state fixture is usable here.
//
// NETWORK: natural. This is a reachability oracle against real dev-stack state, so nothing is
// blocked or stubbed — a green here means the real path resolved.
//
// EXPECTED RED until 97-08 lands the header affordance on the other seven pages. Exactly one page
// — elected-officials — is expected GREEN today, and the last test in this file pins that as the
// harness's own positive control.
import { test, expect, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

// TIMING. One budget per settle. Wide enough for the list query's retry ladder and the create
// route's chunk fetch, tight enough that a page stuck loading fails instead of waiting.
const SETTLE_TIMEOUT = 15_000

/**
 * The leak regex, reused UNWIDENED from `95-monitoring-mounts.spec.ts:54-55` (T-97-05). The bare
 * vendor-word arm stays out: re-widening it would require re-checking each of these eight
 * surfaces' product copy first, and no arm here needs it.
 */
const INTERNAL_STRING =
  /(42501|42703|42P01|permission denied|supabase\.co|supabase-js|SupabaseClient|FunctionsHttpError|FunctionsFetchError)/i

interface ListPage {
  /** URL segment under /dossiers. */
  segment: string
  /** Rendered accessible name of the header create affordance. */
  cta: string
  /** A CSS selector matching ONE rendered data row on that list. */
  rowSelector: string
  /** The `<h1>` the create route renders once it mounts (`form-wizard:<entity>.page_title`). */
  createTitle: string
}

/**
 * THE POPULATION — a hardcoded literal of the eight list pages, named one by one (D-05). It is
 * NOT derived from the route tree at run time: a derivation that silently returns seven would
 * narrow the population and still pass, which is the failure mode this literal exists to remove.
 *
 * `rowSelector` differs per page because the row renderers differ — `DossierTable` (countries,
 * organizations), `GenericListPage` (forums, topics, working_groups), `PersonsGrid` (persons),
 * `EngagementsList` (engagements), and the elected-officials `<Table>`. Each selector matches data
 * rows only: every one of those components returns its empty state INSTEAD of the row container,
 * so a zero count here means a genuinely empty list.
 *
 * NOTE on `engagements`: this is the `/dossiers/engagements` mount. The top-level `/engagements`
 * double-mount is INTENTIONAL and out of scope — it is not "fixed" and not asserted here.
 */
const PAGES: ListPage[] = [
  {
    segment: 'countries',
    cta: 'Add country',
    rowSelector: '.dossier-row',
    createTitle: 'New Country Dossier',
  },
  {
    segment: 'organizations',
    cta: 'Add organization',
    rowSelector: '.dossier-row',
    createTitle: 'Create Organization',
  },
  {
    segment: 'persons',
    cta: 'Add person',
    rowSelector: 'button[role="listitem"]',
    createTitle: 'Create Person',
  },
  {
    segment: 'forums',
    cta: 'Add forum',
    rowSelector: '[data-testid="generic-list-page-row"]',
    createTitle: 'New Forum Dossier',
  },
  {
    segment: 'topics',
    cta: 'Add topic',
    rowSelector: '[data-testid="generic-list-page-row"]',
    createTitle: 'Create Topic',
  },
  {
    segment: 'working_groups',
    cta: 'Add working group',
    rowSelector: '[data-testid="generic-list-page-row"]',
    createTitle: 'New Working Group Dossier',
  },
  {
    segment: 'elected-officials',
    cta: 'Add Elected Official',
    rowSelector: 'table tbody tr',
    createTitle: 'Create Elected Official',
  },
  {
    segment: 'engagements',
    cta: 'Log engagement',
    rowSelector: '[data-testid="engagement-row"]',
    createTitle: 'New Engagement Dossier',
  },
]

// HARDCODE THE COUNT. A hand-edit that drops a page must fail loudly at collection time rather
// than silently narrowing the population to seven and reporting all-green on a smaller set.
if (PAGES.length !== 8) {
  throw new Error(`POPULATION DRIFT: NAV-03 covers 8 list pages, PAGES declares ${PAGES.length}`)
}

const pageFor = (segment: string): ListPage => {
  const found = PAGES.find((entry) => entry.segment === segment)
  if (found === undefined) {
    throw new Error(`POPULATION DRIFT: "${segment}" is not in PAGES`)
  }
  return found
}

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

/** `common:errors.queryFailed.title` — the shared P93 query-error heading. */
const QUERY_ERROR_TITLE = 'Unable to load data'

/**
 * Zero rows has TWO causes and they route to DIFFERENT owners, so the message names which one:
 * an EMPTY list is seeding work, while the shared query-error state means the list's READ PATH
 * failed and no amount of seeding fixes it. Collapsing them into "no rows" is how a broken read
 * path gets filed as a fixture gap and nobody fixes either.
 */
const unmetCause = async (page: Page): Promise<string> => {
  try {
    const errored = await page.getByText(QUERY_ERROR_TITLE).count()
    return errored > 0
      ? `the list rendered its shared query-error state ("${QUERY_ERROR_TITLE}"), so the READ PATH failed — NOT an empty fixture, and seeding will not fix it`
      : 'the list settled EMPTY with no error state — this one is a seeding gap'
  } catch {
    return 'cause probe failed; read the Playwright error-context page snapshot'
  }
}

/**
 * THE DATA-PRESENT PRECONDITION. Rows on screen is the state in which the shipped empty-state CTA
 * cannot satisfy the claim. Zero rows is a fixture problem, thrown by name so it reads as UNABLE
 * TO MEASURE and lands on 97-08's precondition list — never counted as this page's red.
 */
const requireRowsPresent = async (page: Page, target: ListPage): Promise<void> => {
  const rows = page.locator(target.rowSelector)
  try {
    await expect.poll(() => rows.count(), { timeout: SETTLE_TIMEOUT }).toBeGreaterThan(0)
  } catch {
    throw new Error(
      `DATA-PRECONDITION UNMET for ${target.segment}: /dossiers/${target.segment} settled with ` +
        `zero rows matching ${target.rowSelector} — ${await unmetCause(page)}. UNABLE TO ` +
        'MEASURE: the create affordance can only be proven with rows present. Never a pass.',
    )
  }
}

/**
 * The claim, once per page: with rows on screen, the header carries a create affordance whose click
 * reaches that page's own create route and mounts it.
 */
const assertHeaderCreateAffordance = async (page: Page, target: ListPage): Promise<void> => {
  await signInInline(page)
  await page.goto(`/dossiers/${target.segment}`)
  await requireRowsPresent(page, target)

  // HEADER, not empty state. `header.page-head` is the shared header landmark of both hosts
  // (ListPageShell:48, PageHeader:19); scoping the affordance inside it is what makes an
  // empty-state-only button fail.
  const header = page.locator('header.page-head')
  const affordance = header.getByRole('link', { name: target.cta })
  await expect(affordance).toBeVisible({ timeout: SETTLE_TIMEOUT })

  // THE CLICK, through the real rendered affordance — never page.goto (D-10).
  await affordance.click()
  await expect(page).toHaveURL(new RegExp(`/dossiers/${target.segment}/create$`), {
    timeout: SETTLE_TIMEOUT,
  })
  await expect(page.getByRole('heading', { level: 1, name: target.createTitle })).toBeVisible({
    timeout: SETTLE_TIMEOUT,
  })

  const bodyText = (await page.locator('body').innerText()) ?? ''
  expect(bodyText).not.toMatch(INTERNAL_STRING)
}

test.describe('NAV-03 all eight dossier list pages expose a create affordance with rows present', () => {
  // The titles below name viewport 1400, so the viewport IS 1400 — the analyst-workstation width
  // from the root CLAUDE.md, not the 1280 Desktop Chrome default.
  test.use({ viewport: { width: 1400, height: 900 } })

  // Eight declarations, written out one per page rather than generated in a loop: the population is
  // eight visible test names in the report, and a dropped page is a missing name, not a smaller
  // number nobody reads.
  test('countries create affordance — ordinary authenticated user, desktop 1400', async ({
    page,
  }) => {
    await assertHeaderCreateAffordance(page, pageFor('countries'))
  })

  test('organizations create affordance — ordinary authenticated user, desktop 1400', async ({
    page,
  }) => {
    await assertHeaderCreateAffordance(page, pageFor('organizations'))
  })

  test('persons create affordance — ordinary authenticated user, desktop 1400', async ({
    page,
  }) => {
    await assertHeaderCreateAffordance(page, pageFor('persons'))
  })

  test('forums create affordance — ordinary authenticated user, desktop 1400', async ({ page }) => {
    await assertHeaderCreateAffordance(page, pageFor('forums'))
  })

  test('topics create affordance — ordinary authenticated user, desktop 1400', async ({ page }) => {
    await assertHeaderCreateAffordance(page, pageFor('topics'))
  })

  test('working_groups create affordance — ordinary authenticated user, desktop 1400', async ({
    page,
  }) => {
    await assertHeaderCreateAffordance(page, pageFor('working_groups'))
  })

  test('elected-officials create affordance — ordinary authenticated user, desktop 1400', async ({
    page,
  }) => {
    await assertHeaderCreateAffordance(page, pageFor('elected-officials'))
  })

  test('engagements create affordance — ordinary authenticated user, desktop 1400', async ({
    page,
  }) => {
    await assertHeaderCreateAffordance(page, pageFor('engagements'))
  })

  // THIS FILE'S OWN POSITIVE CONTROL. elected-officials is the 1-of-8 that ALREADY ships the header
  // affordance on the undone tree (`elected-officials/index.tsx:196-209` — PageHeader `actions` →
  // Button asChild → Link). It must be GREEN before 97-08 exists. If the whole file goes red
  // INCLUDING this test, the failure is the harness — auth, the dev stack, the header locator, the
  // fixture — and not the seven pages under test. Reading a total red as "seven pages missing the
  // affordance" without this control is the instrument-untested zero.
  test('elected-officials is the shipped control — ordinary authenticated user, desktop 1400', async ({
    page,
  }) => {
    await assertHeaderCreateAffordance(page, pageFor('elected-officials'))
  })
})
