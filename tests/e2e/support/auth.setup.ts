import { test as setup, expect } from '@playwright/test'
import path from 'node:path'

interface RoleCredentials {
  readonly name: 'admin' | 'analyst' | 'intake'
  readonly email: string | undefined
  readonly password: string | undefined
}

const roles: ReadonlyArray<RoleCredentials> = [
  { name: 'admin', email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD },
  { name: 'analyst', email: process.env.E2E_ANALYST_EMAIL, password: process.env.E2E_ANALYST_PASSWORD },
  { name: 'intake', email: process.env.E2E_INTAKE_EMAIL, password: process.env.E2E_INTAKE_PASSWORD },
]

for (const role of roles) {
  setup(`authenticate as ${role.name}`, async ({ page }): Promise<void> => {
    if (typeof role.email !== 'string' || typeof role.password !== 'string') {
      throw new Error(
        `Missing E2E_${role.name.toUpperCase()}_EMAIL or _PASSWORD. See .env.test.example.`,
      )
    }

    await page.goto('/login')
    await page.getByLabel(/email/i).fill(role.email)
    await page.locator('#password').fill(role.password)
    await page.getByRole('button', { name: /sign in|login/i }).click()
    await expect(page).toHaveURL(/dashboard|operations|home/, { timeout: 15_000 })

    const storagePath = path.join('tests/e2e/support/storage', `${role.name}.json`)
    await page.context().storageState({ path: storagePath })
  })
}
