import { test as base, expect, type Page, type BrowserContext } from '@playwright/test'
import path from 'node:path'
import { cleanupE2eEntities } from './helpers/supabase-admin'
import { e2eId } from './helpers/unique-id'

type Role = 'admin' | 'analyst' | 'intake'

const storageStateFor = (role: Role): string =>
  path.join('tests/e2e/support/storage', `${role}.json`)

const createRolePage = async (
  browser: import('@playwright/test').Browser,
  role: Role,
): Promise<{ context: BrowserContext; page: Page }> => {
  const context = await browser.newContext({ storageState: storageStateFor(role) })
  const page = await context.newPage()
  return { context, page }
}

interface Fixtures {
  adminPage: Page
  analystPage: Page
  intakePage: Page
  uniqueId: (prefix: string) => string
}

/**
 * Extended Playwright test with role-scoped pages and per-test cleanup.
 *
 * Specs should import `test` and `expect` from this module instead of
 * `@playwright/test` directly so fixtures apply uniformly.
 */
export const test = base.extend<Fixtures>({
  adminPage: async ({ browser }, use): Promise<void> => {
    const { context, page } = await createRolePage(browser, 'admin')
    await use(page)
    await context.close()
  },
  analystPage: async ({ browser }, use): Promise<void> => {
    const { context, page } = await createRolePage(browser, 'analyst')
    await use(page)
    await context.close()
  },
  intakePage: async ({ browser }, use): Promise<void> => {
    const { context, page } = await createRolePage(browser, 'intake')
    await use(page)
    await context.close()
  },
  uniqueId: async ({}, use): Promise<void> => {
    await use(e2eId)
  },
})

test.afterEach(async (): Promise<void> => {
  await cleanupE2eEntities('e2e-')
})

export { expect }
