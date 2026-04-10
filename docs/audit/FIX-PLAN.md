# Fix Execution Plan — Intl-Dossier V2.0

**Date:** 2026-04-10
**Total findings:** 83 (8 CRITICAL, 42 WARNING, 33 INFO)
**Approach:** Fix in dependency order — each batch builds on the previous

---

## Batch 0: Emergency Fixes (CRITICAL — blocks all journeys)

_Fix these first. Each is a standalone fix that unblocks everything._

### Fix B-01: API calls hitting wrong port (5001 → 3000)

- **Finding:** B-01 (CRITICAL)
- **Impact:** Notifications + analytics broken on EVERY page load
- **Files to check:**
  - `frontend/src/domains/notifications/` — find base URL config
  - `frontend/src/domains/analytics/repositories/analytics.repository.ts` — line 5 shows the 401
  - `frontend/src/hooks/useNotificationCenter.ts` — line 294 shows the call
  - `frontend/.env` or `frontend/src/lib/api.ts` — check for hardcoded port
- **Fix:** Update base URL from port 5001 to use the Express proxy (port 3000 or relative URL)
- **Verify:** No more 401 console errors on page load

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
- **Fix:** Create index route that redirects to first admin page (e.g., /admin/ai-settings)
- **Verify:** Navigate to /admin → redirects to admin sub-page

---

## Batch 1: Theme Tokens & Color System (11 findings)

_Create centralized semantic color maps, then update all components._

### Fix T-01+T-02: Invalid oklch() values

- **Findings:** T-01, T-02
- **Files:**
  - `frontend/src/components/theme-selector/theme-selector.tsx:18-39` — fix decimal → percentage
  - `frontend/src/index.css:317` — fix achromatic oklch
- **Fix:** Convert oklch decimals to percentages; remove hue when chroma=0

### Fix T-03..T-06 + T-10..T-14 + T-20 + T-50 + T-70: Hardcoded colors → theme tokens

- **Findings:** 13 findings across 15+ components
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

### Fix T-07: Unused navigation token variables

- **Finding:** T-07 (INFO)
- **Files:** `frontend/src/styles/modern-nav-tokens.css`
- **Fix:** Remove unused `-light` variant variables
- **Priority:** Low — code cleanliness

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

### Fix C-10: TooltipProvider re-created every render

- **Finding:** C-10
- **Files:** `frontend/src/components/Dossier/DossierContextBadge.tsx:157-172`
- **Fix:** Lift TooltipProvider to parent or use singleton pattern

### Fix C-11 + C-22: Missing/non-unique key props

- **Findings:** C-11, C-22
- **Files:**
  - `frontend/src/components/Dossier/DossierCreateWizard.tsx:798` — add key={dossier.id}
  - `frontend/src/components/Dossier/UniversalDossierCard.tsx:295-303` — use key={`${tag}-${index}`}

---

## Batch 3: Layout Shell (7 findings)

_Affects all protected routes._

### Fix R-03: Layout components missing dir attributes

- **Finding:** R-03
- **Files:**
  - `frontend/src/components/layout/MainLayout.tsx` — add dir={direction} to wrapper
  - `frontend/src/components/layout/AppSidebar.tsx` — add dir attribute
  - `frontend/src/components/layout/SiteHeader.tsx` — add dir attribute
- **Fix:** Import useDirection(), apply to container divs

### Fix RS-01: Static content padding → responsive

- **Finding:** RS-01
- **Files:** `frontend/src/components/layout/MainLayout.tsx:55-60`
- **Fix:** Replace `--content-padding: 1rem` with responsive Tailwind: `px-4 sm:px-6 lg:px-8`

### Fix RS-02: Desktop-first breadcrumb scroll buttons

- **Finding:** RS-02
- **Files:** `frontend/src/components/layout/EntityBreadcrumbTrail.tsx:222-224, 264`
- **Fix:** Change `md:hidden` to `hidden md:flex` (mobile-first)

### Fix N-01: Missing elected_official breadcrumb support

- **Finding:** N-01
- **Files:** `frontend/src/components/layout/EntityBreadcrumbTrail.tsx:40-50`
- **Fix:** Add `elected_official: User` to entityIcons and entityColors maps

### Fix N-03: 404 handler improvement

- **Finding:** N-03 (partially corrected — page exists but can be more helpful)
- **Files:** `frontend/src/routes/__root.tsx`
- **Fix:** Add notFoundComponent to root route config with search and navigation suggestions
- **Priority:** Low — current 404 works, just not optimal

---

## Batch 4: i18n / RTL Corrections (10 findings)

_Affects 25+ routes. Translation work is high-volume._

### Fix R-01 + R-10 + R-13: Missing Arabic translations (500+)

- **Findings:** R-01, R-10, R-13 (CRITICAL + INFO)
- **Files:**
  - `frontend/public/locales/ar/translation.json` — add missing keys
  - Compare against `frontend/public/locales/en/translation.json`
- **Fix strategy:**
  1. Extract all keys from EN that are missing in AR
  2. Add `tabs.*` namespace (R-10 — CRITICAL)
  3. Add `dossierLinks.*` namespace
  4. Add `briefs.*`, `dataLibrary.*`, `reports.*`, `calendar.*` keys
  5. Add dossier statistics text ("of total active dossiers %")
- **Verify:** Switch to Arabic — no English text visible on any page

### Fix R-04: Namespace mismatch EN↔AR

- **Finding:** R-04 (INFO)
- **Files:** Both translation files
- **Fix:** Decide canonical names (dossierLinks vs entityLinks), update both files
- **Verify:** No missing key warnings in i18next

### Fix R-10b + R-11: Hardcoded strings in DossierCreateWizard

- **Findings:** R-10b, R-11
- **Files:** `frontend/src/components/Dossier/DossierCreateWizard.tsx:483-545, 1087-1159`
- **Fix:** Extract hardcoded Arabic text and English placeholders to translation keys

### Fix R-12: Hardcoded dir="rtl" → dynamic

- **Finding:** R-12
- **Files:** `frontend/src/components/Dossier/DossierCreateWizard.tsx:698, 856, 998, 1060, 1159`
- **Fix:** Replace dir="rtl" with dir={direction} from useDirection()

### Fix R-60 + R-61: Untranslated AI admin labels

- **Findings:** R-60, R-61
- **Files:** `frontend/src/routes/_protected/admin/ai-settings.tsx:127-139`
- **Fix:** Replace hardcoded "Anthropic", "Claude Sonnet 4" etc. with t() calls, add to translation files

---

## Batch 5: Data Flow & State Management (13 findings)

_Fix state management patterns and error handling._

### Fix D-04 + D-05: Dossier context server state + cleanup

- **Findings:** D-04, D-05
- **Files:** `frontend/src/contexts/dossier-context.tsx:~50-210`
- **Fix:** Extract resolvedContext to useQuery; add useEffect cleanup with isMounted guard

### Fix D-06: Auth methods throw after setting error state

- **Finding:** D-06
- **Files:** `frontend/src/store/authStore.ts:~50-150`
- **Fix:** Remove `throw error` from login(), logout(), checkAuth(). Error state already set.

### Fix D-07: No ErrorBoundary around Outlet

- **Finding:** D-07
- **Files:** `frontend/src/routes/_protected.tsx:~30`
- **Fix:** Wrap `<Outlet />` with `<ErrorBoundary fallback={<ErrorFallback />}>`

### Fix D-08: Stale auth in localStorage

- **Finding:** D-08
- **Files:** `frontend/src/store/authStore.ts:~195`
- **Fix:** Use `partialize` to exclude user/isAuthenticated from persist, or clear on TOKEN_EXPIRED

### Fix D-09: ChatContext no subscription cleanup

- **Finding:** D-09
- **Files:** `frontend/src/contexts/ChatContext.tsx`
- **Fix:** Add cleanup callback for subscriptions, verify useAIChat cleanup

### Fix D-30: After-action doesn't invalidate engagement queries

- **Finding:** D-30
- **Files:** `frontend/src/hooks/useAfterAction.ts:211-216`
- **Fix:** Add `queryClient.invalidateQueries({ queryKey: ['engagement', data.engagement_id] })`

### Fix D-31: After-action form missing loading state

- **Finding:** D-31
- **Files:** `frontend/src/routes/_protected/engagements/$engagementId/after-action.tsx:89-93`
- **Fix:** Pass `isSubmitting={createAfterAction.isPending}` to AfterActionForm

### Fix D-40: Kanban optimistic revert gaps

- **Finding:** D-40
- **Files:** `frontend/src/components/unified-kanban/UnifiedKanbanBoard.tsx:175-189`
- **Fix:** Wrap mutateAsync in try-catch with explicit column state rollback

### Fix D-50: FirstRunModal + OnboardingTour conflict

- **Finding:** D-50
- **Files:** `frontend/src/routes/_protected/index.tsx`
- **Fix:** Add gate: don't render tour while FirstRunModal is open

### Fix D-72: useAIChat stale messages closure

- **Finding:** D-72
- **Files:** `frontend/src/domains/ai/hooks/useAIChat.ts:74`
- **Fix:** Use functional setState: `setMessages(prev => [...prev, userMessage])`

---

## Batch 6: Navigation & Routing (5 findings)

### Fix N-20: Type tabs missing active state

- **Finding:** N-20
- **Files:** Dossier list page tab component
- **Fix:** Use useLocation() to detect current route, apply active styling

### Fix N-21: Card onClick → Link

- **Finding:** N-21
- **Files:** `frontend/src/components/Dossier/UniversalDossierCard.tsx:335-370`
- **Fix:** Wrap card in Link component, make onView optional fallback

### Fix N-50: Login redirect hop

- **Finding:** N-50
- **Files:** `frontend/src/auth/LoginPageAceternity.tsx:onSubmit`
- **Fix:** Change navigate({ to: '/' }) to navigate({ to: '/dashboard' })

### Fix D-60: Permission denied error UX

- **Finding:** D-60
- **Files:** `frontend/src/routes/_protected/admin/field-permissions.tsx:95-100`
- **Fix:** Use actionable error type with i18n key instead of generic Error()

### Fix D-61: AI settings raw error toast

- **Finding:** D-61
- **Files:** `frontend/src/routes/_protected/admin/ai-settings.tsx:193-202`
- **Fix:** Use t('errors.' + error.code) pattern instead of error.message

---

## Batch 7: Per-Journey Route Fixes (remaining)

_Lower priority items — fix after Batches 0-6._

### Accessibility fixes

- C-40: Add aria-label to draggable kanban cards
- C-30: Add aria-label to back buttons
- C-71: Add aria-label to ChatInput textarea

### UX improvements

- C-20: Move pagination state to URL params (useSearch)
- C-21: Add debounce to search input
- D-41: Persist kanban filter state to URL
- RS-20: Increase pagination touch targets to 44px
- RS-50: Make login form padding responsive

### Component quality

- C-70: Use unique message keys in ChatDock (not index)
- D-70: Add cleanup to useGenerateBrief on unmount
- D-71: Add ErrorBoundary around ChatDock

### Low priority (INFO)

- RS-40..42: Mobile kanban optimization, touch drag, header overlap
- N-22: Add breadcrumbs to type list pages
- N-23: Add loading skeletons on list navigation
- D-32..34: Version conflict detection, type safety, N+1 queries
- C-12: Consider splitting DossierCreateWizard into sub-components
- D-10..11: Query key factories, context splitting
- N-04: URL naming convention standardization
- R-62..63: Field permissions headers, settings dir attribute

---

## Execution Summary

| Batch         | Findings   | Est. Files                | Priority  |
| ------------- | ---------- | ------------------------- | --------- |
| 0: Emergency  | 7 CRITICAL | ~8                        | Immediate |
| 1: Theme      | 11         | ~15                       | High      |
| 2: Shared UI  | 7          | ~8                        | High      |
| 3: Layout     | 7          | ~5                        | Medium    |
| 4: i18n/RTL   | 10         | ~5 (but high volume text) | High      |
| 5: Data flow  | 13         | ~10                       | Medium    |
| 6: Navigation | 5          | ~5                        | Medium    |
| 7: Per-route  | 23         | ~15                       | Low       |

**Recommended execution:** Batch 0 → 1 → 2 → 4 → 3 → 5 → 6 → 7
(Batch 4 moved up because Arabic translations are user-facing and high impact)
