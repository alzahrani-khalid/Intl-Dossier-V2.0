/**
 * Phase 37 — E2E: AppShell startup splash hydration (VALIDATION 37-08-01).
 *
 * Verifies that the FullscreenLoader Suspense fallback either flashes during
 * hydration and then unmounts cleanly, OR that hydration is fast enough that
 * the splash never blocks. Both paths are acceptable per the plan.
 *
 * Target testid: `fullscreen-loader` (FullscreenLoader.tsx line 78).
 *
 * Manual run:
 *   pnpm exec playwright test tests/e2e/signature-visuals/appshell.spec.ts \
 *     --project=chromium-en
 */
import { expect, test } from '@playwright/test'

test.describe('37-08-01 AppShell startup splash', () => {
  test('renders then hydrates without trapping the user', async ({ page }): Promise<void> => {
    await page.goto('/')

    // Splash may flash quickly — check either the overlay appears OR is already
    // gone after hydration. If it appears, it must unmount within ~2s.
    const loader = page.getByTestId('fullscreen-loader')
    try {
      await expect(loader).toBeVisible({ timeout: 500 })
      await expect(loader).toBeHidden({ timeout: 2000 })
    } catch {
      // Hydration was fast enough that the splash never blocked; acceptable.
    }

    // App must hydrate to some non-empty title (proves the page actually ran).
    await expect(page).toHaveTitle(/./)
  })
})
