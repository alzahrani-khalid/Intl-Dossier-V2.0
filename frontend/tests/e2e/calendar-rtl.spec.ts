import { test, expect } from '@playwright/test'

// Phase 39 Plan 39-05: activate Arabic dow + Arabic-Indic day-digit assertions.
// i18next localStorage key is `id.locale` per frontend/src/i18n/index.ts (lookupLocalStorage).
//
// Phase 80 Plan 80-06 (FOUC-02) — CI-proofing: this spec is date-sensitive. `/calendar`
// (the custom UnifiedCalendar) initializes its displayed month from `new Date()`
// (UnifiedCalendar.tsx:48 `useState(new Date())`) and fetches only that month's
// `calendar_entries`. The only rows the test account can see are the three SRTL-02
// regression seed rows (calendar_entries where `title_en LIKE 'SRTL-02 regression seed %'`,
// dated July 2026, visible via the organizer RLS policy because organizer_id == the test
// user = kazahrani@stats.gov.sa). With a real clock this gate GOES RED on 2026-08-01 (the
// seed month falls out of "current month").
//
// CLOCK RATIONALE — constructor-only Date override (NOT page.clock.*):
//   Empirically (80-06): ANY Playwright clock API that fakes `Date.now()` forward
//   (`page.clock.install` AND `page.clock.setFixedTime`) makes the Supabase client treat
//   the pre-authenticated storageState token as EXPIRED → a token-refresh storm → the
//   month event query starves → the CalendarEmptyWizard ("التقويم فارغ") renders and
//   `.cal-dow` is 0. The evergreen fix freezes ONLY the no-arg `new Date()` (what the
//   calendar reads for "current month") while keeping `Date.now()` REAL, so the auth token
//   is never seen as expired and the July event fetch completes. Registered via
//   addInitScript BEFORE navigation so the first paint reads the frozen "current month".
//
// Seed<->clock coupling (do not drift these apart): if the SRTL-02 rows are ever re-seeded to
// a different month, move FROZEN_TIME_ISO to that month. Re-seeding goes through the
// orchestrator (Supabase MCP) — the same organizer-scoped rows described in
// 76-SRTL02-VERIFICATION.md §1. FROZEN_TIME_ISO is intentionally mid-month (not the 1st) to
// avoid a GST/UTC boundary flipping the displayed month.
const FROZEN_TIME_ISO = '2026-07-15T12:00:00Z'

test.describe('Phase 39: Calendar RTL — Arabic dow + Indic digits', () => {
  test('renders Arabic short labels and Arabic-Indic day digits in ar', async ({ page }) => {
    // Freeze ONLY `new Date()` to mid-July 2026; keep `Date.now()` real so the Supabase
    // auth token is not seen as expired (see CLOCK RATIONALE above). Register before nav.
    await page.addInitScript((frozenIso: string) => {
      const RealDate = Date
      const FROZEN = new RealDate(frozenIso).getTime()
      class FakeDate extends RealDate {
        constructor(...args: unknown[]) {
          if (args.length === 0) {
            super(FROZEN)
          } else {
            super(...(args as [string | number | Date]))
          }
        }
        static now(): number {
          return RealDate.now() // Date.now() stays REAL → auth token NOT seen as expired
        }
      }
      window.Date = FakeDate as unknown as DateConstructor
    }, FROZEN_TIME_ISO)

    await page.addInitScript(() => {
      try {
        localStorage.setItem('id.locale', 'ar')
      } catch {
        // ignore — non-browser context
      }
    })
    await page.goto('/calendar')
    await page.waitForLoadState('networkidle')

    const dow = page.locator('.cal-dow')
    await expect(dow).toHaveCount(7)
    const labels = await dow.allTextContents()
    const hasArabicDow = labels.some((s) => /أحد|إثن|ثلا|أرب|خمي|جمع|سبت/.test(s))
    expect(hasArabicDow).toBe(true)

    const dayCells = page.locator('.cal-d')
    const dayCount = await dayCells.count()
    expect(dayCount).toBeGreaterThanOrEqual(28)

    const allDayText = (await dayCells.allTextContents()).join('')
    expect(/[٠-٩]/.test(allDayText)).toBe(true)
    // No Western digits should appear in day-number cells in ar locale
    expect(/[0-9]/.test(allDayText)).toBe(false)
  })
})
