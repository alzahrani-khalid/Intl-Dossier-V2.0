import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { loginForListPages } from './support/list-pages-auth'
import { settlePage, waitForRouteReady } from './helpers/qa-sweep'
import { openDrawerForFixtureDossier, FIXTURE_DOSSIER_ID } from './support/dossier-drawer-fixture'

async function expectNoLabelInNameViolations(page: Page, include: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .include(include)
    .withRules(['label-content-name-mismatch'])
    .analyze()
  expect(results.violations).toEqual([])
}

async function loadProtectedRoute(
  page: Page,
  locale: 'en' | 'ar',
  path: '/dashboard' | '/tasks',
): Promise<void> {
  await loginForListPages(page, locale)
  await page.goto(path)
  await settlePage(page)
  await waitForRouteReady(page)
  await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr')
}

async function loadFixtureDrawer(page: Page, locale: 'en' | 'ar'): Promise<void> {
  await loginForListPages(page, locale)
  await openDrawerForFixtureDossier(page, {
    id: FIXTURE_DOSSIER_ID,
    type: 'country',
  })
  await settlePage(page)
  await waitForRouteReady(page)
  await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr')
  await expect(page.locator('.drawer-body[data-loading="false"]')).toBeAttached()
}

test.describe('Phase 44 - label-in-name anti-pattern closure', () => {
  test('dashboard EN - no label-content-name-mismatch violations', async ({ page }) => {
    await loadProtectedRoute(page, 'en', '/dashboard')
    await expect(page.getByTestId('overdue-commitments-dossier-head').first()).toBeVisible()
    await expectNoLabelInNameViolations(page, '.overdue')
  })

  test('dashboard AR - no label-content-name-mismatch violations', async ({ page }) => {
    await loadProtectedRoute(page, 'ar', '/dashboard')
    await expect(page.getByTestId('overdue-commitments-dossier-head').first()).toBeVisible()
    await expectNoLabelInNameViolations(page, '.overdue')
  })

  test('drawer EN - no label-content-name-mismatch violations', async ({ page }) => {
    await loadFixtureDrawer(page, 'en')
    await expect(page.getByTestId('dossier-drawer-commitments')).toBeVisible()
    await expectNoLabelInNameViolations(page, '.drawer')
  })

  test('drawer AR - no label-content-name-mismatch violations', async ({ page }) => {
    await loadFixtureDrawer(page, 'ar')
    await expect(page.getByTestId('dossier-drawer-commitments')).toBeVisible()
    await expectNoLabelInNameViolations(page, '.drawer')
  })

  test('tasks EN - no label-content-name-mismatch violations', async ({ page }) => {
    await loadProtectedRoute(page, 'en', '/tasks')
    await expect(page.locator('ul.tasks-list')).toBeVisible()
    await expect(page.locator('button.task-box').first()).toBeVisible()
    await expectNoLabelInNameViolations(page, 'main')
  })

  test('tasks AR - no label-content-name-mismatch violations', async ({ page }) => {
    await loadProtectedRoute(page, 'ar', '/tasks')
    await expect(page.locator('ul.tasks-list')).toBeVisible()
    await expect(page.locator('button.task-box').first()).toBeVisible()
    await expectNoLabelInNameViolations(page, 'main')
  })
})
