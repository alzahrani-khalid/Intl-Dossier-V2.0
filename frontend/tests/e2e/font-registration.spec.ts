import { test, expect } from '@playwright/test'

/**
 * Plan 77-04 (TOKEN-05) — honest font-registration probe.
 *
 * The retired stack referenced `'Inter'` / `'JetBrains Mono'`, which are NOT the
 * @fontsource-variable registered family names, so the Latin UI silently fell back
 * to system-ui. Linear wires the REGISTERED variable families `'Inter Variable'` /
 * `'JetBrains Mono Variable'`. This spec asserts (via document.fonts) that those
 * families actually resolve in LTR, and that the Tajawal Arabic cascade still wins
 * under dir=rtl (Inter has no Arabic coverage).
 *
 * No snapshots — pure runtime font-availability assertions. Runs under the default
 * `chromium` project (authenticated storageState + auto-started dev server).
 */

test.describe('font registration (TOKEN-05)', () => {
  test('Latin stack resolves Inter Variable + JetBrains Mono Variable in LTR', async ({ page }) => {
    await page.goto('/')

    const result = await page.evaluate(async () => {
      await document.fonts.ready
      // Explicitly trigger loading (a declared variable font is otherwise lazy).
      await Promise.all([
        document.fonts.load("16px 'Inter Variable'"),
        document.fonts.load("16px 'JetBrains Mono Variable'"),
      ])
      return {
        dir: document.documentElement.dir,
        inter: document.fonts.check("16px 'Inter Variable'"),
        mono: document.fonts.check("16px 'JetBrains Mono Variable'"),
        bodyFamily: getComputedStyle(document.body).fontFamily,
      }
    })

    expect(result.dir).toBe('ltr')
    expect(result.inter).toBe(true)
    expect(result.mono).toBe(true)
    expect(result.bodyFamily).toContain('Inter Variable')
  })

  test('Tajawal cascade wins under dir=rtl (?lng=ar)', async ({ page }) => {
    await page.goto('/?lng=ar')
    // i18n's querystring detector flips language at first paint; DirectionProvider
    // then sets <html dir="rtl">. Wait for it to settle before probing fonts.
    await page.waitForFunction(() => document.documentElement.dir === 'rtl', null, {
      timeout: 15_000,
    })

    const result = await page.evaluate(async () => {
      await document.fonts.ready
      await document.fonts.load('16px Tajawal')
      return {
        dir: document.documentElement.dir,
        tajawal: document.fonts.check('16px Tajawal'),
        bodyFamily: getComputedStyle(document.body).fontFamily,
      }
    })

    expect(result.dir).toBe('rtl')
    expect(result.tajawal).toBe(true)
    // The RTL cascade puts Tajawal first: `'Tajawal', 'Inter Variable', …`.
    expect(result.bodyFamily.replace(/["']/g, '').startsWith('Tajawal')).toBe(true)
  })
})
