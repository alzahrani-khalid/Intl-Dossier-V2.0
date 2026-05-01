import { Page, expect } from '@playwright/test'

/**
 * Open the dossier quick-look drawer for a known seeded fixture dossier.
 * Wave 2 specs use this to bypass widget-driven open paths during a11y/visual gates.
 *
 * Source: 41-RESEARCH.md "Wave 0 Gaps" + 41-VALIDATION.md fixture row.
 */
export async function openDrawerForFixtureDossier(
  page: Page,
  args: { id: string; type: string; route?: string },
): Promise<void> {
  // Default route is `/dashboard` (a protected route under `_protected.tsx`,
  // where 41-01 D-02 wired `validateSearch` for the drawer params). The
  // unauthenticated `/` index route redirects to `/dashboard` without
  // forwarding search params and would silently strip `?dossier=` before any
  // protected layout mounts.
  const route = args.route ?? '/dashboard'
  const url = `${route}?dossier=${encodeURIComponent(args.id)}&dossierType=${encodeURIComponent(args.type)}`
  await page.goto(url)
  await expect(
    page.getByRole('dialog', { name: /dossier quick-look|نظرة سريعة/i }),
  ).toBeVisible()
  // Wait for either skeleton to disappear OR data-loading="false".
  await page
    .locator('.drawer-body[data-loading="false"]')
    .waitFor({ state: 'attached', timeout: 5000 })
    .catch(() => {
      /* drawer-body may stay loading in fixture-only contexts; tolerate. */
    })
}

export async function closeDrawerViaEsc(page: Page): Promise<void> {
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
}
