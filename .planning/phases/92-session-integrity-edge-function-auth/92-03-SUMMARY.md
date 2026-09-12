---
phase: 92-session-integrity-edge-function-auth
plan: 03
subsystem: ui
tags: [react, tanstack-query, i18n, rtl, playwright, error-states]

# Dependency graph
requires:
  - phase: 92-01
    provides: tests/e2e/92-delegations-error.spec.ts (the forced-error oracle this plan turns green)
  - phase: 92-04
    provides: my-delegations auth half (deployed 2026-08-15T10:29:44Z, 401 → 200) — the happy-path test only became a real oracle after it
provides:
  - '/delegations renders a role="alert" failure state (heading + body + retry) when the my-delegations query is rejected'
  - 'All three /delegations stat cards render an em-dash instead of 0 while the query is in error'
  - 'delegation:list.error.{title,description,retry} in en + ar'
affects: [TRUST-01, phase-93, delegations, error-state-patterns]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Inline error state mirroring EmptyState md geometry (centered column, py-10/12, circular icon wrapper) with danger semantics — built in-page rather than by widening the shared EmptyState for a single consumer'
    - 'Unknown-count rendering: a failed query renders an em-dash, never a confident 0'

key-files:
  created: []
  modified:
    - frontend/src/pages/delegations/DelegationManagementPage.tsx
    - frontend/src/i18n/en/delegation.json
    - frontend/src/i18n/ar/delegation.json

key-decisions:
  - 'Error block replaces the whole Tabs region (one failure, one message) rather than being duplicated per tab'
  - 'The expiring stat card also renders the em-dash under isError, and its warning border/icon are suppressed there — a warning highlight next to an unknown value asserts something the app does not know'
  - 'Explanatory comment placed in TS statement position above the useMyDelegations destructure (D-1 / RULING-P92-44) — inside JSX it would render as literal page text and would be counted by the Task 1 gate'

patterns-established:
  - 'ERROR vs EMPTY distinctness: different icon semantics (AlertTriangle/text-danger on bg-danger/10 vs neutral), different heading, different body, an action, and role="alert" — per 92-UI-SPEC Surface 3'

requirements-completed: [AUTH-04]

# Metrics
duration: ~20min
completed: 2026-08-15
---

# Phase 92 Plan 03: /delegations Error State Summary

**`/delegations` now reports a rejected `my-delegations` query as a `role="alert"` failure with a retry action and em-dash stats, instead of the onboarding empty state over confident zeros.**

## Performance

- **Duration:** ~20 min
- **Tasks:** 2 of 2
- **Files modified:** 3

## Accomplishments

- `isError` is destructured from `useMyDelegations` and drives an inline error block that replaces the list area of **both** tabs at once.
- The error block mirrors `EmptyState` md geometry (centered column, `py-10 px-4 sm:py-12 sm:px-6`, circular icon wrapper) with inverted semantics: `AlertTriangle` in `text-danger` on `bg-danger/10`, `role="alert"` on the container, `.btn-primary` "Try again" wired to `refetch`, icon spacing via logical properties (`isRTL ? 'ms-2' : 'me-2'`).
- All three stat cards render `—` while `isError`; the expiring card's warning border/icon are additionally suppressed under error so styling never implies a known value.
- No internal string reaches the DOM — copy is i18n only, in both locales, added in a single edit.

## Task Commits

1. **Task 1: isError branch + inline error state + em-dash stats** — `894f957b` (feat)
2. **Task 2: Error strings (en + ar) and forced-error verification** — `a853f1d1` (feat)

`git show --stat` on both commits showed only this plan's own files. Nothing from another lane was swept in.

## Files Created/Modified

- `frontend/src/pages/delegations/DelegationManagementPage.tsx` — `isError` destructure + explanatory comment (TS statement position), `statFigure()` em-dash helper, `role="alert"` error block replacing the Tabs region, `RefreshCw` import.
- `frontend/src/i18n/en/delegation.json` — `list.error.{title,description,retry}`.
- `frontend/src/i18n/ar/delegation.json` — same three keys, Arabic copy per the UI-SPEC contract (reuses the bundle's established noun تفويضات).

## Gates

### Task 1 gate

Command (verbatim, from repo root):

```
cd frontend && pnpm type-check && grep -q 'role="alert"' src/pages/delegations/DelegationManagementPage.tsx && test "$(grep -v '^[[:space:]]*//' src/pages/delegations/DelegationManagementPage.tsx | grep -c 'error?.message\|error\.message')" -eq 0
```

Verbatim output:

```
> intake-frontend@1.0.0 type-check /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend
> tsc --noEmit

EXIT=0
```

**Exit code: 0. Verdict: PASS.**

### Task 2 gate

Command (verbatim, from repo root):

```
OUT=$(pnpm exec playwright test tests/e2e/92-delegations-error.spec.ts --project=chromium-en --no-deps 2>&1) && echo "$OUT" | grep -qE '\b2 passed' && node -e "const en=require('./frontend/src/i18n/en/delegation.json'),ar=require('./frontend/src/i18n/ar/delegation.json'),k=['title','description','retry'];const g=o=>o&&o.list&&o.list.error||{};process.exit(k.every(x=>g(en)[x]&&g(ar)[x]&&g(ar)[x]!==g(en)[x])?0:1)"
```

Verbatim output (`GATE2_EXIT` is the gate's own exit code; the Playwright output below it is `$OUT`):

<!-- prettier-ignore -->
```
GATE2_EXIT=0
◇ injected env (6) from .env.test // tip: ⌁ auth for agents [www.vestauth.com]

Running 2 tests using 2 workers

◇ injected env (0) from .env.test // tip: ⌘ custom filepath { path: '/custom/path/.env' }
◇ injected env (0) from .env.test // tip: ⌘ override existing { override: true }
  ✓  2 [chromium-en] › tests/e2e/92-delegations-error.spec.ts:85:7 › AUTH-04 delegations failure is rendered as failure › unblocked load renders without the error alert (5.9s)
  ✓  1 [chromium-en] › tests/e2e/92-delegations-error.spec.ts:52:7 › AUTH-04 delegations failure is rendered as failure › blocked my-delegations renders the error alert, never an empty state (10.5s)

  2 passed (10.8s)
```

**Exit code: 0. Verdict: PASS.**

The i18n half of the gate (both locales carry all three keys, Arabic ≠ English on each) was also run standalone and printed both key sets, exit 0.

### Supplementary check (not a plan gate, run per the plan's `<verification>` block)

```
pnpm exec eslint src/pages/delegations/DelegationManagementPage.tsx --max-warnings 0
ESLINT_EXIT=0
```

## Environment setup performed for the gate

The spec needs the app running and an authenticated session. `.env.test` carries no `E2E_BASE_URL`, so the root Playwright config would otherwise spawn the whole monorepo `pnpm dev` (turbo) while a backend already holds port 5001. To keep the gate command byte-identical and avoid a port-conflict false red, `pnpm dev` was started in `frontend/` first (Vite on :5173, verified `HTTP 200`); Playwright's `reuseExistingServer` then reused it rather than spawning turbo. No env var was set, no config was touched. The dev server was stopped after the run.

Authentication is inline in the spec from `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` (values never echoed); `--no-deps` was passed exactly as written, so the throwing `setup` project (external blocker `E2ECRED-01`) never ran.

## Decisions Made

- **Error block placement:** replaces the entire `Tabs` region inside the main card's `CardContent`, so one failure produces one message across both tabs (plan-directed). The card header and the "show active only" toggle stay mounted.
- **Expiring stat under error:** renders `—` and drops the warning border/icon. `expiringSoon` is a separate query, but its data flows through the same page-level "we could not load your delegations" story; showing a warning-tinted figure beside two em-dashes would read as a known value.
- **No shared-component extension:** the error state is inline in the page rather than a new `variant` on `EmptyState`, per the plan's explicit instruction not to widen a shared component for a single consumer.

## Deviations from Plan

None — plan executed exactly as written. No deviation rules fired.

## Issues Encountered

None. The one real risk (the JSX-comment trap from `RULING-P92-44`) was avoided by construction: the explanatory comment sits above the `useMyDelegations` destructure in TypeScript statement position.

## GATE CONCERN

None. No `<automated>` gate text was edited, in this plan or any other.

## Known Stubs

None.

## Threat Flags

None. The plan's `<threat_model>` entries are both mitigated in the shipped code: `T-92-04` (rejected query renders as `role="alert"` failure with em-dash stats) and `T-92-08` (only i18n copy reaches the DOM; the grep half of the Task 1 gate is the standing check). No new endpoint, auth path, file access, or schema surface was introduced.

## WHAT THIS DOES NOT ESTABLISH

- **No RTL render was observed.** Arabic copy is present in the bundle and byte-verified against `git show HEAD:…`, but the error state was never rendered with `dir="rtl"`, and Tajawal application was not confirmed. The plan defers this to the phase-end human check; it remains unobserved.
- **No visual render at 1024px / 1400px.** The Definition-of-Done widths were not exercised. The gate is DOM-assertive (`role="alert"`, text, `—`), not pixel-assertive, so geometry, spacing, contrast, and the `.btn-primary` recipe rendering are unverified by anything I ran.
- **The happy-path test is data-dependent and passed against staging as it stood at 13:52 local.** It asserts "no alert + (rows or the legitimate empty state) + an integer stat". It passed because `my-delegations` currently returns 200 (92-04's deploy, ledger row 4). If that regressed to 401 the test would go red — which is the correct behaviour now, but it means this green certifies the _deployed staging state_ at run time, not the page in isolation.
- **The retry button's `refetch` was not exercised.** The spec asserts the button is visible inside the alert; nobody clicked it, so recovery-after-retry is unverified.
- **Only `chromium-en` ran.** `chromium-ar-smoke` and `chromium-mobile` were not run. The `setup` project was skipped by `--no-deps`, so nothing here says anything about the `E2E_*` credential blocker (`E2ECRED-01`).
- **No other test suite was run.** No Vitest, no lint over the repo, no build. ESLint was run on the one touched `.tsx` file only; the two JSON files were formatted by `prettier` via the pre-commit hook, not independently linted by me.
- **The `error` object is still unused.** Only `isError` is read. Nothing was done about surfacing failure detail to logs/telemetry — out of this plan's scope, and the repository-layer fix remains `TRUST-01` (Phase 93), deliberately not pre-empted.

## Self-Check: PASSED

- `FOUND: 894f957b` (Task 1 commit, `git log --oneline --all`)
- `FOUND: a853f1d1` (Task 2 commit)
- `FOUND: .planning/phases/92-session-integrity-edge-function-auth/92-03-SUMMARY.md`
- `FOUND: frontend/src/pages/delegations/DelegationManagementPage.tsx` at `894f957b` (verified via `git show HEAD:<file>`)
- `FOUND: frontend/src/i18n/ar/delegation.json` `list.error` block at `a853f1d1` (verified via `git show HEAD:<file>`)

---

_Phase: 92-session-integrity-edge-function-auth_
_Completed: 2026-08-15_
