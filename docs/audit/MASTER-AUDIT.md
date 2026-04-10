# Master Audit — Intl-Dossier V2.0

**Started:** 2026-04-10
**Status:** Code audit complete for all journeys. Browser verification pending.
**Approach:** Audit first (code + browser), fix second (dependency order)

---

## Journey Progress

| #   | Journey                       | Code Audit | Browser Verify | Status        |
| --- | ----------------------------- | ---------- | -------------- | ------------- |
| 0   | Shared Infrastructure         | Done       | Pending        | Code complete |
| 1   | Dossier Creation & Management | Done       | Pending        | Code complete |
| 2   | Dossier Browsing & Filtering  | Done       | Pending        | Code complete |
| 3   | Engagement Lifecycle          | Done       | Pending        | Code complete |
| 4   | My Work / Task Board          | Done       | Pending        | Code complete |
| 5   | Login → Dashboard → Navigate  | Done       | Pending        | Code complete |
| 6   | Settings & Admin              | Done       | Pending        | Code complete |
| 7   | AI Chat & Briefings           | Done       | Pending        | Code complete |

## Findings Summary

| Severity  | Count  | Fixed | Remaining |
| --------- | ------ | ----- | --------- |
| CRITICAL  | 8      | 0     | 8         |
| WARNING   | 42     | 0     | 42        |
| INFO      | 33     | 0     | 33        |
| **Total** | **83** | **0** | **83**    |

---

## Consolidated Findings by Fix Layer

Fixes applied in this order — each layer builds on the previous.

### Layer 1: Theme Tokens & CSS Variables (11 findings)

_Affects all journeys. Fix first._

| ID       | Sev  | Journey | Description                                                                                |
| -------- | ---- | ------- | ------------------------------------------------------------------------------------------ |
| T-01     | WARN | J0      | Invalid oklch() format in theme selector previews                                          |
| T-02     | WARN | J0      | Invalid oklch() in BlueSky dark mode (achromatic hue)                                      |
| T-03     | WARN | J0      | Hardcoded hex in GraphVisualization (#3b82f6, #8b5cf6, etc.)                               |
| T-04     | WARN | J0      | Hardcoded hex fallback in EnhancedGraphVisualization                                       |
| T-05     | WARN | J0      | Hardcoded hex in AdvancedGraphVisualization (#b45309)                                      |
| T-06     | WARN | J0      | Hardcoded hex in BotIntegrationsSettings (bg-[#5558AF])                                    |
| T-07     | INFO | J0      | Unused -light navigation token variables                                                   |
| T-10..14 | WARN | J1      | Hardcoded type/status/activity/alert/interaction colors in dossier components (5 findings) |
| T-20     | WARN | J2      | Hardcoded type/status colors in UniversalDossierCard                                       |
| T-50     | WARN | J5      | Login page hardcoded dark mode classes                                                     |
| T-70     | WARN | J7      | Hardcoded colors in BriefGenerationPanel                                                   |

**Pattern:** ~15 components use hardcoded Tailwind color classes instead of theme tokens. Creating a centralized semantic color map (status → token, type → token) would fix most of these in one batch.

---

### Layer 2: Shared UI Components (7 findings)

_Affects 39+ routes via component library._

| ID   | Sev      | Journey | Description                                                    |
| ---- | -------- | ------- | -------------------------------------------------------------- |
| C-01 | **CRIT** | J0      | Button forwardRef broken in heroui-button.tsx                  |
| C-02 | **CRIT** | J0      | Button re-export forwardRef also broken (button.tsx)           |
| C-03 | WARN     | J0      | HeroUI forms prop type consistency unverified                  |
| R-02 | WARN     | J0      | Physical position classes (left-/right-) in ~20 UI components  |
| C-10 | WARN     | J1      | TooltipProvider re-created every render in DossierContextBadge |
| C-11 | WARN     | J1      | Missing key prop on similar dossiers list                      |
| C-22 | WARN     | J2      | Missing key uniqueness on tags in UniversalDossierCard         |

---

### Layer 3: Layout Shell (7 findings)

_Affects all protected routes._

| ID    | Sev  | Journey | Description                                                            |
| ----- | ---- | ------- | ---------------------------------------------------------------------- |
| RS-01 | WARN | J0      | Static content padding — no responsive scaling                         |
| RS-02 | WARN | J0      | Desktop-first breadcrumb scroll buttons                                |
| RS-03 | INFO | J0      | Small breadcrumb scroll button touch targets (24px)                    |
| RS-04 | INFO | J0      | Header height not responsive (fixed 3.5rem)                            |
| R-03  | WARN | J0      | Layout components (MainLayout, Sidebar, Header) missing dir attributes |
| N-01  | WARN | J0      | Missing breadcrumb support for elected_official type                   |
| N-03  | WARN | J0      | No explicit 404 handler in root route                                  |

---

### Layer 4: i18n / RTL Corrections (10 findings)

_Affects 25+ routes._

| ID    | Sev      | Journey | Description                                                  |
| ----- | -------- | ------- | ------------------------------------------------------------ |
| R-01  | **CRIT** | J0      | 293 missing Arabic translations (18.8% gap)                  |
| R-04  | INFO     | J0      | Namespace mismatch EN↔AR (dossierLinks vs entityLinks)       |
| R-10  | **CRIT** | J1      | Missing entire `tabs` namespace in Arabic                    |
| R-10b | WARN     | J1      | Hardcoded Arabic text in DossierCreateWizard                 |
| R-11  | WARN     | J1      | Hardcoded English form placeholders                          |
| R-12  | WARN     | J1      | Hardcoded dir="rtl" instead of dynamic binding (5 instances) |
| R-13  | INFO     | J1      | Missing 265+ dossier-specific AR translation keys            |
| R-60  | WARN     | J6      | Hardcoded AI model/provider labels not translated            |
| R-61  | WARN     | J6      | SelectItem children not translated (11 instances)            |
| R-62  | INFO     | J6      | Field permissions table headers may be hardcoded English     |

---

### Layer 5: Data Flow & State Management (16 findings)

_Affects specific journeys but includes critical auth issues._

| ID   | Sev      | Journey | Description                                                   |
| ---- | -------- | ------- | ------------------------------------------------------------- |
| D-01 | **CRIT** | J0      | Auth state change listener no cleanup (module scope)          |
| D-02 | **CRIT** | J0      | Race condition in protected route auth check                  |
| D-03 | **CRIT** | J0      | Floating promise in main.tsx (Sentry init)                    |
| D-04 | WARN     | J0      | Dossier context holds server state (should be TanStack Query) |
| D-05 | WARN     | J0      | Dossier context useEffect no cleanup                          |
| D-06 | WARN     | J0      | Auth methods throw after setting error state                  |
| D-07 | WARN     | J0      | No ErrorBoundary around Outlet in protected layout            |
| D-08 | WARN     | J0      | Zustand persists stale auth in localStorage                   |
| D-09 | WARN     | J0      | ChatContext no subscription cleanup                           |
| D-10 | INFO     | J0      | Inconsistent query key factory pattern across domains         |
| D-11 | INFO     | J0      | Dossier context value has 39+ properties                      |
| D-30 | WARN     | J3      | After-action creation doesn't invalidate engagement queries   |
| D-31 | WARN     | J3      | After-action form submit not showing loading state            |
| D-40 | WARN     | J4      | Kanban mutation error doesn't guarantee optimistic revert     |
| D-50 | WARN     | J5      | FirstRunModal and OnboardingTour conflict                     |
| D-72 | WARN     | J7      | useAIChat sendMessage captures stale messages                 |

---

### Layer 6: Navigation & Routing (7 findings)

| ID   | Sev      | Journey | Description                                           |
| ---- | -------- | ------- | ----------------------------------------------------- |
| N-02 | **CRIT** | J0      | Missing /admin index route                            |
| N-04 | INFO     | J0      | Mixed URL naming conventions (underscores vs hyphens) |
| N-20 | WARN     | J2      | Type tabs missing active state indicator              |
| N-21 | WARN     | J2      | Card navigation uses onClick instead of Link          |
| N-50 | WARN     | J5      | Login redirects to / instead of /dashboard            |
| N-51 | INFO     | J5      | Missing /\_protected/index.tsx redirect               |
| D-60 | WARN     | J6      | Permission denied error not user-friendly             |

---

### Layer 7: Per-Journey Route Fixes (22 findings)

_Isolated impact — fix last._

| ID        | Sev  | Journey | Description                                                  |
| --------- | ---- | ------- | ------------------------------------------------------------ |
| C-12      | INFO | J1      | DossierCreateWizard very large (~1000+ LOC)                  |
| C-20      | WARN | J2      | Pagination state not in URL                                  |
| C-21      | WARN | J2      | Search input not debounced                                   |
| RS-20     | WARN | J2      | Pagination touch targets < 44px                              |
| T-21      | INFO | J2      | Filter UI dark mode not verified                             |
| RS-21     | INFO | J2      | Filter popover not mobile-optimized                          |
| RS-22     | INFO | J2      | Search input missing mobile UX                               |
| N-22      | INFO | J2      | Breadcrumbs missing from type list pages                     |
| N-23      | INFO | J2      | No loading state on list navigation                          |
| C-23      | INFO | J2      | Type tab routes not validated                                |
| D-32..34  | INFO | J3      | Version conflict string matching, type safety, N+1 query (3) |
| C-30      | INFO | J3      | Missing aria-label on back buttons                           |
| N-30      | INFO | J3      | After-action back goes to dossier not engagement             |
| D-41      | WARN | J4      | Filter state not persisted to URL                            |
| C-40      | WARN | J4      | Missing aria-label on draggable kanban cards                 |
| RS-40..42 | INFO | J4      | Mobile columns, touch drag, header overlap (3)               |
| RS-50     | WARN | J5      | Login form padding not responsive                            |
| D-61      | WARN | J6      | AI settings error toast shows raw API errors                 |
| R-63      | INFO | J6      | Settings container missing dir attribute                     |
| C-70      | WARN | J7      | Non-unique message keys in ChatDock                          |
| D-70      | WARN | J7      | useGenerateBrief missing cleanup on unmount                  |
| D-71      | WARN | J7      | Missing ErrorBoundary around ChatDock                        |

---

## Critical Issues — Fix Immediately

| #   | ID        | Description                         | Impact                           | Files                         |
| --- | --------- | ----------------------------------- | -------------------------------- | ----------------------------- |
| 1   | C-01+C-02 | Button forwardRef broken            | All 100+ button consumers        | heroui-button.tsx, button.tsx |
| 2   | D-01      | Auth listener no cleanup            | Memory leak, duplicate listeners | authStore.ts                  |
| 3   | D-02      | Protected route auth race condition | Brief flash of protected content | \_protected.tsx               |
| 4   | D-03      | Floating promise in main.tsx        | Silent error swallowing          | main.tsx                      |
| 5   | R-01+R-10 | Missing 500+ Arabic translations    | Raw keys shown to Arabic users   | ar/translation.json           |
| 6   | N-02      | Missing /admin index route          | 404 on /admin navigation         | admin/index.tsx (create)      |
| 7   | B-01      | API calls hitting port 5001 (wrong) | Notifications + analytics broken | API config / proxy setup      |

---

## Browser Verification Findings (NEW)

3 new findings from browser walkthrough (2026-04-10):

| ID   | Sev      | Description                                                                                                                                        |
| ---- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| B-01 | **CRIT** | API calls to notifications-center and analytics-dashboard hitting port 5001 (401). Should use Express proxy on port 3000. Repeats every page load. |
| B-02 | WARN     | Supabase auth lock contention — NavigatorLockAcquireTimeoutError with 8+ "lock stolen" messages. Confirms D-01.                                    |
| B-03 | WARN     | "of total active dossiers %" visible in English on Arabic dossier page. Confirms R-01/R-13.                                                        |

### Visual Verification Summary

| Check                | Result                                          |
| -------------------- | ----------------------------------------------- |
| RTL layout (Arabic)  | PASS — sidebar, content, bottom nav all correct |
| LTR layout (English) | PASS — sidebar flips to left correctly          |
| Dark mode            | PASS — no invisible text, cards/sidebar themed  |
| Light mode           | PASS — clean, readable, good contrast           |
| Mobile (375px)       | PASS — sidebar collapses, bottom tab bar shows  |
| 404 page             | PASS — styled, Arabic text, navigation buttons  |
| Theme persistence    | PASS — survives page refresh                    |

### Corrected Findings

- **N-03 (no 404 handler):** PARTIAL CORRECTION — 404 page exists and is styled. Issue is no notFoundComponent in root route config, but a catch-all 404 page does render.

---

## Next Steps

1. **Create FIX-PLAN.md** — Batched fix plan following Layer 1→7 order
2. **Execute fixes** — Layer by layer with atomic commits
3. **Re-verify** — Re-walk Journey 0 + Journey 1 to confirm fixes hold
