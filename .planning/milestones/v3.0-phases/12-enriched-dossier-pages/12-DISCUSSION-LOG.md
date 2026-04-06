# Phase 12: Enriched Dossier Pages - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 12-enriched-dossier-pages
**Areas discussed:** Shared Shell Architecture, RelationshipSidebar Design, Tier-Specific Enrichments, Elected Officials Domain

---

## Shared Shell Architecture

### Q1: How should the new DossierShell relate to the existing DossierDetailLayout?

| Option                                     | Description                                                                                                                    | Selected |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | -------- |
| Refactor DossierDetailLayout (Recommended) | Evolve existing into DossierShell mirroring WorkspaceShell pattern. Preserves existing features while adding tabs and sidebar. | ✓        |
| New DossierShell component                 | Build from scratch, deprecate DossierDetailLayout. Clean break but more work.                                                  |          |
| Shared base, both coexist                  | Extract shared primitives, let both components use them. More flexible but adds abstraction.                                   |          |

**User's choice:** Refactor DossierDetailLayout
**Notes:** Preserves presence indicators, export, AddToDossier while gaining tabs and sidebar.

### Q2: Should dossier detail tabs use URL-driven routing or client-side state?

| Option                        | Description                                                                        | Selected |
| ----------------------------- | ---------------------------------------------------------------------------------- | -------- |
| URL-driven tabs (Recommended) | Each tab is a route: /dossiers/countries/$id/overview, /tasks, etc. Deep-linkable. | ✓        |
| Client-side tab state         | Single route with useState. Simpler but no deep-linking.                           |          |
| Search param hybrid           | Single route with ?tab=overview. Lighter than full routes.                         |          |

**User's choice:** URL-driven tabs
**Notes:** Matches WorkspaceShell pattern from Phase 11.

### Q3: Should the tab set be identical across all 8 types or allow extras?

| Option                                      | Description                                                                                                 | Selected |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------- |
| Shared base + optional extras (Recommended) | All get Overview, Engagements, Docs, Tasks, Timeline, Audit. Some get extras (Positions, MoUs, Committees). | ✓        |
| Strict identical tabs                       | Same 6 tabs for all. Tier-specific only in Overview.                                                        |          |
| Fully custom per type                       | Each type defines own tab set. Max flexibility, less consistency.                                           |          |

**User's choice:** Shared base + optional extras
**Notes:** Country + Positions, Organization + MoUs, Topic + Positions, Elected Officials + Committees.

---

## RelationshipSidebar Design

### Q1: How should the RelationshipSidebar collapse/expand on desktop?

| Option                             | Description                                                                        | Selected |
| ---------------------------------- | ---------------------------------------------------------------------------------- | -------- |
| Icon-toggle collapse (Recommended) | Button toggles between full ~280px panel and collapsed icon strip. No drag resize. | ✓        |
| Resizable drag panel               | react-resizable-panels for draggable divider. More flexible but heavier.           |          |
| Always visible, no collapse        | Fixed at ~280px on lg+, hidden below. Simplest but no user control.                |          |

**User's choice:** Icon-toggle collapse
**Notes:** Reuses existing PanelRightClose/PanelRightOpen icons from DossierDetailLayout.

### Q2: How should the RelationshipSidebar appear on mobile?

| Option                     | Description                                                         | Selected |
| -------------------------- | ------------------------------------------------------------------- | -------- |
| Bottom sheet (Recommended) | Button in header opens half-screen bottom sheet. Draggable to full. | ✓        |
| Slide-in from end          | Side drawer sliding in from end. Full height overlay.               |          |
| Inline accordion           | Collapses into accordion within tab content. No separate trigger.   |          |

**User's choice:** Bottom sheet
**Notes:** Matches mobile-first patterns.

### Q3: What should quick-add do?

| Option                       | Description                                                                    | Selected |
| ---------------------------- | ------------------------------------------------------------------------------ | -------- |
| Search popover (Recommended) | Popover with search input filtering existing dossiers. Reuses DossierSelector. | ✓        |
| Dialog with form             | Full dialog with search + relationship type + notes. Heavier interaction.      |          |
| Inline add row               | Inline text input at bottom of tier group. Lightest but limited.               |          |

**User's choice:** Search popover
**Notes:** Tier can be set during linking.

---

## Tier-Specific Enrichments

### Q1: How should the Overview tab be structured?

| Option                           | Description                                                                | Selected |
| -------------------------------- | -------------------------------------------------------------------------- | -------- |
| Card grid sections (Recommended) | Responsive grid. Shared + type-specific cards. Each card is own component. | ✓        |
| Vertical sections                | Single column full-width stacked sections. Simple but long scroll.         |          |
| Tabbed sub-sections              | Internal tabs within Overview. Tabs-within-tabs, confusing.                |          |

**User's choice:** Card grid sections
**Notes:** Country gets Bilateral Summary + Key Contacts; Org gets Membership + MoU Status.

### Q2: What should simpler types show in Overview?

| Option                                 | Description                                                                 | Selected |
| -------------------------------------- | --------------------------------------------------------------------------- | -------- |
| Metadata card + activity (Recommended) | Compact metadata card + recent activity feed. No empty enrichment sections. | ✓        |
| Same card grid, fewer cards            | Same layout with fewer cards. Consistent structure.                         |          |
| You decide                             | Claude's discretion.                                                        |          |

**User's choice:** Metadata card + activity
**Notes:** Clean and purposeful for Forum, Working Group, Person.

### Q3: Position tracker and deliverables tracker — Overview or dedicated tab?

| Option                       | Description                                                         | Selected |
| ---------------------------- | ------------------------------------------------------------------- | -------- |
| Overview cards (Recommended) | Summary-level cards in Overview. Show current state, not full CRUD. | ✓        |
| Dedicated Positions tab      | Full position management in separate tab.                           |          |
| Both — summary + tab         | Overview summary + dedicated tab. Different depth levels.           |          |

**User's choice:** Overview cards
**Notes:** Summary-level, not full CRUD.

---

## Elected Officials Domain

### Q1: How should Elected Officials relate to Persons in the database?

| Option                                        | Description                                                                       | Selected |
| --------------------------------------------- | --------------------------------------------------------------------------------- | -------- |
| Extend persons + metadata table (Recommended) | 1:1 elected_official_metadata table on persons. Plus committee_memberships table. | ✓        |
| Separate elected_officials table              | Standalone table. Simpler queries but duplicates person infra.                    |          |
| Union view over persons                       | DB view joining person + metadata. Best of both but adds view complexity.         |          |

**User's choice:** Extend persons + metadata table
**Notes:** Avoids duplicating person fields. 'elected_official' dossier type flag distinguishes them.

### Q2: Where should Elected Officials appear in the sidebar?

| Option                              | Description                                                            | Selected |
| ----------------------------------- | ---------------------------------------------------------------------- | -------- |
| Separate sidebar item (Recommended) | Own item under Dossiers group. Route: /dossiers/elected-officials/$id. | ✓        |
| Sub-item under Persons              | Nested under Persons as filter. Implies subset, not peer.              |          |
| You decide                          | Claude's discretion.                                                   |          |

**User's choice:** Separate sidebar item
**Notes:** Matches '8 types are peers' architecture.

### Q3: What should the list page show?

| Option                                  | Description                                                                  | Selected |
| --------------------------------------- | ---------------------------------------------------------------------------- | -------- |
| Table with office columns (Recommended) | Data table: Name, Office, Party, Constituency, Term Status, Org. Filterable. | ✓        |
| Card grid                               | Grid of cards with avatar, name, office, term badge. More visual.            |          |
| You decide                              | Claude's discretion.                                                         |          |

**User's choice:** Table with office columns
**Notes:** Filterable by party, term status, organization.

---

## Claude's Discretion

- Loading skeletons per tab
- Empty states per tab
- Card grid responsive breakpoints
- Tab order within the bar
- Sidebar collapse animation
- DossierShell internal state management

## Deferred Ideas

None — discussion stayed within phase scope
