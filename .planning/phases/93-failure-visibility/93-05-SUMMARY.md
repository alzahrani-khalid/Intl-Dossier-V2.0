---
phase: 93-failure-visibility
plan: 05
subsystem: api
tags: [supabase, edge-function, postgrest, audit, rls, i18n, error-envelope]

# Dependency graph
requires:
  - phase: 92-deployed-artifact-truth
    provides: scripts/probe-edge-auth.sh — the deployed-artifact probe used as this plan's oracle
provides:
  - audit-logs-viewer reads public.audit_log's real columns (entity_type/action/entity_id/old_values/new_values) and returns 200 with live rows
  - statistics served by the promoted in-file aggregate; the query against the non-existent pre-aggregated relation is deleted
  - bilingual leak-free error envelope on every client-facing path in this function (D-15)
  - whitelisted sort_by / distinct field — bad params are 400s, not 42703-driven 500s
affects: [94-audit-writers, 102-delegations, admin-audit-surface]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'PostgREST select aliasing (`wire_name:real_column`) to keep an external wire contract stable while the DB side is corrected'
    - 'Second keyed query against public.users for user_email/user_role (no declared FK ⇒ no embed) — assumption A2 resolved as predicted'
    - 'Flat bilingual error envelope `{ error, code, message_en, message_ar }` matching frontend/src/lib/api-client.ts ApiErrorBody'

key-files:
  created: []
  modified:
    - supabase/functions/audit-logs-viewer/index.ts

key-decisions:
  - 'External wire names (table_name/operation/row_id/old_data/new_data) PRESERVED via PostgREST aliases — the frontend consumes them today and is outside files_modified; renaming them would have replaced a 500 with a table of blank cells and an unguarded `log.row_id.slice(0,8)` crash'
  - "Error envelope is FLAT ({error, code, message_en, message_ar}), not the nested {error:{...}} of PATTERNS §2 — the house client reads body.message ?? body.message_en ?? body.error, so a nested shape renders '[object Object]'"
  - 'sort_by and distinct field are whitelisted server-side; user_email is deliberately absent from the sort whitelist (it is not a column of audit_log) and returns a clean 400 rather than a silent fallback'
  - "changed_fields / request_id dropped from response + CSV per plan; the enrichment block that derived changes_count/diff_summary from changed_fields was deleted with it (left in place it would have emitted the literal string 'undefined')"

patterns-established:
  - 'Wire-contract preservation: correct the DB side, alias the response, verify the consumer before renaming anything client-facing'
  - 'Forced-error oracle: provoke the real 500 path (invalid timestamp/inet param) to prove the envelope carries no passthrough, rather than trusting a source grep'

requirements-completed: [AUDIT-42703, TRUST-04]

# Metrics
duration: 15 min
completed: 2026-08-15
---

# Phase 93 Plan 05: audit-logs-viewer column remap Summary

**audit-logs-viewer now reads `public.audit_log`'s real columns behind preserved PostgREST aliases — 500 → 200 over 75 live rows, statistics from the promoted in-file aggregate, and the `column audit_log.table_name does not exist` leak gone from every client-facing body.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-08-15T17:24Z (approx — first RED observation logged at the gateway 17:28:56Z)
- **Completed:** 2026-08-15T17:38:31Z
- **Tasks:** 2
- **Files modified:** 1

## THE GATE TABLE (ACCEPTANCE-P93-EXEC condition 1)

Both gates were observed RED **before** any edit. Commands and actual output below.

| gate                                                                                                                                                                                                                                                                                                            | RED before (command + output)                                                                                                                                                                                  | GREEN after (command + output)                                                                                                                                              | notes                                                                                                                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Task 1** `<automated>`<br>`F=supabase/functions/audit-logs-viewer/index.ts && test -f "$F" && grep -q 'entity_type' "$F" && test "$(grep -v '^[[:space:]]*//' "$F" \| grep -cE "'table_name'\|\"table_name\"")" -eq 0 && test "$(grep -v '^[[:space:]]*//' "$F" \| grep -cE "'old_data'\|'new_data'")" -eq 0` | `GATE1 EXIT=1`<br>sub-a file exists: PASS<br>sub-b `grep -c entity_type` → **0** (FAIL)<br>sub-c quoted `table_name` count → **5** (FAIL)<br>sub-d quoted `old_data\|new_data` count → **0** (already passing) | **STILL RED — `GATE1 EXIT=1`**<br>sub-a PASS<br>sub-b `grep -c entity_type` → **10** (PASS)<br>sub-c quoted `table_name` count → **2** (FAIL)<br>sub-d → **0** (PASS)       | **PARKED.** See `GATE CONCERN` #1 — the 2 residual literals are the frontend's query-param name and the CSV header label, not DB column claims. Zeroing them requires breaking the frontend filter contract. Not edited. |
| **Task 2** `<automated>`<br>`... grep -c 'audit_statistics' -eq 0 && ... grep -cE 'details:[[:space:]]*error' -eq 0 && OUT=$(scripts/probe-edge-auth.sh audit-logs-viewer) && echo "$OUT" \| grep -qE 'audit-logs-viewer -> 200'`                                                                               | `GATE2 EXIT=1`<br>`audit_statistics` count → **1** (FAIL)<br>`details: error` count → **0** (already passing)<br>`scripts/probe-edge-auth.sh audit-logs-viewer` → **`audit-logs-viewer -> 500`** (FAIL)        | **`GATE2 EXIT=0`**<br>`audit_statistics` count → **0**<br>`details: error` count → **0**<br>`scripts/probe-edge-auth.sh audit-logs-viewer` → **`audit-logs-viewer -> 200`** | Genuinely flipped by the work. The probe half is the load-bearing oracle.                                                                                                                                                |

### Deployment-level RED→GREEN corroboration (Supabase gateway log, `get_logs edge-function`)

The gateway independently records the flip across the deploy boundary — same function id, different `version`:

```
version 7 (before)  GET | 500 | .../audit-logs-viewer                      ts 1786814936044000 = 2026-08-15T17:28:56Z
version 7 (before)  GET | 500 | .../audit-logs-viewer?limit=2              ts 1786814957774000 = 2026-08-15T17:29:17Z
version 7 (before)  GET | 500 | .../audit-logs-viewer/statistics           ts 1786814960092000 = 2026-08-15T17:29:20Z
version 7 (before)  GET | 500 | .../audit-logs-viewer/distinct/table_name  ts 1786814960866000 = 2026-08-15T17:29:20Z
--- deploy ---
version 8 (after)   GET | 200 | .../audit-logs-viewer                      ts 1786815407801000 = 2026-08-15T17:36:47Z
version 8 (after)   GET | 200 | .../audit-logs-viewer?limit=3              ts 1786815438871000 = 2026-08-15T17:37:18Z
version 8 (after)   GET | 200 | .../audit-logs-viewer?limit=2&table_name=briefs&operation=DELETE
version 8 (after)   GET | 200 | .../audit-logs-viewer/distinct/table_name
version 8 (after)   GET | 400 | .../audit-logs-viewer?sort_by=nonexistent_column
version 8 (after)   GET | 404 | .../audit-logs-viewer/00000000-0000-0000-0000-000000000000
```

## GATE CONCERN

Three findings. **No gate text was edited.** The orchestrator rules.

### 1. Task-1 gate cannot reach zero with correct work — PARK, not a fix

The sub-check `grep -cE "'table_name'|\"table_name\"" == 0` still counts **2** occurrences:

```
247:    'table_name',                                       # CSV header label
587:      table_name: url.searchParams.get('table_name') || undefined,   # QUERY-PARAM name
```

Neither is a DB column claim. Every DB query in the file names only real columns — verified:

```
$ grep -nE "\.eq\('|\.select\('|\.ilike\('|\.order\(|\.in\('" "$F" | grep -E "table_name|operation|row_id|old_data|new_data|changed_fields|user_role|request_id"
190:    query = query.eq('entity_type', filters.table_name)     # operand is the REAL column
203:    query = query.eq('action', filters.operation)
219:    query = query.eq('entity_id', filters.row_id)
353:    .select('id, timestamp, operation:action, user_id')
354:    .eq('entity_type', data.table_name)
355:    .eq('entity_id', data.row_id)
```

Line 587 is **irreducible**: the frontend sends `?table_name=…` today
(`frontend/src/pages/audit-logs/AuditLogsPage.tsx:94` → `useAuditLogs` →
`audit.repository.getAuditLogs`). Renaming the accepted param would make the filter
silently stop working — i.e. manufacture a _new_ instance of the exact defect class the
intended-broken register records for `/admin/field-permissions` ("filters are silently
never sent"). The frontend is outside this plan's `files_modified`.

The gate's own acceptance text draws this distinction — "the frontend's display labels,
which are its own vocabulary and not a DB column claim" — but scopes the carve-out to
_outside_ this file. Two external-vocabulary literals live _inside_ it. The planner's
enumerated edit sites (`:73-74`, `:106-107`, `:125,140`) never included the URL-param
reader at the original `:416`, so the zero-count expectation appears to have simply
overlooked it.

**I did not restructure the code to dodge the grep.** Any honest representation of the
string `table_name` contains the string; the only way to zero the count is to break the
client contract. Parked for a ruling.

### 2. Task-1 sub-check `'old_data'|'new_data'` was VACUOUS — 0 before the work

It counted **0** on the pre-work file. The phantom columns lived inside a backtick
template literal (`old_data,` / `new_data,` in the multi-line select), never as
single-quoted string literals, so this sub-check could never have caught the defect it
was written for. It is not a regression guard either — it guards a shape the file never had.

### 3. Task-2 sub-check `details:[[:space:]]*error` was VACUOUS — 0 before the work

Also **0** on the pre-work file. This function never used the object-literal
`details: error` form of the leak; it used the **4th positional argument** of the shared
helper — `errorResponse('Failed to fetch audit logs', 500, 'DB_ERROR', error)` — which
`supabase/functions/_shared/utils.ts:29-47` spreads into `...(details && { details })`.
The grep is shape-specific to `data-retention`'s envelope and blind to this file's.

The real leak was therefore verified **live**, not by grep — see below. Criterion 5 is
discharged by observation, not by this sub-check.

## Criterion 5 — the leak, verified live (before and after)

**BEFORE** (deployed version 7, authenticated admin call, captured 2026-08-15T17:29Z):

```
### GET /functions/v1/audit-logs-viewer?limit=2
{"error":"Failed to fetch audit logs","code":"DB_ERROR","details":{"code":"42703","details":null,"hint":null,"message":"column audit_log.table_name does not exist"}}
<<HTTP 500>>

### GET /functions/v1/audit-logs-viewer/statistics
{"error":"Failed to fetch statistics","code":"DB_ERROR","details":{"code":"42703","details":null,"hint":null,"message":"column audit_log.table_name does not exist"}}
<<HTTP 500>>

### GET /functions/v1/audit-logs-viewer/distinct/table_name
{"error":"Failed to fetch distinct values","code":"DB_ERROR","details":{"code":"42703","details":null,"hint":null,"message":"column audit_log.table_name does not exist"}}
<<HTTP 500>>
```

Internal column name **and** raw SQLSTATE shipped to the browser.

**AFTER** (deployed version 8). The 42703 is gone, so the DB_ERROR path was **forced** with
a param Postgres cannot parse, to exercise the exact `errorEnvelope(500, 'DB_ERROR', …, error)`
site rather than trust the source:

```
### GET /audit-logs-viewer?date_from=not-a-timestamp
{"error":"Failed to fetch audit logs","code":"DB_ERROR","message_en":"Failed to fetch audit logs","message_ar":"فشل في جلب سجلات التدقيق"}
<<HTTP 500>>

### GET /audit-logs-viewer?ip_address=not-an-ip
{"error":"Failed to fetch audit logs","code":"DB_ERROR","message_en":"Failed to fetch audit logs","message_ar":"فشل في جلب سجلات التدقيق"}
<<HTTP 500>>

### GET /audit-logs-viewer?sort_by=nonexistent_column
{"error":"Unsupported sort field. Allowed: timestamp, table_name, operation, row_id, user_id, ip_address","code":"INVALID_SORT_FIELD","message_en":"Unsupported sort field. Allowed: timestamp, table_name, operation, row_id, user_id, ip_address","message_ar":"حقل ترتيب غير مدعوم. المسموح: timestamp, table_name, operation, row_id, user_id, ip_address"}
<<HTTP 400>>

### GET /audit-logs-viewer/distinct/user_role
{"error":"Unsupported field. Allowed: table_name, operation","code":"INVALID_FIELD","message_en":"Unsupported field. Allowed: table_name, operation","message_ar":"حقل غير مدعوم. المسموح: table_name, operation"}
<<HTTP 400>>

### GET /audit-logs-viewer/00000000-0000-0000-0000-000000000000
{"error":"Audit log not found","code":"NOT_FOUND","message_en":"Audit log not found","message_ar":"سجل التدقيق غير موجود"}
<<HTTP 404>>
```

Automated leak scan over four live bodies (searching `42703|42P01|22007|does not exist|"details"|audit_log.|entity_type|old_values|new_values`):

```
  ?limit=1                    -> leak-tokens: [NONE]
  ?date_from=not-a-timestamp  -> leak-tokens: [NONE]
  /statistics                 -> leak-tokens: [NONE]
  ?sort_by=bogus              -> leak-tokens: [NONE]
```

Diagnostics still reach the function log (`log('error', \`audit-logs-viewer: ${code}\`, { diagnostic })`).

## Row-presence evidence (≥1 of the 75 live rows) — what the status-only gate cannot see

`GET /audit-logs-viewer?limit=3`, projected (the `old_data`/`new_data` jsonb payloads elided
for length; presence flags retained):

```json
{
  "rows": [
    {
      "id": "632fe2b5-8364-42f2-ab74-498823361b4d",
      "table_name": "tasks",
      "operation": "UPDATE",
      "row_id": "b0000004-0000-0000-0000-000000000003",
      "user_id": "de2734cf-f962-4e05-bf62-bc9e92efff96",
      "user_email": "kazahrani@stats.gov.sa",
      "user_role": "admin",
      "timestamp": "2026-08-14T21:53:05.865061+00:00",
      "session_id": null,
      "ip_address": null
    },
    {
      "id": "37deb453-21ba-4322-b3d1-a7d2aa238737",
      "table_name": "tasks",
      "operation": "UPDATE",
      "...": "..."
    },
    {
      "id": "9c37a2bf-14d7-4a43-ba29-cec501cbdb06",
      "table_name": "briefs",
      "operation": "INSERT",
      "...": "..."
    }
  ],
  "old_data_present": [true, true, false],
  "new_data_present": [true, true, true],
  "metadata": { "total": 75, "limit": 3, "offset": 0, "has_more": true }
}
```

`metadata.total` is **75** — byte-identical to the live count
(`select count(*) from public.audit_log` → `{"total":75,"newest":"2026-08-14 21:53:05.865061+00"}`),
and the newest row's `timestamp` matches `newest` exactly. `old_data`/`new_data` carry real
jsonb (INSERT has no `old_data`, DELETE has no `new_data` — consistent with the trigger).

**Filter correctness cross-check against the DB, not just the wire:**

```
DB:   select entity_type, action, count(*) ... → briefs/DELETE n=18
WIRE: GET ?limit=2&table_name=briefs&operation=DELETE → metadata.total = 18   ✓
```

**Distinct + CSV export:**

```
### GET /audit-logs-viewer/distinct/table_name
{"data":["briefs","mous","tasks"]}         # matches the DB's three entity_type values

### GET /audit-logs-viewer/export?format=csv&table_name=mous
id,timestamp,table_name,operation,row_id,user_email,user_role,ip_address
"f6879c56-...","2026-07-06T19:05:12.443725+00:00","mous","INSERT","a054c7c4-...","kazahrani@stats.gov.sa","admin",""
"87e96b3f-...","2026-06-29T19:09:59.618819+00:00","mous","INSERT","e4aa70f2-...","kazahrani@stats.gov.sa","admin",""
```

**Statistics (promoted aggregate, default 30-day window):**

```
{"data":{"period":{"from":"2026-07-16T17:37:01.420Z","to":"2026-08-15T17:37:01.420Z"},
         "by_operation":[{"operation":"UPDATE","count":2,"tables_affected":1},
                         {"operation":"INSERT","count":1,"tables_affected":1}],
         "total_events":3}}
```

3 events, not 75, because the default window is the last 30 days and most seeded rows predate it.
That is the aggregate telling the truth about its window, not an undercount.

## Deploy evidence

```
$ supabase functions deploy audit-logs-viewer --project-ref zkrcjzdemdmwhearhfgg
Bundling Function: audit-logs-viewer
Deploying Function: audit-logs-viewer (script size: 746.1kB)
Deployed Functions on project zkrcjzdemdmwhearhfgg: audit-logs-viewer
```

`list_edge_functions` (slug `audit-logs-viewer`):

```
version:    8              (was 7 — every RED probe above is tagged version 7)
status:     ACTIVE
updated_at: 1786815371438  → 2026-08-15T17:36:11.438Z
```

## Task Commits

Both tasks edit the same single file and were applied as one coherent rewrite, so they share
one production commit (deviation from strict per-task commits — noted below):

1. **Task 1 + Task 2 (source)** — `157b0455` (fix)
   `fix(93-05): remap audit-logs-viewer onto real audit_log columns; leak-free envelopes`

Task 2's remaining actions (deploy, probe) produce no commit.

**Files in that commit, pinned to the sha** (HEAD has since moved — sibling lanes are
committing into this tree concurrently):

```
$ git show --name-only --format="" 157b0455
supabase/functions/audit-logs-viewer/index.ts
```

Exactly one file. No sibling-lane work was swept in.

## Files Created/Modified

- `supabase/functions/audit-logs-viewer/index.ts` — DB side remapped to `audit_log`'s real
  columns; wire contract preserved by aliases; statistics aggregate promoted; every
  client-facing error replaced with a bilingual leak-free envelope; `sort_by` and the
  `distinct` field whitelisted.

## Wire contract: preserved vs renamed (the plan asked for this explicitly)

The plan permits keeping external names "only if the frontend consumes them today". It does —
verified before touching anything:

| external name                                    | consumed at                                                                                                   | DB column now queried                           | verdict                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------- |
| `table_name` (response + query param + sort key) | `types/audit-log.types.ts:21`, `AuditLogTable.tsx:246`, `AuditLogFilters.tsx:248-264`, `AuditLogsPage.tsx:94` | `entity_type`                                   | **PRESERVED** (alias)         |
| `operation`                                      | `AuditLogTable.tsx:218,254,347`, `AuditLogStatistics.tsx:145-159`                                             | `action`                                        | **PRESERVED** (alias)         |
| `row_id`                                         | `AuditLogTable.tsx:393` — **unguarded `log.row_id.slice(0,8)`**                                               | `entity_id`                                     | **PRESERVED** (alias)         |
| `old_data` / `new_data`                          | `AuditLogTable.tsx:339-340`                                                                                   | `old_values` / `new_values`                     | **PRESERVED** (alias)         |
| `user_email` / `user_role`                       | `AuditLogTable.tsx:263`, CSV                                                                                  | second keyed query on `public.users`            | **PRESERVED** (derived)       |
| `changed_fields`                                 | `AuditLogTable.tsx:220,282-285,338`                                                                           | — (does not exist)                              | **DROPPED** per plan          |
| `request_id`                                     | `AuditLogTable.tsx:387` (guarded)                                                                             | — (`additional_context` is NULL on all 75 rows) | **DROPPED** per plan          |
| `changes_count` / `diff_summary`                 | `AuditLogTable.tsx:282`                                                                                       | derived from `changed_fields`                   | **DROPPED** (see deviation 1) |

`row_id` is the decisive one: renaming it would have thrown `Cannot read properties of
undefined (reading 'slice')` in the expanded row, converting a visible 500 into a client-side
crash. Aliasing was the only option that does not require editing the frontend.

## Decisions Made

- **Aliases, not renames.** `wire_name:real_column` in every select. The DB is queried
  honestly; the client contract is untouched; no frontend edit needed (and none permitted).
- **Flat error envelope.** `{ error, code, message_en, message_ar }`. PATTERNS §2 shows the
  nested `{ error: { code, message_en, message_ar } }` form from `data-retention`, but
  `frontend/src/lib/api-client.ts:88-96` resolves `body.message ?? body.message_en ?? body.error`
  — a nested `error` object would surface as `[object Object]` in the page's error state
  (`AuditLogsPage.tsx:251`). Flat matches the declared `ApiErrorBody` interface
  (`api-client.ts:22-27`) and is the house contract.
- **Whitelist rather than pass through.** `sort_by` and `distinct/:field` were previously
  handed to PostgREST verbatim — a client-chosen column name straight into `.order()`. Now
  mapped through `SORTABLE_FIELDS` / `DISTINCT_FIELDS`; unknown values return 400. The allowed
  lists in the message are the public query-param vocabulary, not internal columns, so the
  message leaks nothing.
- **`user_email` is not sortable.** It lives in `public.users`. `AuditLogTable.tsx:200` offers
  a "User" sort header, which will now return a clean 400 instead of the 500 it returned
  before. Chosen over silently falling back to `timestamp` (a lie) or ordering by `user_id`
  while claiming to order by email (also a lie). Listed under Known Limitations.
- **Statistics promoted verbatim.** D-26 — the in-file aggregate at the old `:284-300` became
  the only path, with only the column remap (`table_name→entity_type`, `operation→action`)
  needed to make it run. Its output shape is unchanged, which means it emits no `by_table`
  key. `AuditLogStatistics.tsx:112` guards on `statistics.by_table`, so the "Top tables"
  panel stays hidden — exactly as it has been, since the statistics route has 500'd since
  deployment. Adding `by_table` would be _authoring_ a new aggregate, which D-26 forbids.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed the `changes_count` / `diff_summary` enrichment block**

- **Found during:** Task 1
- **Issue:** The plan says to drop `changed_fields`. The enrichment block at the old
  `:171-179` derived `changes_count` and `diff_summary` _from_ it. Left in place with
  `changed_fields` gone, `diff_summary` evaluates to
  `undefined?.slice(0,3).join(', ') + ''` → the literal string `"undefined"`, which
  `AuditLogTable.tsx:282` renders directly into the Changes cell.
- **Fix:** Deleted the enrichment block along with the field. `hasChanges` and
  `diff_summary` now read `undefined` client-side, which the component already handles
  (`log.changed_fields && …`, `log.diff_summary || …`) — the cell renders empty.
- **Verification:** Live `?limit=3` body contains no `changes_count`/`diff_summary` keys and
  no `"undefined"` string.
- **Committed in:** `157b0455`

**2. [Rule 2 - Missing Critical] `user_email` filter and email search resolve to real user ids**

- **Found during:** Task 1
- **Issue:** `user_email` is not a column of `audit_log`. Dropping the filter would make
  `?user_email=…` and the email half of `?search=…` silently match nothing — manufacturing a
  new instance of the "filters silently never sent" defect that the intended-broken register
  records for `/admin/field-permissions` and explicitly does not want reproduced.
- **Fix:** `resolveUserIdsByEmail()` resolves the pattern against `public.users` first; the
  audit query then filters `user_id in (…)`. A failed lookup returns a 500 envelope rather
  than an empty 200. Search folds the resolved ids into the `or()` as a `user_id.in.(…)` clause.
- **Verification:** `?search=briefs` → 200 with matching rows;
  `?limit=2&table_name=briefs&operation=DELETE` → `metadata.total` 18, matching the DB group-by.
- **Committed in:** `157b0455`

**3. [Rule 2 - Missing Critical] Sanitized the free-text search term**

- **Found during:** Task 1
- **Issue:** PostgREST `or()` is a comma/paren-delimited grammar; the pre-existing code
  interpolated the raw term into it. A search containing `,` `(` `)` corrupts the filter and
  produces a spurious 500. Since the `or()` line was being rewritten anyway, the flaw was in scope.
- **Fix:** `sanitizeSearchTerm()` strips `, ( ) *` before interpolation.
- **Committed in:** `157b0455`

**4. [Rule 3 - Blocking] Typed the enrichment `Map`**

- **Found during:** Task 1 (`deno check`)
- **Issue:** `new Map((data||[]).map(u => [u.id, u]))` inferred `Map<any, {}>`, so
  `byId.get(...)?.email` was TS2339.
- **Fix:** `new Map<string, { email: string | null; role: string | null }>(…)`.
- **Verification:** `deno check` — both TS2339 errors gone.
- **Committed in:** `157b0455`

**5. [Process] One production commit instead of two**

- Tasks 1 and 2 modify the same single file (`files_modified` has exactly one entry) and were
  applied as one coherent rewrite. Splitting them after the fact would have required
  synthesizing an intermediate file state that never existed. Task 2's other actions (deploy,
  probe) are not commit-producing.

---

**Total deviations:** 4 auto-fixed (1 bug, 2 missing-critical, 1 blocking) + 1 process note.
**Impact on plan:** No scope creep. Deviations 1–3 exist to avoid trading the visible 500 for
a quieter lie (a rendered `"undefined"`, a dead filter, a spurious 500) — which is the failure
mode this phase exists to eliminate.

## Scope discipline — writers untouched

`AUDIT-DROP-01` and `AUDIT-ZERO-01` are **Phase 94's** and were not touched.

- `backend/src/services/auth.service.ts:847` (`AUDIT-DROP-01`) — untouched. **This plan is the
  named attach point** if a ruling folds it in mid-phase; it did not, so it stays filed.
- `public.audit_logs` (the sibling, 0 rows, 32 write sites) and its writers (`AUDIT-ZERO-01`)
  — untouched. The viewer was **not** repointed at it; `public.audit_log` remains the target
  per D-14/RULING-P93-01 §03.
- No edge-function insert sites were modified.

Proof (pinned): `git show --name-only --format="" 157b0455` → one file,
`supabase/functions/audit-logs-viewer/index.ts`. The other `supabase/functions/**` diffs
present against `phase-93-base` (`data-retention`, `my-delegations`, `_shared/ai-interaction-logger`,
`dossier-stats/dashboard-aggregations`) belong to plans 93-02 and 93-03, committed by sibling
lanes in this shared tree — not to this plan.

## Known Limitations (honest, not stubs)

- **`sort_by=user_email` now returns 400.** The column does not exist on `audit_log`. The
  table's "User" sort header will error visibly rather than mis-order silently. Fixing it
  properly needs either a denormalized email column or a joined view — out of scope here.
- **`by_table` absent from `/statistics`.** The promoted aggregate does not emit it (D-26:
  promote, do not author). `AuditLogStatistics.tsx:112` already guards on it, so the panel
  stays hidden — unchanged behaviour, since the route has 500'd since deployment.
- **`changed_fields` gone from the expanded-row diff panel.** `audit_log` does not store it.
  It _could_ be derived from an `old_values`/`new_values` key diff — the research names that
  option — but the plan chose the drop, and widening to the derivation was not this plan's call.
- **`session_id` / `ip_address` / `user_agent` / `additional_context` are NULL on all 75 rows.**
  The columns are wired and returned; the trigger simply does not populate them. That is a
  writer-side gap, i.e. Phase 94's territory.
- **`user_email`/`user_role` enrichment is best-effort.** If the `public.users` lookup fails,
  the two derived fields degrade to `null` and the failure is logged, rather than 500-ing the
  audit rows themselves. Verified working for the admin probe user.

## Threat Flags

None beyond the plan's register. `T-93-09` (information disclosure via 500 bodies) is
mitigated and live-verified above. `T-93-10` — the client remains **JWT-scoped**
(`createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } })`),
never service-role, so RLS still decides row visibility; the admin/super_admin check against
`public.users.role` is unchanged. `T-93-SC` — zero package installs.

No `GRANT SELECT ON auth.users` was proposed or applied; the user lookup targets
`public.users`, which the handler already read for the role check.

## Issues Encountered

- **`.git/index.lock` contention.** A sibling lane held the index during my first commit
  attempt (`fatal: Unable to create '.git/index.lock'`). Waited for release and retried; the
  sibling's staged files (`QueryErrorState.tsx` + its test) landed in _their_ commit
  `8080945db (93-01)`, untouched by mine. Verified with `git ls-tree -r HEAD`.
- **HEAD moved during close-out.** A `git show --name-only HEAD` mid-summary returned
  `93-02-SUMMARY.md` — a sibling lane's commit, not mine. All file claims in this summary are
  therefore pinned to `157b0455`, not to `HEAD`.
- **Pre-existing `deno check` errors remain.** 5 in `supabase/functions/_shared/utils.ts`
  (TS18046 `'error' is of type 'unknown'`) and 1 at this file's `catch (error) { … error.message }`
  — an unchanged pre-existing line. Out of scope (SCOPE BOUNDARY); the function bundles and
  deploys, as it did before.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `AUDIT-42703` closed: the viewer reads the live table, statistics come from the promoted
  in-file aggregate, and the leak is gone unconditionally.
- Phase 94 inherits, unmodified and named: `AUDIT-DROP-01`
  (`backend/src/services/auth.service.ts:847`) and `AUDIT-ZERO-01` (`public.audit_logs`,
  0 rows / 32 write sites). This plan is the recorded attach point for `AUDIT-DROP-01`.
- Task-1's gate is parked pending an orchestrator ruling (see `GATE CONCERN` #1). The
  _work_ it guards is complete and verified by the live probes above.

## BLOCKED

**One item — a PARK, not a work blocker.**

**Task 1's `<automated>` gate cannot be driven green by correct work.** Its
`grep -cE "'table_name'|\"table_name\"" == 0` sub-check still counts 2, both
external-vocabulary literals (the frontend's query-param name at line 587, the CSV header
label at line 247), neither a DB column claim. Zeroing the count requires renaming the
query param the frontend sends — silently disabling the filter, and manufacturing the exact
defect class the intended-broken register says must not be reproduced. The frontend is
outside this plan's `files_modified`.

Gate text was **not** edited and the code was **not** restructured to dodge the grep.
Awaiting an orchestrator ruling on whether to (a) accept the parked gate with this evidence,
(b) authorize a gate-criterion amendment extending the "external vocabulary" carve-out inside
the file, or (c) widen `files_modified` to the frontend so the wire contract can be renamed
end-to-end.

All other work in this plan is complete, deployed, and verified against the live system.

## Self-Check: PASSED

```
FOUND: .planning/phases/93-failure-visibility/93-05-SUMMARY.md
FOUND: supabase/functions/audit-logs-viewer/index.ts
FOUND: 157b0455
working tree vs 157b0455 (supabase/functions/audit-logs-viewer/index.ts): IDENTICAL — no sibling lane clobbered it
GATE1 EXIT=1   (expected 1 — PARKED, see GATE CONCERN #1)
GATE2 EXIT=0   (expected 0 — GREEN)
```

---

_Phase: 93-failure-visibility_
_Completed: 2026-08-15_
