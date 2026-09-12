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
// ONE ARM, SINCE PHASE 94 (ARMA-01). This spec used to accept EITHER a 404 OR the route's
// read-rejected error render, because `custom_reports` and `report_shares` carried mutually
// recursive SELECT policies (`42P17 infinite recursion detected in policy`) and the by-id read
// rejected for EVERY id. Phase 94 / WRITE-06 broke that recursion — see
// supabase/migrations/20260816500001_p94_report_rls_recursion.sql — so the read now succeeds and
// returns no row: the loader throws notFound() and the root not-found page renders.
//
// The second arm was DELETED in that same phase. Left in place after WRITE-06 it would have
// converted a rejection into a pass and made this green permanent and false. What remains is a
// conjunction, and both halves have to hold on every run: the 404 page renders, AND the builder
// heading — the lie under test — is absent.
//
// AUTHENTICATION: inline, from TEST_USER_EMAIL / TEST_USER_PASSWORD, and run with --no-deps. The
// Playwright `setup` project throws without six E2E_* keys that .env.test does not carry
// (E2ECRED-01, filed against Phase 101), so no storage-state fixture is usable here.
import { test, expect, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

// TIMING. Kept lenient after the Phase 94 tightening: the budget now covers the loader's by-id
// round-trip to staging rather than TanStack Query's retry ladder on a rejection. A generous
// ceiling is harmless for a slow 404 — the assertion still fails if the page never renders.
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
  test('absent report id renders the 404 page, never a fresh builder', async ({ page }) => {
    await signInInline(page)

    // Well-formed and (with overwhelming probability) absent. Never a hardcoded id: a seeded row
    // would make this test pass for the wrong reason.
    const absentId = crypto.randomUUID()
    await page.goto(`/reports/${absentId}`)

    // The builder's own page heading (ReportBuilder.tsx renders <h1>{t('title')}</h1>). Its
    // presence is exactly the lie under test — an empty builder standing in for a report.
    const builderHeading = page.getByRole('heading', { name: 'Report Builder' })

    // The only honest render for a well-formed absent id, asserted alone since Phase 94.
    const notFoundPage = page.getByText(/^404$/)

    await expect(notFoundPage).toBeVisible({ timeout: RETRY_BACKOFF_TIMEOUT })

    // THE UNCONDITIONAL CONJUNCT. The 404 rendered; the builder must not be on screen with it.
    await expect(builderHeading).toHaveCount(0)
  })
})
