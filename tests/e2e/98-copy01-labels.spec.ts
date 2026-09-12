// @covers COPY-01, COPY-07 (criterion 1)
//
// Phase 98 — criterion 1 oracle. Cloned from `96-calendar-family.spec.ts`: header discipline,
// inline auth, `--no-deps`, assertions that live entirely in the DOM.
//
// THE CRITERION (ROADMAP §Phase 98, criterion 1, read at HEAD): raw database values never reach
// the user as copy — `human_entered`, `in_progress`, `follow_up`, `email`, `action_item` and the
// ISO-week token `2026-W27` render as display labels, not as the bytes the column holds.
//
// ORACLE POPULATION DEFINITION. The population is the RENDERED TEXT AND ACCESSIBLE NAMES of five
// NAMED regions, one per surface, on the dev server at :5173 (the single origin in
// ALLOWED_ORIGINS), under `chromium-en`, admin role, both locale legs via `?lng=`:
//
//   surface                       asserted region (the ONLY text scanned on that surface)
//   /intelligence (signals tab)   li[data-signal-id]                    — the signal rows
//   /engagements                  div[role="list"]                      — the week-grouped list
//   /kanban                       [data-droppable-id]                   — the board columns
//   /my-work/waiting              [data-testid="assignment-row"]        — the queue rows
//   /dossiers                     [data-testid^="dossier-type-card-"]   — the type cards
//
// WHY THE REGIONS ARE NARROWED, STATED SO THE NARROWING IS NOT A SILENT SCOPE CUT. The snake-token
// regex over a whole page's innerText is aggressive: slugs, filenames, route fragments and
// free-text data values match it and no plan in this phase repairs those. Scanning `main` would
// therefore red a correct implementation. The five regions above are the containers holding the
// elements criterion 1 repairs. Everything on those pages OUTSIDE those containers — page chrome,
// nav, toolbars, filter pills, footers, modals — is NOT asserted by this spec and is not claimed
// clean by it.
//
// FURTHER STATED EXCLUSIONS (98-RESEARCH §C1 "Outside the population"):
//   - prop-position expressions (`status={x.status}`) — a prop is not copy until a component
//     renders it; the rendering component is the population member, not the prop site;
//   - free-text data values that happen to look snake-ish (human-entered source names);
//   - DB COLUMN names — the CLAUDE.md glossary carve-outs (`intake_tickets.urgency` legitimately
//     uses `critical`, `aa_commitments.due_date`, `tasks.sla_deadline` / `workflow_stage`).
//     Criterion 1 maps VALUES to labels; it never renames a column;
//   - email addresses, which legitimately carry `_` and are stripped from the scanned text below.
//
// LOCALE AND ROLE. Every assertion below is made twice: `?lng=en` and `?lng=ar`. Role is admin
// (TEST_USER_EMAIL) — the only behaviourally-provable role, the bound P97 stated and this spec
// inherits. Nothing here is claimed for analyst or intake.
//
// AUTHENTICATION: inline, from TEST_USER_EMAIL / TEST_USER_PASSWORD, run with --no-deps. The
// Playwright `setup` project throws without six E2E_* keys that .env.test does not carry
// (E2ECRED-01, filed against Phase 101), so no storage-state fixture is usable here.
import { test, expect, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

const SETTLE_TIMEOUT = 20_000

/** A snake_case token in rendered copy: `human_entered`, `in_progress`, `follow_up`. */
const SNAKE_TOKEN = /\b[a-z]+(?:_[a-z]+)+\b/
/** The ISO-week token the engagements week header leaks: `2026-W27`. */
const ISO_WEEK_TOKEN = /\b\d{4}-W\d{2}\b/

/**
 * The underscore-free enum class. `email`, `high`, `todo`, `done` are invisible to BOTH regexes
 * above, so the absence assertions alone cannot close criterion 1 — this set is the positive
 * half. A member is flagged only when it is the ENTIRE trimmed text of an element (a chip or cell
 * rendering a raw value), never as a substring of a sentence.
 */
const BARE_ENUM_TOKENS = new Set([
  'todo',
  'in_progress',
  'review',
  'done',
  'cancelled',
  'pending',
  'completed',
  'urgent',
  'high',
  'medium',
  'low',
  'email',
  'action_item',
  'follow_up',
  'delivery',
  'sla',
  'task',
  'commitment',
  'intake',
  'human_entered',
])

interface RegionScan {
  readonly count: number
  readonly text: string
  readonly ariaLabels: readonly string[]
  readonly leafTexts: readonly string[]
}

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

/**
 * Locale is set explicitly on EVERY navigation. The detector order is querystring-first and the
 * choice persists to localStorage `id.locale`, so a bare goto after an `?lng=ar` visit would stay
 * Arabic — an unstated locale is not a stated locale.
 */
const gotoLocale = async (page: Page, path: string, lng: 'en' | 'ar'): Promise<void> => {
  const separator = path.includes('?') ? '&' : '?'
  await page.goto(`${path}${separator}lng=${lng}`)
}

/**
 * Reads the asserted region: its innerText, every accessible name inside it (aria copy IS copy,
 * 98-RESEARCH pitfall 12), and the text of its leaf elements (for the bare-enum check).
 * Email addresses are stripped from the scanned text — they legitimately carry `_`.
 */
const scanRegion = async (page: Page, selector: string): Promise<RegionScan> => {
  const raw = await page.evaluate((sel) => {
    const nodes = Array.from(document.querySelectorAll(sel))
    const labels: string[] = []
    const leaves: string[] = []
    for (const node of nodes) {
      if (node.hasAttribute('aria-label')) labels.push(node.getAttribute('aria-label') ?? '')
      node.querySelectorAll('[aria-label]').forEach((el) => {
        labels.push(el.getAttribute('aria-label') ?? '')
      })
      node.querySelectorAll('*').forEach((el) => {
        if (el.children.length === 0) leaves.push((el.textContent ?? '').trim())
      })
    }
    return {
      count: nodes.length,
      text: nodes.map((node) => (node as HTMLElement).innerText ?? '').join('\n'),
      ariaLabels: labels,
      leafTexts: leaves,
    }
  }, selector)
  const stripEmails = (value: string): string => value.replace(/\S+@\S+/g, ' ')
  return {
    count: raw.count,
    text: stripEmails(raw.text),
    ariaLabels: raw.ariaLabels.map(stripEmails),
    leafTexts: raw.leafTexts,
  }
}

/** Applies both absence regexes plus the bare-enum leaf check to one scanned region. */
const assertNoRawValues = (scan: RegionScan, where: string): void => {
  expect(scan.text, `${where}: rendered text leaks a snake_case token`).not.toMatch(SNAKE_TOKEN)
  expect(scan.text, `${where}: rendered text leaks an ISO-week token`).not.toMatch(ISO_WEEK_TOKEN)
  for (const label of scan.ariaLabels) {
    expect(label, `${where}: aria-label leaks a snake_case token`).not.toMatch(SNAKE_TOKEN)
    expect(label, `${where}: aria-label leaks an ISO-week token`).not.toMatch(ISO_WEEK_TOKEN)
  }
  const bare = scan.leafTexts.filter((value) => BARE_ENUM_TOKENS.has(value))
  expect(bare, `${where}: element renders a bare enum value as its whole text`).toEqual([])
}

test.describe('criterion 1 — database values never render as user copy', () => {
  test.use({ viewport: { width: 1400, height: 900 } })

  // Each test signs in inline, then loads two locale legs of a data-heavy surface. The default
  // 30s budget is a timing accident, not the criterion: a timeout tells nobody whether copy is
  // wrong. The generous budget keeps every red attributable to an assertion.
  test.beforeEach(() => {
    test.setTimeout(150_000)
  })

  test('INSTRUMENT SELF-TEST: both detectors fire on known-present fixtures (D-06)', async ({
    page,
  }) => {
    // A detector never shown firing proves nothing. The fixtures are the two literal defects
    // criterion 1 names, evaluated in-page against the SAME regex sources the assertions use, so
    // an edit that neuters a regex reds this test before it can silence a real surface.
    const fired = await page.evaluate(
      ([snakeSource, isoSource]) => {
        const snake = new RegExp(snakeSource)
        const iso = new RegExp(isoSource)
        return {
          snakeOnDefect: snake.test('human_entered'),
          isoOnDefect: iso.test('WEEK OF 2026-W27'),
          snakeOnClean: snake.test('Human entered'),
          isoOnClean: iso.test('Week of 28 Apr'),
        }
      },
      [SNAKE_TOKEN.source, ISO_WEEK_TOKEN.source],
    )
    expect(fired.snakeOnDefect, 'snake detector must fire on human_entered').toBe(true)
    expect(fired.isoOnDefect, 'ISO-week detector must fire on 2026-W27').toBe(true)
    expect(fired.snakeOnClean, 'snake detector must NOT fire on the repaired label').toBe(false)
    expect(fired.isoOnClean, 'ISO-week detector must NOT fire on a day-first date').toBe(false)
  })

  test('signals rows render source-type display labels, never the column value', async ({
    page,
  }) => {
    await signInInline(page)
    for (const lng of ['en', 'ar'] as const) {
      await gotoLocale(page, '/intelligence', lng)
      await page.getByRole('tab').filter({ hasText: /.+/ }).nth(1).click()
      const rows = page.locator('li[data-signal-id]')
      await expect(rows.first()).toBeVisible({ timeout: SETTLE_TIMEOUT })

      const scan = await scanRegion(page, 'li[data-signal-id]')
      expect(scan.count, `signals rows absent under ${lng} — leg not driven`).toBeGreaterThan(0)
      assertNoRawValues(scan, `/intelligence signals rows [${lng}]`)

      // POSITIVE LABEL LEG. Every source-type chip must read as a display label — an initial
      // capital and no underscore. `human_entered` fails both halves; `Human entered` passes.
      const sourceTypes = await page.locator('li[data-signal-id] span.font-mono').allInnerTexts()
      const enumShaped = sourceTypes.filter((value) => /^[a-z]/.test(value.trim()))
      expect(enumShaped, `signals source-type chips render raw values under ${lng}`).toEqual([])
    }
  })

  test('engagements week headers carry no ISO-week token', async ({ page }) => {
    // PRECONDITION, OBSERVED AND NAMED. At the HEAD this spec was authored against, /engagements
    // renders its error state ("Unable to load data / The request failed.") instead of the
    // week-grouped list, so `EngagementsList` — the only renderer of the `WEEK OF 2026-W27` group
    // header — never mounts. That failure belongs to no Phase 98 plan and is NOT repaired here
    // (SCOPE BOUNDARY: only issues this task's changes caused are auto-fixed). The leg is
    // therefore recorded NOT CONSTRUCTED in `98-RED-BASELINE.md`, never silently skipped, and the
    // assertion below fails naming the precondition rather than pretending to measure copy.
    await signInInline(page)
    for (const lng of ['en', 'ar'] as const) {
      await gotoLocale(page, '/engagements', lng)
      await expect(page.getByRole('main')).toBeVisible({ timeout: SETTLE_TIMEOUT })

      const errorState = await page.getByRole('main').innerText()
      expect(
        /Unable to load data|تعذر تحميل البيانات/.test(errorState),
        `/engagements [${lng}] is in its ERROR state, so EngagementsList never mounts — the ` +
          'ISO-week leg is NOT CONSTRUCTED (a pre-existing load failure owned by no Phase 98 plan)',
      ).toBe(false)

      const list = page.locator('div[role="list"]')
      await expect(
        list.first(),
        `/engagements [${lng}] renders no week-grouped list, so EngagementsList — the only ` +
          'renderer of the `WEEK OF 2026-W27` header — never mounts. The ISO-week leg is NOT ' +
          'CONSTRUCTED at this HEAD; the load failure is owned by no Phase 98 plan',
      ).toBeVisible({ timeout: SETTLE_TIMEOUT })

      const scan = await scanRegion(page, 'div[role="list"]')
      expect(scan.count, `engagements list absent under ${lng} — leg not driven`).toBeGreaterThan(0)
      assertNoRawValues(scan, `/engagements list [${lng}]`)
    }
  })

  test('kanban columns render workflow stages and priorities as labels', async ({ page }) => {
    await signInInline(page)
    for (const lng of ['en', 'ar'] as const) {
      await gotoLocale(page, '/kanban', lng)
      const columns = page.locator('[data-droppable-id]')
      await expect(columns.first()).toBeVisible({ timeout: SETTLE_TIMEOUT })

      const scan = await scanRegion(page, '[data-droppable-id]')
      expect(scan.count, `kanban columns absent under ${lng} — leg not driven`).toBeGreaterThan(0)
      assertNoRawValues(scan, `/kanban columns [${lng}]`)
    }
  })

  test('waiting-queue rows render status and priority as labels', async ({ page }) => {
    await signInInline(page)
    for (const lng of ['en', 'ar'] as const) {
      await gotoLocale(page, '/my-work/waiting', lng)
      const rows = page.locator('[data-testid="assignment-row"]')
      await expect(rows.first()).toBeVisible({ timeout: SETTLE_TIMEOUT })

      const scan = await scanRegion(page, '[data-testid="assignment-row"]')
      expect(scan.count, `waiting rows absent under ${lng} — leg not driven`).toBeGreaterThan(0)
      assertNoRawValues(scan, `/my-work/waiting rows [${lng}]`)
    }
  })

  test('dossier type cards carry no raw type value', async ({ page }) => {
    await signInInline(page)
    for (const lng of ['en', 'ar'] as const) {
      await gotoLocale(page, '/dossiers', lng)
      const cards = page.locator('[data-testid^="dossier-type-card-"]')
      await expect(cards.first()).toBeVisible({ timeout: SETTLE_TIMEOUT })

      const scan = await scanRegion(page, '[data-testid^="dossier-type-card-"]')
      expect(scan.count, `dossier type cards absent under ${lng}`).toBeGreaterThan(0)
      assertNoRawValues(scan, `/dossiers type cards [${lng}]`)
    }
  })
})
