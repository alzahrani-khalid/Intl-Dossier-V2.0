# Phase 12: Enriched Dossier Pages - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Unify all 8 dossier types (Country, Organization, Forum, Topic, Working Group, Person, Elected Official, Engagement) into a consistent detail page structure: shared DossierShell with header bar, URL-driven tab bar, and collapsible RelationshipSidebar. Add tier-specific enrichments per dossier type in their Overview tabs. Stand up Elected Officials as a full domain with list page, detail page, DB schema, and backend API.

**Not in scope:** New capabilities like search/filtering beyond what exists, AI-powered features, network graph enhancements, or analytics absorption (Phase 13).

</domain>

<decisions>
## Implementation Decisions

### Shared Shell Architecture (DOSS-01, DOSS-10)

- **D-01:** Refactor existing `DossierDetailLayout` into a new `DossierShell` component that mirrors Phase 11's `WorkspaceShell` pattern: sticky header, tab bar, RelationshipSidebar, and child outlet. Preserve existing features (presence indicators, export dialog, AddToDossierMenu) while adding tabs and sidebar.
- **D-02:** Tabs are **URL-driven routes** — each tab is a nested route (e.g., `/dossiers/countries/$id/overview`, `/dossiers/countries/$id/tasks`). Matches the engagement workspace pattern. Deep-linkable, browser back/forward works.
- **D-03:** **Shared base tabs** across all 8 types: Overview, Engagements, Docs, Tasks, Timeline, Audit. Types can have **extra tabs** via a `tabConfig` prop on DossierShell:
  - Country: + Positions
  - Organization: + MoUs
  - Topic: + Positions
  - Elected Officials: + Committees
  - Forum, Working Group, Person: shared tabs only
  - Engagement: continues using WorkspaceShell (not DossierShell)

### RelationshipSidebar Design (DOSS-02, DOSS-09)

- **D-04:** Desktop: **icon-toggle collapse** — a button in the sidebar header toggles between full panel (~280px) and collapsed icon strip. No drag resize (no react-resizable-panels needed). Uses existing `PanelRightClose`/`PanelRightOpen` icon pattern from DossierDetailLayout.
- **D-05:** Mobile (below `lg` breakpoint): **bottom sheet/drawer** — a "Relationships" link/button in the header opens a half-screen bottom sheet with full sidebar content. Draggable to full height.
- **D-06:** Sidebar content: linked dossiers grouped by relationship tier (e.g., Strategic, Operational), with count badges per tier, collapsible tier sections, and click-to-navigate on each linked dossier.
- **D-07:** Quick-add uses a **search popover** — clicking [+ Add Link] opens a popover with search input filtering existing dossiers (reuses `DossierSelector` pattern). Relationship type/tier can be set during linking.

### Tier-Specific Enrichments (DOSS-03, DOSS-04, DOSS-05, DOSS-06, DOSS-07)

- **D-08:** Overview tab uses a **responsive card grid** layout. Shared cards (Summary Stats, Recent Activity) appear for all types. Type-specific cards are injected per dossier type. Each card is its own component.
- **D-09:** Enrichment cards per type:
  - **Country:** Bilateral Summary + Key Contacts + Engagements by Lifecycle Stage
  - **Organization:** Membership Structure + Key Representatives + MoU Status Tracker
  - **Topic:** Connected Anchors + Position Tracker (our stance vs counterpart stances)
  - **Working Group:** Member List with Roles + Meeting Schedule + Deliverables Tracker
  - **Person:** Metadata card (org affiliation, role, last engagement) + Engagement History (chronological)
  - **Forum:** Metadata card + Session info (from Phase 9 lifecycle)
  - **Elected Official:** Office/term card + Committee Memberships
- **D-10:** Simpler types (Forum, Working Group, Person) use a **metadata card + activity feed** pattern — compact, no empty enrichment sections. No filler cards.
- **D-11:** Position tracker (Topic, Country) and deliverables tracker (Working Group) live as **Overview cards** showing current state — not dedicated tabs. Summary-level, not full CRUD.

### Elected Officials Domain (DOSS-08)

- **D-12:** Database: **extend persons table** with a new `elected_official_metadata` table (1:1 relationship via `person_id` FK). Fields: `office_title`, `party`, `constituency`, `term_start`, `term_end`, `is_current_term`. Plus a new `committee_memberships` table: `person_id`, `committee_name`, `role` (member/chair/vice), `start_date`, `end_date`.
- **D-13:** Navigation: Elected Officials gets a **separate sidebar item** under the Dossiers group, same level as Countries, Organizations, etc. Route: `/dossiers/elected-officials/$id`.
- **D-14:** List page: **data table with office columns** — Name, Office/Title, Party, Constituency, Term Status (current/expired), Organization. Filterable by party, term status, organization.
- **D-15:** Detail page uses the shared DossierShell with extra "Committees" tab showing committee memberships with roles and dates.

### Claude's Discretion

- Loading skeletons per tab
- Empty states per tab
- Exact responsive breakpoints for card grid (2-col on md+, single col on mobile)
- Tab order within the bar
- Animation/transition for sidebar collapse
- DossierShell internal state management (sidebar open/closed persistence)

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Dependencies

- `.planning/phases/11-engagement-workspace/11-CONTEXT.md` — WorkspaceShell pattern, tab routing, mobile horizontal scroll tabs (D-10, D-11)
- `.planning/phases/08-navigation-route-consolidation/08-CONTEXT.md` — Sidebar group organization (D-01), route structure decisions, dossier-routes.ts helpers
- `.planning/phases/09-lifecycle-engine/09-CONTEXT.md` — Lifecycle stage enum, forum sessions, stage transitions

### Existing Components (to refactor/reuse)

- `frontend/src/components/dossier/DossierDetailLayout.tsx` — Current shared layout to refactor into DossierShell
- `frontend/src/components/workspace/WorkspaceShell.tsx` — Pattern reference for sticky header + tab nav + outlet
- `frontend/src/components/workspace/WorkspaceTabNav.tsx` — Tab navigation component pattern
- `frontend/src/components/dossier/MiniRelationshipGraph.tsx` — Existing relationship widget (replaced by RelationshipSidebar)
- `frontend/src/components/dossier/DossierOverview/sections/RelatedDossiersSection.tsx` — Related dossiers rendering
- `frontend/src/components/relationships/RelationshipNavigator.tsx` — Relationship navigation patterns
- `frontend/src/components/dossier/DossierSelector.tsx` — Reusable for quick-add search popover

### Type-Specific Detail Components (to integrate into new shell)

- `frontend/src/components/dossier/CountryDossierDetail.tsx`
- `frontend/src/components/dossier/OrganizationDossierDetail.tsx`
- `frontend/src/components/dossier/ForumDossierDetail.tsx`
- `frontend/src/components/dossier/TopicDossierDetail.tsx`
- `frontend/src/components/dossier/WorkingGroupDossierDetail.tsx`
- `frontend/src/components/dossier/PersonDossierDetail.tsx`
- `frontend/src/components/dossier/sections/ElectedOfficialProfile.tsx`

### Existing Hooks and Domains

- `frontend/src/domains/dossiers/hooks/useDossier.ts` — Single dossier data fetching
- `frontend/src/hooks/useDossierOverview.ts` — Overview data hook
- `frontend/src/hooks/useDossierActivityTimeline.ts` — Activity timeline data
- `frontend/src/hooks/useDossierPresence.ts` — Presence indicators
- `frontend/src/components/dossiers/DossierMoUsTab.tsx` — Existing MoU tab component
- `frontend/src/components/positions/DossierPositionsTab.tsx` — Existing positions tab

### Routing and Navigation

- `frontend/src/lib/dossier-routes.ts` — `getDossierRouteSegment`, `getDossierDetailPath` helpers
- `frontend/src/routes/_protected/dossiers/` — Existing dossier route tree (all 7 current types)

### Requirements

- `.planning/REQUIREMENTS.md` §Enriched Dossier Pages — DOSS-01 through DOSS-10

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `DossierDetailLayout.tsx`: Header, breadcrumbs, sidebar with MiniRelationshipGraph, AddToDossierMenu, ExportDossierDialog, presence indicators — all to be preserved in refactored DossierShell
- `WorkspaceShell.tsx` + `WorkspaceTabNav.tsx`: Proven pattern for sticky header + tab navigation + child outlet
- `DossierSelector.tsx`: Search-based dossier picker — reusable for RelationshipSidebar quick-add popover
- `RelatedDossiersSection.tsx`: Rendering pattern for grouped related dossiers
- `DossierMoUsTab.tsx`: Existing MoU tab — can be adapted for Organization's extra tab
- `DossierPositionsTab.tsx`: Existing positions tab — can be adapted for Country/Topic extra tabs
- `ElectedOfficialProfile.tsx`: Section component with some elected official rendering
- `useDossier`, `useDossierOverview`, `useDossierActivityTimeline`: TanStack Query hooks for dossier data
- `useDirection` hook + `LtrIsolate`: RTL/LTR handling pattern
- `useResponsive()`: Breakpoint detection for sidebar show/hide

### Established Patterns

- TanStack Router file-based routing with `createFileRoute` + `beforeLoad` guards
- Domain folder structure: `domains/{feature}/hooks/`, `repositories/`, `types/`
- Mobile-first Tailwind: base → sm → md → lg with min-h-11 touch targets
- RTL: `useDirection` hook + logical properties (ms-_, me-_, ps-_, pe-_)
- i18n: `useTranslation` with feature-specific namespaces

### Integration Points

- Route tree: New nested routes under `/dossiers/{type}/$id/` for each tab
- Sidebar: New "Elected Officials" item under Dossiers group in `navigation-config.ts`
- Database: New `elected_official_metadata` and `committee_memberships` tables via Supabase migration
- Backend: New API endpoints for elected officials CRUD and committee memberships

</code_context>

<specifics>
## Specific Ideas

- DossierShell should mirror WorkspaceShell's visual language (sticky header, backdrop-blur, same spacing) for consistency across workspace and dossier views
- Engagement dossier type continues using WorkspaceShell — DossierShell is for the other 7 types + Elected Officials
- Position tracker shows "our stance vs counterpart stances" as a compact comparison card, not a full spreadsheet
- Elected Officials list uses data table with office-specific columns and filters (party, term status, organization)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 12-enriched-dossier-pages_
_Context gathered: 2026-03-31_
