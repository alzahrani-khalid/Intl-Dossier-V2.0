# Phase 99-20: AR-02 formatter and raw-site census

Status: implementation complete and committed. The source, formatter drill, strict guard, type,
build, lint, and both engagement-suite checks are green. The required rendered `/calendar` command
collected exactly its Arabic leg and English control, but this managed worker shell denied the
reaper's process census and denied every local server bind, so Playwright could not start the app.
The run-owned malformed lease was removed; the process/network-enabled harness must rerun the exact
rendered command. No source or unit result below is represented as a rendered pass.

## Commits

- `92514982b` — `feat(i18n): localize shared date formats`
- `ffbbc6740` — `test(engagements): repair static import mocks`

The task started from `6c244b019`. The implementation diff contains exactly the 26 allowed source
and test files; this summary is the only documentation follow-up.

## Re-derived raw-site census

The recorded single-line source grep was run first. It printed 25 rows in 22 files. That grep cannot
cross a line boundary, so a TypeScript-AST walk was then used as the drilled population instrument:
it selected non-test `.ts`/`.tsx` files, required a named `format` import from `date-fns`, and counted
calls whose literal format argument contains `EEE` or `MMM`.

```text
frontend/src/components/analytics/CommitmentFulfillmentChart.tsx:106: d MMM
frontend/src/components/analytics/EngagementMetricsChart.tsx:99: d MMM
frontend/src/components/analytics/RelationshipHealthChart.tsx:94: d MMM
frontend/src/components/assignments/EscalationDashboard.tsx:184: d MMM
frontend/src/components/assignments/EscalationDashboard.tsx:331: d MMM
frontend/src/components/availability-polling/AvailabilityPollResults.tsx:392: d MMM
frontend/src/components/calendar/UnifiedCalendar.tsx:141: MMMM yyyy
frontend/src/components/dossier/DossierDrawer/UpcomingSection.tsx:68: EEE d MMM
frontend/src/components/dossiers/DossierMoUsTab.tsx:170: dd MMM yyyy
frontend/src/components/dossiers/DossierMoUsTab.tsx:181: dd MMM yyyy
frontend/src/components/dossiers/DossierMoUsTab.tsx:195: dd MMM yyyy
frontend/src/components/engagement-recommendations/RecommendationCard.tsx:167: d MMM
frontend/src/components/forums/ForumDetailsDialog.tsx:328: dd MMM yyyy
frontend/src/components/meeting-minutes/ActionItemsList.tsx:221: d MMM
frontend/src/components/signals/SignalRow.tsx:82: EEE dd MMM
frontend/src/components/sla-monitoring/SLAComplianceChart.tsx:70: d MMM
frontend/src/pages/Dashboard/widgets/MyTasks.tsx:71: d MMM
frontend/src/pages/Dashboard/widgets/WeekAhead.tsx:53: EEE
frontend/src/pages/MoUs/MousPage.tsx:181: dd MMM yyyy
frontend/src/pages/MoUs/MousPage.tsx:187: dd MMM yyyy
frontend/src/pages/WorkBoard/KCard.tsx:90: d MMM
frontend/src/pages/data-library/DataLibraryPage.tsx:434: d MMM yyyy
frontend/src/pages/events/EventsPage.tsx:77: MMMM yyyy
frontend/src/pages/events/EventsPage.tsx:176: d MMM yyyy
frontend/src/pages/forums/ForumsPage.tsx:141: dd MMM yyyy
frontend/src/pages/intelligence/IntelligencePage.tsx:348: dd MMM yyyy
frontend/src/pages/reports/ReportsPage.tsx:433: dd MMM HH:mm
SITES=27
FILES=22
```

This reconciles the stale plan-time `26 sites / 22 files`: the current tree has 27 sites. The
line-bound grep misses both multiline calls at `DossierMoUsTab.tsx:181` and `:195`; the plan had
accounted for only one of those two when it recorded 26. The post-change AST population is zero.
Test files, i18n JSON, machine-only numeric/date-input tokens, and non-frontend trees are outside
this population.

### Per-site classification and route

`already localized` means the raw baseline site already passed the date-fns Arabic locale object;
it was still centralized because the acceptance population prohibits raw English-name token
literals. `formatter-routable` means no locale parameter or special provider was required.

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

Total: 3 already-localized sites centralized, 24 formatter-routable sites centralized, 0 sites
needing a new locale parameter.

## Formatter design and call-time drill

`format-date.ts` now reads `i18n.language` at each call. Arabic passes through
`toFormatLocale(language)` and therefore becomes `ar-u-nu-latn`; English remains pinned to `en-GB`.
The shared Intl options centralize the former `EEE`/`MMM` token shapes and retain `Asia/Dubai`.
`formatTime` also reads the active locale at call time while retaining Latin digits and the
allowlisted `GST`. The Policy D comments now state that AR-02 / Phase 99 supersedes its name-token
half while its Latin-digit half survives.

A write-free esbuild drill bundled the real i18n singleton and changed its language at runtime. Its
warnings named pre-existing duplicate JSON keys; the formatter output was:

```text
en ["Tue 28 Apr","14:30 GST","28 Apr 2026","Tue 28 Apr 14:30 GST","April 2026"]
ar ["الثلاثاء، 28 أبريل","14:30 GST","28 أبريل 2026","الثلاثاء، 28 أبريل 14:30 GST","أبريل 2026"]
relative-ar منذ 15 دقيقة
```

This drills the mid-session call-time switch, Arabic names, Latin digits, preserved English bytes,
preserved GST, and the sanctioned `formatRelativeTime` output without substituting for the rendered
oracle.

## NotificationPreviewTimeline provenance

The provenance walk found that `PreviewNotification.timeAgo` originated in this file as hardcoded
English compact units (`2m`, `15m`, `1h` through `4h`) and was assembled with `t('preview.ago')`.
It did not come from a localized upstream provider. The fixture now stores numeric `ageMinutes`,
constructs a timestamp, and renders it only through `formatRelativeTime`. No hand-assembled relative
unit or suffix remains.

## Mock-only engagement-suite repair

Both test-file diffs are confined to their own `vi.mock` factory bodies. The `react-i18next`
factories now export the required `initReactI18next` plugin, resolve the copy exercised by the
suites/default values, interpolate values, and return an empty string rather than echoing unknown
keys. The page router factory now exports the `Link` rendered by the page. No test title, assertion,
query, matcher, or expected value changed.

The normal Vitest config loader first failed because Vite attempted to write through the
harness-owned read-only `node_modules` symlink:

```text
Error: EPERM: operation not permitted, open '.../frontend/node_modules/.vite-temp/vitest.config.ts...mjs'
```

The supported runner loader was then used with the config's existing `__dirname` supplied through
`NODE_OPTIONS`. Final focused output:

```text
Test Files  2 passed (2)
     Tests  18 passed (18)
  Duration  1.93s
```

The unchanged legacy formatter suite remained green under its English active-language control:

```text
Test Files  1 passed (1)
     Tests  19 passed (19)
  Duration  1.45s
```

## Source oracle and strict date guard

The exact source predicate was rerun with explicit polarity output:

```text
positive fixture: matched
outside lib/format-date.ts: 0
formatter positive control: matched
date-formatting check OK: 1533 non-test file(s) scanned, 0 unexcused ad-hoc date/number formatting sites (raw toLocaleDateString/toLocaleTimeString, month-first date-fns literals, Indic locale literals, relative time, localized skeletons, 12-hour literals, date-receiver toLocaleString, Intl.RelativeTimeFormat, local relative-time declarations, hand-assembled short relative forms) outside the 2-file allowlist (lib/format-date.ts, components/ui/calendar.tsx) and the 6 named permanent exemption(s) (see EXEMPT — each states its reason, and the dead-code one states its VOID CONDITION). Named debt: 0 row(s) excusing 0 site(s), all owned by plan 98-07.
```

## Type, lint, format, and build

```text
> intake-frontend@1.0.0 type-check
> tsc --noEmit
```

Targeted ESLint exited 0 with no output. Prettier reported all 26 changed TypeScript files formatted.
The direct current-worktree Vite build (runner config loader, avoiding the symlink temp directory)
completed:

```text
✓ 9541 modules transformed.
✓ built in 13.01s
```

The existing generated-CSS, circular-chunk, large-chunk, and duplicate-i18n-key warnings remained
non-fatal and are outside this task.

## Rendered `/calendar` command

The required exact file/name selection collected the two intended legs:

```text
Listing tests:
  [chromium-en] › 99-ar02-dates.spec.ts:125:5 › UI99-C1C2C4 ar /calendar
  [chromium-en] › 99-ar02-dates.spec.ts:137:5 › UI99-C1 en control /calendar
Total: 2 tests in 1 file
```

The exact reaped command was invoked next. The configured web server exited before Playwright ran a
test because this managed shell cannot read process-group identity:

```text
pw-run-reaped: playwright exited code=1 signal=null; group 95680 -> {"termed":false,"killed":false,"alreadyGone":false,"unavailable":true,"identityMismatch":false,"finalZero":false}; session unavailable; verdict unclean; causes ["unavailable: direct group 95680 liveness/identity unverifiable — a group we cannot prove is not a group we can call clean","unavailable: lease schema incomplete — wrapper identity/authority unproven: pgid is not a positive integer: null"]; report WITHHELD (.unclean.json); child output .../test-results/pw-reaped-b87b47b01c8121dc706b3194b86ea289.json.log
```

The withheld JSON confirmed the measured cause, not a product assertion failure:

```text
Error: Process from config.webServer was not able to start. Exit code: 1
expected: 0
unexpected: 0
suites: []
```

Diagnostics then separated every available startup path:

```text
root dev: Doppler Error: secret not found in keyring
env-loaded turbo dev: Error: listen EPERM .../tsx-501/*.pipe
frontend Vite bundle loader: EPERM .../frontend/node_modules/.vite-temp/...
frontend Vite runner loader: EPERM unlink .../frontend/node_modules/.vite/deps/...
Vite preview over the successfully built current tree: Error: listen EPERM: operation not permitted 127.0.0.1:4173
```

Thus this shell cannot host a rendered surface. The run-owned malformed lease was deleted so it
cannot poison the harness retry. The required rendered result remains owned by the exact plan command
in the process/network-enabled acceptance gate.

## Scope and later-task handoff

`git diff HEAD~2..HEAD --name-only` lists only the 26 allowed production/test paths. Adding this
summary brings the task to 27 allowed paths. No out-of-scope tracked path changed; `node_modules`
remained the harness-provisioned symlink.

Per RULING-P99-166, the stale comments/names and Arabic expected values in
`frontend/src/lib/__tests__/format-date.test.ts` were not edited. That suite currently remains green
because its calls pass the legacy positional `'ar'` argument while the active singleton language is
English; the cutover task owning that test file must retarget it to switch the active i18n language
and assert Arabic names. No other suite was value-retargeted here.

Outside this task remain NotificationList's already-correct bilingual today/yesterday headers,
i18n JSON/glossary work, test-file date literals, and every source outside the enumerated raw-site
lane. `GST` remains deliberately allowlisted by D-30.
