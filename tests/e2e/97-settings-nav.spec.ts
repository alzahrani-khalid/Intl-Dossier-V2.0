// @covers NAV-02
//
// Phase 97 Wave 1 (97-01) — the `/settings` subtree renders navigation, across the VIEWPORT
// MATRIX.
//
// WHAT THIS KILLS. Two checks disagree about what "/settings" means. `AppShell.tsx:125` suppresses
// the global sidebar by PREFIX (`pathname.startsWith('/settings')`), while
// `routes/_protected/settings.tsx:11-17` renders the settings nav column by EXACT match
// (`pathname === '/settings'`). Every `/settings/*` child therefore falls into the gap and gets NO
// navigation at all — not the global sidebar, not the settings column. The deepest child,
// `/settings/calendar/callback`, is stranded with no way back that is not the browser's own.
//
// AND THE REASON THIS IS A MATRIX, NOT A PAGE LIST (RULING-P97-03 §2): `AppShell` gates BOTH
// Sidebar mounts off that same flag — the desktop `aside.appshell-aside` at `:186` AND the mobile
// drawer at `:238`. A desktop-only oracle would report NAV-02 closed while every settings child at
// phone width still had no navigation whatsoever. That is the confident-lie class this milestone
// exists to kill: green in every oracle that only ever ran at 1400px. So the population here is
// {six children} × {two viewports} = 12 observations, plus the index and the section-click claim
// at each width.
//
// THE MOBILE TAG IS A CONTRACT, NOT DECORATION. `playwright.config.ts:49-57` defines a real
// `chromium-mobile` project (Pixel 7) whose `grep` selects exactly the tests whose titles carry
// the literal tag, and 97-07 Task 3 DERIVES its expected pass count from the number of lines in
// this file carrying it, then requires that many tests to have actually PASSED. A skip and a pass
// are indistinguishable by exit code (RULING-P97-06 §2), so without the tag and the derived count,
// eight silently skipped tests would satisfy every gate in the set. The tag is therefore spelled
// ONLY inside the eight mobile test titles below — never in prose, never in a comment, never on a
// describe — because one stray occurrence inflates 97-07's derived count and re-opens exactly the
// hole it closes. Each of those `test(...)` calls also keeps its opening on ONE line so a reflow
// cannot break the anchored count. Renaming the tag means repointing 97-07 Task 3 in the SAME edit
// (C9).
//
// SCOPE NAMING (RULING-P97-03 §3). Settings is NOT admin-gated, but every title still names the
// role and the viewport it proves, so no reader of a green infers an admin-scoped or a
// desktop-only result from it.
//
// PRODUCER BEFORE CONSUMER (D-10). This file lands BEFORE its subject (97-06 / 97-07) and is
// EXPECTED RED: today no `/settings/*` child renders `nav.settings-nav-card` at all.
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

const SETTLE_TIMEOUT = 15_000

const DESKTOP_1400 = { width: 1400, height: 900 }
const MOBILE_390 = { width: 390, height: 844 }

/**
 * HARDCODED, never derived at runtime. Playwright spec paths are FILTERS and a list built by
 * reading a directory silently shrinks — a five-element list would run five tests and exit 0,
 * reporting a closed requirement over an uncovered child. This array is the population of record —
 * the same six paths the tests below spell out longhand — and the gate compares its DISTINCT
 * members against the count `routeTree.gen.ts` declares, so a seventh settings child added later
 * turns the gate red instead of going quietly uncovered.
 */
const SETTINGS_CHILDREN = [
  '/settings/webhooks',
  '/settings/integrations',
  '/settings/notifications',
  '/settings/email-digest',
  '/settings/calendar-sync',
  '/settings/calendar/callback',
]

// Fails loudly at module load — a hand-edit that drops a child cannot pass as a smaller suite.
if (SETTINGS_CHILDREN.length !== 6) {
  throw new Error(
    `97-settings-nav: expected 6 /settings children, found ${SETTINGS_CHILDREN.length}`,
  )
}

/** The child the section-click claim starts from. Reaching it is `goto`; the CLAIM is the click. */
const SECTION_CLICK_ORIGIN = '/settings/webhooks'

/** A section that is NOT the default (`profile`), so landing on the default reads as a failure. */
const SECTION_CLICK_TARGET = 'appearance'

/** Reused UNWIDENED from `95-monitoring-mounts.spec.ts:54-55`. */
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
 * The four observations every settings child owes, at whatever viewport the calling describe set.
 * Shared verbatim by both blocks so the matrix genuinely differs only in width — a per-viewport
 * copy of these assertions could drift and hide the very asymmetry this file exists to catch.
 */
const assertChildRendersNavigation = async (page: Page, childPath: string): Promise<void> => {
  await page.goto(childPath)

  // (1) The settings nav column is present, WITH its return affordance. For the deepest child the
  // return path is most of what "renders navigation" even means.
  const settingsNav = page.locator('nav.settings-nav-card')
  await expect(settingsNav).toBeVisible({ timeout: SETTLE_TIMEOUT })
  await expect(page.getByTestId('settings-back-to-app')).toBeVisible({ timeout: SETTLE_TIMEOUT })

  // (2) Exactly one nav affordance, not two: the global sidebar stays suppressed at BOTH of its
  // mounts. `aside.appshell-aside` is the desktop column; `.appshell-drawer-panel` is the mobile
  // drawer's Sidebar host. Two navs is as much a failure as none.
  await expect(page.locator('aside.appshell-aside')).toHaveCount(0)
  await expect(page.locator('.appshell-drawer-panel')).toHaveCount(0)

  // (3) ZERO `aria-current="page"` on a child. None of the nine in-page sections is what is
  // rendered here, and three of them share a name with a DIFFERENT child route — highlighting one
  // would claim "you are here" about a page the user is not on.
  await expect(settingsNav.locator('[aria-current="page"]')).toHaveCount(0)

  // (4) The child's own content rendered. A nav column over a blank pane is a reachability
  // regression wearing the fix's clothes, so the assertion is that `main` carries text BEYOND the
  // nav column's own.
  // RULING-P97-13: this was a FIXED-MOMENT sample, which measured LOAD TIMING while claiming to
  // measure RENDERING. Two panes render a text-free spinner while loading (SPINNER-A11Y-01:
  // NotificationPreferences.tsx:149-155, EmailDigestSettings.tsx:245), so `innerText` read 0 chars
  // at ~0 ms though the criterion was TRUE — measured first content at 968 ms / 648 ms, versus a
  // passing sibling at 344 ms. The fix is a BOUNDED poll on the same condition, never a sleep and
  // never an unbounded wait (which converts a hang into a pass-after-forever).
  // BOUND: 5000 ms — 5.2x the slowest measured pane, and still red for a pane that never renders.
  await expect
    .poll(
      async () => {
        const main = ((await page.getByRole('main').innerText()) ?? '').trim()
        const nav = ((await settingsNav.innerText()) ?? '').trim()
        return main.replace(nav, '').trim().length
      },
      { timeout: 5000, message: 'child pane rendered no content beyond the settings nav column' },
    )
    .toBeGreaterThan(0)

  const bodyText = (await page.locator('body').innerText()) ?? ''
  expect(bodyText).not.toMatch(INTERNAL_STRING)
}

/** The index keeps its shipped active state: exactly ONE selected section. */
const assertIndexActiveState = async (page: Page): Promise<void> => {
  await page.goto('/settings')

  const settingsNav = page.locator('nav.settings-nav-card')
  await expect(settingsNav).toBeVisible({ timeout: SETTLE_TIMEOUT })
  await expect(settingsNav.locator('[aria-current="page"]')).toHaveCount(1)

  // SettingsPage content renders — the `SettingsLayout` region only mounts from the index.
  await expect(page.getByRole('region', { name: 'Settings' })).toBeVisible({
    timeout: SETTLE_TIMEOUT,
  })

  const bodyText = (await page.locator('body').innerText()) ?? ''
  expect(bodyText).not.toMatch(INTERNAL_STRING)
}

/**
 * No dead buttons. From a child, clicking a section row must land on `/settings` with THAT section
 * rendered. Landing on the default `profile` after clicking "Appearance" is a forbidden shape, so
 * the landed section is asserted by its own row carrying `aria-current="page"` afterwards.
 */
const assertSectionClickFromChild = async (page: Page): Promise<void> => {
  await page.goto(SECTION_CLICK_ORIGIN)

  const settingsNav = page.locator('nav.settings-nav-card')
  await expect(settingsNav).toBeVisible({ timeout: SETTLE_TIMEOUT })

  const targetRow = page.getByTestId(`settings-nav-${SECTION_CLICK_TARGET}`)
  await expect(targetRow).toBeVisible({ timeout: SETTLE_TIMEOUT })

  // THE CLAIM IS THE CLICK. `goto` above only established the starting child.
  await targetRow.click()

  await expect(page).toHaveURL(/\/settings(\?.*)?$/, { timeout: SETTLE_TIMEOUT })
  await expect(page.getByTestId(`settings-nav-${SECTION_CLICK_TARGET}`)).toHaveAttribute(
    'aria-current',
    'page',
    { timeout: SETTLE_TIMEOUT },
  )

  const bodyText = (await page.locator('body').innerText()) ?? ''
  expect(bodyText).not.toMatch(INTERNAL_STRING)
}

// EVERY test below is written out LONGHAND — one `test(...)` per child per viewport, never a
// `for` loop over SETTINGS_CHILDREN. A loop is tidier source and it would silently break the
// contract: 97-07 Task 3 derives its expected pass count by counting the tagged DECLARATION LINES
// in this file, and a loop collapses six tests into one line. Six tests would run and three would
// be expected to pass, so three could vanish unnoticed — the same skipped-reads-as-passed hole the
// tag exists to close, reintroduced by a refactor that looks like an improvement.

test.describe('NAV-02 /settings subtree renders navigation — desktop aside width', () => {
  test.use({ viewport: DESKTOP_1400 })

  test('settings child /settings/webhooks — admin user (the only session these specs have), desktop 1400', async ({
    page,
  }) => {
    await signInInline(page)
    await assertChildRendersNavigation(page, '/settings/webhooks')
  })

  test('settings child /settings/integrations — admin user (the only session these specs have), desktop 1400', async ({
    page,
  }) => {
    await signInInline(page)
    await assertChildRendersNavigation(page, '/settings/integrations')
  })

  test('settings child /settings/notifications — admin user (the only session these specs have), desktop 1400', async ({
    page,
  }) => {
    await signInInline(page)
    await assertChildRendersNavigation(page, '/settings/notifications')
  })

  test('settings child /settings/email-digest — admin user (the only session these specs have), desktop 1400', async ({
    page,
  }) => {
    await signInInline(page)
    await assertChildRendersNavigation(page, '/settings/email-digest')
  })

  test('settings child /settings/calendar-sync — admin user (the only session these specs have), desktop 1400', async ({
    page,
  }) => {
    await signInInline(page)
    await assertChildRendersNavigation(page, '/settings/calendar-sync')
  })

  test('settings child /settings/calendar/callback — admin user (the only session these specs have), desktop 1400', async ({
    page,
  }) => {
    await signInInline(page)
    await assertChildRendersNavigation(page, '/settings/calendar/callback')
  })

  test('settings index active state — admin user (the only session these specs have), desktop 1400', async ({
    page,
  }) => {
    await signInInline(page)
    await assertIndexActiveState(page)
  })

  test('section click from a child — admin user (the only session these specs have), desktop 1400', async ({
    page,
  }) => {
    await signInInline(page)
    await assertSectionClickFromChild(page)
  })
})

test.describe('NAV-02 /settings subtree renders navigation — drawer width', () => {
  test.use({ viewport: MOBILE_390 })

  test('settings child /settings/webhooks — admin user (the only session these specs have), mobile 390 @mobile', async ({
    page,
  }) => {
    await signInInline(page)
    await assertChildRendersNavigation(page, '/settings/webhooks')
  })

  test('settings child /settings/integrations — admin user (the only session these specs have), mobile 390 @mobile', async ({
    page,
  }) => {
    await signInInline(page)
    await assertChildRendersNavigation(page, '/settings/integrations')
  })

  test('settings child /settings/notifications — admin user (the only session these specs have), mobile 390 @mobile', async ({
    page,
  }) => {
    await signInInline(page)
    await assertChildRendersNavigation(page, '/settings/notifications')
  })

  test('settings child /settings/email-digest — admin user (the only session these specs have), mobile 390 @mobile', async ({
    page,
  }) => {
    await signInInline(page)
    await assertChildRendersNavigation(page, '/settings/email-digest')
  })

  test('settings child /settings/calendar-sync — admin user (the only session these specs have), mobile 390 @mobile', async ({
    page,
  }) => {
    await signInInline(page)
    await assertChildRendersNavigation(page, '/settings/calendar-sync')
  })

  test('settings child /settings/calendar/callback — admin user (the only session these specs have), mobile 390 @mobile', async ({
    page,
  }) => {
    await signInInline(page)
    await assertChildRendersNavigation(page, '/settings/calendar/callback')
  })

  test('settings index active state — admin user (the only session these specs have), mobile 390 @mobile', async ({
    page,
  }) => {
    await signInInline(page)
    await assertIndexActiveState(page)
  })

  test('section click from a child — admin user (the only session these specs have), mobile 390 @mobile', async ({
    page,
  }) => {
    await signInInline(page)
    await assertSectionClickFromChild(page)
  })
})
