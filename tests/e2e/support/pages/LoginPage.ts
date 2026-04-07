import type { Locator, Page } from '@playwright/test'

export default class LoginPage {
  constructor(public readonly page: Page) {}

  get emailInput(): Locator {
    return this.page.getByLabel(/email/i)
  }

  get passwordInput(): Locator {
    return this.page.getByLabel(/password/i)
  }

  get submitButton(): Locator {
    return this.page.getByRole('button', { name: /sign in|login/i })
  }

  get signOutButton(): Locator {
    return this.page.getByRole('button', { name: /sign out|logout/i })
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
