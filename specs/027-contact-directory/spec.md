# Feature Specification: Contact Directory

**Feature Branch**: `027-contact-directory`
**Created**: 2025-10-26
**Status**: Draft
**Input**: User description: "I need to build Contact Directory - Manage contacts, stakeholders, and key personnel across organizations and partnerships. it should consider easy addition of persons business cards and from invitation letters and other correspondence"

## Platform Scope

**Platform**: Cross-platform (phased rollout)
- **Phase 1 (Weeks 1-6)**: Web PWA with responsive mobile-first UI, camera API for business card scanning, service workers for offline capability
- **Phase 2 (Weeks 9-12)**: Mobile native integration into existing Expo app with enhanced camera controls, WatermelonDB offline-first sync, and biometric protection

**Rationale**: Contact Directory is a natural complement to the existing mobile app (field staff already use GASTAT mobile app for dossiers and briefs). Phased rollout allows rapid delivery to all users (web) while leveraging existing mobile infrastructure (Expo SDK 52+, WatermelonDB, React Native Paper) for incremental mobile enhancement. Phase 1 delivers 80% of value to 100% of users in 6 weeks. Phase 2 adds native mobile polish for field staff (20% of users, 40% of usage time) in additional 3 weeks.

**Web Capabilities (Phase 1)**: Camera API via getUserMedia(), IndexedDB for offline storage, service workers for background sync, push notifications via web push API

**Mobile Enhancements (Phase 2)**: Native camera controls (focus, flash, resolution), WatermelonDB offline-first sync, biometric authentication for sensitive contacts, integrated workflow with existing dossier management

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manual Contact Entry (Priority: P1)

A staff member meets a stakeholder at a conference and needs to quickly add their contact information to the directory, including their name, organization, position, email, and phone number. This information needs to be searchable and accessible by other team members working on similar partnerships.

**Why this priority**: Core functionality that enables basic contact management. Without this, no other features can function. Delivers immediate value by centralizing contact information.

**Independent Test**: Can be fully tested by creating a new contact with complete information, searching for it, and verifying all fields are saved and retrievable. Delivers immediate value by making contact information accessible to the team.

**Acceptance Scenarios**:

1. **Given** I am logged into the system, **When** I navigate to the contact directory and click "Add Contact", **Then** I see a form to enter contact details (name, organization, position, email, phone, notes)
2. **Given** I have filled in required contact fields (name, organization), **When** I submit the form, **Then** the contact is saved and appears in my contact list
3. **Given** I have added a contact, **When** I search for their name or organization, **Then** the contact appears in search results with key information visible

**Mobile-Specific Acceptance (Phase 2)**:

1. **Given** I am offline on mobile, **When** I create a new contact, **Then** the contact is saved to local WatermelonDB storage and queued for sync
2. **Given** I have created contacts offline, **When** connection is restored, **Then** contacts automatically sync to Supabase backend within 3 seconds
3. **Given** I search for contacts on mobile, **When** I am offline, **Then** I can search through all locally cached contacts with "Last synced: [timestamp]" indicator
4. **Given** another user updates a contact I'm viewing, **When** I also edit the same contact offline, **Then** system detects conflict on sync and prompts me to resolve (keep mine, keep theirs, or merge)

---

### User Story 2 - Business Card Scanning (Priority: P2)

A staff member returns from a networking event with multiple business cards. They need to digitize these contacts quickly without manual typing. They take a photo of the business card, and the system automatically extracts name, organization, position, email, and phone number, allowing them to review and save the information.

**Why this priority**: Significantly reduces data entry time and errors. Common use case at conferences and meetings. Makes contact capture 10x faster.

**Independent Test**: Can be tested by uploading/photographing a business card image, verifying extracted fields are pre-populated correctly, and saving the contact. Delivers value by automating manual data entry.

**Acceptance Scenarios**:

1. **Given** I have a business card photo, **When** I select "Scan Business Card" and upload/capture the image, **Then** the system extracts text from the card
2. **Given** the system has extracted text from a business card, **When** the extraction completes, **Then** I see a form pre-populated with detected fields (name, organization, position, email, phone) for review
3. **Given** I have reviewed the extracted information, **When** I correct any errors and save, **Then** the contact is added to the directory with the finalized information
4. **Given** the business card has text in Arabic or English, **When** I scan it, **Then** the system correctly extracts information regardless of language

**Mobile-Specific Acceptance (Phase 2)**:

1. **Given** I am using mobile app, **When** I select "Scan Business Card", **Then** native camera opens with focus controls, flash toggle, and high-resolution capture
2. **Given** I am offline on mobile, **When** I scan a business card, **Then** image is saved locally, OCR queued for processing, and "Will process when online" message shown
3. **Given** I have queued business cards offline, **When** connection restores, **Then** OCR processes queued cards automatically and notifies me when extraction completes
4. **Given** I scan a business card on mobile, **When** extraction completes, **Then** I can use biometric authentication (Face ID/Touch ID) to protect contact before saving

---

### User Story 3 - Extract Contacts from Documents (Priority: P3)

A staff member receives an invitation letter listing multiple attendees from partner organizations. Instead of manually entering each person, they upload the letter (PDF, Word, or image), and the system identifies and extracts contact information for all mentioned individuals, creating multiple contact entries at once.

**Why this priority**: Handles bulk contact import scenarios common in diplomatic correspondence. Saves significant time when processing multi-person documents like event invitations, meeting minutes, or partnership agreements.

**Independent Test**: Can be tested by uploading a document with multiple contacts (e.g., invitation letter), verifying the system identifies all contacts, reviewing extracted information, and batch-saving them. Delivers value by eliminating repetitive manual entry.

**Acceptance Scenarios**:

1. **Given** I have a document (PDF, Word, image) with contact information, **When** I select "Extract from Document" and upload it, **Then** the system processes the document and identifies potential contacts
2. **Given** the system has processed a document, **When** extraction completes, **Then** I see a list of detected contacts with extracted fields for each person
3. **Given** I see the list of extracted contacts, **When** I review and edit any incorrect information, **Then** I can select which contacts to import and save them all at once
4. **Given** the document contains organizational context (e.g., "John Smith from ACME Corp"), **When** contacts are extracted, **Then** organizational affiliations are automatically captured

**Mobile-Specific Acceptance (Phase 2)**:

1. **Given** I am offline on mobile, **When** I upload a document with contacts, **Then** document is stored locally and queued for extraction with "Processing when online" status
2. **Given** I have queued documents, **When** connection restores, **Then** extraction processes automatically and I receive push notification when complete
3. **Given** I extract contacts from a document on mobile, **When** I am on 3G/4G network, **Then** extraction completes within 30 seconds (vs 20 seconds on wifi) with progress indicator
4. **Given** I have extracted multiple contacts on mobile, **When** reviewing the batch, **Then** I can swipe left/right to navigate between contacts and batch-select for import

---

### User Story 4 - Contact Organization & Relationships (Priority: P4)

A staff member needs to understand the network of contacts related to a specific partnership. They can view contacts grouped by organization, see relationships between individuals (e.g., reporting structures, collaboration partners), and tag contacts with relevant topics or projects for easier filtering.

**Why this priority**: Provides organizational intelligence beyond simple contact storage. Helps staff understand stakeholder ecosystems and identify key decision-makers. Enables strategic relationship management.

**Independent Test**: Can be tested by creating multiple contacts with organizational affiliations and relationships, then viewing them grouped by organization and filtering by tags. Delivers value by providing contextual intelligence about contact networks.

**Acceptance Scenarios**:

1. **Given** I have multiple contacts from the same organization, **When** I view the contact directory, **Then** I can group contacts by organization to see all members together
2. **Given** I am viewing a contact's profile, **When** I add relationship information (e.g., "Reports to", "Collaborates with"), **Then** the relationship is saved and visible when viewing either contact
3. **Given** I need to find contacts related to a specific project or topic, **When** I tag contacts with project names or topics, **Then** I can filter the directory by tags to see relevant contacts
4. **Given** I am viewing a contact, **When** I select "View Network", **Then** I see a visual representation of their organizational relationships and connections

**Mobile-Specific Acceptance (Phase 2)**:

1. **Given** I view the relationship graph on mobile, **When** I am offline, **Then** graph renders using cached contact and relationship data with "Offline - showing cached data" indicator
2. **Given** I add a relationship on mobile while offline, **When** connection restores, **Then** relationship syncs automatically and appears in web interface within 3 seconds
3. **Given** I view contact network on mobile, **When** tapping a contact node, **Then** I can use pinch-to-zoom and pan gestures to navigate the relationship graph
4. **Given** I filter contacts by tag on mobile, **When** I am offline, **Then** filtering works on locally cached contacts and tags

---

### User Story 5 - Contact History & Notes (Priority: P5)

A staff member is preparing for a follow-up meeting with a stakeholder. They need to review previous interactions, notes from past meetings, and any commitments made. They can view a timeline of interactions and add new notes after each engagement.

**Why this priority**: Ensures institutional knowledge is preserved and accessible. Prevents loss of context when staff transition or work collaboratively. Improves relationship continuity.

**Independent Test**: Can be tested by adding interaction notes to a contact, viewing the timeline of interactions, and verifying notes are searchable. Delivers value by preserving organizational memory.

**Acceptance Scenarios**:

1. **Given** I am viewing a contact, **When** I click "Add Note", **Then** I can record the date, type of interaction (meeting, email, call), and details about the engagement
2. **Given** I have added multiple notes to a contact, **When** I view their profile, **Then** I see a chronological timeline of all recorded interactions
3. **Given** I need to prepare for a meeting, **When** I search my notes for specific topics or keywords, **Then** I see all relevant notes across all contacts mentioning those topics
4. **Given** I am viewing interaction notes, **When** I filter by date range or interaction type, **Then** I see only notes matching those criteria

**Mobile-Specific Acceptance (Phase 2)**:

1. **Given** I add an interaction note on mobile while offline, **When** I save, **Then** note is stored locally with sync_pending flag and "Will sync when online" confirmation
2. **Given** I have pending notes to sync, **When** connection restores, **Then** notes sync automatically in background within 5 seconds and sync_pending flag clears
3. **Given** another user adds a note to the same contact while I'm offline, **When** I sync, **Then** timeline merges both notes chronologically without conflict (notes are append-only)
4. **Given** I attach a file to a note on mobile, **When** I am offline, **Then** attachment queues for upload and I see "Attachment will upload when online" status
5. **Given** I search notes on mobile while offline, **When** I enter keywords, **Then** search works across all locally cached notes with "Offline search - cached notes only" indicator

---

### Edge Cases

- What happens when scanning a business card produces incomplete or incorrect extraction (e.g., poor image quality, non-standard card layout)?
- How does the system handle duplicate contacts (same person added multiple times from different sources)?
- What happens when extracting contacts from a document that contains ambiguous information (e.g., multiple phone numbers without clear attribution)?
- How does the system handle contacts with minimal information (e.g., only name and email)?
- What happens when a contact's organizational affiliation changes (e.g., person moves to a new organization)?
- How does the system handle Arabic names with diacritics or Western names with special characters?
- What happens when trying to extract from a large document (50+ pages) with many potential contacts?
- How does the system handle privacy and access permissions (who can view which contacts)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to manually create contact entries with fields: full name (required), organization (required), position/title (optional), email (optional), phone (optional), notes (optional)
- **FR-002**: System MUST validate email addresses to ensure proper format
- **FR-003**: System MUST support adding contacts by scanning/uploading business card images (JPEG, PNG, PDF)
- **FR-004**: System MUST extract text from business card images using OCR technology
- **FR-005**: System MUST intelligently parse extracted text to identify contact fields (name, organization, position, email, phone) with at least 80% accuracy for standard business card layouts
- **FR-006**: System MUST present extracted information for user review and correction before saving
- **FR-007**: System MUST support uploading documents (PDF, Word, images) for bulk contact extraction
- **FR-008**: System MUST identify and extract multiple contacts from a single document
- **FR-009**: System MUST support both Arabic and English text extraction from images and documents
- **FR-010**: System MUST detect and warn users about potential duplicate contacts based on name and organization matching
- **FR-011**: System MUST allow users to search contacts by name, organization, position, email, or tags
- **FR-012**: System MUST support grouping contacts by organization
- **FR-013**: System MUST allow users to define relationships between contacts (e.g., "Reports to", "Collaborates with", "Partner")
- **FR-014**: System MUST support tagging contacts with topics, projects, or categories for filtering
- **FR-015**: System MUST allow users to add interaction notes to contacts with date, type (meeting, email, call, other), and details
- **FR-016**: System MUST display a chronological timeline of interactions for each contact
- **FR-017**: System MUST allow searching across all notes by keywords or topics
- **FR-018**: System MUST support filtering notes by date range and interaction type
- **FR-019**: System MUST handle contact information updates (e.g., organizational changes) while preserving historical data
- **FR-020**: System MUST support role-based access control to protect sensitive contact information based on user permissions
- **FR-021**: System MUST export contact lists to standard formats (CSV, vCard) for integration with other systems
- **FR-022**: System MUST log all contact creation, updates, and access for audit purposes
- **FR-023**: System MUST support bilingual display (Arabic/English) for all contact fields and interface elements
- **FR-024**: System MUST allow users to view, download, and delete uploaded source documents (business cards, letters) associated with contacts

### Key Entities *(include if feature involves data)*

- **Contact**: Represents an individual person with attributes: full name, organization affiliation, position/title, email addresses (multiple), phone numbers (multiple), notes, tags, creation date, last updated date, created by user
- **Organization**: Represents an organization or partnership entity with attributes: organization name, type (government, NGO, private sector, international), country, contact persons (linked contacts), primary address
- **Interaction Note**: Represents a recorded engagement with a contact with attributes: date, type (meeting, email, call, other), details/summary, related contacts (if group meeting), created by user, attachments
- **Relationship**: Represents a connection between two contacts with attributes: from contact, to contact, relationship type (reports to, collaborates with, partner, etc.), start date, end date (if relationship ended)
- **Tag**: Represents a categorization label with attributes: tag name, category (project, topic, region, etc.), color/icon for visual identification
- **Document Source**: Represents an uploaded document used for contact extraction with attributes: file name, file type, upload date, extracted contacts count, processing status

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a new contact manually in under 1 minute
- **SC-002**: Business card scanning extracts contact information with 80%+ accuracy for standard layouts, requiring minimal user correction
- **SC-003**: Users can scan and save a business card in under 30 seconds (including review/correction time)
- **SC-004**: Document extraction identifies and presents contacts for review within 2 minutes for documents up to 20 pages
- **SC-005**: Users can find any contact using search in under 5 seconds
- **SC-006**: 90% of users successfully complete their primary task (add contact, search contact, add note) on first attempt without training
- **SC-007**: System reduces time spent on manual contact entry by 70% compared to typing from business cards
- **SC-008**: Contact directory is accessible and searchable by all authorized team members with appropriate permissions
- **SC-009**: Zero data loss incidents - all contact information and notes are reliably persisted and retrievable
- **SC-010**: System supports at least 10,000 contacts with search/filter operations completing in under 2 seconds

## Assumptions *(mandatory)*

- Users have access to mobile devices with cameras for business card capture (or can upload pre-captured images)
- Uploaded documents are in common formats (PDF, Word, JPEG, PNG) and do not exceed 50 pages
- OCR accuracy depends on image quality; users will review and correct extracted information before saving
- Standard authentication and authorization mechanisms exist in the platform for role-based access control
- Contact data does not include highly sensitive information requiring encryption at rest beyond database-level encryption (if it does, additional security requirements will be needed)
- Users are familiar with basic contact management concepts and can identify organizational relationships
- Internet connectivity is available for OCR processing (or OCR library is available locally)
- The system will integrate with existing organizational database schemas (dossiers, organizations, etc.) where applicable

## Out of Scope

- **Email integration**: Automatically creating contacts from email signatures or email client sync (may be considered in future phases)
- **Calendar integration**: Syncing contact meetings with calendar systems
- **Social media enrichment**: Automatically pulling contact information or updates from LinkedIn, Twitter, etc.
- **Advanced CRM features**: Sales pipelines, deal tracking, revenue forecasting
- **Mass email campaigns**: Bulk emailing contacts from the directory
- **Mobile-specific native apps**: This specification assumes responsive web interface; native mobile apps are out of scope
- **Real-time collaboration**: Multiple users editing the same contact simultaneously (last write wins is acceptable)
- **Automated duplicate merging**: System warns about duplicates but requires manual merge decisions
- **Contact lifecycle workflows**: Automated workflows for onboarding, offboarding, or periodic contact updates

## Dependencies

- **OCR Service/Library**: Requires integration with an OCR engine (e.g., Tesseract, Google Cloud Vision, Azure Computer Vision) for text extraction from images
- **Document Parsing Library**: Requires a library or service to extract text from PDF and Word documents
- **Existing Authentication System**: Assumes platform-level authentication and authorization mechanisms are in place
- **Database Schema**: Integration with existing organizational and dossier schemas in the platform
- **Internationalization (i18n) Framework**: Assumes existing i18next setup for bilingual support
- **File Upload/Storage**: Assumes existing file storage infrastructure (e.g., Supabase Storage) for uploaded documents and business cards

## Security & Privacy Considerations

- **Access Control**: Contact information must be protected by role-based access control; not all users should see all contacts
- **Audit Logging**: All contact views, edits, and deletions must be logged for compliance and security review
- **Data Retention**: Contact data and interaction notes must be retained for 7 years to comply with international organization standards and regulatory requirements
- **PII Protection**: Contact information is personally identifiable information (PII) and must be handled according to privacy regulations (GDPR, local privacy laws)
- **Export Control**: Contact exports (CSV, vCard) must respect access permissions; users should only export contacts they have permission to view
- **Document Storage**: Uploaded documents (business cards, letters, correspondence) used for extraction are retained indefinitely for reference and audit purposes, with users having the option to manually delete documents they no longer need
- **Secure Transmission**: All business card images and documents uploaded must be transmitted over secure connections (HTTPS)

## Performance Considerations

- **Search Performance**: Contact search and filtering must complete in under 2 seconds for directories with up to 10,000 contacts
- **OCR Processing**: Business card OCR should complete in under 15 seconds for standard image sizes (< 5MB)
- **Document Processing**: Bulk extraction from documents should process at least 1 page per second (up to 20-page documents in under 30 seconds)
- **Scalability**: System should support at least 500 concurrent users accessing the contact directory without performance degradation
- **Mobile Performance**: Business card capture and upload should work efficiently on mobile networks (3G/4G) with image compression if needed

## Accessibility Considerations

- **Screen Reader Support**: All contact forms, search interfaces, and directory views must be fully navigable by screen readers
- **Keyboard Navigation**: All functionality must be accessible via keyboard without requiring mouse interaction
- **RTL Support**: Interface must properly support right-to-left layouts for Arabic language display
- **Color Contrast**: All text and interactive elements must meet WCAG AA contrast requirements
- **Mobile Accessibility**: Touch targets must be at least 44x44px for mobile usability
- **Alternative Text**: Business card images and document uploads must have descriptive alternative text for accessibility

## Localization Requirements

- **Bilingual Support**: All interface elements, labels, and messages must be available in both Arabic and English
- **RTL Layout**: Arabic language mode must display proper right-to-left layout with logical properties
- **Name Formatting**: System must handle both Western (First Last) and Arabic (علي محمد) name formats without imposing structure
- **Date/Time Formats**: Must respect locale-specific date and time formatting preferences
- **Number Formatting**: Phone numbers should support international formats with country codes

