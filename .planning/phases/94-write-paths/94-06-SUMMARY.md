---
phase: 94-write-paths
plan: 06
subsystem: audit
tags: [supabase, postgrest, rls, winston, vitest, edge-functions]

requires:
  - phase: 94-write-paths
    provides: 94-RESEARCH.md §7 (live column sets, RLS postures, the mou.service finding)
provides:
  - 'supabase/functions/_shared/audit.ts — writeAuditLog(), the edge audit_logs write contract consumed by plan 94-10 wave 4'
  - 'backend logSecurityEvent repaired against the live public.audit_log column set, with A3 tenant derivation and a loud no-tenant skip'
  - 'backend logStateTransition repaired against the live public.audit_logs column set (user_role supplied, non-column key removed)'
  - 'backend/tests/unit/audit-write.test.ts — the AUDIT-DROP-01 behavioural oracle, in a location that actually runs'
affects: [94-10, audit, security-logging]

tech-stack:
  added: []
  patterns:
    - 'result-union audit write ({ ok: true } | { ok: false, error }) that never throws — the caller grades precondition vs log-and-continue'
    - 'derive-never-invent for NOT NULL foreign scoping columns (tenant_id, user_role): unresolvable = loud skip, never a sentinel'

key-files:
  created:
    - supabase/functions/_shared/audit.ts
    - backend/tests/unit/audit-write.test.ts
  modified:
    - backend/src/services/auth.service.ts
    - backend/src/services/mou.service.ts

key-decisions:
  - 'writeAuditLog takes a STRUCTURAL client type, not a nominal SupabaseClient — the 27 call sites in 94-10 import their client from several different specifiers (jsr:, npm:, esm.sh) and a nominal type would not unify'
  - 'Both backend sites graded LOG-LOUDLY-AND-CONTINUE (D-18), stated in each doc comment; the precondition-grade EDGE subset is 94-10s'
  - 'entity_id for a backend security event is the subject user id — the signature carries one id, who is both actor and subject'
  - 'mou.service: an unresolvable user_role is a loud SKIP, not a fabricated role — same discipline as A3s tenant rule'

patterns-established:
  - 'Audit helpers build the insert row key-by-key from the live column set, so no caller-side extra key can reach PostgREST'

requirements-completed: [AUDIT-DROP-01, AUDIT-ZERO-01]

duration: 20 min
completed: 2026-08-16
---

# Phase 94 Plan 06: Audit-Write Foundations Summary

**Both audit sinks now have a correct, loud write path authored against the live schema: a shared edge `writeAuditLog` result-union helper for `audit_logs` (plural), the backend `audit_log` (singular) writer repaired with a derived-never-invented `tenant_id`, the out-of-population `mou.service` writer repaired, and a 4-test oracle in a directory that actually runs.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-08-16T14:07Z
- **Completed:** 2026-08-16T14:16Z (last task commit 14:15:38Z)
- **Tasks:** 3
- **Files modified:** 4 (2 created, 2 modified)

## Task Commits

1. **Task 1: edge helper** — `a8473280` (feat) — `supabase/functions/_shared/audit.ts`
2. **Task 2: both backend writers** — `0c872b1c` (fix) — `auth.service.ts`, `mou.service.ts`
3. **Task 3: the oracle** — `a2989155` (test) — `backend/tests/unit/audit-write.test.ts`

Total scope diff vs `phase-94-base`: **4 files, 391 insertions, 11 deletions** — no file outside `files_modified` was touched.

---

## GATE DRILL — all three gates, both directions, real output

<!-- prettier-ignore -->
| gate | RED before (command + actual output) | GREEN after (command + actual output) | notes |
| --- | --- | --- | --- |
| `94-06_g1` (:114) | `test -f supabase/functions/_shared/audit.ts && grep -q 'user_role' … && grep -q 'ok: false' … && test "$(grep -c 'resource_type\|event_type\|metadata:' …)" -eq 0` → **`g1 exit=1`**. Red for its subject: the helper did not exist (`_shared/` held 16 helpers, none audit). | Same command verbatim → **`g1 exit=0`**; forbidden-key count printed separately = **`0`**. | NOT a pre-existing green. Forbidden-key clause instrument-tested BOTH directions before use: a fixture containing all three tokens → `3`; a fixture containing none → `0`. See GATE CONCERN 1 for its narrowness. |
| `94-06_g2` (:143) | Full chain as written → **`g2 exit=1`**. Per-clause breakdown, each run alone: `entity_type:'security' -> 1`, `additional_context -> 1`, `tenant_id -> 1`, `default_organization_id -> 1`, `new_values -> 1`, `user_role -> 1`. Every clause red for its subject; `tsc` was never reached. | Same command verbatim → **`g2 exit=0`** (greps pass AND `pnpm exec tsc --noEmit -p tsconfig.json` compiles clean). Re-run on the committed tree → **`g2 exit=0`**. | NOT a pre-existing green (all six clauses were 1). See GATE CONCERN 2 — four of the six clauses are bare substring greps a comment alone would satisfy. |
| `94-06_g3` (:165) | Full chain as written → **`g3 exit=1`**. vitest printed `No test files found, exiting with code 1` / `filter: tests/unit/audit-write.test.ts`. Red for its subject: the oracle did not exist. | Same command verbatim → **`g3 exit=0`**; `Test Files 1 passed (1)` / `Tests 4 passed (4)`. The second half's derivation printed separately = **`4`** (≥ 3). Re-run on the committed tree → **`g3 exit=0`**. | This was plan-check BLOCKER **B5** (`\| grep passed` swallowed the exit code). Confirmed repaired: the bare `vitest run` now carries the status, and the JSON derivation is a separate `test`. The derivation is fail-closed — its `catch{console.log(0)}` makes a parse failure `0`, which fails `-ge 3`. I confirmed it prints a real `4`, not a fallback. |

**Exit codes were captured directly (`echo "exit=$?"` on the command itself), never through a pipe** — instrument trap 2. One early attempt in this leg printed `commit exit=0` for a `git commit` that had actually failed on `.git/index.lock`, because the status came from `tail`. That reading was discarded and the commit re-run with the status captured directly.

### C1 clause 2 — the done state was CONSTRUCTED, and the oracle positive-controlled

`94-06_g3` green is only meaningful if the test can fail. Positive control run before closing:

- Injected a non-column key (`resource_type: 'security'`) into the real subject's insert payload in `auth.service.ts`.
- `pnpm exec vitest run tests/unit/audit-write.test.ts` → **`vitest exit=1`**, `Tests 1 failed | 3 passed (4)`, `AssertionError: expected [ Array(8) ] to deeply equal [ Array(7) ]` with `+ "resource_type"`.
- Injection reverted by hand-edit (never `git checkout`); byte-identity confirmed: `git diff --stat -- backend/src/services/auth.service.ts` → empty.

So the oracle fires on exactly the defect class it exists to catch, rather than passing because it asserts nothing.

### GATE CONCERN

**No gate was edited. Both concerns are recorded for a ruling, not repaired.**

1. **`94-06_g1` is a file-shape check only, by construction** — the plan says so. It proves the helper exists, mentions `user_role`, carries the `ok: false` arm, and names none of the three known bad keys. It does **not** prove the helper's row lands on the live table; a helper with a correct shape and a wrong table name would pass it. I compensated with live evidence rather than by touching the gate (see "Live shape evidence" below — the helper's exact row shape inserted through PostgREST, HTTP 201, read back, deleted). Recording it so the green is not read as stronger than it is.

2. **Four of `94-06_g2`'s six clauses are bare substring greps that a comment alone would satisfy** — `grep -q 'additional_context'`, `grep -q 'tenant_id'`, `grep -q 'default_organization_id'`, `grep -q 'new_values'`. This is the positive dual of GATE-STANDARD **C8**: the clause cannot distinguish code from prose, and this plan's action text specifically instructs the author to _mention_ those column names in comments, so the false-green path is live. Only `grep -q "entity_type: 'security'"` and `grep -q 'user_role'` pin a syntactic form. In this leg they are satisfied by **real code** — `auth.service.ts:897-902` (`tenant_id: tenantId`, `additional_context: details || {}`), `auth.service.ts:878` (`.select('default_organization_id')`), `mou.service.ts` (`new_values: { status: toStatus }`) — verifiable in the committed blobs. The gate is passable-when-done, so it is **not** a PARK; it is weaker than it reads.

---

## Task 1 — D-17 live column derivation (both tables, re-derived at execution)

Query run through the Supabase MCP against staging `zkrcjzdemdmwhearhfgg`, 2026-08-16:

```sql
SELECT table_name, column_name, is_nullable, column_default, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name IN ('audit_log','audit_logs')
ORDER BY 1, ordinal_position;
```

**`public.audit_log` (SINGULAR — backend Express, `AUDIT-DROP-01`)**

<!-- prettier-ignore -->
| column | nullable | default | type |
| --- | --- | --- | --- |
| id | NO | `gen_random_uuid()` | uuid |
| tenant_id | **NO** | — | uuid |
| entity_type | **NO** | — | character varying |
| entity_id | **NO** | — | uuid |
| action | **NO** | — | character varying |
| user_id | **NO** | — | uuid |
| timestamp | NO | `now()` | timestamptz |
| old_values | YES | — | jsonb |
| new_values | YES | — | jsonb |
| ip_address | YES | — | inet |
| user_agent | YES | — | text |
| session_id | YES | — | character varying |
| additional_context | YES | — | jsonb |

**`public.audit_logs` (PLURAL — edge functions, `AUDIT-ZERO-01`)**

<!-- prettier-ignore -->
| column | nullable | default | type |
| --- | --- | --- | --- |
| id | NO | `gen_random_uuid()` | uuid |
| entity_type | **NO** | — | text |
| entity_id | **NO** | — | uuid |
| action | **NO** | — | text |
| old_values | YES | — | jsonb |
| new_values | YES | — | jsonb |
| user_id | **NO** | — | uuid |
| user_role | **NO** | — | text |
| ip_address | YES | — | inet |
| user_agent | YES | — | text |
| required_mfa | NO | `false` | boolean |
| mfa_verified | NO | `false` | boolean |
| mfa_method | YES | — | text |
| correlation_id | YES | — | uuid |
| session_id | YES | — | text |
| created_at | NO | `now()` | timestamptz |

**Drift vs the plan's `<interfaces>` block: NONE.** Both sets match the research derivation column-for-column, including which columns are NOT NULL without a default. The two tables do **not** reconcile — the singular has `tenant_id` + `additional_context` that the plural lacks; the plural has `user_role` + the mfa/correlation columns that the singular lacks. D-17's two-helpers conclusion holds against the live catalog, not just against the document.

Also derived (constraints on `audit_log`): `pg_constraint` returns **only** `audit_log_pkey PRIMARY KEY (id)` — no FKs, so the probe below is not constrained by referential integrity (a real user id was used anyway, for honesty).

### The `writeAuditLog` contract — final signature, stated explicitly for plan 94-10

Plan `94-10` consumes this for 27 repairs in wave 4, so the shape is pinned here rather than left to be read off the file:

```ts
export interface AuditLogEntry {
  entity_type: string // NOT NULL
  entity_id: string // NOT NULL (uuid)
  action: string // NOT NULL
  user_id: string // NOT NULL (uuid) — the ACTING user; see RLS note
  user_role: string // NOT NULL, no default — REQUIRED, not optional
  old_values?: Record<string, unknown> | null
  new_values?: Record<string, unknown> | null
  ip_address?: string | null
  user_agent?: string | null
  required_mfa?: boolean
  mfa_verified?: boolean
  mfa_method?: string | null
  correlation_id?: string | null
  session_id?: string | null
}

export type AuditWriteResult = { ok: true } | { ok: false; error: string }

export interface AuditCapableClient {
  from(table: string): {
    insert(values: Record<string, unknown>): PromiseLike<{ error: { message: string } | null }>
  }
}

export async function writeAuditLog(
  client: AuditCapableClient,
  entry: AuditLogEntry,
  context?: string, // optional log label; defaults to `${entity_type}:${action}`
): Promise<AuditWriteResult>
```

Contract properties 94-10 may rely on:

- **Never throws.** Both the PostgREST error arm and a thrown-exception arm return `{ ok: false, error }`. The caller decides precondition-vs-continue; that grading is 94-10's per-site call.
- **Always loud.** A failure is `console.error`-ed as `AUDIT-ZERO-01 write failed: <context> <error>` _before_ it is returned, so even a log-and-continue caller that ignores the result cannot produce a silent drop.
- **Row built key-by-key from the live column set.** The five NOT NULLs are copied by name; the nine optional columns are copied only when `!== undefined`. A caller-side extra key cannot reach PostgREST — which matters because one unknown key fails the _whole_ insert with `PGRST204`, and that is how this table reached 0 rows against 36 writers.
- **Structural client type, deliberately.** Not a nominal `SupabaseClient` imported from one specifier: the 27 call sites import their client from `jsr:`, `npm:` and esm.sh specifiers, and a nominal type would not unify across them.
- **RLS posture in the header:** INSERT is `with_check (system_operation('any') OR user_id = auth.uid())`. A service-role client passes unconditionally; a JWT-scoped client may insert **only** rows whose `user_id` is its own `auth.uid()` — so a caller-scoped client must pass the caller's uid as `user_id` and put the third party in `entity_id`.
- **Two-table warning in the header**, naming that the backend's `audit_log` (singular) is a different table with a different column set.

`deno check` on the helper: **exit 0**. (Run in an isolated copy — `deno check` from the repo tree dies on a pre-existing repo-root Deno workspace error, `Could not find package.json for workspace member in '…/shared/'`, which is unrelated to this file and out of scope.)

---

## Task 2 — the two backend writers

**`auth.service.ts` `logSecurityEvent`** now inserts only real `audit_log` columns: `tenant_id`, `entity_type: 'security'`, `entity_id`, `action`, `user_id`, `additional_context`, `timestamp`. The previous payload's `resource_type` and `details` are not columns, so every call failed `PGRST204` into a catch that only logged — the table has never held one security event.

`tenant_id` is derived per **RULING-P94-04 A3**, never invented: `profiles.organization_id` first (queried by `profiles.user_id = uid` — `profiles` has **no `id` column**, so binding an outer `id` yields NULL and matches nothing), falling back to `users.default_organization_id`. **No sentinel tenant.** If neither resolves, the insert is **SKIPPED** and `winston.error` logs `AUDIT-DROP-01: audit insert SKIPPED — no tenant resolves for user <id> (event: <event>)`. `entity_id` is the subject user's id — the signature carries one id, who is both actor and subject.

Live confirmation that the A3 derivation actually resolves for real users (not just that the code compiles):

```sql
SELECT u.id, COALESCE(p.organization_id, u.default_organization_id) AS derived_tenant_id,
       (p.organization_id IS NOT NULL) AS from_profiles
FROM public.users u LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE COALESCE(p.organization_id, u.default_organization_id) IS NOT NULL LIMIT 3;
```

→ `385fb19d-…521f → 87bce3cc-…e0ff (from_profiles=true)`, `3d3061aa-…8734 → a5a4f413-…bbd1 (true)`, `6875f28e-…d3dd → 87bce3cc-…e0ff (true)`. The COALESCE resolves via `profiles.organization_id` for live users.

**`mou.service.ts` `logStateTransition`** now writes the real `audit_logs` (plural) shape: the non-column `changes` key is replaced by `old_values: { status: fromStatus }` / `new_values: { status: toStatus }`, the NOT-NULL `user_role` is fetched for the acting user from `public.users`, and the insert's `{ error }` is destructured and logged distinguishably. An unresolvable role is a loud **SKIP**, not a fabricated role — the same derive-never-invent discipline A3 sets for `tenant_id`.

**Grade, stated rather than implied (D-18): both backend sites are LOG-LOUDLY-AND-CONTINUE.** Backend security-event logging is observability, not a mutation precondition, so an auth action is not failed because auditing failed. An MoU state transition likewise does not fail because auditing failed — the status change has already been written by the caller. The honest tension is that a dropped audit row is a real gap, so it is never absorbed silently: **every path out of either function that does not write reaches winston at ERROR level with a distinguishable marker.** Both grades are written into the doc comment at the site, not only here. The precondition-grade EDGE subset (assign-role, create-user, deactivate-user, approve-role-change, certify-user-access, …) is plan 94-10's, enumerated by name there.

---

## Task 3 — the oracle, and why this path

The test lives at **`backend/tests/unit/audit-write.test.ts`**. `backend/vitest.config.ts` line 23 includes the `tests/unit` glob, so it runs in the required unit job — the RED drill's own output confirms the include list. The colocated directory `backend/src/services/` + `__tests__` sits outside every include glob, so the `auth.service.test.ts` shipped there **never runs** and is a named NON-ORACLE (it is, in fact, the only place `AuthService.logSecurityEvent` was previously "tested"). **The boundary is that one directory, not "colocated backend tests"** — `backend/vitest.config.ts:28` DOES include `src/utils/` + `__tests__`, and that is not a mistake to be generalised away.

**Basename-collision guard (instrument trap 5):** `logSecurityEvent` exists **twice** in this codebase — `backend/src/utils/logger.ts:126` (a winston helper) and `backend/src/services/auth.service.ts:845` (this plan's subject). Every import and every `vi.mock` in the test pins its target by **path**, not by name, and the file says so in its header.

Four tests, all against the real `AuthService.logSecurityEvent` with a mocked `supabaseAdmin`:

1. payload keys ⊆ the live `audit_log` column set (embedded in the test with a dated derivation comment) **and** every NOT-NULL column present; asserts `tenant_id`/`entity_type`/`entity_id`/`user_id`/`action`/`additional_context` values.
2. tenant falls back to `users.default_organization_id` when `profiles` has no org.
3. failure branch: insert resolves `{ error }` → does not throw, `logError` called once with a line containing `AUDIT-DROP-01` **and** `FAILED` **and** the PostgREST message, and asserts no `SKIPPED` line — i.e. the two failure modes are distinguishable from each other, not merely "something was logged".
4. tenant-unresolvable branch: insert **not** called, exactly one `AUDIT-DROP-01 … SKIPPED` line naming the user.

The mock throws on any table the subject does not expect, so a mis-pointed write fails the test rather than passing silently.

Regression check on the rest of the suite (not a gate): full `pnpm exec vitest run` in `backend/` → **exit 0**, `Test Files 26 passed (26)`, `Tests 259 passed (259)`.

### Live shape evidence (evidence step, not a gate) — inserted, read back, DELETED

All probes went through **PostgREST with the service-role key** — the same client path the code uses, so this exercises the schema-cache layer where `PGRST204` actually arises, not just raw SQL. No credential value was echoed.

<!-- prettier-ignore -->
| probe | table | payload shape | insert | read back | delete | confirm gone |
| --- | --- | --- | --- | --- | --- | --- |
| `action: 'p94-probe'` | `audit_log` | the exact 7 keys `logSecurityEvent` sends | **HTTP 201**, id `41e197de-deb4-4875-9217-d3a1e7373234` | **HTTP 200**, all fields echoed | **HTTP 204** | `[]`, HTTP 200 |
| `action: 'p94-probe-helper'` | `audit_logs` | `writeAuditLog`'s five required + one optional | **HTTP 201**, id `bb07a942-8638-4743-a4a2-f72b99573804` | in the 201 representation | **HTTP 204** | `[]` |
| `action: 'p94-probe-mou'` | `audit_logs` | the exact shape `logStateTransition` sends | **HTTP 201**, id `2367a0ec-b3fb-43cf-b1ed-2693d0cf5e83` | in the 201 representation | **HTTP 204** | `[]` |

Tenant/user used: `tenant_id 87bce3cc-9dc6-47c2-85a4-1cbaae58e0ff`, `user_id 385fb19d-bb99-451b-a0e0-d204ccbc521f` — a real user and the tenant the A3 COALESCE derives for them. **`audit_logs` was returned to its 0-row baseline** and the `audit_log` probe row was deleted; final `select id` on `audit_logs` → `[]`.

Incidental finding worth recording so the next author does not misread it: a first attempt posted both `audit_logs` rows as one bulk array and got `HTTP 400 PGRST102 "All object keys must match"`. That is PostgREST's **bulk-insert** rule (every object in one array must share a key set), **not** a column error — nothing landed, and re-running as two single inserts succeeded. The helper inserts one row at a time, so it is unaffected.

---

## C9b consumer sweep (shipped tests coupled to the files this plan modifies)

Roots **derived, not named** (and widened to colocated `__tests__` dirs, per the research note that the standard's `find -maxdepth 3` misses them): 64 roots found. Instrument-tested first — the positive control `auth.service` returned 3 files, so the sweep is not silently blind.

<!-- prettier-ignore -->
| identifier | shipped consumers found | disposition |
| --- | --- | --- |
| `auth.service` | `backend/tests/unit/auth.service.test.ts` · `backend/tests/unit/audit-write.test.ts` (mine) · `backend/src/services/__tests__/auth.service.test.ts` | The first RUNS and is a real consumer — re-run after the change: **exit 0, 24 passed**. The third **never runs** (outside every include glob) — recorded as a NAMED NON-ORACLE per D-28, not counted as a defence. |
| `mou.service` | `tests/unit/services/MoUService.test.ts` | Real consumer (imports the real `MoUService`), but does **not** exercise `logStateTransition` / `updateStatus` / any audit path — grep for those returns nothing. See Issues Encountered: it has 18 **pre-existing** failures, verified not mine. |
| `_shared/audit`, `writeAuditLog`, `logStateTransition` | none | New surface; its first consumers are plan 94-10's 27 repairs. |

---

## Deviations from Plan

None — plan executed exactly as written. The live column derivation matched the plan's `<interfaces>` block with no drift, so no adaptation was required.

## Issues Encountered

1. **`tests/unit/services/MoUService.test.ts` fails 18 of 24 — PRE-EXISTING, not caused by this plan.** Found by the C9b sweep. Root cause is a test/service API mismatch: `TypeError: mouService.getAllMoUs is not a function`. Verified not mine — `git show phase-94-base:backend/src/services/mou.service.ts | grep -c 'getAllMoUs'` → **0**, i.e. the method never existed at the phase base either, and this plan's diff to `mou.service.ts` touches only `logStateTransition`. Left untouched per SCOPE BOUNDARY; recorded here rather than in a new file, since this leg may only write its four planned files plus this SUMMARY.
2. **Concurrent-lane index lock.** Two `git add`/`git commit` attempts failed with `Unable to create '.git/index.lock': File exists` — other lanes are committing into this same tree. Handled by polling for the lock and re-running; no lane's work was disturbed and no `git checkout`/`restore`/`stash` was used at any point. This is also where the piped-exit-code trap surfaced (see the gate-drill note).
3. **`deno check` cannot run from inside the repo tree** — pre-existing repo-root Deno workspace error (`Could not find package.json for workspace member in '…/shared/'`). Worked around by checking an isolated copy (exit 0). Not repaired; out of scope.

## Scope discipline

- No `<automated>` gate text was edited. Two concerns recorded above for a ruling instead.
- `.planning/STATE.md`, `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` were **not** touched. Both AUDIT register corrections ride with plan 94-10 (REQUIREMENTS.md edits are wave-serialized); `REQUIREMENTS.md` is currently modified in the tree by another lane.
- Nothing in the intended-broken register was "opportunistically repaired".
- All commits used explicit pathspecs (`git commit -- <paths>`); never `-a`, never `add -A`. Author identity untouched — no `git config` was run, and no throwaway worktree was created.
- No `GRANT SELECT ON auth.users` was proposed or applied. The only DB writes were the three probe rows above, all deleted; **no migration and no DDL** — this plan makes no schema change.

## Requirements

`requirements-completed` copies the plan frontmatter verbatim, but the honest scope is narrower and must not be over-read:

- **`AUDIT-DROP-01`** — delivered and proven here: the backend writer is repaired, its oracle runs, and the exact payload shape is proven to land live.
- **`AUDIT-ZERO-01`** — **NOT closeable by this plan.** This plan ships only the helper (the contract). The 27 edge-function repairs, the redeploy round (D-19 — a source-only repair leaves the deployed bundle writing the old shape), the representative post-deploy row-landing probe, and both register corrections are **plan 94-10's**.

## Next Phase Readiness

`supabase/functions/_shared/audit.ts` is ready for 94-10 wave 4; its final signature and every contract property 94-10 relies on are pinned above. Nothing in this plan required a deploy — no edge function source was changed, only the new shared helper added, so there is no deployed-bundle drift owed by this leg.

## BLOCKED

None.

## Self-Check: PASSED

- `supabase/functions/_shared/audit.ts` — FOUND
- `backend/tests/unit/audit-write.test.ts` — FOUND
- `.planning/phases/94-write-paths/94-06-SUMMARY.md` — FOUND
- commits `a8473280`, `0c872b1c`, `a2989155` — all FOUND in `git log`
- gate line citations verified against the plan: `:114`, `:143`, `:165` each land on the `<automated>` block quoted above

---

_Phase: 94-write-paths_
_Completed: 2026-08-16_
