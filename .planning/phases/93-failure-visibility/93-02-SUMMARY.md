---
phase: 93-failure-visibility
plan: 02
subsystem: api
tags: [edge-functions, deno, supabase, playwright, error-handling, rls, bilingual]

# Dependency graph
requires:
  - phase: 92-auth-surface
    provides: 'the /delegations isError branch (92-03) and the CDP forced-error oracle (92-01) this plan inverts'
provides:
  - 'my-delegations returns 500 { error: { code: QUERY_FAILED, message_en, message_ar } } instead of 200 with empty arrays'
  - 'data-retention client-facing bodies carry zero `details` passthrough (criterion-5 server half at this seam)'
  - 'tests/e2e/92-delegations-error.spec.ts test 2 inverted to the honest error state, with the Phase-102 flip-back reason inline'
  - 'a live-observed RED→GREEN record for all three of this plan gates'
affects:
  [93-04-data-retention-policy-migration, 93-05-audit-logs-viewer, 102-delegations-repoint-and-seed]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'edge-function query failure = early-return bilingual envelope + console.error diagnostic; never a fall-through to a success shape'
    - 'an inverted oracle carries its flip-back requirement IDs inline, so the next hand reads a reason instead of a bug'

key-files:
  created: []
  modified:
    - supabase/functions/my-delegations/index.ts
    - supabase/functions/data-retention/index.ts
    - tests/e2e/92-delegations-error.spec.ts

key-decisions:
  - 'D-13 honoured literally: the swallow was removed, the `.from("delegations")` targets were left byte-unchanged. Verified by diffing the call sites against phase-93-base, not by inspection.'
  - 'data-retention statuses were left alone — the strip landed while its natural 500 was still live and observable, which is why this plan runs before 93-04.'
  - 'Test 2 was renamed as well as inverted. A test titled "renders without the error alert" that asserts the alert IS present is the same class of lie this phase exists to kill.'

patterns-established:
  - 'Deployed-body evidence, not just status: the probe records `fn -> status`, but the criterion-5 claim needs the BODY, so the response body was captured separately and checked for `details` / `42P01` / `42501`.'

requirements-completed: [DELEG-01, TRUST-04]

# Metrics
duration: 32 min
completed: 2026-08-15
---

# Phase 93 Plan 02: Delegations + Data-Retention Failure Visibility Summary

**`my-delegations` stopped answering a nonexistent-relation 42P01 with `200 {"granted":[],"received":[],"total":0}` and now returns a real 500 with a bilingual, internal-string-free envelope; `data-retention` stopped shipping the PostgREST error object to callers at all 15 client-facing sites; and the Phase 92 oracle that certified the lie was inverted to certify the honest failure.**

## Performance

- **Duration:** 32 min
- **Started:** 2026-08-15T17:04Z
- **Completed:** 2026-08-15T17:36Z
- **Tasks:** 3
- **Files modified:** 3

## THE GATE TABLE — every gate observed RED before its task and GREEN after

`ACCEPTANCE-P93-EXEC.md` condition 1. Commands are verbatim from the plan; outputs are pasted from
the actual runs, never retyped from expectation.

| gate                                           | RED before (command + output)                                                                                                                                                                                                                                                                                                                       | GREEN after (command + output)                                                                                                                       | notes                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **93-02_g1** (Task 1, my-delegations envelope) | `F=supabase/functions/my-delegations/index.ts && test -f "$F" && test "$(grep -c 'message_ar' "$F")" -ge 2 && test "$(grep -v '^[[:space:]]*//' "$F" \| grep -cE 'details:[[:space:]]*error')" -eq 0`<br>→ **`exit=1`**<br>components: `message_ar lines: 0`, `details:error non-comment lines: 0`                                                  | same command<br>→ **`exit=0`**<br>components: `message_ar lines: 2`, `details:error non-comment lines: 0`                                            | **C2 — red for the right reason:** the red is attributable to the gate's subject (`message_ar` 0 < 2, i.e. the envelope is absent), not to a missing file or tool. The second conjunct (`details` = 0) was _already_ satisfied at baseline — it is a **regression guard** on this file, stated as such rather than counted as a pass. The threshold `-ge 2` = the two query-error sites D-13 names; max achievable is 2, so **max ≥ threshold** (C4). |
| **93-02_g2** (Task 2, data-retention leak)     | `F=supabase/functions/data-retention/index.ts && test -f "$F" && test "$(grep -v '^[[:space:]]*//' "$F" \| grep -cE 'details:[[:space:]]*error')" -eq 0 && test "$(grep -c 'message_ar' "$F")" -ge 1`<br>→ **`exit=1`**<br>components: `details:error non-comment lines: 15`, `message_ar lines: 31`                                                | same command<br>→ **`exit=0`**<br>components: `details:error non-comment lines: 0`, `message_ar lines: 31`, `ANY 'details:' occurrence remaining: 0` | Red attributable to the subject: 15 live passthroughs. The `message_ar -ge 1` conjunct is a **regression guard** (already 31 at baseline) protecting the envelope from being deleted along with the leak — said aloud, not folded into the pass. `message_ar` count is **identical before and after (31)**, which is the evidence that only the `details` line went.                                                                                  |
| **93-02_g3** (Task 3, live probe + oracle)     | `OUT=$(scripts/probe-edge-auth.sh my-delegations) && echo "$OUT" \| grep -qE 'my-delegations -> 5[0-9][0-9]' && OUT2=$(pnpm exec playwright test tests/e2e/92-delegations-error.spec.ts --project=chromium-en --no-deps 2>&1) && echo "$OUT2" \| grep -qE '\b2 passed'`<br>→ **`exit=1`**<br>probe: **`my-delegations -> 200`** — the confident lie | same command<br>→ **`exit=0`**<br>probe: **`my-delegations -> 500`**<br>playwright: **`2 passed (14.0s)`**                                           | Composite gate. **Half A** (probe) was the red: 200 ≠ 5xx. **Half B** (`2 passed`) was **GREEN at baseline** — measured, not assumed (see the baseline run below) — and green _over the lie_: old test 2 passed because the empty state and the failure were DOM-indistinguishable. That is the confirmed C9b instance, and it is why test 2 was inverted **in this same task**. See "Half B is not a vacuous oracle" below.                          |

### Half B measured at baseline, before any edit

Expected result was stated **before** the run (`2 passed`), then observed:

```
  ✓  1 …:85:7 › unblocked load renders without the error alert (4.6s)
  ✓  2 …:52:7 › blocked my-delegations renders the error alert, never an empty state (10.2s)
  2 passed (10.5s)
```

Test count derived, not frozen (C4/C6) — `--list` carries `--no-deps` per D-20:

```
pnpm exec playwright test tests/e2e/92-delegations-error.spec.ts --project=chromium-en --no-deps --list
→ Total: 2 tests in 1 file
```

### Half B is not a vacuous oracle — and the limit of that claim, stated

The three assertions the inverted test 2 now makes are each the **exact negation** of an assertion
the old test 2 made and **passed** at baseline:

| new assertion (93-02)                  | old assertion (92-01), observed PASSING at baseline |
| -------------------------------------- | --------------------------------------------------- |
| `errorAlert` **visible**               | `getByRole('alert')` **toHaveCount(0)**             |
| empty-state heading **toHaveCount(0)** | `emptyState.or(delegationRows)` **visible**         |
| stat **toHaveText('—')**               | stat **toHaveText(/^\d+$/)**                        |

So the inverted test 2 was necessarily RED against the pre-deploy state. **This is an inference from
three recorded observations, not a direct observation** — proving it directly would require
redeploying the old handler to staging to re-break it, which this plan did not do. Recorded honestly
rather than written up as a measured red.

### Deploy evidence (this phase keeps no shared ledger — each plan records its own)

| function         | deploy exit | version | `functions list` updated_at |
| ---------------- | ----------- | ------- | --------------------------- |
| `my-delegations` | `0`         | 3       | `2026-08-15T17:32:10.982Z`  |
| `data-retention` | `0`         | 3       | `2026-08-15T17:32:23.068Z`  |

Deployed via `supabase functions deploy <fn> --project-ref zkrcjzdemdmwhearhfgg` (CLI 2.106.0).

### The criterion-5 observable the probe cannot see

`scripts/probe-edge-auth.sh` prints `fn -> status` and discards the body (`-o /dev/null`). The
criterion-5 claim is about the **body**, so the deployed bodies were captured directly with the same
credential-safe mint (nothing echoed):

```
=== my-delegations deployed body ===
{"error":{"code":"QUERY_FAILED","message_en":"Failed to load delegations","message_ar":"فشل في تحميل التفويضات"}}
-- contains 'details': 0  | contains '42P01'/'42501': 0  | contains relation name: 0

=== data-retention deployed body ===
{"error":{"code":"FETCH_ERROR","message_en":"Failed to fetch policies","message_ar":"فشل في جلب السياسات"}}
-- contains 'details': 0  | contains '42P01'/'42501': 0  | contains relation name: 0
```

`data-retention` is still a live **500** — untouched, exactly as planned. 93-04's migration owns the
flip to 200, and the strip landed here specifically so it could be verified against a reproducible
error rather than against a path that no longer errors.

## Accomplishments

- **DELEG-01 closed as visibility-only.** Both `my-delegations` query-error sites early-return
  `500 { error: { code: 'QUERY_FAILED', message_en, message_ar } }`. The 42P01 still fires — only
  its visibility changed, which is the whole of D-13.
- **`.from("delegations")` proven byte-unchanged**, not asserted: the call sites were diffed
  against `phase-93-base` (line numbers and text identical). The repoint remains DELEG-02, Phase 102.
- **All 15 `details: error` passthroughs deleted from `data-retention`**, each replaced by a
  `console.error('<what failed>:', error)` so the diagnostic still reaches logs. Every status code
  diffed byte-identical against the base tag; the `:112` role-lookup diffed byte-identical.
- **The Phase 92 spec inverted rather than deleted or disabled**, with the flip-back requirement IDs
  (`DELEG-02`, `SEED-DELEG-01`) written into the test itself.

## Task Commits

1. **Task 1: my-delegations bilingual error envelope** — `1b0ff7f5` (fix)
2. **Task 2: data-retention details strip** — `7387cda3` (fix)
3. **Task 3: deploy + invert the delegations oracle** — `cb81e0ee` (test)

All three committed with explicit pathspecs (`git commit -- <path>`). Verified per commit with
`git show --stat HEAD` and `git show HEAD:<file>`. **This discipline was load-bearing, not
ceremonial:** at Task-3 commit time the shared tree also held another lane's uncommitted
`supabase/functions/audit-logs-viewer/index.ts`, staged `frontend/src/components/error-states/*`,
and a modified `93-03-SUMMARY.md`. `git show --name-only HEAD` confirms my commit contains exactly
one file and swept none of them in.

## Files Created/Modified

- `supabase/functions/my-delegations/index.ts` — both swallow sites replaced with an early-return
  bilingual envelope; `else if (data)` became `if (data)`. +34/−2.
- `supabase/functions/data-retention/index.ts` — 15 `details: error` lines deleted, 15
  `console.error` diagnostics added. +15/−15; the **only** deleted line in the whole diff is
  `details: error,`.
- `tests/e2e/92-delegations-error.spec.ts` — test 2 inverted and renamed; test 1 byte-identical
  (verified by diff against `phase-93-base`); inline auth, the 15s retry-ladder budget, and the
  2-test count all preserved.

## Decisions Made

- **Test 2 was renamed, not just re-asserted.** Leaving the title "unblocked load renders without
  the error alert" on a body that asserts the alert _is_ visible would reproduce this milestone's
  own defect inside its own oracle.
- **The `details` strip was applied as one structural transform, not 15 hand edits**, with a
  self-aborting site-count assertion (`expected 15, transformed N → exit 1, file untouched`) and a
  full diff read afterwards. The script is a throwaway in `/tmp`, not committed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Stale file-header claim in the spec corrected**

- **Found during:** Task 3
- **Issue:** `tests/e2e/92-delegations-error.spec.ts:15` read
  `// EXPECTED RED until plan 92-03 lands (delegations.tsx has no isError branch today).`
  92-03 shipped in Phase 92, so this is a false statement about the current tree sitting at the top
  of the file a Phase 102 hand will open. Leaving a stale "expected red" note in a file whose whole
  purpose is honest failure reporting is the same defect class the phase exists to kill.
- **Fix:** Replaced with a two-line status note recording that 92-03 landed, that both tests now
  assert the error state, and that test 2 was inverted by 93-02 and flips back in Phase 102.
- **Files modified:** `tests/e2e/92-delegations-error.spec.ts`
- **Verification:** `--list --no-deps` still reports exactly 2 tests; test 1 still diffs
  byte-identical against `phase-93-base`; gate `93-02_g3` green.
- **Committed in:** `cb81e0ee` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — a stale comment asserting a false fact about the tree).
**Impact on plan:** One comment line outside the three inverted assertions. No scope creep: no
production behaviour, no assertion, and no status code changed as a result.

## Intended-broken register — confirmed NOT touched

`ACCEPTANCE-P93-EXEC.md` condition 3. Each of these was left deliberately broken:

- **`/delegations` visibly ERRORS after this phase** until Phase 102 lands `DELEG-02` +
  `SEED-DELEG-01`. This plan _caused_ that, on purpose, and the inverted test 2 now guards it.
- **`/admin/data-retention`'s legal-holds region still errors** — `legal_holds` is one of the
  residual 11 (Phase 100 `RLS-AUTHUSERS-01`). Its policy was not touched; only the leak was stripped.
- **`/admin/field-permissions`' filters are silently never sent** — not in this plan's files, not
  investigated, not fixed.
- **`AUDIT-DROP-01` / `AUDIT-ZERO-01`** — filed to Phase 94, not folded in.
- **`GRANT SELECT ON auth.users`** — never proposed, never applied, and no migration was authored by
  this plan at all.

## Issues Encountered

- `${PIPESTATUS[0]}` returned empty when capturing the first deploy's exit code — this machine's
  shell is zsh, where the array is `$pipestatus` (1-indexed). Rather than report an exit code I had
  not actually captured, both deploys were re-run with `> log 2>&1; echo $?`, giving a real `0` for
  each. Recorded because a typed-in exit code is exactly the fabricated observable this phase forbids.

## GATE CONCERN

None. No `<automated>` gate text was edited, and no gate in this plan was found to be unsatisfiable
or vacuous. Two conjuncts are green-at-baseline **regression guards** (`details`=0 in g1;
`message_ar>=1` in g2) and are labelled as such in the gate table rather than counted as passes —
neither is vacuous: each guards a real way the correct fix could have gone wrong (adding a leak to
`my-delegations` while adding its envelope; deleting `data-retention`'s envelope along with its leak).

## User Setup Required

None — no external service configuration required. Both deploys used the already-authenticated
Supabase CLI against staging `zkrcjzdemdmwhearhfgg`.

## BLOCKED

None.

## Next Phase Readiness

- **93-04 can proceed and its ordering premise holds.** `data-retention` is still a live 500
  (`data-retention -> 500`, measured post-deploy), so 93-04's migration has a reproducible error to
  flip and its `data-retention -> 200` gate has a real red to start from. Note 93-04 will be flipping
  the **policies** query specifically; the legal-holds region stays red by design (Phase 100).
- **Phase 102 has what it needs to flip test 2 back** — `DELEG-02` and `SEED-DELEG-01` are named in
  the test body with the column evidence for why the repoint is a product call.
- **Not established by this plan:** `my-delegations` was never verified to return real delegation
  rows, because none exist to return. Only the failure path is proven. `data-retention`'s Arabic
  bodies were verified as JSON bytes over the wire, not as rendered pixels.

---

_Phase: 93-failure-visibility_
_Completed: 2026-08-15_
