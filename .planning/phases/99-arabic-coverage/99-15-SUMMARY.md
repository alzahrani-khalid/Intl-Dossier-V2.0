# Phase 99-15: residual and missAll authoring

Status: complete. Product changes landed in `1ec644df5` (`feat(i18n): author remaining missAll
view keys`). This task changed locale JSON only; this summary is the documentation-only follow-up.

P99-14 had already authored the 14 absent de-prefixed paths and 21 of the 23 re-derived missAll
paths. P99-15 did not carry that result forward as proof: it reran the flatten and live-source
derivations before P99-16, found the remaining `actions.gridView` and `actions.listView` leaves
missing in both locales, and authored those four strings. The English values are byte-identical to
the source defaults: `Grid view` and `List view`.

## Authoring queue derivation

The unscoped strict audit ran over the current tree and printed:

```text
UNSCOPED scannedFiles=1714 twoArg=154/2082 rawKey=80/6497 en/ar=154/154,80/80
```

The unresolved repository-wide remainder belongs to the source-rewrite, tasks/queues, and later
family lanes. Within this task's residual/missAll population, comparing the live-source paths with
the P99-15 base locale bundle produced the complete task queue and its namespace breakdown:

```text
AUTHORING-QUEUE base=4c6eef985 namespace=common distinct=2 [actions.gridView, actions.listView]
AUTHORING-QUEUE TOTAL=2
OWNED-QUEUE-OK remaining=0
```

Both keys originate in `AvailabilityPollingPage.tsx` as explicit `common.actions.*` dot paths, so
their post-flatten owner is the `common` namespace root. P99-14's other long-tail keys remain in
their bound small namespaces (guided-tours, forms, admin, and friends); no such target was missing
from this task's re-derived residual population.

The authored paired values are:

```text
en actions.gridView="Grid view"
en actions.listView="List view"
ar actions.gridView="عرض الشبكة"
ar actions.listView="عرض القائمة"
```

## Colon-residual proof

The fixed pre-flatten base and the actual flatten diff were read directly. Removed
`common:common.X` calls supplied the site/key population; the old nested subtree decided which
paths were free rides and which were authoring handoffs. The task-local oracle printed:

```text
DEPREFIX-DERIVATION base=4cdfdf28725f4c48d00ccb6f7aec2084f032d6cb flatten=be5a02c46 sites=100 distinct=37
NESTED-PRESENT sites=79 distinct=23
AUTHORING-HANDOFF sites=21 distinct=14
NESTED-ACTIONS count=9 [closeDialog, collapse, expand, next, openMenu, previous, remove, toggleSection, viewMore]
AUTHORED [actions.approve, actions.complete, actions.copy, actions.dismiss, actions.generate, actions.moveUp, actions.refresh, actions.reject, actions.test, actions.thumbsDown, actions.thumbsUp, actions.toggleWatch, actions.viewDetails, success]
en DEPREFIX-CURRENT checked=37 missing=0
ar DEPREFIX-CURRENT checked=37 missing=0
```

This independently disproves the old claim that the nested subtree carried no `actions.*` keys:
it carried exactly nine. Every one of the 37 distinct double-prefixed paths now exists at its
de-prefixed flattened-root destination in both locales. The `common.error` scalar is checked at
its ruled collision-safe destination, `error.label`.

## missAll dot-common proof

The live strict-audit rows whose literal paths begin `common.` supplied this population. The
enumerated untouched list in the plan contains 13 names despite calling itself “14”; the task
counts the re-derived names rather than repeating that arithmetic typo. The ending oracle printed:

```text
MISSALL-DERIVATION sourceSites=26 distinct=23
EXPLICIT-ROOT count=13 [noResults, goBack, collapse, expand, add, more, cardView, tableView, toggleColumns, firstPage, previousPage, nextPage, lastPage]
REST count=10 [actions.clearHistory, actions.gridView, actions.listView, actions.moreInfo, cancel, days, manage, seeReport, unknown, viewAll]
en MISSALL-CURRENT checked=23 missing=0 []
ar MISSALL-CURRENT checked=23 missing=0 []
```

The inversion/root guard then printed:

```text
AUTHOR-OK locales=2 explicitRoot=13 residualViews=2 inversionGuard=held
```

It checks that no top-level `common` key exists, `error.label` and `search.label` survive, the 13
explicit root paths and the two newly authored action-view paths exist in both locales, and
neither `priority` nor `work_item` was authored into common.

## Navigation and raw-key inherited controls

Navigation references were re-extracted from every `labelKey` and `tooltipKey` in
`navigationData.ts`, then crossed with both locale bundles:

```text
NAV-DERIVATION refs=32
en NAV-CURRENT missing=0 []
en navigation.dashboardOverview="Dashboard Overview"
en navigation.taskQueue="Task Queue"
en navigation.taskEscalations="Task Escalations"
en navigation.workflow="Workflow"
ar NAV-CURRENT missing=0 []
ar navigation.dashboardOverview="نظرة عامة على لوحة الدوسيهات"
ar navigation.taskQueue="قائمة المهام"
ar navigation.taskEscalations="تصعيدات المهام"
ar navigation.workflow="سير العمل"
```

The five non-test raw-key sites remain paired and present:

```text
en NONTEST-RAW sites=5 missing=0
ar NONTEST-RAW sites=5 missing=0
frontend/src/components/active-filters/useActiveFilters.ts:179 -> from
frontend/src/components/active-filters/useActiveFilters.ts:189 -> to
frontend/src/components/signals/SignalRow.tsx:68 -> badge.sensitivity
frontend/src/components/signals/SignalRow.tsx:88 -> badge.aiConfidenceAria
frontend/src/components/signals/SignalRow.tsx:90 -> badge.aiConfidence
TEST-POLICY exclude=__tests__,*.test.* from shipped-key authoring queue
```

The policy applies to both static audit classes: test mock keys do not enter the shipped locale
bundle.

## Acceptance oracle and positive controls

The strict instrument self-check passed all checks:

```text
STRICT-SELF-CHECK PASS checks=13/13
```

The six heaviest authoring-only consumers supplied a non-vacuous mask population and zero misses
in both locales:

```text
HEAVY-CONSUMERS files=6 twoArgTotal=31 rawKeyTotal=98 unresolved=en:0/0,ar:0/0
```

The plan's exact combined acceptance command exited 0 and printed its whole-bundle positive
control:

```text
PARITY-OK checked=16723
```

All 258 locale JSON files parse:

```text
JSON-OK files=258
```

The negative control remained deliberately unresolved:

```text
  TaskCard t('priority.low') ns=translation -> "priority.low"  MISS=true
  TaskCard t('status.in_progress') ns=translation -> "status.in_progress"  MISS=true
  TaskCard t('work_item.task') ns=translation -> "work_item.task"  MISS=true
NEG-TASKCARD missTrue=3
```

## Scope and build

The product diff from the task base contains only the two allowlisted locale files and no source
file:

```text
SOURCE-DIFF-OK
frontend/src/i18n/ar/common.json
frontend/src/i18n/en/common.json
```

`git diff --check` passed. The product commit hook ran Prettier and the full Turbo build; all three
package builds completed successfully. Existing PDF import, generated-CSS, circular-chunk, and
Knip inventory warnings remained non-fatal.

No source file changed.

## Explicit later-task handoff

P99-16 still owns the four common-owner dynamic carriers and the chrome literal keys. The
instrument was run with both control polarities before its live census and reported:

```text
CONTROL resolves(intelligence-signals, "severity") = True (expect True)
CONTROL resolves(common, "waitingQueue.statuses")  = True (expect True)
CONTROL resolves(common, "waitingQueue.status")    = False (expect False)
CONTROL resolves(common, "waitingQueue.priority")  = False (expect False)
UNRESOLVED dynamic t() key prefixes: 17 total  (13 mask a raw value -> criterion 1; 4 render a RAW KEY -> criterion 2)
```

P99-17/18 own the corresponding source rewrites and later fallback deletion. No later task needs
to author any de-prefixed or missAll key recorded here.
