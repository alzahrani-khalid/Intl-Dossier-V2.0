// @covers COPY-02 (criterion 2)
//
// Phase 98 — criterion 2 oracle. Cloned from `96-calendar-family.spec.ts`: header discipline,
// inline auth, `--no-deps`, DOM assertions.
//
// THE CRITERION (ROADMAP §Phase 98, criterion 2, as repaired at `7b9d5348f`): no raw i18n key
// reaches the screen. Every named instance is read as a CLASS, never as a string (D-23).
//
// THE CONSOLE LEG IS DROPPED — revision 1, and the reason is load-bearing. `frontend/src/i18n/
// index.ts` sets `saveMissing: false`, and i18next 25.10.10 invokes `missingKeyHandler` only under
// that flag. The handler registered at ~:575 is therefore DEAD CODE at HEAD, so a console listener
// for `Missing translation key:` can never fire in either locale. A leg that cannot fire is not a
// closer (D-06 / D-07), and shipping one would have manufactured a green out of silence. No plan
// in this phase modifies `i18n/index.ts`; if a later phase flips the flag, the leg revives there.
//
// ORACLE POPULATION DEFINITION — three legs, and what each one does NOT close:
//
//  (a) DOM DETECTOR (the CLOSER). Visible text and accessible names on the DRIVEN surfaces carry
//      no dotted token under the known namespace prefixes. Driven surfaces, named:
//        - /intake/queue → the first ticket's detail page, with the entity-link manager region
//          (the `entityLinks.*` surface: 6 components + 2 hooks funnel here);
//        - /dossiers/countries/create (the country wizard — the `regions.*` casing-miss class);
//        - /login (the auth loading state — the `common.loading` dot-form class).
//      Both locale legs, admin role.
//
//  (b) entityLinks CENSUS (a BACKSTOP, explicitly NOT the closure — D-24). 82 distinct paths are
//      referenced by the 8 source files: 80 STATIC paths (hardcoded below, with the derivation
//      command) plus 2 DYNAMIC families (`entityLinks.linkTypes.${…}`, `entityLinks.entityTypes.
//      ${…}`) whose value domains are not enumerable from source. This census asserts the derived
//      STATIC set — 80 — resolves to a non-empty string in BOTH bundles. It deliberately does NOT
//      assert `static >= 82`: that would be permanently red by construction, because 2 of the 82
//      are prefixes and not leaves.
//
//  (c) RECURRENCE CENSUS (D-22). `RecurrencePatternEditor.tsx` calls `t('calendar.recurrence.*')`
//      against a namespace-less `useTranslation()`, so every one of those lookups resolves into
//      `common` and renders its raw key. The repair is ROUTING, not authoring: the content already
//      exists in the `calendar` namespace. The derived set is 37 distinct paths — 35 leaves + the
//      2 dynamic families `daysOfWeek.` and `monthly.positions.` — and this census asserts all of
//      them under the `recurrence` subtree in BOTH locales.
//
// UNDRIVEN SURFACES — NAMED, NEVER SILENT (D-24). These `entityLinks.*` / criterion-2 surfaces are
// NOT driven by this oracle and close on census plus this line:
//   - `RecurrencePatternEditor` surface UNDRIVEN — closes on census per D-24; routing verified by
//     98-04's conservation gate.
//   - The AI-suggestion accept/reject flow (`components/ai/EntityLinkSuggestions.tsx`,
//     `entityLinks.aiSuggestions.*`) is UNDRIVEN — it requires the AnythingLLM backend, which is
//     not part of the dev-server oracle. It closes on census per D-24.
// Silence about either would be a gate failure at close.
//
// STATED EXCLUSIONS. The SILENT-DEFAULT mask class is OUT of criterion 2 and out of this spec:
// `DossierTypeGuide.tsx:162,165` use `t(key, '')` and the `Array.isArray`/`length > 0` guards at
// :224,241 make a miss VANISH rather than leak — a raw-key detector returns CLEAN over a hollow
// guide. That class is Phase 99 `AR-04a`; criterion 7's own oracle (98-copy08) defeats it with
// PRESENCE assertions. Also out: dynamic template keys with un-enumerable domains, `__tests__/**`,
// the backend, and the dead `public/locales` tree.
//
// LOCALE AND ROLE: both legs (`?lng=en`, `?lng=ar`), admin (TEST_USER_EMAIL). Nothing here is
// claimed for analyst or intake.
//
// AUTHENTICATION: inline, --no-deps (E2ECRED-01 → P101). See 96-calendar-family.spec.ts.
import { test, expect, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'
import enCommon from '../../frontend/src/i18n/en/common.json'
import arCommon from '../../frontend/src/i18n/ar/common.json'
import enCalendar from '../../frontend/src/i18n/en/calendar.json'
import arCalendar from '../../frontend/src/i18n/ar/calendar.json'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

const SETTLE_TIMEOUT = 20_000

/**
 * A dotted token under a known namespace prefix, rendered where copy belongs.
 *
 * `common` WAS MISSING until `RULING-P98A2-10` ordered it added. That omission is the reason
 * `common.clearFilters` — a raw key on `EntitySearchDialog.tsx:293`, i.e. a surface plan 98-04 had
 * just repaired — was invisible to this oracle. **Every green this detector produced before that
 * fixture fired was produced by an instrument that could not see the shape.** The planted
 * `common.clearFilters` fixture in the self-test below is what makes the next green mean something.
 *
 * DELIBERATELY NARROW, and the reason is not timidity. The blindness is structural — the same
 * omission holds for `afterActions`, `stepUp`, `forms` and ~40 other first segments. Those were
 * routed to `AR-04b` (Phase 99) by `RULING-P98A2-10` item 3, so widening the alternation to cover
 * them here would red the driven legs for a ~300-site repair this phase does not own and cannot
 * absorb. The extension is scoped to the ruled `common.` shape; the residual blindness is named
 * rather than left for someone to rediscover.
 *
 * The leading `\b` guards the false positive the `common` alternative introduces: without it,
 * `uncommon.Add` matches on the embedded substring. Both polarities of that guard are asserted.
 *
 * A SECOND BLINDNESS REMAINS, AND NO ALTERNATION CAN CLOSE IT (`RULING-P98A2-11`). Adding the
 * ~40 missing first segments would still not make this detector complete, and nobody should read
 * the extension above as if it did. `common.json` carries a nested duplicate subtree literally
 * named `common`, so for THIS namespace the project-wide rule is INVERTED: dot-form resolves and
 * COLON-form (`t('common:all')`) misses — and a colon-form miss renders the BARE token `all`,
 * which reads as plausible copy and contains no dot at all. A dotted-token matcher is blind to
 * that class BY MECHANISM, not by omission; only resolution-checking (the census legs, or the
 * `i18n-mask-audit` finder) can see it. 37 such miss sites / 27 distinct are on record under
 * `AR-04b`. Do not treat a green from this detector as evidence about bare tokens.
 */
const RAW_KEY_TOKEN =
  /\b(entityLinks|regions|typeGuide|typeDescription|calendar\.recurrence|common)\.[A-Za-z.]+/

/**
 * The 80 STATIC `entityLinks.*` paths, derived at HEAD by:
 *
 *   command grep -rhoE "entityLinks\.[A-Za-z0-9_.]+" \
 *     frontend/src/components/entity-links frontend/src/components/ai/EntityLinkSuggestions.tsx \
 *     frontend/src/hooks/useEntityLinks.ts frontend/src/hooks/useAiSuggestions.ts \
 *     | sort -u | command grep -vE "\.$"
 *
 * The full derivation returns 82 rows; the two dropped by the trailing-dot filter are the dynamic
 * families `entityLinks.entityTypes.` and `entityLinks.linkTypes.`. 80 + 2 = the ruled 82.
 */
const ENTITY_LINKS_STATIC_PATHS: readonly string[] = [
  'entityLinks.activeLinks',
  'entityLinks.add',
  'entityLinks.addLink',
  'entityLinks.aiSuggestions.accept',
  'entityLinks.aiSuggestions.acceptError',
  'entityLinks.aiSuggestions.accepted',
  'entityLinks.aiSuggestions.accepting',
  'entityLinks.aiSuggestions.confidence',
  'entityLinks.aiSuggestions.description',
  'entityLinks.aiSuggestions.error',
  'entityLinks.aiSuggestions.errorDescription',
  'entityLinks.aiSuggestions.getButton',
  'entityLinks.aiSuggestions.loading',
  'entityLinks.aiSuggestions.loadingDescription',
  'entityLinks.aiSuggestions.manualSearch',
  'entityLinks.aiSuggestions.noResults',
  'entityLinks.aiSuggestions.noResultsDescription',
  'entityLinks.aiSuggestions.resultsDescription',
  'entityLinks.aiSuggestions.resultsTitle',
  'entityLinks.aiSuggestions.retry',
  'entityLinks.aiSuggestions.stillUseManualSearch',
  'entityLinks.aiSuggestions.title',
  'entityLinks.alreadyLinked',
  'entityLinks.createBatchError',
  'entityLinks.createBatchErrorDescription',
  'entityLinks.createBatchPartialSuccess',
  'entityLinks.createBatchPartialSuccessDescription',
  'entityLinks.createBatchSuccess',
  'entityLinks.createBatchSuccessDescription',
  'entityLinks.createError',
  'entityLinks.createErrorDescription',
  'entityLinks.createSuccess',
  'entityLinks.createSuccessDescription',
  'entityLinks.deleteConfirmDescription',
  'entityLinks.deleteConfirmTitle',
  'entityLinks.deleteError',
  'entityLinks.deleteErrorDescription',
  'entityLinks.deleteLink',
  'entityLinks.deleteSuccess',
  'entityLinks.deleteSuccessDescription',
  'entityLinks.deletedLinks',
  'entityLinks.dragHandle',
  'entityLinks.editNotes',
  'entityLinks.filterByType',
  'entityLinks.filtersSelected',
  'entityLinks.linkCard',
  'entityLinks.linkList',
  'entityLinks.linkSelected',
  'entityLinks.loadError',
  'entityLinks.manager',
  'entityLinks.noDeletedLinks',
  'entityLinks.noLinks',
  'entityLinks.noResults',
  'entityLinks.noResultsTitle',
  'entityLinks.notesInput',
  'entityLinks.notesPlaceholder',
  'entityLinks.primary',
  'entityLinks.reorderHint',
  'entityLinks.replacePrimaryWarning',
  'entityLinks.restore',
  'entityLinks.restoreError',
  'entityLinks.restoreErrorDescription',
  'entityLinks.restoreLink',
  'entityLinks.restoreSuccess',
  'entityLinks.restoreSuccessDescription',
  'entityLinks.searchDialogDescription',
  'entityLinks.searchDialogTitle',
  'entityLinks.searchEmptyState',
  'entityLinks.searchError',
  'entityLinks.searchInput',
  'entityLinks.searchPlaceholder',
  'entityLinks.searchTips',
  'entityLinks.searchTitle',
  'entityLinks.selectEntity',
  'entityLinks.selectedCount',
  'entityLinks.setPrimary',
  'entityLinks.tip1',
  'entityLinks.tip2',
  'entityLinks.tip3',
  'entityLinks.title',
]

/**
 * The 35 LEAF `calendar.recurrence.*` paths, derived at HEAD by D-22's command:
 *
 *   command grep -ohE "calendar\.recurrence\.[A-Za-z0-9_.]+" \
 *     frontend/src/components/calendar/RecurrencePatternEditor.tsx | sort -u
 *
 * That returns 37 rows; the two with a trailing dot are the dynamic families listed separately
 * below. Paths are stored WITHOUT the `calendar.` prefix because the content lives in the
 * `calendar` namespace bundle, addressable colon-form — which is exactly the routing repair.
 */
const RECURRENCE_LEAF_PATHS: readonly string[] = [
  'recurrence.daysOfWeek.label',
  'recurrence.endOptions.after',
  'recurrence.endOptions.never',
  'recurrence.endOptions.on',
  'recurrence.ends',
  'recurrence.frequencies.daily',
  'recurrence.frequencies.monthly',
  'recurrence.frequencies.weekly',
  'recurrence.frequencies.yearly',
  'recurrence.interval',
  'recurrence.monthly.dayOfMonth',
  'recurrence.pattern',
  'recurrence.presets.biweekly',
  'recurrence.presets.custom',
  'recurrence.presets.daily',
  'recurrence.presets.monthly_same_day',
  'recurrence.presets.monthly_same_weekday',
  'recurrence.presets.weekdays',
  'recurrence.presets.weekly',
  'recurrence.presets.yearly',
  'recurrence.summary',
  'recurrence.summaryText.daily_one',
  'recurrence.summaryText.daily_other',
  'recurrence.summaryText.monthly_day_one',
  'recurrence.summaryText.monthly_day_other',
  'recurrence.summaryText.monthly_weekday_one',
  'recurrence.summaryText.monthly_weekday_other',
  'recurrence.summaryText.times_one',
  'recurrence.summaryText.times_other',
  'recurrence.summaryText.until',
  'recurrence.summaryText.weekly_one',
  'recurrence.summaryText.weekly_other',
  'recurrence.summaryText.yearly_one',
  'recurrence.summaryText.yearly_other',
  'recurrence.title',
]

/** The 2 dynamic families of the derived 37 — asserted as non-empty objects, not as strings. */
const RECURRENCE_FAMILY_PATHS: readonly string[] = [
  'recurrence.daysOfWeek',
  'recurrence.monthly.positions',
]

/** A known-present path in common.json — the census resolver's positive control. */
const KNOWN_PRESENT_COMMON_PATH = 'common.loading'
/** A path that exists nowhere — the census resolver's negative control. */
const BOGUS_PATH = 'zz.nope'

type Bundle = Record<string, unknown>

/** Walks a dotted path through a bundle. Returns `undefined` for any miss. */
const resolvePath = (bundle: Bundle, path: string): unknown =>
  path.split('.').reduce<unknown>((node, segment) => {
    if (node === null || typeof node !== 'object') return undefined
    return (node as Record<string, unknown>)[segment]
  }, bundle)

const isNonEmptyString = (value: unknown): boolean =>
  typeof value === 'string' && value.trim() !== ''

const isNonEmptyObject = (value: unknown): boolean =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.keys(value as Record<string, unknown>).length > 0

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

/** Visible body text plus every accessible name on the page — aria copy IS copy. */
const visibleCopy = async (page: Page): Promise<string> =>
  page.evaluate(() => {
    const body = (document.body as HTMLElement).innerText ?? ''
    const labels = Array.from(document.querySelectorAll('[aria-label]'))
      .map((el) => el.getAttribute('aria-label') ?? '')
      .join('\n')
    return `${body}\n${labels}`
  })

test.describe('criterion 2 — no raw i18n key reaches the screen', () => {
  test.use({ viewport: { width: 1400, height: 900 } })

  // Inline auth plus two locale legs of a data-heavy surface exceeds the 30s default. A timeout
  // tells nobody whether a key leaked, so the budget is set where only assertions can red.
  test.beforeEach(() => {
    test.setTimeout(150_000)
  })

  test('BOTH-POLARITY SELF-TEST: the DOM detector fires on a planted key and passes clean copy', async ({
    page,
  }) => {
    // One polarity is not a tested instrument. The planted fixture is the exact defect the intake
    // surface leaks today; the clean fixture is what the repair renders. Both run in-page against
    // the SAME regex source the assertions use, so neutering the regex reds this test first.
    const result = await page.evaluate((source) => {
      const detector = new RegExp(source)
      return {
        firesOnPlanted: detector.test('entityLinks.title'),
        firesOnRegionsMiss: detector.test('regions.Europe'),
        firesOnCommonMiss: detector.test('common.clearFilters'),
        passesClean: detector.test('Linked entities'),
        passesCleanCommonCopy: detector.test('Clear filters'),
        passesSentenceWithDot: detector.test('No links yet. Add one to get started.'),
        passesProseEndingInCommon: detector.test('This pattern is common. Add one to continue.'),
        passesEmbeddedCommon: detector.test('That spelling is uncommon.Add a note.'),
      }
    }, RAW_KEY_TOKEN.source)

    expect(result.firesOnPlanted, 'detector must fire on the planted entityLinks.title').toBe(true)
    expect(result.firesOnRegionsMiss, 'detector must fire on regions.Europe').toBe(true)
    expect(result.firesOnCommonMiss, 'detector must fire on the planted common.clearFilters').toBe(
      true,
    )
    expect(result.passesClean, 'detector must NOT fire on real copy').toBe(false)
    expect(result.passesCleanCommonCopy, 'detector must NOT fire on the resolved value').toBe(false)
    expect(result.passesSentenceWithDot, 'detector must NOT fire on ordinary prose').toBe(false)
    expect(
      result.passesProseEndingInCommon,
      'detector must NOT fire on prose containing the word "common" before a full stop',
    ).toBe(false)
    expect(
      result.passesEmbeddedCommon,
      'detector must NOT fire on "common" embedded in a longer word (the \\b guard)',
    ).toBe(false)
  })

  test('BOTH-POLARITY SELF-TEST: the census resolver reports a bogus path and resolves a real one', async () => {
    expect(
      resolvePath(enCommon as Bundle, BOGUS_PATH),
      `census resolver must NOT resolve ${BOGUS_PATH}`,
    ).toBeUndefined()
    expect(
      isNonEmptyString(resolvePath(enCommon as Bundle, KNOWN_PRESENT_COMMON_PATH)),
      `census resolver must resolve ${KNOWN_PRESENT_COMMON_PATH} in en/common.json`,
    ).toBe(true)
    expect(
      isNonEmptyString(resolvePath(arCommon as Bundle, KNOWN_PRESENT_COMMON_PATH)),
      `census resolver must resolve ${KNOWN_PRESENT_COMMON_PATH} in ar/common.json`,
    ).toBe(true)
  })

  test('the intake ticket detail renders no raw key on the entity-link surface', async ({
    page,
  }) => {
    await signInInline(page)
    for (const lng of ['en', 'ar'] as const) {
      await gotoLocale(page, '/intake/queue', lng)

      // The precondition is asserted, never assumed. If staging holds no ticket the leg is
      // UNDRIVEN per D-24 and this failure NAMES that — it does not silently pass.
      const firstTicket = page.locator('a[href*="/intake/tickets/"]').first()
      await expect(
        firstTicket,
        `no intake ticket reachable from /intake/queue under ${lng} — leg UNDRIVEN (D-24)`,
      ).toBeVisible({ timeout: SETTLE_TIMEOUT })
      await firstTicket.click()
      await expect(page).toHaveURL(/\/intake\/tickets\//, { timeout: SETTLE_TIMEOUT })
      await page.waitForLoadState('networkidle', { timeout: SETTLE_TIMEOUT }).catch(() => undefined)

      const copy = await visibleCopy(page)
      expect(copy, `intake ticket detail leaks a raw key under ${lng}`).not.toMatch(RAW_KEY_TOKEN)
    }
  })

  test('the country wizard renders no raw region key', async ({ page }) => {
    await signInInline(page)
    for (const lng of ['en', 'ar'] as const) {
      await gotoLocale(page, '/dossiers/countries/create', lng)
      await expect(page.getByRole('main')).toBeVisible({ timeout: SETTLE_TIMEOUT })
      const copy = await visibleCopy(page)
      expect(copy, `country wizard leaks a raw key under ${lng}`).not.toMatch(RAW_KEY_TOKEN)
    }
  })

  test('the auth loading state renders no raw key', async ({ page }) => {
    for (const lng of ['en', 'ar'] as const) {
      await page.goto(`/login?lng=${lng}`)
      await expect(page.locator('#password')).toBeVisible({ timeout: SETTLE_TIMEOUT })
      const copy = await visibleCopy(page)
      expect(copy, `auth surface leaks a raw key under ${lng}`).not.toMatch(RAW_KEY_TOKEN)
    }
  })

  test('CENSUS BACKSTOP: all 80 static entityLinks paths resolve in both bundles', async () => {
    expect(ENTITY_LINKS_STATIC_PATHS.length, 'derived static path count').toBe(80)
    for (const [locale, bundle] of [
      ['en', enCommon],
      ['ar', arCommon],
    ] as const) {
      const unresolved = ENTITY_LINKS_STATIC_PATHS.filter(
        (path) => !isNonEmptyString(resolvePath(bundle as Bundle, path)),
      )
      expect(
        unresolved,
        `${locale}/common.json: ${unresolved.length} of 80 entityLinks paths unresolved`,
      ).toEqual([])
    }
  })

  test('CENSUS BACKSTOP: all 37 derived calendar.recurrence paths resolve in both bundles', async () => {
    expect(
      RECURRENCE_LEAF_PATHS.length + RECURRENCE_FAMILY_PATHS.length,
      'derived recurrence path count (35 leaves + 2 dynamic families)',
    ).toBe(37)
    for (const [locale, bundle] of [
      ['en', enCalendar],
      ['ar', arCalendar],
    ] as const) {
      const unresolvedLeaves = RECURRENCE_LEAF_PATHS.filter(
        (path) => !isNonEmptyString(resolvePath(bundle as Bundle, path)),
      )
      expect(unresolvedLeaves, `${locale}/calendar.json: unresolved recurrence leaves`).toEqual([])
      const unresolvedFamilies = RECURRENCE_FAMILY_PATHS.filter(
        (path) => !isNonEmptyObject(resolvePath(bundle as Bundle, path)),
      )
      expect(
        unresolvedFamilies,
        `${locale}/calendar.json: unresolved recurrence dynamic families`,
      ).toEqual([])
    }
  })
})
