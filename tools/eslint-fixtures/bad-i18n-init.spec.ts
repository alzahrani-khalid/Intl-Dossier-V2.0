// Phase 57 regression fixture for ESLint no-restricted-syntax rule (D-57-14).
// After Plan 57-03 lands the addInitScript(i18nextLng) ban,
// `pnpm exec eslint -c eslint.config.mjs tools/eslint-fixtures/bad-i18n-init.spec.ts` MUST exit non-zero.
// The fixture deliberately writes the legacy `i18nextLng` localStorage key from inside addInitScript —
// the exact anti-pattern that caused EN vs AR baselines to be byte-identical (Phase 52 D-22).
// See eslint.config.mjs and 57-CONTEXT.md D-57-11 / D-57-14.

import { test } from '@playwright/test'

test('bad: addInitScript writing i18nextLng must trip the ESLint ban', async ({ page }) => {
  await page.addInitScript((d: string) => {
    localStorage.setItem('i18nextLng', d)
  }, 'ar')
})

export {}
