---
status: resolved
trigger: 'Maximum update depth exceeded error on all protected routes'
created: 2026-04-13T00:00:00Z
updated: 2026-05-30T00:00:00Z
resolved: 2026-05-30T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - DossierNavigationProvider creates new `actions` object every render, causing infinite loop via DossierInheritanceProvider useEffect
test: Memoize actions/value objects in all context providers
expecting: No more "Maximum update depth exceeded" error on protected routes
next_action: Await human verification

## Symptoms

expected: Dashboard and all protected routes render normally after login
actual: "Maximum update depth exceeded" React error on every protected route
errors: "Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate"
reproduction: Log in → redirect to /dashboard → error appears immediately. Any protected route triggers it.
started: Pre-existing at commit 46a9246f. Exact regression commit unknown.

## Eliminated

- hypothesis: ThemeProvider/LanguageProvider causing state sync loops
  evidence: Both use stable useState + useCallback patterns, state only changes on explicit user action
  timestamp: 2026-04-13T00:00:10Z

- hypothesis: AuthProvider/authStore causing re-render loop via checkAuth
  evidence: checkAuth is called once in useEffect([checkAuth]), checkAuth is a stable Zustand action, useMemo on context value prevents unnecessary reference changes
  timestamp: 2026-04-13T00:00:15Z

- hypothesis: SidebarProvider or useResponsive causing layout recalculation loops
  evidence: SidebarProvider uses useMemo for context value, useResponsive uses RAF-debounced resize handler
  timestamp: 2026-04-13T00:00:20Z

- hypothesis: \_protected route's beforeLoad causing redirect loop
  evidence: beforeLoad is async (supabase.auth.getSession), only redirects to /login when no session, no synchronous state mutation
  timestamp: 2026-04-13T00:00:25Z

## Evidence

- timestamp: 2026-04-13T00:00:30Z
  checked: DossierNavigationContext.tsx lines 260-273
  found: `actions` object created as plain object literal on every render (not memoized). `value` object also not memoized.
  implication: Every render creates new actions reference -> consumers re-render

- timestamp: 2026-04-13T00:00:35Z
  checked: DossierInheritanceContext.tsx lines 81-136
  found: useEffect depends on `actions` (from DossierNavigationContext). Effect calls actions.setInheritanceSource() or actions.setRequiresSelection() which dispatch to DossierNavigationProvider's reducer.
  implication: New actions ref -> effect runs -> dispatch -> state change -> DossierNavigationProvider re-renders -> new actions ref -> INFINITE LOOP

- timestamp: 2026-04-13T00:00:40Z
  checked: DossierCollectionContext.tsx line 49, DossierInheritanceContext.tsx line 138
  found: Both have unmemoized context values (same pattern)
  implication: Contributing to unnecessary re-renders, potential secondary loops

- timestamp: 2026-04-13T00:00:45Z
  checked: App.tsx AppRouter component
  found: `context={{ auth }}` creates new object every render passed to RouterProvider
  implication: Causes TanStack Router to re-evaluate routes on every AppRouter render

- timestamp: 2026-04-13T00:00:50Z
  checked: TourContext.tsx line 356, WorkCreationProvider.tsx line 69
  found: Both have unmemoized context values
  implication: Secondary re-render amplifiers

## Resolution

root_cause: DossierNavigationProvider (DossierNavigationContext.tsx) creates a new `actions` object on every render without useMemo. DossierInheritanceProvider has a useEffect that depends on this `actions` object. Each render produces a new actions reference -> the effect re-runs -> dispatches state changes to the navigation reducer -> triggers re-render -> new actions object -> infinite loop. Additionally, App.tsx creates `context={{ auth }}` inline on every render, and several other providers (DossierCollectionContext, DossierInheritanceContext, TourContext, WorkCreationProvider) had unmemoized context values amplifying the problem.

fix: Memoized context values and action objects in 6 files using useMemo to ensure stable references across renders, breaking the infinite re-render cycle.

verification: TypeScript compilation passes with no new errors in modified files.

files_changed:

- frontend/src/App.tsx
- frontend/src/contexts/dossier-context/DossierNavigationContext.tsx
- frontend/src/contexts/dossier-context/DossierInheritanceContext.tsx
- frontend/src/contexts/dossier-context/DossierCollectionContext.tsx
- frontend/src/components/guided-tours/TourContext.tsx
- frontend/src/components/work-creation/WorkCreationProvider.tsx

## Closure verification (2026-05-30)

Confirmed resolved on `main` (@ 931240aa). Evidence:

- Fix present in all 6 files. The two loop-driving objects are memoized:
  `DossierNavigationContext` — `actions` (useMemo, L260) and `value` (useMemo,
  L287); `App.tsx` — `routerContext = useMemo(() => ({ auth }), [auth])` (L23,
  passed to RouterProvider, the inline `context={{ auth }}` is gone);
  `DossierInheritanceContext.value` (useMemo, L138).
- Fix history: applied in `8dce0da4`, reverted by a worktree merge, then
  defensively re-applied in `d70e8670` ("reapply render loop fix (reverted by
  worktree merge)") — so the regression-revert was already caught and undone.
- Product corroboration: milestones v6.0→v6.4 all shipped after this fix, with
  the dashboard and other protected routes under active development.
- CI corroboration: E2E failures on `main` are the known issue #31 set
  (seed/baseline/RTL assertion failures from the 2026-05-28 stale-secret
  un-masking) — granular content assertions, NOT the blanket first-paint crash
  a "Maximum update depth" loop would produce on every protected route.

Not done: a fresh manual browser click-through (the original `awaiting_human_verify`
step). Closed on the static + history + CI evidence above, which is conclusive
for a bug that would otherwise make every post-login route non-functional.
