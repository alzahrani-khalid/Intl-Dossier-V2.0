# Feature Specification: Commitments Management v1.1

**Feature Branch**: `031-commitments-management`
**Created**: 2025-11-25
**Status**: Draft
**Input**: User description: "Commitments Management v1.1 - Move from read-only to full lifecycle CRUD with filtering, evidence upload, and inline status updates. Builds on Feature 030 (health-commitment)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and Manage Commitments (Priority: P1)

As a dossier manager, I need to create, edit, and track commitments for my assigned dossiers so that I can ensure all obligations are captured and monitored throughout their lifecycle.

**Why this priority**: This is the core capability that enables all other commitment management features. Without CRUD operations, users cannot create or modify commitments.

**Independent Test**: Can be fully tested by creating a commitment from the dossier page, editing its details, and verifying the changes persist. Delivers immediate value by enabling commitment tracking.

**Acceptance Scenarios**:

1. **Given** I am viewing a dossier I'm assigned to, **When** I tap the "Add Commitment" button and fill in title, description, due date, priority, and owner, **Then** a new commitment is created and appears in the commitments list
2. **Given** I have created a commitment, **When** I open the commitment detail view and modify the title or due date, **Then** the changes are saved and reflected in all views
3. **Given** a commitment exists, **When** I choose to delete/cancel it, **Then** the commitment is marked as cancelled with an optional reason
4. **Given** I am on a mobile device, **When** I create a commitment, **Then** the form is optimized for touch with large input targets and the keyboard does not obscure fields

---

### User Story 2 - Quick Status Updates (Priority: P1)

As a commitment owner, I need to quickly update a commitment's status from the list view without navigating away so that I can efficiently manage my workload during busy periods.

**Why this priority**: Status updates are the most frequent action users perform. Making this fast and accessible directly impacts daily productivity.

**Independent Test**: Can be fully tested by viewing the commitments list, tapping a status badge, and selecting a new status. Delivers immediate value by reducing clicks for the most common action.

**Acceptance Scenarios**:

1. **Given** I am viewing the commitments list, **When** I tap the status badge on a commitment card, **Then** a dropdown appears with status options (Pending, In Progress, Completed, Cancelled)
2. **Given** I select a new status from the dropdown, **When** the status change is saved, **Then** the UI updates immediately (optimistic update) and a success toast confirms the change
3. **Given** I am on a mobile device with Arabic language selected, **When** I update a status, **Then** all labels appear in Arabic and the layout flows right-to-left correctly
4. **Given** a commitment status changes to "Completed", **When** the update is saved, **Then** the completion timestamp is automatically recorded

---

### User Story 3 - Filter and Search Commitments (Priority: P2)

As a dossier analyst, I need to filter commitments by status, priority, owner, and due date so that I can focus on specific subsets like overdue items or high-priority tasks.

**Why this priority**: Filtering becomes critical as commitment volume grows. Essential for productivity but not required for basic commitment creation/tracking.

**Independent Test**: Can be fully tested by opening the filter panel, selecting multiple filters, and verifying the list updates correctly. URL should reflect filter state for sharing.

**Acceptance Scenarios**:

1. **Given** I am on the commitments list page, **When** I tap the filter button, **Then** a filter panel opens (bottom sheet on mobile, side panel on desktop)
2. **Given** the filter panel is open, **When** I select multiple statuses (e.g., Pending and In Progress), **Then** only commitments matching those statuses are shown
3. **Given** I have applied filters, **When** I share or bookmark the URL, **Then** the filters are preserved in the URL and restored when the link is opened
4. **Given** I tap the "Overdue Only" toggle, **When** the filter is applied, **Then** only commitments past their due date with non-completed status are shown
5. **Given** active filters are applied, **When** I view the list, **Then** filter chips appear above the list showing which filters are active with the ability to remove individual filters

---

### User Story 4 - Evidence Upload for Proof (Priority: P2)

As a commitment owner, I need to upload supporting evidence (documents, photos) when completing commitments that require proof so that compliance can be verified.

**Why this priority**: Evidence tracking is important for accountability but not required for basic commitment management. Adds compliance value.

**Independent Test**: Can be fully tested by opening a commitment marked as "proof required", uploading a file, and verifying the file is accessible from the commitment detail view.

**Acceptance Scenarios**:

1. **Given** a commitment has `proof_required = true`, **When** I view the commitment card, **Then** an upload indicator/button is visible
2. **Given** I am on mobile and tap the upload button, **When** the upload modal opens, **Then** I have options for both "Take Photo" (camera) and "Choose File"
3. **Given** I select a file (PDF, JPG, PNG, or DOCX), **When** the file is under 10MB, **Then** a progress indicator shows upload status and the file is attached upon completion
4. **Given** I upload evidence successfully, **When** I view the commitment, **Then** the evidence is shown with a download link and timestamp of submission
5. **Given** I try to upload a file over 10MB or unsupported format, **When** validation fails, **Then** a clear error message explains the limitation

---

### User Story 5 - View Commitment Details (Priority: P3)

As a team lead, I need to view full commitment details including history and linked dossier so that I can understand context and track progress over time.

**Why this priority**: Detail view enhances understanding but the list view provides basic information. This adds depth for power users.

**Independent Test**: Can be fully tested by tapping a commitment card and verifying all details appear in a drawer, including status change history.

**Acceptance Scenarios**:

1. **Given** I am on the commitments list, **When** I tap a commitment card body, **Then** a detail drawer opens showing full commitment information
2. **Given** the detail drawer is open, **When** I view the timeline section, **Then** I can see the history of status changes with timestamps
3. **Given** a commitment is linked to a dossier, **When** I tap the dossier link in the detail drawer, **Then** I am navigated to that dossier's page
4. **Given** I am viewing commitment details, **When** I tap "Edit", **Then** the drawer switches to edit mode allowing me to modify commitment fields

---

### User Story 6 - Infinite Scroll Pagination (Priority: P3)

As a user with many commitments, I need the list to load more items as I scroll so that I don't have to manually click "load more" or navigate pages.

**Why this priority**: Pagination improves UX for heavy users but basic list works with limited items. Enhancement for scale.

**Independent Test**: Can be fully tested by having more than 20 commitments and scrolling to the bottom of the list, verifying more items load automatically.

**Acceptance Scenarios**:

1. **Given** I have more than 20 commitments, **When** I view the commitments list, **Then** the first 20 are loaded initially
2. **Given** I scroll to the bottom of the list, **When** more commitments exist, **Then** additional items are loaded automatically with a loading indicator
3. **Given** all commitments have been loaded, **When** I scroll to the bottom, **Then** an "End of list" indicator appears and no further requests are made

---

### Edge Cases

- What happens when a user tries to change status from Completed back to Pending? (Answer: Blocked for non-admin users; show explanatory message)
- How does the system handle concurrent edits to the same commitment? (Answer: Last write wins with optimistic UI; if conflict, show toast and refresh)
- What happens if evidence upload fails midway? (Answer: Show error with retry option; partially uploaded files are cleaned up)
- How are commitments displayed when the linked dossier is deleted? (Answer: Commitment remains but dossier link shows "Dossier removed")
- What happens when filtering returns zero results? (Answer: Show empty state with suggestion to adjust filters)

## Requirements *(mandatory)*

### Functional Requirements

**CRUD Operations**
- **FR-001**: System MUST allow users to create commitments with title, description, due date, priority (low/medium/high/critical), owner type (internal/external), and owner assignment
- **FR-002**: System MUST allow users to edit commitment details including title, description, due date, and priority
- **FR-003**: System MUST allow users to delete/cancel commitments with an optional cancellation reason
- **FR-004**: System MUST support status transitions: pending → in_progress → completed OR cancelled
- **FR-004a**: System MUST automatically mark non-completed commitments as `overdue` when due_date passes (via existing daily trigger from Feature 030). Users cannot manually set this status.

**Status Management**
- **FR-005**: System MUST provide inline status update capability directly from the list view without navigation
- **FR-006**: System MUST prevent status regression (e.g., completed → pending) for non-administrator users
- **FR-007**: System MUST automatically record timestamps when status changes to completed
- **FR-008**: System MUST apply optimistic UI updates for status changes with rollback on failure

**Filtering & Pagination**
- **FR-009**: System MUST support filtering by status (multi-select), priority (multi-select), owner type, overdue status, and due date range
- **FR-010**: System MUST synchronize active filters with URL query parameters for shareability
- **FR-011**: System MUST display active filters as removable chips above the list
- **FR-012**: System MUST implement cursor-based infinite scroll pagination with 20 items per page

**Evidence Management**
- **FR-013**: System MUST allow file uploads (PDF, JPG, PNG, DOCX) up to 10MB when proof_required is true
- **FR-014**: System MUST support camera capture for evidence on mobile devices
- **FR-015**: System MUST display upload progress and provide retry capability on failure
- **FR-016**: System MUST store uploaded evidence securely with access restricted to authorized users; evidence files are retained for the lifetime of the commitment and deleted only when the commitment is permanently removed
- **FR-017**: System MUST record evidence submission timestamp when proof is uploaded

**User Experience**
- **FR-018**: System MUST support mobile-first responsive design with minimum 44x44px touch targets
- **FR-019**: System MUST fully support RTL layout for Arabic language including text alignment and icon direction
- **FR-020**: System MUST display overdue commitments with visual indicators (red border, overdue badge with days count)
- **FR-021**: System MUST provide a detail drawer for viewing full commitment information and edit capability

**Data Integrity**
- **FR-022**: System MUST track who created and who last updated each commitment
- **FR-023**: System MUST maintain backward compatibility with existing health score calculations from Feature 030
- **FR-024**: System MUST maintain a full audit trail for status changes, recording timestamp, user, and previous/new status for each transition

### Key Entities

- **Commitment**: A tracked obligation with title, description, due date, status, priority, owner, and optional evidence. Core entity of the feature.
- **Evidence**: Supporting proof attached to a commitment (file URL, submission timestamp). One-to-one relationship with Commitment.
- **Status History**: Audit record of status changes (timestamp, user, old status, new status). One-to-many relationship with Commitment.
- **Commitment Owner**: Either an internal user or external contact responsible for fulfilling the commitment. Polymorphic relationship.
- **Dossier**: Parent entity that commitments belong to. One-to-many relationship.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a new commitment in under 60 seconds from the dossier page
- **SC-002**: Users can update commitment status with 2 taps or fewer from the list view
- **SC-003**: Filter panel opens and applies filters in under 1 second
- **SC-004**: Evidence upload completes within 10 seconds for files up to 5MB on standard connection
- **SC-005**: List loads additional items via infinite scroll in under 500ms
- **SC-006**: 100% of UI components render correctly in both LTR (English) and RTL (Arabic) layouts
- **SC-007**: All interactive elements meet minimum 44x44px touch target size on mobile
- **SC-008**: Zero regression in existing health score calculations after feature deployment
- **SC-009**: Commitment CRUD operations maintain data integrity with no orphaned records
- **SC-010**: System handles up to 1,000 commitments per dossier without performance degradation

## Clarifications

### Session 2025-11-25

- Q: How long should evidence files be retained in storage? → A: Lifetime of commitment (deleted only when commitment is permanently removed)
- Q: What level of audit trail should be maintained for commitments? → A: Full audit trail for status changes only (timestamp, user, old→new status)

## Assumptions

- The existing `aa_commitments` table will be extended rather than replaced
- Users accessing commitments have appropriate dossier assignments (enforced by existing RLS)
- The daily overdue detection job from Feature 030 will continue to operate
- Evidence files will be stored in a dedicated storage bucket with appropriate access controls
- Mobile users have devices running iOS 14+ or Android 10+ with camera access

## Out of Scope

- Per-commitment reminder notifications (deferred to v1.2)
- Complex recurrence patterns for commitments
- SLA escalation workflows
- External guest portal for commitment tracking
- Bulk operations (mass status update, bulk delete)
- Commitment templates or presets
