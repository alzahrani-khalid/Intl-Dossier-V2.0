# Journey 0 — Shared Infrastructure Audit

**Date:** 2026-04-10
**Status:** Code audit complete, browser verification pending
**Agents:** All 6

## Summary

- **Critical:** 7
- **Warning:** 15
- **Info:** 8

---

## Findings by Agent

### Theme Auditor

#### [CRITICAL] T-01: Invalid oklch() color format in theme selector previews

- **File:** frontend/src/components/theme-selector/theme-selector.tsx:18-39
- **Agent:** theme-auditor
- **Journey:** 0-shared-infra
- **Issue:** Preview colors use decimal lightness (0.141, 0.59) instead of percentages (14.1%, 59%). oklch() requires lightness as 0-100%.
- **Expected:** All oklch() values use percentage format: `oklch(14.1% 0.004 285.83)` not `oklch(0.141 0.004 285.83)`
- **Fix:** Convert all decimal lightness to percentages in preview objects (Canvas: 0.141→14.1%, Azure: 0.5315→53.15%, etc.)
- **Affects:** [all journeys using theme selector]

#### [CRITICAL] T-02: Invalid oklch() in BlueSky theme dark mode

- **File:** frontend/src/index.css:317
- **Agent:** theme-auditor
- **Journey:** 0-shared-infra
- **Issue:** `--heroui-accent-foreground: oklch(99.11% 0 0);` — when chroma=0, hue is meaningless. Minor spec issue but may cause parser warnings.
- **Expected:** `oklch(99.11% 0)` or valid achromatic form
- **Fix:** Remove hue parameter when chroma is 0
- **Affects:** [bluesky theme, dark mode]

#### [WARNING] T-03: Hardcoded hex colors in graph components

- **File:** frontend/src/components/relationships/GraphVisualization.tsx
- **Agent:** theme-auditor
- **Journey:** 0-shared-infra
- **Issue:** Multiple hardcoded hex colors in inline styles (#3b82f6, #8b5cf6, #10b981, #f59e0b). No dark mode adaptation.
- **Expected:** Use theme variables: `var(--primary-600)`, `var(--heroui-accent)`, etc.
- **Fix:** Replace hex with CSS variable references
- **Affects:** [relationships views, light/dark mode]

#### [WARNING] T-04: Hardcoded hex in EnhancedGraphVisualization

- **File:** frontend/src/components/relationships/EnhancedGraphVisualization.tsx
- **Agent:** theme-auditor
- **Journey:** 0-shared-infra
- **Issue:** Fallback color `'#6b7280'` hardcoded without theme awareness
- **Expected:** Use `var(--base-500)` or theme-aware fallback
- **Fix:** Replace with CSS variable reference
- **Affects:** [relationships views]

#### [WARNING] T-05: Hardcoded hex in AdvancedGraphVisualization

- **File:** frontend/src/components/relationships/AdvancedGraphVisualization.tsx
- **Agent:** theme-auditor
- **Journey:** 0-shared-infra
- **Issue:** Hardcoded orange `'#b45309'` for path highlighting, no dark mode variant
- **Expected:** Use `var(--heroui-warning)` or theme variable
- **Fix:** Replace with theme variable
- **Affects:** [relationships views]

#### [WARNING] T-06: Hardcoded hex in BotIntegrationsSettings

- **File:** frontend/src/components/settings/BotIntegrationsSettings.tsx
- **Agent:** theme-auditor
- **Journey:** 0-shared-infra
- **Issue:** `bg-[#5558AF]` arbitrary Tailwind color, no dark mode variant
- **Expected:** Use `bg-primary-600` or theme color class
- **Fix:** Replace arbitrary value with theme class
- **Affects:** [settings journey]

#### [INFO] T-07: Unused navigation token variables

- **File:** frontend/src/styles/modern-nav-tokens.css
- **Agent:** theme-auditor
- **Journey:** 0-shared-infra
- **Issue:** Multiple `-light` variant tokens defined but never used (icon-rail-bg-light, panel-bg-light, etc.)
- **Expected:** Either use in light mode rules or remove
- **Fix:** Remove unused variables or add light mode selectors
- **Affects:** [code cleanliness]

---

### Component Auditor

#### [CRITICAL] C-01: Button ref forwarding broken in HeroUIButton

- **File:** frontend/src/components/ui/heroui-button.tsx:83-108
- **Agent:** component-auditor
- **Journey:** 0-shared-infra
- **Issue:** HeroUIButton accepts `ref` parameter but is NOT wrapped with `React.forwardRef`. Ref is destructured from props but component isn't a forwardRef — ref is silently dropped.
- **Expected:** Wrap with `React.forwardRef<HTMLButtonElement, HeroUIButtonProps>()` and add displayName
- **Fix:** Wrap function with forwardRef, add displayName
- **Affects:** [all journeys — 100+ button consumers]

#### [CRITICAL] C-02: Button re-export ref forwarding also broken

- **File:** frontend/src/components/ui/button.tsx:42-59
- **Agent:** component-auditor
- **Journey:** 0-shared-infra
- **Issue:** Button re-export also accepts ref without forwardRef wrapper. All ref-based form focus management, animations, DOM selection broken.
- **Expected:** Wrap with `React.forwardRef<HTMLButtonElement, ButtonProps>()` and add displayName
- **Fix:** Wrap function with forwardRef
- **Affects:** [all journeys — critical for entire app]

#### [WARNING] C-03: HeroUI forms prop type consistency

- **File:** frontend/src/components/ui/heroui-forms.tsx
- **Agent:** component-auditor
- **Journey:** 0-shared-infra
- **Issue:** HeroUITextFieldProps/TextAreaFieldProps exported but not verified against actual HeroUI v3 component signatures
- **Expected:** Props should match HeroUI v3 TextField/TextArea APIs exactly
- **Fix:** Cross-reference with HeroUI docs, update mismatches
- **Affects:** [all form-using journeys]

#### [INFO] C-04: Card, Switch, Badge, Skeleton re-exports verified correct

- **Agent:** component-auditor
- **Journey:** 0-shared-infra
- **Issue:** No issues — all re-export files correctly map to heroui-\* wrappers

---

### RTL/i18n Auditor

#### [CRITICAL] R-01: Missing 293 Arabic translations (18.8% gap)

- **File:** frontend/public/locales/ar/translation.json
- **Agent:** rtl-i18n-auditor
- **Journey:** 0-shared-infra
- **Issue:** `dossierLinks.*` namespace completely missing in Arabic. EN has 1,562 keys, AR has 1,368. App shows untranslated keys to Arabic users.
- **Expected:** All keys in EN should have AR translations
- **Fix:** Add all missing translations for dossierLinks, briefs, dataLibrary, reports, calendar namespaces
- **Affects:** [all journeys]

#### [WARNING] R-02: Physical position classes (left-/right-) in UI components

- **File:** frontend/src/components/ui/alert-dialog.tsx:37, dialog.tsx:38, content-skeletons.tsx:546-552, and 15+ others
- **Agent:** rtl-i18n-auditor
- **Journey:** 0-shared-infra
- **Issue:** ~20 instances of `left-` and `right-` position classes. These break RTL — modals shift wrong direction, tooltips appear wrong side.
- **Expected:** Convert to logical: `left-[50%]` → `start-[50%]`, `right-1/4` → `end-1/4`
- **Fix:** Search and replace left-/right- with start-/end- in UI components
- **Affects:** [all journeys]

#### [WARNING] R-03: Layout components missing dir attributes

- **File:** frontend/src/components/layout/MainLayout.tsx, AppSidebar.tsx, SiteHeader.tsx
- **Agent:** rtl-i18n-auditor
- **Journey:** 0-shared-infra
- **Issue:** No dynamic `dir` attribute on layout containers. Only root HTML element gets dir. Nested containers may not inherit RTL correctly.
- **Expected:** Add `dir={isRTL ? 'rtl' : 'ltr'}` to main layout wrapper
- **Fix:** Import useDirection(), apply to container divs
- **Affects:** [all journeys]

#### [INFO] R-04: Namespace mismatch EN ↔ AR

- **File:** frontend/public/locales/en/translation.json vs ar/translation.json
- **Agent:** rtl-i18n-auditor
- **Journey:** 0-shared-infra
- **Issue:** EN uses `dossierTypes` + `dossierLinks`, AR uses `entityTypes` + `entityLinks`. Inconsistent naming breaks key lookups.
- **Expected:** Normalize to single naming convention
- **Fix:** Decide canonical names, update both files
- **Affects:** [all journeys]

#### [INFO] R-05: No physical ml-/mr-/pl-/pr- found in components

- **Agent:** rtl-i18n-auditor
- **Journey:** 0-shared-infra
- **Issue:** PASS — margin/padding logical properties correctly used throughout

---

### Responsive Auditor

#### [WARNING] RS-01: Static content padding — no responsive scaling

- **File:** frontend/src/components/layout/MainLayout.tsx:55-60
- **Agent:** responsive-auditor
- **Journey:** 0-shared-infra
- **Issue:** Content padding uses `--content-padding: 1rem` for all breakpoints. No responsive scaling.
- **Expected:** Padding should scale: `px-4 sm:px-6 lg:px-8`
- **Fix:** Replace static variable with responsive Tailwind classes
- **Affects:** [all journeys]

#### [WARNING] RS-02: Desktop-first breadcrumb scroll buttons

- **File:** frontend/src/components/layout/EntityBreadcrumbTrail.tsx:222-224, 264
- **Agent:** responsive-auditor
- **Journey:** 0-shared-infra
- **Issue:** Scroll buttons use `md:hidden` without mobile-first base. Pattern is backwards — should be `hidden md:flex`.
- **Expected:** Mobile-first: `hidden md:flex` (hidden base, show on desktop)
- **Fix:** Change responsive classes to mobile-first pattern
- **Affects:** [all journeys]

#### [INFO] RS-03: Small breadcrumb scroll button touch targets

- **File:** frontend/src/components/layout/EntityBreadcrumbTrail.tsx:107-111
- **Agent:** responsive-auditor
- **Journey:** 0-shared-infra
- **Issue:** Scroll buttons are `h-6 w-6` (24px) — below 44px minimum touch target
- **Expected:** Min `h-10 w-10` for standalone interactive elements
- **Fix:** Increase to `h-10 w-10` or add padding for touch area
- **Affects:** [all journeys on mobile]

#### [INFO] RS-04: Header height not responsive

- **File:** frontend/src/components/layout/SiteHeader.tsx:29
- **Agent:** responsive-auditor
- **Journey:** 0-shared-infra
- **Issue:** Header fixed at 3.5rem (56px) for all viewports. Acceptable but not optimal.
- **Expected:** Consider responsive: `h-14 sm:h-16`
- **Fix:** Low priority — verify in browser at 320px
- **Affects:** [all journeys]

---

### Data Flow Auditor

#### [CRITICAL] D-01: Unhandled promise in auth state change listener

- **File:** frontend/src/store/authStore.ts:~212
- **Agent:** data-flow-auditor
- **Journey:** 0-shared-infra
- **Issue:** `supabase.auth.onAuthStateChange()` set up at module scope without cleanup. No error handling. Could update state on unmounted component.
- **Expected:** Move to useEffect with cleanup, or add explicit unsubscribe
- **Fix:** Wrap listener in app-level component with cleanup function
- **Affects:** [all protected journeys]

#### [CRITICAL] D-02: Race condition in protected route auth check

- **File:** frontend/src/routes/\_protected.tsx:~13-20
- **Agent:** data-flow-auditor
- **Journey:** 0-shared-infra
- **Issue:** `beforeLoad` calls `getSession()` without proper error handling. State cleared before redirect thrown — race condition where component sees `isAuthenticated: false` briefly.
- **Expected:** try-catch with explicit error handling, consistent state
- **Fix:** Wrap in try-catch, add error logging, verify state consistency
- **Affects:** [5-login-dashboard, all protected journeys]

#### [CRITICAL] D-03: Floating promise in main.tsx

- **File:** frontend/src/main.tsx:11
- **Agent:** data-flow-auditor
- **Journey:** 0-shared-infra
- **Issue:** Sentry import in `requestIdleCallback` has `.then()` without `.catch()`. Errors silently swallowed.
- **Expected:** Add .catch() for error logging
- **Fix:** Add `.catch(err => console.error('Sentry init failed:', err))`
- **Affects:** [all journeys — error reporting]

#### [WARNING] D-04: Dossier context holds server state

- **File:** frontend/src/contexts/dossier-context.tsx:~50-100
- **Agent:** data-flow-auditor
- **Journey:** 0-shared-infra
- **Issue:** `resolvedContext` is server state stored in local context reducer instead of TanStack Query. No cache invalidation, no deduplication.
- **Expected:** Server state in TanStack Query, UI state in context
- **Fix:** Extract resolvedContext into useQuery
- **Affects:** [1-dossier-crud, 2-dossier-browse, 3-engagement]

#### [WARNING] D-05: No cleanup in dossier context useEffect

- **File:** frontend/src/contexts/dossier-context.tsx:~200-210
- **Agent:** data-flow-auditor
- **Journey:** 0-shared-infra
- **Issue:** Async useEffect without cleanup — setState on unmounted component risk
- **Expected:** AbortController or isMounted guard
- **Fix:** Add cleanup return in useEffect
- **Affects:** [1-dossier-crud, 2-dossier-browse]

#### [WARNING] D-06: Auth methods throw after setting error state

- **File:** frontend/src/store/authStore.ts:~50-150
- **Agent:** data-flow-auditor
- **Journey:** 0-shared-infra
- **Issue:** login(), logout(), checkAuth() all `throw error` after setting state. Callers using without .catch() get unhandled rejections.
- **Expected:** Don't throw — let callers check error property
- **Fix:** Remove `throw error` from all three methods
- **Affects:** [5-login-dashboard, all protected]

#### [WARNING] D-07: No error boundary around Outlet in protected layout

- **File:** frontend/src/routes/\_protected.tsx:~30
- **Agent:** data-flow-auditor
- **Journey:** 0-shared-infra
- **Issue:** `<Outlet />` renders child routes without ErrorBoundary. Any child error crashes entire layout.
- **Expected:** ErrorBoundary wrapping Outlet with fallback UI
- **Fix:** Add `<ErrorBoundary fallback={<ErrorPage />}>` around Outlet
- **Affects:** [all protected journeys]

#### [WARNING] D-08: Zustand persists stale auth in localStorage

- **File:** frontend/src/store/authStore.ts:~195
- **Agent:** data-flow-auditor
- **Journey:** 0-shared-infra
- **Issue:** persist() stores user/isAuthenticated in localStorage. If token expires, localStorage still shows authenticated until page reload.
- **Expected:** Sync persist with Supabase session state, or exclude auth from persist
- **Fix:** Use `partialize` to exclude user/isAuthenticated from persist, or clear on TOKEN_EXPIRED
- **Affects:** [all protected, especially after token expiry]

#### [WARNING] D-09: ChatContext no subscription cleanup

- **File:** frontend/src/contexts/ChatContext.tsx
- **Agent:** data-flow-auditor
- **Journey:** 0-shared-infra
- **Issue:** ChatContext tracks sessionId/lastActivity but doesn't cleanup subscriptions on close
- **Expected:** Provide unsubscribe/cleanup mechanism
- **Fix:** Add cleanup callback, verify useAIChat cleanup
- **Affects:** [7-ai-chat]

#### [INFO] D-10: Inconsistent query key factory pattern

- **File:** frontend/src/domains/\*/index.ts
- **Agent:** data-flow-auditor
- **Journey:** 0-shared-infra
- **Issue:** dossiers domain exports queryKey factory, others don't. Inconsistent developer experience.
- **Expected:** All domains export consistent query key factories
- **Fix:** Add key factories to all domains
- **Affects:** [code maintainability]

#### [INFO] D-11: Dossier context value has 39+ properties

- **File:** frontend/src/contexts/dossier-context.tsx:~300+
- **Agent:** data-flow-auditor
- **Journey:** 0-shared-infra
- **Issue:** Context value too large — any consumer re-renders when any property changes
- **Expected:** Split context or use selector pattern
- **Fix:** Split into DossierStateContext + DossierActionsContext
- **Affects:** [performance, 1/2/3 journeys]

---

### Navigation Auditor

#### [CRITICAL] N-01: Missing breadcrumb support for elected_official

- **File:** frontend/src/components/layout/EntityBreadcrumbTrail.tsx:40-50
- **Agent:** navigation-auditor
- **Journey:** 0-shared-infra
- **Issue:** entityIcons/entityColors maps missing `elected_official`. Breadcrumb trail can't render for this dossier type.
- **Expected:** Add elected_official mapping
- **Fix:** Add `elected_official: User` to entityIcons, add color mapping
- **Affects:** [1-dossier-crud, 2-dossier-browse]

#### [CRITICAL] N-02: Missing admin directory index route

- **File:** frontend/src/routes/\_protected/admin/
- **Agent:** navigation-auditor
- **Journey:** 0-shared-infra
- **Issue:** No index.tsx for /admin path. Direct navigation to /admin will fail.
- **Expected:** Index route that redirects or shows admin overview
- **Fix:** Create admin/index.tsx with redirect to /admin/system
- **Affects:** [6-settings-admin]

#### [WARNING] N-03: No explicit 404 handler in root route

- **File:** frontend/src/routes/\_\_root.tsx
- **Agent:** navigation-auditor
- **Journey:** 0-shared-infra
- **Issue:** No notFoundComponent defined. Users hitting non-existent routes see generic error boundary.
- **Expected:** Branded 404 page with navigation suggestions
- **Fix:** Add notFoundComponent to root route config
- **Affects:** [all journeys]

#### [INFO] N-04: Mixed URL naming conventions

- **File:** frontend/src/components/layout/navigation-config.ts:60-95
- **Agent:** navigation-auditor
- **Journey:** 0-shared-infra
- **Issue:** Some routes use underscores (working_groups), others hyphens (elected-officials). Inconsistent.
- **Expected:** Consistent kebab-case for URLs
- **Fix:** Document convention or standardize
- **Affects:** [code consistency]

#### [INFO] N-05: All 23 primary nav links verified valid

- **Agent:** navigation-auditor
- **Journey:** 0-shared-infra
- **Issue:** PASS — all sidebar and mobile tab links point to existing route files

---

## Cross-Agent Summary

### By Severity

| ID    | Severity  | Agent      | Description                              |
| ----- | --------- | ---------- | ---------------------------------------- |
| C-01  | CRITICAL  | Component  | Button forwardRef broken (heroui-button) |
| C-02  | CRITICAL  | Component  | Button forwardRef broken (re-export)     |
| D-01  | CRITICAL  | Data Flow  | Auth listener no cleanup                 |
| D-02  | CRITICAL  | Data Flow  | Protected route auth race condition      |
| D-03  | CRITICAL  | Data Flow  | Floating promise in main.tsx             |
| R-01  | CRITICAL  | RTL/i18n   | 293 missing Arabic translations          |
| N-02  | CRITICAL  | Navigation | Missing /admin index route               |
| T-01  | WARNING\* | Theme      | Invalid oklch in theme selector          |
| T-03  | WARNING   | Theme      | Hardcoded hex in graph components        |
| T-04  | WARNING   | Theme      | Hardcoded hex in EnhancedGraph           |
| T-05  | WARNING   | Theme      | Hardcoded hex in AdvancedGraph           |
| T-06  | WARNING   | Theme      | Hardcoded hex in BotSettings             |
| R-02  | WARNING   | RTL/i18n   | Physical position classes (20 instances) |
| R-03  | WARNING   | RTL/i18n   | Layout components missing dir attrs      |
| RS-01 | WARNING   | Responsive | Static content padding                   |
| RS-02 | WARNING   | Responsive | Desktop-first breadcrumb buttons         |
| D-04  | WARNING   | Data Flow  | Dossier context holds server state       |
| D-05  | WARNING   | Data Flow  | Dossier context no useEffect cleanup     |
| D-06  | WARNING   | Data Flow  | Auth methods throw after error state     |
| D-07  | WARNING   | Data Flow  | No ErrorBoundary around Outlet           |
| D-08  | WARNING   | Data Flow  | Stale auth in localStorage               |
| D-09  | WARNING   | Data Flow  | ChatContext no subscription cleanup      |
| N-01  | WARNING\* | Navigation | Missing elected_official breadcrumb      |
| N-03  | WARNING   | Navigation | No 404 handler                           |

*T-01 reclassified from CRITICAL to WARNING (theme preview only, not runtime)
*N-01 reclassified from CRITICAL to WARNING (breadcrumb display only, not blocking)

### By Fix Layer

1. **Theme tokens (4 findings):** T-01, T-02, T-07, T-03/04/05/06
2. **Shared UI components (4 findings):** C-01, C-02, C-03, R-02
3. **Layout shell (4 findings):** RS-01, RS-02, RS-03, R-03
4. **i18n / RTL (3 findings):** R-01, R-04, R-05
5. **Data flow / state (9 findings):** D-01 through D-11
6. **Navigation (4 findings):** N-01, N-02, N-03, N-04
