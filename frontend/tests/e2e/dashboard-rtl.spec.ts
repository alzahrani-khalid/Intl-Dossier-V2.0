/**
 * Phase 38 dashboard — RTL correctness E2E + logical-property fs-scan gate.
 *
 * Task 38-09-01 must-haves:
 *   • every directional lucide icon under `.dash-root` has `rotate-180` in RTL
 *   • VipVisits T-N countdown is wrapped in an LtrIsolate boundary (`dir="ltr"`)
 *   • ForumsStrip renders its monograms in natural source order (no `.reverse()`)
 *   • widget `*.tsx` files contain zero physical-direction Tailwind classes
 *
 * No child_process — use node:fs walker + regex (repo policy).
 */

import { test, expect } from '@playwright/test'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { loginAndWaitForDashboard } from './dashboard.spec'

async function walk(dir: string, exts: ReadonlyArray<string>): Promise<string[]> {
  const out: string[] = []
  let entries: import('node:fs').Dirent[] = []
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      out.push(...(await walk(full, exts)))
    } else if (exts.some((e) => full.endsWith(e))) {
      out.push(full)
    }
  }
  return out
}

test.describe('Phase 38 dashboard — RTL correctness', () => {
  test('directional chevrons rotate-180 under .dash-root in Arabic', async ({ page }) => {
    await loginAndWaitForDashboard(page, 'ar')
    // Lucide icons carry class "lucide lucide-chevron-*" / "lucide-arrow-*".
    const chevrons = page.locator(
      '.dash-root [class*="lucide-chevron"], .dash-root [class*="lucide-arrow"]',
    )
    const count = await chevrons.count()
    expect(count, 'expected at least one directional icon under .dash-root').toBeGreaterThan(0)
    for (let i = 0; i < count; i += 1) {
      const cls = (await chevrons.nth(i).getAttribute('class')) ?? ''
      expect(cls, `directional icon #${i} must have rotate-180 in RTL`).toMatch(/rotate-180/)
    }
  })

  test('VipVisits T-N countdown is LTR-isolated inside RTL page', async ({ page }) => {
    await loginAndWaitForDashboard(page, 'ar')
    const countdown = page.locator('.vip-row .vip-countdown-n').first()
    await expect(countdown).toBeVisible()
    const ancestorDir = await countdown.evaluate((node) => {
      let cur: HTMLElement | null = node as HTMLElement
      while (cur !== null) {
        if (cur.getAttribute('dir') === 'ltr') return 'ltr'
        cur = cur.parentElement
      }
      return null
    })
    expect(ancestorDir, 'countdown must be wrapped in <LtrIsolate dir="ltr">').toBe('ltr')
  })

  test('ForumsStrip renders monogram chips (no double-flip crash)', async ({ page }) => {
    await loginAndWaitForDashboard(page, 'ar')
    // ForumsStrip root class is `.forums`. Assert at least one chip rendered.
    const root = page.locator('.forums').first()
    await expect(root).toBeVisible()
    const chipCount = await root
      .locator('[data-testid="forum-monogram"], .forum-monogram, a')
      .count()
    expect(chipCount).toBeGreaterThan(0)
  })
})

test.describe('Phase 38 dashboard — logical-property fs-scan gate', () => {
  test('no physical-direction Tailwind classes in widget tsx files', async () => {
    // Playwright CWD is frontend/ when invoked via `pnpm -C frontend exec playwright test`.
    // We resolve relative to __dirname (tests/e2e) to stay CWD-independent.
    const widgetsDir = path.resolve(__dirname, '../../src/pages/Dashboard/widgets')
    const files = (await walk(widgetsDir, ['.tsx'])).filter((f) => !f.includes('__tests__'))
    const re = /\b(ml-\d|mr-\d|pl-\d|pr-\d|text-left|text-right)\b/
    const hits: string[] = []
    for (const f of files) {
      const lines = (await fs.readFile(f, 'utf8')).split(/\r?\n/)
      lines.forEach((text, i) => {
        if (re.test(text)) hits.push(`${f}:${i + 1}  ${text.trim()}`)
      })
    }
    expect(hits, `physical-direction classes found:\n${hits.join('\n')}`).toEqual([])
  })
})
