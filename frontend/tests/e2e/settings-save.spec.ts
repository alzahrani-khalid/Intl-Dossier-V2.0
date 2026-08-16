// @covers WRITE-05
//
// Phase 94 Wave 0 (94-04) — the reload-persistence oracle for /settings Save.
//
// WHAT THIS KILLS. `SettingsPage`'s step-1 users write was `.upsert({ id, … })` with no `email`.
// PostgREST issues an upsert as INSERT … ON CONFLICT, so the NOT NULL check on `users.email` fires
// BEFORE conflict resolution: 23502 on every Save. Two consequences, and this spec observes both:
// nothing the profile/general fields hold ever reached the database, and steps 2-3 of the same
// `mutationFn` — the notification bridge into `notification_category_preferences` — were
// UNREACHABLE rather than broken (94-CONTEXT D-15). Test 2 therefore asserts the bridge's EFFECT,
// not merely that Save stopped erroring.
//
// THE READ-BACK IS A RELOAD, DELIBERATELY. "No error toast" is not a pass — an RLS denial reads as
// an empty 200 and a no-op write can render a success toast. Each test writes, reloads the page,
// and asserts the value came back through the app's own read path.
//
// ---------------------------------------------------------------------------------------------
// POPULATION (94-CONTEXT D-16). WRITE-05's criterion says "every /settings tab saves". That is a
// population, and it is derived and stated here — where the oracle lives — never assumed.
//
// IN — Population A: the nine sections `SettingsPage` renders (profile, general, appearance,
// notifications, email-digest, integrations, accessibility, data-privacy, security), whose form
// fields all flow through the ONE shared `saveMutation`. Test 1 covers the `users`-column half of
// that mutation (step 1); Test 2 covers the category-preference half (step 2). Appearance is
// applied client-side in `onSuccess`; the localStorage-persisted fields are step 3.
//
// OUT, each with its reason:
//   - Population B — the five `/settings` CHILD routes (calendar-sync, email-digest, integrations,
//     notifications, webhooks). `/settings` is a layout route with an <Outlet/>; each child owns a
//     SEPARATE save path against its own RLS-enabled tables and none was part of the filed defect.
//     This is assumption A4, CARRIED — stated as an untested exclusion, not silently trusted.
//   - `/settings/calendar/callback` — no save affordance at all.
//   - security — its MFA write is deliberately absent (`SettingsPage.tsx`, D-6: no enablement
//     without a verified secret), so there is no write to observe.
//   - data-privacy — action buttons, not saved values.
//
// NAMED NON-CONSUMER: `frontend/tests/e2e/settings-page.spec.ts` (Phase 42) asserts the 240+1fr
// layout and the mobile pill nav only. It never exercises Save, so it is not an oracle for this
// criterion and its assertions are not duplicated here.
// ---------------------------------------------------------------------------------------------
//
// AUTHENTICATION: this spec runs under `frontend/playwright.config.ts`, whose `globalSetup` performs
// ONE real login from TEST_USER_EMAIL / TEST_USER_PASSWORD and persists the session. It does not use
// the repo-root config's `setup` project (E2ECRED-01). No credential value is echoed anywhere.
//
// STAGING HYGIENE: both tests edit the TEST_USER's OWN row with a namespaced, plausible value and
// restore the original before finishing. The restore Save is awaited so the write cannot be left
// in flight when the test ends.
import { test, expect, type Page } from '@playwright/test'

// The writes are PostgREST round trips through TanStack Query. A PostgrestError carries no numeric
// `status`, so query-client.ts's 4xx short-circuit cannot fire and a failing arm walks the full
// retry ladder (~7s) — past Playwright's 5s default. This budget is backoff, not flakiness.
const WRITE_TIMEOUT = 15_000

const SAVE_BUTTON = /Save Changes/i
const SAVED_TOAST = 'Settings saved successfully'

/** Open /settings with the locale pinned, and wait for the real form (not the skeleton). */
const gotoSettings = async (page: Page): Promise<void> => {
  await page.goto('/settings?lng=en')
  await expect(page.locator('.settings-layout')).toHaveAttribute('data-loading', 'false', {
    timeout: WRITE_TIMEOUT,
  })
}

/** Click Save and wait for the mutation to actually report success. */
const saveAndAwait = async (page: Page): Promise<void> => {
  await page.getByRole('button', { name: SAVE_BUTTON }).click()
  await expect(page.getByText(SAVED_TOAST)).toBeVisible({ timeout: WRITE_TIMEOUT })
}

test.describe('WRITE-05 /settings Save reaches the database and survives a reload', () => {
  // SERIAL, and not optional. Both tests drive the ONE shared `saveMutation`, whose step 1 writes
  // `full_name` from whatever the form loaded — so under the config's `fullyParallel: true` the
  // toggle test's save (and its restore save) rewrites `full_name` with its own stale copy and
  // clobbers the profile test's write. Observed: parallel → profile test read back the ORIGINAL
  // name after reload; the same test alone → passed. The row is a serial resource; treat it as one.
  test.describe.configure({ mode: 'serial' })

  test('profile save survives reload', async ({ page }) => {
    await gotoSettings(page)

    const nameInput = page.locator('#display_name')
    const original = await nameInput.inputValue()
    // A blank name would make the RESTORE save fail zod's `min(1)`, leaving staging dirty. Assert
    // the fixture row has one rather than inventing a value to restore to.
    expect(original).not.toBe('')

    const stamped = `${original} P94-${Date.now()}`
    await nameInput.fill(stamped)
    await saveAndAwait(page)

    // The reload IS the read-back: the value must come out of `users` through the app's own query.
    await page.reload()
    await expect(page.locator('#display_name')).toHaveValue(stamped, { timeout: WRITE_TIMEOUT })

    // Restore.
    await page.locator('#display_name').fill(original)
    await saveAndAwait(page)
  })

  test('notification toggle survives reload (the D-15 bridge effect)', async ({ page }) => {
    await gotoSettings(page)

    // `Mentions` maps to (category `mentions`, channel `in_app_enabled`) — one distinct cell, so
    // the round trip through applySettingsTogglesToCategoryPrefs is lossless.
    const openNotifications = async (): Promise<void> => {
      await page.getByTestId('settings-nav-notifications').click()
      await expect(page.getByRole('switch', { name: 'Mentions' })).toBeVisible()
    }

    await openNotifications()
    const toggle = page.getByRole('switch', { name: 'Mentions' })
    const before = await toggle.getAttribute('aria-checked')
    const flipped = before === 'true' ? 'false' : 'true'

    await toggle.click()
    await saveAndAwait(page)

    // Reload resets the section to `profile`, so re-open Notifications before reading it back.
    await page.reload()
    await expect(page.locator('.settings-layout')).toHaveAttribute('data-loading', 'false', {
      timeout: WRITE_TIMEOUT,
    })
    await openNotifications()
    await expect(page.getByRole('switch', { name: 'Mentions' })).toHaveAttribute(
      'aria-checked',
      flipped,
      { timeout: WRITE_TIMEOUT },
    )

    // Restore.
    await page.getByRole('switch', { name: 'Mentions' }).click()
    await saveAndAwait(page)
  })
})
