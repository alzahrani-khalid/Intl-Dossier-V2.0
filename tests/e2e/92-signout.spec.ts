// @covers AUTH-01, AUTH-03, AUTH-05
//
// Phase 92 Wave 0. Covers ONLY what tests/e2e/01-login.spec.ts does not (D-26.3): the
// cleared-session assertion (D-04), the /settings surface (AUTH-05/D-02), and the reactive
// open-tab bounce on an invalidated session (AUTH-03). The 01-login sidebar-signout → /login
// URL assertion is deliberately NOT duplicated here.
//
// AUTHENTICATION: inline, from TEST_USER_EMAIL / TEST_USER_PASSWORD. This spec uses NONE of the
// storage-state fixtures exported by tests/e2e/support/fixtures.ts and none of the role pages
// they provide, and it must be run with --no-deps so the Playwright `setup` project is skipped.
// Rationale (RULING-36, extending D-15's rule to a second operator act): `setup` throws unless
// six E2E_{ADMIN,ANALYST,INTAKE}_{EMAIL,PASSWORD} keys are present and .env.test carries none of
// them — an external blocker filed as E2ECRED-01 against Phase 101. Routing this spec through
// `setup` would make the phase's central before/after evidence wait on operator credential
// provisioning. The sign-out oracle needs ONE authenticated user, not three roles.
//
// EXPECTED RED until plan 92-02 lands (no user-menu testid mounted, no /settings sign-out
// control, no navigation seam).
import { test, expect, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'

/** Supabase session key: `sb-<project-ref>-auth-token` (Assumption A1, validated in test 1). */
const AUTH_STORAGE_KEY = 'sb-zkrcjzdemdmwhearhfgg-auth-token'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

const readSession = async (page: Page): Promise<string | null> =>
  page.evaluate((key) => localStorage.getItem(key), AUTH_STORAGE_KEY)

/**
 * Authenticate inline. `chromium-en` still applies the (expired) admin.json storageState at
 * context creation, so the first navigation may land on /login; this sign-in overwrites it.
 * Never echo either credential value.
 */
const signInInline = async (page: Page): Promise<void> => {
  if (email === '' || password === '') {
    throw new Error('TEST_USER_EMAIL / TEST_USER_PASSWORD missing from .env.test')
  }
  const login = new LoginPage(page)
  await login.goto()
  await login.signIn(email, password)
  await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 })
}

test.describe('AUTH-01/03/05 session integrity', () => {
  test('sign-out genuinely clears the session', async ({ page }) => {
    await signInInline(page)
    await page.goto('/')

    // Validates Assumption A1 in-test: if this is null the key name is wrong, not the app.
    expect(await readSession(page)).not.toBeNull()

    await page.getByTestId('user-menu').click()
    await new LoginPage(page).signOut()

    // The /login URL is incidental sequencing — it settles the navigation before the storage
    // read. The assertion of record is the cleared session (D-04), which 01-login never checks.
    await page.waitForURL('**/login', { timeout: 15_000 })
    expect(await readSession(page)).toBeNull()
  })

  test('/settings is reachable from navigation and exposes an independent sign-out', async ({
    page,
  }) => {
    await signInInline(page)
    await page.goto('/')

    await page.getByTestId('user-menu').click()
    // nav-user.tsx:85-90 is `<DropdownMenuItem asChild><Link to="/settings">`, so Radix merges
    // role="menuitem" onto the anchor: getByRole('link') misses it (explicit role overrides the
    // implicit one) and getByRole('button') misses it too. Scope by ACCESSIBLE NAME, never by
    // href — the Profile item at nav-user.tsx:79-83 also points at /settings, so an href-based
    // locator matches two elements and trips strict mode.
    await page
      .getByRole('menu')
      .getByRole('menuitem', { name: /settings/i })
      .click()
    await page.waitForURL('**/settings', { timeout: 15_000 })

    // TESTIDS ONLY (D-28.3). The shared name regex /sign out|logout|.../i is FORBIDDEN on this
    // page: it also matches the Data & Privacy "sign out all sessions" control — a strict-mode
    // failure, and worse, it could click the destructive global sign-out.
    await page.getByTestId('settings-signout').click()

    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })
    expect(await readSession(page)).toBeNull()
  })

  test('invalidated session bounces the open tab', async ({ page }) => {
    // Playwright's default TEST timeout is 30 s, which would cut the 45 s waitForURL below
    // short and make a correct implementation fail. The budget must clear one 30 s gotrue
    // auto-refresh tick plus margin (92-VALIDATION.md: "≥45 s budget for the 30 s tick").
    test.setTimeout(90_000)
    await signInInline(page)
    await page.goto('/dashboard')
    await expect(page).not.toHaveURL(/\/login/)

    await page.evaluate((key) => {
      const raw = localStorage.getItem(key)
      if (raw === null) throw new Error(`no supabase session under ${key}`)
      const session = JSON.parse(raw) as { expires_at: number; refresh_token: string }
      // BOTH mutations are required (RESEARCH Pitfall 2): gotrue preserves the session on
      // refresh failure while the access token is still valid, so corrupting only the refresh
      // token does nothing. SIGNED_OUT needs refresh failure AND an expired access token.
      session.expires_at = Math.floor(Date.now() / 1000) - 3600
      session.refresh_token = 'invalid-refresh-token'
      localStorage.setItem(key, JSON.stringify(session))
    }, AUTH_STORAGE_KEY)

    // NO reload anywhere in this test. A reload exercises the beforeLoad guard, which already
    // works and is an explicit non-goal (D-18); this must prove the REACTIVE open-tab path.
    // Budget covers one 30 s gotrue auto-refresh tick plus margin.
    await page.waitForURL('**/login', { timeout: 45_000 })
  })
})
