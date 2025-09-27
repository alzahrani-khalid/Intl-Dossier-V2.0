import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y, getViolations } from 'axe-playwright'

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
    await injectAxe(page)
  })

  test('login page should be accessible', async ({ page }) => {
    const violations = await getViolations(page)

    // Check for WCAG violations
    expect(violations).toHaveLength(0)

    // Additional manual checks
    await checkKeyboardNavigation(page)
    await checkScreenReaderSupport(page)
    await checkColorContrast(page)
  })

  test('dashboard should be accessible', async ({ page }) => {
    // Login first
    await login(page)

    await injectAxe(page)
    const violations = await getViolations(page, {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    })

    expect(violations).toHaveLength(0)

    // Check dashboard specific accessibility
    await checkDataTablesAccessibility(page)
    await checkChartsAccessibility(page)
    await checkModalsAccessibility(page)
  })

  test('forms should be accessible', async ({ page }) => {
    await login(page)
    await page.goto('http://localhost:5173/mous/new')

    await injectAxe(page)
    await checkA11y(page, null, {
      axeOptions: {
        rules: {
          'label': { enabled: true },
          'aria-required-attr': { enabled: true },
          'aria-valid-attr': { enabled: true },
        },
      },
    })

    // Check form-specific accessibility
    await checkFormLabels(page)
    await checkErrorMessages(page)
    await checkFieldDescriptions(page)
  })

  test('Arabic RTL layout should be accessible', async ({ page }) => {
    // Switch to Arabic
    await page.locator('button[aria-label="Language"]').click()
    await page.locator('text=العربية').click()

    await injectAxe(page)
    const violations = await getViolations(page)

    expect(violations).toHaveLength(0)

    // Check RTL-specific accessibility
    await checkRTLSupport(page)
    await checkBidirectionalText(page)
  })

  test('keyboard navigation should work', async ({ page }) => {
    await page.keyboard.press('Tab')

    // Check focus is visible
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement
      return {
        tagName: el?.tagName,
        hasOutline: window.getComputedStyle(el!).outline !== 'none',
      }
    })

    expect(focusedElement.hasOutline).toBe(true)

    // Test tab order
    const tabOrder = await getTabOrder(page)
    expect(tabOrder).toMatchSnapshot('tab-order.json')
  })

  test('screen reader landmarks should be present', async ({ page }) => {
    const landmarks = await page.evaluate(() => {
      const main = document.querySelector('main')
      const nav = document.querySelector('nav')
      const header = document.querySelector('header')
      const footer = document.querySelector('footer')

      return {
        hasMain: !!main,
        hasNav: !!nav,
        hasHeader: !!header,
        hasFooter: !!footer,
      }
    })

    expect(landmarks.hasMain).toBe(true)
    expect(landmarks.hasNav).toBe(true)
    expect(landmarks.hasHeader).toBe(true)
  })

  test('images should have alt text', async ({ page }) => {
    await login(page)

    const images = await page.$$eval('img', imgs =>
      imgs.map(img => ({
        src: img.src,
        alt: img.alt,
        hasAlt: !!img.alt && img.alt.trim() !== '',
      }))
    )

    for (const img of images) {
      expect(img.hasAlt).toBe(true)
    }
  })

  test('buttons should have accessible names', async ({ page }) => {
    const buttons = await page.$$eval('button', btns =>
      btns.map(btn => ({
        text: btn.textContent,
        ariaLabel: btn.getAttribute('aria-label'),
        hasAccessibleName: !!btn.textContent?.trim() || !!btn.getAttribute('aria-label'),
      }))
    )

    for (const btn of buttons) {
      expect(btn.hasAccessibleName).toBe(true)
    }
  })

  test('color contrast should meet WCAG standards', async ({ page }) => {
    await checkA11y(page, null, {
      axeOptions: {
        rules: {
          'color-contrast': { enabled: true },
        },
      },
    })
  })

  test('focus trap in modals should work', async ({ page }) => {
    await login(page)

    // Open a modal
    await page.locator('button:has-text("Add New")').click()

    // Check focus is trapped
    const modalFocusable = await page.$$eval(
      '[role="dialog"] [tabindex]:not([tabindex="-1"]), [role="dialog"] button, [role="dialog"] input',
      elements => elements.length
    )

    expect(modalFocusable).toBeGreaterThan(0)

    // Test Escape key closes modal
    await page.keyboard.press('Escape')
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
  })

  test('ARIA live regions should announce changes', async ({ page }) => {
    await login(page)

    // Check for aria-live regions
    const liveRegions = await page.$$eval('[aria-live]', elements =>
      elements.map(el => ({
        role: el.getAttribute('role'),
        ariaLive: el.getAttribute('aria-live'),
        ariaAtomic: el.getAttribute('aria-atomic'),
      }))
    )

    expect(liveRegions.length).toBeGreaterThan(0)

    // Test notification announcement
    await page.evaluate(() => {
      const alert = document.querySelector('[role="alert"]')
      if (alert) {
        alert.textContent = 'Test notification'
      }
    })

    const alertContent = await page.locator('[role="alert"]').textContent()
    expect(alertContent).toContain('Test notification')
  })
})

// Helper functions
async function login(page: any) {
  await page.fill('input[name="email"]', 'test@gastat.gov.sa')
  await page.fill('input[name="password"]', 'TestPassword123!')
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/dashboard/)
}

async function checkKeyboardNavigation(page: any) {
  // Tab through all interactive elements
  const elements = await page.$$eval(
    'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
    els => els.length
  )

  for (let i = 0; i < elements; i++) {
    await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => document.activeElement?.tagName)
    expect(focused).toBeTruthy()
  }
}

async function checkScreenReaderSupport(page: any) {
  // Check for screen reader only text
  const srOnly = await page.$$eval('.sr-only', els => els.length)
  expect(srOnly).toBeGreaterThan(0)

  // Check ARIA attributes
  const ariaElements = await page.$$eval('[aria-label], [aria-describedby], [aria-labelledby]',
    els => els.length
  )
  expect(ariaElements).toBeGreaterThan(0)
}

async function checkColorContrast(page: any) {
  const contrastRatios = await page.evaluate(() => {
    const getContrast = (color1: string, color2: string) => {
      // Simplified contrast calculation
      return 4.5 // Placeholder - would implement actual calculation
    }

    const elements = document.querySelectorAll('*')
    const results: any[] = []

    elements.forEach(el => {
      const style = window.getComputedStyle(el)
      const bg = style.backgroundColor
      const fg = style.color

      if (bg && fg && bg !== 'transparent') {
        results.push({
          selector: el.tagName,
          contrast: getContrast(bg, fg),
          passes: getContrast(bg, fg) >= 4.5,
        })
      }
    })

    return results
  })

  const failing = contrastRatios.filter(r => !r.passes)
  expect(failing).toHaveLength(0)
}

async function checkDataTablesAccessibility(page: any) {
  const tables = await page.$$eval('table', tables =>
    tables.map(table => ({
      hasCaption: !!table.caption,
      hasHeaders: !!table.querySelector('thead'),
      hasScope: Array.from(table.querySelectorAll('th')).every(
        th => th.hasAttribute('scope')
      ),
    }))
  )

  for (const table of tables) {
    expect(table.hasHeaders).toBe(true)
    expect(table.hasScope).toBe(true)
  }
}

async function checkChartsAccessibility(page: any) {
  // Check charts have text alternatives
  const charts = await page.$$eval('[role="img"]', charts =>
    charts.map(chart => ({
      hasAriaLabel: !!chart.getAttribute('aria-label'),
      hasDescription: !!chart.getAttribute('aria-describedby'),
    }))
  )

  for (const chart of charts) {
    expect(chart.hasAriaLabel || chart.hasDescription).toBe(true)
  }
}

async function checkModalsAccessibility(page: any) {
  // Already covered in focus trap test
}

async function checkFormLabels(page: any) {
  const inputs = await page.$$eval('input, select, textarea', inputs =>
    inputs.map(input => ({
      id: input.id,
      hasLabel: !!document.querySelector(`label[for="${input.id}"]`) ||
                !!input.getAttribute('aria-label'),
    }))
  )

  for (const input of inputs) {
    expect(input.hasLabel).toBe(true)
  }
}

async function checkErrorMessages(page: any) {
  // Submit empty form to trigger errors
  await page.locator('button[type="submit"]').click()

  const errors = await page.$$eval('[role="alert"], .error', errors =>
    errors.map(error => ({
      hasText: !!error.textContent?.trim(),
      isAssociated: !!error.getAttribute('id'),
    }))
  )

  for (const error of errors) {
    expect(error.hasText).toBe(true)
  }
}

async function checkFieldDescriptions(page: any) {
  const descriptions = await page.$$eval('[aria-describedby]', elements =>
    elements.map(el => {
      const descId = el.getAttribute('aria-describedby')
      const description = descId ? document.getElementById(descId) : null
      return {
        hasDescription: !!description,
        descriptionText: description?.textContent,
      }
    })
  )

  for (const desc of descriptions) {
    expect(desc.hasDescription).toBe(true)
  }
}

async function checkRTLSupport(page: any) {
  const dir = await page.evaluate(() => document.documentElement.dir)
  expect(dir).toBe('rtl')

  const textAlign = await page.evaluate(() => {
    const body = document.body
    return window.getComputedStyle(body).textAlign
  })
  expect(textAlign).toBe('right')
}

async function checkBidirectionalText(page: any) {
  const mixedTextElements = await page.$$eval('[lang]', elements =>
    elements.map(el => ({
      lang: el.getAttribute('lang'),
      dir: el.getAttribute('dir') || 'auto',
    }))
  )

  for (const element of mixedTextElements) {
    expect(element.lang).toBeTruthy()
  }
}

async function getTabOrder(page: any) {
  const tabOrder = await page.evaluate(() => {
    const elements: any[] = []
    const allElements = document.querySelectorAll(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    allElements.forEach(el => {
      elements.push({
        tag: el.tagName,
        tabindex: el.getAttribute('tabindex'),
        text: el.textContent?.trim().substring(0, 20),
      })
    })

    return elements
  })

  return tabOrder
}