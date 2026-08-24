# Phase 99-19: dynamic carriers and chrome literals

Status: implementation complete and committed. The required UI99-C5 leaf collects exactly once.
The task-local reaped execution was attempted verbatim, but this managed shell denied the reaper's
`ps` census and the test backend DNS lookup, so the fail-closed wrapper withheld the report before
Playwright ran a test. The product, scope, type, build, strict-audit, and focused route-test checks
are green; the rendered command must be rerun by the harness where process census and the test
backend are available.

## Product commits and owned transition

- `f757715bf` — `fix(i18n): bind reactive 404 and navigation copy`
- `54c9f2e67` — `fix(i18n): localize dynamic chrome labels`

The task base was `c66a10c825608d195084068b10d3ecf840a81165`. Unlike the previous summary-only
attempt, this task owns a five-file product diff:

```text
 .../src/components/entity-links/AISuggestionPanel.tsx   |  5 +----
 .../src/components/entity-links/EntitySearchDialog.tsx  |  8 ++++----
 .../modern-nav/ExpandedPanel/NavigationSection.tsx      |  2 +-
 frontend/src/pages/intelligence/IntelligencePage.tsx    |  2 +-
 frontend/src/routes/__root.tsx                          | 17 +++++++++--------
 5 files changed, 16 insertions(+), 18 deletions(-)
```

The 404 now obtains its translator through the reactive `useTranslation('common')` subscription,
uses a namespace-fixed translator for all five visible strings, and renders `search.label` without
the English `Search` fallback. The nav is explicitly bound to `common`. The search-dialog entity
type buttons/badges and AI-suggestion entity type now render the probed
`common:entityLinks.entityTypes.*` family rather than raw formatted backend values. The
classification filter now uses the same explicitly qualified carrier as its badge.

## Re-derived static rewrite population

The instrument self-check passed before the live audit:

```text
"selfCheck": "PASS"
"passed": true
"twoArgTotal": 9
"rawKeyTotal": 1
```

The unscoped tree header at task start was:

```text
strict i18n audit: 1714 file(s); 122/2077 two-arg masks unresolved
mask shapes literal/options-default: 105/1763 and 17/314
55/6506 raw-key sites unresolved
EN/AR two-arg: 122/122
EN/AR raw-key: 55/55
binding defect population: 159 files (47 array + 112 bare)
canonical binding reclassified sites: 1 two-arg / 35 raw-key
loose-hidden two-arg/raw-key: 0/3
```

The plan allowlist was parsed into 49 source files. Its initial scoped queue was already zero
because the dependency merge carried the original four carrier qualifications and five literal
extractions; nonzero totals prove the scope was live:

```text
strict i18n audit: 49 file(s); 0/211 two-arg masks unresolved
mask shapes literal/options-default: 0/163 and 0/48
0/775 raw-key sites unresolved
EN/AR two-arg: 0/0
EN/AR raw-key: 0/0
```

After this task removed the remaining search fallback and dynamic chrome mask, the same scope is
still clean with the expected lower assessed populations:

```text
strict i18n audit: 49 file(s); 0/210 two-arg masks unresolved
mask shapes literal/options-default: 0/162 and 0/48
0/771 raw-key sites unresolved
EN/AR two-arg: 0/0
EN/AR raw-key: 0/0
binding defect population: 13 files (3 array + 10 bare)
canonical binding reclassified sites: 1 two-arg / 23 raw-key
loose-hidden two-arg/raw-key: 0/0
```

Outside this population are locale JSON, family-lane source files, the task/queue/commitment
carrier tail, broad fallback-deletion lanes, and glossary-value work.

## Both-locale probes

Every binding changed or relied on was recursively resolved to a string in both bundled locales
before source edits. The four navigation handoffs and complete 404 family printed:

```text
PROBE common:navigation.dashboardOverview en="Dashboard Overview" ar="نظرة عامة على لوحة الدوسيهات" OK
PROBE common:navigation.taskQueue en="Task Queue" ar="قائمة المهام" OK
PROBE common:navigation.taskEscalations en="Task Escalations" ar="تصعيدات المهام" OK
PROBE common:navigation.workflow en="Workflow" ar="سير العمل" OK
PROBE common:notFound.title en="Page Not Found" ar="الصفحة غير موجودة" OK
PROBE common:notFound.message en="The page you are looking for does not exist or has been moved." ar="الصفحة التي تبحث عنها غير موجودة أو تم نقلها." OK
PROBE common:notFound.goBack en="Go Back" ar="العودة" OK
PROBE common:notFound.goHome en="Go to Home" ar="الذهاب إلى الصفحة الرئيسية" OK
PROBE common:search.label en="Search" ar="بحث" OK
```

The carrier enum sets, re-derived from the consuming unions/constants, all resolved:

```text
CARRIER common:entityTypes enumCount=9 [dossier, country, organization, person, engagement, position, forum, working_group, topic]
CARRIER dossier-recommendations:types enumCount=7 [country, organization, forum, engagement, topic, working_group, person]
CARRIER common:intelligence.classifications enumCount=4 [public, internal, confidential, restricted]
CARRIER operations-hub:stages enumCount=6 [intake, preparation, briefing, execution, follow_up, closed]
```

The chrome keys resolve as follows:

```text
PROBE common:monitoring.overall en="Overall:" ar="الحالة العامة:" OK
PROBE common:entityLinks.match en="Match:" ar="التطابق:" OK
PROBE common:entityLinks.level en="Level:" ar="المستوى:" OK
PROBE common:entityLinks.lastUsed en="Last used:" ar="آخر استخدام:" OK
PROBE common:entityLinks.aiSuggestions.confidence en="Confidence" ar="درجة الثقة" OK
```

All 12 search/AI entity-type carrier members also resolved at
`common:entityLinks.entityTypes.*`: `dossier`, `position`, `mou`, `engagement`, `assignment`,
`commitment`, `intelligence_signal`, `organization`, `country`, `forum`, `working_group`, and
`topic`. The complete probe ended:

```text
PROBE-OK keys=52 locales=2
```

## Dynamic-mask instrument

The instrument of record ran with its control first:

```text
CONTROL resolves(intelligence-signals, "severity") = True (expect True)
CONTROL resolves(common, "waitingQueue.statuses")  = True (expect True)
CONTROL resolves(common, "waitingQueue.status")    = False (expect False)
CONTROL resolves(common, "waitingQueue.priority")  = False (expect False)
UNRESOLVED dynamic t() key prefixes: 13 total  (12 mask a raw value -> criterion 1; 1 render a RAW KEY -> criterion 2)
```

None of this task's four carriers or added chrome carriers is in the 13-row output. Those rows are
the named task/waiting-queue/commitment tail outside this plan: AddContributorDialog (2),
ContributorsList (1), TaskCard (3), TaskDetail (3), AssignmentDetailsModal (3), and
CommitmentEditor (1).

## Source-pair oracle

This is structural verification for the named bindings, not a substitute for the rendered 404
oracle. It required every replacement call and rejected its old fallback/raw-value form:

```text
NAV common binding: PASS
404 reactive common binding: PASS
404 notFound title: PASS
404 notFound message: PASS
404 notFound goBack: PASS
404 notFound goHome: PASS
404 relocated search label: PASS
CARRIER entityTypes: PASS
CARRIER recommendation types: PASS
CARRIER classifications badge: PASS
CARRIER stages: PASS
CHROME monitoring overall: PASS
CHROME entity match: PASS
CHROME entity level: PASS
CHROME entity last used: PASS
CHROME AI confidence: PASS
CHROME search entity types: PASS
CHROME AI entity types: PASS
CHROME classification filter: PASS
SOURCE-ORACLE PASS checks=19
```

## UI99-C5 rendered command

The exact one-path/one-name collection is live and hardcoded to one:

```text
Listing tests:
  [chromium-en] › 99-ar03-leak.spec.ts:157:5 › UI99-C5 ar 404
Total: 1 test in 1 file
```

The exact plan command was then invoked. The configured server exited before the test, and the
fail-closed reaper withheld the report because this shell cannot execute `ps`:

```text
pw-run-reaped: playwright exited code=1 signal=null; group 26289 -> {"termed":false,"killed":false,"alreadyGone":false,"unavailable":true,"identityMismatch":false,"finalZero":false}; session unavailable; verdict unclean; causes ["unavailable: direct group 26289 liveness/identity unverifiable — a group we cannot prove is not a group we can call clean","unavailable: lease schema incomplete — wrapper identity/authority unproven: pgid is not a positive integer: null"]; report WITHHELD (.unclean.json); child output /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260824-104027-0000000000000032--P99-19/test-results/pw-reaped-e40bb1790c4c30108b0dfd22aa4677f1.json.log
```

The lease independently recorded `pgid:null` and `lstart:null`, and direct process census returned
`operation not permitted: ps`. The configured test backend also cannot resolve from this shell:

```text
TEST-BACKEND-DNS reachable=false code=ENOTFOUND
{"pgid":null,"lstart":null,"reason":null}
```

No alternative source, unit, or prose result is represented here as the rendered acceptance pass.
The harness must rerun the exact command in its process/network-enabled gate environment.

## Focused regression, type, build, and scope

The focused route regression was run through an in-memory Vitest config because the normal config
loader correctly could not write through the harness-owned `node_modules` symlink:

```text
✓ tests/unit/routes.test.tsx > Dossier Detail Route > shows the router 404 state when a dossier route does not exist 52ms

Test Files  1 passed (1)
     Tests  1 passed | 13 skipped (14)
Duration  5.10s
```

The direct type check passed:

```text
> intake-frontend@1.0.0 type-check
> tsc --noEmit
```

Both product commit hooks completed ESLint, Prettier, and the full Turbo build. Existing PDF-import,
generated-CSS, circular-chunk, large-chunk, and Knip inventory warnings remained non-fatal.
`git diff --check` passed.

No locale JSON changed:

```text
LOCALE-JSON-DIFF count=0
```

The only paths in the product diff are:

```text
frontend/src/components/entity-links/AISuggestionPanel.tsx
frontend/src/components/entity-links/EntitySearchDialog.tsx
frontend/src/components/modern-nav/ExpandedPanel/NavigationSection.tsx
frontend/src/pages/intelligence/IntelligencePage.tsx
frontend/src/routes/__root.tsx
```
