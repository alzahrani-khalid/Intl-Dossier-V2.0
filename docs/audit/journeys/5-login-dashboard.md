# Journey 5 — Login → Dashboard → Navigate

**Date:** 2026-04-10
**Status:** Code audit complete, browser verification pending
**Agents:** Navigation, Theme, Responsive, Data Flow

## Summary

- **Critical:** 0
- **Warning:** 4
- **Info:** 3

Note: 3 known J0 issues re-confirmed (D-01, D-02, D-08) — not counted again.

---

## Findings

### [WARNING] N-50: Login redirects to / instead of /dashboard

- **File:** frontend/src/auth/LoginPageAceternity.tsx:onSubmit
- **Agent:** navigation-auditor
- **Journey:** 5-login-dashboard
- **Issue:** Post-login navigates to `/` which then redirects to `/dashboard`. Extra hop adds 1-2 page loads.
- **Expected:** Direct navigation to /dashboard or saved intended route
- **Fix:** Change navigate({ to: '/' }) to navigate({ to: '/dashboard' })
- **Affects:** [5-login-dashboard, all login flows]

### [WARNING] T-50: Login page uses hardcoded dark mode classes

- **File:** frontend/src/auth/LoginPageAceternity.tsx
- **Agent:** theme-auditor
- **Journey:** 5-login-dashboard
- **Issue:** Mixes dark:bg-zinc-800, dark:border-gray-600, dark:text-white instead of theme tokens
- **Expected:** Use bg-card, border-input, text-foreground for consistency
- **Fix:** Replace hardcoded colors with design tokens
- **Affects:** [5-login-dashboard, theme consistency]

### [WARNING] RS-50: Login form inputs oversized and padding not responsive

- **File:** frontend/src/auth/LoginPageAceternity.tsx
- **Agent:** responsive-auditor
- **Journey:** 5-login-dashboard
- **Issue:** Fixed p-8 card padding doesn't scale on mobile. Inputs min-h-11 on base are tall for small phones.
- **Expected:** p-4 sm:p-6 md:p-8 responsive padding
- **Fix:** Add responsive padding and adjust input heights
- **Affects:** [5-login-dashboard, mobile UX on small phones]

### [WARNING] D-50: FirstRunModal and OnboardingTour conflict

- **File:** frontend/src/routes/\_protected/index.tsx
- **Agent:** data-flow-auditor
- **Journey:** 5-login-dashboard
- **Issue:** Both FirstRunModal and OnboardingTourTrigger can open simultaneously. Radix Dialog focus trap causes conflicts.
- **Expected:** FirstRunModal gates onboarding tour — only show tour after modal dismissed
- **Fix:** Add explicit gate: if FirstRunModal open or not dismissed, don't render tour
- **Affects:** [5-login-dashboard, first-time user experience]

### [INFO] N-51: Missing /\_protected/index.tsx redirect

- **Agent:** navigation-auditor
- **Journey:** 5-login-dashboard
- **Issue:** No index route at /\_protected/ — must use /dashboard path directly
- **Fix:** Create \_protected/index.tsx that redirects to /dashboard

### [INFO] RS-51: Sidebar collapse and mobile tab bar working correctly

- **Agent:** responsive-auditor
- **Journey:** 5-login-dashboard
- **Issue:** PASS — sidebar hidden on mobile, bottom tab bar shown

### [INFO] T-51: Dashboard theme persistence working correctly

- **Agent:** theme-auditor
- **Journey:** 5-login-dashboard
- **Issue:** PASS — theme selection persists across sessions

---

## Re-confirmed J0 Issues (still present)

- D-01: Auth listener no cleanup (authStore.ts)
- D-02: Auth race condition (\_protected.tsx)
- D-08: Stale localStorage after token refresh
