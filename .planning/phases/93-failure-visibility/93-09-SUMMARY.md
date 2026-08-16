---
phase: 93-failure-visibility
plan: 09
subsystem: ui
tags: [react, tanstack-query, error-states, rls, playwright, admin]

requires:
  - phase: 93-01
    provides: the shared QueryErrorState component (variants page/inline) and the common:errors.* keys
  - phase: 93-04
    provides: the four is_platform_admin(auth.uid()) policies that made data_retention_policies readable
provides:
  - /admin/field-permissions consumes isError for all three of its queries; the "0 Permissions" render is unreachable while the permissions query is rejected
  - /admin/data-retention owns its error state PER REGION across six queries; only the primary (policies) query collapses the page
  - tests/e2e/93-admin-surfaces-error.spec.ts — four live oracles (2 happy, 2 CDP-forced) that assert the legal-holds residual rather than tripping on it
affects: [93-15, phase-100-RLS-AUTHUSERS-01, phase-101-E2ESTALE-01]

tech-stack:
  added: []
  patterns:
    - 'Per-region isError ownership: a failed region renders QueryErrorState variant inline in place of its own content; siblings render normally; only the PRIMARY query collapses the page to variant page.'
    - 'Per-region em-dash: each summary stat card reads the isError of the query that actually backs it, so one broken region never zeroes the rest.'
    - "A route-crash guard in the e2e oracle: TanStack Router's errorComponent renders copy that reads like an honest query-error state, so the spec watches console `Route error:` and fails on it."

key-files:
  created:
    - tests/e2e/93-admin-surfaces-error.spec.ts
  modified:
    - frontend/src/routes/_protected/admin/field-permissions.tsx
    - frontend/src/routes/_protected/admin/data-retention.tsx

key-decisions:
  - 'The legal-holds region is asserted as an ERROR, not repaired — its cause is named in both the page and the spec so a criterion-2 close cannot imply the whole page went green.'
  - "The retention {data:[...]} envelope is unwrapped at the CONSUMPTION point (asRows), not by fixing the six false casts in domains/audit/hooks/useRetentionPolicies.ts — that file is outside this plan's files_modified."
  - "CDP block patterns are edge-scoped ('*/functions/v1/<fn>*'). The plan's shorter '*<fn>*' would also match the SPA route document and the Vite dev module URL, and the test would pass against a blank screen."

patterns-established:
  - 'Deliberately NOT Array.isArray(x) ? x : [] — a defensive fallback that renders an empty list over rows the server did send is the confident lie this phase exists to kill.'

requirements-completed: [TRUST-02]

duration: 95min
completed: 2026-08-16
---

# Phase 93 Plan 09: Admin Surfaces — Failure Visibility Summary

**Both criterion-2 admin routes now render failure as failure: field-permissions shows its 19 real
rules and an em-dash (never "0") when its query is rejected, and data-retention is honest per region
— 16 policy rows load while the legal-holds region errors BY DESIGN, asserted rather than hidden.**

## Performance

- **Duration:** ~95 min
- **Tasks:** 3/3
- **Files modified:** 3 (2 routes, 1 new spec)

## THE RED → GREEN TABLE (ACCEPTANCE-P93-EXEC condition 1)

All three gates were observed RED on the undone tree BEFORE their task, and GREEN after, with the
commands and their actual output recorded here.

| gate       | RED before (command + output)                                                                                                                                                                                                                                                                                                                                                                                                    | GREEN after (command + output)                                                                                                                                                                                                | notes                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `93-09_g1` | `cd frontend && F=src/routes/_protected/admin/field-permissions.tsx && test -f "$F" && grep -q 'isError' "$F" && grep -q 'QueryErrorState' "$F" && pnpm type-check` → **exit 1**. Attribution: `grep -c 'isError' <F>` = **0**, `grep -c 'QueryErrorState' <F>` = **0**. Died at the `isError` grep — its own subject — never reached `pnpm type-check` (C2 satisfied: the red is the subject's absence, not a tooling failure). | same command → **exit 0**, `pnpm type-check` printed `> intake-frontend@1.0.0 type-check` / `> tsc --noEmit` with no diagnostics. Re-run after the Task-3 envelope fix: still **exit 0**.                                     | —                                                                       |
| `93-09_g2` | `cd frontend && F=src/routes/_protected/admin/data-retention.tsx && test -f "$F" && test "$(grep -c 'isError' "$F")" -ge 6 && grep -q 'QueryErrorState' "$F" && grep -q 'RLS-AUTHUSERS-01' "$F" && pnpm type-check` → **exit 1**. Attribution: `grep -c 'isError'` = **0** (threshold 6), `grep -c 'RLS-AUTHUSERS-01'` = **0**. Died at the count test.                                                                          | same command → **exit 0**; `grep -c 'isError'` = **10** (≥ 6: six destructures + four consumption sites). `pnpm type-check` clean. Re-run after the envelope fix: still **exit 0**.                                           | max achievable ≥ threshold shown: 10 ≥ 6.                               |
| `93-09_g3` | `OUT=$(pnpm exec playwright test tests/e2e/93-admin-surfaces-error.spec.ts --project=chromium-en --no-deps 2>&1) && echo "$OUT" \| grep -qE '\b4 passed'` → **exit 1**. Playwright exit 1, stdout `Error: No tests found.` (single missing path ⇒ fails closed, per `RULING-P93-05`). `grep -qE '\b4 passed'` → NO MATCH.                                                                                                        | same command → **exit 0**. Playwright printed `4 passed (11.1s)`. Run output also carried the recorded live numbers: `[93-09] field-permissions rows=19 stat="19" (19 expected)` and `[93-09] data-retention policy rows=16`. | `--list --no-deps` independently shows `Total: 4 tests in 1 file` (C6). |

None of the three was green before its task. None is a regression guard. None was parked.

## What each task delivered

### Task 1 — `frontend/src/routes/_protected/admin/field-permissions.tsx` (`5bc72c6d5`)

- `isError` / `isFetching` / `refetch` destructured from all three queries (`useFieldPermissions`,
  `useFieldDefinitions`, `useFieldPermissionAudit`) — the file previously contained the string
  `isError` **zero** times.
- The permissions query is PRIMARY: when it rejects, the whole tab strip is replaced by
  `QueryErrorState variant="page"`, so the permissions tab's "No permission rules configured" empty
  state is unreachable over a failure.
- Definitions and audit are SECONDARY: each renders `QueryErrorState variant="inline"` inside its
  own tab. The audit feed 403s for a non-admin and used to render "No audit history" — a claim that
  nothing was ever changed, made by a caller who was not allowed to look.
- All five stat cards read `statFigure()` — an em dash carrying
  `aria-label={t('common:errors.countUnavailable')}` — while the permissions query is rejected.

**Live evidence (test 1):** 19 rows and stat `"19"` on a natural visit. The DB holds 19 rows
(`select count(*) from public.field_permissions` → 19, via Supabase MCP, 2026-08-16).
**Live evidence (test 2):** CDP-blocked → `query-error-state` visible, stat `—`, empty state absent.

### Task 2 — `frontend/src/routes/_protected/admin/data-retention.tsx` (`75da1bf9d`)

- `isError` / `isFetching` / `refetch` destructured from all six hooks. Each REGION renders
  `QueryErrorState variant="inline"` in place of its own list/stat content; siblings are unaffected.
- Page-level collapse is reserved for the primary (policies) query.
- Each of the five summary cards reads the em dash of the query that actually backs it.
- The legal-holds destructure carries a statement-position comment (never inside JSX — the 92-03
  lesson) naming `RLS-AUTHUSERS-01` and both measured causes; see the register below.

### Task 3 — `tests/e2e/93-admin-surfaces-error.spec.ts` (`190687a0a`)

Four tests, inline auth from `TEST_USER_EMAIL`/`TEST_USER_PASSWORD` (neither value ever echoed),
`--no-deps`, 15 s budgets, DOM-only assertions, plus a shared `INTERNALS` regex
(`42501|42703|42P01|42P17|permission denied|supabase`) asserted against `body` innerText on three of
the four.

Test 3 is the one that carries the phase's honesty condition: it asserts the policies region loads
(**16 rows**, not merely "no error" — a silent regression to an empty 200 fails it) AND that the
legal-holds region **is** showing `query-error-inline`, with a file header telling the next reader
to FLIP that assertion when Phase 100 lands, not to delete it.

## FOUND, NOT FIXED — say these out loud so no reader infers coverage

### 1. `/admin/field-permissions`' filters are silently never sent (D-25, planned)

`fetchFieldPermissions` (`frontend/src/hooks/useFieldPermissions.ts:41-52`) builds a
`URLSearchParams` from `entity_type` / `scope_type` / `scope_value` / `active_only` and then calls
`supabase.functions.invoke('field-permissions', …)` **without ever appending it to the URL**. Both
filter `Select`s on the page therefore refetch an identical unfiltered list. This was named in the
plan as out of scope and is NOT fixed here. It is recorded in a comment above the hooks block in
`field-permissions.tsx` as well as here.

### 2. NEW — `data-retention`'s six queries were casting the server envelope to a row array

Discovered at execution, and it is the reason Task 2 alone did not make the page work.
`frontend/src/domains/audit/hooks/useRetentionPolicies.ts` casts every `/data-retention/*` response
body straight to the row type — `getRetentionPoliciesApi(searchParams) as Promise<RetentionPolicy[]>`
— for all six queries. The bodies are the project's `{ "data": [...] }` envelope, so the cast is
false and `as` silences the compiler that would have caught it.

**The lie was invisible until 93-04.** While `data_retention_policies` answered `42501` the payload
never arrived, `data` stayed `undefined`, and the `= []` default covered it. The moment 93-04's
`is_platform_admin` policy made the read succeed, `policies.map` threw
`TypeError: policies.map is not a function` and the route's error boundary ate the **whole page** —
rendering copy (`common:errors.queryFailed.*`) that is nearly indistinguishable from an honest
query-error state. Measured 2026-08-16 via browser console: `Route error: TypeError: policies.map is
not a function`, ×4.

Repaired at the **consumption point** in `data-retention.tsx` (`asRows`, commit `b71ad62db`) because
the hook file is outside this plan's `files_modified`. **The six false casts remain in
`domains/audit/hooks/useRetentionPolicies.ts` and need an owner.** Deliberately not written as
`Array.isArray(x) ? x : []` — that fallback would render "No Policies" over rows the server did
send, which is precisely this phase's defect class.

### 3. NEW — the `data-retention` edge function mis-routes every sub-path except `policies`

`supabase/functions/data-retention/index.ts:120-123` derives `resource` from the **second-to-last**
path segment. That is correct for `/data-retention/policies/<id>` and wrong for every
`/data-retention/<sub>` route: `legal-holds` is read as a POLICY ID and looked up in
`data_retention_policies`.

Probed against deployed staging 2026-08-16 (`scripts/probe-edge-auth.sh` + a throwaway body probe;
no credential value echoed):

```
data-retention                       -> 200   (policy list)
data-retention/policies?status=active-> 200   (policy list)
data-retention/legal-holds           -> 404   {"code":"NOT_FOUND","message_en":"Policy not found"}
data-retention/statistics            -> 404
data-retention/pending-actions       -> 404
data-retention/expiring              -> 404
data-retention/execution-log         -> 404
```

Only `policies` survives, because its sub-path equals the branch's own short-circuit value. **Five
of six regions on `/admin/data-retention` are therefore in the honest error state today, not one.**
Not fixed — the edge function is outside this plan's files. Needs an owner.

## THE INTENDED-BROKEN REGISTER — nothing here was "opportunistically repaired"

- **`/admin/data-retention`'s legal-holds region STILL errors.** Asserted by test 3 as the expected
  render. Two stacked causes, both measured, the outer one firing first: (1) the 404 sub-path
  routing collapse above; (2) `public.legal_holds` still carries
  `EXISTS (SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND (u.raw_user_meta_data->>'role' =
'admin' OR u.raw_app_meta_data->>'role' = 'admin'))` — verified via `pg_policies`, 2026-08-16. It
  is one of the residual 11 of `RLS-AUTHUSERS-01`, Phase 100, deliberately outside 93-04's
  four-policy migration. **No migration was widened; no `GRANT SELECT ON auth.users` was proposed or
  applied.**
- **`/admin/field-permissions`' dead filters** — item 1 above, not fixed.
- `/delegations`, `AUDIT-DROP-01`, `AUDIT-ZERO-01` — untouched.

`pg_policies` also confirms 93-04 landed: `data_retention_policies` now carries
`is_platform_admin(auth.uid())`, and `scripts/probe-edge-auth.sh data-retention field-permissions`
returned `200` / `200`. Re-probed, not assumed.

## INSTRUMENT TRAP PAID FOR HERE — read before debugging a "correct edit that changed nothing"

**The Vite dev server served a STALE TanStack-Router split chunk, so a correct edit measured as no
behaviour change at all.** After adding `asRows`, test 3 still failed with the identical
`policies.map is not a function`. The source file was correct, `tsc` was clean, and the same server
was already serving my two EARLIER edits to that same file — which is exactly what makes this
expensive: partial freshness reads as full freshness.

The discriminating command was fetching what the browser actually receives, not reading the source:

```
curl -s 'http://localhost:5173/src/routes/_protected/admin/data-retention.tsx?tsr-split=component' | grep -c asRows
# 0   <- while the source file contained it 7 times
```

Note the `?tsr-split=component` suffix: TanStack Router splits the component into its own module, so
curling the bare route path shows only the route shell and finds **none** of the component's code —
a second way to conclude "my edit isn't there" for the wrong reason. `touch` did not invalidate it;
only restarting `pnpm dev` did, after which the same grep returned 7 and all four tests passed.

**Rule for the next executor: if an e2e result contradicts a source file you have just read, verify
what the dev server is SERVING before you re-edit the source.**

## GATE CONCERN

No gate was edited, and none needed to be. One observation is filed for the orchestrator to rule on
rather than left silent, because it is the C10 class:

- **`93-09_g1` / `93-09_g2` check PRESENCE, not CONSUMPTION.** `grep -q 'isError'` and
  `grep -c 'isError' -ge 6` would be satisfied by a file that merely _mentions_ `isError` in a
  comment — including, ironically, the explanatory comments this plan asked for. Their
  `<acceptance_criteria>` say "isError **consumed**", which the greps do not measure.
  **Mitigation already in place, which is why this is an observation and not a blocker:**
  `93-09_g3` is a live behavioural oracle over both routes in both directions, and it cannot pass
  unless `isError` is genuinely consumed — the em-dash and error-state assertions fail otherwise.
  No action requested; recorded so the pairing is on the record rather than assumed.

## Deviations from Plan

1. **[Rule 1 - Bug] The retention envelope unwrap (`asRows`).** Found during Task 3. Not in the
   plan; without it Task 2's must-have ("policies region no longer errors") is unreachable because
   the route crashes outright. Fixed at the consumption point, inside `files_modified`; the root
   cause is filed above. Commit `b71ad62db`.
2. **[Rule 3 - Blocking] CDP block patterns narrowed.** The plan specified `*field-permissions*` and
   `*data-retention*`. Those substrings also match the SPA route document (`/admin/field-permissions`)
   and the Vite dev-server module URL for the route file, so the page would never boot and the test
   would assert the error state against a blank screen — a false green. Changed to
   `*/functions/v1/field-permissions*` and `*/functions/v1/data-retention*`, which block exactly the
   edge calls the plan intended. Reason recorded in the spec beside the constants.
3. **[Rule 2 - Missing critical check] Test 3 gained a render-crash guard.** TanStack Router's
   `errorComponent` renders `common:errors.queryFailed.*` copy — nearly identical to an honest
   `QueryErrorState`. Without the guard, a route crash could satisfy a naive "an error rendered"
   oracle. The test now collects `pageerror` plus console `Route error:` and asserts the list is
   empty BEFORE its content assertions.

## Known Stubs

None. No hardcoded empty values, placeholder copy, or unwired data sources were introduced. The
`= []` defaults that remain are TanStack Query loading/idle placeholders and are now gated by
`isError` on every render path that could turn one into a claim.

## Threat Flags

None. No new endpoint, auth path, file access, or schema change. `T-93-17` (isError branches render
the shared state) and `T-93-18` (no Postgres codes / `supabase` strings in the forced-error DOM) are
both mitigated and both asserted by the spec. `T-93-SC` holds: zero package installs.

## Environment note (not a deviation)

A **concurrent Claude session** committed to `milestone/v10.0-trust` during this run
(`5b8be28a4` ROOTALIAS-01, `fce1fca12` GATESTD-01 — both `.planning/` docs). The brief stated this
lane was the only one in flight; it was not. No collision occurred because every commit here used an
explicit pathspec (`git commit -- <path>`) and each was verified with `git show --stat <sha>` and
`git show <sha>:<file>`. Flagged so the orchestrator knows the branch was shared. Also: the local
Vite dev server on :5173 was restarted during this run (see the instrument trap above) and is
running again.

## Verification

- `93-09_g1` exit 0 · `93-09_g2` exit 0 · `93-09_g3` exit 0 — table above.
- `pnpm exec eslint <both routes> --max-warnings 0` → exit 0.
- `git status --porcelain` clean after the final commit.
- C9b (cross-phase consumers of these two routes): **ZERO**, derived by the orchestrator with a
  positive control (`DossierShell` → 4 files) on the same instrument. Residual restated: a spec
  coupled by DOM shape alone matches no grep — that class is Phase 101's `E2ESTALE-01`, not chased
  here.

## Self-Check: PASSED

```
FOUND: frontend/src/routes/_protected/admin/field-permissions.tsx
FOUND: frontend/src/routes/_protected/admin/data-retention.tsx
FOUND: tests/e2e/93-admin-surfaces-error.spec.ts
FOUND: .planning/phases/93-failure-visibility/93-09-SUMMARY.md
FOUND: 5bc72c6d5   FOUND: 75da1bf9d   FOUND: b71ad62db   FOUND: 190687a0a
must_haves artifacts — field-permissions.tsx contains 'isError' ×5;
                       93-admin-surfaces-error.spec.ts contains 'query-error-state' ×4
key_links           — data-retention.tsx contains 'isError' ×10 (six hooks + four consumers)
```

## Task Commits

1. **Task 1: field-permissions — isError wiring, stats honesty** — `5bc72c6d5` (fix)
2. **Task 2: data-retention — six-hook wiring with the named residual** — `75da1bf9d` (fix)
3. **Task 2b (Rule 1 deviation): retention envelope unwrap** — `b71ad62db` (fix)
4. **Task 3: four-test spec, residual asserted** — `190687a0a` (test)

## BLOCKED

None.

Two defects were found that this plan could not repair inside its `files_modified` — the six false
casts in `domains/audit/hooks/useRetentionPolicies.ts` and the `data-retention` edge function's
sub-path routing collapse. Neither blocks this plan (both are worked around or asserted), and both
are written up above with their measurements so the orchestrator can assign owners.
