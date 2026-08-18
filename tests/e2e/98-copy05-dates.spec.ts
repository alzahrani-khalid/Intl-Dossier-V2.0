// @covers COPY-05 (criterion 5)
//
// Phase 98 — criterion 5 oracle. Cloned from `96-calendar-family.spec.ts`: header discipline,
// inline auth, `--no-deps`, DOM assertions.
//
// THE CRITERION (ROADMAP §Phase 98, criterion 5, as repaired at `7b9d5348f`): one date format.
// The seven competing formats — month-first `Jul 4, 2026`, US slash `4/30/2026`, 12-hour
// `12:37 PM`, `9 months ago` and friends — are gone; every surface renders `Tue 28 Apr` /
// `14:30 GST` from the one shared formatter (`frontend/src/lib/format-date.ts`).
//
// ORACLE POPULATION DEFINITION. The population is the RENDERED DATE AND TIME TOKENS on the
// NON-SANCTIONED surfaces below, at :5173, `chromium-en`, admin, both locale legs:
//
//   /audit-logs   — `components/audit-logs/AuditLogTable.tsx`  (relative time AND `PP` skeleton)
//   /briefs       — `components/briefing-books/BriefingBooksList.tsx`  (relative time)
//   /my-work      — `pages/my-work/components/WorkItemCard.tsx`        (relative time)
//
// SANCTIONED RELATIVE-TIME SURFACES — the D-25 enumeration, hardcoded, and GRADED. Relative time
// is legitimate ONLY on these six feed/timeline recency surfaces, through the one shared localized
// helper. Every other `formatDistanceToNow` site migrates to the day-first shape:
//
//   components/activity-feed/EnhancedActivityFeed.tsx          → /activity
//   pages/Dashboard/components/ActivityFeedItem.tsx            → /dashboard (activity zone)
//   pages/dossiers/overview-cards/SharedRecentActivityCard.tsx → dossier overview cards
//   components/comments/CommentItem.tsx                        → comment threads on detail pages
//   components/notifications/NotificationItem.tsx              → /notifications
//   pages/Dashboard/widgets/RecentDossiers.tsx                 → /dashboard (recent-dossiers)
//
// WHY /dashboard IS SCANNED FOR SHAPES BUT NOT FOR RELATIVE TIME. Two of the six sanctioned feeds
// (`ActivityFeedItem`, `RecentDossiers`) render ON /dashboard, and only one of them carries a
// stable test id. Excising one region and not the other would produce a correct number about the
// wrong set. So /dashboard is asserted for the COMPETING-SHAPE clause only, and its relative-time
// clause is closed by the sanctioned enumeration above — stated, not silently dropped.
//
// STATED EXCLUSIONS (D-25):
//   - `MMMM yyyy` calendar-grid month-navigation headers ("August 2026") are navigation chrome,
//     OUT of this population; their Arabic rides `AR-02` / Phase 99. The month-first regex below
//     requires a `, yyyy` tail precisely so a month-nav header cannot trip it.
//   - `yyyy-MM-dd` `<input type="date">` VALUE plumbing is a wire format, not copy — and it lives
//     in a value attribute, which `innerText` never reads.
//   - Latin digits inside Arabic copy are deliberate policy (Phase 82 Policy D). This spec asserts
//     Latin digits in the `ar` leg; it never treats them as a defect.
//   - The BUILT-BUNDLE half of criterion 5 (`intake:fillMock` absent from a production build, D-26)
//     is a build-artifact claim with its own oracle in plan 98-07, not a rendered surface. It is
//     NOT closed here.
//
// LOCALE AND ROLE. Both legs (`?lng=en`, `?lng=ar`), admin (TEST_USER_EMAIL). Nothing here is
// claimed for analyst or intake.
//
// AUTHENTICATION: inline, --no-deps (E2ECRED-01 → P101). See 96-calendar-family.spec.ts.
import { test, expect, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

const SETTLE_TIMEOUT = 20_000

/** The canonical shapes `lib/format-date.ts` emits: `Tue 28 Apr` and `14:30 GST`. */
const CANONICAL_DATE = /\b[A-Z][a-z]{2} \d{2} [A-Z][a-z]{2}\b/
const CANONICAL_TIME = /\b\d{2}:\d{2} GST\b/

/** The competing formats criterion 5 removes. Each is named; none is a catch-all. */
const MONTH_FIRST = /\b[A-Z][a-z]{2,8} \d{1,2}, \d{4}\b/
const US_SLASH = /\b\d{1,2}\/\d{1,2}\/\d{4}\b/
const TWELVE_HOUR = /\b\d{1,2}:\d{2}(?::\d{2})? ?[AP]M\b/
const COMPETING_SHAPES: readonly (readonly [string, RegExp])[] = [
  ['month-first (Jul 4, 2026)', MONTH_FIRST],
  ['US slash (4/30/2026)', US_SLASH],
  ['12-hour (12:37 PM)', TWELVE_HOUR],
]

/** The relative-time phrase — sanctioned on the six feeds above, banned everywhere else. */
const RELATIVE_PHRASE = /\b\d+ (minutes?|hours?|days?|months?|years?) ago\b/

/** Arabic relative-time markers: the `منذ` prefix or an Arabic time-unit word. */
const ARABIC_RELATIVE = /منذ|دقيق|ساع|يوم|أيام|شهر|أشهر|سنة|سنوات/
/** Arabic-Indic digits — their PRESENCE is the defect; Policy D keeps digits Latin. */
const ARABIC_INDIC_DIGITS = /[٠-٩۰-۹]/

/** Surfaces where NO relative time may render and every date must be canonical. */
const NON_SANCTIONED_SURFACES: readonly string[] = ['/audit-logs', '/briefs', '/my-work']

/** Sign in inline; never echo either credential value. */
const signInInline = async (page: Page): Promise<void> => {
  if (email === '' || password === '') {
    throw new Error('TEST_USER_EMAIL / TEST_USER_PASSWORD missing from .env.test')
  }
  const login = new LoginPage(page)
  await login.goto()
  await login.signIn(email, password)
  await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 })
}

/** Locale is set explicitly on EVERY navigation — an unstated locale is not a stated locale. */
const gotoLocale = async (page: Page, path: string, lng: 'en' | 'ar'): Promise<void> => {
  const separator = path.includes('?') ? '&' : '?'
  await page.goto(`${path}${separator}lng=${lng}`)
}

/**
 * The main content region's rendered text, read AFTER the surface settles. Chrome outside `main`
 * is not asserted.
 *
 * The settle is load-bearing, not defensive padding: `main` becomes visible while the table is
 * still a skeleton, and reading then produced a run in which /audit-logs' `about 24 hours ago`
 * rows were invisible to the detector and the absence assertions passed over an empty table. An
 * instrument that samples before the data arrives returns a correct number about the wrong
 * instant.
 */
const mainText = async (page: Page): Promise<string> => {
  const main = page.getByRole('main')
  await expect(main).toBeVisible({ timeout: SETTLE_TIMEOUT })
  await page.waitForLoadState('networkidle', { timeout: SETTLE_TIMEOUT }).catch(() => undefined)
  // Settle on text stability rather than on a fixed sleep: two identical consecutive reads.
  let previous = ''
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const current = (await main.innerText()) ?? ''
    if (current === previous && current.trim() !== '') return current
    previous = current
    await page.waitForTimeout(1000)
  }
  return previous
}

test.describe('criterion 5 — one date format, and relative time only where sanctioned', () => {
  test.use({ viewport: { width: 1400, height: 900 } })

  // Six surface loads per test with a stability settle on each. The 30s default measures the
  // machine; this budget keeps every red attributable to an assertion.
  test.beforeEach(() => {
    test.setTimeout(300_000)
  })

  test('INSTRUMENT SELF-TEST: every date detector fires on its own defect and passes the fix', async () => {
    // Both polarities for every regex. A detector never shown firing proves nothing (D-06), and a
    // detector never shown passing would red a correct implementation.
    expect(RELATIVE_PHRASE.test('9 months ago'), 'relative detector on its defect').toBe(true)
    expect(RELATIVE_PHRASE.test('about 2 months ago'), 'relative detector on the date-fns tail')
      .toBe(true)
    expect(RELATIVE_PHRASE.test('Tue 28 Apr'), 'relative detector on the canonical shape').toBe(
      false,
    )
    expect(MONTH_FIRST.test('Jul 4, 2026'), 'month-first detector on its defect').toBe(true)
    expect(MONTH_FIRST.test('August 2026'), 'month-first detector on a sanctioned month header')
      .toBe(false)
    expect(US_SLASH.test('4/30/2026'), 'US-slash detector on its defect').toBe(true)
    expect(TWELVE_HOUR.test('12:37:38 PM'), '12-hour detector on its defect').toBe(true)
    expect(TWELVE_HOUR.test('14:30 GST'), '12-hour detector on the canonical time').toBe(false)
    expect(CANONICAL_DATE.test('Tue 28 Apr'), 'canonical date shape').toBe(true)
    expect(CANONICAL_TIME.test('14:30 GST'), 'canonical time shape').toBe(true)
  })

  test('non-sanctioned surfaces render no relative time and no competing format', async ({
    page,
  }) => {
    await signInInline(page)
    let canonicalSeen = false

    for (const surface of NON_SANCTIONED_SURFACES) {
      for (const lng of ['en', 'ar'] as const) {
        await gotoLocale(page, surface, lng)
        const text = await mainText(page)

        expect(text, `${surface} [${lng}] renders relative time outside the D-25 enumeration`)
          .not.toMatch(RELATIVE_PHRASE)
        for (const [name, pattern] of COMPETING_SHAPES) {
          expect(text, `${surface} [${lng}] renders a competing format: ${name}`).not.toMatch(
            pattern,
          )
        }
        if (CANONICAL_DATE.test(text) || CANONICAL_TIME.test(text)) canonicalSeen = true
      }
    }

    // POSITIVE CONTROL. Absence proves nothing if no surface rendered a date at all: a page whose
    // query returned zero rows would satisfy every assertion above while measuring nothing.
    expect(
      canonicalSeen,
      'no canonical Tue 28 Apr / 14:30 GST token rendered on ANY non-sanctioned surface — the ' +
        'absence assertions above measured nothing',
    ).toBe(true)
  })

  test('the dashboard renders no competing date format', async ({ page }) => {
    // Relative time is NOT asserted here: two of the six sanctioned feeds render on /dashboard.
    // See the header for why the region excision was refused rather than half-done.
    await signInInline(page)
    for (const lng of ['en', 'ar'] as const) {
      await gotoLocale(page, '/dashboard', lng)
      const text = await mainText(page)
      for (const [name, pattern] of COMPETING_SHAPES) {
        expect(text, `/dashboard [${lng}] renders a competing format: ${name}`).not.toMatch(pattern)
      }
    }
  })

  test('a sanctioned feed renders localized relative time with Latin digits under ar', async ({
    page,
  }) => {
    await signInInline(page)
    await gotoLocale(page, '/activity', 'ar')
    const text = await mainText(page)

    // Precondition asserted, never assumed: an empty feed cannot prove localization. The feed is
    // populated at HEAD (rows render), and what it renders is the bare compact token `109d` —
    // neither the day-first shape nor a localized phrase. That is the defect this assertion
    // names: D-25's ONE SHARED LOCALIZED HELPER does not exist yet, so no sanctioned feed can
    // render a localized relative phrase in either locale.
    expect(
      text.trim(),
      '/activity [ar] rendered nothing — the feed is empty and this leg is NOT CONSTRUCTED',
    ).not.toBe('')
    expect(
      ARABIC_RELATIVE.test(text),
      '/activity [ar] renders no localized relative-time phrase — the D-25 shared localized ' +
        'helper is absent and the feed emits a bare compact token instead',
    ).toBe(true)
    expect(text, '/activity [ar] renders the English relative phrase').not.toMatch(RELATIVE_PHRASE)
    expect(text, '/activity [ar] renders Arabic-Indic digits — Policy D keeps digits Latin').not
      .toMatch(ARABIC_INDIC_DIGITS)
  })
})
