import { test } from '@playwright/test'

async function _authBypass(_page: unknown): Promise<void> {
  // TODO Plan 04/06: mirror frontend/tests/e2e/rtl-switching.spec.ts authBypass
}

test.describe('Tweaks drawer focus trap (SC-4)', () => {
  test.skip('LTR: focus trap inside drawer; ESC dismisses; focus returns to trigger', async () => {
    // TODO Plan 04/06: implement
  })
  test.skip('RTL: focus trap inside drawer; ESC dismisses; focus returns to trigger', async () => {
    // TODO Plan 04/06: seed localStorage["id.locale"]="ar" via addInitScript pre-goto
  })
})
