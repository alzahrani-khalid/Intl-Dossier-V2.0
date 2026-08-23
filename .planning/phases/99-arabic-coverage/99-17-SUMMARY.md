# Phase 99-17: missAll, chrome, and carrier source rewrites

Status: complete. Source changes landed in four commits from task base
`0f1a3d1d78781860f39ff7f848569818949267a4`:

```text
3bf002213 fix(ui): expose not found surface as main
13918d410 fix(i18n): extract chrome copy and qualify carriers
d0332efd0 fix(i18n): atomically unmask nav and not found copy
d17177696 fix(i18n): qualify chrome residual keys
```

No locale JSON was authored or changed.

## Population and strict rewrite queue

The task parsed the plan's brace scope instead of carrying a count. The source population was 49
files:

```text
SCOPED-SOURCE-FILES 49
```

The strict instrument's fixture control passed before the live census. Its output began:

```text
{
  "selfCheck": "PASS",
  "passed": true,
  "fixture": {
    "twoArgTotal": 9,
    "rawKeyTotal": 1
  }
}
```

The required unscoped live run and the task slice were then derived at the task base:

```text
{"scannedFiles":1714,"twoArgTotal":2082,"rawKeyTotal":6497,"twoArgUnresolved":154,"rawKeyUnresolved":80,"twoArgUnresolvedEn":154,"rawKeyUnresolvedEn":80,"twoArgUnresolvedAr":154,"rawKeyUnresolvedAr":80}
SCOPED-START {"scannedFiles":49,"twoArgTotal":216,"rawKeyTotal":766,"twoArgUnresolved":32,"rawKeyUnresolved":1,"twoArgUnresolvedEn":32,"rawKeyUnresolvedEn":1,"twoArgUnresolvedAr":32,"rawKeyUnresolvedAr":1}
```

The 33 task-local misses were grouped without changing their call defaults except for the named
atomic unmask units:

```text
WhatIfScenarioPanel: common.cancel -> common:cancel (1 raw-key)
FormSection: common.actions.moreInfo -> common:actions.moreInfo (1)
EntityBreadcrumbTrail: common.actions.clearHistory -> common:actions.clearHistory (1)
DocumentTree: common.{collapse,expand,add,more} -> common:{collapse,expand,add,more} (4)
DataTable: common.{cardView,tableView,toggleColumns,noResults x2,firstPage,previousPage,nextPage,lastPage} -> common:* (9)
ActionBuilder: priority.{low,medium,high,urgent} -> unified-kanban:priority.* (4)
ActionBuilder: status.{pending,in_progress,review,completed,cancelled} -> tasks-page:status.* (5)
AvailabilityPollingPage: common.actions.{gridView,listView} -> common:actions.* (2)
modern-nav-standalone: common.{seeReport,viewAll,manage} -> common:{seeReport,viewAll,manage} (3)
NotFoundPage strict misses: errors.pageNotFound, errors.pageNotFoundDescription, common.goBack (3)
```

The fourth 404 site already resolved through `common:dashboard.title`; it was still repointed as
part of the required four-site surface unit.

After the residual-only commit, the audit discriminated that only the three 404 misses remained:

```text
POST-STATIC {"scannedFiles":49,"twoArgTotal":216,"rawKeyTotal":766,"twoArgUnresolved":3,"rawKeyUnresolved":0,"twoArgUnresolvedEn":3,"rawKeyUnresolvedEn":0,"twoArgUnresolvedAr":3,"rawKeyUnresolvedAr":0}
frontend/src/routes/__root.tsx:21 errors.pageNotFound
frontend/src/routes/__root.tsx:24 errors.pageNotFoundDescription
frontend/src/routes/__root.tsx:32 common.goBack
```

## Both-locale resolution probes

Before any source edit, a recursive bundle walk required every target below to be a string in both
locales. It exited 0. The probed target sets were:

```text
common:cancel
common:actions.{moreInfo,clearHistory,gridView,listView}
common:{collapse,expand,add,more,cardView,tableView,toggleColumns,noResults,firstPage,previousPage,nextPage,lastPage,seeReport,viewAll,manage}
unified-kanban:priority.{low,medium,high,urgent}
tasks-page:status.{pending,in_progress,review,completed,cancelled}
common:notFound.{title,message,goBack,goHome}
common:navigation.{dashboardOverview,taskQueue,taskEscalations,workflow}
common:entityTypes.{dossier,country,organization,person,engagement,position,forum,working_group,topic}
dossier-recommendations:types.{country,organization,forum,engagement,topic,working_group,person}
common:intelligence.classifications.{public,internal,confidential,restricted}
operations-hub:stages.{intake,preparation,briefing,execution,follow_up,closed}
common:monitoring.overall
common:entityLinks.{match,level,lastUsed}
common:entityLinks.aiSuggestions.confidence
```

The four navigation handoff probes printed:

```text
PROBE common:navigation.dashboardOverview en="Dashboard Overview" ar="نظرة عامة على لوحة الدوسيهات" OK
PROBE common:navigation.taskQueue en="Task Queue" ar="قائمة المهام" OK
PROBE common:navigation.taskEscalations en="Task Escalations" ar="تصعيدات المهام" OK
PROBE common:navigation.workflow en="Workflow" ar="سير العمل" OK
```

The 404 and chrome probes printed:

```text
PROBE common:notFound.title en="Page Not Found" ar="الصفحة غير موجودة" OK
PROBE common:notFound.message en="The page you are looking for does not exist or has been moved." ar="الصفحة التي تبحث عنها غير موجودة أو تم نقلها." OK
PROBE common:notFound.goBack en="Go Back" ar="العودة" OK
PROBE common:notFound.goHome en="Go to Home" ar="الذهاب إلى الصفحة الرئيسية" OK
PROBE common:monitoring.overall en="Overall:" ar="الحالة العامة:" OK
PROBE common:entityLinks.match en="Match:" ar="التطابق:" OK
PROBE common:entityLinks.level en="Level:" ar="المستوى:" OK
PROBE common:entityLinks.lastUsed en="Last used:" ar="آخر استخدام:" OK
PROBE common:entityLinks.aiSuggestions.confidence en="Confidence" ar="درجة الثقة" OK
```

No probe missed, so D-26's stop condition did not fire and no JSON authoring was attempted.

## Atomic navigation and 404 unit

The navigation item render changed from `t(item.labelKey, item.label)` to `t(item.labelKey)` only
after the four probes above. The 404 mapping and fallback removal landed together in commit
`d0332efd0`:

```text
errors.pageNotFound + "Page not found" -> common:notFound.title
errors.pageNotFoundDescription + English sentence -> common:notFound.message
common.goBack + "Go back" -> common:notFound.goBack
common:dashboard.title + "Dashboard" -> common:notFound.goHome
```

No English 404 sentence remains in the JSX. `NotFoundPage` now exposes its surface as `<main>`,
which is the semantic region read by `99-ar03-leak.spec.ts`.

The post-unit scoped audit was already zero:

```text
POST-ATOMIC {"scannedFiles":49,"twoArgTotal":212,"rawKeyTotal":770,"twoArgUnresolved":0,"rawKeyUnresolved":0,"twoArgUnresolvedEn":0,"rawKeyUnresolvedEn":0,"twoArgUnresolvedAr":0,"rawKeyUnresolvedAr":0}
```

## Repair verification: unit-test 404 surface

The prior gate's only new failure fingerprint was the route unit test looking for the English
`Page Not Found` heading. The global unit-test `react-i18next` stub returns an unknown key verbatim,
so the newly key-only call rendered `common:notFound.title` under that stub even though the real
bundle resolves it. `NotFoundPage` now uses the app's real bundled i18n singleton for its four
`common:notFound.*` calls, matching the established direct-i18n pattern in the router error UI.
The existing `useTranslation()` hook remains in the component, so runtime language changes still
trigger a render. No default value, English source fallback, or locale JSON change was introduced.

The normal Vitest config loader could not write its generated config module through the
harness-owned `node_modules` symlink (`EPERM` on `node_modules/.vite-temp`). A programmatic focused
run used the same jsdom setup, React plugin, and aliases with config loading disabled and a writable
temporary cache. Its result was:

```text
✓ tests/unit/routes.test.tsx > Dossier Detail Route > shows the router 404 state when a dossier route does not exist 50ms

Test Files  1 passed (1)
     Tests  1 passed | 13 skipped (14)
  Duration  4.78s (transform 2.39s, setup 89ms, import 4.37s, tests 51ms, environment 213ms)
```

The repair-time both-locale probes remained green:

```text
PROBE common:notFound.title en="Page Not Found" OK
PROBE common:notFound.message en="The page you are looking for does not exist or has been moved." OK
PROBE common:notFound.goBack en="Go Back" OK
PROBE common:notFound.goHome en="Go to Home" OK
PROBE common:notFound.title ar="الصفحة غير موجودة" OK
PROBE common:notFound.message ar="الصفحة التي تبحث عنها غير موجودة أو تم نقلها." OK
PROBE common:notFound.goBack ar="العودة" OK
PROBE common:notFound.goHome ar="الذهاب إلى الصفحة الرئيسية" OK
```

The 49-file repair-time strict audit remained discriminating and clean:

```text
SCOPED-REPAIR {"scannedFiles":49,"twoArgTotal":211,"rawKeyTotal":775,"twoArgUnresolved":0,"rawKeyUnresolved":0,"twoArgUnresolvedEn":0,"rawKeyUnresolvedEn":0,"twoArgUnresolvedAr":0,"rawKeyUnresolvedAr":0}
```

The source oracle exited 0 with no diagnostic output, and the maskfinder control still printed
`True / True / False / False`. A direct `pnpm exec tsc --noEmit` repair-time run also exited 0 with
no output.

## Dynamic carriers and chrome extraction

The four source carriers now use the complete, probed enum families:

```text
CARRIER common:entityTypes enumCount=9 [dossier, country, organization, person, engagement, position, forum, working_group, topic]
CARRIER dossier-recommendations:types enumCount=7 [country, organization, forum, engagement, topic, working_group, person]
CARRIER common:intelligence.classifications enumCount=4 [public, internal, confidential, restricted]
CARRIER operations-hub:stages enumCount=6 [intake, preparation, briefing, execution, follow_up, closed]
```

`EntityBreadcrumbTrail`'s variable raw-value fallback was removed with its colon-prefix. The other
three current sites had no variable second argument left to delete; their dynamic expressions were
colon-qualified. The singular `common:intelligence.classification` label was preserved, while the
badge moved to the collision-safe plural `common:intelligence.classifications.*` family.

The extracted chrome calls are:

```text
pages/monitoring/Dashboard.tsx -> t('common:monitoring.overall')
EntitySearchDialog.tsx -> t('common:entityLinks.match')
EntitySearchDialog.tsx -> t('common:entityLinks.level')
EntitySearchDialog.tsx -> t('common:entityLinks.lastUsed')
AISuggestionPanel.tsx -> t('common:entityLinks.aiSuggestions.confidence')
```

The source literal absence/presence check exited 0, and no `common:common.*` site was recreated.

## Instrument-of-record control and carrier retirement

The control ran before the initial instrument census:

```text
CONTROL resolves(intelligence-signals, "severity") = True (expect True)
CONTROL resolves(common, "waitingQueue.statuses")  = True (expect True)
CONTROL resolves(common, "waitingQueue.status")    = False (expect False)
CONTROL resolves(common, "waitingQueue.priority")  = False (expect False)
```

At task HEAD, the same control still discriminated and the live output was:

```text
UNRESOLVED dynamic t() key prefixes: 13 total  (12 mask a raw value -> criterion 1; 1 render a RAW KEY -> criterion 2)
MASKED-RAW-VALUE  frontend/src/components/tasks/AddContributorDialog.tsx:258  prefix='tasks.contributorRole' ns=common
MASKED-RAW-VALUE  frontend/src/components/tasks/AddContributorDialog.tsx:264  prefix='tasks.roleDescription' ns=common
MASKED-RAW-VALUE  frontend/src/components/tasks/ContributorsList.tsx:78  prefix='tasks.contributorRole' ns=common
MASKED-RAW-VALUE  frontend/src/components/tasks/TaskCard.tsx:51  prefix='priority' ns=common
MASKED-RAW-VALUE  frontend/src/components/tasks/TaskCard.tsx:54  prefix='status' ns=common
MASKED-RAW-VALUE  frontend/src/components/tasks/TaskCard.tsx:58  prefix='work_item' ns=common
MASKED-RAW-VALUE  frontend/src/components/tasks/TaskDetail.tsx:124  prefix='work_item' ns=common
MASKED-RAW-VALUE  frontend/src/components/tasks/TaskDetail.tsx:414  prefix='work_item' ns=common
MASKED-RAW-VALUE  frontend/src/components/tasks/TaskDetail.tsx:487  prefix='work_item' ns=common
MASKED-RAW-VALUE  frontend/src/components/waiting-queue/AssignmentDetailsModal.tsx:213  prefix='waitingQueue.status' ns=common
MASKED-RAW-VALUE  frontend/src/components/waiting-queue/AssignmentDetailsModal.tsx:223  prefix='waitingQueue.priority' ns=common
MASKED-RAW-VALUE  frontend/src/components/waiting-queue/AssignmentDetailsModal.tsx:260  prefix='waitingQueue.entityType' ns=common
RAW-KEY           frontend/src/components/commitment-editor/CommitmentEditor.tsx:120  prefix='afterActions.commitments.tracking' ns=common
```

None of `EntityBreadcrumbTrail.tsx`, `DossierRecommendationCard.tsx`, `IntelligencePage.tsx`, or
`AttentionItem.tsx` appears. The remaining 13 rows are outside this task and belong to the named
P99-12/P99-13 task, waiting-queue, and commitment carrier lanes.

## Final static verification

The task's exact source oracle was RED at the base on the first nav clause:

```text
exit=1
139:              <span className="flex-1 truncate">{t(item.labelKey, item.label)}</span>
```

Its final run produced no diagnostic output and exited successfully:

```text
SOURCE-ORACLE exit=0
```

The final strict task slice is live and clean in both classes and both locales:

```text
SCOPED-FINAL {"scannedFiles":49,"twoArgTotal":211,"rawKeyTotal":775,"twoArgUnresolved":0,"rawKeyUnresolved":0,"twoArgUnresolvedEn":0,"rawKeyUnresolvedEn":0,"twoArgUnresolvedAr":0,"rawKeyUnresolvedAr":0}
```

The direct frontend type check passed:

```text
> intake-frontend@1.0.0 type-check /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260822-231735-0000000000000024--P99-17/frontend
> tsc --noEmit
```

Each product commit hook also completed ESLint/Prettier and the full Turbo build. The existing PDF
import, generated CSS, circular-chunk, large-chunk, and Knip inventory warnings remained non-fatal.

The final diff-scope check before this SUMMARY printed:

```text
DIFF-SCOPE files=16 allowed=true json=0
```

It listed only `frontend/src` source files from the plan. Adding this SUMMARY makes the final
population those 16 source files plus `.planning/phases/99-arabic-coverage/99-17-SUMMARY.md`.

## Rendered UI99-C5 evidence and environment bound

The committed Playwright filter collected exactly the required leaf test:

```text
Listing tests:
  [chromium-en] › 99-ar03-leak.spec.ts:156:5 › UI99-C5 ar 404
Total: 1 test in 1 file
```

The repository reaping runner could not establish its process lease in this managed sandbox, so it
withheld the report before the web server started:

```text
pw-run-reaped: playwright exited code=1 signal=null; group 11323 -> {"termed":false,"killed":false,"alreadyGone":false,"unavailable":true,"identityMismatch":false,"finalZero":false}; session unavailable; verdict unclean; causes ["unavailable: direct group 11323 liveness/identity unverifiable — a group we cannot prove is not a group we can call clean","unavailable: lease schema incomplete — wrapper identity/authority unproven: pgid is not a positive integer: null"]; report WITHHELD (.unclean.json)
```

The fallback direct invocation was also blocked before test execution because the configured root
`pnpm dev` requires a Doppler keyring unavailable to the worker:

```text
Token not found in system keyring
Doppler Error: secret not found in keyring
Error: Process from config.webServer was not able to start. Exit code: 1
```

A current production bundle was nevertheless built directly from this worktree in 10.72 s using a
writable `/private/tmp` Vite cache. Local HTTP binding and direct Chromium launch are both denied by
the managed sandbox (`listen EPERM` and macOS MachPort rendezvous `Permission denied`), so no
rendered assertion can run inside this worker. The external gate can run the already-collected
`UI99-C5 ar 404` test with its normal ports, browser authority, and secrets; the source now supplies
its Arabic family and required `<main>` observation surface.

## Outside population and later handoff

- Every i18n JSON, glossary value sweep, family-lane source file, and broad second-argument
  deletion is outside P99-17.
- P99-12/P99-13 own the 13 remaining maskfinder carrier rows shown above.
- The deletion lanes own second-argument removal outside the navigation, 404, named carrier, and
  named chrome units changed here.
- P99-18/P99-19 inherit no source residue for the nav, 404, four carriers, or five chrome calls;
  their fresh oracles can verify this landed state, including the rendered UI99-C5 run in an
  execution environment that permits it.
