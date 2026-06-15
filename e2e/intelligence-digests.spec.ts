// Wave 0 stub for DIGEST-03 - implemented after frontend ships in wave 4+5.

import { expect, test } from '@playwright/test'

test.skip('DIGEST-03: Digests tab renders published digests', async ({ page }) => {
  await page.goto('/intelligence')
  await expect(page).toHaveURL(/intelligence/)
})
