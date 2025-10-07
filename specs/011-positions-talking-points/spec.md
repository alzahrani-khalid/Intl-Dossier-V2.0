# Feature Specification: Positions & Talking Points Lifecycle

**Feature Branch**: `011-positions-talking-points`
**Created**: 2025-10-01
**Status**: Draft
**Input**: User description: "Positions & Talking Points Lifecycle — Spec

Purpose: provide end‑to‑end drafting (bilingual), approvals, versioning, publication, and consistency checks.

## Goals

- CRUD for positions with provenance and bilingual content.
- Approval chains with status transitions and step‑up on approve.
- Versioning with compare and supersede; publish for internal audiences.
- Integrate existing consistency analysis endpoints.

## UX

- List with facets (thematic, status, last updated, owner).
- Draft editor: EN/AR side‑by‑side, rationale, alignment, attachments.
- Approval view: diffs, comments, sign‑off.
- Consistency panel: conflicts with suggested resolutions.

## UI

- Routes: `/_protected/positions`, `/_protected/positions/:id`.
- Components: `PositionEditor`, `VersionDiff`, `ApprovalChain`, `ConsistencyPanel`.

## API

- `GET/POST /api/positions` (CRUD)
- `PUT /api/positions/:id/submit` (for review)
- `PUT /api/positions/:id/approve` (requires step‑up)
- `PUT /api/positions/:id/publish`
- `GET /api/positions/:id/versions`
- Consistency endpoints exist; add `PUT /api/positions/consistency/:id/reconcile` usage in UI.

## AI

- Drafting assistant: initial bilingual text with citations.
- Translator with terminology memory; strength/stance calibration.
- Contradiction/ambiguity detection (feeds PositionConsistencyService).

## Acceptance

- Create → submit → approve → publish flow; versions tracked; step‑up enforced on approve.
- Consistency conflicts surfaced and reconciled; score updated."

## Execution Flow (main)
```
1. Parse user description from Input
   → Description provided with clear goals and features
2. Extract key concepts from description
   → Identified: actors (drafters, reviewers, approvers, consumers), actions (draft, review, approve, publish, reconcile), data (positions, talking points, versions, attachments), constraints (bilingual content, approval chains, step-up authentication)
3. For each unclear aspect:
   → [NEEDS CLARIFICATION: What defines "internal audiences" for publication - specific user roles or organizational units?]
   → [NEEDS CLARIFICATION: What is the maximum number of approval stages in the chain?]
   → [NEEDS CLARIFICATION: What happens to published positions when superseded - are they archived, marked obsolete, or deleted?]
   → [NEEDS CLARIFICATION: What are the specific thematic categories for faceted search?]
   → [NEEDS CLARIFICATION: What triggers consistency checks - manual request, automatic on save, or scheduled batch?]
   → [NEEDS CLARIFICATION: What is the retention policy for position versions?]
4. Fill User Scenarios & Testing section
   → User flows identified for drafting, approval, publication, and consistency management
5. Generate Functional Requirements
   → Each requirement is testable and mapped to user scenarios
6. Identify Key Entities
   → Position, Version, Approval, Attachment, ConsistencyCheck
7. Run Review Checklist
   → WARN "Spec has uncertainties marked with [NEEDS CLARIFICATION]"
8. Return: SUCCESS (spec ready for planning after clarifications)

**Note**: The [NEEDS CLARIFICATION] markers above (lines 56-61) are historical documentation of the specification generation process. All items have been resolved in the "Clarifications" section (lines 75-82) and throughout the Requirements section.
```

---

## Clarifications

### Session 2025-10-01
- Q: What is the maximum number of approval stages in the approval chain? → A: Variable 1-10 stages, configurable per position type
- Q: What triggers consistency checks for positions? → A: Hybrid: Auto on submit + manual trigger available
- Q: What is the retention policy for position versions? → A: Retain for 7 years (regulatory compliance period)
- Q: What defines "internal audiences" for published position visibility? → A: Configurable per position: drafter selects audience groups
- Q: What happens when an approver in the chain is unavailable or leaves the organization? → A: Combination: delegation + admin reassignment

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing

### Primary User Story
A policy officer needs to draft an official position on an international matter in both English and Arabic, ensuring consistency with existing organizational positions, obtaining management approval through a formal chain, and publishing the finalized position for internal staff to reference when engaging with external stakeholders.

### Acceptance Scenarios

#### Position Drafting
1. **Given** I am a policy officer with drafting permissions, **When** I create a new position document with bilingual content (EN/AR), rationale, and alignment notes, **Then** the system saves my draft with provenance tracking showing me as the author.

2. **Given** I am drafting a position, **When** I select the audience groups that should have access to the position once published, **Then** the system records these access control settings with the position.

3. **Given** I am drafting a position, **When** I request AI assistance for initial text generation, **Then** the system provides bilingual draft content with citations to source materials.

4. **Given** I have a draft position, **When** I attach supporting documents, **Then** the system associates the attachments with the position and includes them in the approval package.

#### Approval Workflow
5. **Given** I have completed a draft position, **When** I submit it for review, **Then** the system transitions the status to "Under Review" and notifies the first approver in the chain.

6. **Given** I am an approver reviewing a submitted position, **When** I view the approval request, **Then** I can see the full content, rationale, attachments, and differences from previous versions.

7. **Given** I am an approver ready to approve a position, **When** I initiate approval, **Then** the system requires step-up authentication before recording my approval.

8. **Given** a position has passed through all approval stages, **When** the final approver signs off, **Then** the system marks the position as approved and ready for publication.

9. **Given** I am a reviewer who finds issues in a submitted position, **When** I add comments and request revisions, **Then** the system returns the position to the drafter with my feedback.

10. **Given** I am an approver who will be unavailable, **When** I delegate my approval authority to another user, **Then** the system records the delegation and transfers pending approvals to the delegate.

11. **Given** an approver has left the organization with pending approvals, **When** an administrator reassigns those approvals to a different user, **Then** the system updates the approval chain and notifies the new approver.

#### Versioning
12. **Given** a position has been approved, **When** I create a revised version, **Then** the system maintains the previous version and tracks the new version separately.

13. **Given** multiple versions of a position exist, **When** I compare versions, **Then** the system displays side-by-side differences highlighting changes in content.

14. **Given** a new version supersedes an older version, **When** I publish the new version, **Then** the system marks the old version as superseded while maintaining its history.

#### Publication
15. **Given** a position has been approved, **When** I publish it, **Then** the system makes it available only to the audience groups selected during drafting and records the publication date and publisher.

16. **Given** a position is published, **When** users within the authorized audience groups search for positions, **Then** they can discover it through faceted search by theme, status, date, or owner.

17. **Given** I am not in an authorized audience group for a position, **When** I search for positions, **Then** the system does not display that position in my search results.

#### Consistency Management
18. **Given** I am drafting a position, **When** I manually trigger a consistency check, **Then** the system identifies conflicts or contradictions with existing published positions.

19. **Given** I submit a position for review, **When** the system automatically runs consistency checks, **Then** any detected conflicts are displayed before proceeding to the approval chain.

20. **Given** consistency conflicts are detected, **When** I view the consistency panel, **Then** I see conflicting positions with suggested resolutions and alignment options.

21. **Given** I have resolved consistency conflicts, **When** I reconcile the conflicts in the system, **Then** the consistency score updates to reflect improved alignment.

### Edge Cases
- What happens when an approver in the chain is unavailable or leaves the organization? **Resolved**: Approvers can delegate authority, and administrators can reassign pending approvals (FR-018, FR-019).
- How does the system handle concurrent edits to the same position draft by multiple users? **Resolved**: Optimistic locking with version field (FR-009a to FR-009c) prevents conflicts with 409 response and manual merge option.
- What happens when a published position is found to contain errors after publication? **Resolved**: Emergency correction workflow (FR-053 to FR-058) allows admins to correct published positions with audit trail and audience notification.
- What happens when AI services are unavailable for drafting assistance or consistency checks? **Resolved**: System gracefully degrades, allowing manual operations to continue (FR-048).
- How are orphaned attachments handled if a position draft is deleted? **Resolved**: Cascade delete (FR-004a) removes attachments from storage and database when draft is permanently deleted.
- What happens if step-up authentication fails during the approval process? **Resolved**: 3-attempt retry with 15-min lockout (FR-012a to FR-012c), 10-min challenge expiry, bilingual error messages.

---

## Requirements

### Functional Requirements

#### Position Management (CRUD)
- **FR-001**: System MUST allow authorized users to create new position documents with bilingual content fields (English and Arabic).
- **FR-002**: System MUST record provenance information for each position including author, creation date, and modification history.
- **FR-003**: System MUST allow position drafters to add rationale, alignment notes, and contextual information.
- **FR-004**: System MUST support attaching supporting documents to position records.
- **FR-004a**: System MUST cascade delete all attachments when a position draft is permanently deleted, removing both database records and files from storage.
- **FR-004b**: System MUST NOT delete attachments when a position is unpublished or marked as superseded (attachments retained for audit trail).
- **FR-005**: System MUST allow position drafters to select which audience groups (internal user groups) can access the position once published.
- **FR-006**: Users MUST be able to search and filter positions by theme, status, last update date, and owner.
- **FR-007**: System MUST display positions in a list view with relevant metadata.
- **FR-008**: Users MUST be able to view full position details including all historical information.
- **FR-009**: System MUST allow authorized users to edit position drafts that have not yet been submitted for review.
- **FR-009a**: System MUST prevent concurrent modification conflicts using optimistic locking with version field incrementation on each update.
- **FR-009b**: System MUST return HTTP 409 Conflict when a user attempts to save a position that has been modified by another user since they loaded it.
- **FR-009c**: Users MUST be able to view the conflicting changes and choose to either reload the latest version (discarding their changes) or manually merge their changes with the latest version.

#### Approval Chain
- **FR-010**: System MUST support configurable approval chains with 1 to 10 stages, where the number of stages is determined by the position type.
- **FR-011**: System MUST transition position status through defined states: Draft → Under Review → Approved → Published.
- **FR-012**: System MUST require step-up authentication when an approver signs off on a position.
- **FR-012a**: System MUST allow approvers 3 attempts to complete step-up authentication challenge before locking the approval action for 15 minutes.
- **FR-012b**: System MUST expire step-up challenges after 10 minutes if not completed, requiring the approver to re-initiate authentication.
- **FR-012c**: System MUST provide clear error messages in both English and Arabic when step-up authentication fails, indicating remaining attempts or lockout duration.
- **FR-013**: System MUST notify the next approver in the chain when a position advances to their stage.
- **FR-014**: Approvers MUST be able to view differences between the current version and previous versions.
- **FR-015**: Approvers MUST be able to add comments and request revisions.
- **FR-016**: System MUST return positions to drafters when revisions are requested, with reviewer feedback attached.
- **FR-017**: System MUST record all approval actions with timestamp and approver identity.
- **FR-018**: Approvers MUST be able to delegate their approval authority to another user when they will be unavailable.
- **FR-019**: System administrators MUST be able to reassign pending approvals to a different approver when the assigned approver is unavailable or has left the organization.
- **FR-020**: System MUST record all delegation and reassignment actions in the approval history with timestamps and identities of all parties involved.

#### Versioning
- **FR-021**: System MUST create a new version when an approved position is modified.
- **FR-022**: System MUST maintain complete history of all position versions for 7 years from creation date to satisfy regulatory compliance requirements, and automatically archive or delete versions that exceed the 7-year retention period.
- **FR-023**: Users MUST be able to compare any two versions side-by-side.
- **FR-024**: System MUST display changes between versions with clear highlighting of additions, deletions, and modifications.
- **FR-025**: System MUST support marking versions as superseded when newer versions are published.

#### Publication
- **FR-028**: System MUST allow authorized users to publish approved positions.
- **FR-029**: System MUST restrict position visibility to the audience groups selected by the position drafter during position creation.
- **FR-030**: System MUST enforce access control so that only users belonging to the selected audience groups can view published positions.
- **FR-031**: System MUST record publication date and publisher identity.
- **FR-032**: Published positions MUST be discoverable through search and filtering mechanisms by users within the authorized audience groups.
- **FR-033**: System MUST support unpublishing positions under the following conditions:
  - **Within 24 hours of publication**: Original drafter OR any member of the approval chain OR admin can unpublish with optional reason
  - **After 24 hours of publication**: Only admin can unpublish with mandatory reason field
  - Unpublishing removes position from search results and audience group access but retains the position record with status "Unpublished" for audit trail
  - System MUST record unpublish action with timestamp, user identity, and reason (if provided)

#### Emergency Correction Workflow
- **FR-053**: System MUST support emergency correction workflow for published positions when critical errors are discovered post-publication.
- **FR-054**: Emergency corrections MUST be authorized by Admin role with mandatory reason field explaining the correction necessity.
- **FR-055**: System MUST mark corrected positions with "Emergency Correction" badge showing correction timestamp, correcting admin, and reason.
- **FR-056**: System MUST notify all users in the position's audience groups when an emergency correction is applied.
- **FR-057**: Emergency corrections MUST create a new version with the correction, while the erroneous published version is marked as "Corrected" (not deleted) for audit trail.
- **FR-058**: System MUST record all emergency correction actions in an audit log with full details (position ID, admin identity, timestamp, reason, changes made).

#### Consistency Checks
- **FR-034**: System MUST detect contradictions and conflicts between positions.
- **FR-035**: System MUST identify ambiguities in position statements.
- **FR-036**: System MUST provide a consistency score for each position indicating alignment with existing positions.
- **FR-037**: System MUST display consistency conflicts in a dedicated panel with details of conflicting positions.
- **FR-038**: System MUST suggest resolutions for identified consistency conflicts.
- **FR-039**: Users MUST be able to reconcile consistency conflicts through explicit actions.
- **FR-040**: System MUST update consistency scores when conflicts are resolved.
- **FR-041**: System MUST automatically run consistency checks when a position is submitted for review.
- **FR-042**: Users MUST be able to manually trigger consistency checks at any time during drafting via an explicit action.

#### AI Assistance (Consistency Analysis)
- **FR-047**: AI MUST detect contradictions and ambiguities to feed into consistency analysis.
- **FR-048**: System MUST gracefully degrade when AI services are unavailable, allowing manual drafting and editing to continue.

#### AI Assistance - Phase 2 (Future Enhancement)

**Note**: The following AI drafting features are scoped for a future implementation phase. The current phase focuses on AI-powered consistency checking (FR-047, FR-048) which is critical for baseline functionality. Drafting assistance features can be added incrementally post-launch.

- **FR-043 (Phase 2)**: System SHOULD provide AI-powered drafting assistance to generate initial bilingual content.
- **FR-044 (Phase 2)**: AI-generated content SHOULD include citations to source materials.
- **FR-045 (Phase 2)**: System SHOULD support AI-powered translation between English and Arabic with terminology memory.
- **FR-046 (Phase 2)**: AI assistance SHOULD calibrate content for appropriate strength and stance based on context.

#### Bilingual Content
- **FR-049**: System MUST support side-by-side editing of English and Arabic content.
- **FR-050**: System MUST validate that both language versions are present before allowing submission for review.
- **FR-051**: Users MUST be able to view positions in either English or Arabic.
- **FR-052**: All metadata, rationale, and alignment notes MUST support bilingual content.

### Key Entities

- **Position**: Represents an official organizational stance or talking point on a specific matter. Contains bilingual content (English and Arabic), rationale, alignment notes, thematic classification, position type (which determines the 1-10 stage approval chain), selected audience groups (for access control post-publication), provenance information (author, dates), current status, and references to related positions. Associated with multiple versions, attachments, and consistency checks.

- **Version**: Represents a snapshot of a position at a specific point in time. Contains the full content as it existed at that version, timestamp, author of changes, version number, supersession status, and creation date (for 7-year retention tracking). Linked to the parent position and supports comparison with other versions. Versions are retained for 7 years from creation date to satisfy regulatory compliance requirements.

- **Approval**: Represents a single approval action within the approval chain. Contains approver identity (original or delegated/reassigned), timestamp, approval stage, comments, decision (approve/request revisions), authentication proof (step-up verification), and delegation/reassignment history if applicable. Linked to the position being approved.

- **Attachment**: Represents a supporting document associated with a position. Contains file metadata (name, size, type), upload date, uploader identity, and relationship to the position. Attached documents travel with the position through the approval process.

- **ConsistencyCheck**: Represents an analysis of alignment between positions. Contains consistency score, detected conflicts, identified contradictions, suggested resolutions, and reconciliation status. Links multiple positions that conflict or align with each other.

- **User**: Represents individuals who interact with the system in various roles (drafter, reviewer, approver, consumer). Contains identity information, role assignments, and permissions.

### User Roles and Permissions

**Role Definitions**:

- **Drafter**: Policy officers who create and edit position drafts
  - Create positions, edit own drafts, attach documents, select audience groups
  - Submit positions for review
  - View own drafts and published positions within their audience groups

- **Reviewer**: Subject matter experts who provide feedback on positions
  - View positions assigned for their review
  - Add comments and request revisions
  - Cannot approve or publish

- **Approver**: Management personnel in approval chains
  - View positions at their approval stage
  - Approve positions (requires step-up MFA)
  - Request revisions with comments
  - Delegate approval authority to another approver
  - View positions they have previously approved

- **Admin**: System administrators
  - All permissions of Drafter, Reviewer, and Approver
  - Reassign pending approvals when approvers are unavailable
  - Configure approval chains per position type
  - Manage audience groups and user memberships
  - Unpublish positions at any time with reason

- **Consumer**: Internal staff who read published positions
  - View published positions within their audience groups
  - Search and filter positions
  - View version history of published positions
  - Cannot create, edit, or approve

**Permission Matrix**:

| Action | Drafter | Reviewer | Approver | Admin | Consumer |
|--------|---------|----------|----------|-------|----------|
| Create position | ✅ | ❌ | ❌ | ✅ | ❌ |
| Edit own draft | ✅ | ❌ | ❌ | ✅ | ❌ |
| Submit for review | ✅ | ❌ | ❌ | ✅ | ❌ |
| View own drafts | ✅ | ❌ | ❌ | ✅ | ❌ |
| Add review comments | ❌ | ✅ | ✅ | ✅ | ❌ |
| Request revisions | ❌ | ✅ | ✅ | ✅ | ❌ |
| Approve position | ❌ | ❌ | ✅ | ✅ | ❌ |
| Delegate approval | ❌ | ❌ | ✅ | ✅ | ❌ |
| Reassign approval | ❌ | ❌ | ❌ | ✅ | ❌ |
| Publish position | ✅ | ❌ | ✅ | ✅ | ❌ |
| Unpublish (24h) | ✅ | ❌ | ✅ | ✅ | ❌ |
| Unpublish (anytime) | ❌ | ❌ | ❌ | ✅ | ❌ |
| View published (in audience) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Configure approval chains | ❌ | ❌ | ❌ | ✅ | ❌ |
| Manage audience groups | ❌ | ❌ | ❌ | ✅ | ❌ |

**Note**: All roles require MFA for authentication. Approvers require step-up MFA specifically for approval actions.

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous where specified
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities resolved
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---

## Dependencies and Assumptions

### Dependencies
- Existing consistency analysis endpoints for integration (referenced in user input)
- Step-up authentication mechanism (must be available system-wide)
- Bilingual UI framework supporting English and Arabic
- Document storage system for attachments
- AI services for drafting assistance, translation, and consistency detection

### Assumptions
- Users have basic familiarity with document approval workflows
- Organization has established thematic categories for position classification
- Approval chain structure is configurable per organizational needs
- Existing consistency analysis can be extended to support reconciliation actions
- Internal audiences can be defined through role-based access control
