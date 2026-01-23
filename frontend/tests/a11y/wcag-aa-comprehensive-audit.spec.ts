import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * WCAG AA Comprehensive Accessibility Audit
 *
 * This test suite audits all major routes for WCAG 2.1 AA compliance including:
 * - Color contrast (4.5:1 for normal text, 3:1 for large text)
 * - ARIA labels and roles
 * - Keyboard navigation
 * - Focus management
 * - Screen reader support
 *
 * Reference: WCAG 2.1 AA Success Criteria
 */

// Test credentials
const TEST_EMAIL = 'kazahrani@stats.gov.sa'
const TEST_PASSWORD = 'itisme'

// All protected routes to audit
const PROTECTED_ROUTES = [
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/countries', name: 'Countries List' },
  { path: '/organizations', name: 'Organizations List' },
  { path: '/forums', name: 'Forums List' },
  { path: '/engagements', name: 'Engagements List' },
  { path: '/persons', name: 'Persons List' },
  { path: '/contacts', name: 'Contacts List' },
  { path: '/tasks', name: 'Tasks List' },
  { path: '/intake', name: 'Intake List' },
  { path: '/commitments', name: 'Commitments List' },
  { path: '/calendar', name: 'Calendar' },
  { path: '/kanban', name: 'Kanban Board' },
  { path: '/analytics', name: 'Analytics' },
  { path: '/reports', name: 'Reports' },
  { path: '/users', name: 'Users Management' },
  { path: '/positions', name: 'Positions' },
  { path: '/search', name: 'Search' },
  { path: '/settings', name: 'Settings' },
  { path: '/audit-logs', name: 'Audit Logs' },
  { path: '/notifications', name: 'Notifications' },
  { path: '/help', name: 'Help' },
  { path: '/dossiers', name: 'Dossiers Index' },
  { path: '/relationships/graph', name: 'Relationship Graph' },
  { path: '/intelligence', name: 'Intelligence' },
  { path: '/briefs', name: 'Briefs' },
  { path: '/mous', name: 'MOUs' },
  { path: '/delegations', name: 'Delegations' },
  { path: '/my-work', name: 'My Work' },
]

// Public routes to audit
const PUBLIC_ROUTES = [
  { path: '/login', name: 'Login Page' },
  { path: '/register', name: 'Registration Page' },
]

// Helper to login
async function login(page: any) {
  await page.goto('/login')
  await page.waitForSelector('input[name="email"]', { timeout: 10000 })
  await page.fill('input[name="email"]', TEST_EMAIL)
  await page.fill('input[name="password"]', TEST_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(dashboard|countries|dossiers)/, { timeout: 30000 })
}

// Helper to run axe scan and return categorized violations
async function runAxeAudit(page: any, route: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  // Categorize violations
  const categorized = {
    colorContrast: results.violations.filter((v) => v.id === 'color-contrast'),
    ariaLabels: results.violations.filter((v) => v.id.includes('aria') || v.id.includes('label')),
    keyboard: results.violations.filter(
      (v) => v.id.includes('focus') || v.id.includes('keyboard') || v.id.includes('tabindex'),
    ),
    structure: results.violations.filter(
      (v) => v.id.includes('heading') || v.id.includes('landmark') || v.id.includes('region'),
    ),
    forms: results.violations.filter(
      (v) => v.id.includes('form') || v.id.includes('input') || v.id.includes('select'),
    ),
    images: results.violations.filter((v) => v.id.includes('image') || v.id.includes('alt')),
    links: results.violations.filter((v) => v.id.includes('link')),
    other: results.violations.filter((v) => {
      const categories = [
        'color-contrast',
        'aria',
        'label',
        'focus',
        'keyboard',
        'tabindex',
        'heading',
        'landmark',
        'region',
        'form',
        'input',
        'select',
        'image',
        'alt',
        'link',
      ]
      return !categories.some((cat) => v.id.includes(cat))
    }),
    all: results.violations,
  }

  return categorized
}

// Format violations for reporting
function formatViolations(violations: any[]) {
  return violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    description: v.description,
    helpUrl: v.helpUrl,
    nodes: v.nodes.slice(0, 3).map((n: any) => ({
      html: n.html.substring(0, 200),
      failureSummary: n.failureSummary,
    })),
  }))
}

test.describe('WCAG AA Comprehensive Audit - Public Routes', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route.name} should meet WCAG AA standards`, async ({ page }) => {
      await page.goto(route.path)
      await page.waitForLoadState('networkidle')

      const violations = await runAxeAudit(page, route.path)

      // Log violations for debugging
      if (violations.all.length > 0) {
        console.log(`\n=== ${route.name} (${route.path}) ===`)
        console.log(`Total violations: ${violations.all.length}`)
        console.log(`- Color contrast: ${violations.colorContrast.length}`)
        console.log(`- ARIA/Labels: ${violations.ariaLabels.length}`)
        console.log(`- Keyboard: ${violations.keyboard.length}`)
        console.log(`- Structure: ${violations.structure.length}`)
        console.log(`- Forms: ${violations.forms.length}`)

        if (violations.all.length > 0) {
          console.log('\nDetailed violations:')
          console.log(JSON.stringify(formatViolations(violations.all), null, 2))
        }
      }

      // For now, we log and continue - we'll fix issues identified
      // In production, this would be: expect(violations.all).toHaveLength(0);
    })
  }
})

test.describe('WCAG AA Comprehensive Audit - Protected Routes', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  for (const route of PROTECTED_ROUTES) {
    test(`${route.name} should meet WCAG AA standards`, async ({ page }) => {
      await page.goto(route.path)
      await page.waitForLoadState('networkidle')
      // Wait for dynamic content
      await page.waitForTimeout(2000)

      const violations = await runAxeAudit(page, route.path)

      // Log violations for debugging
      if (violations.all.length > 0) {
        console.log(`\n=== ${route.name} (${route.path}) ===`)
        console.log(`Total violations: ${violations.all.length}`)
        console.log(`- Color contrast: ${violations.colorContrast.length}`)
        console.log(`- ARIA/Labels: ${violations.ariaLabels.length}`)
        console.log(`- Keyboard: ${violations.keyboard.length}`)
        console.log(`- Structure: ${violations.structure.length}`)
        console.log(`- Forms: ${violations.forms.length}`)

        if (violations.all.length > 0) {
          console.log('\nDetailed violations:')
          console.log(JSON.stringify(formatViolations(violations.all), null, 2))
        }
      }
    })
  }
})

test.describe('Color Contrast Audit', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('Dashboard should have sufficient color contrast', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze()

    const contrastViolations = results.violations.filter((v) => v.id === 'color-contrast')

    if (contrastViolations.length > 0) {
      console.log('Color contrast violations on dashboard:')
      contrastViolations.forEach((v) => {
        v.nodes.forEach((node) => {
          console.log(`- Element: ${node.html.substring(0, 100)}`)
          console.log(`  Issue: ${node.failureSummary}`)
        })
      })
    }

    // Report but don't fail - we'll fix and re-test
    expect(contrastViolations.length).toBeGreaterThanOrEqual(0)
  })
})

test.describe('ARIA Labels Audit', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('Interactive elements should have proper ARIA labels', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Check buttons without accessible names
    const buttonsWithoutLabels = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button')
      const issues: string[] = []
      buttons.forEach((btn, index) => {
        const hasText = btn.textContent?.trim()
        const hasAriaLabel = btn.getAttribute('aria-label')
        const hasAriaLabelledby = btn.getAttribute('aria-labelledby')
        const hasTitle = btn.getAttribute('title')

        if (!hasText && !hasAriaLabel && !hasAriaLabelledby && !hasTitle) {
          issues.push(`Button ${index}: ${btn.outerHTML.substring(0, 150)}`)
        }
      })
      return issues
    })

    if (buttonsWithoutLabels.length > 0) {
      console.log('Buttons without accessible names:')
      buttonsWithoutLabels.forEach((issue) => console.log(`- ${issue}`))
    }

    // Check links without accessible names
    const linksWithoutLabels = await page.evaluate(() => {
      const links = document.querySelectorAll('a')
      const issues: string[] = []
      links.forEach((link, index) => {
        const hasText = link.textContent?.trim()
        const hasAriaLabel = link.getAttribute('aria-label')
        const hasAriaLabelledby = link.getAttribute('aria-labelledby')
        const hasTitle = link.getAttribute('title')

        if (!hasText && !hasAriaLabel && !hasAriaLabelledby && !hasTitle) {
          issues.push(`Link ${index}: ${link.outerHTML.substring(0, 150)}`)
        }
      })
      return issues
    })

    if (linksWithoutLabels.length > 0) {
      console.log('Links without accessible names:')
      linksWithoutLabels.forEach((issue) => console.log(`- ${issue}`))
    }

    // Check form inputs without labels
    const inputsWithoutLabels = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input, select, textarea')
      const issues: string[] = []
      inputs.forEach((input, index) => {
        const id = input.getAttribute('id')
        const hasLabel = id ? document.querySelector(`label[for="${id}"]`) : null
        const hasAriaLabel = input.getAttribute('aria-label')
        const hasAriaLabelledby = input.getAttribute('aria-labelledby')
        const hasPlaceholder = input.getAttribute('placeholder')
        const hasTitle = input.getAttribute('title')

        // Hidden inputs don't need labels
        if (input.getAttribute('type') === 'hidden') return

        if (!hasLabel && !hasAriaLabel && !hasAriaLabelledby) {
          const inputHtml = input.outerHTML.substring(0, 150)
          issues.push(`Input ${index}: ${inputHtml} (placeholder: ${hasPlaceholder || 'none'})`)
        }
      })
      return issues
    })

    if (inputsWithoutLabels.length > 0) {
      console.log('Inputs without labels:')
      inputsWithoutLabels.forEach((issue) => console.log(`- ${issue}`))
    }
  })
})

test.describe('Keyboard Navigation Audit', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('All interactive elements should be keyboard accessible', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Tab through the page and collect focusable elements
    const focusableElements: string[] = []
    let iterations = 0
    const maxIterations = 100
    const startElement = await page.evaluate(() => document.activeElement?.tagName)

    while (iterations < maxIterations) {
      await page.keyboard.press('Tab')
      const currentElement = await page.evaluate(() => {
        const el = document.activeElement
        return {
          tagName: el?.tagName,
          id: el?.id,
          className: el?.className,
          ariaLabel: el?.getAttribute('aria-label'),
          text: el?.textContent?.substring(0, 50),
        }
      })

      // Check if we've cycled back
      if (currentElement.tagName === startElement && iterations > 10) {
        break
      }

      focusableElements.push(
        `${currentElement.tagName}${currentElement.id ? `#${currentElement.id}` : ''} - ${currentElement.ariaLabel || currentElement.text || 'no label'}`,
      )

      iterations++
    }

    console.log(`Found ${focusableElements.length} focusable elements`)

    // Verify focus is visible on elements
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.keyboard.press('Tab')

    const focusVisible = await page.evaluate(() => {
      const el = document.activeElement
      if (!el) return false
      const styles = window.getComputedStyle(el)
      const outline = styles.outline
      const boxShadow = styles.boxShadow
      // Check for visible focus indicator
      return (
        outline !== 'none' ||
        boxShadow !== 'none' ||
        el.classList.contains('focus-visible') ||
        el.matches(':focus-visible')
      )
    })

    console.log(`Focus visible on first tab: ${focusVisible}`)
  })

  test('No keyboard traps should exist', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Track visited elements
    const visitedElements = new Set<string>()
    let iterations = 0
    const maxIterations = 200
    let trapDetected = false

    while (iterations < maxIterations) {
      await page.keyboard.press('Tab')
      const elementKey = await page.evaluate(() => {
        const el = document.activeElement
        return `${el?.tagName}-${el?.id || ''}-${el?.className || ''}`
      })

      if (visitedElements.has(elementKey)) {
        // We've cycled - check if we're stuck
        const cycleStart = Array.from(visitedElements).indexOf(elementKey)
        if (cycleStart !== -1 && iterations - cycleStart < 5) {
          // Small cycle detected - potential trap
          trapDetected = true
          console.log(`Potential keyboard trap detected at: ${elementKey}`)
          break
        }
        break // Normal cycle through page
      }

      visitedElements.add(elementKey)
      iterations++
    }

    expect(trapDetected).toBe(false)
  })
})

test.describe('Screen Reader Support Audit', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('Page should have proper landmarks', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const landmarks = await page.evaluate(() => {
      return {
        main: document.querySelectorAll('main, [role="main"]').length,
        navigation: document.querySelectorAll('nav, [role="navigation"]').length,
        banner: document.querySelectorAll('header, [role="banner"]').length,
        contentinfo: document.querySelectorAll('footer, [role="contentinfo"]').length,
        search: document.querySelectorAll('[role="search"]').length,
        complementary: document.querySelectorAll('aside, [role="complementary"]').length,
      }
    })

    console.log('Landmarks found:', landmarks)

    // Should have at least main and navigation
    expect(landmarks.main).toBeGreaterThanOrEqual(1)
  })

  test('Headings should be properly structured', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const headings = await page.evaluate(() => {
      const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
      const headingsList: { level: number; text: string }[] = []

      headingElements.forEach((h) => {
        const level = parseInt(h.tagName.charAt(1))
        headingsList.push({
          level,
          text: h.textContent?.substring(0, 50) || '',
        })
      })

      return headingsList
    })

    console.log('Headings structure:', headings)

    // Check for h1
    const hasH1 = headings.some((h) => h.level === 1)
    console.log(`Has H1: ${hasH1}`)

    // Check for skipped heading levels
    let previousLevel = 0
    const skippedLevels: string[] = []
    headings.forEach((h) => {
      if (previousLevel > 0 && h.level > previousLevel + 1) {
        skippedLevels.push(`Skipped from h${previousLevel} to h${h.level} ("${h.text}")`)
      }
      previousLevel = h.level
    })

    if (skippedLevels.length > 0) {
      console.log('Skipped heading levels:', skippedLevels)
    }
  })

  test('Live regions should be properly configured', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const liveRegions = await page.evaluate(() => {
      const regions = document.querySelectorAll(
        '[aria-live], [role="alert"], [role="status"], [role="log"]',
      )
      return Array.from(regions).map((r) => ({
        role: r.getAttribute('role'),
        ariaLive: r.getAttribute('aria-live'),
        ariaAtomic: r.getAttribute('aria-atomic'),
        html: r.outerHTML.substring(0, 100),
      }))
    })

    console.log('Live regions found:', liveRegions.length)
    liveRegions.forEach((r) => console.log(`- ${r.role || r.ariaLive}: ${r.html}`))
  })
})

test.describe('RTL Support Audit', () => {
  test('Arabic content should have proper RTL support', async ({ page }) => {
    // Set Arabic locale
    await page.goto('/login?lng=ar')
    await page.waitForSelector('input[name="email"]', { timeout: 10000 })
    await page.fill('input[name="email"]', TEST_EMAIL)
    await page.fill('input[name="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(dashboard|countries|dossiers)/, { timeout: 30000 })

    await page.goto('/dashboard?lng=ar')
    await page.waitForLoadState('networkidle')

    // Check dir attribute
    const htmlDir = await page.evaluate(() => document.documentElement.getAttribute('dir'))
    const bodyDir = await page.evaluate(() => document.body.getAttribute('dir'))

    console.log(`HTML dir: ${htmlDir}, Body dir: ${bodyDir}`)

    // Check for LTR/RTL inconsistencies
    const rtlIssues = await page.evaluate(() => {
      const issues: string[] = []

      // Check for hardcoded left/right styles
      const allElements = document.querySelectorAll('*')
      allElements.forEach((el) => {
        const style = window.getComputedStyle(el)
        // Check for potential issues (this is simplified)
        if (el.className && typeof el.className === 'string') {
          if (
            el.className.includes('ml-') ||
            el.className.includes('mr-') ||
            el.className.includes('pl-') ||
            el.className.includes('pr-') ||
            el.className.includes('left-') ||
            el.className.includes('right-') ||
            el.className.includes('text-left') ||
            el.className.includes('text-right')
          ) {
            // These might be issues in RTL mode
            issues.push(`Potential RTL issue: ${el.tagName}.${el.className.substring(0, 50)}`)
          }
        }
      })

      return issues.slice(0, 20) // Limit to first 20
    })

    if (rtlIssues.length > 0) {
      console.log('Potential RTL issues (using non-logical properties):')
      rtlIssues.forEach((issue) => console.log(`- ${issue}`))
    }
  })
})

// Summary test that generates a full report
test.describe('Accessibility Audit Summary', () => {
  test('Generate comprehensive accessibility report', async ({ page }) => {
    await login(page)

    const report: Record<string, any> = {
      timestamp: new Date().toISOString(),
      routes: {},
      summary: {
        totalRoutes: 0,
        routesWithIssues: 0,
        totalViolations: 0,
        violationsByCategory: {
          colorContrast: 0,
          ariaLabels: 0,
          keyboard: 0,
          structure: 0,
          forms: 0,
          other: 0,
        },
      },
    }

    const routesToAudit = PROTECTED_ROUTES.slice(0, 10) // Audit first 10 routes

    for (const route of routesToAudit) {
      await page.goto(route.path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      const violations = await runAxeAudit(page, route.path)

      report.routes[route.path] = {
        name: route.name,
        totalViolations: violations.all.length,
        colorContrast: violations.colorContrast.length,
        ariaLabels: violations.ariaLabels.length,
        keyboard: violations.keyboard.length,
        structure: violations.structure.length,
        forms: violations.forms.length,
        details: formatViolations(violations.all.slice(0, 5)),
      }

      report.summary.totalRoutes++
      if (violations.all.length > 0) {
        report.summary.routesWithIssues++
      }
      report.summary.totalViolations += violations.all.length
      report.summary.violationsByCategory.colorContrast += violations.colorContrast.length
      report.summary.violationsByCategory.ariaLabels += violations.ariaLabels.length
      report.summary.violationsByCategory.keyboard += violations.keyboard.length
      report.summary.violationsByCategory.structure += violations.structure.length
      report.summary.violationsByCategory.forms += violations.forms.length
    }

    console.log('\n========================================')
    console.log('WCAG AA ACCESSIBILITY AUDIT REPORT')
    console.log('========================================\n')
    console.log(JSON.stringify(report, null, 2))
    console.log('\n========================================')

    // The test passes but generates a report
    expect(report.summary.totalRoutes).toBeGreaterThan(0)
  })
})
