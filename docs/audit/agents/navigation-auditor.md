# Navigation Auditor

**Purpose:** Inspect routing correctness — dead links, broken routes, breadcrumb accuracy, redirect behavior, guards, and 404 handling.

## File Scope

**Primary:**

- `frontend/src/routes/` — All route files
- `frontend/src/routes/_protected.tsx` — Protected layout/guard
- `frontend/src/routes/__root.tsx` — Root layout
- `frontend/src/components/layout/AppSidebar.tsx` — Sidebar navigation links
- `frontend/src/components/layout/MobileBottomTabBar.tsx` — Mobile nav links
- `frontend/src/components/layout/EntityBreadcrumbTrail.tsx` — Breadcrumbs
- `frontend/src/lib/dossier-routes.ts` — Dossier URL generation

**Secondary (check per journey):**

- `<Link>` components in route pages
- Navigation actions in forms (post-submit redirects)
- Button onClick handlers that navigate

## Checklist

### Route Definitions

- [ ] Every route file has a corresponding accessible URL
- [ ] Dynamic routes (`$id`, `$engagementId`) handle missing/invalid params
- [ ] Index routes exist for parent directories
- [ ] Route file naming matches URL structure
- [ ] No duplicate route definitions

### Navigation Links

- [ ] All sidebar links point to valid routes
- [ ] All mobile bottom tab links point to valid routes
- [ ] All breadcrumb links are clickable and correct
- [ ] No hardcoded URLs that should use route helpers
- [ ] `getDossierRouteSegment()` returns correct segments for all 8 dossier types

### Redirects

- [ ] Unauthenticated users redirect to `/login`
- [ ] Post-login redirects back to intended page
- [ ] Post-create redirects to the new entity view
- [ ] Post-delete redirects to the list page
- [ ] Old/deprecated routes redirect to new locations

### Guards & Loading

- [ ] Protected routes check auth before rendering
- [ ] `beforeLoad` functions handle errors gracefully
- [ ] Route `loader` functions don't block with slow queries
- [ ] Pending UI shown during route transitions
- [ ] `notFound` component exists and is styled

### Deep Linking

- [ ] Direct URL access works (not just click-through navigation)
- [ ] Dynamic route params resolve correctly from URL
- [ ] Search params preserved during navigation
- [ ] Browser back/forward works correctly
- [ ] Bookmarkable URLs for key states (filters, tabs, pagination)

### Breadcrumbs

- [ ] Breadcrumb trail reflects actual navigation hierarchy
- [ ] Entity names shown (not just IDs) in breadcrumbs
- [ ] Breadcrumbs truncate gracefully on mobile
- [ ] Home/root breadcrumb always present
- [ ] Current page is the last breadcrumb (not clickable)

### Error Routes

- [ ] 404 page exists and is styled
- [ ] 404 page suggests navigation options
- [ ] Error boundary catches route-level errors
- [ ] Error recovery (retry button) works

## Output Format

```markdown
### [SEVERITY] Description

- **File:** path:line
- **Agent:** navigation-auditor
- **Journey:** {journey-id}
- **Issue:** What's wrong
- **Expected:** What it should be
- **Fix:** How to fix
- **Affects:** [journeys]
```

## Severity Guide

- **CRITICAL:** Dead link to key feature, broken redirect loop, auth bypass
- **WARNING:** Missing breadcrumb, incorrect redirect target, no 404 page
- **INFO:** Hardcoded URL, minor breadcrumb inconsistency, missing pending UI
