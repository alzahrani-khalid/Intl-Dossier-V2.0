# Feature Specification: After-Action Notes

**Feature Branch**: `010-after-action-notes`
**Created**: 2025-09-30
**Status**: Draft
**Input**: User description: "After‑Action Notes — Spec

Purpose: standardize capture of outcomes after engagements, generate tasks/commitments, and close the loop.

## Goals

- Structured after‑action records per engagement with decisions, risks, commitments, and next steps.
- Auto‑create Tasks and Commitments; link to Dossier.
- Bilingual summary and distribution PDF.

## UX

- From Engagement: \"Log After‑Action\" button.
- Form sections: Attendance check, Decisions, Commitments (owner/due), Risks, Follow‑ups, Attachments.
- Review step and publish (with step‑up if confidential).

## UI

- Route: \`/_protected/engagements/:id/after-action\`
- Components: \`AfterActionForm\`, \`DecisionList\`, \`CommitmentEditor\`, \`RiskList\`.

## API

- \`POST /api/engagements/:id/after-action\` (create/update)
- \`GET /api/engagements/:id/after-action\`

## AI

- Meeting minutes → structured extraction (decisions, action items, risks) with confidence.
- Bilingual summary; suggested owners/dates from context.

## Acceptance

- Creating After‑Action inserts linked tasks/commitments with correct owners/dates.
- Summary in EN/AR; distribution PDF generated."

## Execution Flow (main)
```
1. Parse user description from Input
   → SUCCESS: Feature description extracted
2. Extract key concepts from description
   → Identified: actors (engagement participants, task owners), actions (log outcomes, create tasks/commitments, generate summaries), data (decisions, risks, commitments, attendees, attachments), constraints (bilingual, step-up auth for confidential, PDF generation)
3. For each unclear aspect:
   → Marked below with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → SUCCESS: User flows derived from engagement lifecycle
5. Generate Functional Requirements
   → Each requirement testable and linked to acceptance criteria
6. Identify Key Entities (if data involved)
   → SUCCESS: Entities identified
7. Run Review Checklist
   → Spec has uncertainties that need clarification
8. Return: WARN "Spec has uncertainties - requires clarification before planning"
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## Clarifications

### Session 2025-09-30
- Q: Are after-action records editable after publication? → A: Editable by creator + supervisor approval required for published records
- Q: What permissions model controls after-action record operations? → A: Hybrid - role determines base permissions, but dossier assignment required for access
- Q: How should the system handle commitments assigned to external parties (non-system users)? → A: Hybrid - create contact records + optional email notifications, manual status tracking
- Q: Should AI extraction from meeting minutes be synchronous or asynchronous? → A: Hybrid - quick extraction (<5 sec) is synchronous, longer documents processed asynchronously
- Q: Should the system automatically notify commitment owners when tasks are created? → A: Configurable per user - each user sets their notification preferences (in-app, email, both, none)

---

## User Scenarios & Testing

### Primary User Story
Following an important engagement (meeting, consultation, coordination session) related to a dossier, a staff member needs to systematically capture the outcomes, decisions made, risks identified, and commitments agreed upon. The system should help structure this information, automatically create follow-up tasks and commitments with assigned owners, and generate a bilingual summary document that can be distributed to attendees and stakeholders.

### Acceptance Scenarios

1. **Given** an engagement has concluded and the user has access to meeting notes, **When** the user selects "Log After-Action" from the engagement view, **Then** the system displays a structured form to capture attendees, decisions, commitments, risks, and follow-up actions.

2. **Given** the user has filled out the after-action form, **When** the user submits the form, **Then** the system automatically creates individual tasks and commitments with assigned owners and due dates, links them to the parent dossier, and stores the after-action record.

3. **Given** meeting minutes or notes are available, **When** the user uploads or pastes the content into the system, **Then** AI extracts structured information (decisions, action items, risks) either immediately (for short documents <5 sec) or asynchronously (for longer documents), and pre-populates the form fields with confidence indicators when extraction completes.

4. **Given** an after-action record contains confidential information, **When** the user attempts to publish or generate the distribution PDF, **Then** the system requires step-up authentication before proceeding.

5. **Given** the after-action record is complete and approved, **When** the user selects "Generate Summary", **Then** the system produces a bilingual (English/Arabic) PDF summary suitable for distribution to all attendees.

6. **Given** commitments have been logged with owners and due dates, **When** viewing the dossier timeline or tasks list, **Then** all linked tasks and commitments appear with their assignments and deadlines.

### Edge Cases

- What happens when a user tries to log an after-action for an engagement that doesn't exist?
- How does the system handle partial completion if the user saves a draft but doesn't publish?
- What if AI extraction produces low-confidence results or cannot parse the meeting minutes?
- What happens if an external contact's email bounces or is invalid?
- How are duplicate external contacts prevented (same person added multiple times)?
- What if a supervisor rejects an edit request - can the creator revise and resubmit?
- What if multiple edits are requested before the first is approved?
- How does the system handle very large attachments or numerous follow-up items?
- What happens if bilingual summary generation fails for one language but succeeds for the other?

## Requirements

### Functional Requirements

- **FR-001**: System MUST allow authorized users to create an after-action record linked to a specific engagement.
- **FR-002**: System MUST capture attendance information (who was present at the engagement).
- **FR-003**: System MUST allow users to document decisions made during the engagement with structured fields (decision description, rationale, decision-maker).
- **FR-004**: System MUST allow users to log commitments with mandatory fields: description, assigned owner, and due date.
- **FR-005**: System MUST allow users to identify and document risks surfaced during the engagement.
- **FR-006**: System MUST allow users to specify follow-up actions or next steps.
- **FR-007**: System MUST support attaching supporting documents or evidence to the after-action record.
- **FR-008**: System MUST automatically create individual Task and Commitment entities from the logged commitments, linked to the parent dossier.
- **FR-009**: System MUST link all tasks and commitments created from an after-action back to the originating after-action record for traceability.
- **FR-010**: System MUST provide a review step before final submission where users can verify all captured information.
- **FR-011**: System MUST enforce step-up authentication (re-authentication or MFA) when publishing after-action records marked as confidential.
- **FR-012**: System MUST generate a bilingual summary of the after-action record in both English and Arabic.
- **FR-013**: System MUST produce a distribution-ready PDF document containing the bilingual summary.
- **FR-014**: System MUST accept meeting minutes or notes as input and use AI (AnythingLLM) to extract structured information (decisions, action items, risks) with confidence scores. Processing mode (synchronous or asynchronous) determined by FR-022 based on estimated processing time (5-second threshold). Extracted data must include confidence score (0.0-1.0) for each item to allow user validation of AI suggestions.
- **FR-015**: System MUST pre-populate after-action form fields with AI-extracted information, allowing user review and editing before submission.
- **FR-016**: System MUST suggest task owners and due dates based on engagement context when AI processes meeting minutes.
- **FR-017**: System MUST allow users to save draft after-action records and resume editing later before final publication.
- **FR-018**: System MUST display all after-action records linked to a dossier on the dossier timeline or history view.
- **FR-019**: System MUST support version control for published after-action records, including:
  - Allow record creator to request edits to published records
  - Require supervisor approval before changes are applied
  - Maintain complete version history showing who requested edits, who approved, and what changed
  - Store version snapshots for audit compliance and rollback capability
- **FR-020**: System MUST enforce hybrid permission model combining role-based access control (RBAC) and dossier assignment:
  - **Staff role**: Can create and edit draft after-actions only for assigned dossiers
  - **Supervisor role**: Can publish after-actions and approve edit requests for assigned dossiers
  - **Admin role**: Full access to all operations on assigned dossiers
  - **Dossier assignment requirement**: Users MUST be assigned to parent dossier to perform ANY operations (create, read, update, delete) on its after-action records, regardless of role
  - Users cannot access after-action records for dossiers they are not assigned to
- **FR-021**: System MUST support assignment of commitments to external parties (non-system users) with the following capabilities:
  - Create external contact records capturing name, email, organization, and contact preferences
  - Send optional email notifications to external contacts upon commitment assignment, including commitment details, due date, and link to after-action record
  - Allow internal users to manually update status of external commitments (pending, in-progress, completed, cancelled)
  - Distinguish between internal commitments (automatic tracking via system) and external commitments (manual tracking) in all views, reports, and dashboards
  - Prevent duplicate external contacts with unique email constraint
- **FR-022**: System MUST implement hybrid AI extraction with intelligent sync/async mode selection:
  - **Synchronous mode**: Documents estimated to process within 5 seconds are handled immediately with loading indicator, blocking form until complete
  - **Asynchronous mode**: Larger documents processed in background (max 30 sec timeout), allowing user to proceed with manual form entry
  - Notify users via in-app notification when asynchronous extraction completes and results are ready for review
  - Merge AI-extracted data into partially-filled forms without overwriting user-entered data
  - Processing time estimation based on file size, language complexity, and system load
- **FR-023**: System MUST enforce attachment constraints for security and performance:
  - Maximum file size: 100MB per attachment
  - Maximum attachments: 10 files per after-action record
  - Allowed file types: PDF, DOCX, XLSX, PPTX, PNG, JPG, TXT, CSV (validated by MIME type)
  - Storage: Supabase Storage with signed URLs (24-hour expiry)
  - Virus scanning: ClamAV integration on upload with status tracking (pending, clean, infected, failed)
- **FR-024**: System MUST provide configurable notification system for commitment assignments:
  - Offer user settings panel where each user can configure notification preferences: in-app only, email only, both, or none
  - Respect user preferences when auto-creating commitments from published after-action records
  - Send notifications (per user preference) including commitment description, due date, after-action record link, and dossier context
  - Support bilingual notifications (Arabic/English) based on user language preference
  - Allow users to change notification preferences at any time with immediate effect
- **FR-025**: System MUST capture comprehensive audit metadata on all after-action records:
  - **Base audit**: created_by, created_at, updated_by, updated_at (standard for all entities)
  - **Publication workflow**: published_by, published_at, publication_status
  - **Edit approval workflow**: edit_requested_by, edit_requested_at, edit_request_reason, edit_approved_by, edit_approved_at, edit_rejection_reason
  - All audit fields immutable after creation (append-only pattern)
  - Audit trail accessible to supervisors and admins for compliance reviews

### Key Entities

- **After-Action Record**: Represents the complete documented outcome of an engagement, including metadata (engagement reference, creation date, author, publication date, confidentiality status), attendance list, decisions, commitments, risks, follow-up actions, and attachments. Linked to parent Dossier and originating Engagement.

- **Decision**: Captures a decision made during the engagement, including decision description, rationale, decision-maker, timestamp, and any supporting context or constraints.

- **Commitment**: Represents an agreed-upon action or deliverable, including description, assigned owner (internal user or external contact), due date, priority level, status (pending, in-progress, completed), tracking type (automatic for internal, manual for external), and link to parent After-Action Record and Dossier.

- **External Contact**: Represents a non-system user who can be assigned commitments, including name, email address, organization/affiliation, and contact history. Used for manual commitment tracking and optional email notifications.

- **Risk**: Documents a risk identified during the engagement, including risk description, severity/likelihood assessment, mitigation strategy, and owner responsible for monitoring.

- **Follow-Up Action**: Represents next steps or actions that need to occur, which may or may not have specific owners or due dates yet.

- **Engagement**: NEW ENTITY created for this feature. Represents meetings, consultations, coordination sessions, workshops, or conferences related to a dossier. Attributes: id, dossier_id (foreign key to existing dossiers table), title, engagement_type (enumeration: meeting, consultation, coordination, workshop, conference, site_visit, other), engagement_date, location, description, created_by, created_at. Relationship: Many engagements per dossier (N:1), one after-action record per engagement (1:1). This entity serves as prerequisite for after-action records and provides context for meetings that require outcome documentation. Full schema in data-model.md.

- **Task/Commitment** (unified entity): Represents an agreed-upon action or deliverable with mandatory owner assignment and due date. The system uses a single "commitments" table to represent both concepts. Tasks created from after-action records are commitments with source='after_action'. Attributes include: description, assigned owner (internal user or external contact), due date, priority level, status (pending, in-progress, completed, cancelled, overdue), tracking type (automatic for internal, manual for external), and link to parent After-Action Record and Dossier. For detailed schema see data-model.md.

- **Bilingual Summary**: The generated document containing structured after-action content in both English and Arabic, with formatting suitable for distribution and archival.

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain
- [ ] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [ ] Dependencies and assumptions identified

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked (5 critical clarifications resolved, 2 deferred to planning)
- [x] User scenarios defined
- [x] Requirements generated (25 functional requirements)
- [x] Entities identified (7 key entities)
- [ ] Review checklist passed (pending clarifications)

---

## Remaining Items for Planning Phase

The following items are better addressed during planning rather than specification:

1. **FR-023 - Attachment constraints**: File size limits, allowed file types, and storage duration (technical constraints).
2. **FR-025 - Audit metadata**: Specific audit fields beyond standard who/when tracking (implementation detail).
3. **Engagement entity relationship**: Integration with existing Dossier system data model (technical architecture).