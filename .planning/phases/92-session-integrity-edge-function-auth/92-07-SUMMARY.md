---
phase: 92-session-integrity-edge-function-auth
plan: 07
subsystem: auth
tags: [supabase, edge-functions, deno, jsr, getUser, rls, supabase-js]

# Dependency graph
requires:
  - phase: 92-01
    provides: phase-92-base tag + the confirmed-broken derivation command (D-07/D-08)
  - phase: 92-04
    provides: _shared/auth.ts specifier bump (D-06) inherited by the four intelligence-* functions
provides:
  - 33 slice-C edge functions migrated off the @2.39.x esm.sh pin onto jsr:@supabase/supabase-js@2
  - 10 Class-1 files converted to token-passing getUser(token) with header-injected clients preserved
  - Per-file class tally for slice C (10 Class-1 / 23 Class-2)
affects: [92-09 batch deploy, AUTH-02 acceptance derivation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'jsr:@supabase/supabase-js@2 specifier (replaces https://esm.sh/@supabase/supabase-js@2.39.x)'
    - 'Class-1 edit: specifier bump + const token extraction + getUser(token), injected client verbatim'

key-files:
  created:
    - .planning/phases/92-session-integrity-edge-function-auth/92-07-SUMMARY.md
  modified:
    - supabase/functions/{33 slice-C index.ts files — full list below}

key-decisions:
  - 'mou-renewals reads its Authorization header inline (no authHeader const); token derived from req.headers.get with a null-safe default rather than inventing a guard clause'
  - 'Service-role-key clients that carry an injected Authorization header (intake-tickets-assign, intake-tickets-update) kept verbatim — construction is out of scope per the no-touch rule'

patterns-established:
  - 'Class decided per file by reading its auth call, never inferred from a list'

requirements-completed: [AUTH-02]

# Metrics
duration: ~12min
completed: 2026-08-15
---

# Phase 92 Plan 07: AUTH-02 Sweep Slice C Summary

**33 edge functions (intake-audit-logs → push-device-register) moved off the `@2.39.x` esm.sh pin onto `jsr:@supabase/supabase-js@2`, with 10 Class-1 files converted to `getUser(token)` and every header-injected client preserved byte-for-byte.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-08-15T10:31Z (approx — first survey grep)
- **Completed:** 2026-08-15T10:43:28Z (final gate re-run)
- **Tasks:** 2/2
- **Files modified:** 33 (+ this SUMMARY)

## Per-file classification (decided by reading each file's auth call)

**CLASS 1 — pinned + injected client + bare `getUser()` → specifier bump + `const token` + `getUser(token)` (10 files)**

| File                        | Injected-client site                               | `getUser` call sites |
| --------------------------- | -------------------------------------------------- | -------------------- |
| intake-audit-logs           | `Authorization: authHeader`                        | 1                    |
| intake-tickets-assign       | `Authorization: authHeader`                        | 1                    |
| intake-tickets-update       | `Authorization: authHeader`                        | 1                    |
| interaction-notes-create    | `Authorization: authHeader`                        | 1                    |
| interaction-notes-list      | `Authorization: authHeader`                        | 1                    |
| interaction-notes-search    | `Authorization: authHeader`                        | 1                    |
| mou-renewals                | `Authorization: req.headers.get('Authorization')!` | 2                    |
| organizations-create        | `Authorization: authHeader`                        | 1                    |
| organizations-list          | `Authorization: authHeader`                        | 1                    |
| positions-consistency-check | `Authorization: authHeader`                        | 1                    |

**CLASS 2a — pinned + already `getUser(token|jwt)` → specifier bump ONLY (11 files)**

intake-classification, intake-tickets-create, intake-tickets-get, intake-tickets-list,
intake-tickets-triage, mous, ocr-extract, persons, populate-countries, populate-countries-v2,
push-device-register

**CLASS 2b — pinned, no `getUser` call anywhere in the file → specifier bump ONLY (12 files)**

intake-health, intelligence, intelligence-batch-update, intelligence-get, intelligence-refresh,
intelligence-refresh-v2, operation-progress, organizations, position-analytics-get,
position-analytics-top, position-suggestions-get, position-suggestions-update

10 + 11 + 12 = **33**. Every file had exactly **1** specifier occurrence (verified before editing), so
"every occurrence bumped" and "the import line bumped" are the same statement in this slice.

## Task Commits

1. **Task 1: slice C first half (17 files)** — `65f878e6` (feat)
   6 Class-1 + 11 Class-2. `git show --stat` confirmed exactly 17 `index.ts` paths, all mine.
2. **Task 2: slice C second half (16 files)** — `5116f622` (feat)
   4 Class-1 + 12 Class-2. `git show --stat` confirmed exactly 16 `index.ts` paths, all mine.

Neither commit contains a file belonging to another lane. Both used explicit `--` pathspecs.

## The criterion no gate checks — header-injected clients

Re-derived per file against `phase-92-base` (count of `global:` / `headers: { Authorization` lines):

```
33/33 files: base count == current count  (result "OK" on every row)
```

No file lost an injected-client site. No `createClient` construction was edited anywhere in the slice —
the complete slice diff (below) contains only import lines, `const token` declarations, and `getUser`
call sites.

## Complete slice diff vs phase-92-base

```
33 files changed, 55 insertions(+), 44 deletions(-)
```

Line accounting, fully reconciled:

- 33 deletions + 33 insertions = the 33 import specifier lines
- 11 deletions + 11 insertions = the 11 `getUser()` → `getUser(token)` call sites (mou-renewals has 2)
- 10 insertions = the 10 `const token = ...` declarations
- 1 insertion = a blank separator line in mou-renewals

44 deletions / 55 insertions. Nothing else in the slice changed.

## Gates

### Task 1 automated gate

**Command** (verbatim from the plan, run from repo root; abbreviated here to the 3 clauses — the
17 directory paths are spelled out identically in each clause as written in `92-07-PLAN.md`):

```
for d in <17 dirs>; do [ -d "$d" ] || { echo "MISSING ROOT: $d" >&2; exit 1; }; done \
  && test "$(grep -rlE '@supabase/supabase-js@2\.3[0-9]' --include='index.ts' <17 dirs> | wc -l)" -eq 0 \
  && test "$(grep -rlE 'auth\.getUser\(\)' --include='index.ts' <17 dirs> | wc -l)" -eq 0
```

**Verbatim output:** (no stdout — every clause is a silent `test`)

```
GATE-T1 EXIT: 0
```

**Exit code:** 0 — **PASS**. Run twice: once before the Task-1 commit, once after (post-commit
re-run at 2026-08-15T10:43:28Z), exit 0 both times.

### Task 2 automated gate

**Command** (verbatim from the plan; 16 directory paths spelled out per clause, plus the base-tag
verify and the `_shared`/`config.toml` scope guard):

```
for d in <16 dirs>; do [ -d "$d" ] || { echo "MISSING ROOT: $d" >&2; exit 1; }; done \
  && test "$(grep -rlE '@supabase/supabase-js@2\.3[0-9]' --include='index.ts' <16 dirs> | wc -l)" -eq 0 \
  && test "$(grep -rlE 'auth\.getUser\(\)' --include='index.ts' <16 dirs> | wc -l)" -eq 0 \
  && git rev-parse -q --verify refs/tags/phase-92-base >/dev/null \
  && test "$(git diff --name-only phase-92-base -- supabase/functions/_shared ':(exclude)supabase/functions/_shared/auth.ts' supabase/config.toml | wc -l)" -eq 0
```

**Verbatim output:** (no stdout — every clause is a silent `test` / `git rev-parse -q`)

```
GATE-T2 EXIT: 0
```

**Exit code:** 0 — **PASS**. Run twice: once before the Task-2 commit, once after (post-commit
re-run at 2026-08-15T10:43:28Z), exit 0 both times.

`phase-92-base` resolves to `580588af6117ba386fdc1893c7668487889df47c`.

### Supplementary checks (mine, not plan gates)

```
### A. any 2.3x supabase-js string anywhere in the 33 slice files (incl. comments) — expect 0 ###
       0

### B. any esm.sh/@supabase/supabase-js left in slice — expect 0 ###
       0

### _shared scope detail ###
files changed under _shared vs base:
supabase/functions/_shared/auth.ts
excluded-auth.ts guard result:
       0
```

`_shared/auth.ts` is plan 92-04's legitimate same-wave edit and is excluded by the gate. Nothing
else under `_shared/` differs from base. `config.toml` untouched.

## GATE CONCERN

None. Both `<automated>` gate texts were run exactly as written and neither was edited.

## Anomalies surfaced to the orchestrator (not fixed by me)

1. **`mou-renewals` reads its Authorization header inline, not into an `authHeader` const.** Its
   client is built with `headers: { Authorization: req.headers.get('Authorization')! }` and it has
   **no missing-header guard clause** — the `!` is a bare non-null assertion. It is NOT the
   plan's "bare `getUser` with no Authorization header anywhere" anomaly (a header IS present), so
   I applied the Class-1 edit, deriving the token from the same source as the client:
   `const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')`. The `?? ''`
   is deliberate: without it, a request with no header would throw a TypeError → 500, where
   `getUser('')` instead lands in the file's own existing `if (userError || !user)` 401 branch.
   The declaration sits at `mou-renewals/index.ts:93`, inside the single
   `serve(async (req) => { ... })` scope (lines 76–711, no nested function boundaries), covering
   both call sites at `:530` and `:584`. Flagging because it is the one file in this slice whose
   token derivation is not literally `authHeader.replace(...)`.

2. **`intake-tickets-assign` and `intake-tickets-update` build their client with
   `SUPABASE_SERVICE_ROLE_KEY` _and_ an injected `Authorization: authHeader` header.** I kept the
   construction verbatim per the no-touch rule, so this is unchanged from base — but the shape is
   worth an orchestrator look, since it is neither a plain injected anon client nor a plain
   service-role client.

3. **`operation-progress` already declared `const token` at `:37` and never uses it** (it has no
   `getUser` call at all). Pre-existing dead variable, untouched — bumping the specifier was the
   whole edit for that file.

4. **`intelligence-batch-update` authenticates by string-comparing the header against the service
   role key** (`!authHeader.includes(serviceRoleKey)`), not via `getUser`. Untouched; specifier
   bump only. Noting it because it is an auth path in this slice that the getUser-shaped gates
   cannot see.

## Files Created/Modified

All 33 are `supabase/functions/<name>/index.ts`:

intake-audit-logs, intake-classification, intake-health, intake-tickets-assign,
intake-tickets-create, intake-tickets-get, intake-tickets-list, intake-tickets-triage,
intake-tickets-update, intelligence, intelligence-batch-update, intelligence-get,
intelligence-refresh, intelligence-refresh-v2, interaction-notes-create, interaction-notes-list,
interaction-notes-search, mou-renewals, mous, ocr-extract, operation-progress, organizations,
organizations-create, organizations-list, persons, populate-countries, populate-countries-v2,
position-analytics-get, position-analytics-top, position-suggestions-get,
position-suggestions-update, positions-consistency-check, push-device-register

Plus `.planning/phases/92-session-integrity-edge-function-auth/92-07-SUMMARY.md`.

## Deviations from Plan

None affecting scope. One judgment call inside the plan's own recipe: the `mou-renewals` token
derivation (anomaly 1 above), which the plan's Class-1 spec does not literally cover because that
file has no `authHeader` const.

## Blocked

Nothing. Every task and every gate ran to completion.

## Issues Encountered

`git commit` for Task 2 failed once with `fatal: Unable to create '.git/index.lock': File exists`
— a concurrent lane held the index. Waited for the lock to clear (no `git` state was touched, no
lock was removed by me) and re-ran the identical commit, which succeeded as `5116f622`.

## Next Phase Readiness

All 33 slice-C functions are source-clean and ready for the 92-09 batch deploy. The four
`intelligence-*` functions still need their 92-09 redeploy to actually pick up the `_shared/auth.ts`
bump from 92-04 — editing that helper redeploys nothing by itself.

## WHAT THIS DOES NOT ESTABLISH

Honest boundaries of what I observed:

- **Nothing was deployed.** This plan is code-only by design (92-09 owns deploy). No function in
  this slice runs the new specifier anywhere — not on staging, not on production. The staging
  functions still execute the old `@2.39.x` bundles.
- **Nothing was typechecked, bundled, linted, or executed.** No gate in this phase runs `deno check`,
  `supabase functions deploy`, or any Deno tooling, and I ran none either. My assurance that the
  10 Class-1 files are not referencing an undeclared `token` is **static reading plus grep** —
  I verified `const token` count == 1 per Class-1 file and confirmed the declaration is in the same
  function scope as each use, but no compiler confirmed it. A scope error would surface as a 92-09
  deploy failure, not here.
- **`jsr:@supabase/supabase-js@2` was never resolved.** I did not fetch it, and no build step in
  this plan did. That the specifier is correct rests on the phase's prior decision (D-06/D-07) and
  the `access-requests/index.ts` in-repo precedent, not on an observed successful resolution.
- **No runtime auth behavior was observed.** I did not confirm that `getUser(token)` returns a user,
  that a 401 becomes a 200, or that RLS still scopes correctly. The injected-client claim is a
  _structural_ claim — per-file site counts match base and no `createClient` line changed — not a
  behavioral one. Whether these functions return rows rather than `[]` is unverified by this plan;
  that is 92-09's probe.
- **The gates are pure static greps over 33 named directories.** They prove: no `2.3x` specifier
  string remains, no `auth.getUser()` bare-call string remains, `_shared/` (minus `auth.ts`) and
  `config.toml` are byte-identical to base. They prove nothing about the other ~100 functions in
  the population, which belong to sibling slices.
- **The `_shared`/`config.toml` scope guard is a working-tree comparison at one instant**
  (2026-08-15T10:43:28Z). Sibling lanes are live in this tree; a later `_shared` edit by another
  lane would not be reflected in my green.
- **Anomalies 2–4 above were noted, not investigated.** I did not trace whether the service-role +
  injected-header combination in the two intake-tickets functions produces correct RLS scoping, nor
  whether `intelligence-batch-update`'s string-comparison auth is sound. Both are outside this
  plan's edit surface and I left them exactly as base had them.

---

_Phase: 92-session-integrity-edge-function-auth_
_Plan: 07_
_Completed: 2026-08-15_
