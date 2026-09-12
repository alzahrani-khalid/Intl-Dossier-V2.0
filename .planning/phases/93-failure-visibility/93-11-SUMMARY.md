---
phase: 93-failure-visibility
plan: 11
subsystem: ui
tags: [tanstack-router, not-found, error-state, dossier, playwright, react-error-boundary]

requires:
  - phase: 93-failure-visibility (93-01)
    provides: the shared QueryErrorState component (`components/error-states/QueryErrorState.tsx`)
provides:
  - "the codebase's FIRST notFound() throw — DossierShell discriminates a 404 from every other rejection"
  - 'DossierShell gains the isError branch it never had (D-05 error-state wiring for dossier detail)'
  - 'notFound() is now USABLE app-wide: both app error boundaries re-throw router not-found instead of swallowing it'
  - 'tests/e2e/93-dossier-notfound.spec.ts — two-direction D-05 oracle (absent → 404; forced rejection → error state)'
affects: [93-12 engagement notFound, 93-13 report notFound, any future notFound() thrower]

tech-stack:
  added: []
  patterns:
    - 'Component-throw notFound() MUST carry `routeId: rootRouteId` in this app (defaultErrorComponent stamps routeId on the way up)'
    - 'App React error boundaries re-throw `isNotFound(error)` rather than rendering their fallback'

key-files:
  created:
    - tests/e2e/93-dossier-notfound.spec.ts
  modified:
    - frontend/src/components/dossier/DossierShell.tsx
    - frontend/src/components/error-boundary/ErrorBoundary.tsx
    - frontend/src/components/app-error-boundary/ErrorBoundary.tsx

key-decisions:
  - 'notFound({ routeId: rootRouteId }) — not bare notFound(); measured, not preferred (see Deviations #2)'
  - 'Guard both app error boundaries rather than adding notFoundComponent to seven route files (plan mandates zero route-file edits)'
  - 'isRedirect() deliberately NOT added to the same guard — unmeasured, non-blocking, recorded as an observation'

patterns-established:
  - 'Not-found boundary: DossierShell → root notFoundComponent (routes/__root.tsx:72), the first thrower in frontend/src'
  - 'Two-direction render oracle: every test asserts the expected state PRESENT and the wrong state ABSENT'

requirements-completed: [TRUST-03]

duration: 36 min
completed: 2026-08-15
---

# Phase 93 Plan 11: Dossier detail tells absence from failure — Summary

**DossierShell now throws `notFound({ routeId: rootRouteId })` on a 404 and renders the shared
`QueryErrorState` on every other rejection — one edit covering all seven typed dossier layouts —
and both app React error boundaries were unblocked so that throw can actually reach the root 404
page, which it could not before.**

## Performance

- **Duration:** 36 min
- **Started:** 2026-08-15T22:45:00Z (approx; first measurement 22:47:47Z)
- **Completed:** 2026-08-15T23:21:31Z
- **Tasks:** 2
- **Files modified:** 3 modified + 1 created

## Accomplishments

- The codebase's **first** `notFound()` throw. The root boundary at `routes/__root.tsx:72` had
  existed with nothing throwing into it; it now receives a real throw from the shell that all seven
  typed dossier detail layouts mount.
- `DossierShell` gains the `isError` branch it never had. Before this plan, ANY dossier-detail
  failure rendered titleless chrome with per-section "Failed to load this section. **Check your
  connection and try again**" — measured verbatim in the snapshot of the pre-change run, i.e. the
  exact copy criterion 3 quotes, shown for a record that simply was not there.
- Discovered and fixed the reason `notFound()` was **structurally unusable** in this app: two React
  error boundaries sit between every possible thrower and the router's `CatchNotFound`, and both
  swallowed it. Fixed once, where all callers route through.
- Two-direction oracle landed: 2/2 under `--no-deps`, each test asserting the wrong state's
  ABSENCE as well as the right state's presence.

## Task Commits

1. **Task 1: DossierShell — discriminate 404 from rejection** — `4bb258d8` (feat)
2. **Task 2: Two-direction spec + unblock the throw** — `cf0d9be8` (test; carries the two Rule 1/3
   deviations, because the spec cannot pass without them and the plan's HARD GATE forbids advancing
   with a failing acceptance criterion)

---

## THE GATE TABLE — every gate observed RED before and GREEN after

Both gates were run **verbatim**, on the same instrument, in both directions.

| gate                  | RED before (command + output)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | GREEN after (command + output)                                                                                                                                                                                                                                                                                                             | notes                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **93-11_g1** (Task 1) | `cd frontend && F=src/components/dossier/DossierShell.tsx && test -f "$F" && grep -q 'notFound' "$F" && grep -q 'QueryErrorState' "$F" && pnpm type-check` run with the file at `phase-93-base` → **`GATE EXIT=1`**. Which clause: `grep -c 'notFound' <file>` → **`0`**. `test -f` passed, so the red is at the SUBJECT, not the environment (C2).                                                                                                                                                                                                      | Same command verbatim, work done → `> tsc --noEmit` (no output) → **`GATE EXIT=0`**. Re-run again after the final `rootRouteId` edit → **`GATE EXIT=0`**.                                                                                                                                                                                  | Red is at the first subject clause; type-check is the second half and also had to pass. See **Instrument note 3** — one transient red from another lane's WIP.                                                                                                                                                                                                                                                         |
| **93-11_g2** (Task 2) | `OUT=$(pnpm exec playwright test tests/e2e/93-dossier-notfound.spec.ts --project=chromium-en --no-deps 2>&1) && echo "$OUT" \| grep -qE '\b2 passed'` with `DossierShell.tsx` at `phase-93-base` on a freshly-started `:5173` (curl-verified: `grep -c notFound` → `0`) → **`GATE 93-11_g2 EXIT=1`**, `2 failed`. Failure reasons: test 1 `Locator: getByText('404', { exact: true })` / `Error: element(s) not found`; test 2 `Locator: getByTestId('query-error-state')` / `Error: element(s) not found`. Both died at their assertion of record (C2). | Same command verbatim, work done, freshly-started `:5173` (curl-verified: `grep -c rootRouteId` → `2`) → **`GATE 93-11_g2 EXIT=0`**, `✓ an absent dossier id renders the root 404 page, never the error state (3.9s)`, `✓ a forced rejection on a REAL dossier id renders the error state, never the 404 page (9.9s)`, `2 passed (10.5s)`. | C6 satisfied: `--no-deps` present. Threshold `2` is the plan's own mandated test count and is max-achievable. `\b2 passed` cannot be satisfied by `12 passed` (no word boundary between `1` and `2`), and the `&&` requires playwright exit 0 first, so a "2 failed, 2 passed" run cannot sneak through. Test 1 resolving in **3.9s** confirms the designed single-round-trip 404 (no retry ladder, no skeleton wall). |

**No gate was green before its work.** Neither gate is a regression guard and neither is vacuous.

### GATE CONCERN

**None.** Both gates were examined against C1–C10 and no criterion is violated. The two hazards I
hit were environmental, not gate defects, and are recorded as instrument notes below so the next
executor does not lose the same hour.

---

## C9b — CROSS-PHASE CONSUMERS

### The three registered `DossierShell` consumers (baseline BEFORE any edit, re-measured AFTER)

| spec                                                   | command                                                                                                                   | BEFORE                                             | AFTER                                              | delta    |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------- | -------- |
| `frontend/tests/unit/routes.test.tsx`                  | `cd frontend && pnpm exec vitest run tests/unit/routes.test.tsx`                                                          | `Test Files 1 passed (1)` / `Tests 14 passed (14)` | `Test Files 1 passed (1)` / `Tests 14 passed (14)` | **none** |
| `frontend/tests/e2e/direction-portals.spec.ts`         | `cd frontend && pnpm exec playwright test tests/e2e/direction-portals.spec.ts --project=chromium --reporter=list`         | `5 passed (10.0s)`                                 | `5 passed (9.3s)`                                  | **none** |
| `frontend/tests/e2e/qa-sweep-icon-screenshots.spec.ts` | `cd frontend && pnpm exec playwright test tests/e2e/qa-sweep-icon-screenshots.spec.ts --project=chromium --reporter=list` | `20 failed` / `2 passed (38.6s)`                   | `20 failed` / `2 passed (32.8s)`                   | **none** |

`routes.test.tsx` mocks `@/components/dossier/DossierShell` at line 209, so it never renders the
real component — that is why one edit to the shell moves none of its 14 assertions.
`direction-portals` DOES render the real shell on `/dossiers/countries/b0000001-…-004`; I verified
via `execute_sql` that that seed row exists (`China`, type `country`), so the shell resolves a real
dossier there and the new 404 path is not on its route.

**`qa-sweep-icon-screenshots` was already 20-red before this plan, and that was established by
EXPERIMENT, not by reading.** The first baseline run overlapped my first edits, so I re-measured it
with `git checkout phase-93-base -- frontend/src/components/dossier/DossierShell.tsx` (tree verified
clean first, restored immediately after, `git diff --stat` confirming the restore). The reverted
run returned the same `20 failed / 2 passed`. Its failing fixtures are on `/dashboard`,
`/calendar`, `/persons`, `/after-actions` and dossier **list** routes — none mounts DossierShell —
but the disposition rests on the measurement, not on that reading. **Isolated, not repaired**, and
not filed: it matches the `E2ESTALE-01` class already owned by Phase 101. This spec is documented
in its own header as advisory, opt-in, never in CI.

### TWO consumers the register did not contain — surfaced by re-deriving C9b after the deviation

Touching the two error boundaries added files the plan never listed, so I re-ran the C9b derivation
over my actual changed set. **The first run of the derivation was itself broken** — exactly the
failure mode the standard warns about — and I fixed the instrument before believing it:

- `sed -E 's/[][.*+?^${}()|\\]/\\&/g'` → BSD `sed` rejects that character class with
  `unbalanced brackets ([])`, leaving `id` **empty**.
- `grep -rlE -- "\b${id}\b" $ROOTS` under **zsh** does not word-split `$ROOTS`, so all four roots
  were passed as ONE path: `ugrep: warning: ./tests\n./e2e/tests\n./frontend/tests\n./backend/tests: No such file or directory`.

Both failures produce an **implausibly empty** sweep — a clean bill of health from an instrument
that searched nothing. Re-run under `bash -c` with the roots derived (not named):

```
ROOTS: ./frontend/tests  ./tests  ./backend/tests  ./e2e/tests
=== id=DossierShell   (4 candidate files) ===   routes.test.tsx, direction-portals.spec.ts,
                                                qa-sweep-icon-screenshots.spec.ts, 93-dossier-notfound.spec.ts (mine)
=== id=ErrorBoundary  (3 candidate files) ===   routes.test.tsx, tests/unit/components/MainLayout.test.tsx,
                                                tests/unit/components/ErrorBoundary.test.tsx
```

`DossierShell` reproduces the corrected register exactly. `ErrorBoundary` surfaced two files the
register could not have held, because the boundaries were not in `files_modified`:

| spec                                           | BEFORE (boundaries reverted to `phase-93-base`)                                                                                                                 | AFTER     | delta    |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------- |
| `tests/unit/components/ErrorBoundary.test.tsx` | `Test Files 2 failed (2)` / `Tests no tests` — `Error: Failed to resolve import "@/lib/sentry" from "frontend/src/components/error-boundary/ErrorBoundary.tsx"` | identical | **none** |
| `tests/unit/components/MainLayout.test.tsx`    | (same run) `Error: Failed to resolve import "../../../frontend/src/components/layout/MainLayout" from "tests/unit/components/MainLayout.test.tsx"`              | identical | **none** |

Command: `pnpm exec vitest run tests/unit/components/ErrorBoundary.test.tsx tests/unit/components/MainLayout.test.tsx`.
Attribution was by the revert experiment (`git checkout phase-93-base -- <the two boundary files>`,
then `cp` back from a saved copy, `git diff --stat` confirming restore) — **not** by reading the
error text. Both are pre-existing: the root Vitest config has no `@` alias, and `MainLayout` does
not exist. **Isolated, not repaired, not mine.** Same `E2ESTALE-01`-adjacent class; neither runs in
a required CI job.

---

## Files Created/Modified

- `frontend/src/components/dossier/DossierShell.tsx` — `isError` branch: status-404 →
  `throw notFound({ routeId: rootRouteId })`; anything else → `<QueryErrorState variant="page" onRetry={refetch} isRetrying={isRefetching} />`.
  Happy path and loading path byte-identical. Seven layouts, one edit, zero route files touched.
- `frontend/src/components/error-boundary/ErrorBoundary.tsx` — re-throws `isNotFound(error)` from
  `render()`; skips the Sentry report in `componentDidCatch`.
- `frontend/src/components/app-error-boundary/ErrorBoundary.tsx` — same guard.
- `tests/e2e/93-dossier-notfound.spec.ts` — the two-direction oracle.

## Decisions Made

- **`routeId: rootRouteId` is load-bearing, not decoration.** See Deviation 2 — it is the
  difference between the 404 page and the router's raw `Something went wrong!`.
- **Guard the boundaries, do not add `notFoundComponent` to seven route files.** The plan mandates
  zero route-file edits; the boundary guard is one fix at the point all callers route through, and
  it is what makes `notFound()` usable for 93-12 and 93-13 as well.
- **Test 2 reads a REAL dossier id via a service-role PostgREST call in `beforeAll`.** Forcing a
  rejection on a _fabricated_ id would be measuring absence twice and the discriminator would be
  vacuous. Neither the URL nor the key is ever echoed.
- **`isRedirect()` deliberately NOT added to the boundary guard.** A boundary swallowing
  `redirect()` is the same defect class, but it is not my blocker, I have not measured it, and
  silently changing that path on a shared tree is scope creep. Recorded as an observation, below.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Both app React error boundaries swallowed the thrown `notFound()`**

- **Found during:** Task 2 (first spec run)
- **Issue:** With Task 1 landed exactly as planned, an absent dossier id rendered
  `errorBoundary.title` / `errorBoundary.description` — the fallback of
  `components/error-boundary/ErrorBoundary`, mounted at `routes/_protected.tsx:78` around the
  `<Outlet/>`. TanStack Router's `CatchNotFound` wraps the root match's `MatchInner`
  (`react-router/dist/esm/Match.js:93-104`), so **every** app error boundary — that one and
  `app-error-boundary/ErrorBoundary` at `routes/__root.tsx:54` — sits inside it and catches first.
  The plan's `key_links` entry (throw → root `notFoundComponent`) was unreachable, and
  `notFound()` was structurally unusable anywhere in `frontend/src`. That is why zero call sites
  existed: the pattern could not have worked if anyone had tried.
- **Fix:** each boundary now re-throws when `isNotFound(this.state.error)` in `render()`, and
  returns early from `componentDidCatch` so a deliberate 404 is not filed to Sentry as an error.
  Real errors are untouched.
- **Files modified:** `frontend/src/components/error-boundary/ErrorBoundary.tsx`,
  `frontend/src/components/app-error-boundary/ErrorBoundary.tsx`
- **Verification:** gate 93-11_g2 red → green; both newly-derived consumers re-measured with the
  revert experiment, zero delta.
- **Committed in:** `cf0d9be8`

**2. [Rule 1 - Bug] A bare `notFound()` cannot reach the root boundary in this app**

- **Found during:** Task 2 (second spec run, after deviation 1)
- **Issue:** With both boundaries re-throwing, the page rendered the router's raw
  `Something went wrong!` / `Hide Error` (`react-router/dist/esm/CatchBoundary.js` `ErrorComponent`)
  — not the 404. Cause: `frontend/src/router/index.tsx:72` sets a `defaultErrorComponent`, so
  `Match.js:76` gives **every** match a `CatchBoundary`, whose `onCatch` runs
  `error.routeId ??= matchState.routeId` before re-throwing (`Match.js:86-88`). The innermost match
  is `/_protected/dossiers/countries/$id`, which has no `notFoundComponent`, so by the time the
  root's `CatchNotFound` fallback evaluates
  `error.routeId && error.routeId !== matchState.routeId` (`Match.js:96`) it rejects the error and
  the global `CatchBoundary` in `Matches.js:36` renders the bare fallback.
  Separately: `defaultNotFoundComponent` does **not** help a component-throw — it is only applied
  on the loader path (`router-core/dist/esm/load-matches.js:554-555`).
- **Fix:** `throw notFound({ routeId: rootRouteId })`, the documented targeting option
  (`router-core/dist/esm/not-found.d.ts` marks `global` deprecated in favour of exactly this). The
  pre-stamped id makes the `??=` a no-op and the root's fallback accepts it.
- **Files modified:** `frontend/src/components/dossier/DossierShell.tsx`
- **Verification:** gate 93-11_g2 `2 passed`; browser probe printed the thrown object as
  `{routeId: __root__, isNotFound: true}` followed by the 404 numeral present / error state absent.
- **Committed in:** `cf0d9be8`

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug).
**Impact on plan:** the plan's own `key_links` requirement — thrown `notFound()` **caught by the
root `notFoundComponent`** — is unsatisfiable without both. Neither adds a feature; both are
required for the planned behaviour to exist. Blast radius beyond `files_modified`: two shared error
boundaries, both re-measured against every consumer C9b derives for them (zero delta).

**Cross-plan note for 93-12 and 93-13:** both plan a `notFound()` throw and **both would have hit
this identical wall**. It is fixed for them. Any new thrower in this app must pass
`{ routeId: rootRouteId }` — a bare `notFound()` from a component will render the router's raw
error, not the 404 page.

## Issues Encountered

**Instrument note 1 — the vite dev-server file watcher on this machine does not fire.**
`frontend/vite.config.ts:97` sets `usePolling: false`, and FSEvents did not deliver changes: after
editing a file, `curl http://localhost:5173/src/.../File.tsx` kept returning the **pre-edit**
module through six `touch` + 3s cycles. This produced one entirely misleading spec run (the code
was correct on disk and the browser was executing the old build). **A dev server must be restarted
to be trusted after an edit**, and every measurement in this summary was preceded by
`curl <server>/src/<path> | grep -c <new-token>` to prove which build was being measured.

**Instrument note 2 — only `:5173` is a valid instrument for anything hitting an edge function.**
I tried to avoid disturbing the shared server by running private ones on `:5199` and then `:5002`.
Both produced a _deterministic false red_ on test 1. Cause, found by probe rather than inference:
the deployed `ALLOWED_ORIGINS` secret rejects those origins, so every edge call dies at CORS
preflight —
`Access to fetch at '…/functions/v1/dossiers-get?…' from origin 'http://localhost:5002' has been blocked by CORS policy`.
A CORS failure has no numeric status, so it lands in the _non-404_ branch and renders
`QueryErrorState` — which looks exactly like the fix not working. `supabase/functions/_shared/cors.ts:31-40`
lists 5173/5002/5001/3000 as **fallback** defaults only; the deployed secret overrides them and
admits `:5173` alone. Both directions of gate 93-11_g2 were therefore re-measured on `:5173`; the
`:5199` and `:5002` runs are discarded and are not cited as evidence anywhere above.

**Instrument note 3 — a repo-wide `pnpm type-check` is a shared instrument on a shared tree.**
Gate 93-11_g1's first green attempt failed with three errors in
`frontend/src/components/tags/TagAnalytics.tsx` — another lane's in-flight WIP, not at
`phase-93-base` and not mine. Minutes later the same command was clean without any action from me.
Not a gate defect, but it means a `type-check` red on this tree must be attributed before it is
believed.

**Incident — I killed a process I did not start.** My private server on `:5199` failed to bind
(`Error: Port 5199 is already in use`, in `/tmp/p9311-vite5199.log`) and I did not read that log
before treating the port as mine; the health check answered from the pre-existing process. I later
killed PID 67196 believing it was mine. **Remediation:** I immediately started a fresh vite on
`:5199` (still running, PID 76604) so anything pointed there keeps working; `:5173` is up (PID 79345) and my `:5002` server is stopped. `:5199` is not in the CORS allowlist, so nothing that
depended on it could have been reaching edge functions from it in the first place. Recorded because
it is a real side effect on a shared machine, not because it broke something I can see.

**Observation, not fixed:** the same two boundaries also swallow TanStack Router's `redirect()`
control-flow throw (`isRedirect`). `routes/_protected.tsx:60-62` already special-cases redirects in
`beforeLoad`, so the codebase knows the rule; the component path does not implement it. Unmeasured
and not blocking this plan — flagged, deliberately not touched.

**Also observed, not touched (pre-existing, out of scope):** the fallback of
`components/error-boundary/ErrorBoundary` renders **raw i18n keys** (`errorBoundary.title`,
`errorBoundary.description`, `errorBoundary.refreshPage`, …) — the `errorBoundary` namespace is not
registered. Visible in a snapshot in this plan's evidence. It is a criterion-5-adjacent copy defect
in a file I touched, but repairing it is not in this plan's scope.

## Intended-broken register — untouched

`/delegations`, `/admin/data-retention` legal holds, `/admin/field-permissions` filters, and
`AUDIT-DROP-01` / `AUDIT-ZERO-01` were all left exactly as they are. Nothing in this plan went near
them. No `GRANT SELECT ON auth.users` was proposed, applied, or considered.

## User Setup Required

None — no external service configuration required. No packages installed (T-93-SC: zero installs,
held).

## Threat Flags

`T-93-22` (Information Disclosure) and `T-93-23` (Repudiation) are both mitigated as planned: the
error object never reaches JSX (`QueryErrorState` renders i18n keys only), and the
titleless-chrome-on-failure path is gone — every dossier-detail failure now has a named render. No
new security surface: the change adds no endpoint, no auth path, and no schema change.

One new item worth naming for the threat register, since it is a _reduction_: deliberate 404s are
no longer reported to Sentry as caught exceptions, so the error stream stops being polluted by
normal navigation.

## Next Phase Readiness

- Criterion 3's dossier-detail third holds on all seven typed layouts, proven in both directions.
- **93-12 and 93-13 are unblocked** by deviation 1 and must adopt `notFound({ routeId: rootRouteId })`
  (deviation 2). If either already landed a bare `notFound()`, it is silently rendering the
  router's raw error rather than the 404 page and should be re-measured.
- `E2ESTALE-01` (Phase 101) gains two more members: `tests/unit/components/ErrorBoundary.test.tsx`
  and `tests/unit/components/MainLayout.test.tsx`, both failing at import resolution at
  `phase-93-base`. Reported, not repaired.

## BLOCKED

None.

---

_Phase: 93-failure-visibility_
_Completed: 2026-08-15_

## Self-Check: PASSED

- `tests/e2e/93-dossier-notfound.spec.ts` — FOUND on disk and at `HEAD`
- `.planning/phases/93-failure-visibility/93-11-SUMMARY.md` — FOUND
- `4bb258d8` — FOUND in `git log --all`
- `cf0d9be8` — FOUND in `git log --all`
- Both gates were last measured GREEN (`93-11_g1` EXIT=0, `93-11_g2` EXIT=0) against the exact
  file contents that were then committed — `git status --porcelain frontend/src/components tests/e2e/93-dossier-notfound.spec.ts`
  returns empty after `cf0d9be8`, so the measured content and the committed content are identical.
  The gates were not re-executed a further time after the commit.
