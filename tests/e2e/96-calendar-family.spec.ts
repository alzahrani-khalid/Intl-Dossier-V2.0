// @covers DEAD-07 (criterion 3)
//
// Phase 96 — the DEAD-07 family oracle. Four surfaces, one spec, four tests. Cloned from the
// proven Phase 95 shape (`95-sandbox-error.spec.ts`): inline auth, `--no-deps`, a retry-backoff
// budget, an internal-string regex, and assertions that live entirely in the DOM.
//
// THE CRITERION. "/calendar renders a grid (empty or not), /calendar/new mounts the create form,
// /events pads the month by the REAL weekday offset with working month navigation, and
// /word-assistant's status badge reflects a LIVE probe." Every clause is a statement about what
// is RENDERED, so no grep can close it — only DOM observations can. Each test below asserts one
// clause, and each asserts the thing that was actually broken:
//   1. the grid was replaced by a wizard whenever the visible month held zero rows;
//   2. /calendar/new rendered its parent only (no <Outlet/> — the DEAD-08 class);
//   3. day 1 always sat under Sunday whatever weekday it really was, and there was no month nav;
//   4. the badge initialised to connected and, in the default composer mode, never probed at all.
//
// ORACLE POPULATION DEFINITION. The observable surface is the DEV SERVER at :5173 running the
// app under `chromium-en` — the single origin that authenticates (ORACLECAP/CORS: only :5173 is
// in ALLOWED_ORIGINS), so all four tests share one app instance. What falls OUTSIDE this oracle,
// stated so silence is not read as coverage:
//   - Arabic pixels and RTL mirroring of these surfaces (operator park, and 96-04's
//     calendar-rtl/calendar-a11y/calendar-visual items are under separate rulings);
//   - the word-assistant composer's grammar/drafting functionality — only the BADGE's
//     truthfulness is in criterion 3;
//   - production builds, and the /calendar data itself: how many entries staging holds is not
//     asserted anywhere below, because zero rows is a truthful outcome and encoding today's row
//     count as an expectation is how a data change reds a correct implementation.
//
// WHY THE BLOCK PATTERN IS `*/functions/v1/word-assistant*` AND NOT `*word-assistant*`. The SPA
// route, the dev-server module URL (`/src/pages/word-assistant/WordAssistantPage.tsx`) and the
// edge function all carry the string `word-assistant`. The broad pattern therefore blocks the
// page's own module and the surface renders blank — and a spec that "passed" against a blank
// page would be measuring its own block, not the app (the 95-03 lesson, recorded there as an
// observed failure, not a hypothesis). The narrowed pattern hits only the probe request.
//
// Emptiness is NEVER read as an error (D-16): an RLS denial presents as an empty 200, and
// reading that as a failure state is the defect class this milestone kills. Where two outcomes
// are both truthful, both pass.
//
// AUTHENTICATION: inline, from TEST_USER_EMAIL / TEST_USER_PASSWORD, run with --no-deps. The
// Playwright `setup` project throws without six E2E_* keys that .env.test does not carry
// (E2ECRED-01, filed against Phase 101), so no storage-state fixture is usable here.
import { test, expect, type Page } from '@playwright/test'
import { getDay, parse, startOfMonth } from 'date-fns'
import LoginPage from './support/pages/LoginPage'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

/** Blocks the word-assistant probe request only — never the SPA module. See the header. */
const BLOCKED_PROBE = '*/functions/v1/word-assistant*'

// TIMING. Lazy chunk + auth + query settle. The budget is a ceiling on "still loading", not
// flake tolerance: a skeleton still on screen at 15s IS the failure criterion 3 names.
const SETTLE_TIMEOUT = 15_000

/**
 * The copy rule (93-UI-SPEC §Verification Notes): no rendered text may carry a
 * Postgres/PostgREST code, a permission string, the vendor name, or a supabase-js error class.
 */
const INTERNAL_STRING =
  /(42501|42703|42P01|permission denied|supabase|FunctionsHttpError|FunctionsFetchError)/i

/** The three probe-pill labels, en (this spec runs `chromium-en`). Source: i18n/en/common.json. */
const PILL_CHECKING = 'Checking connection'
const PILL_CONNECTED = 'Connected'
const PILL_DISCONNECTED = 'Disconnected'

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

test.describe('criterion 3 — the DEAD-07 calendar family renders truthfully', () => {
  test('/calendar renders the month grid whether or not the month holds events', async ({
    page,
  }) => {
    await signInInline(page)
    await page.goto('/calendar')

    // The grid is the assertion. Before this phase an empty month replaced it wholesale with
    // CalendarEmptyWizard, so "a grid is on screen" is exactly the discriminator between the
    // defect and the fix — no separate wizard assertion is needed, the two cannot coexist.
    const grid = page.getByTestId('cal-grid')
    await expect(grid).toBeVisible({ timeout: SETTLE_TIMEOUT })
    await expect(page.getByTestId('cal-dow')).toHaveCount(7)

    // A month grid is whole weeks of cells. Asserted as a shape invariant, never as a count of
    // today's data: the number of EVENTS in the month is deliberately not asserted anywhere.
    const cellCount = await page.getByTestId('cal-cell').count()
    expect(cellCount).toBeGreaterThanOrEqual(28)
    expect(cellCount % 7).toBe(0)

    // Nothing is still loading. The loading state is the only thing rendering these skeletons.
    await expect(page.locator('.cal-cell-skeleton')).toHaveCount(0, { timeout: SETTLE_TIMEOUT })
    await expect(page.locator('.cal-row-skeleton')).toHaveCount(0)

    const bodyText = (await page.locator('body').innerText()) ?? ''
    expect(bodyText).not.toMatch(INTERNAL_STRING)
  })

  test('/calendar/new mounts the create form, not its parent page', async ({ page }) => {
    await signInInline(page)
    await page.goto('/calendar/new')

    // A parent-only render (the DEAD-08 class: a registered child under a parent that renders no
    // <Outlet/>) shows the calendar page and NO form. Both halves are asserted, because either
    // one alone is satisfiable by the broken render on some other route shape.
    const form = page.locator('form')
    await expect(form).toHaveCount(1, { timeout: SETTLE_TIMEOUT })
    await expect(form).toBeVisible()
    await expect(page.getByTestId('cal-grid')).toHaveCount(0)

    // The form is really mounted, not an empty <form> shell: at least one field renders WITH an
    // accessible name. Matched as "any non-empty name" via role, so this does not hard-code copy
    // that P98 owns.
    await expect(form.getByRole('textbox', { name: /.+/ }).first()).toBeVisible({
      timeout: SETTLE_TIMEOUT,
    })

    const bodyText = (await page.locator('body').innerText()) ?? ''
    expect(bodyText).not.toMatch(INTERNAL_STRING)
  })

  test('/events pads by the real weekday offset and its month navigation works', async ({
    page,
  }) => {
    await signInInline(page)
    await page.goto('/events')

    const grid = page.locator('div.grid-cols-7')
    await expect(grid).toHaveCount(1, { timeout: SETTLE_TIMEOUT })

    // The month under test is whatever month the page is showing — read from the DOM, never
    // assumed. The expected offset is then computed IN THE TEST from that month, so this oracle
    // stays correct in every future month rather than encoding today's answer.
    const monthHeading = grid.locator('..').getByRole('heading', { level: 2 })
    const headingText = (await monthHeading.innerText()).trim()
    const expectedOffset = getDay(startOfMonth(parse(headingText, 'MMMM yyyy', new Date())))
    expect(expectedOffset).toBeGreaterThanOrEqual(0)
    expect(expectedOffset).toBeLessThanOrEqual(6)

    // The grid's children are: 7 weekday headers (exactly one full row), then the leading
    // aria-hidden pads, then the date cells. So the first date cell's COLUMN is its child index
    // mod 7 — a layout fact read out of the DOM, not a re-implementation of the component.
    const layout = await grid.evaluate((el) => {
      const children = Array.from(el.children)
      const firstDateIndex = children.findIndex(
        (child, i) => i >= 7 && child.getAttribute('aria-hidden') !== 'true',
      )
      return {
        firstDateIndex,
        firstDateText:
          firstDateIndex >= 0 ? (children[firstDateIndex].textContent ?? '').trim() : '',
      }
    })

    expect(layout.firstDateIndex).toBeGreaterThanOrEqual(7)
    expect(layout.firstDateText.startsWith('1')).toBe(true)
    expect(layout.firstDateIndex % 7).toBe(expectedOffset)

    // Working navigation: next moves the month, previous brings it back. Asserted as "changed"
    // and "returned" rather than against named months, so the test does not depend on when it
    // runs.
    const calendarView = grid.locator('..')
    await calendarView.getByRole('button', { name: 'Next' }).click()
    await expect(monthHeading).not.toHaveText(headingText, { timeout: SETTLE_TIMEOUT })

    await calendarView.getByRole('button', { name: 'Previous' }).click()
    await expect(monthHeading).toHaveText(headingText, { timeout: SETTLE_TIMEOUT })

    const bodyText = (await page.locator('body').innerText()) ?? ''
    expect(bodyText).not.toMatch(INTERNAL_STRING)
  })

  test('/word-assistant badge never claims connected without a live 2xx probe', async ({
    page,
  }) => {
    await signInInline(page)

    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Network.enable')
    await cdp.send('Network.setBlockedURLs', { urls: [BLOCKED_PROBE] })

    // INSTRUMENT TEST, not the oracle. If the pattern matched nothing, the probe would answer
    // normally and this test would be measuring an unforced page. Record whether the block
    // actually fired; the verdict below is still taken from the DOM alone.
    const blockedRequests: string[] = []
    page.on('requestfailed', (request) => {
      if (request.url().includes('/functions/v1/word-assistant')) {
        blockedRequests.push(request.failure()?.errorText ?? 'unknown')
      }
    })

    // `commit` returns before the SPA boots, so the sampling below starts ahead of the mount
    // effect that fires the probe — the badge's pre-settle state is observable rather than
    // raced past.
    await page.goto('/word-assistant', { waitUntil: 'commit' })

    const badge = page.getByTestId('word-assistant-connection')
    await expect(badge).toBeVisible({ timeout: SETTLE_TIMEOUT })

    // "NEVER shows connected" is a claim over TIME, so it is sampled over time rather than read
    // once. The structural half lives in the component (connected is reachable only from a
    // 2xx probe result); this is the behavioural half.
    const observed: string[] = []
    const deadline = Date.now() + SETTLE_TIMEOUT
    let settled = ''
    while (Date.now() < deadline) {
      const label = (await badge.innerText()).trim()
      if (observed[observed.length - 1] !== label) observed.push(label)
      if (label === PILL_DISCONNECTED) {
        settled = label
        break
      }
      await page.waitForTimeout(50)
    }

    expect(settled, `badge never settled to disconnected; observed: ${observed.join(' → ')}`).toBe(
      PILL_DISCONNECTED,
    )
    expect(observed).not.toContain(PILL_CONNECTED)
    // Every state the pill passed through was one of the two truthful ones for a blocked probe.
    expect(observed.every((label) => label === PILL_CHECKING || label === PILL_DISCONNECTED)).toBe(
      true,
    )

    const bodyText = (await page.locator('body').innerText()) ?? ''
    expect(bodyText).not.toMatch(INTERNAL_STRING)

    // The force was real: at least one probe request died at the NETWORK layer. A 500 is a
    // completed response and fires `requestfinished`, never `requestfailed`. The reason string
    // is Chrome's own label for a DevTools-initiated block (`inspector`, observed in 95-03);
    // matched loosely so a Chrome rename cannot red a correct implementation.
    expect(blockedRequests.length).toBeGreaterThan(0)
    expect(blockedRequests[0]).toMatch(/inspector|blocked/i)
  })
})
