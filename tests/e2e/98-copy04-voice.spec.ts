// @covers COPY-04 (criterion 4)
//
// Phase 98 — criterion 4 oracle. Cloned from `96-calendar-family.spec.ts`: header discipline,
// inline auth, `--no-deps`, DOM assertions.
//
// THE CRITERION (ROADMAP §Phase 98, criterion 4, as repaired at `7b9d5348f`): copy obeys the
// project voice — sentence case, no exclamation marks, no first-person plural where the product
// speaks, the glossary term `Deadline` (never `Due Date`) and `Urgent` (never `Critical`) for
// work-item priority.
//
// TWO TAGGED GROUPS, so later waves can gate them separately:
//   @values — expected GREEN after plan 98-06 (the value repairs).
//   @case   — expected RED until plan 98-08 lands (the sentence-case sweep).
// Run one group with `--grep @values` / `--grep @case`.
//
// ORACLE POPULATION DEFINITION (D-20, the BOUNDED sentence-case clause). The population is the
// CAPTURED LABEL SET on the surfaces this phase's oracle set visits. "Visited" is defined by the
// enumeration in VISITED_SURFACES below; "label" is defined by LABEL_SELECTORS below. A captured
// string enters the population ONLY if it exact-matches a leaf value in `frontend/src/i18n/en/`
// — the reverse-bundle lookup. That rule is what keeps DATA out: an engagement title, a country
// name, a person's name or a ticket subject is rendered text but is not copy, and no plan in this
// phase authors it.
//
// STATED EXCLUSIONS, all from CLAUDE.md's own carve-outs:
//   - `th` table-column headers — UPPERCASE is correct there;
//   - any element whose computed `text-transform` is `uppercase` (classification ribbons);
//   - any element rendered in the mono face (mono labels, `⌘K` hints, SLA windows `T-3`/`T+2`);
//   - ALL-CAPS strings, which are not Title Case;
//   - acronyms: a non-initial word counts as "capitalized" only when it matches `^[A-Z][a-z]+$`,
//     so `SLA`, `VIP`, `GASTAT`, `AI` never make a label look Title Case;
//   - the ~4.5k-string long tail of untouched copy — that is `COPY-09`, owner Phase 102. A label
//     this oracle does not capture is OUT of criterion 4 by D-20's own wording.
//   - the `validation:password.addSpecial` charset listing `(!@#$%^&*)` — its `!` is a charset
//     member, not voice. It is stripped from the scanned text before the exclamation check.
//
// THE TITLE-CASE PREDICATE, stated because a heuristic nobody can read is a silent scope cut:
// 2–6 words, not ALL-CAPS, and at least TWO NON-INITIAL words matching `^[A-Z][a-z]+$`. This is
// deliberately conservative — `Week Ahead` (one capitalized non-initial word) is NOT flagged. The
// bound is under-inclusive by construction; it never flags a correct label.
//
// THE `Deadline / Due Date` CHIP NAMED BY 98-UI-SPEC C4 IS UNDRIVEN, AND WHY. That string is
// `calendar:wizard.templates.deadlineReminder.title`, rendered only by
// `components/calendar/CalendarEmptyWizard.tsx`, which has ZERO importers at HEAD — Phase 96
// (DEAD-07) replaced the empty-month wizard with the always-rendered grid. Verified with a
// positive control (the same instrument returns importers for `DossierTypeStatsCard`). The
// glossary clause is therefore closed here on the surface where the term DOES reach the screen:
// `/commitments`, which renders `commitments:form.dueDate` = "Due Date" at HEAD. The unmounted
// string still gets its value repaired by 98-06; it simply has no rendered surface to close on.
//
// LOCALE AND ROLE. @values runs BOTH legs (`?lng=en`, `?lng=ar`) — the EO button and the glossary
// term are asserted per locale. @case runs the `en` leg ONLY and says so: sentence case is an
// English orthographic rule; Arabic has no case, and Arabic copy quality is Phase 99's judgment
// (`AR-01..04`), an operator park this spec does not touch. Role is admin (TEST_USER_EMAIL).
//
// AUTHENTICATION: inline, --no-deps (E2ECRED-01 → P101). See 96-calendar-family.spec.ts.
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test, expect, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

const SETTLE_TIMEOUT = 20_000

/** The repaired EO CTA (98-UI-SPEC C4 / D-14 / D-30), per locale. */
const EO_ADD_EN = 'Add elected official'
const EO_ADD_AR = 'إضافة مسؤول منتخب'
/** The retired term the glossary replaces with `Deadline`. */
const RETIRED_DUE_DATE = /\bDue Date\b/

/**
 * The surfaces this phase's oracle set visits — the D-20 "visited" enumeration. Changing this
 * list changes criterion 4's population, which is why it is a named constant and not inline.
 */
const VISITED_SURFACES: readonly string[] = [
  '/dossiers',
  '/dossiers/elected-officials',
  '/intake/queue',
  '/dashboard',
  '/calendar',
  '/intelligence',
  '/engagements',
  '/my-work',
]

/** The D-20 "label" definition — what the oracle captures on a visited surface. */
const LABEL_SELECTORS = 'button, [role="tab"], h1, h2, h3, nav a, [data-slot="empty-title"]'

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
 * Every leaf string value in `frontend/src/i18n/en/`. Resolved from `__dirname`, never from the
 * process cwd (D-18: shell and runner cwd drift between calls).
 */
const loadEnglishBundleValues = (): Set<string> => {
  const dir = resolve(__dirname, '../../frontend/src/i18n/en')
  const values = new Set<string>()
  const walk = (node: unknown): void => {
    if (typeof node === 'string') {
      const trimmed = node.trim()
      if (trimmed !== '') values.add(trimmed)
      return
    }
    if (Array.isArray(node)) {
      node.forEach(walk)
      return
    }
    if (node !== null && typeof node === 'object') {
      Object.values(node as Record<string, unknown>).forEach(walk)
    }
  }
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.json')) continue
    walk(JSON.parse(readFileSync(join(dir, file), 'utf8')) as unknown)
  }
  return values
}

/** The stated Title-Case predicate. Under-inclusive by construction — see the header. */
const isTitleCase = (value: string): boolean => {
  const words = value.trim().split(/\s+/)
  if (words.length < 2 || words.length > 6) return false
  if (value === value.toUpperCase()) return false
  const capitalizedNonInitial = words.slice(1).filter((word) => /^[A-Z][a-z]+$/.test(word))
  return capitalizedNonInitial.length >= 2
}

/**
 * Captures the label set on the current page, applying the stated exclusions in the browser
 * (computed style is only readable there).
 */
const captureLabels = async (page: Page, selectors: string): Promise<string[]> =>
  page.evaluate((sel) => {
    const out: string[] = []
    for (const el of Array.from(document.querySelectorAll(sel))) {
      if (el.closest('th') !== null) continue
      const style = window.getComputedStyle(el)
      if (style.textTransform === 'uppercase') continue
      if (/mono/i.test(style.fontFamily)) continue
      const text = ((el as HTMLElement).innerText ?? '').trim()
      if (text === '' || text.includes('\n')) continue
      out.push(text)
    }
    return out
  }, selectors)

test.describe('criterion 4 — copy obeys the project voice', () => {
  test.use({ viewport: { width: 1400, height: 900 } })

  test('@values the elected-officials CTA reads in sentence case in both locales', async ({
    page,
  }) => {
    await signInInline(page)

    await gotoLocale(page, '/dossiers/elected-officials', 'en')
    const addEn = page.getByRole('button', { name: new RegExp(EO_ADD_EN, 'i') }).first()
    await expect(addEn, 'EO add control not reachable under en').toBeVisible({
      timeout: SETTLE_TIMEOUT,
    })
    expect((await addEn.innerText()).trim(), 'EO CTA text under en').toBe(EO_ADD_EN)

    await gotoLocale(page, '/dossiers/elected-officials', 'ar')
    const addAr = page.getByRole('button', { name: EO_ADD_AR }).first()
    await expect(addAr, 'EO add control not reachable under ar').toBeVisible({
      timeout: SETTLE_TIMEOUT,
    })
    expect((await addAr.innerText()).trim(), 'EO CTA text under ar').toBe(EO_ADD_AR)
  })

  test('@values the glossary term Deadline replaces Due Date on the commitments surface', async ({
    page,
  }) => {
    await signInInline(page)
    for (const lng of ['en', 'ar'] as const) {
      await gotoLocale(page, '/commitments', lng)
      await expect(page.getByRole('main')).toBeVisible({ timeout: SETTLE_TIMEOUT })
      const body = (await page.locator('body').innerText()) ?? ''
      expect(body, `/commitments renders the retired term under ${lng}`).not.toMatch(
        RETIRED_DUE_DATE,
      )
    }
  })

  test('@values no exclamation mark reaches the screen as copy', async ({ page }) => {
    // POPULATION: rendered strings that exact-match an EN bundle value — i.e. COPY, never DATA.
    // A ticket subject or an engagement title containing `!` is user data and is out of scope.
    const bundleValues = loadEnglishBundleValues()
    const bangValues = Array.from(bundleValues).filter((value) => value.includes('!'))
    // Instrument self-test: the bundle really does hold exclamation copy at HEAD, so a zero
    // below would mean "none rendered", never "the instrument never looked".
    expect(bangValues.length, 'EN bundle must hold exclamation strings for this leg to be live')
      .toBeGreaterThan(0)

    await signInInline(page)
    const offenders: string[] = []
    for (const surface of VISITED_SURFACES) {
      await gotoLocale(page, surface, 'en')
      await expect(page.getByRole('main')).toBeVisible({ timeout: SETTLE_TIMEOUT })
      const captured = await captureLabels(page, `${LABEL_SELECTORS}, p, span, div`)
      for (const text of captured) {
        const stripped = text.replace(/\([^)]*!@#\$[^)]*\)/g, ' ')
        if (stripped.includes('!') && bundleValues.has(text)) offenders.push(`${surface}: ${text}`)
      }
    }
    expect(offenders, 'exclamation marks rendered as copy').toEqual([])
  })

  test('@case captured labels are sentence case on every visited surface', async ({ page }) => {
    // LOCALE BOUND, stated: `en` only. Sentence case is an English orthographic rule.
    const bundleValues = loadEnglishBundleValues()

    // BOTH-POLARITY SELF-TEST of the predicate, before any surface is read.
    expect(isTitleCase('Add Elected Official'), 'predicate must flag the D-14 named instance').toBe(
      true,
    )
    expect(isTitleCase('Add elected official'), 'predicate must pass the repaired value').toBe(
      false,
    )
    expect(isTitleCase('SLA VIP GASTAT'), 'predicate must not flag acronyms').toBe(false)

    await signInInline(page)
    const flagged: string[] = []
    for (const surface of VISITED_SURFACES) {
      await gotoLocale(page, surface, 'en')
      await expect(page.getByRole('main')).toBeVisible({ timeout: SETTLE_TIMEOUT })
      const captured = await captureLabels(page, LABEL_SELECTORS)
      for (const text of captured) {
        if (!bundleValues.has(text)) continue
        if (isTitleCase(text)) flagged.push(`${surface}: ${text}`)
      }
    }
    expect(flagged, 'Title Case labels captured on visited surfaces').toEqual([])
  })
})
