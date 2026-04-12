# Fix Execution Plan — Intl-Dossier V2.0

**Date:** 2026-04-10 (revised after Codex review)
**Total findings:** 83 master + 3 browser = 86
**Approach:** Fix in dependency order — each batch builds on the previous
**Reconciliation:** Every MASTER-AUDIT ID is scheduled exactly once below

---

## Batch 0: True Critical Set (blocks all journeys)

_Every finding marked "Fix Immediately" in MASTER-AUDIT. Each is standalone._

### Fix B-01: API calls hitting wrong port (VITE_API_URL misconfigured)

- **Finding:** B-01 (CRITICAL)
- **Impact:** Notifications + analytics broken on EVERY page load (401 on port 5001)
- **Root cause:** `resolveUrl()` in `frontend/src/lib/api-client.ts:36-39` reads `VITE_API_URL`. Both callers already use `{ baseUrl: 'express' }`:
  - `frontend/src/domains/analytics/repositories/analytics.repository.ts:12`
  - `frontend/src/hooks/useNotificationCenter.ts:99`
- **Fix:** Set `VITE_API_URL` to Express proxy origin (e.g., `http://localhost:3000` dev, or relative `/api` prod). If env var is empty string, `resolveUrl` returns a relative path which goes through Vite proxy — verify `vite.config.ts` proxy config matches.
- **Verify:** No more 401 console errors on page load; notifications and analytics load

### Fix C-01+C-02: Button forwardRef broken

- **Finding:** C-01, C-02 (CRITICAL)
- **Impact:** All 100+ button consumers can't use refs (focus management, animations, DOM selection)
- **Files:**
  - `frontend/src/components/ui/heroui-button.tsx:83-108` — wrap with React.forwardRef
  - `frontend/src/components/ui/button.tsx:42-59` — wrap with React.forwardRef
- **Fix:** Wrap both components with `React.forwardRef<HTMLButtonElement, Props>()`, add displayName
- **Verify:** `pnpm typecheck` passes, button refs work in forms

### Fix D-01: Auth listener no cleanup

- **Finding:** D-01 (CRITICAL), confirmed by B-02 (lock contention)
- **Impact:** Memory leak, duplicate listeners, auth lock contention
- **Files:**
  - `frontend/src/store/authStore.ts:~212` — onAuthStateChange at module scope
- **Fix:** Move listener to app-level component useEffect with cleanup return, OR store unsubscribe reference and call on HMR
- **Verify:** No more NavigatorLockAcquireTimeoutError in console

### Fix D-02: Protected route auth race condition

- **Finding:** D-02 (CRITICAL)
- **Impact:** Brief flash of protected content on expired tokens
- **Files:**
  - `frontend/src/routes/_protected.tsx:~13-20` — beforeLoad function
- **Fix:** Wrap getSession() in try-catch, add error handling, ensure state is consistent before redirect
- **Verify:** Expired token → clean redirect to login, no flash

### Fix D-03: Floating promise in main.tsx

- **Finding:** D-03 (CRITICAL)
- **Impact:** Sentry init errors silently swallowed
- **Files:**
  - `frontend/src/main.tsx:11`
- **Fix:** Add `.catch(err => console.error('Sentry init failed:', err))` to the promise chain
- **Verify:** No unhandled promise warnings

### Fix N-02: Missing /admin index route

- **Finding:** N-02 (CRITICAL), confirmed visually (404 screenshot)
- **Impact:** Direct navigation to /admin shows 404
- **Files:**
  - Create: `frontend/src/routes/_protected/admin/index.tsx`
- **Fix:** Create index route that redirects to `/admin/ai-settings` (first admin nav item per `navigation-config.ts:178`)
- **Verify:** Navigate to /admin → redirects to /admin/ai-settings

### Fix R-01+R-10: Missing 500+ Arabic translations

- **Findings:** R-01 (CRITICAL), R-10 (CRITICAL)
- **Impact:** Raw translation keys shown to Arabic users on every page
- **Files:**
  - `frontend/public/locales/ar/translation.json` — add missing keys
  - Compare against `frontend/public/locales/en/translation.json`
- **Fix strategy:**
  1. Extract all keys from EN that are missing in AR
  2. Add `tabs.*` namespace (R-10 — entire tab bar untranslated)
  3. Add `dossierLinks.*` namespace
  4. Add `briefs.*`, `dataLibrary.*`, `reports.*`, `calendar.*` keys
  5. Add dossier statistics text ("of total active dossiers %")
- **Verify:** Switch to Arabic — no English text or raw keys visible on any page

---

## Batch 1: Theme Tokens & Color System (11 findings)

_Create centralized semantic color maps, then update all components._

### Fix T-01+T-02: Invalid oklch() values

- **Findings:** T-01, T-02
- **Files:**
  - `frontend/src/components/theme-selector/theme-selector.tsx:18-39` — fix decimal → percentage
  - `frontend/src/index.css:317` — fix achromatic oklch
- **Fix:** Convert oklch decimals to percentages; remove hue when chroma=0
- **Verify:** Theme selector previews render without CSS warnings

### Fix T-03..T-06 + T-10..T-14 + T-20 + T-50 + T-70: Hardcoded colors → theme tokens

- **Findings:** T-03, T-04, T-05, T-06, T-10, T-11, T-12, T-13, T-14, T-20, T-50, T-70 (12 findings)
- **Strategy:** Create a centralized color mapping utility, then update all consumers
- **Step 1 — Create color maps:**
  - Create: `frontend/src/lib/semantic-colors.ts`
  - Define maps: `dossierTypeColors`, `statusColors`, `activityTypeColors`, `interactionTypeColors`
  - Each maps to CSS variable references: `var(--heroui-accent)`, `var(--heroui-success)`, etc.
- **Step 2 — Update consumers:**
  - `frontend/src/components/Dossier/DossierTypeIcon.tsx:33-39`
  - `frontend/src/components/Dossier/ActivityTimelineItem.tsx:43-54`
  - `frontend/src/components/Dossier/DossierOverview/sections/ActivityTimelineSection.tsx:77-100`
  - `frontend/src/components/Dossier/DossierOverview/DossierOverview.tsx:72-79`
  - `frontend/src/components/Dossier/sections/InteractionHistory.tsx:42-47`
  - `frontend/src/components/Dossier/UniversalDossierCard.tsx:99-135`
  - `frontend/src/components/relationships/GraphVisualization.tsx`
  - `frontend/src/components/relationships/EnhancedGraphVisualization.tsx`
  - `frontend/src/components/relationships/AdvancedGraphVisualization.tsx`
  - `frontend/src/components/settings/BotIntegrationsSettings.tsx`
  - `frontend/src/auth/LoginPageAceternity.tsx`
  - `frontend/src/components/ai/BriefGenerationPanel.tsx:272-278`
- **Verify:** Toggle light/dark/all themes — no hardcoded colors leak through

### Fix T-07: Unused navigation token variables

- **Finding:** T-07 (INFO)
- **Files:** `frontend/src/styles/modern-nav-tokens.css`
- **Fix:** Remove unused `-light` variant variables
- **Verify:** No CSS variable warnings; theme still works

---

## Batch 2: Shared UI Components (7 findings)

_Fix component library issues that cascade to 39+ routes._

### Fix R-02: Physical position classes → logical properties

- **Finding:** R-02
- **Files:** ~20 instances in `frontend/src/components/ui/`:
  - `alert-dialog.tsx:37`, `dialog.tsx:38`, `content-skeletons.tsx:546-552`, and others
- **Fix:** Search `left-[` → `start-[`, `right-` → `end-` in UI component classNames
- **Verify:** RTL modal centering still works

### Fix C-03: HeroUI forms prop type verification

- **Finding:** C-03
- **Files:** `frontend/src/components/ui/heroui-forms.tsx`
- **Fix:** Cross-reference props with HeroUI v3 docs, update mismatches
- **Verify:** `pnpm typecheck` passes

### Fix C-10: TooltipProvider re-created every render

- **Finding:** C-10
- **Files:** `frontend/src/components/Dossier/DossierContextBadge.tsx:157-172`
- **Fix:** Lift TooltipProvider to parent or use singleton pattern
- **Verify:** No re-render flicker on badge hover

### Fix C-11 + C-22: Missing/non-unique key props

- **Findings:** C-11, C-22
- **Files:**
  - `frontend/src/components/Dossier/DossierCreateWizard.tsx:798` — add key={dossier.id}
  - `frontend/src/components/Dossier/UniversalDossierCard.tsx:295-303` — use key={`${tag}-${index}`}
- **Verify:** No React key warnings in console

---

## Batch 3: Layout Shell (9 findings)

_Affects all protected routes. Includes 2 findings (RS-03, RS-04) previously missing from plan._

### Fix R-03: Layout components missing dir attributes

- **Finding:** R-03
- **Files:**
  - `frontend/src/components/layout/MainLayout.tsx` — add dir={direction} to wrapper
  - `frontend/src/components/layout/AppSidebar.tsx` — add dir attribute
  - `frontend/src/components/layout/SiteHeader.tsx` — add dir attribute
- **Fix:** Import useDirection(), apply to container divs
- **Verify:** Arabic layout flows RTL in all layout regions

### Fix RS-01: Static content padding → responsive

- **Finding:** RS-01
- **Files:** `frontend/src/components/layout/MainLayout.tsx:55-60`
- **Fix:** Replace `--content-padding: 1rem` with responsive Tailwind: `px-4 sm:px-6 lg:px-8`
- **Verify:** Content padding scales with viewport

### Fix RS-02: Desktop-first breadcrumb scroll buttons

- **Finding:** RS-02
- **Files:** `frontend/src/components/layout/EntityBreadcrumbTrail.tsx:222-224, 264`
- **Fix:** Change `md:hidden` to `hidden md:flex` (mobile-first)
- **Verify:** Scroll buttons visible on desktop only

### Fix RS-03: Breadcrumb scroll button touch targets

- **Finding:** RS-03 (INFO)
- **Files:** `frontend/src/components/layout/EntityBreadcrumbTrail.tsx` — scroll button elements
- **Fix:** Increase button size from 24px to 44px minimum (`min-h-11 min-w-11`)
- **Verify:** Touch targets meet 44px minimum on mobile

### Fix RS-04: Header height not responsive

- **Finding:** RS-04 (INFO)
- **Files:** `frontend/src/components/layout/SiteHeader.tsx` or CSS variable
- **Fix:** Use responsive height: `h-14 sm:h-12` (taller on mobile for touch, compact on desktop)
- **Verify:** Header scales appropriately across breakpoints

### Fix N-01: Missing elected_official breadcrumb support

- **Finding:** N-01
- **Files:** `frontend/src/components/layout/EntityBreadcrumbTrail.tsx:40-50`
- **Fix:** Add `elected_official: User` to entityIcons and entityColors maps
- **Verify:** Elected official detail page shows correct breadcrumb

### Fix N-03: 404 handler improvement

- **Finding:** N-03
- **Files:** `frontend/src/routes/__root.tsx`
- **Fix:** Add notFoundComponent to root route config with search and navigation suggestions
- **Verify:** Invalid URL → styled 404 with helpful navigation

---

## Batch 4: i18n / RTL Corrections (8 remaining findings)

_R-01+R-10 moved to Batch 0. Remaining translation + RTL work._

### Fix R-04: Namespace mismatch EN↔AR

- **Finding:** R-04 (INFO)
- **Files:** Both translation files
- **Fix:** Decide canonical names (dossierLinks vs entityLinks), update both files
- **Verify:** No missing key warnings in i18next

### Fix R-10b + R-11: Hardcoded strings in DossierCreateWizard

- **Findings:** R-10b, R-11
- **Files:** `frontend/src/components/Dossier/DossierCreateWizard.tsx:483-545, 1087-1159`
- **Fix:** Extract hardcoded Arabic text and English placeholders to translation keys
- **Verify:** Wizard renders correctly in both languages

### Fix R-12: Hardcoded dir="rtl" → dynamic

- **Finding:** R-12
- **Files:** `frontend/src/components/Dossier/DossierCreateWizard.tsx:698, 856, 998, 1060, 1159`
- **Fix:** Replace dir="rtl" with dir={direction} from useDirection()
- **Verify:** Wizard works in both LTR and RTL modes

### Fix R-13: Missing 265+ dossier-specific AR translations

- **Finding:** R-13 (INFO)
- **Files:** `frontend/public/locales/ar/translation.json`
- **Fix:** Add all dossier-specific keys identified in R-13 audit entry
- **Verify:** Dossier detail pages fully translated

### Fix R-60 + R-61: Untranslated AI admin labels

- **Findings:** R-60, R-61
- **Files:** `frontend/src/routes/_protected/admin/ai-settings.tsx:127-139`
- **Fix:** Replace hardcoded "Anthropic", "Claude Sonnet 4" etc. with t() calls, add to translation files
- **Verify:** AI settings page fully translated in Arabic

### Fix R-62: Field permissions headers possibly hardcoded

- **Finding:** R-62 (INFO)
- **Files:** `frontend/src/routes/_protected/admin/field-permissions.tsx`
- **Fix:** Verify table headers use t() calls; add missing translation keys if hardcoded
- **Verify:** Field permissions page renders in Arabic

---

## Batch 5: Data Flow & State Management (11 findings)

_Fix state management patterns and error handling. D-10, D-11 deferred to Batch 7._

### Fix D-04 + D-05: Dossier context server state + cleanup

- **Findings:** D-04, D-05
- **Files:** `frontend/src/contexts/dossier-context.tsx:~50-210`
- **Fix:** Extract resolvedContext to useQuery; add useEffect cleanup with isMounted guard
- **Verify:** Context refreshes correctly; no stale data after navigation

### Fix D-06: Auth methods throw after setting error state

- **Finding:** D-06
- **Files:** `frontend/src/store/authStore.ts:~50-150`
- **Fix:** Remove `throw error` from login(), logout(), checkAuth(). Error state already set.
- **Verify:** Login failure shows error toast, no uncaught exception

### Fix D-07: No ErrorBoundary around Outlet

- **Finding:** D-07
- **Files:** `frontend/src/routes/_protected.tsx:~30`
- **Fix:** Wrap `<Outlet />` with `<ErrorBoundary fallback={<ErrorFallback />}>`
- **Verify:** Component crash → error UI, not white screen

### Fix D-08: Stale auth in localStorage

- **Finding:** D-08
- **Files:** `frontend/src/store/authStore.ts:~195`
- **Fix:** Use `partialize` to exclude user/isAuthenticated from persist, or clear on TOKEN_EXPIRED
- **Verify:** Logout → localStorage cleared; stale token → clean redirect

### Fix D-09: ChatContext no subscription cleanup

- **Finding:** D-09
- **Files:** `frontend/src/contexts/ChatContext.tsx`
- **Fix:** Add cleanup callback for subscriptions, verify useAIChat cleanup
- **Verify:** Navigating away from chat → subscriptions cleaned up

### Fix D-30: After-action doesn't invalidate engagement queries

- **Finding:** D-30
- **Files:** `frontend/src/hooks/useAfterAction.ts:211-216`
- **Fix:** Add `queryClient.invalidateQueries({ queryKey: ['engagement', data.engagement_id] })`
- **Verify:** After creating after-action, engagement detail refreshes

### Fix D-31: After-action form missing loading state

- **Finding:** D-31
- **Files:** `frontend/src/routes/_protected/engagements/$engagementId/after-action.tsx:89-93`
- **Fix:** Pass `isSubmitting={createAfterAction.isPending}` to AfterActionForm
- **Verify:** Submit button shows spinner/disabled during save

### Fix D-40: Kanban optimistic revert gaps

- **Finding:** D-40
- **Files:** `frontend/src/components/unified-kanban/UnifiedKanbanBoard.tsx:175-189`
- **Fix:** Wrap mutateAsync in try-catch with explicit column state rollback
- **Verify:** Failed drag-drop → card returns to original column

### Fix D-50: FirstRunModal + OnboardingTour conflict

- **Finding:** D-50
- **Files:** `frontend/src/routes/_protected/index.tsx`
- **Fix:** Add gate: don't render tour while FirstRunModal is open
- **Verify:** First login → modal only, no tour overlay

### Fix D-72: useAIChat stale messages closure

- **Finding:** D-72
- **Files:** `frontend/src/domains/ai/hooks/useAIChat.ts:74`
- **Fix:** Use functional setState: `setMessages(prev => [...prev, userMessage])`
- **Verify:** Rapid messages don't lose earlier entries

---

## Batch 6: Navigation & Routing (7 findings)

_Includes N-51 (previously missing from plan)._

### Fix N-20: Type tabs missing active state

- **Finding:** N-20
- **Files:** Dossier list page tab component
- **Fix:** Use useLocation() to detect current route, apply active styling
- **Verify:** Active tab visually highlighted when navigating dossier types

### Fix N-21: Card onClick → Link

- **Finding:** N-21
- **Files:** `frontend/src/components/Dossier/UniversalDossierCard.tsx:335-370`
- **Fix:** Wrap card in Link component, make onView optional fallback
- **Verify:** Card click navigates; middle-click opens in new tab

### Fix N-50: Login redirect hop

- **Finding:** N-50
- **Files:** `frontend/src/auth/LoginPageAceternity.tsx:onSubmit`
- **Fix:** Change navigate({ to: '/' }) to navigate({ to: '/dashboard' })
- **Verify:** Login → dashboard directly, no intermediate redirect

### Fix N-51: Missing /\_protected/index.tsx redirect

- **Finding:** N-51 (INFO)
- **Files:** Create: `frontend/src/routes/_protected/index.tsx`
- **Fix:** Create index route that redirects to `/dashboard`
- **Verify:** Navigate to / when authenticated → redirects to /dashboard

### Fix D-60: Permission denied error UX

- **Finding:** D-60
- **Files:** `frontend/src/routes/_protected/admin/field-permissions.tsx:95-100`
- **Fix:** Use actionable error type with i18n key instead of generic Error()
- **Verify:** Non-admin accessing admin page → translated permission error

### Fix D-61: AI settings raw error toast

- **Finding:** D-61
- **Files:** `frontend/src/routes/_protected/admin/ai-settings.tsx:193-202`
- **Fix:** Use t('errors.' + error.code) pattern instead of error.message
- **Verify:** AI settings error → translated, user-friendly toast

### Fix N-04: URL naming convention standardization

- **Finding:** N-04 (INFO)
- **Files:** Various route files with inconsistent underscore/hyphen patterns
- **Fix:** Audit URL patterns, standardize to hyphens (kebab-case)
- **Verify:** All routes use consistent naming; old URLs redirect if bookmarked

---

## Batch 7: Per-Journey Route Fixes (22 findings)

_Lower priority items — each with file, change, and verify._

### Accessibility (3 findings)

#### Fix C-40: aria-label on draggable kanban cards

- **Finding:** C-40 (WARN)
- **Files:** `frontend/src/components/unified-kanban/KanbanCard.tsx` (or equivalent draggable wrapper)
- **Fix:** Add `aria-label={t('kanban.dragCard', { title: item.title })}` to draggable container
- **Verify:** Screen reader announces card title when focused

#### Fix C-30: aria-label on back buttons

- **Finding:** C-30 (INFO)
- **Files:** `frontend/src/routes/_protected/engagements/$engagementId/` — back button components
- **Fix:** Add `aria-label={t('common.goBack')}` to back button elements
- **Verify:** Screen reader announces "Go back" on back buttons

#### Fix C-71: aria-label on ChatInput textarea

- **Finding:** C-71 (journey report only — not in MASTER-AUDIT, included as bonus)
- **Files:** `frontend/src/components/ai/ChatInput.tsx` or equivalent
- **Fix:** Add `aria-label={t('chat.messageInput')}` to textarea
- **Verify:** Screen reader announces input purpose

### UX Improvements (5 findings)

#### Fix C-20: Pagination state to URL params

- **Finding:** C-20 (WARN)
- **Files:** Dossier list page component (uses local state for page number)
- **Fix:** Move pagination to `useSearch()` URL params: `?page=2`
- **Verify:** Page refresh preserves pagination; back button works

#### Fix C-21: Debounce search input

- **Finding:** C-21 (WARN)
- **Files:** Dossier list search component
- **Fix:** Add 300ms debounce to search handler (use `useDeferredValue` or `setTimeout`)
- **Verify:** Typing fast doesn't trigger excessive API calls

#### Fix D-41: Persist kanban filter state to URL

- **Finding:** D-41 (WARN)
- **Files:** `frontend/src/components/unified-kanban/UnifiedKanbanBoard.tsx` — filter state
- **Fix:** Move filter state to `useSearch()` URL params
- **Verify:** Refresh preserves filters; shareable filtered URLs work

#### Fix RS-20: Pagination touch targets

- **Finding:** RS-20 (WARN)
- **Files:** Pagination component in dossier list
- **Fix:** Increase button size to `min-h-11 min-w-11` (44px)
- **Verify:** Pagination buttons meet 44px touch target on mobile

#### Fix RS-50: Login form padding responsive

- **Finding:** RS-50 (WARN)
- **Files:** `frontend/src/auth/LoginPageAceternity.tsx`
- **Fix:** Replace fixed padding with responsive: `p-4 sm:p-6 lg:p-8`
- **Verify:** Login form comfortable on 320px through 1920px

### Component Quality (3 findings)

#### Fix C-70: Unique message keys in ChatDock

- **Finding:** C-70 (WARN)
- **Files:** `frontend/src/components/ai/ChatDock.tsx` — message list render
- **Fix:** Use `message.id` or `message.timestamp` as key instead of array index
- **Verify:** No React key warnings; message updates don't flicker

#### Fix D-70: useGenerateBrief cleanup on unmount

- **Finding:** D-70 (WARN)
- **Files:** `frontend/src/domains/ai/hooks/useGenerateBrief.ts` or equivalent
- **Fix:** Add AbortController cleanup in useEffect return
- **Verify:** Navigating away mid-generation cancels the request

#### Fix D-71: ErrorBoundary around ChatDock

- **Finding:** D-71 (WARN)
- **Files:** Parent of `ChatDock` component (likely layout or chat page)
- **Fix:** Wrap `<ChatDock />` with `<ErrorBoundary fallback={<ChatErrorFallback />}>`
- **Verify:** Chat error → error UI with retry, not white screen

### Route-Specific Fixes (11 findings)

#### Fix T-21: Filter UI dark mode verification

- **Finding:** T-21 (INFO)
- **Files:** Dossier list filter popover/panel
- **Fix:** Verify filter UI renders correctly in dark mode; fix any contrast issues
- **Verify:** Filter panel readable in both light and dark themes

#### Fix RS-21: Filter popover mobile optimization

- **Finding:** RS-21 (INFO)
- **Files:** Dossier list filter component
- **Fix:** On mobile, render filter as bottom sheet or full-width drawer instead of popover
- **Verify:** Filter panel usable on 375px screen

#### Fix RS-22: Search input mobile UX

- **Finding:** RS-22 (INFO)
- **Files:** Dossier list search component
- **Fix:** Full-width on mobile, add clear button, appropriate input size
- **Verify:** Search input comfortable on mobile with proper touch targets

#### Fix RS-40..42: Mobile kanban optimization (3 findings)

- **Findings:** RS-40, RS-41, RS-42 (INFO)
- **Files:** `frontend/src/components/unified-kanban/UnifiedKanbanBoard.tsx`
- **Fix:** RS-40: Horizontal scroll with snap on mobile. RS-41: Touch-friendly drag handles. RS-42: Fix header overlap on small screens.
- **Verify:** Kanban usable on 375px screen with touch

#### Fix N-22: Breadcrumbs on type list pages

- **Finding:** N-22 (INFO)
- **Files:** Dossier type list route components (e.g., `_protected/dossiers/countries/index.tsx`)
- **Fix:** Add EntityBreadcrumbTrail to type list pages
- **Verify:** Navigation context visible on all list pages

#### Fix N-23: Loading skeletons on list navigation

- **Finding:** N-23 (INFO)
- **Files:** Dossier list page components
- **Fix:** Add Skeleton components during TanStack Query loading state
- **Verify:** Navigating to list → skeleton → content (no blank flash)

#### Fix N-30: After-action back goes to dossier not engagement

- **Finding:** N-30 (INFO)
- **Files:** After-action detail page back button
- **Fix:** Change back navigation target from dossier to parent engagement
- **Verify:** Back from after-action → engagement detail page

#### Fix C-23: Type tab routes not validated

- **Finding:** C-23 (INFO)
- **Files:** Dossier type tab routing logic
- **Fix:** Add route validation — invalid type slugs redirect to dossier index
- **Verify:** `/dossiers/invalid-type` → redirects to `/dossiers`

#### Fix D-32..34: After-action data quality (3 findings)

- **Findings:** D-32, D-33, D-34 (INFO)
- **Files:** After-action related hooks and components
- **Fix:** D-32: Add version conflict detection. D-33: Strengthen TypeScript types. D-34: Batch related queries to prevent N+1.
- **Verify:** No data inconsistencies; network tab shows batched queries

#### Fix C-12: DossierCreateWizard size

- **Finding:** C-12 (INFO)
- **Files:** `frontend/src/components/Dossier/DossierCreateWizard.tsx` (~1000+ LOC)
- **Fix:** Extract step components: `WizardStepBasic.tsx`, `WizardStepDetails.tsx`, etc.
- **Verify:** Wizard still works end-to-end; each step file < 300 LOC

#### Fix D-10 + D-11: Query patterns and context size

- **Findings:** D-10, D-11 (INFO)
- **Files:** Various domain query hooks; `frontend/src/contexts/dossier-context.tsx`
- **Fix:** D-10: Create query key factory per domain. D-11: Split context into focused sub-contexts.
- **Verify:** Query invalidation still works; no unnecessary re-renders

#### Fix R-63: Settings container missing dir

- **Finding:** R-63 (INFO)
- **Files:** `frontend/src/routes/_protected/settings/` — container components
- **Fix:** Add `dir={direction}` from useDirection() to settings page containers
- **Verify:** Settings page flows correctly in RTL

---

## Traceability Matrix

Every MASTER-AUDIT finding mapped to its batch:

| Batch | Finding IDs                                                                                                                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0     | B-01, B-02*, B-03*, C-01, C-02, D-01, D-02, D-03, N-02, R-01, R-10                                                                                                             |
| 1     | T-01, T-02, T-03, T-04, T-05, T-06, T-07, T-10, T-11, T-12, T-13, T-14, T-20, T-50, T-70                                                                                       |
| 2     | R-02, C-03, C-10, C-11, C-22                                                                                                                                                   |
| 3     | R-03, RS-01, RS-02, RS-03, RS-04, N-01, N-03                                                                                                                                   |
| 4     | R-04, R-10b, R-11, R-12, R-13, R-60, R-61, R-62                                                                                                                                |
| 5     | D-04, D-05, D-06, D-07, D-08, D-09, D-30, D-31, D-40, D-50, D-72                                                                                                               |
| 6     | N-20, N-21, N-50, N-51, D-60, D-61, N-04                                                                                                                                       |
| 7     | C-40, C-30, C-71†, C-20, C-21, D-41, RS-20, RS-50, C-70, D-70, D-71, T-21, RS-21, RS-22, RS-40, RS-41, RS-42, N-22, N-23, N-30, C-23, D-32, D-33, D-34, C-12, D-10, D-11, R-63 |

\*B-02, B-03 = browser-only findings (confirm D-01 and R-01 respectively)
†C-71 = journey report only, not in MASTER-AUDIT (bonus fix)

**Total scheduled:** 83 master + 3 browser + 1 bonus = 87

---

## Execution Summary

| Batch            | Findings               | Est. Files            | Priority  | Status   |
| ---------------- | ---------------------- | --------------------- | --------- | -------- |
| 0: True Critical | 8 CRITICAL + 3 browser | ~10                   | Immediate | COMPLETE |
| 1: Theme         | 15                     | ~15                   | High      | COMPLETE |
| 2: Shared UI     | 5                      | ~8                    | High      | COMPLETE |
| 3: Layout        | 7                      | ~6                    | Medium    | COMPLETE |
| 4: i18n/RTL      | 8                      | ~5 (high volume text) | High      | COMPLETE |
| 5: Data flow     | 11                     | ~10                   | Medium    | COMPLETE |
| 6: Navigation    | 7                      | ~7                    | Medium    | COMPLETE |
| 7: Per-route     | 28                     | ~20                   | Low       | COMPLETE |

**All 87 findings resolved across 8 batches (2026-04-12).**
