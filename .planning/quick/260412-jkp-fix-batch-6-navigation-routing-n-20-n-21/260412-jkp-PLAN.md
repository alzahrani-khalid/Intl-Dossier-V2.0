# Quick Task 260412-jkp: Fix Batch 6 Navigation & Routing

**Date:** 2026-04-12
**Status:** Ready for execution

## Triage

| Finding | Status    | Action                                                          |
| ------- | --------- | --------------------------------------------------------------- |
| N-50    | Needs fix | Login redirect → /dashboard directly                            |
| N-51    | Needs fix | Create /\_protected/index.tsx redirect                          |
| D-60    | Needs fix | Replace raw Error with redirect to /dashboard                   |
| D-61    | Needs fix | Use translated error in toast                                   |
| N-21    | Needs fix | Make full card body clickable via Link                          |
| N-20    | Defer     | Type cards are filters not route-tabs; needs design decision    |
| N-04    | Defer     | URL convention change is INFO-level and high-risk for bookmarks |

## Plan 01: Navigation & routing fixes

### Task 1: Login redirect and protected index (N-50, N-51)

- **Files:** `frontend/src/auth/LoginPageAceternity.tsx`, create `frontend/src/routes/_protected/index.tsx`
- **Action:**
  - N-50: Change `navigate({ to: '/' })` to `navigate({ to: '/dashboard' })`
  - N-51: Create index route that redirects to /dashboard
- **Verify:** Login → dashboard directly; navigate to / → redirects to /dashboard

### Task 2: Admin error UX (D-60, D-61)

- **Files:** `frontend/src/routes/_protected/admin/field-permissions.tsx`, `frontend/src/routes/_protected/admin/ai-settings.tsx`
- **Action:**
  - D-60: Replace `throw new Error('Admin access required')` with redirect to /dashboard
  - D-61: Use t() for error description in toast instead of raw error.message
- **Verify:** Non-admin → redirect; AI settings error → translated toast

### Task 3: Card clickable body (N-21)

- **Files:** `frontend/src/components/Dossier/UniversalDossierCard.tsx`
- **Action:** Make Card body (header + content) navigable via Link wrapper
- **Verify:** Card click navigates; middle-click opens new tab
