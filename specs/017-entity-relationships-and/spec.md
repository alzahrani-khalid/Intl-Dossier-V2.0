# Feature Specification: Entity Relationships & UI/UX Redesign

**Feature Branch**: `017-entity-relationships-and`
**Created**: 2025-10-07
**Status**: Draft
**Input**: User description: "Complete entity relationship model redesign with dossiers as central hub, implementing dossier-to-dossier relationships, polymorphic document management, many-to-many position linking, unified calendar system, and work-queue-first navigation"

## Execution Flow (main)
```
1. Parse user description from Input
   → Feature description parsed successfully
2. Extract key concepts from description
   → Identified: Central hub architecture, relationship management, document storage, calendar unification, navigation redesign
3. For each unclear aspect:
   → No critical clarifications needed - comprehensive design document provided
4. Fill User Scenarios & Testing section
   → Multiple user journeys defined across different personas
5. Generate Functional Requirements
   → Requirements extracted from design decisions and user journeys
6. Identify Key Entities (if data involved)
   → 8 tiers of entities identified with clear relationships
7. Run Review Checklist
   → Spec focuses on WHAT and WHY, not implementation HOW
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
**As a** Country Analyst managing international relationships,
**I want** to navigate seamlessly between related dossiers, work items, and documents,
**So that** I can maintain a comprehensive view of all relationships and activities without losing context.

### Acceptance Scenarios

#### Scenario 1: Country Analyst Managing Relationships
1. **Given** I am viewing the Saudi Arabia country dossier
   **When** I click on the Relationships tab
   **Then** I see a network graph showing connections to World Bank, IMF, G20, OPEC, and WTO dossiers
   **And** I can click any connected dossier to navigate directly to it
   **And** the relationship type and strength are clearly indicated

2. **Given** I am viewing a related organization dossier (e.g., World Bank)
   **When** I look at shared engagements
   **Then** I see all meetings that involve both Saudi Arabia and World Bank
   **And** I can navigate back to the Saudi Arabia dossier in 2 clicks or less

#### Scenario 2: Intake Officer Processing Requests
1. **Given** I receive a new request for data sharing agreement with UK
   **When** AI triage suggests it's an MoU for the United Kingdom dossier
   **Then** I can review the classification and confirm or override
   **And** upon conversion, the MoU is automatically linked to the UK dossier
   **And** the work item is auto-assigned to staff with legal review skills

2. **Given** a ticket is successfully converted to an MoU
   **When** I navigate to the UK dossier
   **Then** I see the new MoU listed in the MoUs tab
   **And** the timeline shows the creation event

#### Scenario 3: Policy Officer Creating Multi-Dossier Position
1. **Given** I am drafting a general data privacy position
   **When** I select to link it to all EU country dossiers, OECD, and Data Protection Forum
   **Then** the position appears in the Positions tab of all selected dossiers
   **And** when creating an engagement with any EU country, this position is suggested for attachment

2. **Given** I update a multi-dossier position
   **When** the changes are saved
   **Then** all linked dossiers reflect the updated content
   **And** users viewing any linked dossier see the latest version

#### Scenario 4: Staff Member Working on Assignments
1. **Given** I have multiple assignments in my queue
   **When** I view my assignments kanban board
   **Then** I see cards organized by status (Assigned, In Progress, Under Review)
   **And** each card shows the parent dossier context
   **And** SLA countdown is visible with color-coded urgency (green, yellow, red)

2. **Given** an assignment is nearing its SLA deadline
   **When** I view my assignments
   **Then** the card is highlighted in red with time remaining
   **And** the assignment appears at the top of its status column

#### Scenario 5: Creating Calendar Events
1. **Given** I need to schedule an event
   **When** I click "Create Event"
   **Then** I am asked whether this is an engagement with external parties
   **And** if YES, I am required to link to a dossier
   **And** if NO, dossier linking is optional

2. **Given** I create an engagement (external event)
   **When** the engagement is saved
   **Then** it appears in the calendar with blue color coding
   **And** it appears in the linked dossier's Engagements tab
   **And** it appears in the dossier's timeline
   **And** an after-action template is automatically created

3. **Given** I create an internal calendar entry
   **When** the entry is saved
   **Then** it appears in the calendar with green color coding
   **And** if linked to a dossier, it appears in that dossier's timeline

### Edge Cases
- **What happens when** a dossier is archived while it has active relationships?
  → Related dossiers show the relationship as "archived" but maintain the link for historical context

- **What happens when** a position is deleted that's linked to multiple dossiers?
  → System warns user of all impacted dossiers and requires confirmation

- **What happens when** a user tries to create a circular dossier relationship?
  → System prevents self-referencing relationships and validates against circular dependencies

- **What happens when** an engagement is rescheduled via calendar drag-and-drop?
  → Engagement date updates, affected dossier timelines update, and participants receive notifications

- **What happens when** a document is uploaded to an entity that gets deleted?
  → Documents are soft-deleted with the entity, preservable for audit/compliance

- **How does system handle** searching for documents across multiple entity types?
  → Polymorphic document search returns results from all entity types with clear source indication

- **How does system handle** concurrent updates to dossier relationships?
  → Optimistic locking prevents conflicts; users are notified of concurrent changes

## Requirements *(mandatory)*

### Functional Requirements

#### Central Hub Architecture
- **FR-001**: System MUST provide dossiers as the central container for all international relationship management activities
- **FR-002**: Each dossier MUST link to exactly one reference entity (country, organization, forum) via reference_id OR have reference_type='theme' with reference_id=NULL for thematic dossiers
- **FR-003**: System MUST support four dossier types: Country, Organization, Forum, and Theme
- **FR-004**: Users MUST be able to view all child entities (engagements, positions, MoUs, briefs, intelligence signals, contacts, commitments) from a single dossier view

#### Dossier-to-Dossier Relationships
- **FR-005**: System MUST allow creating relationships between any two dossiers
- **FR-006**: System MUST support relationship types: "member_of", "participates_in", "collaborates_with", "monitors", "is_member", "hosts"
- **FR-007**: System MUST allow specifying relationship strength: primary, secondary, observer
- **FR-007a**: System MUST support relationship status: active, archived
- **FR-008**: System MUST prevent self-referencing dossier relationships (a dossier cannot relate to itself)
- **FR-009**: Users MUST be able to visualize dossier relationships as a network graph
- **FR-010**: Users MUST be able to navigate between any related entities (dossiers, work items, or breadcrumb parents) in 2 clicks or less

#### Polymorphic Document Management
- **FR-011**: System MUST store all documents in a unified table regardless of parent entity type
- **FR-012**: Documents MUST support linking to: dossiers, engagements, positions, MoUs, after actions, tickets, assignments, intelligence signals, commitments
- **FR-013**: System MUST enforce file size limit of 100MB per document
- **FR-014**: System MUST support document versioning with supersedes relationships
- **FR-014a**: Users MUST be able to compare document versions side-by-side
- **FR-015**: System MUST scan uploaded documents for viruses/malware using ClamAV antivirus engine
- **FR-015a**: System MUST quarantine documents with scan_status='infected' and prevent download
- **FR-016**: Documents MUST have sensitivity levels: public, internal, confidential, secret
- **FR-017**: Users MUST be able to search across all documents regardless of parent entity type

#### Position-Dossier Linking (Many-to-Many)
- **FR-018**: Positions MUST support linking to zero, one, or multiple dossiers
- **FR-019**: Standalone positions (zero dossier links) MUST be available organization-wide
- **FR-020**: System MUST allow designating one dossier link as "primary" with others as "related" or "reference"
- **FR-021**: When a position is linked to multiple dossiers, it MUST appear in each dossier's Positions tab
- **FR-021a**: System MUST warn users before deleting a position that is linked to multiple dossiers, showing a list of all N affected dossiers and requiring explicit confirmation
- **FR-022**: Positions MUST be attachable to specific engagements as talking points
- **FR-023**: System MUST suggest relevant positions when creating engagements based on dossier linkage

#### Unified Calendar System
- **FR-024**: System MUST provide a unified calendar view aggregating: engagements, standalone calendar entries, assignment deadlines, approval deadlines
- **FR-025**: Users MUST be asked whether an event is an "engagement with external parties" before creation
- **FR-026**: Engagements (external events) MUST require dossier linkage
- **FR-027**: Calendar entries (internal events) MUST allow optional dossier linkage
- **FR-028**: Calendar MUST use color coding with WCAG AA contrast ratio ≥4.5:1: blue (engagements), green (internal meetings), red (SLA deadlines), yellow (approval deadlines)
- **FR-029**: Users MUST be able to filter calendar by: event type, dossier, assignee, date range, status
- **FR-030**: Users MUST be able to drag-and-drop events to reschedule them
- **FR-031**: Engagements MUST automatically create an after-action template upon creation

#### Work-Queue-First Navigation
- **FR-032**: Primary navigation MUST prioritize active work items over browsing
- **FR-033**: "My Work" section MUST appear first in navigation with: My Assignments, Intake Queue, Waiting Queue
- **FR-034**: Navigation items MUST display badge counts for pending items
- **FR-035**: Assignment cards in "My Assignments" MUST show SLA countdown with color-coded urgency
- **FR-036**: System MUST provide Kanban board view for assignments with columns: Assigned, In Progress, Under Review, Completed
- **FR-037**: System MUST provide table view as alternative to Kanban board
- **FR-038**: Users MUST be able to drag-and-drop assignments between Kanban columns to change status

#### Context & Breadcrumbs
- **FR-039**: Every page MUST display breadcrumb navigation showing hierarchical context
- **FR-040**: Breadcrumbs MUST show dossier context even when viewing standalone items
- **FR-041**: Work items (assignments, positions, after actions) MUST always display their parent dossier
- **FR-042**: Users MUST be able to navigate to parent entities by clicking breadcrumb segments (consolidated with FR-010)
- **FR-043**: Assignment context widget MUST show: work item type, parent dossier, SLA deadline, assignee

#### Relationship Visualization
- **FR-044**: System MUST provide interactive network graph visualization of dossier relationships
- **FR-045**: Graph nodes MUST be clickable to navigate to the corresponding dossier
- **FR-046**: Graph nodes MUST show preview information on hover
- **FR-047**: Users MUST be able to filter graph by relationship type (member_of, participates_in, collaborates_with, monitors, is_member, hosts)
- **FR-048**: Users MUST be able to zoom and pan the relationship graph with accessible controls

#### Timeline & Activity Feeds
- **FR-049**: Each dossier MUST have a timeline showing all related activities
- **FR-050**: Timeline MUST aggregate events from: status changes, assignments, comments, attachments, relationships, approvals, escalations
- **FR-051**: Timeline MUST support real-time updates when new events occur
- **FR-052**: Users MUST be able to filter timeline by event type

#### Reference Data Management
- **FR-053**: System MUST maintain master tables for: countries (193 countries), organizations (major international orgs), forums (G20, UN forums, etc.)
- **FR-054**: Countries MUST include: ISO codes, bilingual names, region, capital, population, GDP, membership status
- **FR-055**: Organizations MUST include: acronym, bilingual names, org type, headquarters, partnership status
- **FR-056**: Forums MUST include: bilingual names, forum type, frequency, next meeting date, participation status

#### MoU Management
- **FR-057**: Each MoU MUST link to exactly one dossier
- **FR-058**: MoUs MUST support multiple parties (signatories) from countries or organizations
- **FR-059**: MoUs MUST track dates: signed, effective, expiry, renewal required by
- **FR-060**: System MUST alert users 90 days before MoU renewal deadlines via daily scheduled job and in-app notifications
- **FR-060a**: MoU renewal alerts MUST appear in user's notification center and optionally via email
- **FR-061**: MoUs MUST have status: pending, active, expired, cancelled, renewed

#### Intelligence Signals
- **FR-062**: Intelligence signals MUST link to exactly one dossier
- **FR-063**: Signals MUST have types: news, report, rumor, tip, analysis, alert
- **FR-064**: System MUST track source reliability on 1-5 scale
- **FR-065**: Signals MUST have confidence levels: confirmed, probable, possible, unconfirmed
- **FR-066**: Users with appropriate permissions MUST be able to validate signals through an approval workflow that upgrades confidence level (possible→probable→confirmed)

#### Search & Discovery
- **FR-067**: Users MUST be able to search across all entity types from a global search bar (integrating with feature 015-search-retrieval-spec)
- **FR-067a**: Global search MUST include dossiers, positions, engagements, MoUs, intelligence signals, after actions, and documents
- **FR-068**: Search results MUST show relationship context including parent dossier, dossier type (Country/Organization/Forum/Theme), and relationship chain
- **FR-068a**: Search results MUST highlight relationship paths (e.g., "Position from USA Dossier → linked to World Bank Dossier")
- **FR-069**: Users MUST have access to Cmd+K (or Ctrl+K on Windows) quick-switcher for rapid entity navigation with typeahead search

### Key Entities

#### Tier 1: Reference Data
- **Countries**: Geographic entities with ISO codes, bilingual names, demographic/economic data, GASTAT membership status
- **Organizations**: International organizations with acronyms, bilingual names, classification, headquarters, partnership status with GASTAT
- **Forums**: International forums/summits with bilingual names, classification, frequency, meeting schedules, GASTAT participation status
- **Skills**: Staff competencies for assignment routing
- **Organizational Units**: Hierarchical departments within GASTAT with WIP limits

#### Tier 2: Core Hub
- **Dossiers**: Central containers linking to reference entities, supporting relationships to other dossiers, containing all work products

#### Tier 3: Intake & Routing
- **Tickets**: Front-door intake requests that convert to work products and link to dossiers

#### Tier 4: Work Products
- **Engagements**: External meetings/consultations linked to dossiers with after-action documentation
- **Positions**: Organizational stances with many-to-many dossier relationships
- **MoUs**: Formal agreements linked to dossiers with multiple parties
- **Briefs**: Executive summaries generated from dossier data

#### Tier 5: Post-Work
- **After Action Records**: Post-engagement documentation with decisions, commitments, risks, follow-ups

#### Tier 6: Work Management
- **Assignments**: Polymorphic work item routing to staff with SLA tracking
- **Assignment Queue**: Priority queue for work awaiting capacity

#### Tier 7: Knowledge
- **Intelligence Signals**: Knowledge items (news, reports, analysis) linked to dossiers
- **Documents**: Polymorphic file storage linked to any entity type
- **Calendar Entries**: Standalone events optionally linked to dossiers

#### Tier 8: System
- **Users & Staff Profiles**: Authentication and staff metadata
- **Audit Logs**: Security and compliance trail
- **Notifications**: In-app and email notifications
- **Search**: Full-text and semantic search across entities

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked (none critical)
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---

## Success Metrics

### Functional Metrics
- All entities have clear parent-child relationships visible in UI
- Users can navigate from any entity to its dossier in ≤2 clicks
- Assignment context always shows originating dossier
- Search results show relationship context
- Timeline aggregates activities across all related entities
- No orphaned entities (everything links to a dossier or is standalone by design)

### UX Metrics
- Reduction in "lost context" support tickets by 80%
- Average time to find related entities: <30 seconds
- User satisfaction score (NPS): ≥8/10
- SLA compliance rate: ≥95% (with proper assignment context)
