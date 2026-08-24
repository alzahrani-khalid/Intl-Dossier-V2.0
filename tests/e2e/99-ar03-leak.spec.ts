// @covers AR-03 (UI99-C5..UI99-C11)
//
// Rendered Arabic leak oracle. All ar and en control legs run in chromium-en, select language
// through ?lng=, hydrate with the hoisted settle law, and assert the locale actually reached the
// root element before reading the rendered surface.
import { expect, test, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'
import { expectLocale, settle } from './helpers/settle'
import { seedPositions, teardownPositions } from './fixtures/99-positions-seed.mjs'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

const INTAKE_CAPTURE_FLOOR = 34
const LABEL_SELECTORS = 'button, a, [role="tab"], h1, h2, h3, [data-slot="empty-title"]'
const ARABIC_SCRIPT = /[\u0600-\u06ff]{3,}/
const LATIN_RUN = /[A-Za-z]{3,}/g

const EN_404_STRINGS = [
  'Page not found',
  'The page you are looking for does not exist or has been moved.',
  'Go back',
  'Dashboard',
  'Search',
] as const
const AR_404_FAMILY = [
  'الصفحة غير موجودة',
  'الصفحة التي تبحث عنها غير موجودة أو تم نقلها.',
  'العودة',
  'الذهاب إلى الصفحة الرئيسية',
] as const
const EN_INTAKE_STRINGS = [
  'Review and classify incoming requests',
  'New Request',
  'Pending Triage',
] as const

type RuledStatus = 'under_review' | 'approved' | 'published'
type SeededPositions = Record<RuledStatus, string>

let seededPositions: SeededPositions

/** Sign in inline so --no-deps cannot turn a missing setup-project artifact into a false oracle. */
const signInInline = async (page: Page): Promise<void> => {
  if (email === '' || password === '') {
    throw new Error('TEST_USER_EMAIL / TEST_USER_PASSWORD missing from .env.test')
  }
  const login = new LoginPage(page)
  await login.goto()
  await login.signIn(email, password)
  await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 })
}

const gotoLocale = async (page: Page, path: string, lng: 'en' | 'ar'): Promise<void> => {
  const separator = path.includes('?') ? '&' : '?'
  await page.goto(`${path}${separator}lng=${lng}`)
}

/** The same capture shape whose known-good /my-work/intake population is 34. */
const captureLabels = async (page: Page): Promise<string[]> =>
  page.evaluate((selectors) => {
    const out: string[] = []
    for (const element of Array.from(document.querySelectorAll(selectors))) {
      if (element.closest('th') !== null) continue
      const style = window.getComputedStyle(element)
      if (style.textTransform === 'uppercase') continue
      if (/mono/i.test(style.fontFamily)) continue
      const text = ((element as HTMLElement).innerText ?? '').trim()
      if (text === '' || text.includes('\n')) continue
      out.push(text)
    }
    return out
  }, LABEL_SELECTORS)

const mainText = async (page: Page): Promise<string> =>
  ((await page.getByRole('main').innerText()) ?? '').trim()

/**
 * UI99-C9 allowlist. Each exception is named with the product reason that permits it; additions
 * without a reason are oracle weakening and do not belong here.
 */
const NAMED_LATIN_ALLOWLIST: ReadonlyArray<{
  name: string
  pattern: RegExp
  reason: string
}> = [
  { name: 'GST', pattern: /\bGST\b/g, reason: 'D-30 mandates the canonical Gulf time suffix' },
  { name: 'G20', pattern: /\bG20\b/g, reason: 'the international proper noun remains Latin' },
  {
    name: 'ISO codes',
    pattern: /\b(?:AE|AR|EN|EU|GCC|IMF|ISO|KSA|OECD|SA|UAE|UK|UN|USA|WHO|WTO)\b/g,
    reason: 'standard organization and country codes remain Latin',
  },
  {
    name: 'IntelDossier',
    pattern: /\bIntelDossier\b/g,
    reason: 'the registered product brand mark is not translated',
  },
  {
    name: 'mono T±N SLA tokens',
    pattern: /\b(?:SLA|T(?:\+|-|±)?\d+)\b/g,
    reason: 'the design contract keeps SLA countdown tokens in mono notation',
  },
  {
    name: 'Latin digits',
    pattern: /\d+/g,
    reason: 'D-31 makes Latin digits the deliberate policy in both locales',
  },
]

const unallowlistedLatinRuns = (text: string): string[] => {
  const scrubbed = NAMED_LATIN_ALLOWLIST.reduce(
    (current, entry) => current.replace(entry.pattern, ' '),
    text,
  )
  return scrubbed.match(LATIN_RUN) ?? []
}

const assertPositionBanner = async (page: Page, status: RuledStatus): Promise<void> => {
  await gotoLocale(page, `/positions/${seededPositions[status]}`, 'ar')
  await settle(page)
  await expectLocale(page, 'ar', `/positions/<fixture:${status}>`)

  const banner = page.getByRole('main').locator('p.text-xs.font-bold.text-foreground').first()
  await expect(banner, `UI99-C7 ${status} banner must render from its own fixture`).toBeVisible()
  const text = (await banner.innerText()).trim()

  // Arabic presence makes both absence assertions live rather than satisfiable by a blank banner.
  expect(text, `UI99-C7 ${status} banner must contain Arabic script`).toMatch(ARABIC_SCRIPT)
  expect(text, `UI99-C7 ${status} leaked the hardcoded Read Only literal`).not.toContain(
    'Read Only',
  )
  expect(
    unallowlistedLatinRuns(text),
    `UI99-C7 ${status} banner contains unallowlisted Latin runs`,
  ).toEqual([])
}

test.use({
  viewport: { width: 1400, height: 900 },
  storageState: { cookies: [], origins: [] },
})

test.beforeAll(async () => {
  seededPositions = (await seedPositions()) as SeededPositions
})

test.afterAll(async () => {
  await teardownPositions(seededPositions)
})

test.beforeEach(async ({ page }) => {
  test.setTimeout(700_000)
  await signInInline(page)
})

test('UI99-C5 ar 404', async ({ page }) => {
  await gotoLocale(page, '/definitely-not-a-route-99', 'ar')
  await settle(page)
  await expectLocale(page, 'ar', '/definitely-not-a-route-99')

  const text = await mainText(page)
  for (const expected of AR_404_FAMILY) {
    expect(text, `UI99-C5 Arabic notFound family missing: ${expected}`).toContain(expected)
  }
  // Word-bounded: the message's تبحث contains the substring بحث, so a bare toContain would be
  // vacuously true without the standalone search label (RULING-P99-165 polarity discipline).
  expect(text, 'UI99-C5 Arabic search label missing (word-bounded بحث)').toMatch(/(^|\s)بحث(\s|$)/)
  for (const leaked of EN_404_STRINGS) {
    expect(text, `UI99-C5 leaked English 404 copy: ${leaked}`).not.toContain(leaked)
  }
})

test('UI99-C5 en control 404', async ({ page }) => {
  await gotoLocale(page, '/definitely-not-a-route-99', 'en')
  await settle(page)
  await expectLocale(page, 'en', '/definitely-not-a-route-99')

  const text = await mainText(page)
  expect(text).toMatch(/Page (?:not|Not) [Ff]ound/)
  expect(text).toContain('The page you are looking for does not exist or has been moved.')
  expect(text).toMatch(/Go (?:back|Back)/)
  expect(text, 'UI99-C5 en control must retain an English home destination').toMatch(
    /(?:Dashboard|Go to Home)/,
  )
})

test('UI99-C6 ar intake queue', async ({ page }) => {
  await gotoLocale(page, '/my-work/intake', 'ar')
  await settle(page)
  await expectLocale(page, 'ar', '/my-work/intake')

  const captured = await captureLabels(page)
  const text = await mainText(page)
  expect(
    captured.length,
    'UI99-C6 /my-work/intake capture fell below the committed hydrated floor',
  ).toBeGreaterThanOrEqual(INTAKE_CAPTURE_FLOOR)
  expect(text, 'UI99-C6 Arabic intake surface must contain Arabic script').toMatch(ARABIC_SCRIPT)
  for (const leaked of EN_INTAKE_STRINGS) {
    expect(text, `UI99-C6 leaked English intake copy: ${leaked}`).not.toContain(leaked)
  }
})

test('UI99-C6 en control intake queue', async ({ page }) => {
  await gotoLocale(page, '/my-work/intake', 'en')
  await settle(page)
  await expectLocale(page, 'en', '/my-work/intake')

  const captured = await captureLabels(page)
  const text = await mainText(page)
  expect(
    captured.length,
    'UI99-C6 en control /my-work/intake capture fell below the committed hydrated floor',
  ).toBeGreaterThanOrEqual(INTAKE_CAPTURE_FLOOR)
  for (const expected of EN_INTAKE_STRINGS) {
    expect(text, `UI99-C6 en presence control missing: ${expected}`).toContain(expected)
  }
})

test('UI99-C7 ar banner under_review', async ({ page }) => {
  await assertPositionBanner(page, 'under_review')
})

test('UI99-C7 ar banner approved', async ({ page }) => {
  await assertPositionBanner(page, 'approved')
})

test('UI99-C7 ar banner published', async ({ page }) => {
  await assertPositionBanner(page, 'published')
})

test('UI99-C8 ar search chips', async ({ page }) => {
  await gotoLocale(page, '/search', 'ar')
  await settle(page)
  await expectLocale(page, 'ar', '/search')

  const chips = page.getByRole('main').locator('div.mt-6 button')
  await expect(
    chips.first(),
    'UI99-C8 needs the hydrated empty-search suggestion chips',
  ).toBeVisible()
  const chipTexts = (await chips.allInnerTexts()).map((text) => text.trim())
  expect(chipTexts.length, 'UI99-C8 suggestion-chip population').toBeGreaterThanOrEqual(4)
  expect(chipTexts.join(' '), 'UI99-C8 localized chips must contain Arabic script').toMatch(
    ARABIC_SCRIPT,
  )
  expect(chipTexts, 'G20 is an allowlisted international proper noun').toContain('G20')
  for (const raw of ['Saudi Arabia', 'UN', 'climate']) {
    expect(chipTexts, `UI99-C8 raw suggestion literal survived: ${raw}`).not.toContain(raw)
  }
})

test('UI99-C9 ar latin run scan', async ({ page }) => {
  const routes = [
    '/definitely-not-a-route-99',
    '/my-work/intake',
    '/search',
    '/dashboard',
    '/dossiers',
    '/my-work',
    '/calendar',
  ] as const
  const offenders: string[] = []

  for (const route of routes) {
    await gotoLocale(page, route, 'ar')
    await settle(page)
    await expectLocale(page, 'ar', route)
    const text = await mainText(page)
    expect(text, `UI99-C9 ${route} must contain Arabic script so a zero scan is live`).toMatch(
      ARABIC_SCRIPT,
    )
    const runs = unallowlistedLatinRuns(text)
    if (runs.length > 0) offenders.push(`${route}: ${runs.join(', ')}`)
  }

  expect(offenders, 'UI99-C9 unallowlisted Latin runs by route').toEqual([])
})

test('UI99-C10 ar tajawal', async ({ page }) => {
  await gotoLocale(page, '/dashboard', 'ar')
  await settle(page)
  await expectLocale(page, 'ar', '/dashboard')

  // One browser evaluation samples both required rendered nodes from the same computed-style
  // snapshot: a non-heading text node and a heading inside main.
  const sample = await page.evaluate(() => {
    const main = document.querySelector('main')
    if (!(main instanceof HTMLElement)) return null
    const heading = main.querySelector('h1, h2, h3')
    if (!(heading instanceof HTMLElement)) return null

    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT)
    let textElement: HTMLElement | null = null
    while (walker.nextNode()) {
      const node = walker.currentNode
      const parent = node.parentElement
      if (
        parent instanceof HTMLElement &&
        !heading.contains(parent) &&
        (node.textContent ?? '').trim() !== ''
      ) {
        textElement = parent
        break
      }
    }
    if (textElement === null) return null

    return {
      text: (textElement.innerText || textElement.textContent || '').trim(),
      textFont: window.getComputedStyle(textElement).fontFamily,
      heading: heading.innerText.trim(),
      headingFont: window.getComputedStyle(heading).fontFamily,
    }
  })

  expect(sample, 'UI99-C10 must find a rendered text node and heading in main').not.toBeNull()
  expect(sample?.text, 'UI99-C10 text-node sample must be non-empty').not.toBe('')
  expect(sample?.heading, 'UI99-C10 heading sample must be non-empty').not.toBe('')
  expect(sample?.textFont, 'UI99-C10 Arabic body text computed font').toMatch(/^['"]?Tajawal/i)
  expect(sample?.headingFont, 'UI99-C10 Arabic heading computed font').toMatch(/^['"]?Tajawal/i)
})
