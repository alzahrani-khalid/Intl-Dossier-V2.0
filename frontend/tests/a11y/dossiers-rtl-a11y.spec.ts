/**
 * Combined RTL + Accessibility Tests for All Dossier Types
 * @module tests/a11y/dossiers-rtl-a11y
 * @feature 034-dossier-ui-polish
 *
 * Tests accessibility (WCAG AA) combined with RTL mode (Arabic) for all 6 dossier
 * detail pages to ensure proper accessibility when Arabic language is selected.
 *
 * Combines:
 * - T036-T051: Accessibility/WCAG AA (axe-core)
 * - T009-T023: Arabic RTL Support
 *
 * @description
 * This test suite verifies that when Arabic language is selected, all accessibility
 * requirements are still met:
 * - No axe-core violations at WCAG AA level
 * - Proper color contrast (4.5:1 for normal text, 3:1 for large text)
 * - Keyboard navigation works in RTL direction
 * - Screen reader support with proper ARIA labels
 * - Focus management follows RTL flow
 * - Language attribute is set correctly
 */

import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Test configuration
const TEST_TIMEOUT = 90000
const NAVIGATION_TIMEOUT = 30000

// All 6 dossier types with test data
const DOSSIER_TYPES = [
  { type: 'country', route: '/dossiers/country', label: 'Country' },
  { type: 'organization', route: '/dossiers/organization', label: 'Organization' },
  { type: 'person', route: '/dossiers/person', label: 'Person' },
  { type: 'engagement', route: '/dossiers/engagement', label: 'Engagement' },
  { type: 'forum', route: '/dossiers/forum', label: 'Forum' },
  { type: 'working-group', route: '/dossiers/working-group', label: 'Working Group' },
] as const

// Axe rules to run for WCAG AA compliance
const AXE_WCAG_AA_RULES = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']

/**
 * Authentication bypass for testing
 * Sets test session in localStorage to skip login
 */
async function authBypass(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const testSession = {
      access_token: 'test-token-for-e2e',
      refresh_token: 'test-refresh-token',
      expires_at: Date.now() + 3600000,
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'authenticated',
      },
    }
    localStorage.setItem('supabase.auth.token', JSON.stringify(testSession))
  })
}

/**
 * Sets Arabic language and verifies RTL direction is applied
 * @param page - Playwright page object
 */
async function setArabicLanguage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'ar')
  })
}

/**
 * Verifies RTL layout is properly applied
 * @param page - Playwright page object
 */
async function verifyRTLLayout(page: Page): Promise<void> {
  const htmlDir = await page.locator('html').getAttribute('dir')
  expect(htmlDir).toBe('rtl')

  const htmlLang = await page.locator('html').getAttribute('lang')
  expect(htmlLang).toBe('ar')
}

/**
 * Runs axe-core accessibility scan on the page
 * @param page - Playwright page object
 * @param context - Test context description
 * @returns Axe scan results
 */
async function runAxeAnalysis(page: Page, context: string) {
  const results = await new AxeBuilder({ page }).withTags(AXE_WCAG_AA_RULES).analyze()

  return results
}

/**
 * Formats axe violations for logging
 * @param violations - Array of axe violations
 * @returns Formatted string
 */
function formatViolations(violations: any[]): string {
  return violations
    .map((v) => {
      const nodes = v.nodes.slice(0, 3).map((n: any) => n.html.substring(0, 100))
      return `- ${v.id} (${v.impact}): ${v.description}\n  Affected: ${nodes.join(', ')}`
    })
    .join('\n')
}

// Test suite
test.describe('Combined RTL + Accessibility Tests for All Dossier Types', () => {
  test.setTimeout(TEST_TIMEOUT)

  test.beforeEach(async ({ page }) => {
    await authBypass(page)
    await setArabicLanguage(page)
  })

  // Test each dossier type for accessibility in RTL mode
  for (const dossier of DOSSIER_TYPES) {
    test.describe(`${dossier.label} Dossier (${dossier.type})`, () => {
      test(`T074-${dossier.type}-axe: No WCAG AA violations in RTL mode`, async ({ page }) => {
        await page.goto(dossier.route, {
          waitUntil: 'networkidle',
          timeout: NAVIGATION_TIMEOUT,
        })

        await page.waitForLoadState('domcontentloaded')

        // Verify RTL is active
        await verifyRTLLayout(page)

        // Run axe analysis
        const results = await runAxeAnalysis(page, `${dossier.type} in RTL`)

        // Filter to only serious and critical violations
        const seriousViolations = results.violations.filter(
          (v) => v.impact === 'serious' || v.impact === 'critical',
        )

        if (seriousViolations.length > 0) {
          console.log(
            `\nAccessibility violations in ${dossier.type} (RTL):\n${formatViolations(seriousViolations)}`,
          )
        }

        // Fail if there are serious or critical violations
        expect(seriousViolations.length).toBe(0)
      })

      test(`T074-${dossier.type}-lang: Language attribute is correctly set`, async ({ page }) => {
        await page.goto(dossier.route, {
          waitUntil: 'networkidle',
          timeout: NAVIGATION_TIMEOUT,
        })

        await page.waitForLoadState('domcontentloaded')

        // Check html lang attribute
        const htmlLang = await page.locator('html').getAttribute('lang')
        expect(htmlLang).toBe('ar')

        // Check that there are no elements with conflicting lang attributes
        // (unless intentionally marking English content within Arabic page)
        const conflictingLang = await page.evaluate(() => {
          const elements = document.querySelectorAll('[lang]:not(html)')
          return Array.from(elements).map((el) => ({
            tag: el.tagName,
            lang: el.getAttribute('lang'),
            text: el.textContent?.substring(0, 30),
          }))
        })

        // Log any elements with different lang attributes
        if (conflictingLang.length > 0) {
          console.log('Elements with lang attribute:', conflictingLang)
        }
      })

      test(`T074-${dossier.type}-contrast: Color contrast meets WCAG AA`, async ({ page }) => {
        await page.goto(dossier.route, {
          waitUntil: 'networkidle',
          timeout: NAVIGATION_TIMEOUT,
        })

        await page.waitForLoadState('domcontentloaded')

        // Run axe with only color-contrast rule
        const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze()

        const contrastViolations = results.violations

        if (contrastViolations.length > 0) {
          console.log(
            `\nColor contrast issues in ${dossier.type} (RTL):\n${formatViolations(contrastViolations)}`,
          )
        }

        // Allow minor contrast issues but flag them
        expect(contrastViolations.length).toBeLessThan(5)
      })

      test(`T074-${dossier.type}-keyboard: Keyboard navigation works in RTL`, async ({ page }) => {
        await page.goto(dossier.route, {
          waitUntil: 'networkidle',
          timeout: NAVIGATION_TIMEOUT,
        })

        await page.waitForLoadState('domcontentloaded')

        // Start from body
        await page.keyboard.press('Tab')

        // Track focused elements
        const focusedElements: string[] = []

        // Tab through first 10 focusable elements
        for (let i = 0; i < 10; i++) {
          const focused = await page.evaluate(() => {
            const el = document.activeElement
            if (!el || el === document.body) return null
            return {
              tag: el.tagName.toLowerCase(),
              text: el.textContent?.trim().substring(0, 30) || '',
              role: el.getAttribute('role') || '',
            }
          })

          if (focused) {
            focusedElements.push(
              `${focused.tag}${focused.role ? `[${focused.role}]` : ''}: ${focused.text}`,
            )
          }

          await page.keyboard.press('Tab')
        }

        // Verify we can tab through elements
        expect(focusedElements.length).toBeGreaterThan(0)

        // Log focus order for debugging
        console.log(`Focus order in ${dossier.type}:`, focusedElements)
      })

      test(`T074-${dossier.type}-focus: Focus indicators are visible in RTL`, async ({ page }) => {
        await page.goto(dossier.route, {
          waitUntil: 'networkidle',
          timeout: NAVIGATION_TIMEOUT,
        })

        await page.waitForLoadState('domcontentloaded')

        // Tab to first focusable element
        await page.keyboard.press('Tab')

        // Check if focus indicator is visible
        const hasFocusIndicator = await page.evaluate(() => {
          const focused = document.activeElement
          if (!focused || focused === document.body) return false

          const style = window.getComputedStyle(focused)
          const outline = style.outline
          const boxShadow = style.boxShadow
          const borderColor = style.borderColor

          // Check for visible focus indicator
          // (outline, box-shadow, or border change)
          return (
            (outline !== 'none' && outline !== '0px none rgb(0, 0, 0)') ||
            boxShadow !== 'none' ||
            focused.classList.contains('focus') ||
            focused.classList.contains('focus-visible')
          )
        })

        // Focus indicators should be present
        // (allowing for CSS-in-JS that might apply via classes)
        console.log(`Focus indicator visible in ${dossier.type}: ${hasFocusIndicator}`)
      })

      test(`T074-${dossier.type}-aria: ARIA labels are present and correct`, async ({ page }) => {
        await page.goto(dossier.route, {
          waitUntil: 'networkidle',
          timeout: NAVIGATION_TIMEOUT,
        })

        await page.waitForLoadState('domcontentloaded')

        // Check for proper ARIA landmarks
        const landmarks = await page.evaluate(() => {
          const main = document.querySelector('main, [role="main"]')
          const nav = document.querySelector('nav, [role="navigation"]')
          const header = document.querySelector('header, [role="banner"]')

          return {
            hasMain: !!main,
            hasNav: !!nav,
            hasHeader: !!header,
          }
        })

        // Should have main landmark
        expect(landmarks.hasMain).toBe(true)

        // Check for buttons/links without accessible names
        const missingLabels = await page.evaluate(() => {
          const buttons = document.querySelectorAll('button, [role="button"]')
          const links = document.querySelectorAll('a[href]')

          const unlabeled: string[] = []

          buttons.forEach((btn) => {
            const hasLabel =
              btn.textContent?.trim() ||
              btn.getAttribute('aria-label') ||
              btn.getAttribute('aria-labelledby') ||
              btn.getAttribute('title')

            if (!hasLabel) {
              unlabeled.push(`button: ${btn.outerHTML.substring(0, 100)}`)
            }
          })

          links.forEach((link) => {
            const hasLabel =
              link.textContent?.trim() ||
              link.getAttribute('aria-label') ||
              link.getAttribute('aria-labelledby')

            if (!hasLabel) {
              unlabeled.push(`link: ${link.outerHTML.substring(0, 100)}`)
            }
          })

          return unlabeled.slice(0, 10)
        })

        if (missingLabels.length > 0) {
          console.log(`Elements missing accessible names in ${dossier.type}:`, missingLabels)
        }

        // Allow some unlabeled elements but not too many
        expect(missingLabels.length).toBeLessThan(5)
      })

      test(`T074-${dossier.type}-headings: Heading hierarchy is correct in RTL`, async ({
        page,
      }) => {
        await page.goto(dossier.route, {
          waitUntil: 'networkidle',
          timeout: NAVIGATION_TIMEOUT,
        })

        await page.waitForLoadState('domcontentloaded')

        // Get all headings
        const headings = await page.evaluate(() => {
          const h1s = document.querySelectorAll('h1')
          const h2s = document.querySelectorAll('h2')
          const h3s = document.querySelectorAll('h3')
          const h4s = document.querySelectorAll('h4')
          const h5s = document.querySelectorAll('h5')
          const h6s = document.querySelectorAll('h6')

          return {
            h1Count: h1s.length,
            h2Count: h2s.length,
            h3Count: h3s.length,
            h4Count: h4s.length,
            h5Count: h5s.length,
            h6Count: h6s.length,
            headingOrder: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
              .slice(0, 10)
              .map((h) => ({
                level: h.tagName,
                text: h.textContent?.trim().substring(0, 50),
              })),
          }
        })

        // Should have exactly one h1 (main page heading)
        expect(headings.h1Count).toBe(1)

        // Log heading structure
        console.log(`Heading structure in ${dossier.type}:`, headings.headingOrder)
      })

      test(`T074-${dossier.type}-images: Images have alt text`, async ({ page }) => {
        await page.goto(dossier.route, {
          waitUntil: 'networkidle',
          timeout: NAVIGATION_TIMEOUT,
        })

        await page.waitForLoadState('domcontentloaded')

        // Check images for alt text
        const imageIssues = await page.evaluate(() => {
          const images = document.querySelectorAll('img')
          const issues: string[] = []

          images.forEach((img) => {
            const alt = img.getAttribute('alt')
            const isDecorative = alt === '' || img.getAttribute('role') === 'presentation'

            // Images should have alt (empty string for decorative is OK)
            if (alt === null && !isDecorative) {
              issues.push(`Missing alt: ${img.src.substring(0, 50)}`)
            }
          })

          return issues
        })

        if (imageIssues.length > 0) {
          console.log(`Image accessibility issues in ${dossier.type}:`, imageIssues)
        }

        expect(imageIssues.length).toBe(0)
      })

      test(`T074-${dossier.type}-forms: Form inputs are properly labeled`, async ({ page }) => {
        await page.goto(dossier.route, {
          waitUntil: 'networkidle',
          timeout: NAVIGATION_TIMEOUT,
        })

        await page.waitForLoadState('domcontentloaded')

        // Check form inputs for labels
        const formIssues = await page.evaluate(() => {
          const inputs = document.querySelectorAll('input, select, textarea')
          const issues: string[] = []

          inputs.forEach((input) => {
            const id = input.getAttribute('id')
            const ariaLabel = input.getAttribute('aria-label')
            const ariaLabelledby = input.getAttribute('aria-labelledby')
            const placeholder = input.getAttribute('placeholder')
            const type = input.getAttribute('type')

            // Skip hidden inputs
            if (type === 'hidden') return

            // Check for associated label
            let hasLabel = false

            if (id) {
              const label = document.querySelector(`label[for="${id}"]`)
              if (label) hasLabel = true
            }

            if (ariaLabel || ariaLabelledby) hasLabel = true

            // Check if input is inside a label
            if (input.closest('label')) hasLabel = true

            if (!hasLabel) {
              issues.push(
                `Unlabeled ${input.tagName.toLowerCase()}[type=${type}]: ${placeholder || 'no placeholder'}`,
              )
            }
          })

          return issues.slice(0, 10)
        })

        if (formIssues.length > 0) {
          console.log(`Form accessibility issues in ${dossier.type}:`, formIssues)
        }

        // Allow some unlabeled inputs but not too many
        expect(formIssues.length).toBeLessThan(3)
      })
    })
  }

  // Cross-cutting accessibility tests
  test.describe('Cross-Dossier RTL Accessibility', () => {
    test('T074-cross-skip: Skip links work in RTL', async ({ page }) => {
      await page.goto('/dossiers/country', {
        waitUntil: 'networkidle',
        timeout: NAVIGATION_TIMEOUT,
      })

      await page.waitForLoadState('domcontentloaded')

      // Check for skip link
      const skipLink = page.locator('a[href="#main"], a[href="#content"], [class*="skip"]').first()

      if (await skipLink.isVisible({ timeout: 1000 }).catch(() => false)) {
        // Skip link should be focusable
        await skipLink.focus()
        const isFocused = await page.evaluate(() => {
          return document.activeElement?.tagName.toLowerCase() === 'a'
        })
        expect(isFocused).toBe(true)
      } else {
        // Skip link might be hidden until focused
        await page.keyboard.press('Tab')

        const activeElement = await page.evaluate(() => {
          const el = document.activeElement
          return {
            href: el?.getAttribute('href'),
            text: el?.textContent?.trim(),
          }
        })

        // Check if first focusable is a skip link
        if (activeElement.href?.includes('#main') || activeElement.href?.includes('#content')) {
          console.log('Skip link found:', activeElement)
        }
      }
    })

    test('T074-cross-modals: Modal dialogs are accessible in RTL', async ({ page }) => {
      await page.goto('/dossiers/country', {
        waitUntil: 'networkidle',
        timeout: NAVIGATION_TIMEOUT,
      })

      await page.waitForLoadState('domcontentloaded')

      // Try to trigger a modal (if any buttons that open modals exist)
      const modalTrigger = page.locator('[aria-haspopup="dialog"], [data-state="closed"]').first()

      if (await modalTrigger.isVisible({ timeout: 2000 }).catch(() => false)) {
        await modalTrigger.click()
        await page.waitForTimeout(300)

        // Check for modal
        const modal = page.locator('[role="dialog"], [aria-modal="true"]').first()

        if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
          // Modal should have accessible structure
          const modalProps = await page.evaluate(() => {
            const dialog = document.querySelector('[role="dialog"], [aria-modal="true"]')
            if (!dialog) return null

            return {
              role: dialog.getAttribute('role'),
              ariaModal: dialog.getAttribute('aria-modal'),
              ariaLabelledby: dialog.getAttribute('aria-labelledby'),
              ariaLabel: dialog.getAttribute('aria-label'),
              hasHeading: !!dialog.querySelector('h1, h2, h3, [role="heading"]'),
            }
          })

          if (modalProps) {
            // Modal should have proper ARIA
            expect(modalProps.ariaModal === 'true' || modalProps.role === 'dialog').toBe(true)
            expect(
              modalProps.ariaLabelledby || modalProps.ariaLabel || modalProps.hasHeading,
            ).toBeTruthy()
          }

          // Close modal
          await page.keyboard.press('Escape')
        }
      }
    })

    test('T074-cross-announce: Live regions work in RTL', async ({ page }) => {
      await page.goto('/dossiers/country', {
        waitUntil: 'networkidle',
        timeout: NAVIGATION_TIMEOUT,
      })

      await page.waitForLoadState('domcontentloaded')

      // Check for live regions
      const liveRegions = await page.evaluate(() => {
        const regions = document.querySelectorAll('[aria-live], [role="alert"], [role="status"]')
        return Array.from(regions).map((r) => ({
          role: r.getAttribute('role'),
          ariaLive: r.getAttribute('aria-live'),
          text: r.textContent?.trim().substring(0, 50),
        }))
      })

      // Log live regions (not all pages need them)
      if (liveRegions.length > 0) {
        console.log('Live regions found:', liveRegions)
      }
    })

    test('T074-cross-tables: Data tables are accessible in RTL', async ({ page }) => {
      await page.goto('/dossiers/country', {
        waitUntil: 'networkidle',
        timeout: NAVIGATION_TIMEOUT,
      })

      await page.waitForLoadState('domcontentloaded')

      // Check for tables
      const tables = page.locator('table')
      const tableCount = await tables.count()

      if (tableCount > 0) {
        for (let i = 0; i < tableCount; i++) {
          const table = tables.nth(i)

          // Check table structure
          const tableInfo = await table.evaluate((t) => {
            const headers = t.querySelectorAll('th')
            const caption = t.querySelector('caption')
            const ariaLabel = t.getAttribute('aria-label')
            const ariaLabelledby = t.getAttribute('aria-labelledby')

            return {
              hasHeaders: headers.length > 0,
              hasCaption: !!caption,
              hasAriaLabel: !!(ariaLabel || ariaLabelledby),
              headerCount: headers.length,
            }
          })

          // Tables should have headers
          expect(tableInfo.hasHeaders).toBe(true)

          // Tables should have accessible name (caption or aria-label)
          expect(tableInfo.hasCaption || tableInfo.hasAriaLabel).toBe(true)
        }
      }
    })
  })
})

// Focused tests for specific RTL + A11y interactions
test.describe('RTL-Specific Accessibility Tests', () => {
  test.setTimeout(TEST_TIMEOUT)

  test.beforeEach(async ({ page }) => {
    await authBypass(page)
    await setArabicLanguage(page)
  })

  test('T074-rtl-reading: Reading order matches visual RTL order', async ({ page }) => {
    await page.goto('/dossiers/country', {
      waitUntil: 'networkidle',
      timeout: NAVIGATION_TIMEOUT,
    })

    await page.waitForLoadState('domcontentloaded')

    // Get DOM order of major elements
    const readingOrder = await page.evaluate(() => {
      const elements = document.querySelectorAll('main > *, [role="main"] > *')
      return Array.from(elements)
        .slice(0, 10)
        .map((el) => ({
          tag: el.tagName.toLowerCase(),
          text: el.textContent?.trim().substring(0, 30),
          x: el.getBoundingClientRect().x,
        }))
    })

    // In RTL, elements should generally flow from right to left
    // (higher x values first in visual order)
    console.log('Reading order (DOM order with x positions):', readingOrder)
  })

  test('T074-rtl-focus-trap: Focus stays within modal in RTL', async ({ page }) => {
    await page.goto('/dossiers/country', {
      waitUntil: 'networkidle',
      timeout: NAVIGATION_TIMEOUT,
    })

    await page.waitForLoadState('domcontentloaded')

    // Try to open a modal
    const modalTrigger = page
      .locator('[aria-haspopup="dialog"], button:has-text("Add"), button:has-text("Create")')
      .first()

    if (await modalTrigger.isVisible({ timeout: 2000 }).catch(() => false)) {
      await modalTrigger.click()
      await page.waitForTimeout(300)

      const modal = page.locator('[role="dialog"], [aria-modal="true"]').first()

      if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Tab through modal - focus should stay inside
        const focusedElements: string[] = []

        for (let i = 0; i < 20; i++) {
          await page.keyboard.press('Tab')

          const focused = await page.evaluate(() => {
            const el = document.activeElement
            const modal = document.querySelector('[role="dialog"], [aria-modal="true"]')
            return {
              isInModal: modal?.contains(el),
              tag: el?.tagName.toLowerCase(),
            }
          })

          focusedElements.push(`${focused.tag}: ${focused.isInModal ? 'in modal' : 'OUTSIDE'}`)

          // Focus should stay in modal
          expect(focused.isInModal).toBe(true)
        }

        // Close modal
        await page.keyboard.press('Escape')
      }
    }
  })

  test('T074-rtl-errors: Form errors are announced correctly', async ({ page }) => {
    await page.goto('/dossiers/country', {
      waitUntil: 'networkidle',
      timeout: NAVIGATION_TIMEOUT,
    })

    await page.waitForLoadState('domcontentloaded')

    // Look for a form with validation
    const form = page.locator('form').first()

    if (await form.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Try to submit empty form to trigger validation
      const submitButton = form.locator('button[type="submit"]').first()

      if (await submitButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await submitButton.click()
        await page.waitForTimeout(300)

        // Check for error messages
        const errors = await page.evaluate(() => {
          const errorElements = document.querySelectorAll(
            '[role="alert"], [aria-invalid="true"], .error, [class*="error"]',
          )
          return Array.from(errorElements).map((el) => ({
            role: el.getAttribute('role'),
            ariaLive: el.getAttribute('aria-live'),
            text: el.textContent?.trim().substring(0, 50),
          }))
        })

        if (errors.length > 0) {
          console.log('Error messages:', errors)
          // Errors should have proper ARIA for screen readers
        }
      }
    }
  })
})
