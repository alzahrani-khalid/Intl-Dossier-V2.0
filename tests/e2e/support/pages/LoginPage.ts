import type { Locator, Page } from '@playwright/test'

export default class LoginPage {
  constructor(public readonly page: Page) {}

  get emailInput(): Locator {
    return this.page.getByLabel(/email|البريد/i)
  }

  /**
   * Scoped by id, not by accessible name: the login form renders a "Show password" toggle
   * whose aria-label also matches /password/i, so `getByLabel` resolves to 2 elements and
   * fails strict mode. `tests/e2e/support/auth.setup.ts:21` already uses `#password` for the
   * same reason; the id is also stable across en/ar, which the name regex is not.
   */
  get passwordInput(): Locator {
    return this.page.locator('#password')
  }

  get submitButton(): Locator {
    return this.page.getByRole('button', { name: /sign in|login|تسجيل الدخول|دخول/i })
  }

  /**
   * The sign-out control. Accepts BOTH roles: the mounted control is a Radix
   * `DropdownMenuItem` (role="menuitem", correct a11y — Slot keeps slotProps.role even
   * under asChild, so there is no component-side fix that is not an a11y regression),
   * while a plain `<button>` remains valid on other surfaces. Widening button →
   * button|menuitem does not weaken the oracle: the test fails while no sign-out
   * control exists anywhere and passes only once one is mounted.
   */
  get signOutButton(): Locator {
    const name = /sign out|logout|تسجيل الخروج|خروج/i
    return this.page.getByRole('button', { name }).or(this.page.getByRole('menuitem', { name }))
  }

  async goto(): Promise<void> {
    await this.page.goto('/login')
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }

  async signOut(): Promise<void> {
    await this.signOutButton.click()
  }

  /** Returns the post-login landing locator so specs can assert on it. */
  dashboardLandmark(): Locator {
    return this.page.getByRole('main')
  }
}
