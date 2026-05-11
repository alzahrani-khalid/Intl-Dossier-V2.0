import { test, expect, type Page } from '@playwright/test'

type Direction = 'chancery' | 'situation' | 'ministerial' | 'bureau'
type Locale = 'en' | 'ar'

async function authBypass(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const payload = {
      state: {
        user: { id: 'test-user', email: 'test@example.com', name: 'Test' },
        isAuthenticated: true,
      },
      version: 0,
    }
    localStorage.setItem('auth-storage', JSON.stringify(payload))
  })
}

async function seedDirection(page: Page, dir: Direction): Promise<void> {
  await page.addInitScript((d: Direction): void => {
    localStorage.setItem('id.dir', d)
  }, dir)
}

async function seedLocale(page: Page, loc: Locale): Promise<void> {
  await page.addInitScript((l: Locale): void => {
    // Phase 34 key (read by bootstrap.js + DesignProvider.useLocale)
    localStorage.setItem('id.locale', l)
    // Pre-Phase-34 keys still read by LanguageProvider on mount — without
    // these the provider defaults to 'en' and overrides bootstrap's RTL.
    localStorage.setItem('i18nextLng', l)
    localStorage.setItem('user-preferences', JSON.stringify({ language: l }))
  }, loc)
}

const EXPECTED_DISPLAY: Record<Direction, RegExp> = {
  chancery: /^"?Fraunces"?/,
  situation: /^"?Space Grotesk"?/,
  ministerial: /^"?Public Sans"?/,
  bureau: /^"?Inter"?/,
}

test.describe('Phase 35 — Typography E2E (TYPO-01..04)', () => {
  test('TYPO-02 — zero requests to fonts.googleapis.com or fonts.gstatic.com', async ({ page }) => {
    await authBypass(page)
    await seedLocale(page, 'en')
    await seedDirection(page, 'chancery')
    const requests: string[] = []
    page.on('request', (req) => requests.push(req.url()))
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const leaks = requests.filter((u) => /fonts\.(googleapis|gstatic)\.com/.test(u))
    expect(leaks, `google fonts leak: ${leaks.join(', ')}`).toEqual([])
  })

  for (const dir of ['chancery', 'situation', 'ministerial', 'bureau'] as const) {
    test(`TYPO-01 — ${dir}: getComputedStyle(h1).fontFamily matches expected display font`, async ({
      page,
    }) => {
      await authBypass(page)
      await seedLocale(page, 'en')
      await seedDirection(page, dir)
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      const fontFamily = await page.evaluate(() => {
        const el = document.querySelector('h1, [data-testid="page-title"]')
        return el ? window.getComputedStyle(el).fontFamily : ''
      })
      expect(fontFamily).toMatch(EXPECTED_DISPLAY[dir])
    })
  }

  test('TYPO-03 — html[dir="rtl"] body computes to Tajawal-first cascade', async ({ page }) => {
    await authBypass(page)
    await seedLocale(page, 'ar')
    await seedDirection(page, 'chancery')
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const bodyFamily = await page.evaluate(() => window.getComputedStyle(document.body).fontFamily)
    expect(bodyFamily).toMatch(/^"?Tajawal"?/)
  })

  test('TYPO-04 — [dir="ltr"].mono inside RTL fixture renders JetBrains Mono', async ({ page }) => {
    await page.goto('/tests/e2e/fixtures/typo-04-fixture.html')
    const probeFamily = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="typo04-probe"]')
      return el ? window.getComputedStyle(el).fontFamily : ''
    })
    const kbdFamily = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="typo04-kbd"]')
      return el ? window.getComputedStyle(el).fontFamily : ''
    })
    expect(probeFamily).toMatch(/^"?JetBrains Mono"?/)
    expect(kbdFamily).toMatch(/^"?JetBrains Mono"?/)
  })
})
