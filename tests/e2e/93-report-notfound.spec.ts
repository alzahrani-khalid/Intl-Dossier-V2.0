// @covers TRUST-03
//
// Phase 93 Wave 2 (93-13) — not-found oracle for the report builder route.
//
// WHAT THIS KILLS. `/reports/<any-id>` used to render a fresh empty builder for every id:
// `useReportBuilderState` ignores `initialReportId`, so the route had no fetch and therefore no
// way to know whether the report existed. An empty builder that "looks like the report" is a
// confident lie about a record that may not exist. 93-13 gave the route a loader whose only job
// is existence.
//
// THE HONEST DISJUNCTION — read this before "fixing" a surprising arm. There are TWO honest
// renders for a well-formed absent id, and which one appears is a property of the DATABASE, not
// of this route:
//
//   (a) 404  — the `custom_reports` by-id read succeeded and returned no row. The loader throws
//              notFound() and the root not-found page renders.
//   (b) query-error-state — the read REJECTED. `custom_reports` and `report_shares` carry
//              mutually recursive SELECT policies (`42P17 infinite recursion detected in
//              policy`), so the read may reject for EVERY id until WRITE-06 lands. That is
//              tracked as Phase 94; the error state is the intended pre-Phase-94 render, not a
//              regression in this route.
//
// So the disjunction is deliberate, and it covers only WHICH honest state renders. The primary
// assertion — no fresh builder for an absent id — is UNCONDITIONAL. The arm actually taken is
// printed and annotated on every run so it is never left ambiguous.
//
// PHASE 94 TIGHTENS THIS: once the policy recursion is fixed, delete arm (b) and assert the 404
// arm only. Leaving the disjunction in place after WRITE-06 would let a rejection pass as a pass.
//
// AUTHENTICATION: inline, from TEST_USER_EMAIL / TEST_USER_PASSWORD, and run with --no-deps. The
// Playwright `setup` project throws without six E2E_* keys that .env.test does not carry
// (E2ECRED-01, filed against Phase 101), so no storage-state fixture is usable here.
import { test, expect, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

// TIMING. The by-id read rejects with a PostgrestError, which carries no numeric `status`, so
// query-client.ts's 4xx short-circuit never fires and TanStack Query runs its full retry ladder:
// 4 attempts at 1s + 2s + 4s backoff. The error arm therefore arrives at ~7s, past Playwright's
// default 5s expect timeout. This budget is retry backoff, not flakiness — a CORRECT
// implementation fails the default timeout.
const RETRY_BACKOFF_TIMEOUT = 15_000

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

test.describe('TRUST-03 a well-formed absent report id never cosplays as a report', () => {
  test('absent report id renders 404 or the error state, never a fresh builder', async ({
    page,
  }) => {
    await signInInline(page)

    // Well-formed and (with overwhelming probability) absent. Never a hardcoded id: a seeded row
    // would make this test pass for the wrong reason.
    const absentId = crypto.randomUUID()
    await page.goto(`/reports/${absentId}`)

    // The builder's own page heading (ReportBuilder.tsx renders <h1>{t('title')}</h1>). Its
    // presence is exactly the lie under test — an empty builder standing in for a report.
    const builderHeading = page.getByRole('heading', { name: 'Report Builder' })

    // The two honest arms.
    const notFoundPage = page.getByText(/^404$/)
    const queryErrorState = page.getByTestId('query-error-state')

    // Wait for EITHER honest state to settle. Neither arm is asserted alone — that is the point.
    await expect
      .poll(async () => (await notFoundPage.count()) + (await queryErrorState.count()), {
        timeout: RETRY_BACKOFF_TIMEOUT,
        message: 'neither the 404 page nor the query-error state rendered for an absent report id',
      })
      .toBeGreaterThan(0)

    // Record WHICH arm this run took, so the observed live behavior is never inferred later.
    const arm =
      (await notFoundPage.count()) > 0
        ? 'A: root 404 (row absent)'
        : 'B: query-error-state (read rejected — 42P17/WRITE-06, Phase 94)'
    console.log(`[93-13] observed arm -> ${arm}`)
    test.info().annotations.push({ type: '93-13-observed-arm', description: arm })

    // THE UNCONDITIONAL CONJUNCT. Whichever arm rendered, the builder must not be on screen.
    await expect(builderHeading).toHaveCount(0)
  })
})
