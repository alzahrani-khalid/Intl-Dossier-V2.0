/**
 * Phase 39 Plan 03 — Activated by 39-03 (was scaffolded as a skipped stub in 39-00).
 *
 * Asserts the BoardToolbar filter pills follow CONTEXT D-06:
 *  - 'By status' is wired and aria-pressed when active
 *  - 'By dossier' and 'By owner' render visually but are aria-disabled with a
 *    'Coming soon' tooltip (no false interactivity).
 *
 * Bilingual regex covers EN + AR (per i18n keys shipped in 39-00).
 *
 * NOTE: A pre-existing ESM `__dirname` bug in `frontend/playwright.config.ts`
 * may block `playwright test --list` until fixed in 39-09. Assertions are
 * authored regardless so the spec runs the moment the runner unblocks.
 */

import { test, expect } from '@playwright/test'

test.describe('Phase 39: Kanban filter pills', () => {
  test('By dossier and By owner pills are aria-disabled with Coming soon tooltip', async ({
    page,
  }) => {
    await page.goto('/kanban')
    await page.waitForLoadState('networkidle')

    const byStatus = page.getByRole('button', { name: /By status|بالحالة/ })
    const byDossier = page.getByRole('button', { name: /By dossier|بالملف/ })
    const byOwner = page.getByRole('button', { name: /By owner|بالمسؤول/ })

    await expect(byStatus).toHaveAttribute('aria-pressed', 'true')
    await expect(byDossier).toHaveAttribute('aria-disabled', 'true')
    await expect(byOwner).toHaveAttribute('aria-disabled', 'true')
    await expect(byDossier).toHaveAttribute('title', /Coming soon|قريبًا/)
    await expect(byOwner).toHaveAttribute('title', /Coming soon|قريبًا/)
  })
})
