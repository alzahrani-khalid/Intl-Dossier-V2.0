# Phase 8: Navigation & Route Consolidation - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Restructure the app's navigation from a flat/6-category layout to a hub-based 3-group sidebar (desktop), add a mobile bottom tab bar replacing the sidebar on small screens, consolidate duplicate/orphan routes with redirects, hide demo pages behind a dev flag, and enhance the Cmd+K quick switcher to search globally across all entity types.

</domain>

<decisions>
## Implementation Decisions

### Sidebar Group Organization (NAV-01)

- **D-01:** Three groups: **Operations** (Dashboard, Engagements, After-Actions, Tasks/Work Items, Calendar, Briefs/Briefing Books, Analytics, Activity, Advanced Search, Availability Polling), **Dossiers** (Countries, Organizations, Persons, Forums, Topics, Working Groups, Engagements cross-link), **Administration** (AI Settings, System Settings, Field Permissions, Audit Logs, Data Retention, Approvals)
- **D-02:** Standalone pages (Analytics, Activity, Advanced Search, Availability Polling) placed under Operations group as secondary items
- **D-03:** Engagements appear in BOTH Operations (as workflow entry) AND Dossiers (as entity type) — cross-linked
- **D-04:** Badge counts shown on key items only: Tasks (pending count), Approvals (pending count), Engagements (active count). No badges on dossier type links.
- **D-05:** Brand area at sidebar top includes logo + small user avatar/name. User menu moves from footer to header area.

### Mobile Bottom Tab Bar (NAV-05)

- **D-06:** 4 bottom tabs: Dashboard, Dossiers, Tasks, More
- **D-07:** Active tab indicator uses filled icon + colored label. Inactive tabs use outline icons + muted labels.
- **D-08:** Tab bar auto-hides on scroll down, reappears on scroll up (iOS Safari pattern)
- **D-09:** Safe area inset bottom padding for modern phones with notch/home indicator

### Route Cleanup (NAV-03, NAV-04)

- **D-10:** Demo pages gated with `VITE_DEV_MODE` route-level guard — `beforeLoad` checks `import.meta.env.VITE_DEV_MODE`, redirects to `/dashboard` in production
- **D-11:** 14 identified demo pages: progressive-form-demo, responsive-demo, plugin-demo, duplicate-detection-demo, modern-nav-demo, form-auto-save-demo, export-import, compliance-demo, field-history-demo, entity-templates-demo, bulk-actions-demo, validation-demo, meeting-minutes-demo, actionable-errors-demo

### Cmd+K Quick Switcher (NAV-06)

- **D-12:** Search scope covers ALL entity types: dossiers (all 7 types), navigation pages, work items (tasks/commitments/intake), commands (create engagement, switch language, toggle theme), and any other searchable content
- **D-13:** Show last 5-10 recently visited items when palette opens (before typing). Stored in localStorage.
- **D-14:** Results grouped by type: Recents, Dossiers, Pages, Work Items, Commands — each section shows top 3-5 matches (VS Code/Raycast style)
- **D-15:** Most performant data source: hybrid approach — search TanStack Query cache first for instant results, fall back to API search endpoint (debounced) for cache misses
- **D-16:** Mobile accessible via search icon in header that opens full-screen command palette overlay

### Claude's Discretion

- Sidebar group collapse default state (all expanded vs selective collapse based on item count)
- Icon-rail behavior (768-1023px) — whether to show group icons with flyout or flat icon list
- After-Actions placement: own sidebar item vs nested under Engagements (decide based on workflow patterns)
- "More" tab content format on mobile (bottom sheet with groups vs flat list)
- "Dossiers" tab expansion behavior on mobile (hub page vs inline picker)
- Old/duplicate route redirect strategy (redirect to canonical vs 404)
- modern-nav-standalone.tsx treatment (demo gate vs removal)

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning Documents

- `.planning/ROADMAP.md` — Phase 8 goal, success criteria, requirements mapping
- `.planning/REQUIREMENTS.md` — NAV-01 through NAV-06 acceptance criteria
- `.planning/PROJECT.md` — Project constraints (200KB bundle budget, bilingual, tech stack)

### Navigation & Layout Code

- `frontend/src/components/layout/navigation-config.ts` — Current nav section builder (`createNavigationSections`)
- `frontend/src/components/layout/AppSidebar.tsx` — Current sidebar with shadcn Sidebar primitives
- `frontend/src/components/layout/nav-main.tsx` — Nav group renderer
- `frontend/src/components/layout/nav-user.tsx` — User menu component
- `frontend/src/components/layout/SidebarSearch.tsx` — Sidebar search input
- `frontend/src/components/layout/QuickNavigationMenu.tsx` — Quick nav menu
- `frontend/src/components/modern-nav/navigationData.ts` — 6-category nav data structure (to be replaced)
- `frontend/src/components/responsive/responsive-nav.tsx` — Existing responsive nav patterns

### Route Structure

- `frontend/src/routes/__root.tsx` — Root layout with CommandPalette, KeyboardShortcutProvider
- `frontend/src/routes/_protected.tsx` — Protected layout with MainLayout, ChatDock, auth guard
- `frontend/src/lib/dossier-routes.ts` — Dossier type-to-route mapping (`getDossierRouteSegment`, `getDossierDetailPath`)

### UI Components

- `frontend/src/components/ui/sidebar.tsx` — Sidebar UI primitives (SidebarGroup, SidebarMenu, etc.)
- `frontend/src/components/ui/sidebar-collapsible.tsx` — Collapsible sidebar variant
- `frontend/src/components/keyboard-shortcuts/` — Existing CommandPalette implementation

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `AppSidebar.tsx` + `navigation-config.ts`: Current sidebar framework using shadcn Sidebar primitives — can be refactored in place rather than replaced
- `CommandPalette` already wired in `__root.tsx` via `KeyboardShortcutProvider` — enhance rather than rebuild
- `dossier-routes.ts`: Route helpers for all 7 dossier types — already provides consistent `/dossiers/{type}/` URL structure
- `useResponsive()` hook: Breakpoint detection already available from Phase 5
- `useSidebar()`: Sidebar state management (open/close/mobile) already implemented
- `useWorkQueueCounts()`: Already fetches work item counts for badge display
- `NavigationShell`: Production nav wrapper from Phase 5 (3-column responsive)

### Established Patterns

- TanStack Router file-based routing with `createFileRoute` + `beforeLoad` guards
- shadcn Sidebar compound components (SidebarGroup, SidebarMenu, SidebarMenuButton)
- i18n keys under `common` namespace for navigation labels (`t('navigation.workspace')`)
- RTL-aware sidebar with `isRTL` detection and directional icon logic

### Integration Points

- `_protected.tsx` renders `MainLayout` which wraps `AppSidebar` — this is the entry point for sidebar changes
- `__root.tsx` provides `CommandPalette` — enhance search capabilities here
- `navigation-config.ts` `createNavigationSections()` — restructure from 6 categories to 3 groups
- Demo routes are individual files in `_protected/` — add `beforeLoad` guard to each

</code_context>

<specifics>
## Specific Ideas

- Bottom tab bar behavior modeled after iOS Safari (auto-hide on scroll, safe area padding)
- Cmd+K results grouped like VS Code/Raycast command palette with type sections
- User avatar added to sidebar header area (current sidebar has logo only)
- Badge counts on Tasks/Approvals/Engagements for at-a-glance status

</specifics>

<deferred>
## Deferred Ideas

- **Start absorbing standalone pages earlier** — User expressed interest in moving analytics/briefs/network-graph into contextual locations during Phase 8, but this is Phase 13 (Feature Absorption) scope. Consider accelerating Phase 13 or merging some absorption work earlier if time allows.

</deferred>

---

_Phase: 08-navigation-route-consolidation_
_Context gathered: 2026-03-29_
