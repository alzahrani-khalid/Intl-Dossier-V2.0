# Quick Task 260412-jkp: Fix Batch 6 Navigation & Routing — Summary

**Date:** 2026-04-12
**Commit:** c2cfae2e
**Status:** Complete

## Changes Made

### N-50: Login redirect → /dashboard directly

- **File:** `frontend/src/auth/LoginPageAceternity.tsx`
- Changed `navigate({ to: '/' })` to `navigate({ to: '/dashboard' })`
- Eliminates redirect hop through root index

### N-21: Stretched-link pattern on UniversalDossierCard

- **File:** `frontend/src/components/Dossier/UniversalDossierCard.tsx`
- Added invisible `<Link>` overlay (`absolute inset-0`) for card-level navigation
- Action buttons (View, Edit, Delete) raised with `relative z-10` to sit above link
- Supports middle-click for new tab, keyboard accessible via View button

### D-60: Admin permission → redirect instead of error

- **File:** `frontend/src/routes/_protected/admin/field-permissions.tsx`
- Replaced `throw new Error('Admin access required')` with `throw redirect({ to: '/dashboard' })`
- Non-admin users silently redirected instead of seeing raw error

### D-61: Translated error toast in AI settings

- **File:** `frontend/src/routes/_protected/admin/ai-settings.tsx`
- Replaced `error.message` with `t('settings.errorDesc', 'Failed to save...')`
- Error toast now shows user-friendly translated text

## Triaged as No-Op / Deferred

| Finding | Reason                                                                        |
| ------- | ----------------------------------------------------------------------------- |
| N-51    | Root `routes/index.tsx` already redirects authenticated users to `/dashboard` |
| N-20    | Type cards are filters, not route-based tabs — needs design decision          |
| N-04    | URL convention standardization is INFO-level and high-risk for bookmarks      |

## Verification

- `pnpm tsc --noEmit` — no new errors in changed files
- Lint + prettier passed via pre-commit hook
- Build succeeded via pre-commit hook
