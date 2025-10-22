# Feature Specification: After-Action Structured Documentation

**Feature Branch**: `022-after-action-structured`
**Created**: 2025-01-14
**Status**: Draft
**Platform Scope**: cross-platform
**Input**: User description: "After Action structured documentation for engagement outcomes with AI extraction and bilingual PDF generation"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quick After-Action Creation (Priority: P1)

Following a bilateral meeting about trade cooperation, a Policy Officer needs to document key outcomes: attendance, decisions made, commitments agreed upon, and identified risks. The system should provide a structured form that guides the officer through capturing all essential information, automatically creating actionable tasks, and generating a professional summary for distribution.

**Why this priority**: This is the core value proposition - replacing scattered meeting notes with centralized, structured documentation. Without this, the feature provides no value.

**Independent Test**: Can be fully tested by creating a simple after-action record after a meeting, verifying that tasks are auto-created and linked to the dossier, and delivers immediate value by organizing meeting outcomes.

**Acceptance Scenarios**:

1. **Given** a staff member completed an engagement with Country X, **When** they select "Log After-Action" from the engagement view, **Then** the system displays a structured form with sections for attendance, decisions, commitments, risks, and follow-up actions
2. **Given** the user fills out the after-action form with 3 commitments (Legal team to draft MOU by March 15, Finance to prepare budget by March 20, Policy team to schedule follow-up by April 1), **When** they submit the form, **Then** the system creates 3 individual task records, assigns them to the specified owners with due dates, links all tasks to the parent dossier, and stores the after-action record
3. **Given** the after-action record is saved, **When** viewing the parent dossier's timeline, **Then** the after-action appears as an event with all linked tasks visible
4. **Given** a commitment owner opens their task list, **When** they filter by source, **Then** they see tasks created from this after-action record with clear context and links back to the full record

*Mobile-specific scenarios:*

5. **Given** user is offline with cached engagement data, **When** they create an after-action record, **Then** the record is saved locally and queued for sync when connection is restored
6. **Given** user syncs after creating offline after-action, **When** connection is available, **Then** system uploads the record, creates linked tasks on server, and updates local references

---

### User Story 2 - AI-Assisted Data Entry (Priority: P2)

After a multi-hour conference with extensive meeting minutes, a staff member shouldn't need to manually transcribe all decisions and action items. By uploading the meeting minutes document, AI should extract structured information (who decided what, who is responsible for what actions, what risks were mentioned) with confidence scores, allowing the user to review and edit before final submission.

**Why this priority**: Significantly reduces data entry time and improves accuracy for complex meetings. Valuable enhancement but the feature works without it (manual entry).

**Independent Test**: Can be tested by uploading meeting minutes, verifying that AI extracts decisions/commitments/risks with confidence scores, and that extracted data pre-populates the form correctly. Delivers value by saving 15-30 minutes of manual transcription.

**Acceptance Scenarios**:

1. **Given** a user has meeting minutes from a 2-hour workshop (PDF document, 8 pages), **When** they upload the document to the after-action form, **Then** the system estimates processing time (<5 sec = synchronous with loading indicator, >5 sec = asynchronous with notification)
2. **Given** the AI extraction completes (either immediately or asynchronously), **When** results are ready, **Then** the form fields are pre-populated with extracted information: 5 decisions with rationale, 8 commitments with suggested owners and due dates, 3 risks with severity assessments, each item tagged with confidence score (0.0-1.0)
3. **Given** AI extracted data with varying confidence levels, **When** the user reviews the form, **Then** low-confidence items (<0.7) are visually flagged for mandatory review, and the user can edit, accept, or reject each suggestion
4. **Given** a user has already started filling the form manually, **When** AI extraction completes asynchronously, **Then** the system merges AI suggestions into empty fields only (never overwrites user-entered data) and highlights new suggestions for review

*Mobile-specific scenarios:*

5. **Given** user uploads meeting minutes on mobile device while on 4G network, **When** file size exceeds 10MB, **Then** system warns user and offers to queue upload until WiFi connection is available
6. **Given** AI extraction is processing in background, **When** user navigates away from the form, **Then** system sends push notification when extraction completes and results are ready for review

---

### User Story 3 - Bilingual Distribution Package (Priority: P2)

After documenting a high-level engagement with international stakeholders, the supervising officer needs to share outcomes with both Arabic-speaking domestic officials and English-speaking foreign counterparts. The system should generate a professional PDF summary in both languages simultaneously, formatted appropriately for distribution via email or official channels.

**Why this priority**: Critical for international cooperation work but doesn't block core documentation functionality. Can be generated on-demand rather than blocking the workflow.

**Independent Test**: Can be tested by completing an after-action record and requesting PDF generation, verifying that both English and Arabic versions are created with proper formatting, RTL support for Arabic, and all content accurately translated. Delivers value by eliminating manual translation and formatting work.

**Acceptance Scenarios**:

1. **Given** a published after-action record contains decisions, commitments, risks, and follow-ups, **When** the user selects "Generate Distribution Summary", **Then** the system produces two PDF documents (English and Arabic) containing all captured information with professional formatting, organization logos, date/time stamps, and participant lists
2. **Given** the Arabic PDF is generated, **When** viewing the document, **Then** all text is properly right-to-left oriented, Arabic numerals are used where appropriate, and layout mirrors the English version appropriately
3. **Given** the bilingual PDFs are generated, **When** the user downloads them, **Then** files are named with clear language indicators (e.g., "AfterAction_TradeWorkshop_2025-01-14_EN.pdf" and "AfterAction_TradeWorkshop_2025-01-14_AR.pdf")
4. **Given** after-action contains confidential information, **When** generating PDFs, **Then** documents include appropriate confidentiality markings in both languages and watermarks indicating classification level

---

### User Story 4 - Edit Workflow with Approvals (Priority: P3)

Three days after publishing an after-action record, a staff member realizes they forgot to include an important commitment discussed during the meeting. Since the record has already been distributed, changes should require supervisor approval to maintain audit integrity and ensure all stakeholders are notified of updates.

**Why this priority**: Important for governance and audit compliance but not required for initial feature launch. Can be added after core functionality is proven.

**Independent Test**: Can be tested by publishing a record, requesting an edit, having supervisor approve/reject the change, and verifying that version history is maintained. Delivers value by enabling corrections while maintaining accountability.

**Acceptance Scenarios**:

1. **Given** a published after-action record exists, **When** the creator selects "Request Edit", **Then** the system prompts for edit reason, creates an editable draft copy, notifies the creator's supervisor, and marks the published version as "Edit Pending"
2. **Given** a supervisor receives an edit request notification, **When** they review the proposed changes (side-by-side diff view showing original vs. proposed), **Then** they can approve (changes applied, new version published, stakeholders notified) or reject (original retained, creator notified with feedback option)
3. **Given** an edit is approved, **When** viewing the after-action version history, **Then** all versions are preserved with metadata: who requested edit, when, edit reason, who approved, when, what changed (field-level diff)
4. **Given** multiple users are viewing the same after-action record, **When** an edit is approved and published, **Then** all active viewers receive a realtime notification that the record was updated with option to reload

*Mobile-specific scenarios:*

5. **Given** supervisor receives edit approval request on mobile, **When** they open the notification, **Then** they see a mobile-optimized diff view with swipe gestures to compare versions and can approve/reject with biometric confirmation

---

### User Story 5 - External Participant Management (Priority: P3)

During a coordination meeting with non-government partners, several action items are assigned to external contacts who don't have system accounts (e.g., NGO representatives, academic researchers, private sector consultants). The system should allow creating external contact records and assigning them commitments, with optional email notifications and manual status tracking.

**Why this priority**: Handles edge case of mixed internal/external meetings but adds complexity. Most meetings involve internal staff only, so this can be deferred.

**Independent Test**: Can be tested by creating external contact records, assigning them commitments, verifying email notifications are sent (if configured), and testing manual status updates by internal users. Delivers value by tracking external dependencies without requiring external users to have accounts.

**Acceptance Scenarios**:

1. **Given** a commitment needs to be assigned to an external party, **When** the user selects "Add External Contact" in the commitment section, **Then** the system displays a form to capture name, email, organization, and contact preferences (email notifications yes/no)
2. **Given** an external contact is assigned a commitment with email notifications enabled, **When** the after-action is published, **Then** the system sends an email to the external contact containing commitment description, due date, context about the engagement, and a public link to view the after-action summary (if not confidential)
3. **Given** external commitments exist, **When** internal users view the commitment list, **Then** external commitments are clearly marked with "External" badge, show manual status tracking controls (staff can update status on behalf of external contact), and display last status update timestamp and updater
4. **Given** an email to external contact bounces, **When** the system receives the bounce notification, **Then** the commitment is flagged with "Email Delivery Failed", the creator is notified, and alternative contact methods are suggested

---

### Edge Cases

- What happens when a user tries to log an after-action for an engagement that doesn't exist? → System should validate engagement ID and return clear error message directing user to create engagement first
- How does the system handle partial completion if the user saves a draft but doesn't publish? → Drafts saved with "Draft" status, visible only to creator until published, no tasks created from draft commitments
- What if AI extraction produces low-confidence results or cannot parse the meeting minutes? → All items flagged for manual review, user can proceed with manual entry, system logs extraction failure for quality monitoring
- What happens if an external contact's email bounces or is invalid? → Commitment flagged, creator notified, system suggests verifying email address or using alternative contact method
- How are duplicate external contacts prevented (same person added multiple times)? → Email uniqueness constraint at database level, UI search suggests existing contacts before allowing new creation
- What if a supervisor rejects an edit request - can the creator revise and resubmit? → Yes, creator receives rejection with optional feedback, can revise and submit new edit request
- What if multiple edits are requested before the first is approved? → System queues edit requests, only one active at a time, subsequent requests wait for resolution of prior request
- How does the system handle very large attachments or numerous follow-up items? → File size limit 100MB per attachment, max 10 attachments per record, UI paginated for >20 commitments
- What happens if bilingual summary generation fails for one language but succeeds for the other? → Partial success: successful PDF available for download, failed language shows error message with retry option, error logged for troubleshooting

## Mobile Requirements *(mandatory for mobile-only or cross-platform features)*

### Offline Behavior *(for data-heavy features only)*

- **Offline Access**: Users can view previously synced after-action records and engagements offline. Users can create new after-action records offline, which are queued for sync when connection is restored. Offline-created records are marked with "Pending Sync" badge.
- **Sync Requirements**: Manual sync via pull-to-refresh on after-action list screen. Auto-sync on app foreground if >5 minutes since last sync. Background sync every 15 minutes if app is in background and WiFi available. Incremental sync: only fetch records modified since last sync timestamp.
- **Conflict Scenarios**: If same after-action record edited on web and mobile while offline, user is prompted during sync with three-way merge view: keep web version, keep mobile version, or manual merge. If engagement deleted on web while mobile user creates after-action offline, sync shows error requiring user to select alternative engagement or discard.

### Native Features *(if applicable)*

- **Biometrics**: Touch ID/Face ID required when creating or viewing after-action records marked as confidential. Biometric confirmation required for supervisors approving edit requests on mobile.
- **Camera**: Document scanning for meeting minutes with auto-crop and perspective correction. Photo capture for attaching visual evidence (whiteboard photos, signed documents). Built-in PDF scanner with multi-page stitching.
- **Push Notifications**:
  - Notification when AI extraction completes (for async processing)
  - Notification when commitment due date approaches (24 hours before)
  - Notification when assigned as commitment owner
  - Notification when edit request requires supervisor approval
  - Notification when edit request is approved/rejected
  - Notification when external contact's email bounces

### Mobile Performance Criteria

- **SC-M01**: After-action form initial render ≤1s on 4G network
- **SC-M02**: After-action record list load ≤2s for 50 records with full metadata
- **SC-M03**: Incremental sync completes ≤3s for typical dataset (10 updated records)
- **SC-M04**: AI extraction status check polling interval ≤5s with <100ms response time
- **SC-M05**: Offline record creation with 5 commitments saves ≤500ms to local database

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow authorized users to create an after-action record linked to a specific engagement, capturing engagement context (title, date, participants, location)
- **FR-002**: System MUST provide structured form sections for documenting: attendance (participant list with roles), decisions (description, rationale, decision-maker, timestamp), commitments (description, owner, due date, priority), risks (description, severity, mitigation strategy, owner), follow-up actions (description, optional owner/date)
- **FR-003**: System MUST automatically create individual task/commitment entities from logged commitments with all metadata (description, owner, due date, priority, status, source=after_action, link to parent after-action record and dossier)
- **FR-004**: System MUST link all auto-created tasks back to originating after-action record for bidirectional traceability (after-action → tasks, tasks → after-action)
- **FR-005**: System MUST support draft mode allowing users to save incomplete after-action records and resume editing later before final publication (draft visible only to creator)
- **FR-006**: System MUST provide review step before submission where users verify all captured information in read-only preview before final publish
- **FR-007**: System MUST enforce step-up authentication (biometric or password re-entry) when publishing after-action records marked as confidential or generating confidential distribution PDFs
- **FR-008**: System MUST accept meeting minutes or notes (PDF, DOCX, TXT formats) as input and use AI to extract structured information with confidence scores (0.0-1.0) for each extracted item
- **FR-009**: System MUST intelligently select synchronous (≤5 sec estimated) or asynchronous (>5 sec estimated) AI processing mode based on document size, language complexity, and system load, providing appropriate UX for each mode (loading indicator for sync, background processing + notification for async)
- **FR-010**: System MUST pre-populate form fields with AI-extracted data while allowing full user review and editing before submission, with low-confidence items (<0.7) visually flagged for mandatory review
- **FR-011**: System MUST merge asynchronously-extracted AI suggestions into partially-filled forms without overwriting user-entered data, highlighting new suggestions for user review
- **FR-012**: System MUST suggest commitment owners and due dates based on engagement context, participant roles, and historical assignment patterns when AI processes meeting minutes
- **FR-013**: System MUST generate bilingual summary document in both English and Arabic simultaneously, with professional formatting, organization branding, participant lists, and all captured content
- **FR-014**: System MUST produce distribution-ready PDF files for both languages with proper RTL support for Arabic (right-to-left text flow, mirrored layout, Arabic numerals where appropriate), clear language indicators in filenames, and confidentiality markings if applicable
- **FR-015**: System MUST display all after-action records linked to a dossier on the dossier timeline/history view with visual indicators for status (draft, published, edit pending) and quick preview of key content (decisions count, commitments count, participants)
- **FR-016**: System MUST support post-publication edit workflow: creator requests edit with reason, system creates editable draft copy, supervisor receives approval request with side-by-side diff view, supervisor approves or rejects with optional feedback
- **FR-017**: System MUST maintain complete version history for published after-action records showing: version number, who requested edit, when, edit reason, who approved/rejected, when, field-level change diff, version snapshots for audit and potential rollback
- **FR-018**: System MUST enforce hybrid permission model combining role-based access control (RBAC) and dossier assignment: Staff can create/edit drafts for assigned dossiers only, Supervisors can publish and approve edits for assigned dossiers only, Admins have full access to assigned dossiers only, users cannot access after-actions for unassigned dossiers regardless of role
- **FR-019**: System MUST support assignment of commitments to external parties (non-system users) by creating external contact records (name, email, organization, contact preferences), sending optional email notifications upon assignment (commitment details, due date, context, public link to summary if not confidential), allowing internal users to manually update external commitment status (pending, in-progress, completed, cancelled), and distinguishing between internal (automatic tracking) and external (manual tracking) commitments in all views
- **FR-020**: System MUST prevent duplicate external contacts with email uniqueness constraint at database level and UI search suggesting existing contacts before allowing new creation
- **FR-021**: System MUST enforce attachment constraints: max file size 100MB per attachment, max 10 attachments per after-action record, allowed file types (PDF, DOCX, XLSX, PPTX, PNG, JPG, TXT, CSV) validated by MIME type, storage via secure service with signed URLs (24-hour expiry), virus scanning on upload with status tracking (pending, clean, infected, failed)
- **FR-022**: System MUST provide configurable per-user notification preferences (in-app only, email only, both, none) for commitment assignments, respecting preferences when auto-creating commitments from published after-actions, sending notifications with bilingual support based on user language preference
- **FR-023**: System MUST capture comprehensive audit metadata: base audit (created_by, created_at, updated_by, updated_at), publication workflow (published_by, published_at, publication_status), edit approval workflow (edit_requested_by, edit_requested_at, edit_request_reason, edit_approved_by, edit_approved_at, edit_rejection_reason), all audit fields immutable after creation (append-only pattern)
- **FR-024**: System MUST provide realtime notifications to all active viewers when an after-action record is updated via approved edit, offering option to reload and view changes
- **FR-025**: System MUST handle email delivery failures for external contacts by flagging commitment with "Email Delivery Failed" badge, notifying creator, and suggesting alternative contact methods

### Key Entities

- **Engagement**: Represents meetings, consultations, coordination sessions, or workshops related to a dossier. Contains title, type (meeting/consultation/coordination/workshop/conference/site_visit), date, location, description, participant list, and link to parent dossier. Prerequisite for creating after-action records.

- **After-Action Record**: Complete documented outcome of an engagement including metadata (engagement reference, creation date, author, publication date, confidentiality level, draft/published status), attendance list, decisions, commitments, risks, follow-up actions, and attachments. Linked to parent dossier and originating engagement. Supports version control and edit approval workflow.

- **Decision**: Captures a decision made during engagement with description, rationale, decision-maker name/role, timestamp, and supporting context. Part of after-action record.

- **Commitment**: Agreed-upon action or deliverable with mandatory fields: description, assigned owner (internal user ID or external contact ID), due date, priority level (low/medium/high/critical), status (pending/in-progress/completed/cancelled/overdue), tracking type (automatic for internal users, manual for external contacts), source indicator (after_action), links to parent after-action record and parent dossier. Automatically creates task entity when after-action is published.

- **External Contact**: Non-system user who can be assigned commitments. Contains name, email (unique), organization/affiliation, contact preferences (receive emails yes/no), contact history log. Used for manual commitment tracking and optional email notifications.

- **Risk**: Risk identified during engagement with description, severity assessment (low/medium/high/critical), likelihood assessment (rare/unlikely/possible/likely/certain), mitigation strategy, owner responsible for monitoring. Part of after-action record.

- **Follow-Up Action**: Next steps or actions needed with description and optional owner/due date (may be TBD initially). Part of after-action record.

- **Attachment**: Supporting document or evidence with file metadata (name, size, type, storage URL, upload timestamp, uploaded by), virus scan status (pending/clean/infected/failed), and link to parent after-action record. Max 10 per record, max 100MB each.

- **Version Snapshot**: Historical version of after-action record for audit and rollback. Contains full record content at time of version creation, version number, version creation metadata (who, when, why), change diff (field-level comparison to previous version), approval metadata (who approved/rejected, when, feedback). Immutable after creation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete after-action creation for a standard meeting (5 participants, 3 decisions, 5 commitments, 2 risks) in under 10 minutes with manual entry, or under 5 minutes with AI-assisted extraction
- **SC-002**: AI extraction accuracy for decisions and commitments achieves ≥85% precision (extracted items are correct) and ≥80% recall (no important items missed) based on manual validation of 100 diverse meeting minutes
- **SC-003**: 95% of AI-extracted items have confidence scores ≥0.7, requiring minimal manual review and editing
- **SC-004**: Bilingual PDF generation completes within 30 seconds for typical after-action record (10 pages of content) with proper formatting for both English and Arabic versions
- **SC-005**: System supports 100 concurrent users creating or editing after-action records without performance degradation (response time <2s for form saves)
- **SC-006**: Zero data loss during offline mobile usage: 100% of offline-created after-action records successfully sync when connection is restored (tested with 1000 records)
- **SC-007**: Edit approval workflow completes within 24 hours: 90% of edit requests receive supervisor response within 1 business day (measured over 3-month period)
- **SC-008**: Task assignment and notification system achieves 100% delivery rate for in-app notifications and ≥98% delivery rate for email notifications within 5 minutes of after-action publication
- **SC-009**: External contact email bounce rate <5% through proactive email validation and suggested correction during contact creation
- **SC-010**: AI Extraction Accuracy
  - AI extraction service achieves ≥80% precision and ≥75% recall on validation dataset
  - Validation dataset composition:
    - 50 real meeting minutes documents (25 English, 25 Arabic)
    - Minimum 10 pages average length
    - Sourced from past 12 months of diplomatic engagements
    - Manually annotated with ground truth entities (decisions, commitments, risks)
    - Includes edge cases: mixed-language minutes, handwritten notes (OCR), incomplete information
  - Confidence scores correlate with actual accuracy (within ±10% margin)
  - Historical pattern analysis suggests correct commitment owner ≥70% of time (when historical data available)
- **SC-011**: Version history and audit trail storage grows at predictable rate: <2MB per after-action record including all versions, changes, and metadata (tested with 1000 records over 6-month period)
- **SC-012**: User satisfaction score ≥4.0/5.0 for after-action feature based on monthly survey asking about ease of use, time savings, and value delivered
- **SC-013**: Adoption rate reaches 80% of all engagements having associated after-action records within 3 months of feature launch (baseline: 0% today)
- **SC-014**: Average time from engagement completion to after-action publication reduces from current baseline of 7 days (email-based documentation) to ≤2 days with structured system

## Assumptions *(if applicable)*

- Users have reliable internet connectivity during working hours (4G or WiFi) for web version; mobile app provides offline capability for field work scenarios
- Meeting minutes are available in digital format (PDF, DOCX, or TXT) within 24-48 hours after engagement completion
- AI extraction service (AnythingLLM) is self-hosted and available with <5s response time for typical documents under synchronous threshold
- Supervisors check their notifications at least once per business day for timely edit approval workflow
- External contacts have valid email addresses and are willing to receive occasional email notifications (opt-out available)
- Organization has standardized email templates and branding guidelines for distribution PDF formatting
- Virus scanning service (ClamAV) is integrated and operational for all file uploads
- User language preference is set correctly in profile for bilingual content delivery
- Dossier assignment model is already implemented and functioning (prerequisite for permission model)
- Engagement entity creation workflow is available (prerequisite for after-action creation)
- Task/commitment entity schema supports source tracking and bidirectional linking

## Dependencies *(if applicable)*

- **Dossier Management System**: After-action records link to parent dossiers; requires dossier ID validation and assignment checking
- **Engagement Management**: After-action records link to engagements; requires engagement entity with participant lists and metadata
- **Task/Commitment System**: Auto-created tasks from after-actions integrate with existing task management features
- **User Management & Roles**: Permission model depends on role definitions (staff/supervisor/admin) and dossier assignment data
- **AI Service (AnythingLLM)**: AI extraction depends on self-hosted AnythingLLM instance with configured models for Arabic and English text understanding
- **Storage Service**: Attachment storage depends on secure file storage with signed URL generation and virus scanning integration
- **Notification System**: Email and push notification infrastructure for commitment assignments, edit approvals, and async processing completion
- **PDF Generation Library**: Bilingual PDF generation depends on PDF library with RTL support and Arabic font rendering
- **Translation Service**: Manual translation is assumed. When users create after-action records, they must provide content in both English and Arabic manually. The system will NOT auto-translate content. However, the system will validate that both language versions are provided before allowing publication (FR-004). Auto-translation may be considered as a future enhancement post-MVP.
- **Mobile Sync Infrastructure**: Offline-first mobile app depends on sync API with conflict resolution and incremental update support
- **Biometric Authentication**: Mobile step-up authentication for confidential records depends on device biometric capabilities (Touch ID/Face ID)

## Out of Scope *(if applicable)*

- **Automatic meeting recording transcription**: Feature only accepts pre-existing meeting minutes; does not integrate with audio/video recording tools for automatic transcription
- **Real-time collaborative editing**: Multiple users cannot simultaneously edit the same draft after-action record; no Google Docs-style live collaboration
- **Custom PDF templates per department**: Single standardized template for distribution PDFs; no per-department or per-dossier custom branding/layout
- **Integration with external task management tools**: Auto-created tasks live only within the system; no sync to external tools (Jira, Asana, Trello, etc.)
- **Automatic commitment progress tracking for external contacts**: External commitments require manual status updates by internal users; no email check-ins or progress prompts sent to external contacts
- **Multi-level approval chains**: Edit approval requires single supervisor approval only; no support for multi-stage approval workflows (staff → supervisor → manager → director)
- **Automated follow-up reminders for overdue commitments**: System does not automatically send escalating reminders for overdue commitments; users must manually monitor and follow up
- **Integration with calendar systems**: Engagement dates and follow-up actions are not automatically synced to external calendars (Outlook, Google Calendar)
- **Advanced analytics and reporting**: No built-in dashboards for after-action trends, commitment completion rates, or engagement effectiveness metrics (may be added in future phase)
- **Custom fields or sections**: After-action form structure is fixed; users cannot add custom sections or fields per engagement type or department
