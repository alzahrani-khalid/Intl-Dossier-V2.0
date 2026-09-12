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

    // SECURITY (RULING-P99-188): clear the password field before the first assertion that can
    // FAIL. Playwright's failure artifacts — `error-context.md` and the failure screenshot —
    // snapshot the input's VALUE, not a mask, so a failed sign-in writes the E2E account password
    // to disk in cleartext under `test-results/`. Observed once, on 2026-08-25, during a manual
    // scratch invocation of this project; the value then rendered in the reading terminal too.
    //
    // TRIGGER IS NARROW AND IS STATED SO THE FILING SURVIVES A CHECK: gate oracles run
    // `--no-deps`, which SKIPS this setup project entirely, so no gate worktree has ever produced
    // such an artifact — measured, zero across the whole repo. It fires only when someone invokes
    // `--project=setup` directly and the sign-in fails. That is a real defect with a narrow
    // trigger, not an every-run bleed.
    //
    // Clearing here rather than disabling error-context keeps the diagnostic value of the artifact
    // (the page state, the error) while removing the only secret on it.
    await page.locator('#password').fill('')

    await expect(page).toHaveURL(/dashboard|operations|home/, { timeout: 15_000 })

    // Pre-dismiss guided-tour / onboarding overlays so subsequent specs can
    // interact with pages without modal interference. Keys mirror
    // frontend/src/components/guided-tours/{OnboardingTourTrigger,TourContext}.tsx.
    await page.evaluate(() => {
      localStorage.setItem('intl-dossier-onboarding-seen', 'true')
      localStorage.setItem('intl-dossier-onboarding-completed', 'true')
      localStorage.setItem('intl-dossier-tours-enabled', 'false')
      localStorage.setItem(
        'intl-dossier-tours-dismissed',
        JSON.stringify(['onboarding', 'dossier-hub', 'engagement-wizard']),
      )
    })

    const storagePath = path.join('tests/e2e/support/storage', `${role.name}.json`)
    await page.context().storageState({ path: storagePath })
  })
}
