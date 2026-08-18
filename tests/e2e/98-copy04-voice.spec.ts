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
// SETTLE — ADDED UNDER `RULING-P98A2-20` (wave 5, ruled instruction; 98-01 is NOT re-opened).
// Until that ruling this file held ZERO settle primitives, so every capture read the
// PRE-HYDRATION SKELETON — the synchronous nav shell — and `@case` returned a DETERMINISTIC false
// green (3/3 runs, 6.2–6.5 s). Measured with capture mechanics held identical and the settle as
// the only variable: `/dossiers` 38 raw captures without it vs 98 with; `/intake/queue` 20 (all
// nav) vs 34, hiding three Title Case empty-state labels that mount only after the data query
// resolves. SETTLE-SUFFICIENCY EVIDENCE (the ruling's term): a 3 s dwell and an 8 s dwell are
// BYTE-IDENTICAL across all eight surfaces, +0/−0 unique captures — the settled capture is a
// converged fixed point, not a longer-is-more artifact. Widening the selector list instead adds
// 4 raw captures and ZERO new flagged labels: the hidden dimension was TIME, not shape.
//
// The `@case` red recorded in `98-RED-BASELINE.md` (`Add Elected Official`) was GENUINE — that CTA
// happens to sit in the synchronous shell. A genuine red from a blind instrument is the strongest
// false credential an oracle can earn, so this file's history is not evidence that it could see.
//
// NEGATIVE SCOPE (`RULING-P98A2-13` Law 1) — what this oracle CANNOT see, stated:
//   (a) any surface outside VISITED_SURFACES, and any EN leaf value never rendered there — that is
//       the ~4.5k long tail, `COPY-09`, owner Phase 102. NOTHING in Phase 98 covers it.
//   (b) captured labels with only ONE capitalized non-initial word — the predicate's DECLARED
//       under-inclusiveness (41 such labels at wave 5). Also `COPY-09` / P102.
//   (c) copy that never mounts for the ADMIN role. `IntakeRoleEmptyState.tsx:81` maps
//       admin → `reviewer`, so the `requester` / `assignee` / `viewer` variants of the same
//       component are structurally invisible here. NOTHING in Phase 98 covers them; P102.
//   (d) copy behind interaction — menus, dialogs, popovers, tabs not initially selected. This
//       oracle reads the settled first render only. NOTHING covers it.
//   (e) Arabic case (`@case` is `en`-only by orthographic necessity) and Arabic copy quality —
//       `AR-01..04`, Phase 99, an operator park.
//   (f) hardcoded copy that does not exact-match an EN bundle leaf — excluded by the
//       reverse-bundle filter, which is also what keeps DATA out. At wave 5, zero unmatched
//       captures satisfied the predicate, so this blind spot was measured empty on these
//       surfaces; it is not covered in general.
// Whether the OTHER seven criterion oracles share the no-settle blindness is `98-09`'s Law-1 pass
// (`RULING-P98A2-20` item 7), NOT this file's claim: a settle primitive PRESENT in a file is not a
// settle primitive PLACED before the capture — presence is not placement.
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

/**
 * The D-20 "label" definition — what the oracle captures on a visited surface.
 *
 * `a` is captured broadly, not just `nav a`: the elected-officials CTA that D-14 names is an
 * ANCHOR to `/dossiers/elected-officials/create`, not a `<button>`, and a selector list that
 * missed it would have made criterion 4's own named instance invisible to criterion 4's oracle.
 * Data-driven anchor text (entity names, row links) is removed a step later by the reverse-bundle
 * filter, which is what keeps the population to COPY.
 */
const LABEL_SELECTORS = 'button, a, [role="tab"], h1, h2, h3, [data-slot="empty-title"]'

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
 * Waits for the surface to HYDRATE before anything is read from it (`RULING-P98A2-20` item 1).
 * `main` becoming visible only proves the app shell painted; the data-driven regions — empty
 * states, list bodies, stat cards — mount later, and a capture taken at shell time silently
 * narrows the population to the nav chrome.
 *
 * `networkidle` is best-effort (`.catch`) because a surface holding an open subscription never
 * reaches it; the fixed dwell is what actually bounds the wait. 3 s is the SUFFICIENT dwell, not a
 * guess: 3 s and 8 s produce byte-identical captures on all eight surfaces.
 */
const settle = async (page: Page): Promise<void> => {
  await expect(page.getByRole('main')).toBeVisible({ timeout: SETTLE_TIMEOUT })
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
  await page.waitForTimeout(3_000)
}

/**
 * Asserts the locale the capture is actually running in (`RULING-P98A2-20` item 4: the capture's
 * locale is ASSERTED, never inherited). This is not ceremony — `/intake/queue` 302s to
 * `/my-work/intake` and the `?lng=` query param does NOT survive the redirect. The requested
 * locale is consumed and persisted before the redirect resolves, so the landed surface does render
 * the requested language; but "does" must be checked on every run, because a green whose locale is
 * a guess is what item 4 refuses.
 */
const expectLocale = async (page: Page, lng: 'en' | 'ar', surface: string): Promise<void> => {
  const lang = await page.evaluate(() => document.documentElement.lang)
  expect(lang, `${surface} must render under an ASSERTED ${lng}, not an inherited locale`).toBe(lng)
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

  // @case walks eight surfaces in one test; @values walks the same eight for the exclamation leg.
  // The 30s default would red on wall-clock, which measures the machine, not the copy.
  test.beforeEach(() => {
    test.setTimeout(300_000)
  })

  test('@values the elected-officials CTA reads in sentence case in both locales', async ({
    page,
  }) => {
    await signInInline(page)

    // The CTA is an ANCHOR to the create route, not a button — located by href so the locator
    // does not depend on the very text under test (a name-based locator would go MISSING when
    // the text is wrong, producing a red that names the locator instead of the defect).
    for (const [lng, expected] of [
      ['en', EO_ADD_EN],
      ['ar', EO_ADD_AR],
    ] as const) {
      await gotoLocale(page, '/dossiers/elected-officials', lng)
      await settle(page)
      await expectLocale(page, lng, '/dossiers/elected-officials')
      const cta = page.locator('a[href="/dossiers/elected-officials/create"]').first()
      await expect(cta, `EO add control not reachable under ${lng}`).toBeVisible({
        timeout: SETTLE_TIMEOUT,
      })
      expect((await cta.innerText()).trim(), `EO CTA text under ${lng}`).toBe(expected)
    }
  })

  test('@values the glossary term Deadline replaces Due Date on the commitments surface', async ({
    page,
  }) => {
    await signInInline(page)
    for (const lng of ['en', 'ar'] as const) {
      await gotoLocale(page, '/commitments', lng)
      await settle(page)
      await expectLocale(page, lng, '/commitments')
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
    expect(
      bangValues.length,
      'EN bundle must hold exclamation strings for this leg to be live',
    ).toBeGreaterThan(0)

    await signInInline(page)
    const offenders: string[] = []
    for (const surface of VISITED_SURFACES) {
      await gotoLocale(page, surface, 'en')
      await settle(page)
      await expectLocale(page, 'en', surface)
      const captured = await captureLabels(page, `${LABEL_SELECTORS}, p, span, div`)
      expect(captured.length, `capture on ${surface} must be non-empty`).toBeGreaterThan(0)
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

    // NEGATIVE POLARITY, in the region that was blind (`RULING-P98A2-20` item 2). The shell-red
    // class is already proven by the RED baseline's `Add Elected Official`, so re-planting there
    // would re-prove the only thing that was never in doubt. This fixture instead mounts a Title
    // Case label into a LATE region — injected on a timer AFTER navigation, so the pre-hydration
    // capture this oracle used to take could not have seen it. If the settle is ever removed, or
    // the capture moves back before hydration, THIS assertion goes red first.
    //
    // The planted string is DERIVED from the live bundle rather than hardcoded, so it cannot go
    // stale as Phase 102 works through COPY-09; it is asserted non-empty, because a fixture that
    // silently fails to build is a control that cannot fail.
    const plantable = Array.from(bundleValues).find((value) => isTitleCase(value))
    expect(
      plantable,
      'negative-polarity fixture needs one Title Case EN bundle value to plant; if none remains, COPY-09 is closed and this control must be re-authored',
    ).toBeTruthy()
    const planted = plantable as string

    await gotoLocale(page, VISITED_SURFACES[0], 'en')
    await page.evaluate((text) => {
      window.setTimeout(() => {
        const el = document.createElement('button')
        el.textContent = text
        el.setAttribute('data-p98-planted', 'true')
        ;(document.querySelector('main') ?? document.body).appendChild(el)
      }, 1_500)
    }, planted)
    await settle(page)
    const withPlant = await captureLabels(page, LABEL_SELECTORS)
    expect(
      withPlant.filter((text) => bundleValues.has(text) && isTitleCase(text)),
      `planted post-settle Title Case label "${planted}" must be DETECTED — a capture that misses it is reading the pre-hydration shell`,
    ).toContain(planted)

    // POSITIVE POLARITY: the real, unplanted surfaces.
    const flagged: string[] = []
    for (const surface of VISITED_SURFACES) {
      await gotoLocale(page, surface, 'en')
      await settle(page)
      await expectLocale(page, 'en', surface)
      const captured = await captureLabels(page, LABEL_SELECTORS)
      // A surface that captured NOTHING is a broken read, not a clean surface. Without this the
      // empty `flagged` below would be indistinguishable from a page that never rendered.
      expect(captured.length, `capture on ${surface} must be non-empty`).toBeGreaterThan(0)
      for (const text of captured) {
        if (!bundleValues.has(text)) continue
        if (isTitleCase(text)) flagged.push(`${surface}: ${text}`)
      }
    }
    expect(flagged, 'Title Case labels captured on visited surfaces').toEqual([])
  })
})
