// Phase 76 Plan 03 (RTLB-01 / RTLB-02) — same-frame document+portal flip proof.
//
// Plan 76-01 made ui/direction.tsx DirectionProvider the single runtime dir/lang
// owner: it derives dir from i18n.language, writes <html dir/lang> in a
// useLayoutEffect, and bridges the same value into Radix's direction context in
// the SAME commit. Plan 76-03 dropped the per-wrapper `dir={dir ?? getDocDir()}`
// defaults so every Radix portal inherits that context instead of a render-time
// stale document.dir read.
//
// These cases prove:
//   1. The topbar locale control flips <html> dir+lang in one frame, both ways.
//   2. A portal mounted BEFORE the toggle flips with the document in one frame.
//   3. A portal opened AFTER the toggle is edge-correct in AR (dropdown + Sheet drawer).
//   4. First-load ?lng=ar beats a conflicting seeded id.locale=en (Pitfall 5).
//   5. The DossierShell Export Tooltip portal opens RTL in AR (success criterion 2).
import { test, expect, type Page } from '@playwright/test'
import { loginForListPages } from './support/list-pages-auth'
import { openDrawerForFixtureDossier, FIXTURE_DOSSIER_ID } from './support/dossier-drawer-fixture'

test.describe.configure({ retries: 1 })

const FIXTURE_DETAIL_ROUTE = `/dossiers/countries/${FIXTURE_DOSSIER_ID}`

type FrameRead = { html: string; lang: string; portal: string | null }

/**
 * Fire the topbar locale toggle via a direct DOM `.click()` dispatched inside the
 * page. A real Playwright click would fail actionability while a MODAL Radix
 * portal is open (Radix sets `pointer-events: none` on <body>), and a direct
 * dispatch is NOT an outside-pointerdown, so an already-open portal stays mounted
 * across the toggle — exactly what case 2 needs.
 */
async function toggleLocale(page: Page, lang: 'ar' | 'en'): Promise<void> {
  await page.locator(`[data-lang="${lang}"]`).waitFor({ state: 'attached' })
  await page.evaluate((l: 'ar' | 'en') => {
    const btn = document.querySelector(`[data-lang="${l}"]`) as HTMLElement | null
    btn?.click()
  }, lang)
}

/**
 * Read <html> dir+lang and (optionally) a portal's rendered direction in the SAME
 * animation frame, waiting up to ~30 frames for the owner's useLayoutEffect commit
 * to land. Because DirectionProvider writes the document dir and updates the Radix
 * context in ONE commit, once <html> reaches `expectedDir` the portal has flipped
 * in the same frame — so this single-frame read proves document and portal agree.
 */
async function readFrame(
  page: Page,
  portalSelector: string | null,
  expectedDir: 'rtl' | 'ltr',
): Promise<FrameRead> {
  return page.evaluate(
    ({ sel, exp }): Promise<FrameRead> =>
      new Promise<FrameRead>((resolve) => {
        let frames = 0
        const tick = (): void => {
          const html = document.documentElement.dir
          const lang = document.documentElement.lang
          const el = sel === null ? null : document.querySelector(sel)
          let portal: string | null = null
          if (el !== null) {
            portal = el.getAttribute('dir') ?? getComputedStyle(el as HTMLElement).direction
          }
          if (html === exp || frames > 30) {
            resolve({ html, lang, portal })
          } else {
            frames += 1
            requestAnimationFrame(tick)
          }
        }
        requestAnimationFrame(tick)
      }),
    { sel: portalSelector, exp: expectedDir },
  )
}

test.describe('Direction — same-frame document + Radix portal flip (RTLB-01/02)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
  })

  test('Case 1: topbar toggle flips <html> dir+lang in one frame (EN→AR and AR→EN)', async ({
    page,
  }) => {
    await loginForListPages(page)

    await page.locator('[data-lang="ar"]').click()
    const ar = await readFrame(page, null, 'rtl')
    expect(ar.html).toBe('rtl')
    expect(ar.lang).toBe('ar')

    await page.locator('[data-lang="en"]').click()
    const en = await readFrame(page, null, 'ltr')
    expect(en.html).toBe('ltr')
    expect(en.lang).toBe('en')
  })

  test('Case 2: a dropdown portal open BEFORE the toggle flips with the document in one frame', async ({
    page,
  }) => {
    await loginForListPages(page)
    await page.goto(FIXTURE_DETAIL_ROUTE)

    // Open a fixed Radix wrapper (AddToDossierMenu → ui/dropdown-menu) in EN.
    const trigger = page.locator('[data-slot="dropdown-menu-trigger"]').first()
    await trigger.waitFor({ state: 'visible', timeout: 15_000 })
    await trigger.click()
    await expect(page.locator('[data-slot="dropdown-menu-content"]').first()).toBeVisible()

    // Toggle to AR while the portal stays mounted, then read both in one frame.
    await toggleLocale(page, 'ar')
    const res = await readFrame(page, '[data-slot="dropdown-menu-content"]', 'rtl')
    expect(res.html).toBe('rtl')
    expect(res.portal).toBe('rtl')
  })

  test('Case 3: a portal opened AFTER the toggle is edge-correct in AR (dropdown + Sheet drawer)', async ({
    page,
  }) => {
    await loginForListPages(page, 'ar')
    await page.goto(FIXTURE_DETAIL_ROUTE)

    // Dropdown opened while already in AR must render RTL.
    const trigger = page.locator('[data-slot="dropdown-menu-trigger"]').first()
    await trigger.waitFor({ state: 'visible', timeout: 15_000 })
    await trigger.click()
    const content = page.locator('[data-slot="dropdown-menu-content"]').first()
    await expect(content).toBeVisible()
    const contentDir = await content.evaluate((el) => getComputedStyle(el as HTMLElement).direction)
    expect(contentDir).toBe('rtl')
    await page.keyboard.press('Escape')

    // The Sheet side="right" drawer anchors via inset-inline-end: 0 → under RTL
    // that logical edge resolves to the physical LEFT, so rect.left === 0.
    await openDrawerForFixtureDossier(page, { id: FIXTURE_DOSSIER_ID, type: 'country' })
    await page.evaluate(() => document.fonts.ready)
    const styles = await page.locator('.drawer').evaluate((el) => {
      const computed = getComputedStyle(el as HTMLElement)
      const rect = el.getBoundingClientRect()
      return {
        insetInlineEnd: computed.insetInlineEnd,
        rectLeft: rect.left,
        dir: computed.direction,
      }
    })
    expect(styles.dir).toBe('rtl')
    expect(styles.insetInlineEnd).toBe('0px')
    expect(Math.round(styles.rectLeft)).toBe(0)
  })

  test('Case 4: cold-load ?lng=ar paints RTL despite a seeded id.locale=en (Pitfall 5)', async ({
    page,
  }) => {
    // Seed a CONFLICTING localStorage locale; the querystring detector runs first
    // (frontend/src/i18n/index.ts) so ?lng=ar must win at first paint.
    await page.addInitScript(() => {
      localStorage.setItem('id.locale', 'en')
    })
    await page.goto('/responsive-demo?lng=ar')
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  })

  test('Case 5: DossierShell Export Tooltip portal opens RTL in AR (success criterion 2)', async ({
    page,
  }) => {
    await loginForListPages(page, 'ar')
    await page.goto(FIXTURE_DETAIL_ROUTE)

    // asChild merges data-slot="tooltip-trigger" onto the Export <button>; the
    // connection-indicator trigger wraps a non-focusable <div>, so the button
    // selector picks the Export button. Radix opens tooltips instantly on focus.
    const tooltipTrigger = page.locator('button[data-slot="tooltip-trigger"]').first()
    await tooltipTrigger.waitFor({ state: 'visible', timeout: 15_000 })
    await tooltipTrigger.focus()

    const tooltipContent = page.locator('[data-slot="tooltip-content"]').first()
    await expect(tooltipContent).toBeVisible()
    const dir = await tooltipContent.evaluate((el) => getComputedStyle(el as HTMLElement).direction)
    expect(dir).toBe('rtl')
  })
})
