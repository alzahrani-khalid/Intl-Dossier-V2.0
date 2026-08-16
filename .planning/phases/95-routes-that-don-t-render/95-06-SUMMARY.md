---
phase: 95-routes-that-don-t-render
plan: 06
subsystem: api
tags: [supabase-edge, storage, signed-url, csv, i18n, react, probe]

requires:
  - phase: 94-honest-failures
    provides: the honest completed-only-with-url mapping (generate-entry.ts) and its pin
provides:
  - reports POST does REAL work — data gathered, artifact uploaded, signed url returned
  - the private storage bucket every artifact writer already targeted (pdf-generate, ai-extract, reports)
  - six repaired report queries (five answered 500 against the live schema)
  - truthful pending / completed-with-url / failed rendering in both locales
  - scripts/probe-report-generate.mjs — behavioural oracle, artifact fetched back
affects: [96-analytics, 100-legal-holds, any phase touching storage artifacts or pdf-generate]

tech-stack:
  added: []
  patterns:
    - 'artifact generation: gather -> serialize -> storage.upload -> createSignedUrl(86400) -> {url, status}'
    - 'behavioural oracle: fetch the returned signed url; a mint is not an artifact'

key-files:
  created:
    - scripts/probe-report-generate.mjs
    - supabase/migrations/20260816500002_p95_private_storage_bucket.sql
  modified:
    - supabase/functions/reports/index.ts
    - frontend/src/pages/reports/ReportsPage.tsx
    - frontend/src/i18n/en/report-builder.json
    - frontend/src/i18n/ar/report-builder.json

key-decisions:
  - 'Honest-format restriction: the page offers csv/json only — exactly what the server produces; pdf/excel/word are refused 501 FORMAT_UNAVAILABLE rather than fabricated'
  - 'C9b pin disposition: generate-entry.ts NOT changed — named non-consumer, pin run as regression evidence (5/5 green)'
  - 'The private bucket did not exist; created via migration rather than routing around it — this also repairs pdf-generate and ai-extract'
  - 'Probe covers all six report ids and both offered formats, not one representative'

patterns-established:
  - 'A signed url mints fine for an object that does not exist — the artifact must be FETCHED for the assertion to mean anything'
  - 'Probe the whole offered surface: sampling one type certified five broken branches as green'

requirements-completed: [DEAD-09]

duration: 13 min
completed: 2026-08-16
---

# Phase 95 Plan 06: Real Report Generation Summary

**The `reports` POST stopped answering 202 job theater and now gathers real data, uploads a real artifact to Storage and returns a fetchable signed url — for all six report types, after creating the `private` bucket that never existed and repairing five queries written against a fictional schema.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-08-16T19:55:00Z
- **Completed:** 2026-08-16T20:08:30Z
- **Tasks:** 3
- **Files modified:** 6 (4 modified, 2 created)

## Accomplishments

- The POST does real work: `gatherReportData` (shared with the GET branch, not duplicated) → serialize → `storage.from('private').upload()` → `createSignedUrl(path, 86400)` → `200 {url, status:'completed'}`. The `setTimeout`/`job_id`/202 theater is deleted. A completed response always carries the url of an object that exists.
- Unsupported formats are refused `501 FORMAT_UNAVAILABLE`, and the page no longer offers them — the honest half of the same law.
- The generate flow renders pending / completed-with-url / failed per UI-SPEC §6, in both locales.
- **The `private` bucket did not exist.** Created it; `pdf-generate` and `ai-extract` have been failing on "Bucket not found" since they shipped.
- **Five of six report queries named columns that do not exist** and answered 500. Repaired against the live schema.

## Task Commits

1. **Task 1: real POST (+ private bucket blocker fix)** — `317168bd1` (feat)
2. **Task 2: truthful client states + i18n + pin decision** — `98c687778` (feat)
3. **Task 3a: repair the five fictional-schema queries** — `90112a21b` (fix)
4. **Task 3b: behavioural POST probe** — `57d715cc2` (test)

## Gate observations — red BEFORE, green AFTER

### Task 1 gate

```
BEFORE (HEAD, mock in place):        TASK1_GATE_EXIT=1
  setTimeout = 1   status:202 = 1   createSignedUrl = 0   signedUrl = 0   from('private') = 0
  instrument test (known-present token 'ReportRequest') = 2  -> grep sees this file
AFTER:                               TASK1_GATE_EXIT=0
  setTimeout = 0   status:202 = 0   createSignedUrl = 1   signedUrl = 2   from('private') = 2   job_id = 0
```

The `:258` guard survives byte-equivalent (`if (!body.type || !body.format)` → 400, same message). Re-run after the Task 3a edits to the same file: `TASK1_GATE_EXIT=0`.

### Task 2 gate

```
BEFORE:  TASK2_GATE_EXIT=1
  pending-key in page = 0, failed-key in page = 0
  instrument test: unavailable-key in page = 1  -> grep sees this file
  node key check: MISSING key pending / failed / completed
AFTER:   TASK2_GATE_EXIT=0   (pin 5/5 green 941ms; type-check clean)
```

### Task 3 gate — labelled UNPROVEN pre-execution, both directions observed

RED, against the **deployed mock** (version 12), before any deploy:

```
POST reports (type=country-overview, format=json) -> 202
  response status field = pending
  response url length   = 0
FAIL — the POST returned no url; nothing was generated
PROBE_EXIT_BEFORE_DEPLOY=1
```

GREEN, against the deployed repair:

```
POST reports (type=country-overview,     format=json) -> 200  completed  url len 415  GET artifact -> 200, 1955 bytes
POST reports (type=organization-profile, format=json) -> 200  completed  url len 424  GET artifact -> 200, 1598 bytes
POST reports (type=mou-status,           format=json) -> 200  completed  url len 403  GET artifact -> 200, 4002 bytes
POST reports (type=event-summary,        format=json) -> 200  completed  url len 408  GET artifact -> 200,  249 bytes
POST reports (type=intelligence-digest,  format=json) -> 200  completed  url len 422  GET artifact -> 200,  274 bytes
POST reports (type=executive-dashboard,  format=json) -> 200  completed  url len 424  GET artifact -> 200,  296 bytes
POST reports (type=country-overview,     format=csv)  -> 200             GET artifact -> 200,  503 bytes
POST reports (type=country-overview,     format=pdf)  -> 501             refusal code = FORMAT_UNAVAILABLE
generation_held = true   csv_format_held = true   honest_refusal_held = true
PASS — all 6 report types produced a fetchable artifact in both offered formats, and pdf was refused
TASK3_GATE_EXIT=0
```

C2 instrument test — the exit-2 path is real, not decorative:

```
TEST_USER_PASSWORD= node scripts/probe-report-generate.mjs
UNABLE TO MEASURE — missing from .env.test: TEST_USER_PASSWORD
PROBE_EXIT_NO_CREDS_DIRECT=2
```

## Deploy evidence (D-19)

```
supabase --version                       2.106.0
PRE-DEPLOY  reports: version=12 status=ACTIVE updated_at=2026-08-15T11:16:23.462Z
supabase functions deploy reports --project-ref zkrcjzdemdmwhearhfgg     DEPLOY_EXIT=0
POST-DEPLOY reports: version=13 status=ACTIVE updated_at=2026-08-16T20:03:14.679Z
bash scripts/probe-edge-auth.sh reports  ->  reports -> 200
```

A second deploy followed (the schema repair found by the probe); the tip deploy is the one the GREEN block above measured, and the working tree is clean for every file in this plan, so deployed == committed.

Artifacts really landed (read back from `storage.objects`, service-role query):

```
bucket_id=private  objects=13  first=reports/comprehensive-1786910774537.json
                               last =reports/organizations-1786910806949.json
                               owner_set=true  owner_id_set=true
```

## Honest-format decision (D-08)

Real minimal generation is CSV and JSON. Every template's offered formats moved from
`pdf`/`excel`/`word` to `csv`/`json`. Nothing on the server renders a PDF or a spreadsheet, so
offering one could only end in a fabricated success or a dead download. Unsupported formats
answer `501 FORMAT_UNAVAILABLE`; `generate.unavailable` ships unchanged as the terminal fallback
for a 200 that carries no url. No change converts a visible failure into an invisible success.

## C9b pin disposition (D-16) — NAMED NON-CONSUMER

`frontend/src/pages/reports/__tests__/generate-entry.test.ts` is a **real** (unmocked) consumer of
`generate-entry.ts`, and `generate-entry.ts` was **not changed**.

**Reason:** the server now returns exactly `{url, status:'completed'}` — the completed-with-url
shape `buildGeneratedReportEntry` already maps. Its contract did not move, so the pin needed no
update. Run anyway as regression evidence: **5/5 green, 941ms** (re-run at close: 5/5 green).

## Files Created/Modified

- `supabase/functions/reports/index.ts` — real POST; shared `gatherReportData`; inline CSV serializer (~20 lines, no library); six repaired queries; POST-scoped `getUser()`; catch-all no longer leaks `error.message`
- `supabase/migrations/20260816500002_p95_private_storage_bucket.sql` — the `private` bucket + owner-scoped RLS
- `frontend/src/pages/reports/ReportsPage.tsx` — pending/failed rows, "Open report" label, `aria-disabled`, csv/json only
- `frontend/src/i18n/{en,ar}/report-builder.json` — `generate.pending` / `.completed` / `.failed`
- `scripts/probe-report-generate.mjs` — the behavioural oracle

## Decisions Made

- **Owner-scoped Storage RLS, not path-prefix scoped.** The three writers use three different path shapes (`reports/…`, `pdfs/…`, `ai-extraction/…`), none carrying a uid, so the avatars-style `<user_id>/` convention does not fit. Both `owner` and `owner_id` are checked because different Storage versions write different columns. Verified populated: `owner_set=true owner_id_set=true`.
- **Probe the whole offered surface.** The first version sampled one type and would have certified the feature green with five sixths broken.
- **The storage path is composed from the resolved type constant**, never raw request text (T-95-14). Unknown ids answer 400.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The `private` storage bucket did not exist**

- **Found during:** Task 1 (pre-flight check of the research premise before writing the upload)
- **Issue:** 95-RESEARCH and 95-PATTERNS both record "bucket `private` exists on staging (pdf-generate is deployed against it) `[VERIFIED: source + probe]`". It does not. `storage.buckets` held `annotations, avatars, briefing-books, commitment-evidence, contact-documents, voice-memos` and `storage.objects` was EMPTY (0 rows). The verification was a source read plus a 400 GET probe — neither can see a bucket. **`pdf-generate:383` and `ai-extract:201` have therefore been failing on "Bucket not found" since they shipped** — the same never-worked class as P94's publish path.
- **Fix:** `supabase/migrations/20260816500002_p95_private_storage_bucket.sql`, applied via the Supabase MCP (house rule: no ad-hoc DDL). Creates the bucket private, with owner-scoped SELECT/DELETE and authenticated INSERT. This repairs the two pre-existing writers as well as the new one. Research assumption A5 pre-authorized exactly this ("If bucket policy blocks, create a bucket via MCP — small execution-time adjustment"), so it is executed rather than parked.
- **Files modified:** `supabase/migrations/20260816500002_p95_private_storage_bucket.sql` (**outside `files_modified`** — declared here)
- **Verification:** `select id, public from storage.buckets where id='private'` → `{id: private, public: false}`; 13 objects subsequently written by the probe
- **Committed in:** `317168bd1`

**2. [Rule 1 - Bug] Five of the six report queries were written against a schema that does not exist**

- **Found during:** Task 3 (the probe returned 500 after the bucket existed — a grep could not have found this)
- **Issue:** derived from `information_schema` 2026-08-16 — `countries` has no `status` column (`.eq('status','active')`), no `name_en` (the organizations embed); `mous` has no `primary_party_id`/`secondary_party_id`; `events` has no `organizer_id` and no `start_datetime` (it is `start_time`); `intelligence_reports` has no `report_number` and no `title_en`. All five answered **500**. Three further `reduce` keys were not errors but lies, bucketing every row under `undefined`: `org.type` (is `org_type`), `mou.workflow_state` (is `lifecycle_state`), `event.is_virtual` (is `virtual_link`). Only `comprehensive` — head counts, no column references — ever worked, which is why `GET /reports` answered 200 and concealed the rest. **This is pre-existing GET-branch breakage**, inherited because the plan (correctly) directed reuse rather than duplication.
- **Fix:** each query rewritten against the live schema; the shared helper means the GET preview branch is repaired too.
- **Files modified:** `supabase/functions/reports/index.ts`
- **Verification:** all six types now return a fetchable artifact (probe GREEN block above)
- **Committed in:** `90112a21b`

**3. [Rule 2 - Missing Critical] The catch-all returned `error.message` to the caller**

- **Found during:** Task 1
- **Issue:** the failure path of the new POST routes through the existing catch-all, which returned raw `error.message` — Postgres text and storage paths reaching the user, against the protocol's "errors never leak internals".
- **Fix:** detail to `console.error`, generic `{error:{code:'REPORT_FAILED', message:'Report request failed'}}` to the caller. Fixed once at the shared catch rather than per branch.
- **Files modified:** `supabase/functions/reports/index.ts`
- **Verification:** probe observes no server text in any error body
- **Committed in:** `317168bd1`

**4. [Rule 2 - Missing Critical] The POST branch had no authentication assertion**

- **Found during:** Task 1
- **Issue:** the client injected the caller's JWT but never called `getUser()`; the branch now writes artifacts, so it asserts its caller (T-95-16). Explicitly permitted by the plan ("mirror assignments-queue if the POST branch lacks it").
- **Fix:** `getUser()` on the JWT-scoped client → 401, mirroring `pdf-generate:275-289`. **Scoped to POST only** so GET behaviour — and the `reports -> 200` staging premise — is unchanged.
- **Verification:** `bash scripts/probe-edge-auth.sh reports` → `reports -> 200` (GET unaffected)
- **Committed in:** `317168bd1`

**5. [Rule 1 - Bug] Probe scope widened from one report type to all six, and to both formats**

- **Found during:** Task 3
- **Issue:** the plan specified "a type the :258 guard accepts and format 'json'". That version passed its own assertion while five of six branches were broken — a single-sample oracle over a six-template surface.
- **Fix:** the probe iterates every report id the page offers, plus a csv assertion.
- **Committed in:** `57d715cc2`

---

**Total deviations:** 5 auto-fixed (1 blocking, 2 bugs, 2 missing-critical)
**Impact on plan:** all five were necessary for the success criterion to be true rather than merely asserted. Deviations 1 and 2 are the difference between "the code calls createSignedUrl" and "a user gets a report". No scope creep: no new features, no new dependencies (zero installs, as the threat model's T-95-SC assumed).

## Issues Encountered

- **My first commit violated the explicit-pathspec law and swept in a sibling lane's work.** I ran `git add -- <my files>` followed by a bare `git commit`, which committed everything staged in the shared index — including lane 95-08's staged deletion of `frontend/src/routes/_protected/positions/$positionId.tsx`, without its companion `routeTree.gen.ts` regen. Repaired within one guarded command (assert HEAD unmoved → `reset --soft HEAD~1` → `git commit -F msg -- <my two paths>`), which restored the sibling's staged deletion to the index untouched and left the file present in HEAD for their lane to commit properly. Verified: `git status` shows `D ` staged for that path, `git cat-file -e HEAD:<path>` succeeds, and my commit contains exactly 2 files. Commit hash changed `6517d2f7` → `317168bd1`. Every subsequent commit used `git commit -- <pathspec>`.
- **A pathspec commit silently does nothing for an untracked file.** `git commit -F msg -- scripts/probe-report-generate.mjs` reported success while creating no commit, because the file was untracked. Caught by verifying the commit's file list rather than trusting the exit code. Fixed with `git add --` first. Worth knowing for any executor whose plan creates a NEW file.
- The probe's own first run exited 2 (UNABLE TO MEASURE) on a bug of mine — I read `access_token` off the `signInWithPassword` wrapper instead of `data.session`. The exit-2 discipline did its job: it refused to report a pass it had not measured.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- DEAD-09 closes on observed behaviour: six report types, two formats, artifacts fetched back.
- **Two findings belong to someone's register, not to this plan** (both are repaired here, but neither was this plan's subject, and no other phase has been told):
  1. `pdf-generate` and `ai-extract` have never been able to upload. The bucket now exists, so they are _unblocked_, but neither has been exercised end-to-end — nobody has fetched a pdf-generate artifact. Their working state is UNVERIFIED, not proven.
  2. The `reports` GET branch's five type-specific queries were broken in exactly the same way and are repaired by the shared helper — but the GET branch has no oracle of its own. `GET /reports?type=countries` is untested; only `GET /reports` (comprehensive) is covered by `probe-edge-auth.sh`.
- Storage retention for report artifacts is unowned: objects accumulate in `private` with no cleanup path (13 written by the probe alone). No policy grants UPDATE, and DELETE is owner-scoped, so nothing prunes them.
- Arabic naturalness for the three new keys is an OPERATOR park per ORCH-BRIEF §3 — the values are the UI-SPEC's suggested renderings and carry no naturalness claim here.

## BLOCKED

None. Every task's gate ran, both directions were observed for the UNPROVEN gate, and all
three gates are green at close (`TASK1_GATE_EXIT=0`, `TASK2_GATE_EXIT=0`, `TASK3_GATE_EXIT=0`).

---

_Phase: 95-routes-that-don-t-render_
_Completed: 2026-08-16_

SUMMARY-END
