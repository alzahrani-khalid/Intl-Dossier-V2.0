---
phase: quick-260531-tko
plan: 01
subsystem: ui
tags: [react, tanstack-router, supabase, i18n, a11y, zustand, edge-functions]

requires: []
provides:
  - Working-groups list count + soft-delete archive no longer reference a non-existent dossiers.archived column
  - /search renders DossierSearchPage (no redirect)
  - /analytics renders AnalyticsDashboardPage (no redirect)
  - Flat login surface + functional forgot-password flow (en+ar)
  - Required-field asterisks no longer pollute the screen-reader accessible name (login + shared input)
  - notifications-center hook primary call points at the deployed edge function
affects: [working-groups, dossier-search, analytics, auth, notifications]

tech-stack:
  added: []
  patterns:
    - 'Async onClick handlers use the repo idiom onClick={() => void handleX()} to satisfy no-misused-promises'
    - 'Route validateSearch uses the cast-per-field idiom returning a typed SearchParams interface'

key-files:
  created: []
  modified:
    - frontend/src/hooks/useWorkingGroups.ts
    - frontend/src/routes/_protected/search.tsx
    - frontend/src/routes/_protected/analytics.tsx
    - frontend/src/auth/LoginPageAceternity.tsx
    - frontend/src/store/authStore.ts
    - frontend/src/i18n/en/common.json
    - frontend/src/i18n/ar/common.json
    - frontend/src/components/forms/FormInputAceternity.tsx
    - frontend/src/hooks/useNotificationCenter.ts

key-decisions:
  - 'Task 4 store location: added resetPassword to store/authStore.ts (the store the login page actually consumes via useAuthStore) instead of services/auth.ts named in the original finding, to avoid wiring a second store into the page.'
  - "Task 6 branch taken: wired the primary call to the edge function (baseUrl 'edge'); the Supabase-direct catch fallback was preserved unchanged."

patterns-established:
  - 'Pattern 1: Async UI handlers in JSX wrapped as () => void handleX() (matches PushOptInBanner).'
  - "Pattern 2: Soft-delete/archival on dossiers is expressed via status === 'archived', never a boolean archived column."

requirements-completed: [TKO-WALKTHROUGH-FIXES]

duration: 18min
completed: 2026-05-31
---

# Phase quick-260531-tko: Post-Walkthrough Fixes Summary

**Six surgical post-walkthrough fixes: removed a non-existent `dossiers.archived` column reference, restored two dead routes (/search, /analytics), made login flat + gave it a working forgot-password flow, fixed required-asterisk a11y in two places, and pointed the notifications-center hook at the deployed edge function.**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-05-31
- **Completed:** 2026-05-31
- **Tasks:** 6
- **Files modified:** 9

## Accomplishments

- Working-groups count query and soft-delete update now use `status`/`status: 'archived'` only — no write to a column that does not exist in the live DB.
- `/search` and `/analytics` render their real, complete pages instead of bouncing to `/dashboard`.
- Login page is a flat token surface with a working forgot-password button (validates the entered email, calls `resetPasswordForEmail`, toasts success/guidance in en + ar).
- Required-field asterisks on the login password field and the shared `FormInputAceternity` are `aria-hidden` (no more garbled accessible-name concatenation), with requiredness announced via `required`/`aria-required`.
- The notifications-center hook's primary call targets the deployed, user-JWT-authenticated edge function, eliminating the always-failing Express primary call (fallback retained as a safety net).

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix non-existent dossiers.archived column in useWorkingGroups** - `64fdd309` (fix)
2. **Task 2: Restore /search route to render DossierSearchPage** - `3196735d` (fix)
3. **Task 3: Restore /analytics route to render AnalyticsDashboardPage** - `ab01b257` (fix)
4. **Task 4: Login polish — flat surface, working forgot-password, a11y asterisk** - `5d946c7a` (fix)
5. **Task 5: a11y required asterisk in shared FormInputAceternity** - `aa3840c2` (fix)
6. **Task 6: Point notifications-center hook at the deployed edge function** - `1da915b1` (fix)

_Plan/STATE/SUMMARY docs are committed separately by the orchestrator._

## Files Created/Modified

- `frontend/src/hooks/useWorkingGroups.ts` - Count query `.neq('archived', true)` → `.neq('status', 'archived')`; soft-delete update dropped `archived: true`, keeps `status: 'archived'`.
- `frontend/src/routes/_protected/search.tsx` - Removed `beforeLoad` redirect; renders `DossierSearchPage` with a typed `validateSearch` for `q`/`type`/`status`/`myDossiers`.
- `frontend/src/routes/_protected/analytics.tsx` - Removed `beforeLoad` redirect; renders `AnalyticsDashboardPage` (no `validateSearch`, no props — page manages its own state from an optional `initialState`).
- `frontend/src/auth/LoginPageAceternity.tsx` - `bg-gradient-to-br ...` → flat `bg-background`; pulled `resetPassword` from store + `getValues` from `useForm`; replaced dead `<a href="#">` with a working `<button type="button">` + async `handleForgotPassword` (wrapped as `() => void`); password asterisk `aria-hidden` (removed `aria-label`); password input gains `required` + `aria-required="true"`.
- `frontend/src/store/authStore.ts` - Added `resetPassword(email): Promise<void>` to the `AuthState` interface and implementation (sets isLoading/error, calls `supabase.auth.resetPasswordForEmail` with `redirectTo`, throws on error).
- `frontend/src/i18n/en/common.json` - Added `auth.resetEmailSent`, `auth.enterEmailFirst`.
- `frontend/src/i18n/ar/common.json` - Added Arabic `auth.resetEmailSent`, `auth.enterEmailFirst`.
- `frontend/src/components/forms/FormInputAceternity.tsx` - Asterisk span `aria-hidden="true"` (removed `aria-label={t('validation.required')}`); input gains `aria-required={required ? true : undefined}`; `useTranslation` retained (still used by help/error text).
- `frontend/src/hooks/useNotificationCenter.ts` - `useNotifications` primary call `{ baseUrl: 'express' }` → `{ baseUrl: 'edge' }`; Supabase-direct catch fallback untouched; no other hook changed.

## Decisions Made

- **Task 4 — store location (planned deviation, documented in plan):** The original finding named `services/auth.ts`, but `LoginPageAceternity` consumes `store/authStore.ts` via `useAuthStore`. To stay surgical and avoid wiring a second store into the page, `resetPassword` was added to `store/authStore.ts` (the store already in use). This matches the plan's explicit instruction in `<interfaces>`.
- **Task 6 — branch taken:** "Wired the primary call to the edge function (`/notifications-center`, `baseUrl: 'edge'`); fallback preserved." Verification: the deployed `notifications-center` edge function reads the `Authorization` header, binds a client to the caller JWT, resolves the user via `getUser()` (401 otherwise), handles the `notifications-center` path on GET, and returns exactly `{ notifications, nextCursor, hasMore }` for `category`/`unreadOnly`/`cursor`/`limit` query params — identical to the hook's generic, so no response-parsing changes were needed.

## Deviations from Plan

None — plan executed exactly as written.

Two minor implementation choices were made within scope (both anticipated by the plan):

- Task 4: the forgot-password handler is wrapped as `onClick={() => void handleForgotPassword()}` to match the repo's existing async-onClick idiom (`PushOptInBanner.tsx`) and satisfy `@typescript-eslint/no-misused-promises`. The handler itself is `async (): Promise<void>`.
- Task 6: `expressParams` was intentionally left un-renamed to minimize the diff, per the plan's "prefer leaving it" guidance.

## Issues Encountered

- The `pnpm --filter frontend ...` filter name did not match (workspace package is `intake-frontend`); ran `pnpm run type-check` from the `frontend/` directory instead. Also note: the repo's pre-commit hook runs a full `turbo run build` (which includes `tsc` + vite build) on every commit, so each of the 6 commits was build-gated before landing.

## Verification

- **Frontend type-check:** `pnpm run type-check` (`tsc --noEmit`) from `frontend/` — **exit 0, 0 `error TS` lines**. No new errors introduced by these 6 fixes; no pre-existing unrelated errors surfaced.
- **Bilingual sanity:** both `en/common.json` and `ar/common.json` parse, and both contain `auth.resetEmailSent` + `auth.enterEmailFirst` (verified via node require + key presence).
- **Per-task automated checks:** all 6 task `<verify>` greps returned PASS.

## Next Phase Readiness

- All 6 defects closed; type-check clean. Ready for the orchestrator's docs commit and PR.
- Note (env/ops, explicitly OUT OF SCOPE here): forgot-password emails depend on Supabase Auth email/SMTP being configured for the staging project; the `/reset-password` redirect route is assumed to exist. No code change needed in this task.

## Self-Check: PASSED

- All 9 modified files exist on disk.
- All 6 task commits (`64fdd309`, `3196735d`, `ab01b257`, `5d946c7a`, `aa3840c2`, `1da915b1`) present in git history.
- Frontend working tree clean (no uncommitted code changes).
- `tsc --noEmit` exits 0 with 0 errors.

## Task 7 (follow-up): reset-password landing page

**Discovered during orchestrator verification.** A prior commit added `resetPassword`
to `authStore.ts`, which sends a recovery email with `redirectTo: ${origin}/reset-password`
— but no `/reset-password` route existed (the "Next Phase Readiness" note above even
assumed it did). The email link landed on a 404, so the forgot-password flow was only
half-wired and users could never set a new password. Task 7 completes the flow by adding
the landing page.

- **Commit:** `a5b92562` — `feat(auth): add reset-password landing page to complete forgot-password flow`
- **Route path:** `/reset-password` (PUBLIC, top-level sibling of `/login`, outside
  `_protected`, since the user arrives from the email link on a Supabase recovery session).

### Files created

- `frontend/src/routes/reset-password.tsx` — `createFileRoute('/reset-password')`, mirrors `routes/login.tsx`.
- `frontend/src/pages/ResetPassword.tsx` — thin page wrapper (mirrors `pages/Login.tsx`).
- `frontend/src/auth/ResetPasswordPage.tsx` — the page component (mirrors
  `auth/LoginPageAceternity.tsx` visual shell: flat `bg-background`, `rounded-2xl bg-card`
  card, tokens only, logical RTL properties, `min-h-11` touch targets, `aria-hidden`
  required asterisks, show/hide password toggle).

### Files modified

- `frontend/src/i18n/en/common.json` — added 8 keys under `auth`.
- `frontend/src/i18n/ar/common.json` — added the same 8 keys with real Arabic translations.
- `frontend/src/routeTree.gen.ts` — regenerated by the pre-commit build so `/reset-password`
  is wired into the route tree (13 `reset-password` references; verified present).

### Behavior

- On mount: subscribes to `supabase.auth.onAuthStateChange` (sets `hasRecoverySession`
  on `'PASSWORD_RECOVERY'`) **and** calls `supabase.auth.getSession()` (the recovery token
  is auto-consumed by the client on load, so an existing session = valid link). Subscription
  cleaned up on unmount.
- Form: new password + confirm password, min 6 chars (matches `loginSchema`), both-must-match.
  On submit → `supabase.auth.updateUser({ password })` → success toast + `navigate({ to: '/login' })`;
  error → toast the message.
- No recovery session (direct hit / expired link): calm "This reset link is invalid or has
  expired" message + back-to-login button; `updateUser` is **not** called.

### i18n keys added (en + ar, under `auth`)

`resetPasswordTitle`, `newPassword`, `confirmPassword`, `passwordsDoNotMatch`,
`passwordUpdated`, `updatePassword`, `resetLinkInvalid`, `backToLogin`. Reused existing
`auth.password`, `auth.showPassword`, `auth.hidePassword`, `auth.invalidCredentials`,
`common.loading`, and `validation.minLength`.

### Verification

- `cd frontend && pnpm run type-check` → **exit 0, 0 errors** (no new errors).
- `/reset-password` confirmed present in `frontend/src/routeTree.gen.ts`.
- Frontend code working tree clean after commit.

---

_Phase: quick-260531-tko_
_Completed: 2026-05-31_
