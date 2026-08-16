---
phase: 94-write-paths
plan: 10
subsystem: audit
tags: [supabase, edge-functions, postgrest, rls, deno, audit-logs, deploy]

requires:
  - phase: 94-write-paths
    provides: 'supabase/functions/_shared/audit.ts — the writeAuditLog contract (94-06)'
  - phase: 94-write-paths
    provides: '94-09 wave-3 REQUIREMENTS.md state, preserved by this leg'
provides:
  - '27 edge functions (33 insert sites) writing the REAL public.audit_logs column set through the 94-06 shared helper'
  - 'five privileged mutations graded PRECONDITION (PARK-94-08 (a)): a failed audit write fails the action with a sanitized 500'
  - '.planning/phases/94-write-paths/94-DEPLOY-LEDGER.md — 27 verdict-last OK rows, counter positive-controlled both directions'
  - 'scripts/probe-audit-row.mjs — the row-landing oracle; falsified in three directions'
  - 'both audit register entries corrected with derivations inline'
affects: [94-11, audit, security-logging]

tech-stack:
  added: []
  patterns:
    - 'per-site audit GRADE stated in a comment at the call site: PRECONDITION (fail the action) vs LOG-LOUDLY-AND-CONTINUE'
    - 'derive-never-invent for NOT NULL user_role: resolve from public.users, unresolvable = loud skip, never a fabricated role'
    - 'untrusted header values never reach a typed inet column — they go to new_values jsonb'

key-files:
  created:
    - scripts/probe-audit-row.mjs
    - .planning/phases/94-write-paths/94-DEPLOY-LEDGER.md
  modified:
    - supabase/functions/assign-role/index.ts
    - supabase/functions/create-user/index.ts
    - supabase/functions/deactivate-user/index.ts
    - supabase/functions/approve-role-change/index.ts
    - supabase/functions/certify-user-access/index.ts
    - .planning/REQUIREMENTS.md

key-decisions:
  - 'ip_address is NOT fed from X-Forwarded-For into the inet column — measured live: both the pre-existing "unknown" fallback and a comma-joined XFF list are 22P02, which would have kept those rows at zero. The raw header goes to new_values.ip_address (jsonb).'
  - "auth-step-up-complete / auth-step-up-initiate's hard-coded user_role: 'user' was replaced by the real resolved role — a false actor role in a security log is a lie, not a placeholder"
  - 'entity_id NOT NULL has no home for the two fleet-wide events (inactive-users, schedule-access-review): the acting admin id is used as the honest subject and said so at the site; no sentinel uuid was invented'
  - 'the audit rows written during this leg are KEPT — they are genuine records of genuine staging actions and they are the AUDIT-ZERO-01 closure evidence'

patterns-established:
  - 'A deploy ledger positive-controls its own counter in BOTH directions before the first real row (C9a)'

requirements-completed: [AUDIT-ZERO-01, AUDIT-DROP-01]

duration: 75 min
completed: 2026-08-16
---

# Phase 94 Plan 10: Edge Audit Writer Fleet Summary

**All 27 broken edge audit writers (33 insert sites) now write the real `audit_logs` column set through the 94-06 helper, all 27 are redeployed, and `public.audit_logs` is no longer empty for the first time in the project's history — the first row was written by the deployed `inactive-users` at 15:42:15Z, not by a probe.**

## Performance

- **Duration:** ~75 min
- **Started:** 2026-08-16T15:05Z
- **Completed:** 2026-08-16T16:20Z
- **Tasks:** 3
- **Files modified:** 30 (2 created, 28 modified)

## Task Commits

1. **Task 1 (repair) + Task 3 (register), one commit as required** — `4aba197e5` (fix)
2. **Task 2 (deploy round, ledger, row-landing probe)** — `ac1431fb7` (feat)

Total scope diff `4aba197e5~1..ac1431fb7`: **30 files, 1320 insertions, 527 deletions.** No file
outside `files_modified` was touched (derived, not asserted — the inverse-grep returns `NONE`).

---

## GATE DRILL — all three gates, both directions, real output

<!-- prettier-ignore -->
| gate | RED before (command + actual output) | GREEN after (command + actual output) | notes |
| --- | --- | --- | --- |
| `94-10_g1` (:134) | Gate text run verbatim on the undone tree → **`g1 exit=1`**. It printed `NOT REPAIRED <fn>` for **all 27** names and **zero** `NO FILE` lines — so the red is attributable to its subject (the helper import was absent), not to a missing path. | Same text verbatim → **`g1 exit=0`**. Re-run on the committed tree → **`g1 exit=0`**. | NOT a pre-existing green: 27/27 were red. See GATE CONCERN 1 — it proves the import line exists, not that the payload is correct; compensated with the independent bad-key sweep and the live row-landing probe below. |
| `94-10_g2` (:162) | Gate text run verbatim → **`g2 exit=1`**, failing at its FIRST clause. Isolated: `test -f …/94-DEPLOY-LEDGER.md` → `exit=1`; `test -f scripts/probe-audit-row.mjs` → `exit=1`. Red for its subject — both artifacts this task creates were absent. | Same text verbatim → **`g2 exit=0`**, with the probe's own stdout: `audit_logs count BEFORE: 2` / `commitments-update-status -> HTTP 200` / `audit_logs count AFTER: 3  (delta 1)` / `PASS`. Re-run on the committed tree (post-prettier) → **`g2 exit=0`**, `AUDIT ROW LANDED: id=a4e8d33e-…`. | **This gate had never been observed green** — it needs a live deploy. Now observed. Its ledger arm and its probe arm were each independently falsified (below). |
| `94-10_g3` (:192) | Gate text run verbatim → **`g3 exit=1`**. Per-clause: `grep -c '38 files' .planning/REQUIREMENTS.md` → **`0`**; `grep -c 'default_organization_id' …` → **`0`**. Both marker tokens genuinely absent from the file, as the plan states. | Same text verbatim → **`g3 exit=0`**; clause counts now `38 files → 1`, `default_organization_id → 2`. Re-run against the **committed blob** (`git show HEAD:…`) → `1` and `2`. | NOT a pre-existing green. See GATE CONCERN 2 — it is a two-token presence check and cannot see whether the derivations around those tokens are correct. |

**Exit codes were captured directly (`echo "g_ exit=$?"` on the command itself), never through a
pipe** (instrument trap 2).

### C1 clause 2 — how each done state was constructed, and what was NOT constructed

- `g1`: fully constructed (27 source edits).
- `g3`: fully constructed (the register edit).
- `g2`: fully constructed **against live deployed staging** — 27 real `supabase functions deploy`
  invocations and a real HTTP round trip through a deployed function. Nothing about this gate was
  simulated. **NOT CONSTRUCTED: nothing.**

---

## Falsification drills — three oracles, each shown able to go red

A green from an oracle that cannot fail is not evidence. Each was broken deliberately and observed
failing; the repo tree is byte-identical afterwards (the drill copies live in `/tmp`).

**1. The ledger counter, BOTH directions, before the first real row was written** (C9a — the
`92-04` instance is precisely a producing plan closing green on a format only a downstream gate
reads). Recorded in the ledger's own header:

```
grep -cE '\| *OK *\|[[:space:]]*$'  on the header-only file          -> 0
  + a verdict-LAST synthetic row                                     -> 1   (counted)
  + a six-column 92-04-shaped row (verdict NOT last)                 -> 1   (correctly NOT counted)
  both synthetic rows removed                                        -> 0
```

So the clause can go **up**, and can **stay put** on the wrong shape. Both synthetic rows were
removed before the deploy round began.

**2. `scripts/probe-audit-row.mjs`, three controls:**

<!-- prettier-ignore -->
| control | what was broken | observed |
| --- | --- | --- |
| A — shape arm | expected `entity_type` changed to a value the row cannot have | **exit 1**, `FAIL: entity_type = commitment` |
| B — delta arm | the function call suppressed, so nothing writes | **exit 1**, `audit_logs count AFTER: 4 (delta 0)` → `FAIL: NO ROW LANDED` |
| C — credential arm | run with an empty environ and no `.env.test` | **exit 2**, `SKIPPED (exit 2): credentials absent … SUPABASE_URL, …` — names only, **no value echoed** |

Control C matters because a probe that exits 0 on missing credentials is a false green and one that
exits 1 is a false red; **exit 2 is a labelled state** and this is the observation that it is.

**3. The bad-key sweep** used to check Task 1's acceptance criterion was positive-controlled against
`phase-94-base`: the same regex over the same 27 files at the base tag returns **151** matches, and
over the repaired tree returns only non-audit matches (all in `notifications` inserts, HTTP error
response bodies, and type declarations — each checked by hand). Its file-enumeration arm was also
instrument-tested: it scanned **27** files, not 0.

---

## Task 1 — the 27 writers

**33 insert sites across 27 files** (some files carry 2–3): `approve-role-change` 3, `assign-role`
2, `auth-step-up-complete` 2, `create-user` 2, the other 23 one each. After the repair,
`from('audit_logs').insert` appears **zero** times in the 27; every site goes through
`writeAuditLog`, and the per-file `writeAuditLog(` counts sum to 33 — the same number of sites the
pre-repair survey found, so no site was silently dropped.

**Grades, as ruled (`RULING-P94-04 §PARK-94-08` (a), `D-18`) — the subset was neither widened nor
narrowed:**

- **PRECONDITION (5 functions, 9 sites):** `assign-role`, `create-user`, `deactivate-user`,
  `approve-role-change`, `certify-user-access`. On `{ ok: false }` each returns a sanitized 5xx —
  `{"error":"Failed to record audit entry","code":"AUDIT_WRITE_FAILED"}`, no internals, no
  PostgREST text (T-94-18). The honest tension is written at each of the nine sites, not only here:
  the mutation has already been persisted when the audit is attempted, so the caller can see a 500
  for an action that took effect. That is the intended trade — an unaudited role grant is the worse
  failure (T-94-19, accepted).
- **LOG-LOUDLY-AND-CONTINUE (22 functions, 24 sites):** the helper `console.error`s
  `AUDIT-ZERO-01 write failed: …` before returning, so no failure is silent even where the result is
  ignored.

**`user_role` (NOT NULL, no default) is derived per site, never fabricated.** Where the function had
already resolved a role for authorization and the guard makes it non-null (e.g. `requesterData.role`
behind `!== 'admin'` → 403), that value is used directly. Where it could legitimately be null, the
canonical role is read from `public.users` and an unresolvable role is a **loud skip** —
`AUDIT-ZERO-01: audit write SKIPPED — no user_role resolves for <uid> (<fn>:<action>)` — the same
derive-never-invent discipline 94-06 applied to `tenant_id` under A3. No placeholder role is ever
written.

### Deviations from plan — three Rule-1 auto-fixes, all inside the audit write

**1. [Rule 1 — Bug] `ip_address` must not be fed from `X-Forwarded-For` into the `inet` column.**
Found during Task 1. The pre-repair sites passed `req.headers.get('x-forwarded-for') || 'unknown'`
(and `|| '0.0.0.0'`) straight into `audit_logs.ip_address`, which is `inet`. Measured live against
staging rather than assumed:

```
SELECT 'unknown'::inet;                      -> ERROR 22P02 invalid input syntax for type inet: "unknown"
SELECT '203.0.113.7, 70.41.3.18'::inet;      -> ERROR 22P02 invalid input syntax for type inet
```

Both are reachable in production: the literal `'unknown'` whenever the header is absent, and the
comma-joined list whenever the request crosses more than one proxy. Either kills the **whole**
insert, so repairing only the key names would have left those functions still writing zero rows —
and for the five precondition sites it would additionally have handed an attacker a way to fail a
privileged mutation by sending a malformed header. Fix: the raw header value goes to
`new_values.ip_address` (jsonb, accepts any string); the typed `inet` column is left NULL.
**This was subsequently confirmed by real traffic, not just by the cast test** — see the first
landed row below, whose actual header value was
`"176.45.184.246,176.45.184.246, 13.248.105.84"`.
_Trade-off, stated:_ the typed `inet` column now goes unused by edge writers, so IP filtering must
read the jsonb. That is worse for querying and better than a row that does not exist.

**2. [Rule 1 — Bug] `auth-step-up-complete` / `auth-step-up-initiate` hard-coded `user_role: 'user'`.**
Three sites wrote a literal `'user'` regardless of who acted. That is a false actor role in a
security audit log. Replaced with the role resolved from `public.users` (the acting user in the
landed rows is in fact `admin`, so the literal was actively wrong), with the same loud-skip guard.

**3. [Rule 1 — Bug] `attachments-delete`'s role read cannot ever resolve.** It queries
`profiles … .eq('id', user.id)`, and `profiles` has **no `id` column** — the documented trap that
silently returns nothing. Rather than depend on it for the NOT-NULL `user_role`, the audit resolves
the canonical role from `public.users`. The broken read is left in place for its original
authorization purpose — repairing that is outside this plan's scope and is **not** claimed here.

Incidental, worth recording rather than claiming as work: repairing `push-device-register` removed
two pre-existing type errors, because the old code called `.catch()` on a
`PostgrestFilterBuilder`, which has no such method — its "audit error handling" never ran.

### Type-check: zero regressions, measured against a baseline

`deno check` **cannot run from inside the repo tree** — it dies on the pre-existing repo-root
workspace error `Could not find package.json for workspace member in '…/shared/'` (94-06 recorded
this). My first comparison did not account for that and reported "16 new failures"; that reading was
**wrong and discarded** — it was measuring the environment error, which is a C2 invalid red. Redone
with both trees materialised in `/tmp` (base from `git archive phase-94-base`, plus the 94-06 helper
so the base tree resolves its imports at all):

- **BASE: 11 of 27 fail. HEAD: 11 of 27 fail. New failures introduced by this plan: none.**
- A line-by-line diff of the two diagnostic sets is **empty except for two deletions** (the
  `push-device-register` `.catch()` errors above). Per-file diagnostic counts are otherwise
  identical.

All 11 pre-existing failures are unrelated classes (`'error' is of type 'unknown'` in catch blocks,
a `jsonwebtoken` default-export mismatch, a `qrcode` export name, `MFAFactor` overloads). Not
repaired — out of scope.

---

## Task 2 — deploy, ledger, and the first rows

**27/27 deployed** to staging `zkrcjzdemdmwhearhfgg`, each with its exit code captured directly, not
through a pipe. Ledger: **27 verdict-last `OK` rows, 0 `FAIL` rows**, cross-checked against the
plan's own 27-name enumeration (every name has a row; 27 distinct names). Threshold reachability
(C4): max achievable is 27, threshold is `-ge 27`.

Deployment was verified **independently of the CLI's own exit code** by reading the platform's
function list: all 27 are `status=ACTIVE` with versions bumped and `updated` timestamps matching the
ledger rows to the second.

`scripts/probe-edge-auth.sh` over all 27 is pasted into the ledger: **27 lines, 0 connection
failures, 1 `404`.** The 404 was checked rather than waved through — `assignments-manual-override`
returns its own `{"error":"User profile not found"}` at `index.ts:81-85` when the caller has no
`staff_profiles` row, and TEST_USER has none; the platform reports that same function
`ACTIVE, version=12, updated=15:38:17Z`, matching its ledger row.

### The AUDIT-ZERO-01 transition — stated precisely, because the obvious reading is wrong

`public.audit_logs` was **0 rows**, measured live at the start of this leg. It is now **5**.

**The first row in the table's history was not written by a probe script.** It was written by the
deployed, repaired **`inactive-users`** at `2026-08-16T15:42:15Z`, during the `probe-edge-auth.sh`
deploy-evidence run — that function's `-> 200` is a real admin query, and the repaired code audited
it. Row `a020361b-…e64d`: `entity_type=user`, `action=inactive_users_query`, `user_role=admin`.

`scripts/probe-audit-row.mjs` then independently demonstrated the delta through a **different**
repaired function, `commitments-update-status`, chosen because it is JWT-scoped and therefore
exercises the RLS `user_id = auth.uid()` arm that a service-role client would bypass entirely:
count `1 → 2`, row `290709a2-…e2fe`, `entity_type=commitment / action=status_update /
user_role=admin / old_values={"status":"pending"} / new_values.status="in_progress"`.

The remaining rows are from the gate re-run and the falsification drills. **All 5 rows are genuine
records of genuine staging actions and are deliberately kept** — they are the closure evidence.
**All probe fixtures are deleted**: `SELECT count(*) FROM aa_commitments WHERE title LIKE
'p94-10-audit-row-probe%'` → **0**.

Two derivations the probe needed, both taken live rather than assumed:

- `aa_commitments` CHECK `valid_tracking` binds `tracking_mode` to `owner_type` —
  `(automatic AND internal) OR (manual AND external)`. The first probe run failed `23514` on
  `internal + manual`; the constraint was then queried and the fixture corrected. Recorded because
  the plan's own fixture sketch did not mention it.
- The function reads its id from a **path segment** (`pathSegments[indexOf('commitments')+1]`),
  which an SDK `functions.invoke()` never supplies. The probe therefore spells out the sub-path
  `/functions/v1/commitments-update-status/commitments/<id>/status`. This is the same class as the
  recorded `after-actions-*` path-segment defect; here it is worked with, not repaired.

---

## Task 3 — the two register corrections

Landed in `4aba197e5`, **the same commit as the repair work**, as `RULING-P94-04` cross-cutting
order 1 requires. Both sides of that commit carry real content change (27 rewritten source files;
10 inserted register lines) — not a `touch`.

- **`AUDIT-ZERO-01`:** the filed "20 of 32" is replaced, with the cause of the error named — the
  filed derivation matched only the single-quote `from('audit_logs')`, a live instrument bias. The
  corrected population rule states **both quote styles** and yields **38 files / 36 writers / 27
  broken / 9 clean / 2 read-only**, with the 9 clean named. The out-of-population backend writer
  (`backend/src/services/mou.service.ts:636`, key `changes`, no `user_role`) is named, with the
  reason it fell between the two entries. The blind spots are carried forward explicitly:
  variable-assembled spread payloads remain **unmeasured**; RPC-mediated writes were searched, none
  found; `.upsert()` was included, zero found.
- **`AUDIT-DROP-01`:** the filed fix is recorded as **INCOMPLETE** — mapping
  `resource_type→entity_type` and `details→additional_context` still fails on `tenant_id` and
  `entity_id`, both NOT NULL with no default. The NOT-NULL derivation is inline as runnable SQL, as
  is the A3 resolution (`COALESCE(profiles.organization_id, users.default_organization_id)`, queried
  by `profiles.user_id`, no sentinel, unresolvable = loud skip).

**Carried limit, restated rather than overclaimed:** the register's five `B2` markers map to **four
commits**, and `38 files` and `default_organization_id` both land in this one Task-3 edit. The fifth
marker guards against that task being split — it is **not** an independent fifth observation, and
"five markers" must not be read as "five independently-verified corrections".

Waves 1–3 preserved: the edit is **10 insertions, 0 deletions** (`git diff --stat`), and this leg
made no other change to the file.

---

## C9b consumer sweep

Roots **derived, not named** — 64, the `find`-derived `tests` dirs plus colocated `__tests__` (the
standard's `-maxdepth 3` misses those). Instrument-tested before use: the control token `audit`
returns **47** files, so the sweep is not silently blind; `commitments-update-status` returns **0**,
which is a genuine zero rather than a broken pattern.

<!-- prettier-ignore -->
| candidate found | disposition |
| --- | --- |
| `backend/tests/contract/{assignments-manual-override,attachments-delete,auth-step-up-complete,auth-step-up-initiate,positions-unpublish,positions-approve}.test.ts` | **NAMED NON-ORACLES.** `backend/vitest.config.ts` lists `tests/contract/**` in its **exclude** array, so none of them runs. Same class as 94-06's `src/services/__tests__` finding. None references `audit_logs`, `entity_type` or `user_role` in any case. |
| `frontend/src/components/keyboard-shortcuts/__tests__/CommandPalette.audit.test.tsx` | **NOT a consumer — basename collision** (instrument trap 5). Its `create-user` at line 93 is a command-palette route id, not this edge function. Its filename contains "audit" for an unrelated F25 command-menu audit. |
| `frontend/tests/e2e/user-management.spec.ts` | **A REAL consumer, and NOT re-run in this leg — see BLOCKED.** |

---

## GATE CONCERN

**No `<automated>` gate text was edited. Zero gate edits. Both concerns are recorded for a ruling.**

1. **`94-10_g1` is an import-presence check, by construction.** It proves each of the 27 files
   contains the string `_shared/audit` — a file that imported the helper and still hand-rolled a
   broken `from('audit_logs').insert` beside it would pass. It is passable-when-done, so it is not a
   PARK; it is weaker than it reads. Compensated **without touching the gate**: the residual-raw-insert
   sweep (0 sites), the bad-key sweep positive-controlled against `phase-94-base` (151 → 0 in audit
   payloads), the `writeAuditLog(` call-count reconciliation (33 = 33 surveyed sites), and the live
   row-landing probe.

2. **`94-10_g3` is a two-token presence check.** `grep -q '38 files'` and
   `grep -q 'default_organization_id'` are satisfied by the tokens appearing **anywhere** in a
   576-line file, in any context including a comment — the positive dual of GATE-STANDARD **C8**,
   and the same shape 94-06 raised for its `g2`. It cannot see whether the derivations around those
   tokens are correct, which is the thing the criterion actually cares about. In this leg both
   tokens sit inside real corrected derivations: in the committed blob, `default_organization_id`
   appears in the `AUDIT-DROP-01` **A3 resolution** bullet and in its NOT-NULL derivation, and
   `38 files` in the `AUDIT-ZERO-01` **POPULATION CORRECTED** bullet. Cited by anchor, not by line
   number — prettier reflows this file on commit, so a line citation rots. The green is honest, but
   it is weaker than it reads.

---

## Threat Flags

None beyond the plan's register. `T-94-17`/`T-94-18` are mitigated as planned; `T-94-19` is the
accepted DoS trade and is now real in code at nine sites. `T-94-SC`: **zero package installs.**

## Issues Encountered

1. **My first `deno check` baseline comparison was invalid** and reported 16 phantom regressions —
   it measured the pre-existing repo-root Deno workspace error, not my code (a C2 invalid red).
   Discarded and redone with both trees isolated in `/tmp`. Recorded because the wrong reading looked
   entirely plausible.
2. **`zsh` does not word-split `$VAR`** (instrument trap 9). My first ad-hoc verification loop
   printed a single `NO FILE <all 27 names>` line. The **gate itself was unaffected** — it carries a
   literal inline list — and every subsequent multi-name sweep was run under explicit `bash`.
3. **`aa_commitments` CHECK `valid_tracking`** rejected the first fixture (`23514`). Constraint
   queried, fixture corrected. No schema change.
4. **`grep` here is a ugrep wrapper.** Every sweep in this leg used explicit file arguments or
   `find | xargs`, and each was instrument-tested against a token known to be present before its
   zero was believed.

## Scope discipline

- No `<automated>` gate text edited; no `*-PLAN.md` touched (derived: the file list for both commits
  contains no `-PLAN.md`).
- `.planning/STATE.md` and `.planning/ROADMAP.md` **not** touched (derived: empty file list).
- Nothing in the intended-broken register was repaired. `/delegations`, `/admin/data-retention`,
  `/tasks/queue`, `/analytics`, `DEAD-09`, `COPY-06`, `COUNT-03/04` were not approached.
- All commits used explicit pathspecs (`git commit -- <paths>`); never `-a`, never `add -A`.
- **No `git checkout` / `restore` / `stash` was run at any point.** Other lanes' uncommitted work
  (`CLAUDE.md`, the four skill files, `AGENTS.md`, `tickmarkr.spec.md`) was left untouched.
- **No `git config` was run.** No throwaway worktree was created; the drill copies live in `/tmp`.
- **No `GRANT SELECT ON auth.users`** was proposed or applied.
- **No migration and no DDL** — this plan makes no schema change. The only DB writes were 5 audit
  rows (kept, deliberately) and 5 fixture commitments (all deleted, verified 0 remaining).
- No credential value was echoed at any point; the probe prints missing variable **names** only.

## Requirements

`requirements-completed` copies the plan frontmatter verbatim, but the honest scope is narrower:

- **`AUDIT-ZERO-01`** — the fleet half is delivered and proven on deployed behaviour. Its residual
  blind spot is carried in the register, not closed: **payloads assembled as variables and spread
  into `.insert(payload)` were never in the population and are still unmeasured.**
- **`AUDIT-DROP-01`** — the code was delivered by **94-06**, not by this plan. This plan contributes
  only the register correction. Do not read this leg as evidence for the backend writer.

## Next Phase Readiness

`94-11` can count the ledger: 27 verdict-last `OK` rows, 0 `FAIL`, format positive-controlled here
in both directions before first use, so the cross-plan contract is not being checked for the first
time downstream.

## BLOCKED

1. **`frontend/tests/e2e/user-management.spec.ts` is a real C9b consumer and was NOT re-run.**
   It drives `create-user` and the `assign-role` role-change flow live — both now
   precondition-graded, so their failure paths changed. Re-running it needs a running app (dev
   server + the Playwright `setup` project for pre-auth), which this plan neither provisions nor
   asks for; and `E2ECRED-01` forbids my own oracles depending on that setup project. I did **not**
   discharge it by exercising `create-user`/`assign-role` against staging, because the brief
   forbids exercising those three functions for probe purposes.
   What is known: the change is **happy-path-preserving** — the success responses are untouched, the
   only new branch returns 500 when the audit write fails, and the audit write is measured to
   succeed. What is **not** known: whether that spec passes today, independently of my change. A
   prior recorded finding (Phase 86) has `create-user` POST hanging to 500 from the browser with
   owner Phase 90/ops, so its create leg may already be red for an unrelated reason — I did not
   verify that here and it should not be taken on my word.
   **This is a genuine C9b gap, not a named non-consumer.** It needs an orchestrator call: run it
   against a provisioned app, or park it with an owner.

## Self-Check: PASSED

- `scripts/probe-audit-row.mjs` — FOUND
- `.planning/phases/94-write-paths/94-DEPLOY-LEDGER.md` — FOUND
- `.planning/phases/94-write-paths/94-10-SUMMARY.md` — FOUND
- commits `4aba197e5`, `ac1431fb7` — both FOUND in `git log`
- gate line citations verified against the plan: `:134`, `:162`, `:192` each land on the
  `<automated>` block quoted above
- all three gates re-run on the committed tree: `g1 exit=0`, `g2 exit=0`, `g3 exit=0`

---

_Phase: 94-write-paths_
_Completed: 2026-08-16_
