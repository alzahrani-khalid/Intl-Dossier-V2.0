import { Page, expect } from '@playwright/test'

/**
 * Canonical seeded dossier fixture for Phase 41 drawer specs.
 *
 * UUID matches `v_d_china` in supabase/seed/060-dashboard-demo.sql:
 *   - type='country', sensitivity_level=3 (CONFIDENTIAL chip threshold)
 *   - 3 overdue aa_commitments linked via dossier_id (drawer commitments
 *     section renders rows; D-13 case 10 spec asserts a row click)
 *   - calendar_events seeded for upcoming + activity sections
 *
 * Override via env var when running against an alternate seed (CI replays
 * a frozen snapshot may use a different UUID).
 *
 * PRECONDITION: supabase/seed/060-dashboard-demo.sql must be applied to the
 * local Postgres before running any dossier-drawer spec. If the seed is
 * missing, useDossierOverview('b0000001-...004') returns no rows and the
 * commitments / upcoming / activity sections unmount.
 *
 * To apply: pnpm db:seed (runs supabase/seed/*.sql in order). The seed is
 * idempotent — it deletes any existing b0000001-* rows before re-inserting.
 */
export const FIXTURE_DOSSIER_ID =
  process.env.E2E_DOSSIER_FIXTURE_ID ?? 'b0000001-0000-0000-0000-000000000004'
export const FIXTURE_DOSSIER_TYPE = 'country' as const
export const FIXTURE_DOSSIER_NAME_EN = 'China'
export const FIXTURE_DOSSIER_NAME_AR = 'جمهورية الصين الشعبية'

export async function seedRecentDossierStore(page: Page): Promise<void> {
  await page.addInitScript(
    ([id, type, nameEn, nameAr]) => {
      window.localStorage.setItem(
        'dossier-store',
        JSON.stringify({
          state: {
            recentDossiers: [
              {
                id,
                type,
                name_en: nameEn,
                name_ar: nameAr,
                status: 'active',
                viewedAt: Date.now(),
              },
            ],
            pinnedDossiers: [],
            maxRecentDossiers: 10,
            maxPinnedDossiers: 10,
          },
          version: 0,
        }),
      )
    },
    [FIXTURE_DOSSIER_ID, FIXTURE_DOSSIER_TYPE, FIXTURE_DOSSIER_NAME_EN, FIXTURE_DOSSIER_NAME_AR],
  )
}

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
