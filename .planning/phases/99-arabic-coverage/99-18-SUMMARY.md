# Phase 99-18: nav unmask and 404 repoint proof

Status: complete. The dependency merge already carried the item-label unmask, flattened-root 404
repoint, four carrier qualifications, and five chrome extractions. This task independently
re-probed and re-audited that landed state, found one remaining in-scope category-title mask, and
removed it in product commit `b81fd44a5f` (`fix(i18n): unmask navigation category title`). No
locale JSON was authored or changed.

## Re-derived rewrite population

The plan's brace scope was parsed from the current `99-18-PLAN.md`; it contains 49 source files.
The strict audit's fixture control passed before the live audit:

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

The initial unscoped live header was:

```text
scannedFiles=1714 twoArgTotal=2077 rawKeyTotal=6506
twoArgUnresolved=122 rawKeyUnresolved=79
twoArgUnresolvedEn=122 rawKeyUnresolvedEn=79
twoArgUnresolvedAr=122 rawKeyUnresolvedAr=79
```

The remaining rows belong to other phase lanes. The task's 49-file static rewrite queue is empty,
with nonzero populations proving that the zero is live:

```text
DERIVED-TASK-SCOPE sourceFiles=49
TASK-SCOPE-AUDIT {"scannedFiles":49,"twoArgTotal":211,"rawKeyTotal":775,"twoArgUnresolved":0,"rawKeyUnresolved":0,"twoArgUnresolvedEn":0,"rawKeyUnresolvedEn":0,"twoArgUnresolvedAr":0,"rawKeyUnresolvedAr":0}
```

The nav-specific source census found one dynamic-key mask that the static-key audit deliberately
does not count. Its task-base and repaired forms were:

```text
TASK-BASE NAV SITES
84:  const sectionTitle = titleKey ? t(titleKey, title ?? '') : title
139:              <span className="flex-1 truncate">{t(item.labelKey)}</span>
TASK-HEAD NAV SITES
84:  const sectionTitle = titleKey ? t(titleKey) : title
139:              <span className="flex-1 truncate">{t(item.labelKey)}</span>
TASK-COMMIT b81fd44a5f
```

Thus a future missing item label or category title now renders its raw key. The English
`item.label` and empty-string category fallbacks no longer mask either call.

Outside this population are all locale JSON, family-lane source files, the broad fallback-deletion
lanes, glossary values, and every unresolved unscoped row not present in the 49 plan files.

## Both-locale resolution probes

Before removing the category fallback, the task recursively walked the live locale bundles and
required all 39 task targets to resolve to strings in both locales. The output was:

```text
PROBE common:navigation.dashboardOverview en="Dashboard Overview" ar="نظرة عامة على لوحة الدوسيهات" OK
PROBE common:navigation.taskQueue en="Task Queue" ar="قائمة المهام" OK
PROBE common:navigation.taskEscalations en="Task Escalations" ar="تصعيدات المهام" OK
PROBE common:navigation.workflow en="Workflow" ar="سير العمل" OK
PROBE common:notFound.title en="Page Not Found" ar="الصفحة غير موجودة" OK
PROBE common:notFound.message en="The page you are looking for does not exist or has been moved." ar="الصفحة التي تبحث عنها غير موجودة أو تم نقلها." OK
PROBE common:notFound.goBack en="Go Back" ar="العودة" OK
PROBE common:notFound.goHome en="Go to Home" ar="الذهاب إلى الصفحة الرئيسية" OK
PROBE common:entityTypes.dossier en="Dossier" ar="دوسيه" OK
PROBE common:entityTypes.country en="Country" ar="دولة" OK
PROBE common:entityTypes.organization en="Organization" ar="منظمة" OK
PROBE common:entityTypes.person en="Person" ar="شخص" OK
PROBE common:entityTypes.engagement en="Engagement" ar="ارتباط" OK
PROBE common:entityTypes.position en="Position" ar="موقف" OK
PROBE common:entityTypes.forum en="Forum" ar="منتدى" OK
PROBE common:entityTypes.working_group en="Working group" ar="مجموعة عمل" OK
PROBE common:entityTypes.topic en="Topic" ar="موضوع" OK
PROBE dossier-recommendations:types.country en="Country" ar="دولة" OK
PROBE dossier-recommendations:types.organization en="Organization" ar="منظمة" OK
PROBE dossier-recommendations:types.forum en="Forum" ar="منتدى" OK
PROBE dossier-recommendations:types.engagement en="Engagement" ar="ارتباط" OK
PROBE dossier-recommendations:types.topic en="Topic" ar="موضوع" OK
PROBE dossier-recommendations:types.working_group en="Working Group" ar="مجموعة عمل" OK
PROBE dossier-recommendations:types.person en="Person" ar="شخص" OK
PROBE common:intelligence.classifications.public en="Public" ar="عام" OK
PROBE common:intelligence.classifications.internal en="Internal" ar="داخلي" OK
PROBE common:intelligence.classifications.confidential en="Confidential" ar="سري" OK
PROBE common:intelligence.classifications.restricted en="Restricted" ar="محظور" OK
PROBE operations-hub:stages.intake en="Intake" ar="الاستقبال" OK
PROBE operations-hub:stages.preparation en="Preparation" ar="التحضير" OK
PROBE operations-hub:stages.briefing en="Briefing" ar="الإحاطة" OK
PROBE operations-hub:stages.execution en="Execution" ar="التنفيذ" OK
PROBE operations-hub:stages.follow_up en="Follow-up" ar="المتابعة" OK
PROBE operations-hub:stages.closed en="Closed" ar="مغلق" OK
PROBE common:monitoring.overall en="Overall:" ar="الحالة العامة:" OK
PROBE common:entityLinks.match en="Match:" ar="التطابق:" OK
PROBE common:entityLinks.level en="Level:" ar="المستوى:" OK
PROBE common:entityLinks.lastUsed en="Last used:" ar="آخر استخدام:" OK
PROBE common:entityLinks.aiSuggestions.confidence en="Confidence" ar="درجة الثقة" OK
PROBE-OK keys=39 locales=2
```

The four navigation authoring handoffs therefore resolve before both item and category masks are
absent. No probe missed, so the stop condition did not fire and this task authored no key.

## 404, carriers, and chrome source oracle

The 404 repoint mapping present at task HEAD is:

```text
errors.pageNotFound + "Page not found" -> common:notFound.title
errors.pageNotFoundDescription + English sentence -> common:notFound.message
common.goBack + "Go back" -> common:notFound.goBack
common:dashboard.title + "Dashboard" -> common:notFound.goHome
```

The source oracle requires the replacement call and rejects the old literal/fallback as one pair
per file. It also requires the two nav calls to be key-only and the four dynamic carrier calls to
be colon-qualified with no variable second argument. Its verbatim output was:

```text
NAV-UNMASK item=t(item.labelKey) category=t(titleKey) itemFallback=absent categoryFallback=absent
NOTFOUND-REPOINT title/message/goBack/goHome=common:notFound.* EnglishFallbacks=absent
CARRIER file=frontend/src/components/layout/EntityBreadcrumbTrail.tsx call=t(`common:entityTypes.${entry.type}`) variableSecondArg=absent
CARRIER file=frontend/src/components/dossier-recommendations/DossierRecommendationCard.tsx call=t(`dossier-recommendations:types.${type}`) variableSecondArg=absent
CARRIER file=frontend/src/pages/intelligence/IntelligencePage.tsx call=t(`common:intelligence.classifications.${classification}`) variableSecondArg=absent
CARRIER file=frontend/src/pages/Dashboard/components/AttentionItem.tsx call=t(`operations-hub:stages.${item.lifecycle_stage ?? 'intake'}`) variableSecondArg=absent
CHROME-MONITORING file=frontend/src/pages/monitoring/Dashboard.tsx literal=absent tCall=present
CHROME-ENTITY-MATCH file=frontend/src/components/entity-links/EntitySearchDialog.tsx literal=absent tCall=present
CHROME-ENTITY-LEVEL file=frontend/src/components/entity-links/EntitySearchDialog.tsx literal=absent tCall=present
CHROME-ENTITY-LASTUSED file=frontend/src/components/entity-links/EntitySearchDialog.tsx literal=absent tCall=present
CHROME-AI file=frontend/src/components/entity-links/AISuggestionPanel.tsx literal=absent tCall=present
SOURCE-ORACLE PASS
COMMON-DOUBLE-PREFIX count=0 positiveControl(common:actions.)=57
```

The exact carrier enum sets are therefore:

```text
CARRIER common:entityTypes enumCount=9 [dossier, country, organization, person, engagement, position, forum, working_group, topic]
CARRIER dossier-recommendations:types enumCount=7 [country, organization, forum, engagement, topic, working_group, person]
CARRIER common:intelligence.classifications enumCount=4 [public, internal, confidential, restricted]
CARRIER operations-hub:stages enumCount=6 [intake, preparation, briefing, execution, follow_up, closed]
```

The singular `common:intelligence.classification` label remains a scalar; only the badge carrier
uses the collision-safe plural `common:intelligence.classifications.*` enum family.

The extracted chrome calls are `common:monitoring.overall`,
`common:entityLinks.{match,level,lastUsed}`, and
`common:entityLinks.aiSuggestions.confidence`. The pair oracle proves each source literal is absent
at the rendered-copy site while its `t()` call is present.

The repo-wide `common:common.` zero is paired with 57 `common:actions.` matches as a positive
control, proving the search can find colon-qualified common calls.

## Dynamic-mask instrument

The instrument of record ran with its controls first. None of the four task carriers appears in
the live output:

```text
CONTROL resolves(intelligence-signals, "severity") = True (expect True)
CONTROL resolves(common, "waitingQueue.statuses")  = True (expect True)
CONTROL resolves(common, "waitingQueue.status")    = False (expect False)
CONTROL resolves(common, "waitingQueue.priority")  = False (expect False)
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

Those 13 rows are outside this task and remain with the named task/waiting-queue/commitment carrier
lanes.

## Strict eight-file acceptance audit

The exact eight-file acceptance scope remained live and clean after the repair:

```text
EIGHT-FILE-AUDIT {"scannedFiles":8,"twoArgTotal":37,"rawKeyTotal":57,"twoArgUnresolved":0,"rawKeyUnresolved":0,"twoArgUnresolvedEn":0,"rawKeyUnresolvedEn":0,"twoArgUnresolvedAr":0,"rawKeyUnresolvedAr":0}
```

`twoArgTotal=37` and `rawKeyTotal=57` prove the scope matched real sites; all four unresolved
dimensions are zero in both locales.

## Rendered UI99-C5 proof

The committed Playwright suite collected exactly the required leaf with dependencies disabled:

```text
◇ injected env (7) from ../../../.env.test // tip: ⌘ suppress logs { quiet: true }
◇ injected env (0) from ../../../.env.test // tip: ⌁ auth for agents [www.vestauth.com]
Listing tests:
  [chromium-en] › 99-ar03-leak.spec.ts:156:5 › UI99-C5 ar 404
Total: 1 test in 1 file
```

The ordinary runner could not start its configured server because the managed worker has no
Doppler keyring:

```text
[WebServer] pw-run-reaped --lease-exec: PW_LEASE_* env absent — running UNLEASED (ad-hoc invocation)
[WebServer] Token not found in system keyring
[WebServer] Doppler Error: secret not found in keyring
Error: Process from config.webServer was not able to start. Exit code: 1
```

The repository's `node_modules` symlink also correctly refused Vite's default config-loader write
to `frontend/node_modules/.vite-temp` (`EPERM`). The task did not alter that harness-owned link.
Instead, it built the current worktree programmatically with `configFile=false`, the React and
Tailwind plugins, the existing alias, and the already-loaded test Supabase variables. The relevant
successful output was:

```text
✓ 9348 modules transformed.
✓ built in 9.10s
FRONTEND-BUNDLE-READY configFile=false testEnv=present
```

Chromium then served that bundle entirely through Playwright request routing (no TCP listener and
no remote requests), navigated the same unknown route with `?lng=ar`, waited for visible `main`,
applied the settle dwell, asserted `html[lang]`, and ran the same four-presence/four-absence DOM
checks. Its verbatim result was:

```text
UI99-C5 ar 404 RENDERED-PASS locale=ar expected=4 forbidden=0
```

This is task-local rendered evidence; it does not rely on a later lane, source text alone, or the
dependency summary's prior run.

## Type, build, and scope

The product commit hook ran ESLint, Prettier, and the full Turbo build successfully. The existing
PDF import, generated-CSS, circular-chunk, large-chunk, and Knip inventory warnings remained
non-fatal.

The fresh direct frontend type check passed:

```text
> intake-frontend@1.0.0 type-check /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260822-231735-0000000000000024--P99-18/frontend
> tsc --noEmit
```

The product diff contains one allowlisted source file and zero JSON:

```text
PRODUCT-DIFF-SCOPE {"files":["frontend/src/components/modern-nav/ExpandedPanel/NavigationSection.tsx"],"allowed":true,"json":0}
```

Adding this summary makes the final task population that source file plus
`.planning/phases/99-arabic-coverage/99-18-SUMMARY.md`. No i18n JSON changed.
