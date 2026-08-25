// @covers AR-02 (UI99-C1, UI99-C2, UI99-C3, UI99-C4, UI99-C11)
//
// Rendered date oracle. Both locale legs deliberately run in chromium-en and select the app
// language through ?lng=. The browser-locale ar-smoke project is not used: its ar-SA locale can
// manufacture Arabic-Indic digits and would confound the policy this spec is meant to protect.
import { expect, test, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'
import { expectLocale, settle } from './helpers/settle'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

const ARABIC_MONTH =
  /(?:يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر)/
const ENGLISH_DATE_TOKEN =
  /\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December)\b/
const ENGLISH_ABSOLUTE_SHAPE: Readonly<Record<AbsoluteDateSurface, RegExp>> = {
  '/calendar':
    /\b(?:January|February|March|April|May|June|July|August|September|October|November|December) \d{4}\b/,
  '/dossiers': /\b\d{2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}\b/,
  '/events':
    /\b(?:January|February|March|April|May|June|July|August|September|October|November|December) \d{4}\b/,
}
const ARABIC_INDIC_DIGIT = /[٠-٩۰-۹]/
const LATIN_DIGIT_RUN = /\d+/
const ENGLISH_RELATIVE_TOKEN = /\b(?:ago|minutes?|hours?|days?|months?|years?)\b/i

type AbsoluteDateSurface = '/calendar' | '/dossiers' | '/events'

/** Re-authenticate inline; the project storage state still supplies setup's onboarding flags. */
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

/**
 * Radix and the onboarding prompt retain their overlay while an exit animation is running. Wait
 * for that real interaction blocker to leave before clicking the hydrated dossier card. This does
 * not dismiss the overlay or bypass Playwright actionability; if it remains genuinely open, retain
 * the failure and report the state required by RULING-P99-189.
 */
const waitForDialogOverlayExit = async (
  page: Page,
  surface: AbsoluteDateSurface,
  lng: 'en' | 'ar',
): Promise<void> => {
  const overlays = page.locator('.id-dialog-overlay')
  try {
    await expect(
      overlays,
      `${surface} [${lng}] must finish closing its dialog overlay before the dossier card click`,
    ).toHaveCount(0)
  } catch (error) {
    const evidence = await overlays.evaluateAll((elements) =>
      elements.map((node) => {
        const element = node as HTMLElement
        const style = window.getComputedStyle(element)
        const dialog =
          element.querySelector<HTMLElement>('[role="dialog"], .id-dialog-content') ??
          element.parentElement?.querySelector<HTMLElement>('[role="dialog"], .id-dialog-content')
        const dialogStyle = dialog === null ? null : window.getComputedStyle(dialog)
        const overlayState = element.getAttribute('data-state')
        const dialogState = dialog?.getAttribute('data-state') ?? null
        const dialogPhase =
          overlayState === 'closed' || dialogState === 'closed'
            ? 'mid-exit'
            : overlayState === 'open' || dialogState === 'open'
              ? 'open'
              : style.visibility === 'visible' && style.pointerEvents !== 'none'
                ? 'open'
                : 'mid-exit-or-hidden'

        return {
          element: element.outerHTML.slice(0, 500),
          pointerEvents: style.pointerEvents,
          visibility: style.visibility,
          display: style.display,
          opacity: style.opacity,
          overlayState,
          dialogState,
          dialogPhase,
          dialogVisibility: dialogStyle?.visibility ?? null,
          dialogPointerEvents: dialogStyle?.pointerEvents ?? null,
        }
      }),
    )
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(
      [
        `${surface} [${lng}] dialog overlay remained after the synchronization wait.`,
        'Interaction sequence: inline sign-in -> locale navigation -> settle -> locale assertion -> hydrated first card visible -> overlay-exit wait -> dossier card click.',
        `Overlay evidence: ${JSON.stringify(evidence)}`,
        `Original wait failure: ${reason}`,
      ].join('\n'),
    )
  }
}

/**
 * Return a date-bearing rendered region, never the whole shell. Calendar and events always own a
 * month heading. Dossiers expose their absolute updated date inside the first hydrated card's
 * expanded panel; opening it prevents the relative-time badge from satisfying an absolute-date
 * assertion accidentally.
 */
const dateRegionText = async (
  page: Page,
  surface: AbsoluteDateSurface,
  lng: 'en' | 'ar',
): Promise<{ dateText: string; mainText: string }> => {
  await gotoLocale(page, surface, lng)
  await settle(page)
  await expectLocale(page, lng, surface)

  const main = page.getByRole('main')
  if (surface === '/dossiers') {
    const firstCard = main.locator('div.cursor-pointer:has(h1)').first()
    await expect(
      firstCard,
      `${surface} [${lng}] needs a hydrated dossier card to expose its absolute updated date`,
    ).toBeVisible()
    await waitForDialogOverlayExit(page, surface, lng)
    await firstCard.click()
    const expanded = main.locator('div.fixed.inset-0.grid.place-items-center').last()
    await expect(expanded, `${surface} [${lng}] expanded date region`).toBeVisible()
    return {
      dateText: (await expanded.innerText()).trim(),
      mainText: (await main.innerText()).trim(),
    }
  }

  const monthHeading = main.getByRole('heading', { level: 2 }).first()
  await expect(monthHeading, `${surface} [${lng}] month heading`).toBeVisible()
  return {
    dateText: (await monthHeading.innerText()).trim(),
    mainText: (await main.innerText()).trim(),
  }
}

const assertArabicAbsoluteDate = async (
  page: Page,
  surface: AbsoluteDateSurface,
): Promise<void> => {
  const { dateText, mainText } = await dateRegionText(page, surface, 'ar')

  // Positive controls accompany both zero assertions: the same date region contains an Arabic
  // month and Latin digits, so an empty region cannot make either absence check green.
  expect(dateText, `${surface} [ar] date region must contain an Arabic month`).toMatch(ARABIC_MONTH)
  expect(dateText, `${surface} [ar] date region must contain Latin digits`).toMatch(LATIN_DIGIT_RUN)
  expect(dateText, `${surface} [ar] leaked an English weekday or month`).not.toMatch(
    ENGLISH_DATE_TOKEN,
  )
  expect(
    mainText,
    `${surface} [ar] rendered Arabic-Indic digits; UI99-C2 requires Latin`,
  ).not.toMatch(ARABIC_INDIC_DIGIT)
}

const assertEnglishAbsoluteDate = async (
  page: Page,
  surface: AbsoluteDateSurface,
): Promise<void> => {
  const { dateText } = await dateRegionText(page, surface, 'en')
  expect(dateText, `${surface} [en] must retain its byte-shaped English date family`).toMatch(
    ENGLISH_ABSOLUTE_SHAPE[surface],
  )
  expect(dateText, `${surface} [en] date region must retain Latin digits`).toMatch(LATIN_DIGIT_RUN)
}

test.use({ viewport: { width: 1400, height: 900 } })

test.beforeEach(async ({ page }) => {
  test.setTimeout(300_000)
  await signInInline(page)
})

test('UI99-C1C2C4 ar /calendar', async ({ page }) => {
  await assertArabicAbsoluteDate(page, '/calendar')
})

test('UI99-C1C2C4 ar /dossiers', async ({ page }) => {
  await assertArabicAbsoluteDate(page, '/dossiers')
})

test('UI99-C1C2C4 ar /events', async ({ page }) => {
  await assertArabicAbsoluteDate(page, '/events')
})

test('UI99-C1 en control /calendar', async ({ page }) => {
  await assertEnglishAbsoluteDate(page, '/calendar')
})

test('UI99-C1 en control /dossiers', async ({ page }) => {
  await assertEnglishAbsoluteDate(page, '/dossiers')
})

test('UI99-C1 en control /events', async ({ page }) => {
  await assertEnglishAbsoluteDate(page, '/events')
})

test('UI99-C3 ar /activity relative time', async ({ page }) => {
  await gotoLocale(page, '/activity', 'ar')
  await settle(page)
  await expectLocale(page, 'ar', '/activity')

  const relativeCells = page.getByRole('main').locator('.act-t')
  await expect(
    relativeCells.first(),
    '/activity [ar] needs a hydrated relative-time row; an empty feed proves nothing',
  ).toBeVisible()
  const relativeText = (await relativeCells.allInnerTexts()).join(' ')
  expect(relativeText, '/activity [ar] must render the Arabic "منذ <Latin digits>" family').toMatch(
    /منذ\s+\d+/,
  )
  expect(relativeText, '/activity [ar] leaked the English relative-time family').not.toMatch(
    ENGLISH_RELATIVE_TOKEN,
  )
  expect(relativeText, '/activity [ar] relative time must use Latin digits').toMatch(
    LATIN_DIGIT_RUN,
  )
})

test('UI99-C3 en control /activity relative time', async ({ page }) => {
  await gotoLocale(page, '/activity', 'en')
  await settle(page)
  await expectLocale(page, 'en', '/activity')

  const relativeCells = page.getByRole('main').locator('.act-t')
  await expect(
    relativeCells.first(),
    '/activity [en] needs a hydrated relative-time row; an empty feed proves nothing',
  ).toBeVisible()
  const relativeText = (await relativeCells.allInnerTexts()).join(' ')
  expect(relativeText, '/activity [en] must retain the English "ago" family').toMatch(/\bago\b/i)
  expect(relativeText, '/activity [en] relative time must retain Latin digits').toMatch(
    LATIN_DIGIT_RUN,
  )
})
