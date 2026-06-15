import { expect, test, type Page } from '@playwright/test'

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173'
const DOSSIER_DIGEST_PATH =
  process.env.E2E_DIGEST_DOSSIER_PATH ?? '/dossiers/countries/test-dossier/digests'
const DOSSIER_NAME = process.env.E2E_DIGEST_DOSSIER_NAME

function absoluteUrl(path: string): string {
  return new URL(path, BASE_URL).toString()
}

async function useStoredAuthState(page: Page): Promise<void> {
  await page.context().storageState()
}

async function openIntelligenceDigests(page: Page): Promise<void> {
  await page.goto(absoluteUrl('/intelligence'))
  await page.getByRole('button', { name: /^Digests$/i }).click()
  await expect(page.getByRole('heading', { name: /^Digests$/i })).toBeVisible()
}

test.describe('intelligence digests and alerts', () => {
  test.beforeEach(async ({ page }) => {
    await useStoredAuthState(page)
  })

  test('DIGEST-03: subscribe and render a generated digest card', async ({ page }) => {
    await page.goto(absoluteUrl(DOSSIER_DIGEST_PATH))

    await expect(page.getByRole('heading', { name: /^Digests$/i })).toBeVisible()
    await page.getByRole('button', { name: /Subscribe to digest/i }).click()
    await page.getByRole('radio', { name: /^Weekly$/i }).click()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /Subscribe to digest/i })
      .click()
    await expect(page.getByRole('dialog')).toBeHidden()

    await openIntelligenceDigests(page)

    if (DOSSIER_NAME) {
      await expect(page.getByText(DOSSIER_NAME).first()).toBeVisible()
    }

    await page
      .getByRole('button', { name: /Generate now|Generate digest now/i })
      .first()
      .click()
    await expect(page.getByText(/Preview.*not published/i)).toBeVisible()
    await expect(page.getByText(/^Signals$/i).first()).toBeVisible()
    await expect(page.getByText(/^Engagements$/i).first()).toBeVisible()
    await expect(page.getByText(/^Commitments$/i).first()).toBeVisible()

    await page.getByRole('button', { name: /Publish digest/i }).click()
    await expect(page.getByText(/Generated|Published/i).first()).toBeVisible()
  })

  test('DIGEST-03: Digests tab renders without disclosure copy', async ({ page }) => {
    await openIntelligenceDigests(page)

    await expect(page.getByRole('heading', { name: /^Digests$/i })).toBeVisible()
    await expect(page.locator('body')).not.toContainText(/\b(clearance|filtered)\b/i)
  })

  test('ALERT-01: Alerts tab renders alert-rule creation entry point', async ({ page }) => {
    await page.goto(absoluteUrl('/intelligence'))
    await page.getByRole('button', { name: /^Alerts$/i }).click()

    await expect(page.getByRole('heading', { name: /^Alerts$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Add alert/i }).first()).toBeVisible()
  })
})
