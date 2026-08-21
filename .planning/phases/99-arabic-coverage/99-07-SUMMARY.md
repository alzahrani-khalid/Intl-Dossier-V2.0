# P99-07 summary

One atomic commit (the one carrying this file — `git log -1`): both locale flattens, every owed site rewrite, the census instrument, its fixture, this summary. Parent `4cdfdf287` is the pre-flatten base, so no intermediate broken tree exists.

## Flatten (both locales, re-derived in-task at base 4cdfdf287)

- Oracle positive control: `clash({x:"s"},{x:{y:1}})` -> `["x:string/object"]` — it sees a scalar-vs-object clash; the child-set comparison that failed this change cannot.
- Clashes at base: en and ar both `["error:string/object","search:string/object"]` — exactly two, no third.
- Result: no top-level `common`; 67 nested leaves moved per locale (54 clean keys to the root); nested `common.error` ("Error"/"خطأ") -> `error.label`, `common.search` ("Search"/"بحث") -> `search.label`, both INSIDE the existing root objects (targets verified absent pre-flatten), leaving root `error` at 2 children and root `search` at 10 children / 12 leaves. No new top-level `common` authored (D-15).
- Post-flatten oracle: `FLATTEN-TYPE-OK`. Probe — en `all="All" notFound.title="Page Not Found" error.label="Error" search.label="Search"`; ar `all="الكل" notFound.title="الصفحة غير موجودة" error.label="خطأ" search.label="بحث"`.

## Relocated-scalar consumers (same commit)

- 5 `t('common.error'…)` sites (DataLibraryPage, MousPage, engagements/$engagementId/after-action, after-actions/$afterActionId, after-actions/$afterActionId/versions) -> `common:error.label`.
- 8 `t('common.search'…)` sites (ToolbarSearch x2, DataTable, ExecutionsTabs, DocumentTree, MousPage, EventsPage, `__root`) -> `common:search.label`; the 404 surface renders بحث through this repoint.
- 2 double-prefixed `t('common:common.error','Error')` sites in ForumDetailsDialog.tsx resolved to the nested scalar pre-flatten, so they de-prefix to `common:error.label`; mechanical `common:error` would hit the root OBJECT. Totals: 7 `common:error.label`, 8 `common:search.label`, zero surviving dot-form `common.error`/`common.search`.

## Controlled AST census (scripts/i18n-binding-census.mjs)

Owed class = pre-flatten nested-subtree universe (re-derived from git) x effective namespace (key prefix, `{ ns }`, scoped hook aliases, array bindings with in-order fallback, multiline calls, configured default `translation`). Figures are instrument output.

- Pre-flatten (committed script vs a pristine `git archive` of 4cdfdf287): exit 1; `unrepointed=213` / 102 files (134 / 52 excluding the `common:common.*` class); `doublePrefixed=105`; `literalKeyCalls=8598 commonNamespaceCalls=1364 nonLiteralKeyCalls=725 dynamicNamespaceCalls=236`.
- Post-flatten (`--base 4cdfdf287`): exit 0; `unrepointed=[] doublePrefixed=0 literalKeyCalls=8598 commonNamespaceCalls=1366 nonLiteralKeyCalls=725 dynamicNamespaceCalls=234`; blind populations on stderr.
- Retired: the 130/50 regex census and the prior attempt's 139/54 claim are not this instrument's outputs; withdrawn.
- `--self-check`: `SELF-CHECK-OK: 9/9 planted positives flagged (key prefix, ns options, hook bindings, scoped alias, multiline, array binding, array-order fallback, default namespace, double prefix), 3/3 negatives rejected (repointed colon form, absent-root key, foreign namespace); doublePrefixed=2; universe=70 paths from 750ef16c3a001a0f542982ba879d8f8f18a1cb63`.
- Fail-closed: `--base definitely-not-a-ref` exits 1 with `CENSUS-FAIL: pre-flatten universe could not be derived …`.

## Boundary corrections (same commit)

- 7 foreign-namespace sites restored byte-identical to base — SLADashboardPage `common.actions` (sla.common.actions = "Actions"; the colon form hit the root OBJECT, rendering `returned an object instead of string`), SLAPolicyForm cancel/saving/save, ImportDialog cancel/back/close. The census's foreign-namespace negative control guards the class.
- Absent-root keys stay in the common-owner lane: AgingIndicator and AssignmentDetailsModal keep `t('common.days','days')` — `common.days` was absent pre-flatten, root `days` is a weekday OBJECT. The plan's post-flatten regex walk reports `owed=2` here; the controlled census correctly does not.

## Keep-true guards (neither can see this change)

- `resolve-check.mjs`: `214 lookups across 11 routings x 2 locales — routings with a miss: 0`.
- `neg-taskcard.mjs`: 3 `MISS=true` lines (`priority.low`, `status.in_progress`, `work_item.task`) — still discriminating.
- `pnpm --dir frontend type-check` exit 0; `git diff --check` exit 0.

## Handoff (common-owner lane)

Author `actions.{approve,complete,copy,dismiss,generate,moveUp,refresh,reject,test,thumbsDown,thumbsUp,toggleWatch,viewDetails}` and `success`; the untouched absent dot paths `actions.clearHistory`, `actions.moreInfo`, `add`, `cardView`, `collapse`, `expand`, `firstPage`, `goBack`, `lastPage`, `manage`, `more`, `nextPage`, `noResults`, `previousPage`, `seeReport`, `tableView`, `toggleColumns`, `unknown`, `viewAll`; and `days` for the two waiting-queue sites.
