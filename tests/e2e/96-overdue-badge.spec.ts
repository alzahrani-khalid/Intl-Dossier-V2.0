// @covers COUNT-04
//
// Phase 96 · 96-09 — the render half of COUNT-04. The two notions of overdue were unified at the
// data layer by 96-02 (stored `aa_commitments.status='overdue'` wins for commitments; the
// per-source computed comparison wins for tasks and intake), so `is_overdue` on the kanban RPC IS
// the unified signal. This spec proves the SCREEN spends that one signal twice and gets the same
// number: the toolbar's overdue chip and the count of badged cards.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// POPULATION DEFINITION (D-15) — what this oracle covers, and what falls outside
// ─────────────────────────────────────────────────────────────────────────────────────────────
// COVERED: the /kanban board's VISIBLE item set under DEFAULT filters (no search, no source or
//          priority facet), rendered by the dev server on :5173 under the .env.test TEST_USER's
//          own identity, chromium-en.
// OUTSIDE: · items excluded by an active filter. The chip counts `visibleItems` (cancelled
//            removed) while the columns render `filtered` (search + facets applied) —
//            WorkBoard.tsx:247. Under default filters those two populations are IDENTICAL, which
//            is why the equality below is stated over the default board and nowhere else. With a
//            facet active the chip can exceed the badge count by construction; that is a stated
//            seam, not a defect this spec measures.
//          · every other surface's overdue render (/commitments tabs, the analytics fulfillment
//            chart, the dashboard Overdue widget) — closed by 96-02 / 96-06 / 96-08.
//          · intake tickets: the board passes SOURCE_FILTER = ['commitment','task']
//            (WorkBoard.tsx:73), so no intake row is on this surface at all.
//          · Arabic pixels — an operator park; this runs chromium-en.
//
// WHY ONE `page.evaluate` AND NOT TWO LOCATOR READS (condition 7). Agreement is a MOMENT. The
// board is live: a realtime invalidation between two reads could move one number and not the
// other, and the disagreement would be an artifact of the instrument rather than a defect. Both
// numbers below are lifted from ONE synchronous DOM pass, so no clock separates them. This is the
// same-clock rule satisfied by construction, not by being quick.
//
// WHAT "VISIBLE" MEANS HERE: laid out in the document (`getClientRects().length > 0`), not
// in-viewport. The board scrolls horizontally, so an off-screen-right column's cards are rendered
// and counted — as they must be, since the chip counts them too. Restricting to the viewport
// would invent a disagreement the user never sees.
//
// NEVER ASSERT EMPTINESS AS AGREEMENT (D-13/D-16): an RLS denial presents as an empty 200, and
// 0 == 0 over a blank board would "pass" while proving nothing. Test 1 therefore fails unless the
// board actually rendered cards.
//
// AUTHENTICATION: inline, from TEST_USER_EMAIL / TEST_USER_PASSWORD, run with --no-deps. The
// Playwright `setup` project throws without six E2E_* keys that .env.test does not carry
// (E2ECRED-01, filed against Phase 101), so no storage-state fixture is usable here. Neither
// credential value is ever echoed.
import { test, expect, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

/** Sign-in + first paint of a data-backed route; generous, and not the thing under measurement. */
const SETTLE_TIMEOUT = 20_000

/**
 * The board's own budget. WorkBoard renders `aria-busy="true"` skeletons while `isLoading` and
 * swaps them for columns when the query settles. A skeleton still on screen past this budget is
 * the "still loading forever" failure — the same ceiling the P95 family uses.
 */
const LOADING_BUDGET = 15_000

/** No rendered text may carry a Postgres/PostgREST code, the vendor name, or a client error class. */
const INTERNAL_STRING =
  /(42501|42703|42P01|permission denied|supabase|FunctionsHttpError|FunctionsFetchError)/i

/**
 * A leaked i18n key renders as its own address. The badge's fallback label is addressed
 * colon-form (`unified-kanban:card.overdue`); the dot form would resolve against the default
 * namespace, miss, and render the raw key — which looks like copy until you read it.
 */
const RAW_I18N_KEY = /^(unified-kanban:|card\.)/

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

/** Navigate to the board and wait for the loading skeletons to be replaced by real columns. */
const gotoSettledBoard = async (page: Page): Promise<void> => {
  await page.goto('/kanban')
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: LOADING_BUDGET })
  await expect(page.locator('.overdue-chip')).toBeVisible({ timeout: LOADING_BUDGET })
}

test.describe('COUNT-04 — the overdue badge and the toolbar chip are one signal', () => {
  test('chip count equals badged-card count in ONE DOM snapshot, and Done is never badged', async ({
    page,
  }) => {
    await signInInline(page)
    await gotoSettledBoard(page)
    await expect(page.locator('section.col').first()).toBeVisible({ timeout: SETTLE_TIMEOUT })

    // ── THE SNAPSHOT. Everything below is read in one synchronous pass. ──────────────────────
    const snapshot = await page.evaluate(() => {
      const laidOut = (el: Element): boolean => el.getClientRects().length > 0

      const chipText = (document.querySelector('.overdue-chip')?.textContent ?? '').trim()
      // The chip copy is `{{count}} overdue` (unified-kanban:overdueChip), Latin digits in both
      // locales by policy (lib/format-locale). Parsed, never assumed.
      const chipMatch = /(\d+)/.exec(chipText)

      const badges = Array.from(document.querySelectorAll('[data-testid="kcard-overdue"]')).filter(
        laidOut,
      )
      const doneColumn = document.querySelector('[data-droppable-id="done"]')

      return {
        chipText,
        chip: chipMatch === null ? null : Number(chipMatch[1]),
        badges: badges.length,
        badgeTexts: badges.map((el) => (el.textContent ?? '').trim()),
        doneBadges:
          doneColumn === null
            ? null
            : doneColumn.querySelectorAll('[data-testid="kcard-overdue"]').length,
        cards: Array.from(document.querySelectorAll('.kcard')).filter(laidOut).length,
        overdueArticles: Array.from(document.querySelectorAll('article.kcard.overdue')).filter(
          laidOut,
        ).length,
      }
    })

    // The measurement is PRINTED, not just asserted: an equality whose operands are unknown
    // cannot be told apart from a vacuous 0 == 0 by anyone reading the run afterwards.
    process.stdout.write(
      `[COUNT-04 snapshot] cards=${snapshot.cards} chip=${String(snapshot.chip)} ` +
        `badges=${snapshot.badges} overdueArticles=${snapshot.overdueArticles} ` +
        `doneBadges=${String(snapshot.doneBadges)} chipText=${JSON.stringify(snapshot.chipText)}\n`,
    )

    // The board rendered work. Without this, a denial-emptied board would agree at 0 and the
    // equality would be measuring nothing (D-13).
    expect(snapshot.cards, 'the board rendered cards').toBeGreaterThan(0)
    expect(snapshot.chip, `chip text was ${JSON.stringify(snapshot.chipText)}`).not.toBeNull()

    // ── THE ASSERTION ────────────────────────────────────────────────────────────────────────
    expect(snapshot.badges, 'badged cards vs toolbar chip, same snapshot').toBe(snapshot.chip)

    // The badge and the card's own overdue class are driven by the SAME `is_overdue` field, so a
    // divergence here would mean the card is styled overdue while carrying no badge (or the
    // reverse) — the two-notions defect reappearing inside one component.
    expect(snapshot.overdueArticles, 'overdue-classed cards vs badges').toBe(snapshot.badges)

    // Completed work is not overdue under any of the unified formulas (96-02): the commitments
    // arm reads a stored status that `completed` is not, and both computed arms exclude
    // completed/closed rows. So the Done column carries no badge.
    expect(snapshot.doneBadges, 'the Done column exists on the board').not.toBeNull()
    expect(snapshot.doneBadges, 'badges inside the Done column').toBe(0)

    // Every badge says something. A badge whose text is empty is the pre-96-09 gap re-appearing:
    // `is_overdue` true with no day count used to render no overdue text at all.
    for (const text of snapshot.badgeTexts) {
      expect(text, 'badge text is non-empty').not.toBe('')
      expect(text, 'badge text is not a raw i18n key').not.toMatch(RAW_I18N_KEY)
    }
  })

  test('the board settles to real columns — never a skeleton past the budget, never an internal string', async ({
    page,
  }) => {
    await signInInline(page)
    await gotoSettledBoard(page)

    // Truthful settled shapes, both accepted: four columns (each holding cards or an explicit
    // empty-column line), or the board-level empty state. Asserted as a shape rather than a row
    // count, because zero personal work items is a legitimate truth and hardcoding today's data
    // would encode it as the expectation.
    const boardEmpty = page.locator('.board-empty')
    if (await boardEmpty.isVisible()) {
      await expect(boardEmpty).not.toBeEmpty()
    } else {
      const columns = page.locator('section.col')
      await expect(columns).toHaveCount(4, { timeout: LOADING_BUDGET })
      const columnCount = await columns.count()
      for (let i = 0; i < columnCount; i += 1) {
        const column = columns.nth(i)
        const cards = await column.locator('.kcard').count()
        const emptyLine = await column.locator('.col-empty').count()
        // A column that renders neither cards nor its "no items" line is the blank-region
        // failure this milestone exists to kill.
        expect(cards + emptyLine, `column ${i} renders cards or a truthful empty line`).toBeGreaterThan(0)
      }
    }

    // The chip is always rendered and always carries a number — including 0, which is a truthful
    // answer and not an excuse to omit it.
    const chipText = ((await page.locator('.overdue-chip').textContent()) ?? '').trim()
    expect(chipText).toMatch(/\d+/)
    expect(chipText).not.toMatch(RAW_I18N_KEY)

    const bodyText = (await page.locator('body').innerText()) ?? ''
    expect(bodyText).not.toMatch(INTERNAL_STRING)
  })
})
