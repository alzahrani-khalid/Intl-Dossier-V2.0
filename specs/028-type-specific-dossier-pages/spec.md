# Feature Specification: Type-Specific Dossier Detail Pages

**Feature Branch**: `028-type-specific-dossier-pages`
**Created**: 2025-10-28
**Status**: Draft
**Input**: User description: "Each dossier type has it is own distinguished detailed page design .. meaning if the the dossier is a country the detail page should be different than viewing the engagement dossier, or person dossier and so on ... also the sidebar should only should \"Dossiers\" elemnts which takes you to the Dossiers Hub wherer all types can be navigated"

## Clarifications

### Session 2025-10-28

- Q: What is the primary visual differentiation method to distinguish dossier types? → A: Layout structure only (no color/typography differences) - relies on content arrangement for distinction
- Q: What is the preferred layout pattern for the Dossiers Hub? → A: Bento/masonry grid with varying card sizes based on dossier importance
- Q: Should type-specific sections on dossier detail pages be collapsible/expandable? → A: All sections start expanded, users can manually collapse any section (state persists per session)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Country Dossier with Geographic Context (Priority: P1)

As a **Country Analyst**, I need to view a country dossier with specialized geographic and diplomatic information so that I can quickly understand the country's profile, relationships, and engagement history in a format optimized for country-level analysis.

**Why this priority**: Country dossiers are the most common dossier type in the system and represent the foundation of diplomatic relationship tracking. This is the primary use case that demonstrates the value of type-specific designs.

**Independent Test**: Can be fully tested by navigating to any country dossier and verifying that it displays country-specific sections (geographic info, diplomatic relations map, bilateral agreements, key officials) that are not present in other dossier types. Delivers immediate value by showing relevant country data in an optimized layout.

**Acceptance Scenarios**:

1. **Given** I am logged in as a Country Analyst, **When** I navigate to a country dossier from the Dossiers Hub, **Then** I see a country-specific layout with geographic context, world map highlighting, diplomatic relations, and bilateral agreements sections
2. **Given** I am viewing a country dossier, **When** I scan the page layout, **Then** I can immediately distinguish it from other dossier types by its unique visual design and country-specific data sections
3. **Given** I am viewing a country dossier, **When** I look at the sidebar navigation, **Then** I only see the "Dossiers" menu item (not individual dossier type menus), which takes me to the Dossiers Hub

---

### User Story 2 - Access Unified Dossiers Hub (Priority: P1)

As **any user**, I need to access all dossier types from a central Dossiers Hub so that I have a single entry point for navigating between different types of dossiers (countries, organizations, persons, engagements, forums, working groups).

**Why this priority**: This is critical infrastructure that enables the entire feature. Without a unified hub, users cannot efficiently navigate between dossier types. This is P1 because it's required for all other user stories to function.

**Independent Test**: Can be fully tested by clicking the "Dossiers" sidebar menu item and verifying that it displays a hub page with visual cards or tiles for each dossier type (6 types total). Clicking any type card navigates to that type's list/search page. Delivers value by simplifying navigation and reducing sidebar clutter.

**Acceptance Scenarios**:

1. **Given** I am on any page in the application, **When** I click the "Dossiers" item in the sidebar, **Then** I am taken to the Dossiers Hub showing all 6 dossier types in a bento/masonry grid layout
2. **Given** I am viewing the Dossiers Hub, **When** I see the layout, **Then** I see P1 dossier types (Countries, Engagements) displayed in larger cards, P2 types (Persons) in medium cards, and P3 types (Organizations, Forums, Working Groups) in smaller cards
3. **Given** I am viewing the Dossiers Hub, **When** I click on the "Countries" card, **Then** I am navigated to the country dossiers list page
4. **Given** I am viewing the Dossiers Hub, **When** I look at each dossier type card, **Then** I see the dossier type name, icon, and count of dossiers of that type

---

### User Story 3 - View Engagement Dossier with Event Timeline (Priority: P2)

As an **Engagement Coordinator**, I need to view an engagement dossier with event-focused information and timeline so that I can track engagement activities, outcomes, and follow-up actions in a chronological format optimized for event management.

**Why this priority**: Engagement dossiers are the second most common type and have very different information needs compared to country dossiers. This demonstrates the value of specialized layouts for operational tracking versus strategic analysis.

**Independent Test**: Can be fully tested by navigating to any engagement dossier and verifying it displays engagement-specific sections (event timeline, participants list, outcomes, follow-up actions, after-action reports) that differ from country or person views. Delivers value by presenting engagement data in a task-oriented format.

**Acceptance Scenarios**:

1. **Given** I am viewing an engagement dossier, **When** I see the page layout, **Then** I see a prominent event timeline, participants section, outcomes summary, and follow-up actions list
2. **Given** I am viewing an engagement dossier, **When** I compare it visually to a country dossier, **Then** I can immediately distinguish the two by their different layouts and data emphasis
3. **Given** I am viewing an engagement dossier, **When** I scroll through the page, **Then** I see engagement-specific visualizations (timeline, participant network) not present in other dossier types

---

### User Story 4 - View Person Dossier with Professional Profile (Priority: P2)

As a **Protocol Officer**, I need to view a person dossier with biographical and professional information so that I can prepare briefings and understand an individual's role, background, and interaction history in a format optimized for person-level tracking.

**Why this priority**: Person dossiers require a completely different information architecture focused on individual profiles versus organizational or geographic entities. This is P2 because it's less frequently accessed than country/engagement dossiers but still critical for diplomatic protocol.

**Independent Test**: Can be fully tested by navigating to any person dossier and verifying it displays person-specific sections (photo, biographical info, positions held, organization affiliations, interaction history) that are unique to individuals. Delivers value by presenting personal information in a professional profile format.

**Acceptance Scenarios**:

1. **Given** I am viewing a person dossier, **When** I see the page layout, **Then** I see a professional profile format with photo, biographical details, current/past positions, organization affiliations, and interaction timeline
2. **Given** I am viewing a person dossier, **When** I compare it to other dossier types, **Then** the layout emphasizes individual identity and professional relationships rather than geographic or event data
3. **Given** I am viewing a person dossier, **When** I look at the data sections, **Then** I see person-specific fields (birth date, nationality, education, languages) not present in organizational dossiers

---

### User Story 5 - View Organization Dossier with Hierarchical Structure (Priority: P3)

As a **Relationship Manager**, I need to view an organization dossier with institutional information and hierarchy so that I can understand the organization's structure, key contacts, and relationship history in a format optimized for institutional tracking.

**Why this priority**: Organization dossiers are important for institutional relationship management but accessed less frequently than country/engagement/person dossiers. This is P3 because it can be delivered after the more critical dossier types are implemented.

**Independent Test**: Can be fully tested by navigating to any organization dossier and verifying it displays organization-specific sections (org chart, key contacts, institutional profile, memoranda of understanding) that differ from other entity types. Delivers value by presenting organizational data in a hierarchical, institutional format.

**Acceptance Scenarios**:

1. **Given** I am viewing an organization dossier, **When** I see the page layout, **Then** I see organizational hierarchy, institutional profile, key contacts, active MoUs, and engagement history sections
2. **Given** I am viewing an organization dossier, **When** I compare it to a person dossier, **Then** the layout emphasizes institutional structure and formal relationships rather than individual profiles
3. **Given** I am viewing an organization dossier, **When** I look at the visualizations, **Then** I see org charts and institutional relationship graphs specific to organizational entities

---

### User Story 6 - View Forum/Working Group Dossier with Collaboration Focus (Priority: P3)

As a **Forum Administrator**, I need to view a forum or working group dossier with collaborative information so that I can track membership, meetings, deliverables, and outcomes in a format optimized for multi-party collaboration tracking.

**Why this priority**: Forums and working groups have the most specialized and least common use case. This is P3 because they can leverage patterns from other dossier types and are accessed by fewer users.

**Independent Test**: Can be fully tested by navigating to any forum/working group dossier and verifying it displays collaboration-specific sections (member list, meeting schedule, deliverables tracker, decision log) that are unique to multi-party forums. Delivers value by presenting collaborative activities in a project-management format.

**Acceptance Scenarios**:

1. **Given** I am viewing a forum/working group dossier, **When** I see the page layout, **Then** I see member organizations, meeting schedule, deliverables tracker, and decision/outcome logs
2. **Given** I am viewing a forum dossier, **When** I compare it to other dossier types, **Then** the layout emphasizes collaborative activities and multi-party coordination rather than bilateral relationships
3. **Given** I am viewing a working group dossier, **When** I look at the data sections, **Then** I see project-style tracking (milestones, deliverables, action items) specific to collaborative workstreams

---

### Edge Cases

- What happens when a dossier has minimal data for its type-specific sections (e.g., a country dossier with no diplomatic relations yet)?
  - System should display empty state messages in type-specific sections, guiding users to add relevant data

- How does the system handle navigation when a user bookmarks a specific dossier detail page?
  - Direct URLs to dossier detail pages should still work and display the correct type-specific layout, with the sidebar "Dossiers" item remaining as the navigation entry point

- What happens when viewing dossiers on mobile devices with limited screen space?
  - Type-specific sections should stack vertically in priority order; all sections start expanded with collapse/expand controls available (collapse state persists per session to allow users to customize their view)

- How does the system handle transitioning between different dossier types?
  - Navigation from one dossier type to another should go through the Dossiers Hub, or directly via links/search results, with clear visual transitions indicating the change in dossier type

- What happens when a user has permission to view only certain dossier types?
  - Dossiers Hub should only display cards for dossier types the user has permission to access, with disabled/hidden cards for restricted types

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a distinct page layout for each of the 6 dossier types: Country, Organization, Person, Engagement, Forum, and Working Group
- **FR-002**: System MUST display type-specific data sections for each dossier type (e.g., geographic context for countries, event timeline for engagements, biographical profile for persons)
- **FR-003**: System MUST provide a unified Dossiers Hub accessible via a single "Dossiers" sidebar menu item
- **FR-004**: Dossiers Hub MUST display visual cards in a bento/masonry grid layout with varying card sizes based on dossier type importance (P1 types larger, P3 types smaller), showing type name, icon, and count for each
- **FR-005**: System MUST allow navigation from Dossiers Hub to each dossier type's list/search page
- **FR-006**: System MUST allow direct navigation to individual dossier detail pages from search results, links, and lists
- **FR-007**: System MUST maintain consistent navigation structure (sidebar with "Dossiers" item) across all dossier detail pages
- **FR-008**: Country dossier pages MUST display: geographic context, world map highlighting, diplomatic relations, bilateral agreements, and key officials sections
- **FR-009**: Engagement dossier pages MUST display: event timeline, participants list, outcomes summary, follow-up actions, and after-action reports sections
- **FR-010**: Person dossier pages MUST display: professional profile with photo, biographical details, positions held, organization affiliations, and interaction history sections
- **FR-011**: Organization dossier pages MUST display: organizational hierarchy, institutional profile, key contacts, active MoUs, and engagement history sections
- **FR-012**: Forum/Working Group dossier pages MUST display: member organizations, meeting schedule, deliverables tracker, and decision logs sections
- **FR-013**: System MUST provide visual differentiation between dossier types through distinct layout structures and content arrangement (maintaining consistent color scheme and typography across all types) to enable immediate recognition
- **FR-014**: System MUST display empty state messages for type-specific sections that have no data yet, with guidance on adding content
- **FR-015**: System MUST support mobile-first responsive design for all type-specific layouts, with sections stacking vertically on smaller screens; all sections MUST start expanded by default with manual collapse/expand controls available, preserving collapse state per session
- **FR-016**: System MUST support RTL (right-to-left) layout for Arabic language using logical properties for all type-specific page designs
- **FR-017**: System MUST preserve existing deep-linking and bookmarking functionality for direct access to dossier detail pages
- **FR-018**: System MUST maintain consistent header/breadcrumb navigation showing dossier type and name across all detail pages

### Key Entities

- **Dossier Types**: The 6 entity types that require distinct detail page layouts: Country, Organization, Person, Engagement, Forum, Working Group. Each type has unique data requirements and user workflows.
- **Dossiers Hub**: A central navigation page that serves as the entry point for all dossier types, displaying type cards with icons, names, and counts.
- **Type-Specific Sections**: Unique data sections and visualizations tailored to each dossier type (e.g., world map for countries, timeline for engagements, org chart for organizations).
- **Sidebar Navigation**: The main application navigation menu, which will be simplified to show only a "Dossiers" item instead of separate menu items for each dossier type.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can distinguish between different dossier types within 2 seconds of viewing a detail page based on visual design and layout differences
- **SC-002**: Users can navigate from any page to the Dossiers Hub and then to a specific dossier type's list in under 5 seconds (average)
- **SC-003**: 90% of users successfully identify the correct type-specific sections for their dossier type on first viewing (measured through user testing)
- **SC-004**: All 6 dossier types display their type-specific layouts correctly on mobile devices (320px width) without horizontal scrolling
- **SC-005**: All type-specific layouts render correctly in both LTR (English) and RTL (Arabic) modes without layout breaks
- **SC-006**: Sidebar navigation displays only "Dossiers" menu item (no individual type menus), reducing sidebar clutter by at least 5 menu items
- **SC-007**: Dossiers Hub loads and displays all 6 type cards with accurate counts in under 2 seconds
- **SC-008**: 80% of users prefer the new type-specific layouts over the previous universal layout (measured through user feedback surveys)
- **SC-009**: Navigation task completion time from "find specific dossier type" reduces by 30% compared to previous navigation structure
- **SC-010**: Zero layout rendering errors or broken designs reported for type-specific pages within first month of release

## Assumptions

1. **Existing Data Structure**: We assume the existing database schema already distinguishes between dossier types and stores type-specific data (this was established in feature 026-unified-dossier-architecture)

2. **Component Reusability**: We assume common components (header, footer, sidebar, breadcrumbs) can be reused across all type-specific layouts, with only the main content area requiring type-specific implementations

3. **User Permissions**: We assume the existing permission system can filter dossier types at the Hub level, so users only see cards for types they can access

4. **Icons and Visual Assets**: We assume icon assets for the 6 dossier types either exist or can be sourced from the existing icon library (e.g., Lucide, Hero Icons)

5. **Mobile-First Approach**: We assume all new layouts will follow the project's existing mobile-first design principles with Tailwind breakpoints (base → sm → md → lg → xl)

6. **Internationalization**: We assume the existing i18next setup supports all labels and text for type-specific sections in both English and Arabic

7. **Router Configuration**: We assume the existing TanStack Router configuration can support the new Dossiers Hub route and type-specific detail routes without major refactoring

8. **Data Fetching**: We assume TanStack Query hooks can fetch type-specific data efficiently, with appropriate caching and loading states

9. **Performance Budget**: We assume type-specific layouts should render within the same performance budget as existing pages (< 3 seconds for initial paint)

10. **Design System**: We assume the project's existing design system (shadcn/ui, Aceternity UI) provides sufficient components for building type-specific layouts without requiring new third-party component libraries

## Out of Scope

1. **Dossier Type Creation/Management**: Creating new dossier types or modifying which entity types qualify as "dossiers" is out of scope. We are working with the fixed set of 6 types.

2. **Data Migration**: Migrating or restructuring existing dossier data to support type-specific fields is out of scope. We assume the data schema is already in place.

3. **Bulk Editing**: Providing bulk editing capabilities across multiple dossiers of the same type is out of scope for this feature.

4. **Advanced Filtering in Hub**: Complex filtering, sorting, or search capabilities within the Dossiers Hub are out of scope. The Hub is a navigation tool, not a search interface.

5. **Customizable Layouts**: Allowing users to customize or rearrange type-specific sections is out of scope. Layouts are fixed per dossier type.

6. **Type-Specific Workflows**: Implementing specialized workflows or state machines for each dossier type (e.g., approval flows) is out of scope. This feature focuses on display/presentation only.

7. **Export Functionality**: Type-specific export formats or report generation is out of scope for this feature.

8. **Comparison Views**: Allowing side-by-side comparison of multiple dossiers or comparison across different types is out of scope.

9. **Historical Versioning UI**: Displaying historical versions or changes to type-specific sections is out of scope (though underlying versioning may exist).

10. **Third-Party Integrations**: Integrating external data sources or APIs to populate type-specific sections is out of scope.

## Dependencies

1. **Feature 026-unified-dossier-architecture**: This feature depends on the unified dossier architecture that established the 6 dossier types and their underlying data models.

2. **Existing Router Configuration**: Requires TanStack Router v5 to be properly configured for adding new routes (Dossiers Hub and type-specific detail routes).

3. **Design System Components**: Depends on existing UI component libraries (shadcn/ui, Aceternity UI) being available and properly configured.

4. **i18next Translations**: Requires i18next to be configured with translation keys for all type-specific section labels and content.

5. **Supabase Data Access**: Depends on Supabase RLS policies and API access being properly configured to fetch type-specific data.

6. **User Authentication**: Requires existing authentication system to be functional for permission-based filtering in Dossiers Hub.

7. **Mobile-First Styles**: Depends on Tailwind CSS configuration with logical properties and breakpoints already established in the project.

8. **Icon Library**: Depends on availability of appropriate icons for each dossier type (countries, organizations, persons, engagements, forums, working groups).
