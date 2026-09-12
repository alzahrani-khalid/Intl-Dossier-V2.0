// @covers DEAD-02 (criterion 2)
//
// Phase 95 — NATURAL-state oracle for /tasks/queue against the DEPLOYED assignments-queue.
//
// WHY THIS ONE IS DELIBERATELY **NOT** CDP-BLOCKED. Its sibling `93-tasks-queue-error.spec.ts`
// blocks the request at the network layer precisely so it stays deterministic before AND after
// this phase's deploy — it is a NAMED NON-CONSUMER of that deploy and is not touched here. This
// spec is the other half of the pair: it asserts the state the page reaches with the function
// actually answering, so it is an EXECUTION-TIME oracle whose producer is 95-02 Task 2 (the
// deploy), ordered before it in the same plan. Blocking the request here would assert nothing
// about deployment, which is the whole of criterion 2.
//
// WHAT "RENDERS" MEANS HERE. Criterion 2 is "renders against a DEPLOYED function", NOT "renders
// rows". The function's role gate is server-side and truthful: no `staff_profiles` row -> 404,
// role 'staff' -> 403, supervisor -> unit-scoped rows, admin -> all rows. Each of those produces
// a TRUTHFUL render. So the oracle accepts EXACTLY ONE of three settled states — rows, the empty
// state, or the shared error state — and rejects the two renders that are lies: a spinner still
// on screen past the retry budget, and any internal string in the visible text. The observed
// state is emitted as a QUEUE-STATE line and transcribed into the 95-02 SUMMARY; anything other
// than `rows` closes the criterion with a NAMED BOUND in the 95-09 register, never an
// unqualified pass.
//
// AUTHENTICATION: inline, from TEST_USER_EMAIL / TEST_USER_PASSWORD, and run with --no-deps. The
// Playwright `setup` project throws without six E2E_* keys that .env.test does not carry
// (E2ECRED-01, filed against Phase 101), so no storage-state fixture is usable here.
import { test, expect, type Locator, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

// TIMING. An ApiError from apiGet carries a numeric `status`, so query-client.ts short-circuits
// the retry ladder on 4xx; a 5xx or a transport failure still runs 4 attempts at 1s + 2s + 4s
// backoff and reaches `isError` at ~7s, past Playwright's default 5s expect timeout. This budget
// is retry backoff, not flakiness.
const RETRY_BACKOFF_TIMEOUT = 15_000

/** No rendered text may carry a Postgres/PostgREST code, a permission string, the vendor name, or
 * a supabase-js error class (95-UI-SPEC, inherited from 93-UI-SPEC §D-08). */
const INTERNAL_STRING =
  /(42501|42703|42P01|permission denied|supabase|FunctionsHttpError|FunctionsFetchError)/i

/** The loading render of the queue list (`queue.loading`) — must be gone once the page settles. */
const LOADING_TEXT = 'Loading queue...'

type QueueState = 'rows' | 'empty' | 'error'

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
 * The three settled states, located in the DOM only — never inferred from a response status. An
 * auth/RLS denial can present as an EMPTY 200, and mistaking that empty for the error state is
 * the defect class this milestone exists to kill.
 */
const stateProbes = (page: Page): Array<[QueueState, Locator]> => [
  ['rows', page.getByText(/Position #\d+/)],
  ['empty', page.getByText('No items in queue')],
  ['error', page.getByTestId('query-error-state')],
]

const visibleStates = async (page: Page): Promise<QueueState[]> => {
  const found: QueueState[] = []
  for (const [name, locator] of stateProbes(page)) {
    const visible = await locator
      .first()
      .isVisible()
      .catch(() => false)
    if (visible) {
      found.push(name)
    }
  }
  return found
}

/**
 * Waits until EXACTLY ONE truthful state is on screen and returns it. Zero states means the page
 * is still spinning (or rendered nothing at all); two means the page is showing contradictory
 * states at once. Both are failures of the four-state contract, not of this test.
 */
const settle = async (page: Page): Promise<QueueState> => {
  let states: QueueState[] = []
  await expect
    .poll(
      async () => {
        states = await visibleStates(page)
        return states.length
      },
      {
        timeout: RETRY_BACKOFF_TIMEOUT,
        message: '/tasks/queue never settled into exactly one of rows | empty | error',
      },
    )
    .toBe(1)
  // console.warn, not console.log: the repo lints with --max-warnings 0 and permits warn/error
  // only. The runner forwards it, so the QUEUE-STATE line survives into the recorded output.
  console.warn(`QUEUE-STATE: ${states[0]}`)
  return states[0]
}

test.describe('criterion 2 — /tasks/queue renders against a deployed assignments-queue', () => {
  test('the page settles into exactly one truthful state, with no spinner and no internal string', async ({
    page,
  }) => {
    await signInInline(page)
    await page.goto('/tasks/queue')

    await settle(page)

    // Nothing may still be claiming "loading" once a state has been reached.
    await expect(page.getByText(LOADING_TEXT)).toHaveCount(0)

    // The copy rule, asserted over the whole rendered page — a leak anywhere is the same defect.
    const bodyText = (await page.locator('body').innerText()) ?? ''
    expect(bodyText).not.toMatch(INTERNAL_STRING)
  })

  test('selecting a priority filter sends the filter as a query string and settles truthfully', async ({
    page,
  }) => {
    await signInInline(page)
    await page.goto('/tasks/queue')

    const state = await settle(page)
    const priorityTrigger = page.getByRole('combobox').first()

    if (state === 'error') {
      // The error branch of AssignmentQueue.tsx returns before the filter row, so there is no
      // control to drive. That is the page behaving correctly, not a defect — but the filter
      // transport then goes UNEXERCISED at runtime, and this test says so out loud instead of
      // passing quietly. The assertions below still bite: filters may be absent ONLY here.
      await expect(priorityTrigger).toHaveCount(0)
      console.warn(
        'QUEUE-FILTER-EXERCISED: no — page settled to the error state, whose branch renders no filter controls',
      )
      return
    }

    // Pre-fix this is RED: functions.invoke carried the filters in a request BODY, so no
    // `priority=` ever appeared in the URL the function reads via url.searchParams.
    const filteredRequest = page.waitForRequest(
      (req) => req.url().includes('assignments-queue') && /[?&]priority=/.test(req.url()),
      { timeout: RETRY_BACKOFF_TIMEOUT },
    )

    await priorityTrigger.click()
    await page.getByRole('option', { name: /urgent/i }).click()
    await filteredRequest
    console.warn('QUEUE-FILTER-EXERCISED: yes')

    await settle(page)
    await expect(page.getByText(LOADING_TEXT)).toHaveCount(0)
    const bodyText = (await page.locator('body').innerText()) ?? ''
    expect(bodyText).not.toMatch(INTERNAL_STRING)
  })
})
