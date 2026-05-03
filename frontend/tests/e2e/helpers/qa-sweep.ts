/**
 * Phase 43 — shared QA sweep helpers.
 *
 * Cross-cutting utilities consumed by every Wave 1 sweep spec. Per
 * orchestrator decision Q2 + Phase 38–42 precedent (see
 * `dashboard-a11y.spec.ts`), `runAxe` filters by
 * `impact === 'serious' || impact === 'critical'` rather than
 * zero-on-all-violations — matches the established gate.
 *
 * Breakpoints (D-03): 320 / 640 / 768 / 1024 / 1536. The 1280 baseline
 * stays owned by per-phase visual specs (Phase 38 D-13 / 40 D-06 /
 * 41 D-12 / 42).
 */

import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

import { computeContrastRatio } from './contrast'

export interface Breakpoint {
  readonly width: number
  readonly height: number
  readonly name: string
}

export const BREAKPOINTS: readonly Breakpoint[] = [
  { width: 320, height: 640, name: '320' },
  { width: 640, height: 960, name: '640' },
  { width: 768, height: 1024, name: '768' },
  { width: 1024, height: 768, name: '1024' },
  { width: 1536, height: 960, name: '1536' },
] as const

/**
 * Run axe-core against the page (or a scoped include selector) and assert
 * zero serious/critical violations. Tags match the Phase 38 precedent.
 */
export async function runAxe(page: Page, options?: { include?: string }): Promise<void> {
  let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
  if (options?.include) {
    builder = builder.include(options.include)
  }
  const results = await builder.analyze()
  const blocking = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  )
  expect(
    blocking,
    `serious/critical a11y violations:\n${JSON.stringify(blocking, null, 2)}`,
  ).toEqual([])
}

/**
 * Iterate the canonical responsive breakpoint set, awaiting a small paint
 * settle between viewport changes so reflow-driven assertions read the
 * post-resize layout.
 */
export async function forEachBreakpoint(
  page: Page,
  fn: (bp: Breakpoint) => Promise<void>,
): Promise<void> {
  for (const bp of BREAKPOINTS) {
    await page.setViewportSize({ width: bp.width, height: bp.height })
    await page.waitForTimeout(50)
    await fn(bp)
  }
}

/**
 * Tab-walk every visible interactive on the page and return the count of
 * targets vs the set of focused identities reached. Caller asserts
 * `reached.size === count` for QA-02 reachability.
 *
 * Identity key is `outerHTML.slice(0, 200)` — stable across re-renders
 * within a single sweep, narrow enough to disambiguate primitives.
 */
export async function tabWalkAllInteractives(
  page: Page,
): Promise<{ count: number; reached: Set<string> }> {
  const selector =
    'button:not([disabled]), a[href], input:not([type="hidden"]):not([disabled]), [role="button"]:not([aria-disabled="true"]), [tabindex]:not([tabindex="-1"])'
  const interactives = await page.$$(selector)
  const visibility = await Promise.all(interactives.map((el) => el.isVisible()))
  const visibleCount = visibility.filter(Boolean).length
  const reached = new Set<string>()
  for (let i = 0; i < visibleCount + 1; i++) {
    await page.keyboard.press('Tab')
    const focused = await page.evaluate(
      () => document.activeElement?.outerHTML?.slice(0, 200) ?? '',
    )
    reached.add(focused)
  }
  return { count: visibleCount, reached }
}

/**
 * Focus the target selector and assert its `:focus-visible` outline is
 * (a) non-transparent and (b) contrasts ≥3:1 against its parent
 * background — WCAG 1.4.11. Returns the resolved values for the caller
 * to log/baseline.
 */
export async function assertFocusOutlineVisible(
  page: Page,
  selector: string,
): Promise<{ outlineColor: string; bgColor: string; ratio: number }> {
  await page.locator(selector).first().focus()
  const { outlineColor, bgColor } = await page.evaluate(() => {
    // Read the active element rather than re-querying the selector — guarantees
    // we measure the exact element Playwright just focused, and avoids any
    // selector-syntax mismatch between Playwright locators (which support
    // `:visible`) and `document.querySelector` (which does not).
    const el = document.activeElement as HTMLElement | null
    if (!el || el === document.body) return { outlineColor: '', bgColor: '' }
    const cs = getComputedStyle(el)
    const parent = el.parentElement
    const parentBg = parent ? getComputedStyle(parent).backgroundColor : 'rgb(255, 255, 255)'
    return { outlineColor: cs.outlineColor, bgColor: parentBg }
  })
  expect(
    outlineColor !== 'rgba(0, 0, 0, 0)' && outlineColor !== 'transparent' && outlineColor !== '',
    `focus outline is transparent for ${selector} (got "${outlineColor}")`,
  ).toBe(true)
  const ratio = computeContrastRatio(outlineColor, bgColor)
  expect(
    ratio,
    `focus outline ${outlineColor} fails 3:1 vs background ${bgColor} (ratio=${ratio.toFixed(2)})`,
  ).toBeGreaterThanOrEqual(3.0)
  return { outlineColor, bgColor, ratio }
}

/**
 * Wait for the page to settle: drop any `data-loading="true"` skeletons,
 * await DOM-content-loaded, and absorb the trailing 150 ms of paint
 * activity. Pattern lifted verbatim from RESEARCH §10.
 */
export async function settlePage(page: Page): Promise<void> {
  await page
    .locator('[data-loading="true"]')
    .first()
    .waitFor({ state: 'detached', timeout: 5000 })
    .catch(() => {})
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(150)
}
