# Phase 99-21: AR-02 rendered dates proof

Status: **GREEN.** The rendered oracle collects exactly eight tests from one spec and passes all
three Arabic date legs, all three English controls, and both `/activity` relative-time legs.

## Resolution of RULING-P99-189

The prior diagnosis showed a genuinely open tour overlay in both locale legs, but its cause was the
spec's own `storageState: { cookies: [], origins: [] }` override. That override discarded the
`chromium-en` project's admin storage state, including the onboarding-seen/completed and
tours-disabled values written by the committed auth setup. This was a test-harness configuration
gap, not a product defect.

Commit `2169729c3` removes only that empty-state override. The spec now retains the project's seeded
state and still re-authenticates inline for session freshness. It does not dismiss onboarding,
write browser storage, sniff automation, broaden a selector, force a click, raise a timeout, alter
production source, or weaken any date assertion. The granted overlay-exit wait remains unchanged;
with the correct seeded state there is no overlay to evade.

## Rendered oracle

The exact acceptance command completed with exit 0:

```text
$ PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; test -f tests/e2e/99-ar02-dates.spec.ts && pnpm exec playwright test tests/e2e/99-ar02-dates.spec.ts --project=chromium-en --no-deps --list 2>&1 | command grep -qE "Total: 8 tests in 1 file" && node "$R/scripts/pw-run-reaped.mjs" -- tests/e2e/99-ar02-dates.spec.ts --project=chromium-en --no-deps
pw-run-reaped: report archived outside the worktree -> /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.pw-reports/2026-08-25T19-31-24-514Z-pw-reaped-8a1d2d15eaafc3468f9ace6f087ce9ca.json
pw-run-reaped: playwright exited code=0 signal=null; group 24656 -> {"termed":false,"killed":false,"alreadyGone":true,"unavailable":false,"identityMismatch":false,"finalZero":true}; session reaped; verdict clean; report published; child output /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260825-135647-0000000000000038--P99-21/test-results/pw-reaped-8a1d2d15eaafc3468f9ace6f087ce9ca.json.log
```

The archived JSON report records:

```text
expected: 8
skipped: 0
unexpected: 0
flaky: 0
UI99-C1C2C4 ar /calendar: passed
UI99-C1C2C4 ar /dossiers: passed
UI99-C1C2C4 ar /events: passed
UI99-C1 en control /calendar: passed
UI99-C1 en control /dossiers: passed
UI99-C1 en control /events: passed
UI99-C3 ar /activity relative time: passed
UI99-C3 en control /activity relative time: passed
```

The one-path collection command, with the expected count hardcoded at eight, printed:

```text
Listing tests:
  [chromium-en] › 99-ar02-dates.spec.ts:186:5 › UI99-C1C2C4 ar /calendar
  [chromium-en] › 99-ar02-dates.spec.ts:190:5 › UI99-C1C2C4 ar /dossiers
  [chromium-en] › 99-ar02-dates.spec.ts:194:5 › UI99-C1C2C4 ar /events
  [chromium-en] › 99-ar02-dates.spec.ts:198:5 › UI99-C1 en control /calendar
  [chromium-en] › 99-ar02-dates.spec.ts:202:5 › UI99-C1 en control /dossiers
  [chromium-en] › 99-ar02-dates.spec.ts:206:5 › UI99-C1 en control /events
  [chromium-en] › 99-ar02-dates.spec.ts:210:5 › UI99-C3 ar /activity relative time
  [chromium-en] › 99-ar02-dates.spec.ts:232:5 › UI99-C3 en control /activity relative time
Total: 8 tests in 1 file
```

## Raw-site census and formatter design

The re-derived non-test population has no English-name date-fns literal outside the formatter; its
positive control still matches inside the formatter:

```text
outside formatter: 0
formatter positive control: matched
```

The P99-20 baseline was 27 sites in 22 files: 24 formatter-routable sites and three already-localized
sites. They route through the shared helpers as follows:

| Sites                                                                              | Count | Classification     | Route                   |
| ---------------------------------------------------------------------------------- | ----: | ------------------ | ----------------------- |
| analytics charts (3), EscalationDashboard (2), SLAComplianceChart                  |     6 | formatter-routable | `formatDayMonth`        |
| AvailabilityPollResults, MyTasks                                                   |     2 | already localized  | `formatDayMonth`        |
| UnifiedCalendar, EventsPage month headings                                         |     2 | formatter-routable | `formatMonthYear`       |
| UpcomingSection                                                                    |     1 | already localized  | `formatWeekdayDayMonth` |
| DossierMoUsTab (3), ForumDetailsDialog, MousPage (2), ForumsPage, IntelligencePage |     8 | formatter-routable | `formatDayFirstYear`    |
| RecommendationCard, ActionItemsList, KCard                                         |     3 | formatter-routable | `formatDayMonth`        |
| SignalRow                                                                          |     1 | formatter-routable | `formatDayFirst`        |
| WeekAhead                                                                          |     1 | formatter-routable | `formatWeekday`         |
| DataLibraryPage, EventsPage date row                                               |     2 | formatter-routable | `formatDayMonthYear`    |
| ReportsPage                                                                        |     1 | formatter-routable | `formatDayMonthTime`    |

No site required a new locale parameter. Test files, i18n JSON, machine-only values, and trees
outside `frontend/src` are outside the population.

`format-date.ts` reads the i18next singleton at call time. Arabic absolute names use
`ar-u-nu-latn` through `toFormatLocale`; English remains `en-GB`; absolute values remain in
`Asia/Dubai`; `formatTime` retains the D-30-allowlisted `GST` suffix.

## NotificationPreviewTimeline provenance

The component's old English compact ages were repaired by P99-20. Its data now stores numeric
`ageMinutes`, derives a timestamp, and calls `formatRelativeTime`:

```text
32:import { formatRelativeTime } from '@/lib/format-date'
43:  ageMinutes: number
307:              {formatRelativeTime(new Date(Date.now() - notification.ageMinutes * 60_000))}
```

Arabic relative time therefore comes from the date-fns Arabic locale object and retains Latin
digits. `NotificationList`'s `اليوم` / `أمس` headers remain untouched because they already render
correct Arabic and are outside criterion 2.

## Other focused checks

```text
$ node scripts/check-date-formatting.mjs
date-formatting check OK: 1533 non-test file(s) scanned, 0 unexcused ad-hoc date/number formatting sites (raw toLocaleDateString/toLocaleTimeString, month-first date-fns literals, Indic locale literals, relative time, localized skeletons, 12-hour literals, date-receiver toLocaleString, Intl.RelativeTimeFormat, local relative-time declarations, hand-assembled short relative forms) outside the 2-file allowlist (lib/format-date.ts, components/ui/calendar.tsx) and the 6 named permanent exemption(s) (see EXEMPT — each states its reason, and the dead-code one states its VOID CONDITION). Named debt: 0 row(s) excusing 0 site(s), all owned by plan 98-07.

$ pnpm exec prettier --check tests/e2e/99-ar02-dates.spec.ts
Checking formatting...
All matched files use Prettier code style!

$ pnpm exec eslint tests/e2e/99-ar02-dates.spec.ts
<no output; exit 0>
```

Tracked changes remain inside the allowlist:

- `tests/e2e/99-ar02-dates.spec.ts`
- `.planning/phases/99-arabic-coverage/99-21-SUMMARY.md`
