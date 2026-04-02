# Phase 13: Feature Absorption - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Absorb 6 standalone feature pages (analytics, AI briefings, network graph, search, polling, export) into their contextual locations within the hub-and-spoke architecture. Enhance the existing Cmd+K command palette into a full-featured global quick switcher that replaces the standalone search page. Remove all absorbed standalone routes with redirects to new locations.

</domain>

<decisions>
## Implementation Decisions

### Cmd+K Quick Switcher
- **D-01:** Search scope covers ALL four categories: all 8 dossier entity types, recent items, commands/actions, and global full-text search
- **D-02:** Results organized in grouped categories: Recent -> Entities (sub-grouped by dossier type) -> Commands -> Search Results. Similar to VS Code/Linear command palettes
- **D-03:** Empty state (before typing) shows 5 most recent dossiers visited + 5 most-used commands. Results replace this as user types
- **D-04:** Cmd+K completely replaces the standalone advanced search page (ABSORB-03). No separate search page remains

### Analytics Placement
- **D-05:** Dashboard gets summary KPI widgets: total dossiers by type, active engagements, upcoming deadlines, work item stats. High-level glanceable overview only — no deep drill-down charts on dashboard itself
- **D-06:** Individual dossier overview pages get context-specific metric cards tailored per dossier type: Country -> engagement count + active topics, Organization -> member countries + meeting frequency, Person -> interaction timeline, etc.

### Network Graph Embedding
- **D-07:** RelationshipSidebar gets inline mini-graph preview (reusing existing MiniRelationshipGraph component). Click "Expand" to open full-screen modal with full graph controls and interactions
- **D-08:** Full graph modal provides the complete interactive experience previously on the standalone network graph page

### Standalone Page Removal
- **D-09:** Old standalone routes redirect to their new contextual locations (e.g., /analytics -> /dashboard, /briefing-books -> nearest engagement workspace). No broken links or 404s
- **D-10:** Absorbed features accessible BOTH from their contextual location AND via Cmd+K commands (e.g., "Generate Briefing", "View Analytics"). Dual-access for discoverability

### Absorption Mapping (from ABSORB requirements)
- **D-11:** Analytics (ABSORB-01) -> Dashboard summary widgets + dossier overview context-specific cards
- **D-12:** AI Briefings (ABSORB-02) -> Engagement workspace DocsTab "Generate" action
- **D-13:** Search (ABSORB-03) -> Enhanced Cmd+K quick switcher (replaces standalone page entirely)
- **D-14:** Network Graph (ABSORB-04) -> RelationshipSidebar inline mini-graph + expand-to-modal
- **D-15:** Availability Polling (ABSORB-05) -> CalendarTab "Schedule" action
- **D-16:** Export/Import (ABSORB-06) -> List view action buttons

### Claude's Discretion
- Keyboard navigation patterns within Cmd+K (arrow keys, enter, escape behavior)
- Bilingual search matching strategy (Arabic + English simultaneous fuzzy matching)
- Result count limits per category in Cmd+K
- Chart types for dashboard summary widgets
- Analytics card refresh intervals
- Mini-graph node interaction behavior (hover, click)
- Full-screen modal graph controls and filters
- Redirect target mapping for edge cases (e.g., /briefing-books when no engagement context exists)
- Polling and Export absorption details (ABSORB-05, ABSORB-06) — follow established workspace tab patterns

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & Requirements
- `.planning/REQUIREMENTS.md` — ABSORB-01 through ABSORB-06 requirements defining what gets absorbed where
- `.planning/PROJECT.md` — Vision, principles, non-negotiables
- `.planning/ROADMAP.md` — Phase 13 success criteria (5 items)

### Prior Phase Context (absorption destinations)
- `.planning/phases/10-operations-hub/10-CONTEXT.md` — Dashboard architecture decisions (widget placement, query key factory pattern)
- `.planning/phases/11-engagement-workspace/11-CONTEXT.md` — WorkspaceShell tab pattern, DocsTab structure
- `.planning/phases/12-enriched-dossier-pages/12-CONTEXT.md` — DossierShell + RelationshipSidebar, overview tab enrichment cards

### Existing Components (key files to understand)
- `frontend/src/components/keyboard-shortcuts/CommandPalette.tsx` — Existing Cmd+K implementation (cmdk-based)
- `frontend/src/components/keyboard-shortcuts/KeyboardShortcutProvider.tsx` — Keyboard shortcut context provider
- `frontend/src/components/ui/command.tsx` — cmdk UI primitive wrapper
- `frontend/src/components/Dossier/RelationshipSidebar.tsx` — Sidebar where graph embeds
- `frontend/src/components/Dossier/MiniRelationshipGraph.tsx` — Compact graph variant to reuse
- `frontend/src/pages/analytics/AnalyticsDashboardPage.tsx` — Standalone analytics (to absorb)
- `frontend/src/pages/briefing-books/BriefingBooksPage.tsx` — Standalone briefings (to absorb)
- `frontend/src/pages/relationships/RelationshipGraphPage.tsx` — Standalone graph (to absorb)
- `frontend/src/pages/engagements/workspace/DocsTab.tsx` — Briefing absorption target
- `frontend/src/domains/analytics/repositories/analytics.repository.ts` — Analytics data access
- `frontend/src/domains/briefings/repositories/briefings.repository.ts` — Briefing data access
- `frontend/src/domains/relationships/` — Relationship domain (hooks, types, services)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **CommandPalette + cmdk**: Full command palette already wired to Cmd+K via KeyboardShortcutProvider. Needs expansion, not creation from scratch
- **MiniRelationshipGraph**: Compact graph component ready for sidebar embedding
- **RelationshipSidebar**: Already renders related entities — add graph preview above the list
- **PositionAnalyticsCard**: Existing analytics card component — adapt for dossier overview pages
- **AnalyticsDashboardPage**: Contains chart/widget logic to extract into standalone dashboard widgets
- **BriefingPackGenerator**: Existing briefing generation component to embed in DocsTab
- **WorkspaceShell tabs**: Established pattern for tab-based feature organization (Phase 11)
- **DossierShell + enrichment cards**: Grid layout pattern for overview tab cards (Phase 12)

### Established Patterns
- **Domain repository pattern**: analytics.repository.ts, briefings.repository.ts — all data access through domain repos
- **Query key factory**: Consistent TanStack Query key pattern from Phase 10
- **Lazy-loaded routes**: All route components use React.lazy() — maintain for absorbed features
- **200KB bundle budget**: All absorbed components must be lazy-loaded to stay within budget
- **useDirection() hook**: RTL/LTR handling for all new UI components

### Integration Points
- **Route tree**: TanStack Router route tree needs old routes replaced with redirects + new contextual routes
- **Sidebar navigation**: Remove standalone nav items (analytics, briefings, network graph, search)
- **Dashboard layout**: Add analytics widget grid to existing dashboard page
- **Dossier overview tabs**: Add context-specific analytics cards to existing enrichment card grids
- **DocsTab**: Add "Generate Briefing" action to existing workspace docs tab
- **CalendarTab**: Add "Schedule" polling action
- **List views**: Add export/import action buttons

</code_context>

<specifics>
## Specific Ideas

- Cmd+K grouped layout modeled after VS Code/Linear command palettes (category headers, visual separation)
- Empty state shows recent + commands immediately — no typing required for quick navigation
- Mini-graph in sidebar with "Expand" button for full modal view — best of both worlds for space constraints
- Dashboard KPIs are glanceable summary widgets, not deep analytics — keep the dashboard clean
- Each dossier type gets tailored analytics cards (not one-size-fits-all)
- Dual-access pattern: features in context + launchable via Cmd+K commands

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 13-feature-absorption*
*Context gathered: 2026-04-02*
