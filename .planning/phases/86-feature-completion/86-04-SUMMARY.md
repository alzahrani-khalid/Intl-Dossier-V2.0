---
phase: 86-feature-completion
plan: 04
subsystem: ui
tags:
  [
    react,
    tanstack-router,
    tanstack-query,
    supabase-edge-functions,
    user-management,
    rbac,
    rls,
    idor,
    i18n,
    rtl,
    playwright,
  ]

# Dependency graph
requires:
  - phase: 86-02
    provides: admin-gated /users layout family, user-management-api invoke methods (assignRole/deactivateUser/reactivateUser), UsersListPage, verified assign-role v2 on staging
  - phase: 019-user-management-access
    provides: L1-hardened assign-role / deactivate-user / reactivate-user edge functions (dual-approval, is_active flip)
provides:
  - /users/:id detail view (UserDetailPage) with profile read + role/status admin actions against the hardened fns
  - Clickable users-list rows navigating to the typed /users/$id route
  - Dual-approval union-response branch that SURFACES requires_approval (toast, no local role update) — never masks it
  - Combined user-management E2E covering create → list → detail → role/status + IDOR smoke + AR pass
affects: [user-management, detail-page]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Composite detail page: house direct-select read (.eq(id).single()) + service-invoke writes in useMutation'
    - 'Cache discipline: setQueryData patches the authoritative detail from the fn response; list variants invalidated via a predicate that excludes the detail key (no clobber)'
    - "Dual-approval union branch: `'requires_approval' in result` → surface toast + STOP (T-86-13)"

key-files:
  created:
    - frontend/src/routes/_protected/users/$id.tsx
    - frontend/src/pages/users/UserDetailPage.tsx
    - frontend/src/pages/users/__tests__/UserDetailPage.test.tsx
    - frontend/tests/e2e/user-management.spec.ts
  modified:
    - frontend/src/pages/users/UsersListPage.tsx
    - frontend/src/i18n/en/user-management.json
    - frontend/src/i18n/ar/user-management.json
    - frontend/src/routeTree.gen.ts

key-decisions:
  - "Detail read reuses UsersListPage's column list with `.eq('id', userId).single()`; the list page's ilike search block is deliberately NOT copied (SEC-01 injection class — T-86-14)"
  - "Immediate role change patches the detail cache from the fn's returned new_role and invalidates only list variants (predicate excludes detail) — avoids a redundant detail refetch and keeps the display authoritative"
  - 'Deactivation gated behind an AlertDialog confirm (house pattern); reactivation is a direct action (non-destructive)'
  - 'MFA rendered as an accessible check icon (role=img + aria-label) rather than minting new on/off i18n keys'

requirements-completed: [FEAT-03]

# Metrics
duration: ~35min
completed: 2026-07-06
---

# Phase 86 Plan 04: User Detail / Management View Summary

**The /users/:id detail surface — profile read via the house direct-select pattern, role change through the verified `assign-role` fn with the dual-approval union response honestly surfaced, status flip through `deactivate-user`/`reactivate-user`, clickable list rows, and a combined create→list→detail→role/status E2E with an anon-client IDOR smoke and an Arabic pass.**

## Performance

- **Duration:** ~35 min
- **Completed:** 2026-07-06
- **Tasks:** 3 (Tasks 1 & 2 are TDD: RED + GREEN each; Task 3 is the E2E spec)
- **Files:** 8 (4 created, 4 modified — incl. generated routeTree.gen.ts)

## Accomplishments

- Added `routes/_protected/users/$id.tsx` — a param route (`Route.useParams()` → `<UserDetailPage userId={id} />`) with no per-child `beforeLoad`; the 86-02 layout's `requireAdmin` gates it. Regenerated `routeTree.gen.ts` so `/_protected/users/$id` is registered.
- Built `UserDetailPage` read half: `useQuery` keyed `['users','detail',userId]` selecting the same columns as the list (minus count) via `.eq('id', userId).is('deleted_by', null).single()`. Renders email, username, full name, department, role badge, active/inactive status badge, MFA indicator, and `last_login_at` via `formatDayFirstYear` (Latin day-first). Loading + `role="alert"` error states.
- Built the write half: a role `Select` locked to `['admin','editor','viewer']` + an Assign action calling `assignRole`. The union response is branched with `'requires_approval' in result` — the approval branch surfaces `roles.roleRequiresApproval` (toast) and applies **no** local change (T-86-13); the immediate branch patches the detail cache with the returned `new_role`, invalidates list variants, and toasts success with the `sessions_terminated` count.
- Status management: destructive Deactivate behind an `AlertDialog` confirm, and a direct Reactivate, both calling the hardened fns and flipping the status badge via `setQueryData`. Deactivation surfaces `orphanedItems` through the existing `userDeactivation.*` keys in the toast description.
- Made `UsersListPage` rows (desktop table + mobile cards) navigate to the typed `/users/$id` route (params, never an interpolated path), keyboard-accessible (`role="link"`, `tabIndex`, Enter handler). Did NOT touch the `.or(...)` search block or the role filter.
- Wrote `user-management.spec.ts`: the full D-10 loop (create via create-user → row visible under the default "all" filter → detail read → immediate role change → admin grant surfaces the dual-approval toast and is not applied → deactivate/reactivate), an anon supabase-js IDOR read that must return 0 rows (RLS empty 200), and an AR pass asserting `dir="rtl"` + localized strings on both pages.

## Task Commits

1. **Task 1 (TDD RED): failing UserDetailPage read tests** — `784533ed` (test)
2. **Task 1 (TDD GREEN): read half + $id route + clickable list rows + department i18n** — `7b625d11` (feat)
3. **Task 2 (TDD RED): failing role/status management tests** — `66d7edd3` (test)
4. **Task 2 (TDD GREEN): role + status management (dual-approval surfaced) + sessionsTerminatedCount i18n** — `fe5cf83d` (feat)
5. **Task 3: combined user-management E2E (loop + IDOR + AR)** — `4cfa3ea5` (test)

_TDD gate sequences satisfied: 784533ed (test) precedes 7b625d11 (feat); 66d7edd3 (test) precedes fe5cf83d (feat)._

## Files Created/Modified

- `frontend/src/routes/_protected/users/$id.tsx` — param route mounting UserDetailPage under the admin-gated layout
- `frontend/src/pages/users/UserDetailPage.tsx` — detail read + role/status admin actions against the hardened fns
- `frontend/src/pages/users/__tests__/UserDetailPage.test.tsx` — 7 unit tests (3 read, 4 write incl. the requires_approval L1 control)
- `frontend/tests/e2e/user-management.spec.ts` — combined create→list→detail→role/status E2E + IDOR smoke + AR pass
- `frontend/src/pages/users/UsersListPage.tsx` — surgical: rows navigate to /users/$id (typed route + params, keyboard-accessible)
- `frontend/src/i18n/en|ar/user-management.json` — added `userProfile.department` and `roles.sessionsTerminatedCount` (symmetric EN+AR)
- `frontend/src/routeTree.gen.ts` — regenerated via the TanStack router generator (never hand-edited)

## Decisions Made

- **No detail refetch on write:** the mutation patches `['users','detail',id]` from the fn's authoritative response and invalidates only list variants (`predicate: q.queryKey[0]==='users' && q.queryKey[1]!=='detail'`). Honest (the server already applied the change) and avoids a redundant round-trip / a stale-mock clobber in tests.
- **requires_approval is the L1 "no-mask" control:** the approval branch never updates the local role and never builds an approvals UI (the `approve-role-change` fn is out of this phase's scope).
- **Deactivation confirm only:** destructive action gets an AlertDialog; reactivation is direct.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — Missing critical i18n] Added `userProfile.department` + `roles.sessionsTerminatedCount` (EN+AR)**

- **Found during:** Tasks 1 and 2.
- **Issue:** The detail page renders a Department field and a role-change success toast that names the terminated-session count; neither key existed. Without them the copy would leak raw keys (fails the i18n check + AR).
- **Fix:** Added both keys symmetrically to `en/` and `ar/` user-management.json.
- **Verification:** `node scripts/check-i18n-namespaces.mjs` OK; unit tests assert the rendered copy.
- **Committed in:** 7b625d11 (department) and fe5cf83d (sessionsTerminatedCount).

**2. [Rule 3 — Blocking] Route-tree regeneration mechanism**

- **Found during:** Task 1 (adding the `$id` route).
- **Issue:** The worktree has no standalone `tsr` CLI; `routeTree.gen.ts` only regenerates as a Vite plugin side-effect, and type-check needs the new route id registered.
- **Fix:** Drove `@tanstack/router-generator`'s `Generator(...).run()` via a throwaway CJS script (created and deleted in the same step) using the exact `vite.config.ts` options. Never hand-edited the generated file.
- **Verification:** type-check exits 0 with `/_protected/users/$id` present.
- **Committed in:** 7b625d11.

**Minor (TDD iteration, not plan deviations):** two read-test assertions were relaxed from `getByText` to `getAllByText` because the honest implementation renders the email in both the header subtitle and the Email field, and the role label in both the overview badge and the role-change picker. The RED tests still fail without the implementation.

## Deferred Verification

- **Live Playwright run (Task 3 `<verify>`):** the E2E spec compiles and is discoverable (`playwright test … --list` → 1 test, exit 0), but the live run requires a running app (dev server or `E2E_BASE_URL`) plus admin `TEST_USER_*` credentials. In this worktree the app is not running and `.env.test` injected 0 vars, so the loop could not be executed green here. Run it once the app + creds are available: `pnpm --dir frontend exec playwright test tests/e2e/user-management.spec.ts`.
- **Non-admin-JWT IDOR variant (T-86-12):** the anon-client read is implemented; the additional non-admin-JWT read is a documented follow-up (requires a seeded non-admin fixture account not present in the current `.env.test`).

## Known Stubs

None in this plan's new code — the detail page reads real profile data and all three admin actions call the deployed, L1-hardened edge functions.

## Pre-existing Gaps (unchanged, out of scope — carried from 86-02)

- **List-filter role drift:** `UsersListPage` still lists `manager`/`staff` in its role filter and both keys remain in i18n. Untouched here; the detail role picker correctly offers only admin/editor/viewer (grep-gated).
- **No activation flow:** created users are `is_active:false` with no `/activate` route (edge-fn activation email is a console stub). The E2E asserts with the default "all" filter accordingly (Pitfall 7).

## Threat Flags

None — no security surface beyond the plan's threat_model. The detail read is a plain `.eq('id', …)` builder (no ilike interpolation — T-86-14); role/status writes go through the hardened fns which 403 non-admins and own session termination server-side (T-86-15); the dual-approval response is surfaced, never masked (T-86-13); no new packages; CORS not widened.

## Self-Check: PASSED

All 4 created files present; all 5 task commits verified in git log (784533ed, 7b625d11, 66d7edd3, fe5cf83d, 4cfa3ea5). Unit suite green (7/7 UserDetailPage tests; full frontend suite 1490 passed). type-check + full `pnpm lint` (eslint + i18n + rtl + bootstrap parity + date-formatting) exit 0.

---

_Phase: 86-feature-completion_
_Completed: 2026-07-06_
