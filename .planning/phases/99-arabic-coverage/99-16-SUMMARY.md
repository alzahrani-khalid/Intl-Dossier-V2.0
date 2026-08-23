# Phase 99-16: chrome and carrier authoring

Status: complete. Product changes landed in `925b23592` (`feat(i18n): author chrome and carrier
keys`). This task changed paired locale JSON only; this file is the documentation-only follow-up.

## Re-derived population

The task started from clean merge `fd6bb3b1e`. The strict audit was run unscoped over the current
tree, rather than carrying the research estimate. Its live header was:

```text
strict i18n audit: 1714 file(s); 154/2082 two-arg masks unresolved
mask shapes literal/options-default: 124/1768 and 30/314
80/6497 raw-key sites unresolved
EN/AR two-arg: 154/154
EN/AR raw-key: 80/80
binding defect population: 158 files (47 array + 111 bare)
canonical binding reclassified sites: 1 two-arg / 35 raw-key
loose-hidden two-arg/raw-key: 0/3
```

The unresolved static rows that remain are owned by the source-rewrite and family lanes. The
common-owner static queue had already been re-derived and authored by P99-14/P99-15: P99-14's
unscoped-minus-family derivation found 317 static paths plus four dynamic navigation references,
and P99-15 re-derived and closed the final two `actions.gridView` / `actions.listView` residuals.
This task rechecked their current destinations instead of treating those summaries as proof:

```text
en INHERITED-OWNER roots=13 nav=4 nonTestRaw=5
en navigation.dashboardOverview="Dashboard Overview"
en navigation.taskQueue="Task Queue"
en navigation.taskEscalations="Task Escalations"
en navigation.workflow="Workflow"
en common:entityLinks.aiSuggestions.confidence="Confidence"
en common:intelligence.classification.label="Classification"
ar INHERITED-OWNER roots=13 nav=4 nonTestRaw=5
ar navigation.dashboardOverview="نظرة عامة على لوحة الدوسيهات"
ar navigation.taskQueue="قائمة المهام"
ar navigation.taskEscalations="تصعيدات المهام"
ar navigation.workflow="سير العمل"
ar common:entityLinks.aiSuggestions.confidence="درجة الثقة"
ar common:intelligence.classification.label="التصنيف"
TEST-POLICY exclude=__tests__,*.test.* from shipped-key authoring queue
```

The five non-test raw-key paths checked above are `from`, `to`, `badge.sensitivity`,
`badge.aiConfidenceAria`, and `badge.aiConfidence`. The 13 flattened-root paths are `noResults`,
`goBack`, `collapse`, `expand`, `add`, `more`, `cardView`, `tableView`, `toggleColumns`,
`firstPage`, `previousPage`, `nextPage`, and `lastPage`.

The remaining task-local population was re-derived from the four consuming types and the live
chrome literals. It contains 26 carrier-enum leaves and four chrome leaves, with this namespace
breakdown:

```text
AUTHORING-QUEUE common=17 dossier-recommendations=7 operations-hub=6 totalEnumAndChrome=30 relocationPairs=1
CARRIER-CHROME-OK locales=2 carriers=4 chrome=4
```

`common=17` is nine `entityTypes`, four `intelligence.classification` members, and four chrome
leaves. The relocation pair preserves the former scalar `intelligence.classification` at
`intelligence.classification.label`; it is not counted as a new enum or chrome leaf. Outside this
population are the tasks/queues/positions family files, test mocks, all source rewrites, value
sweeps, and fallback deletion.

## Carrier enum sets

The enum members were re-derived from the source unions/constants. The exact locale oracle then
required the same complete set in both locales. Its output was:

```text
CARRIER common:entityTypes enumCount=9 [dossier, country, organization, person, engagement, position, forum, working_group, topic]
CARRIER dossier-recommendations:types enumCount=7 [country, organization, forum, engagement, topic, working_group, person]
CARRIER common:intelligence.classification enumCount=4 [public, internal, confidential, restricted]
CARRIER operations-hub:stages enumCount=6 [intake, preparation, briefing, execution, follow_up, closed]
```

The intelligence carrier collided with the existing singular label. It was therefore converted
to the collision-safe shape `intelligence.classification.label` plus the four enum leaves, while
the already-live plural `intelligence.classifications.*` set remains untouched. P99-19 must point
the dynamic badge at `common:intelligence.classification.${classification}` and repoint the two
singular label calls to `common:intelligence.classification.label` in the same source change.

Running the instrument of record with its controls first proved that all four common-owner
carriers now resolve. It fell from 17 to the 13 family-lane carriers deliberately outside this
task:

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

## Chrome keys

The newly authored chrome leaves and their exact values are:

```text
CHROME common:entityLinks.match en="Match:" ar="التطابق:"
CHROME common:entityLinks.level en="Level:" ar="المستوى:"
CHROME common:entityLinks.lastUsed en="Last used:" ar="آخر استخدام:"
CHROME common:monitoring.overall en="Overall:" ar="الحالة العامة:"
```

The AI-suggestion member already authored by the common long tail remains at
`common:entityLinks.aiSuggestions.confidence` with `Confidence` / `درجة الثقة`. The exact plan
oracle verified the three required English values by walking every namespace, found Arabic-script
values at the identical paths, and printed its non-vacuous positive control:

```text
CHROME-KEYS-OK leaves=16753
```

P99-17 through P99-19 own extraction of these literals and colon-prefixing of the carrier calls;
this task changed no consumer.

## Inherited de-prefix and raw-key controls

The 14 de-prefixed authoring handoffs remain present at the flattened common root:
`actions.approve`, `actions.complete`, `actions.copy`, `actions.dismiss`, `actions.generate`,
`actions.moveUp`, `actions.refresh`, `actions.reject`, `actions.test`, `actions.thumbsDown`,
`actions.thumbsUp`, `actions.toggleWatch`, `actions.viewDetails`, and `success`. Together with the
23 free-ride nested paths, all 37 paths derived from the flatten's `common:common.X` rewrite remain
paired. No top-level key named `common` was recreated.

The prohibited carrier check and standing negative control printed:

```text
en COMMON-NEGATIVE priority.*=absent status.*=absent work_item.*=absent
ar COMMON-NEGATIVE priority.*=absent status.*=absent work_item.*=absent
NEG-TASKCARD-OK missTrue=3
```

The full negative-control output was:

```text
🌐 i18next is made possible by our own product, Locize — consider powering your project with managed localization (AI, CDN, integrations): https://locize.com 💙
  TaskCard t('priority.low') ns=translation -> "priority.low"  MISS=true
  TaskCard t('status.in_progress') ns=translation -> "status.in_progress"  MISS=true
  TaskCard t('work_item.task') ns=translation -> "work_item.task"  MISS=true
  (for contrast, the family that DOES hold these:)
  t('priority.low') ns=assignments -> "Low"
```

## Parity, parsing, build, and scope

The exact recursive leaf walk used by the lane counted arrays consistently and printed:

```text
PARITY-OK checked=16753
```

All locale JSON parsed:

```text
JSON-OK files=258
```

`git diff --check` passed. The product commit hook ran Prettier and the full Turbo build; the
agent-runtime, backend, and frontend builds completed successfully. The existing PDF import,
generated-CSS, circular-chunk, and Knip inventory warnings remained non-fatal.

The diff from the task base contains exactly the six paired locale files and no source file:

```text
SOURCE-DIFF-OK
frontend/src/i18n/ar/common.json
frontend/src/i18n/ar/dossier-recommendations.json
frontend/src/i18n/ar/operations-hub.json
frontend/src/i18n/en/common.json
frontend/src/i18n/en/dossier-recommendations.json
frontend/src/i18n/en/operations-hub.json
```

No source file changed.

## Explicit later-task handoff

- P99-12/P99-13 own the 13 remaining dynamic task/queue/commitment carriers printed above.
- P99-17/P99-18/P99-19 own the common/chrome source rewrites, including the collision-safe
  `intelligence.classification.label` repoint.
- The deletion lanes still own every second-argument removal outside their named atomic units.
