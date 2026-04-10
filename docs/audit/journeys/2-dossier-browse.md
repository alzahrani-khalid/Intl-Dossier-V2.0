# Journey 2 — Dossier Browsing & Filtering

**Date:** 2026-04-10
**Status:** Code audit complete, browser verification pending
**Agents:** Theme, Component, Responsive, Navigation

## Summary

- **Critical:** 0
- **Warning:** 7
- **Info:** 6

---

## Findings

### [WARNING] T-20: Hardcoded type/status colors in UniversalDossierCard

- **File:** frontend/src/components/Dossier/UniversalDossierCard.tsx:99-135
- **Agent:** theme-auditor
- **Journey:** 2-dossier-browse
- **Issue:** getTypeColor() and getStatusColor() hardcode Tailwind classes (bg-blue-100 dark:bg-blue-900). Theme switching won't affect these.
- **Expected:** Use CSS variable-based color map for dossier types and statuses
- **Fix:** Create theme token map for 7 types + 4 statuses
- **Affects:** [2-dossier-browse, all dossier list views]

### [WARNING] C-20: Pagination state not in URL

- **File:** frontend/src/routes/\_protected/dossiers/ (list pages)
- **Agent:** component-auditor
- **Journey:** 2-dossier-browse
- **Issue:** currentPage, limit, sort_by stored in local useState. Back from detail resets to page 1.
- **Expected:** Sync to URL: ?page=2&limit=12&sort_by=updated_at
- **Fix:** Use TanStack Router useSearch() for pagination state
- **Affects:** [2-dossier-browse, UX]

### [WARNING] C-21: Search input not debounced

- **File:** frontend/src/routes/\_protected/dossiers/ (list pages)
- **Agent:** component-auditor
- **Journey:** 2-dossier-browse
- **Issue:** onChange triggers refetch on every keystroke. Excessive API calls.
- **Expected:** 300-500ms debounce before filter triggers
- **Fix:** Add debounce to search onChange handler
- **Affects:** [2-dossier-browse, performance]

### [WARNING] RS-20: Pagination touch targets < 44px

- **File:** frontend/src/routes/\_protected/dossiers/ (pagination)
- **Agent:** responsive-auditor
- **Journey:** 2-dossier-browse
- **Issue:** Mobile pagination buttons ~36-40px, below 44px minimum.
- **Expected:** min-h-11 min-w-11 on mobile
- **Fix:** Increase button base padding for touch
- **Affects:** [2-dossier-browse, mobile UX]

### [WARNING] N-20: Type tabs missing active state indicator

- **File:** frontend/src/routes/\_protected/dossiers/ (tabs)
- **Agent:** navigation-auditor
- **Journey:** 2-dossier-browse
- **Issue:** Tabs rendered without visual active indicator. User can't tell which type is selected.
- **Expected:** Active tab with border-bottom or background color
- **Fix:** Use useLocation() to detect current route, apply active styling
- **Affects:** [2-dossier-browse, navigation clarity]

### [WARNING] N-21: Card navigation uses onClick instead of Link

- **File:** frontend/src/components/Dossier/UniversalDossierCard.tsx:335-370
- **Agent:** navigation-auditor
- **Journey:** 2-dossier-browse
- **Issue:** Main card uses onClick callback, compact variant uses Link. Mixed patterns break scroll preservation.
- **Expected:** All card variants route via Link component
- **Fix:** Wrap card in Link, make onView optional fallback
- **Affects:** [2-dossier-browse, navigation]

### [WARNING] C-22: Missing key uniqueness on tags

- **File:** frontend/src/components/Dossier/UniversalDossierCard.tsx:295-303
- **Agent:** component-auditor
- **Journey:** 2-dossier-browse
- **Issue:** Tags use key={tag} where tag is string. Duplicate tags cause render bugs.
- **Expected:** key={`${tag}-${index}`} or UUID-based keys
- **Fix:** Add index fallback to key
- **Affects:** [2-dossier-browse]

### [INFO] T-21: Filter UI dark mode not verified

- **Agent:** theme-auditor
- **Journey:** 2-dossier-browse
- **Issue:** Popover + Command components need dark mode contrast testing
- **Fix:** Test with dark theme, add dark: prefixes if needed

### [INFO] RS-21: Filter popover not mobile-optimized

- **Agent:** responsive-auditor
- **Journey:** 2-dossier-browse
- **Issue:** Popover may overflow on mobile. Should use Dialog on mobile.
- **Fix:** Conditional render via useMediaQuery()

### [INFO] RS-22: Search input missing mobile UX

- **Agent:** responsive-auditor
- **Journey:** 2-dossier-browse
- **Issue:** No clear button or Enter key handling on mobile
- **Fix:** Add clear button and onKeyDown Enter handler

### [INFO] N-22: Breadcrumbs missing from type list pages

- **Agent:** navigation-auditor
- **Journey:** 2-dossier-browse
- **Issue:** No breadcrumb context on /dossiers/countries etc.
- **Fix:** Add EntityBreadcrumbTrail to each type list page

### [INFO] N-23: No loading state on list navigation

- **Agent:** navigation-auditor
- **Journey:** 2-dossier-browse
- **Issue:** Tab switches and pagination feel unresponsive
- **Fix:** Show skeleton cards during fetch

### [INFO] C-23: Type tab routes not validated

- **Agent:** component-auditor
- **Journey:** 2-dossier-browse
- **Issue:** If route deleted, tab click 404s silently
- **Fix:** Add hasRoute() checks before rendering tabs
