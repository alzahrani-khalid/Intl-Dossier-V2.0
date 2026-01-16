# Feature Specification: Smart Dossier Context Inheritance

**Feature Branch**: `035-dossier-context`
**Created**: 2025-01-16
**Status**: Draft
**Input**: User description: "Smart Dossier Context Inheritance: Ensure all activities connect to dossiers through smart context inheritance, avoiding redundant selection and enabling a comprehensive dossier activity view. The dossier is the central knowledge hub - all related activities should be visible from it."

## Overview

Dossiers are the central knowledge hubs of the organization. All activities (tasks, commitments, intake requests, engagements) should connect to dossiers through smart context inheritance. When users create work items from pages that are already linked to a dossier (e.g., creating a task from an engagement page), the system should automatically inherit the dossier context without requiring redundant selection.

**Core Principles**:

1. **Inherit context, don't re-ask**: If creating from something linked to a dossier, inherit automatically
2. **Only ask when truly orphaned**: Dossier picker appears only when no context chain exists
3. **Display inherited context**: Show users which dossier(s) are linked and how
4. **Dossier as the hub**: All activities visible from dossier timeline/activity view

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Create Task from Dossier Page (Priority: P1)

A country analyst is viewing the "Kingdom of Saudi Arabia" dossier and wants to create a follow-up task. They open the work creation palette and select "Task". The system automatically links the task to the Saudi Arabia dossier without requiring any additional selection.

**Why this priority**: This is the most common workflow - users working within a dossier context should have seamless task creation with automatic linking.

**Independent Test**: Can be fully tested by navigating to any dossier page, creating a task, and verifying the task appears in the dossier's activity view.

**Acceptance Scenarios**:

1. **Given** a user is on a dossier detail page, **When** they create a new task via the work creation palette, **Then** the task is automatically linked to that dossier without showing a dossier picker
2. **Given** a task was created from a dossier page, **When** viewing the task details, **Then** the linked dossier is displayed with a visual badge showing "Linked to [Dossier Name]"
3. **Given** a task was created from a dossier page, **When** viewing the dossier's activity timeline, **Then** the task appears in the list of related activities

---

### User Story 2 - Create Commitment from Engagement Page (Priority: P1)

A policy officer is reviewing an engagement (bilateral meeting with USA) that is linked to the "United States" dossier. They want to record a commitment from this meeting. When creating the commitment, the system automatically inherits the dossier from the engagement without requiring re-selection.

**Why this priority**: Commitments are critical deliverables that must be tracked. The inheritance chain (engagement → dossier) ensures all commitments are properly connected to their dossier context.

**Independent Test**: Navigate to any engagement page, create a commitment, and verify it inherits the engagement's dossier automatically and shows "Linked via Engagement".

**Acceptance Scenarios**:

1. **Given** a user is on an engagement page (which has a dossier), **When** they create a commitment, **Then** the commitment inherits the engagement's dossier automatically
2. **Given** a commitment was created from an engagement page, **When** viewing the commitment details, **Then** it shows "Linked via Engagement" with the dossier name
3. **Given** a commitment was created from an engagement, **When** viewing the dossier's activity timeline, **Then** the commitment appears in the related activities

---

### User Story 3 - Create Commitment from After-Action Page (Priority: P2)

A staff member is completing an after-action record for a meeting. The after-action is linked to an engagement, which is linked to a dossier. When creating commitments from the after-action page, the system follows the chain (after-action → engagement → dossier) to automatically resolve the dossier context.

**Why this priority**: After-action records are the primary source of commitments. Following the full inheritance chain ensures traceability.

**Independent Test**: Navigate to an after-action page, create a commitment, and verify it inherits the dossier through the after-action → engagement → dossier chain.

**Acceptance Scenarios**:

1. **Given** a user is on an after-action page (linked to engagement → dossier), **When** they create a commitment, **Then** the commitment inherits the dossier through the chain
2. **Given** a commitment was created from an after-action, **When** viewing the commitment details, **Then** it shows "Linked via After-Action Record" with the resolved dossier name

---

### User Story 4 - Create Work Item from Generic Page (Priority: P2)

A user is on a generic page (e.g., My Work dashboard, Kanban board) with no dossier context. They want to create a task. Since there's no context to inherit, the system shows a dossier selector requiring them to choose one or more dossiers to link.

**Why this priority**: Ensures all work items are connected to dossiers even when created outside dossier context.

**Independent Test**: Navigate to a page with no dossier context, create a task, and verify a dossier selector appears and requires selection.

**Acceptance Scenarios**:

1. **Given** a user is on a page with no dossier context, **When** they create a task, **Then** a dossier selector is displayed
2. **Given** a user is creating a task from a generic page, **When** they try to submit without selecting a dossier, **Then** validation prevents submission with message "Please select at least one dossier"
3. **Given** a user selects multiple dossiers, **When** submitting the task, **Then** the task is linked to all selected dossiers

---

### User Story 5 - View Dossier Activity Timeline (Priority: P1)

A manager wants to see all activities related to the "United Nations" dossier. They navigate to the dossier page and view the activity timeline which shows all tasks, commitments, intakes, and engagements linked to that dossier.

**Why this priority**: The dossier activity view is the ultimate goal - providing a comprehensive view of all organizational knowledge and activities for a dossier.

**Independent Test**: Navigate to any dossier with linked activities, view the activity timeline, and verify all related entities appear chronologically.

**Acceptance Scenarios**:

1. **Given** a dossier has linked tasks, commitments, intakes, and engagements, **When** viewing the dossier's activity timeline, **Then** all related activities are displayed in chronological order
2. **Given** a task was created from an engagement linked to the dossier, **When** viewing the dossier's activity timeline, **Then** the task appears (inherited via engagement)
3. **Given** the activity timeline is displayed, **When** clicking on any activity, **Then** the user can navigate to the activity's detail page

---

### User Story 6 - Display Inherited Context Visual Badges (Priority: P2)

When creating or viewing work items, users see clear visual indicators showing which dossier(s) are linked and how the link was established (directly or through inheritance).

**Why this priority**: Transparency about how dossier links are established helps users understand the relationship chain.

**Independent Test**: Create work items from various contexts and verify appropriate visual badges appear showing inheritance source.

**Acceptance Scenarios**:

1. **Given** a task is linked directly to a dossier, **When** viewing the task, **Then** a badge shows "[Dossier Name]" with the dossier type icon
2. **Given** a commitment is linked via engagement, **When** viewing the commitment, **Then** a badge shows "[Dossier Name] (via Engagement)"
3. **Given** a commitment is linked via after-action → engagement chain, **When** viewing the commitment, **Then** a badge shows "[Dossier Name] (via After-Action)"

---

### Edge Cases

- What happens when an engagement's dossier is changed after commitments are created? **Behavior**: Existing commitments retain their original dossier link; new commitments inherit the updated dossier.
- What happens when a user creates a task from a page where the engagement has no dossier? **Behavior**: Show the dossier selector since context cannot be resolved.
- What happens when creating multiple work items in quick succession? **Behavior**: Each inherits the same context without requiring re-selection.
- How does the system handle multiple dossiers when an entity could belong to several? **Behavior**: Support multiple dossier selection with visual badges for each.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST automatically resolve dossier context from the current page when creating work items
- **FR-002**: System MUST follow relationship chains to resolve dossier context (after-action → engagement → dossier)
- **FR-003**: System MUST display a dossier selector only when no dossier context can be resolved from the current page
- **FR-004**: System MUST require at least one dossier link for all work items (tasks, commitments, intakes)
- **FR-005**: System MUST display visual badges showing linked dossier(s) with type icon and name
- **FR-006**: System MUST indicate inheritance source (e.g., "via Engagement", "via After-Action") in visual badges
- **FR-007**: System MUST support multiple dossier selection when creating from generic pages
- **FR-008**: System MUST include all linked activities in the dossier activity timeline
- **FR-009**: System MUST display dossier activity timeline in chronological order
- **FR-010**: System MUST support bilingual dossier names (English and Arabic) in badges and selectors

### Key Entities

- **CreationContext**: Represents the context when creating work items - includes route, entity type, entity ID, and resolved dossier information
- **DossierContextBadge**: Visual component displaying linked dossier with type icon, name, and optional inheritance source
- **DossierSelector**: Selection component for choosing dossiers when no context exists - supports single and multiple selection modes
- **DossierActivityTimeline**: Aggregated view of all activities (tasks, commitments, intakes, engagements) linked to a dossier

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can create work items from dossier/engagement/after-action pages without any manual dossier selection (100% automatic inheritance)
- **SC-002**: All work items created in the system have at least one dossier link (zero orphaned work items)
- **SC-003**: Users can view all activities related to a dossier from a single activity timeline
- **SC-004**: Dossier context resolution completes instantly (users don't wait for context to load)
- **SC-005**: 100% of work items display their dossier context with visual badges showing inheritance source
- **SC-006**: Reduce dossier selection steps by 80% for users working within dossier context (from always selecting to only selecting when orphaned)
- **SC-007**: Dossier activity timeline displays activities within 2 seconds of page load for dossiers with up to 500 related activities

## Assumptions

- Users are authenticated and have appropriate permissions to view dossiers and create work items
- The relationship chain (engagement → dossier, after-action → engagement) is already established in the database
- Existing work items without dossier links will be addressed separately (migration/backfill is out of scope)
- Mobile and RTL (Arabic) support are requirements for all UI components

## Out of Scope

- Retroactive linking of existing orphaned work items
- Changing dossier links after work item creation
- Bulk dossier assignment operations
- Custom inheritance rules beyond the standard relationship chains
