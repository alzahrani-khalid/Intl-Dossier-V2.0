# Phase 99-21: AR-02 rendered dates proof

Status: **READY FOR THE PROCESS-ENABLED ACCEPTANCE GATE.** P99-20 supplied the formatter and raw-site
migration. This task retained the eight rendered date assertions and added only a dossier-click
synchronization wait in the granted Playwright spec. The wait requires every `.id-dialog-overlay`
to detach before the original hydrated-card click. It does not dismiss a dialog, broaden the card
selector, force a click, change an expected value, or raise a timeout. If an overlay stays open, the
test still fails and records its markup, computed pointer events/visibility, open-versus-mid-exit
state, and the preceding interaction sequence for the RULING-P99-189 escape valve.

No production source changed in this task. In particular, no browser-storage write or
automation-detection branch was added, and onboarding is not dismissed a second time.

## Commits

- `9c4f3904f` — `test(e2e): synchronize dossier date oracle`
- The documentation commit containing this summary follows separately.

## Rendered-spec synchronization and diagnosis

The two dossier legs retain the same original sequence and assertions:

1. inline sign-in;
2. navigate to `/dossiers?lng=ar|en`;
3. run the shared settle sequence;
4. assert the requested locale;
5. wait for the first hydrated `div.cursor-pointer:has(h1)` card to be visible;
6. require `.id-dialog-overlay` count to reach zero using Playwright's unchanged default expect
   timeout;
7. click the same card, require the same expanded region, and run the same date-shape assertions.

If step 6 fails, the helper evaluates the live interceptors and records:

- the intercepting element's first 500 markup bytes;
- computed `pointer-events`, `visibility`, `display`, and `opacity`;
- overlay/dialog `data-state` and a derived `open` / `mid-exit` phase;
- dialog computed visibility and pointer events;
- the full interaction sequence above.

Thus a mid-exit synchronization gap can settle, while a persistently open product dialog cannot be
worked around or turned green. The previous trace established identical interception in the Arabic
and English dossier controls, so the issue is not localized-date output.

The repository browser-testing skill was also attempted as an independent live-inspection path:

```text
$ agent-browser --version
zsh:1: command not found: agent-browser
```

The CLI was not installed, so the committed Playwright oracle remains the live diagnostic path.

## Re-derived raw-site census and classification

The current non-test `frontend/src` population has no raw date-fns `EEE`/`MMM` consumer literal
outside the centralized formatter:

```text
outside lib/format-date.ts: 0
formatter positive control: matched
```

The immediately preceding P99-20 baseline was re-derived as 27 sites in 22 files (the plan-time 26
was stale). The self-contained classification is:

| Baseline site(s)                     | Count | Classification     | Shared route                            |
| ------------------------------------ | ----: | ------------------ | --------------------------------------- |
| CommitmentFulfillmentChart `d MMM`   |     1 | formatter-routable | `formatDayMonth`                        |
| EngagementMetricsChart `d MMM`       |     1 | formatter-routable | `formatDayMonth`                        |
| RelationshipHealthChart `d MMM`      |     1 | formatter-routable | `formatDayMonth`                        |
| EscalationDashboard `d MMM`          |     2 | formatter-routable | `formatDayMonth`                        |
| AvailabilityPollResults `d MMM`      |     1 | already localized  | `formatDayMonth`                        |
| UnifiedCalendar `MMMM yyyy`          |     1 | formatter-routable | `formatMonthYear`                       |
| UpcomingSection `EEE d MMM`          |     1 | already localized  | `formatWeekdayDayMonth`                 |
| DossierMoUsTab `dd MMM yyyy`         |     3 | formatter-routable | `formatDayFirstYear`                    |
| RecommendationCard `d MMM`           |     1 | formatter-routable | `formatDayMonth`                        |
| ForumDetailsDialog `dd MMM yyyy`     |     1 | formatter-routable | `formatDayFirstYear`                    |
| ActionItemsList `d MMM`              |     1 | formatter-routable | `formatDayMonth`                        |
| SignalRow `EEE dd MMM`               |     1 | formatter-routable | `formatDayFirst`                        |
| SLAComplianceChart `d MMM`           |     1 | formatter-routable | `formatDayMonth`                        |
| MyTasks `d MMM`                      |     1 | already localized  | `formatDayMonth`                        |
| WeekAhead `EEE`                      |     1 | formatter-routable | `formatWeekday`                         |
| MousPage `dd MMM yyyy`               |     2 | formatter-routable | `formatDayFirstYear`                    |
| KCard `d MMM`                        |     1 | formatter-routable | `formatDayMonth`                        |
| DataLibraryPage `d MMM yyyy`         |     1 | formatter-routable | `formatDayMonthYear`                    |
| EventsPage `MMMM yyyy`, `d MMM yyyy` |     2 | formatter-routable | `formatMonthYear`, `formatDayMonthYear` |
| ForumsPage `dd MMM yyyy`             |     1 | formatter-routable | `formatDayFirstYear`                    |
| IntelligencePage `dd MMM yyyy`       |     1 | formatter-routable | `formatDayFirstYear`                    |
| ReportsPage `dd MMM HH:mm`           |     1 | formatter-routable | `formatDayMonthTime`                    |

Totals: 3 already-localized sites centralized, 24 formatter-routable sites centralized, and 0
sites requiring a new locale parameter. Test files, i18n JSON, machine-only input values, and trees
outside `frontend/src` are outside this population.

## Formatter design retained from P99-20

`format-date.ts` reads the `i18next` singleton's active language at call time. Arabic absolute names
use `toFormatLocale`, which resolves Arabic to `ar-u-nu-latn`; English remains pinned to `en-GB`.
All absolute helpers retain `Asia/Dubai`. `formatTime` retains Latin digits and the D-30-allowlisted
`GST` suffix. The inherited write-free call-time drill produced:

```text
en ["Tue 28 Apr","14:30 GST","28 Apr 2026","Tue 28 Apr 14:30 GST","April 2026"]
ar ["الثلاثاء، 28 أبريل","14:30 GST","28 أبريل 2026","الثلاثاء، 28 أبريل 14:30 GST","أبريل 2026"]
relative-ar منذ 15 دقيقة
```

## NotificationPreviewTimeline provenance

The old `timeAgo` provenance was not Arabic-safe: this component itself authored compact English
values (`2m`, `15m`, `1h` through `4h`) and concatenated them with translated `ago` copy. P99-20
repaired the model to store numeric `ageMinutes`, derive a timestamp, and call the single sanctioned
`formatRelativeTime` helper. Current evidence is:

```text
32:import { formatRelativeTime } from '@/lib/format-date'
43:  ageMinutes: number
89:    ageMinutes: 2,
98:    ageMinutes: 15,
107:    ageMinutes: 60,
116:    ageMinutes: 120,
125:    ageMinutes: 180,
134:    ageMinutes: 240,
307:              {formatRelativeTime(new Date(Date.now() - notification.ageMinutes * 60_000))}
```

Arabic relative time therefore comes from the date-fns Arabic locale object inside
`formatRelativeTime`, with counts interpolated as Latin digits. `NotificationList`'s hardcoded
`اليوم` / `أمس` headers were deliberately untouched: research found they already render correct
Arabic and are outside criterion 2.

## Verification journal

File existence and the one-path, hardcoded-eight collection oracle:

```text
$ test -f tests/e2e/99-ar02-dates.spec.ts && pnpm exec playwright test tests/e2e/99-ar02-dates.spec.ts --project=chromium-en --no-deps --list
file exists
(node:73639) [DEP0205] DeprecationWarning: `module.register()` is deprecated. Use `module.registerHooks()` instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
◇ injected env (7) from ../../../.env.test // tip: ⌘ multiple files { path: ['.env.local', '.env'] }
Listing tests:
  [chromium-en] › 99-ar02-dates.spec.ts:189:5 › UI99-C1C2C4 ar /calendar
  [chromium-en] › 99-ar02-dates.spec.ts:193:5 › UI99-C1C2C4 ar /dossiers
  [chromium-en] › 99-ar02-dates.spec.ts:197:5 › UI99-C1C2C4 ar /events
  [chromium-en] › 99-ar02-dates.spec.ts:201:5 › UI99-C1 en control /calendar
  [chromium-en] › 99-ar02-dates.spec.ts:205:5 › UI99-C1 en control /dossiers
  [chromium-en] › 99-ar02-dates.spec.ts:209:5 › UI99-C1 en control /events
  [chromium-en] › 99-ar02-dates.spec.ts:213:5 › UI99-C3 ar /activity relative time
  [chromium-en] › 99-ar02-dates.spec.ts:235:5 › UI99-C3 en control /activity relative time
Total: 8 tests in 1 file
hardcoded count: 8
```

Strict date guard:

```text
$ node scripts/check-date-formatting.mjs
date-formatting check OK: 1533 non-test file(s) scanned, 0 unexcused ad-hoc date/number formatting sites (raw toLocaleDateString/toLocaleTimeString, month-first date-fns literals, Indic locale literals, relative time, localized skeletons, 12-hour literals, date-receiver toLocaleString, Intl.RelativeTimeFormat, local relative-time declarations, hand-assembled short relative forms) outside the 2-file allowlist (lib/format-date.ts, components/ui/calendar.tsx) and the 6 named permanent exemption(s) (see EXEMPT — each states its reason, and the dead-code one states its VOID CONDITION). Named debt: 0 row(s) excusing 0 site(s), all owned by plan 98-07.
```

Spec format, lint, collection, and type-check:

```text
$ pnpm exec prettier --check tests/e2e/99-ar02-dates.spec.ts
Checking formatting...
All matched files use Prettier code style!

$ pnpm exec eslint tests/e2e/99-ar02-dates.spec.ts
<no output; exit 0>

$ pnpm --dir frontend exec tsc --noEmit
<no output; exit 0>
```

The focused legacy formatter-suite attempt did not reach a test because the supported runner loader
does not define the CommonJS global used by the existing config:

```text
$ pnpm --dir frontend exec vitest run src/lib/__tests__/format-date.test.ts --configLoader runner
failed to load config from /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260825-135647-0000000000000038--P99-21/frontend/vitest.config.ts
ReferenceError: __dirname is not defined
    at eval (/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260825-135647-0000000000000038--P99-21/frontend/vitest.config.ts:33:50)
```

This is test-runner startup, not a formatter assertion. The pre-commit hook independently completed
the repository Turbo build before creating `9c4f3904f`; its known generated-CSS, circular-chunk, and
chunk-size warnings remained non-fatal.

The exact rendered command was invoked after the synchronization commit:

```text
$ PATH="/opt/homebrew/bin:$PATH" node "$PWD/scripts/pw-run-reaped.mjs" -- tests/e2e/99-ar02-dates.spec.ts --project=chromium-en --no-deps
pw-run-reaped: playwright exited code=1 signal=null; group 77646 -> {"termed":false,"killed":false,"alreadyGone":false,"unavailable":true,"identityMismatch":false,"finalZero":false}; session none; verdict unclean; causes ["unavailable: direct group 77646 liveness/identity unverifiable — a group we cannot prove is not a group we can call clean"]; report WITHHELD (.unclean.json); child output /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260825-135647-0000000000000038--P99-21/test-results/pw-reaped-d5fee121d5f777ad9897cdd3b433a715.json.log
```

The nonce-bound withheld report confirms that the managed worker failed before any test or live
overlay diagnostic executed:

```json
{
  "errors": [
    {
      "message": "Error: Process from config.webServer was not able to start. Exit code: 1"
    }
  ],
  "stats": {
    "expected": 0,
    "skipped": 0,
    "unexpected": 0,
    "flaky": 0
  },
  "suiteCount": 0
}
```

No rendered pass is claimed from this process-restricted seat. The process-enabled gate owns the
required all-eight observation; if the overlay is persistently open there, the new diagnostic fails
closed and supplies the exact evidence the overseer ruling requires.

## Scope

Tracked task changes are limited to the two allowlisted paths:

- `tests/e2e/99-ar02-dates.spec.ts`
- `.planning/phases/99-arabic-coverage/99-21-SUMMARY.md`

The harness-owned `node_modules` symlink was not modified. Ignored build, Playwright-report, and
test-result artifacts were not staged. `GST`, glossary work, the notification-list group headers,
and every source outside the fixed date lane remain outside this task.
