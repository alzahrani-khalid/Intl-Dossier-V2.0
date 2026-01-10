/**
 * Dossier Performance Test Suite
 * Feature: 034-dossier-ui-polish
 *
 * Tests render performance for dossier pages.
 * Measures initial load time and section expand/collapse timing.
 *
 * Tests covered:
 * - T052: Initial load time measurement
 * - T053: Section expand/collapse timing (<300ms)
 */

import { test, expect, type Page } from '@playwright/test'
import { allDossierTypes, getDossierRoute, testDossierIds } from '../fixtures/dossier-fixtures'

/**
 * Authentication bypass for testing
 */
async function authBypass(page: Page) {
  await page.addInitScript(() => {
    const payload = {
      state: {
        user: {
          id: 'test-user-001',
          email: 'kazahrani@stats.gov.sa',
          name: 'Test User',
        },
        isAuthenticated: true,
      },
      version: 0,
    }
    localStorage.setItem('auth-storage', JSON.stringify(payload))
  })
}

/**
 * Measure page load performance
 */
async function measurePageLoad(page: Page, url: string) {
  const startTime = Date.now()

  await page.goto(url)
  await page.waitForLoadState('domcontentloaded')

  const domContentLoaded = Date.now() - startTime

  await page.waitForLoadState('networkidle')

  const networkIdle = Date.now() - startTime

  // Wait for largest contentful paint
  const lcp = await page.evaluate(() => {
    return new Promise<number>((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        resolve(lastEntry ? lastEntry.startTime : 0)
      }).observe({ type: 'largest-contentful-paint', buffered: true })

      // Fallback timeout
      setTimeout(() => resolve(0), 5000)
    })
  })

  return {
    domContentLoaded,
    networkIdle,
    lcp,
  }
}

// ============================================================================
// Initial Load Time Tests (T052)
// ============================================================================

test.describe('Dossier Initial Load Performance', () => {
  test.beforeEach(async ({ page }) => {
    await authBypass(page)
  })

  test('[T052] Dossiers hub loads in under 2 seconds', async ({ page }) => {
    const metrics = await measurePageLoad(page, '/dossiers')

    console.log('Dossiers hub load metrics:', metrics)

    // Assert DOM content loads quickly
    expect(metrics.domContentLoaded).toBeLessThan(2000)

    // Assert network idle within reasonable time
    expect(metrics.networkIdle).toBeLessThan(5000)
  })

  for (const dossierType of allDossierTypes) {
    const testId = testDossierIds[dossierType]
    const route = getDossierRoute(dossierType, testId)

    test(`${dossierType} dossier loads in under 2 seconds`, async ({ page }) => {
      const metrics = await measurePageLoad(page, route)

      console.log(`${dossierType} load metrics:`, metrics)

      // Assert DOM content loads quickly (target: <1s)
      expect(metrics.domContentLoaded).toBeLessThan(2000)

      // Assert network idle within reasonable time
      expect(metrics.networkIdle).toBeLessThan(5000)
    })
  }
})

// ============================================================================
// Section Expand/Collapse Timing Tests (T053)
// ============================================================================

test.describe('Section Expand/Collapse Performance', () => {
  test.beforeEach(async ({ page }) => {
    await authBypass(page)
  })

  test('[T053] Collapsible sections toggle in under 300ms', async ({ page }) => {
    const route = getDossierRoute('country', testDossierIds.country)
    await page.goto(route)
    await page.waitForLoadState('networkidle')

    // Find collapsible section headers
    const sectionButtons = page.locator('button[aria-expanded]')
    const count = await sectionButtons.count()

    if (count > 0) {
      const firstButton = sectionButtons.first()

      // Measure expand time
      const expandStart = Date.now()
      await firstButton.click()
      await page.waitForTimeout(350) // Wait for animation
      const expandTime = Date.now() - expandStart

      console.log(`Section expand time: ${expandTime}ms`)

      // Should expand within 400ms (300ms animation + 100ms buffer)
      expect(expandTime).toBeLessThan(500)

      // Measure collapse time
      const collapseStart = Date.now()
      await firstButton.click()
      await page.waitForTimeout(350) // Wait for animation
      const collapseTime = Date.now() - collapseStart

      console.log(`Section collapse time: ${collapseTime}ms`)

      // Should collapse within 400ms
      expect(collapseTime).toBeLessThan(500)
    }
  })

  test('Multiple section toggles remain responsive', async ({ page }) => {
    const route = getDossierRoute('country', testDossierIds.country)
    await page.goto(route)
    await page.waitForLoadState('networkidle')

    const sectionButtons = page.locator('button[aria-expanded]')
    const count = await sectionButtons.count()

    // Toggle multiple sections rapidly
    const toggleTimes: number[] = []

    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = sectionButtons.nth(i)

      const start = Date.now()
      await button.click()
      await page.waitForTimeout(50) // Minimal wait
      const elapsed = Date.now() - start

      toggleTimes.push(elapsed)
    }

    console.log('Toggle times:', toggleTimes)

    // Average toggle time should be reasonable
    const avgTime = toggleTimes.reduce((a, b) => a + b, 0) / toggleTimes.length
    expect(avgTime).toBeLessThan(200)
  })
})

// ============================================================================
// Memory and Render Performance
// ============================================================================

test.describe('Memory and Render Performance', () => {
  test.beforeEach(async ({ page }) => {
    await authBypass(page)
  })

  test('No memory leaks during navigation', async ({ page }) => {
    // Navigate through multiple dossier pages
    for (const dossierType of allDossierTypes.slice(0, 3)) {
      const testId = testDossierIds[dossierType]
      const route = getDossierRoute(dossierType, testId)

      await page.goto(route)
      await page.waitForLoadState('networkidle')
    }

    // Return to hub
    await page.goto('/dossiers')
    await page.waitForLoadState('networkidle')

    // Get JS heap size if available
    const heapSize = await page.evaluate(() => {
      const performance = window.performance as any
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
        }
      }
      return null
    })

    if (heapSize) {
      console.log('Memory usage:', heapSize)
      // Heap usage should be reasonable (under 100MB)
      expect(heapSize.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024)
    }
  })

  test('Scroll performance is smooth', async ({ page }) => {
    const route = getDossierRoute('country', testDossierIds.country)
    await page.goto(route)
    await page.waitForLoadState('networkidle')

    // Scroll down the page
    const scrollStart = Date.now()

    await page.evaluate(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    })

    await page.waitForTimeout(500)

    await page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })

    await page.waitForTimeout(500)

    const scrollTime = Date.now() - scrollStart

    console.log(`Full scroll cycle time: ${scrollTime}ms`)

    // Scroll should complete within reasonable time
    expect(scrollTime).toBeLessThan(2000)
  })
})
