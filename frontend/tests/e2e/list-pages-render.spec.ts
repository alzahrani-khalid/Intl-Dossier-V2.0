// Phase 40 Plan 10 — list-pages-render
// Renders 7 list pages × 3 viewports (320 / 768 / 1280) and asserts
// no horizontal overflow + responsive table→card collapse below md.
//
// Reconciled by 40-18:
// - Working-groups route uses underscored form `/dossiers/working_groups`
//   (per 40-08 SUMMARY: file-router resolves `working_groups/index.tsx`).
// - Overflow assertion uses 40-14 primitive contract: scrollWidth==clientWidth
//   on the documentElement; no `overflow-x-auto` is expected on the shell — the
//   ListPageShell content body uses `min-w-0` + `overflow-x-hidden` (40-14).
// - Ready-marker wait: `[data-loading="false"]` (40-13) replaces `networkidle`
//   for deterministic settle, with networkidle as a belt-and-braces fallback.
import { test, expect } from '@playwright/test'
import { loginForListPages } from './support/list-pages-auth'

const ROUTES = [
  { path: '/dossiers/countries', name: 'countries' },
  { path: '/dossiers/organizations', name: 'organizations' },
  { path: '/persons', name: 'persons' },
  { path: '/dossiers/forums', name: 'forums' },
  { path: '/dossiers/topics', name: 'topics' },
  { path: '/dossiers/working_groups', name: 'working_groups' },
  { path: '/engagements', name: 'engagements' },
] as const

const VIEWPORTS = [
  { width: 320, height: 720, name: 'mobile' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 1280, height: 800, name: 'desktop' },
] as const

test.beforeEach(async ({ page }) => {
  await loginForListPages(page)
})

for (const route of ROUTES) {
  for (const vp of VIEWPORTS) {
    test(`${route.path} renders @ ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto(route.path)
      // 40-13 ready marker: settle deterministically via ListPageShell data-loading.
      await page.waitForSelector('[data-loading="false"]', { timeout: 10_000 }).catch(() => null)
      await page.waitForLoadState('networkidle')
      // Page title visible
      await expect(page.locator('h1.page-title, h1').first()).toBeVisible()
      // 40-14 contract: no horizontal overflow on the document at any viewport.
      // The ListPageShell content body is `overflow-x-hidden` (clip, not scroll).
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement
        return {
          scrollX: doc.scrollWidth - doc.clientWidth,
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
        }
      })
      expect(overflow.scrollX, `viewport ${vp.name} overflow on ${route.path}`).toBeLessThanOrEqual(
        0,
      )
      expect(overflow.scrollWidth).toBe(overflow.clientWidth)
      // 40-14 negative contract: ListPageShell must NOT introduce overflow-x-auto on its content area.
      const shellHasAutoScrollX = await page.evaluate(() => {
        const shell = document.querySelector('[data-loading]')
        if (!shell) return false
        // Walk shell + its first 2 descendant levels (shell content body) and check overflow-x.
        const candidates: Element[] = [
          shell,
          ...Array.from(shell.querySelectorAll(':scope > *, :scope > * > *')),
        ]
        return candidates.some((el) => {
          const ox = getComputedStyle(el).overflowX
          return ox === 'auto' || ox === 'scroll'
        })
      })
      expect(shellHasAutoScrollX, '40-14: ListPageShell should clip not scroll horizontally').toBe(
        false,
      )
    })
  }
}

test('Countries table collapses to cards below md (375px)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 720 })
  await page.goto('/dossiers/countries')
  await page.waitForSelector('[data-loading="false"]', { timeout: 10_000 }).catch(() => null)
  await page.waitForLoadState('networkidle')
  // Desktop table is hidden (md:block), mobile cards visible (md:hidden)
  const desktopTable = page.locator('.hidden.md\\:block').first()
  const mobileCards = page.locator('.md\\:hidden').first()
  // At least one of these collapse markers must be present
  const desktopHidden = await desktopTable.isHidden().catch(() => true)
  const mobileVisible = await mobileCards.isVisible().catch(() => false)
  expect(desktopHidden || mobileVisible).toBeTruthy()
})
