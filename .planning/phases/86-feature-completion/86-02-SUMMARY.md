---
phase: 86-feature-completion
plan: 02
subsystem: ui
tags:
  [
    react,
    tanstack-router,
    tanstack-query,
    react-hook-form,
    zod,
    supabase-edge-functions,
    user-management,
    rbac,
    i18n,
    rtl,
  ]

# Dependency graph
requires:
  - phase: 019-user-management-access
    provides: create-user / assign-role / deactivate-user / reactivate-user edge functions (L1-hardened, deployed on staging)
  - phase: 61 (v6.5)
    provides: requireAdmin guard unified on public.users.role
provides:
  - Admin-gated /users route family (layout + index + create) with one requireAdmin beforeLoad on the parent
  - Typed service invoke methods createUser/assignRole/deactivateUser/reactivateUser + clearance field on CreateUserRequest
  - UserCreatePage RHF+Zod create flow mirroring the deployed create-user validators, invoking create-user v2
  - roles.editor + createForm i18n block (EN + AR)
  - Verified assign-role edge fn ACTIVE v2 on staging (research risk A2 closed)
affects: [86-04, user-management, detail-page]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'TanStack flat route -> layout(Outlet)+beforeLoad conversion so one requireAdmin gates the whole /users family'
    - 'supabase.functions.invoke service methods mirroring delegatePermissions verbatim per fn'
    - 'Zod schema mirrors deployed edge validators; DUPLICATE_* codes recovered from FunctionsHttpError.context Response -> field-level form.setError'

key-files:
  created:
    - frontend/src/routes/_protected/users/index.tsx
    - frontend/src/routes/_protected/users/create.tsx
    - frontend/src/pages/users/UserCreatePage.tsx
    - frontend/src/pages/users/__tests__/UserCreatePage.test.tsx
  modified:
    - frontend/src/services/user-management-api.ts
    - frontend/src/routes/_protected/users.tsx
    - frontend/src/pages/users/UsersListPage.tsx
    - frontend/src/i18n/en/user-management.json
    - frontend/src/i18n/ar/user-management.json
    - frontend/src/routeTree.gen.ts

key-decisions:
  - 'assign-role was already ACTIVE v2 on staging — verified + routability-smoked (401 not 404); no deploy or fn-source edit needed'
  - 'clearance validated as an optional string refine (/^[1-4]$/) converted to number at submit — same integer-1-4 semantics as the deployed validator, avoids RHF/zod input-vs-output typing friction'
  - "role defaults to viewer (least privilege) so z.enum(['admin','editor','viewer']) stays bare/greppable with no required-enum empty-value message needed"

patterns-established:
  - 'Route family gating: parent layout beforeLoad: requireAdmin covers /users, /users/create, and future /users/:id'
  - 'Edge-error field mapping: extractEdgeErrorCode reads FunctionsHttpError.context.json().code, never masking DUPLICATE_* behind a generic toast'

requirements-completed: [FEAT-02]

# Metrics
duration: ~25min
completed: 2026-07-06
---

# Phase 86 Plan 02: User-Management Route Family + Create Flow Summary

**Admin-gated /users layout family with an RHF+Zod create form that mirrors the L1-hardened create-user edge validators and invokes create-user v2, plus the four service invoke methods and verified assign-role deployment for plan 86-04.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-07-06T11:45:00Z (approx)
- **Completed:** 2026-07-06T11:07:00Z (SUMMARY)
- **Tasks:** 3 (Task 3 is TDD: RED + GREEN)
- **Files modified:** 10 (4 created, 6 modified — incl. generated routeTree.gen.ts)

## Accomplishments

- Verified the one deployment risk this phase (research A2 / Pitfall 8): `assign-role` is ACTIVE **v2** on staging (`zkrcjzdemdmwhearhfgg`); unauth POST returns 401 (routable, not 404). `create-user` v3, `deactivate-user` v2, `reactivate-user` v2 also confirmed ACTIVE. No fn source edited, no CORS widened (Phase 90 owns that).
- Added four typed service invoke methods (`createUser`, `assignRole`, `deactivateUser`, `reactivateUser`) mirroring `delegatePermissions`, plus the missing `clearance?: number` field on `CreateUserRequest`.
- Converted `/users` from a flat route to a layout (`<Outlet/>`) that keeps `beforeLoad: requireAdmin`, so one guard gates `/users`, `/users/create`, and the future `/users/:id`. Added the index child mounting the existing list page.
- Built `UserCreatePage` (full-page RHF+Zod form) that mirrors the deployed validators (email regex, username `^[a-z0-9_-]{3,50}$`, full_name 2-100, role admin/editor/viewer, optional clearance int 1-4), hardcodes `user_type: 'employee'`, invokes `createUser` via a `useMutation` invalidating `['users']`, maps `DUPLICATE_EMAIL`/`DUPLICATE_USERNAME` to field-level errors, and navigates back to `/users` on success.
- Wired a typed "Create user" TanStack `Link` button into the list-page header; added `roles.editor` and a `createForm` i18n block (EN + AR).

## Task Commits

1. **Task 1: service invoke methods + clearance field + roles.editor i18n + assign-role verification** - `608f9855` (feat)
2. **Task 2: convert users.tsx to admin-gated layout with index child** - `17a615a0` (feat)
3. **Task 3 (TDD RED): failing UserCreatePage test** - `3308c65b` (test)
4. **Task 3 (TDD GREEN): UserCreatePage + create route + list button + i18n** - `8c188e63` (feat)

_TDD gate sequence satisfied: `test(...)` (3308c65b) precedes `feat(...)` (8c188e63)._

## Files Created/Modified

- `frontend/src/services/user-management-api.ts` - Added createUser/assignRole/deactivateUser/reactivateUser invoke methods + `clearance?: number` on CreateUserRequest
- `frontend/src/routes/_protected/users.tsx` - Flat route → layout (`<Outlet/>`) keeping `beforeLoad: requireAdmin`
- `frontend/src/routes/_protected/users/index.tsx` - Index route mounting the existing list page (UsersPage)
- `frontend/src/routes/_protected/users/create.tsx` - Route mounting UserCreatePage
- `frontend/src/pages/users/UserCreatePage.tsx` - RHF+Zod create form invoking createUser()
- `frontend/src/pages/users/__tests__/UserCreatePage.test.tsx` - 6 unit tests (role set, username/clearance validation, submit payload+navigate, DUPLICATE_EMAIL/USERNAME field mapping)
- `frontend/src/pages/users/UsersListPage.tsx` - Surgical: "Create user" Link button in the PageHeader actions slot
- `frontend/src/i18n/en/user-management.json` / `ar/user-management.json` - Added `roles.editor` and the `createForm` block
- `frontend/src/routeTree.gen.ts` - Regenerated via the TanStack router generator (never hand-edited)

## Decisions Made

- **assign-role deploy verification:** already ACTIVE v2; verified via `supabase functions list` + a 401 routability smoke. Recorded, no deploy performed.
- **clearance schema shape:** implemented as an optional string with a `/^[1-4]$/` refine, converted to a number at submit — semantically identical to the plan's `z.number().int().min(1).max(4).optional()` (integer 1-4) but avoids the RHF/zod input-vs-output generic-typing friction for a numeric field bound to a text control.
- **role default = viewer:** keeps `z.enum(['admin', 'editor', 'viewer'])` bare (satisfies the grep gate) and defaults to least privilege.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Added `createForm` i18n block (EN + AR)**

- **Found during:** Task 3 (UserCreatePage)
- **Issue:** The create form needs label/validation/toast copy (subtitle, clearance label, submit, created/submitFailed, and four validation error messages). The plan's Task 3 `<files>` listed the page/route/test/list-page but not the i18n JSON; the form cannot render honest localized copy without these keys.
- **Fix:** Added a cohesive `createForm` block to both `en/` and `ar/` user-management.json (symmetric), reusing existing `userProfile.*`, `roles.*`, `actions.*`, and `userOnboarding.duplicateEmail/duplicateUsername` where they already existed.
- **Files modified:** frontend/src/i18n/en/user-management.json, frontend/src/i18n/ar/user-management.json
- **Verification:** `pnpm lint` (check-i18n-namespaces) green; the 6 unit tests assert the rendered copy.
- **Committed in:** 8c188e63 (Task 3 GREEN commit)

**2. [Rule 3 - Blocking] Route tree regeneration mechanism**

- **Found during:** Task 2 (route conversion)
- **Issue:** The worktree had no standalone `tsr`/router-generator CLI; `routeTree.gen.ts` only regenerates as a Vite plugin side effect on dev/build, and type-check requires the new route ids registered.
- **Fix:** Drove the `tanstackRouterGenerator` plugin's `buildStart` hook via a throwaway node script (created and deleted in the same step) using the exact `vite.config.ts` router options. Never hand-edited the generated file.
- **Files modified:** frontend/src/routeTree.gen.ts (regenerated)
- **Verification:** type-check exits 0 with `/_protected/users/` and `/_protected/users/create` ids present.
- **Committed in:** 17a615a0 (Task 2) and 8c188e63 (Task 3)

---

**Total deviations:** 2 auto-fixed (1 missing-critical i18n, 1 blocking tooling). **Impact:** Both necessary to ship a working, localized, admin-gated create flow. No scope creep — no fn source edited, no CORS widened, no new packages.

## Issues Encountered

- **No node_modules in the worktree:** ran `corepack pnpm install --frozen-lockfile` (16s) before any type-check/lint/test. Lockfile unchanged; node_modules is gitignored.

## Known Stubs

None in this plan's new code — UserCreatePage is fully wired to the deployed `create-user` fn.

## Pre-existing Gaps Recorded (out of FEAT-02 scope)

- **No activation flow:** created users are `is_active: false` pending activation; the activation email is a `console.log` stub in the edge fn and there is **no `/activate` route**. This is a pre-existing gap explicitly out of FEAT-02 scope — new users will not appear under an "active" filter (plan 86-04's live E2E must assert with the default "all" filter).
- **List-filter role drift:** `roles.manager`/`roles.staff` remain in i18n and the UsersListPage 4-role filter still lists manager/staff. Left untouched (out of scope); the create form correctly offers only admin/editor/viewer.

## Threat Flags

None — no security surface introduced beyond the plan's threat_model. Routes are admin-gated by the layout `beforeLoad`; every edge fn 403s non-admins independently via `public.users.role`; no `user_metadata`/`app_metadata` authz reads; no new packages; CORS not widened.

## Next Phase Readiness

- Foundation ready for plan **86-04** (user detail page): `/users` layout family, the four service invoke methods (assignRole/deactivateUser/reactivateUser typed and ready), and verified assign-role v2 deployment are all in place. The `/users/:id` route can attach as a child of the existing admin-gated layout with no extra beforeLoad.
- Live E2E create→list→detail smoke lands in plan 86-04's combined spec.

---

_Phase: 86-feature-completion_
_Completed: 2026-07-06_
