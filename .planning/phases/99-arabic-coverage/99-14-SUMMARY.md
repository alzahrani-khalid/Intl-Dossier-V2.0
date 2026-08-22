# Phase 99-14: common-owner long tail and navigation authoring

Status: complete. Product changes landed in `370795bb3` (`feat(i18n): author common owner long
tail`). This task changed JSON only. Its second commit adds this summary.

## Population and derivation

The starting tree was clean. The unscoped strict audit ran against 1,714 TypeScript source files
and reported this verbatim header:

```text
strict i18n audit: 1714 file(s); 305/2082 two-arg masks unresolved
mask shapes literal/options-default: 249/1768 and 56/314
259/6497 raw-key sites unresolved
EN/AR two-arg: 305/305
EN/AR raw-key: 259/259
binding defect population: 158 files (47 array + 111 bare)
canonical binding reclassified sites: 1 two-arg / 35 raw-key
loose-hidden two-arg/raw-key: 0/2
```

The queue was derived from that unscoped result, not copied from research:

1. Exclude every source file in the intake/triage, dossier-family, and tasks/queues/positions
   authoring lanes (P99-08 through P99-13). P99-12/13 had not landed in this worktree, so their
   files were subtracted rather than incorrectly authored into `common`.
2. Exclude both `__tests__` and `*.test.*` from the mask and raw-key classes. This removed the 12
   raw-key mock sites in the six DossierDrawer test files and the one masked DossierPicker test
   site. Test mocks are outside the shipped-bundle population.
3. Honor static `{ ns: '...' }` overrides before selecting a destination. This removes the
   strict instrument's known static-option false positives, including already-authored
   `relationships:messages.*` and the `unified-kanban` options in ActionBuilder.
4. For effective namespace `common`, de-prefix a leading `common.` from the path. Thus
   `common.actions.moreInfo` authors `actions.moreInfo` at the flattened namespace root, never a
   new `common` subtree.
5. Exclude `errors.pageNotFound{,Description}`: P99-17/18 repoints those source masks to the
   already-existing post-flatten `notFound.{title,message}` leaves.
6. Add the four dynamic navigation references re-derived from `navigationData.ts` because the
   literal-key audit cannot see `t(item.labelKey, ...)`.

The resulting static queue was 317 distinct keys. Its per-namespace breakdown was:

```text
actionable-errors  1
admin              6
ai-admin           2
briefing-books     1
common             266
dashboard-widgets  2
entity-linking     1
field-permissions  3
forums             3
guided-tours       2
milestone-planning 2
operations-hub     2
progressive-disclosure 6
settings           2
tags               2
validation         11
workflow-automation 5
TOTAL              317
```

Adding the four navigation references produced 321 distinct key paths authored in each locale
(642 locale leaves). The authoring command printed:

```text
AUTHORED distinct=321
actionable-errors=1
admin=6
ai-admin=2
briefing-books=1
common=270
dashboard-widgets=2
entity-linking=1
field-permissions=3
forums=3
guided-tours=2
milestone-planning=2
operations-hub=2
progressive-disclosure=6
settings=2
tags=2
validation=11
workflow-automation=5
TOUCHED namespaces=actionable-errors,admin,ai-admin,briefing-books,common,dashboard-widgets,entity-linking,field-permissions,forums,guided-tours,milestone-planning,operations-hub,progressive-disclosure,settings,tags,validation,workflow-automation
```

English values are byte-identical to the source mask literal wherever one exists, except where
multiple sites supplied conflicting defaults. For those two keys, `search.search` uses the stable
label `Search`, and `afterActions.conflict.warning` uses the longer complete warning. Raw-key
values were authored as UI copy in both locales. Arabic uses the ruled terms, including `دوسيه`,
`مهمة`, `موقف`, and `مشاركة`, and follows the neutral sentence-case voice.

Two pre-existing JSON shape defects needed a non-source repair. `actionable-errors` carried a
scalar `fixAll` plus a literal dotted key `fixAll.short`; it now has plural siblings preserving
the counted label and the nested `fixAll.short` shape. `tags.search.noResults` was a scalar but
the live consumer requests `tags:search.noResults.title`; it is now the corresponding object.

The ending corrected queue check printed:

```text
OWNED-QUEUE-OK remaining=0
```

## Navigation and post-flatten guards

The navigation population was re-derived by extracting every `labelKey` and `tooltipKey` from
`navigationData.ts` and crossing the 32 distinct references with both copies of `common.json`.
The before/after output was:

```text
HEAD en navigation refs=32 missing=4 [navigation.dashboardOverview, navigation.workflow, navigation.taskQueue, navigation.taskEscalations]
HEAD ar navigation refs=32 missing=4 [navigation.dashboardOverview, navigation.workflow, navigation.taskQueue, navigation.taskEscalations]
WORKTREE en navigation refs=32 missing=0 []
WORKTREE ar navigation refs=32 missing=0 []
```

The four authored values are:

| Key                            | English            | Arabic                       |
| ------------------------------ | ------------------ | ---------------------------- |
| `navigation.dashboardOverview` | Dashboard Overview | نظرة عامة على لوحة الدوسيهات |
| `navigation.taskQueue`         | Task Queue         | قائمة المهام                 |
| `navigation.taskEscalations`   | Task Escalations   | تصعيدات المهام               |
| `navigation.workflow`          | Workflow           | سير العمل                    |

The exact authoring oracle printed:

```text
AUTHOR-OK
```

The authoring oracle checked, in both locales: no top-level `common`; `error.label` and
`search.label` survived; all four nav keys exist; all thirteen root missAll keys exist; and
neither `priority` nor `work_item` was authored into common.

## missAll and de-prefixed residuals

The thirteen flattened-root missAll keys authored in both locales are:

`noResults`, `goBack`, `collapse`, `expand`, `add`, `more`, `cardView`, `tableView`,
`toggleColumns`, `firstPage`, `previousPage`, `nextPage`, `lastPage`.

The flatten handoff was rechecked as 34 de-prefixed paths in each locale, with this output:

```text
en DEPREFIXED residual=34 missing=0 daysType=object
ar DEPREFIXED residual=34 missing=0 daysType=object
```

The complete checked set is:

`actions.approve`, `actions.complete`, `actions.copy`, `actions.dismiss`, `actions.generate`,
`actions.moveUp`, `actions.refresh`, `actions.reject`, `actions.test`, `actions.thumbsDown`,
`actions.thumbsUp`, `actions.toggleWatch`, `actions.viewDetails`, `success`,
`actions.clearHistory`, `actions.moreInfo`, `add`, `cardView`, `collapse`, `expand`, `firstPage`,
`goBack`, `lastPage`, `manage`, `more`, `nextPage`, `noResults`, `previousPage`, `seeReport`,
`tableView`, `toggleColumns`, `unknown`, `viewAll`, and `days`.

`days` remains the existing weekday object at the flattened root. Replacing it with the scalar
`days` would destroy live weekday leaves; the path exists and the tasks lane must repoint its two
scalar consumers rather than invert the object back into a scalar.

The five non-test raw-key sites called out by the plan now resolve through common:

- `components/active-filters/useActiveFilters.ts:179` → `from`
- `components/active-filters/useActiveFilters.ts:189` → `to`
- `components/signals/SignalRow.tsx:68` → `badge.sensitivity`
- `components/signals/SignalRow.tsx:88` → `badge.aiConfidenceAria`
- `components/signals/SignalRow.tsx:90` → `badge.aiConfidence`

## Controls and verification

The strict instrument self-check printed `"selfCheck": "PASS"` with every check true, including
array bindings, bare `translation` binding, the translation/common alias, both locales, and both
mask shapes.

The six heaviest authoring-only consumers now print:

```text
HEAVY-CONSUMERS files=6 twoArgTotal=31 twoArgUnresolved=0 rawKeyUnresolved=0 en/ar=0/0,0/0
```

Full repository English-to-Arabic leaf parity printed:

```text
PARITY-OK checked=16721
```

The negative control remained deliberately unresolved and printed exactly three `MISS=true`
lines:

```text
🌐 i18next is made possible by our own product, Locize — consider powering your project with managed localization (AI, CDN, integrations): https://locize.com 💙
  TaskCard t('priority.low') ns=translation -> "priority.low"  MISS=true
  TaskCard t('status.in_progress') ns=translation -> "status.in_progress"  MISS=true
  TaskCard t('work_item.task') ns=translation -> "work_item.task"  MISS=true
  (for contrast, the family that DOES hold these:)
  t('priority.low') ns=assignments -> "Low"
```

The dynamic-prefix instrument's control and ending population were:

```text
CONTROL resolves(intelligence-signals, "severity") = True (expect True)
CONTROL resolves(common, "waitingQueue.statuses")  = True (expect True)
CONTROL resolves(common, "waitingQueue.status")    = False (expect False)
CONTROL resolves(common, "waitingQueue.priority")  = False (expect False)
UNRESOLVED dynamic t() key prefixes: 17 total  (13 mask a raw value -> criterion 1; 4 render a RAW KEY -> criterion 2)
```

Those 17 are intentionally unchanged. The tasks/queues/positions carriers belong to P99-12/13;
the four remaining common-owner carriers (`entityTypes`, recommendation `types`,
`intelligence.classification`, and operations-hub `stages`) and their full enum sets belong to
P99-16. The chrome literal keys also belong to P99-16.

JSON parsing, diff whitespace, source isolation, and allowlist checks printed:

```text
JSON-OK
JSON-SCOPE-OK
SOURCE-DIFF-OK
```

The commit hook ran Prettier and the full Turbo build. All three package builds completed
successfully; the existing PDF namespace warning, CSS optimizer warning, circular-chunk warning,
and Knip inventory remained non-fatal.

No source file changed. The product commit contains only allowlisted
`frontend/src/i18n/{en,ar}/*.json` paths; this follow-up commit contains only this summary.

## Explicitly left to later tasks

- P99-12/13: tasks/queues/positions static authoring, routing, and their six carriers.
- P99-16: the four common-owner carrier enum sets and chrome literal keys.
- P99-17/18: missAll/residual source rewrites, navigation unmask, 404 repoint to
  `notFound.*`, carrier rewrites, and chrome extraction.
- All second-argument deletion remains in the ordered deletion lanes. No fallback was deleted
  here.
