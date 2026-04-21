import { test } from '@playwright/test'

test.describe('/themes redirect (THEME-04)', () => {
  test.skip('navigating to /themes redirects to / without rendering legacy page', async () => {
    // TODO Plan 07: assert page.url() ends with "/" after page.goto('/themes')
    // and that no Themes.tsx DOM (e.g. [data-testid="themes-page"]) appears.
  })
  test.skip('T-34-04: redirect target is / (no /themes loop)', async () => {
    // TODO Plan 07: verify single navigation, URL never oscillates.
  })
})
