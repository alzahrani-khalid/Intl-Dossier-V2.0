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

PROVENANCE: isolated git worktree at 4cdfdf28725f4c48d00ccb6f7aec2084f032d6cb

Owed class = the fixed pre-flatten nested-subtree universe x first-defined namespace resolution over the real en and ar resource bundles. Each locale walks a static namespace list in order; a scalar or object definition stops that locale's walk, object returns are marked, and divergent locale outcomes remain separate. Explicit key prefixes override invisible bindings. Dynamic namespace arrays, non-literal keys, and generic property access remain named blind populations rather than entering the resolved partitions.

- Pre-flatten (`--base 4cdfdf28725f4c48d00ccb6f7aec2084f032d6cb` in the isolated worktree): exit 1; governed/unrepointed `213/102`, partitioned `79/52 commonColonResolved + 5/2 translationColonExplicit + 125/48 dotForm + 4/2 nsOption`; `doublePrefixed=105`; `scannedFiles=1716 literalKeyCalls=8598 nonLiteralKeyCalls=725`.
- The full `common:common.*` de-prefix class is `100/59`, split into `79/52` resolved and `21/14` outside the governed universe.
- Pre-flatten blind ledger: dynamic namespace `276/27` (`236/25` literal-key + `40/16` non-literal-key), non-literal key `725/295`, property access `0/0`, union `961/303`.
- Post-flatten (`--base 4cdfdf28725f4c48d00ccb6f7aec2084f032d6cb`): exit 0; `governed=213/102 scannedFiles=1716 literalKeyCalls=8598 nonLiteralKeyCalls=725 unrepointed=[] doublePrefixed=0`; dynamic namespace `274/27` (`234/25` literal-key + `40/16` non-literal-key), non-literal key `725/295`, property access `0/0`, blind union `959/303`; `localeDivergent` is emitted as a per-locale array.
- `--self-check --json`: exactly nine positives and an exact seven-row passing control ledger: later-common, scalar-shadow, object-shadow, locale-divergent, dynamic-array, property-access, non-literal.
- Fail-closed: `--base definitely-not-a-ref` exits nonzero without a report.
- Retired: the 130/50 regex census and the prior attempt's 139/54 claim are not this instrument's outputs; withdrawn.

## Boundary corrections (same commit)

BOUNDARY EXCEPTION: frontend/src/routes/__root.tsx common:dashboard.title preserved because common.dashboard was absent pre-flatten and the dot form rendered English on the Arabic root navigation

- 7 foreign-namespace sites restored byte-identical to base — SLADashboardPage `common.actions` (sla.common.actions = "Actions"; the colon form hit the root OBJECT, rendering `returned an object instead of string`), SLAPolicyForm cancel/saving/save, ImportDialog cancel/back/close. The census's foreign-namespace negative control guards the class.
- Absent-root keys stay in the common-owner lane: AgingIndicator and AssignmentDetailsModal keep `t('common.days','days')` — `common.days` was absent pre-flatten, root `days` is a weekday OBJECT. The plan's post-flatten regex walk reports `owed=2` here; the controlled census correctly does not.

## Keep-true guards (neither can see this change)

- `resolve-check.mjs`: `214 lookups across 11 routings x 2 locales — routings with a miss: 0`.
- `neg-taskcard.mjs`: 3 `MISS=true` lines (`priority.low`, `status.in_progress`, `work_item.task`) — still discriminating.
- `pnpm --dir frontend type-check` exit 0; `git diff --check` exit 0.

## Handoff (common-owner lane)

Author `actions.{approve,complete,copy,dismiss,generate,moveUp,refresh,reject,test,thumbsDown,thumbsUp,toggleWatch,viewDetails}` and `success`; the untouched absent dot paths `actions.clearHistory`, `actions.moreInfo`, `add`, `cardView`, `collapse`, `expand`, `firstPage`, `goBack`, `lastPage`, `manage`, `more`, `nextPage`, `noResults`, `previousPage`, `seeReport`, `tableView`, `toggleColumns`, `unknown`, `viewAll`; and `days` for the two waiting-queue sites.
