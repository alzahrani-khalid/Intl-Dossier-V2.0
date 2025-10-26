# Tasks: Contact Directory

**Feature**: 027-contact-directory
**Input**: Design documents from `/specs/027-contact-directory/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/README.md

**Tests**: Not explicitly requested in specification - omitting test tasks per template guidelines

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions
- Web app structure: `backend/src/`, `frontend/src/`, `supabase/`
- Tests: `backend/tests/`, `frontend/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Install OCR dependencies: `tesseract.js@5.0+`, `@google-cloud/vision@4.3+`, `sharp@0.33+` in backend/package.json
- [X] T002 [P] Install document parsing dependencies: `unpdf@1.0.1+`, `mammoth@1.8.0+` in backend/package.json
- [X] T003 [P] Install language detection: `franc-min` in backend/package.json (verify already in dependencies)
- [X] T004 [P] Create contact directory structure: backend/src/services/{contact-service.ts, ocr-service.ts, duplicate-detection-service.ts, export-service.ts}
- [X] T005 [P] Create frontend contact structure: frontend/src/components/contacts/, frontend/src/pages/contacts/, frontend/src/hooks/, frontend/src/services/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Create database migration supabase/migrations/20251026000002_create_contact_directory_cd_tables.sql with all 6 tables (cd_contacts, cd_organizations, cd_interaction_notes, cd_contact_relationships, cd_tags, cd_document_sources) - Using cd_ prefix to avoid conflicts with existing contacts table
- [X] T007 Add indexes for cd_contacts table: idx_cd_contacts_full_name (GIN tsvector), idx_cd_contacts_organization_id, idx_cd_contacts_email_addresses (GIN), idx_cd_contacts_tags (GIN), idx_cd_contacts_created_by, idx_cd_contacts_source_type
- [X] T008 Add indexes for cd_organizations table: idx_cd_organizations_name (GIN tsvector), idx_cd_organizations_type, idx_cd_organizations_country
- [X] T009 Add indexes for cd_interaction_notes table: idx_cd_interaction_notes_contact_id, idx_cd_interaction_notes_date DESC, idx_cd_interaction_notes_type, idx_cd_interaction_notes_details (GIN tsvector), idx_cd_interaction_notes_created_by
- [X] T010 Add indexes for cd_contact_relationships table: idx_cd_contact_relationships_from, idx_cd_contact_relationships_to, idx_cd_contact_relationships_type
- [X] T011 Add indexes for cd_tags table: idx_cd_tags_name, idx_cd_tags_category
- [X] T012 Add indexes for cd_document_sources table: idx_cd_document_sources_uploaded_by, idx_cd_document_sources_processing_status, idx_cd_document_sources_file_type, idx_cd_document_sources_upload_date DESC
- [X] T013 Create RLS policies for cd_contacts table: "Users can view accessible cd_contacts", "Users can create cd_contacts", "Users can update own cd_contacts", "Users can archive own cd_contacts"
- [X] T014 [P] Create RLS policies for cd_organizations table: "Everyone can view cd_organizations", "Authenticated users can create cd_organizations"
- [X] T015 [P] Create RLS policies for cd_interaction_notes table: "Users can view accessible cd_interaction_notes", "Users can create cd_interaction_notes"
- [X] T016 [P] Create RLS policies for cd_contact_relationships table: "Users can view accessible cd_relationships"
- [X] T017 [P] Create RLS policies for cd_tags table: "Everyone can view cd_tags", "Authenticated users can create cd_tags"
- [X] T018 [P] Create RLS policies for cd_document_sources table: "Users can view own cd_documents", "Users can upload cd_documents"
- [X] T019 Create audit trigger function log_cd_contact_changes() in migration for cd_contacts, cd_interaction_notes, cd_contact_relationships tables
- [X] T020 Database migration already applied - All cd_ tables exist in database zkrcjzdemdmwhearhfgg
- [X] T021 Generate TypeScript types using Supabase CLI and save to backend/src/types/contact-directory.types.ts and frontend/src/types/contact-directory.types.ts
- [X] T022 Update ContactService class in backend/src/services/contact-service.ts to use cd_ table types from contact-directory.types.ts
- [X] T023 [P] Create Supabase Edge Function supabase/functions/contacts-create/index.ts with basic structure (stub)
- [X] T024 [P] Create Supabase Edge Function supabase/functions/contacts-update/index.ts with basic structure (stub)
- [X] T025 [P] Create Supabase Edge Function supabase/functions/contacts-search/index.ts with basic structure (stub)
- [X] T026 [P] Setup bilingual translation files: frontend/public/locales/en/contacts.json and frontend/public/locales/ar/contacts.json with complete structure
- [X] T027 Verify shadcn UI components exist: form, input, button, card, dialog, select, textarea, badge, label - All components already present in frontend/src/components/ui/

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Manual Contact Entry (Priority: P1) 🎯 MVP

**Goal**: Enable staff to manually create contacts with full information, making them searchable and accessible by all team members

**Independent Test**: Create a new contact with name, organization, position, email, phone, and notes. Search for it by name or organization. Verify all fields are saved and retrievable.

### Implementation for User Story 1

- [X] T028 [P] [US1] Implement ContactService.create() in backend/src/services/contact-service.ts with validation (email format, required fields)
- [X] T029 [P] [US1] Implement ContactService.getById() in backend/src/services/contact-service.ts
- [X] T030 [P] [US1] Implement ContactService.update() in backend/src/services/contact-service.ts
- [X] T031 [P] [US1] Implement ContactService.archive() in backend/src/services/contact-service.ts (soft delete via is_archived flag)
- [X] T032 [P] [US1] Implement ContactService.search() in backend/src/services/contact-service.ts with full-text search (pg_tsvector) and filtering by organization, tags, source_type
- [X] T033 [US1] Complete Supabase Edge Function supabase/functions/contacts-create/index.ts calling ContactService.create() with JWT auth validation
- [X] T034 [P] [US1] Complete Supabase Edge Function supabase/functions/contacts-update/index.ts calling ContactService.update() with JWT auth validation
- [X] T035 [P] [US1] Complete Supabase Edge Function supabase/functions/contacts-search/index.ts calling ContactService.search() with query params (search, organization_id, tags, limit, offset, sort_by, sort_order)
- [X] T036 [P] [US1] Create contact API client frontend/src/services/contact-api.ts with functions: createContact(), getContact(), updateContact(), searchContacts()
- [X] T037 [P] [US1] Create TanStack Query hooks frontend/src/hooks/useContacts.ts: useCreateContact, useContact, useUpdateContact, useSearchContacts
- [X] T038 [US1] Create ContactForm component frontend/src/components/contacts/ContactForm.tsx (mobile-first, RTL-ready, bilingual labels via i18next) with fields: full_name (required), organization_id (select), position, email_addresses (array), phone_numbers (array), notes, tags (multi-select)
- [X] T039 [P] [US1] Create ContactCard component frontend/src/components/contacts/ContactCard.tsx (mobile-first, RTL layout support) displaying contact summary with organization badge, position, primary email/phone, tags
- [X] T040 [US1] Create ContactList component frontend/src/components/contacts/ContactList.tsx (virtualized for 10k+ contacts) using @tanstack/react-virtual for performance
- [X] T041 [P] [US1] Create ContactSearch component frontend/src/components/contacts/ContactSearch.tsx (mobile-first) with search input, organization filter, tag multi-select, sort options
- [X] T042 [US1] Create ContactsDirectory page frontend/src/pages/contacts/ContactsDirectory.tsx integrating ContactSearch and ContactList with pagination
- [X] T043 [P] [US1] Create ContactDetails page frontend/src/pages/contacts/ContactDetails.tsx showing full contact info with edit/archive actions
- [X] T044 [P] [US1] Create ContactCreate page frontend/src/pages/contacts/ContactCreate.tsx with manual entry form
- [X] T045 [US1] Create TanStack Router routes in frontend/src/routes/_protected/: contacts.tsx (directory), contacts/$contactId.tsx (details), contacts/create.tsx (manual entry)
- [X] T046 [US1] Add English translations to frontend/public/locales/en/contacts.json for all form labels, buttons, validation messages
- [X] T047 [P] [US1] Add Arabic translations to frontend/public/locales/ar/contacts.json for all form labels, buttons, validation messages
- [X] T048 [US1] Implement duplicate detection warning in ContactForm: call GET /contacts/duplicates before save, show dialog if potential duplicates found

**Checkpoint**: Manual contact entry is fully functional - users can create, search, view, edit, and archive contacts

---

## Phase 4: User Story 2 - Business Card Scanning (Priority: P2)

**Goal**: Enable staff to digitize business cards by taking a photo, automatically extracting contact fields, reviewing, and saving

**Independent Test**: Upload/photograph a business card image. Verify extracted fields (name, organization, position, email, phone) are pre-populated correctly in the review form. Edit any errors and save. Verify contact is created.

### Implementation for User Story 2

- [X] T049 [P] [US2] Create OCRService class backend/src/services/ocr-service.ts with method preprocessImage(buffer) using Sharp (resize to 1200px, enhance contrast, denoise)
- [X] T050 [P] [US2] Implement OCRService.extractTextTesseract(imagePath) using tesseract.js with Arabic and English language packs
- [X] T051 [P] [US2] Implement OCRService.extractTextGoogleVision(imagePath) using @google-cloud/vision API client
- [X] T052 [US2] Implement OCRService.extractBusinessCard(imagePath, consentCloudOCR) with hybrid logic: try Tesseract first, fallback to Google Vision if confidence < 75% AND consentCloudOCR=true
- [X] T053 [US2] Implement OCRService.parseContactFields(rawText) using regex and NLP to identify name, organization, position, email, phone from extracted text
- [X] T054 [US2] Create Supabase Edge Function supabase/functions/ocr-extract/index.ts handling multipart/form-data upload, calling OCRService, returning extracted fields with confidence score
- [X] T055 [P] [US2] Update DocumentSource model backend/src/services/contact-service.ts: createDocumentSource(), updateDocumentSourceStatus()
- [X] T056 [US2] Integrate document upload to Supabase Storage in supabase/functions/ocr-extract/index.ts (path: contacts/business-cards/{year}/{month}/{uuid}.{ext})
- [X] T057 [P] [US2] Create OCR API client frontend/src/services/ocr-api.ts: uploadBusinessCard(file, consentCloudOCR)
- [X] T058 [P] [US2] Create TanStack Query hook frontend/src/hooks/useOCR.ts: useUploadBusinessCard
- [X] T059 [US2] Create BusinessCardScanner component frontend/src/components/contacts/BusinessCardScanner.tsx (mobile-first, camera API integration) with capture/upload buttons, OCR processing indicator, consent checkbox
- [X] T060 [US2] Enhance ContactForm to accept pre-populated extracted data from OCR with highlighted fields showing confidence scores and editable inputs
- [X] T061 [US2] Update ContactCreate page frontend/src/pages/contacts/ContactCreate.tsx to support "Scan Business Card" tab alongside "Manual Entry"
- [X] T062 [P] [US2] Add business card scanning translations to frontend/public/locales/en/contacts.json and frontend/public/locales/ar/contacts.json
- [X] T063 [US2] Implement duplicate detection for scanned cards: call duplicates endpoint after OCR extraction, warn before final save

**Checkpoint**: Business card scanning is fully functional - users can capture/upload cards, review extracted data, correct errors, and save contacts

---

## Phase 5: User Story 3 - Extract Contacts from Documents (Priority: P3)

**Goal**: Enable staff to upload documents (PDF, Word, images) containing multiple contacts and batch-import them after review

**Independent Test**: Upload a document with multiple contacts (e.g., invitation letter with 3 attendees). Verify system identifies all 3 contacts. Review extracted information for each. Select all and batch-save. Verify all 3 contacts are created.

### Implementation for User Story 3

- [X] T064 [P] [US3] Create DocumentParser class backend/src/services/document-parser.ts with method parsePDF(filePath) using unpdf
- [X] T065 [P] [US3] Implement DocumentParser.parseWord(filePath) using mammoth.js to extract text as HTML then parse paragraphs
- [X] T066 [US3] Implement DocumentParser.detectLanguage(text) using franc-min to identify Arabic/English/mixed
- [X] T067 [US3] Implement DocumentParser.extractContacts(text, language) using NLP to identify multiple contact entries (name + organization patterns, email regex, phone regex)
- [X] T068 [US3] Create Supabase Edge Function supabase/functions/contacts-extract-document/index.ts (async processing) accepting PDF/Word/image upload, returning document_source_id with status "processing"
- [X] T069 [US3] Implement async document processing in supabase/functions/contacts-extract-document/index.ts: call DocumentParser, update document_sources.processing_status, store extracted_contacts array
- [X] T070 [US3] Create polling endpoint GET supabase/functions/contacts-extract-document/:document_source_id to check processing status and retrieve extracted contacts when completed
- [X] T071 [P] [US3] Update OCR API client frontend/src/services/ocr-api.ts: uploadDocument(file), checkDocumentStatus(documentSourceId)
- [X] T072 [P] [US3] Create TanStack Query hooks frontend/src/hooks/useOCR.ts: useUploadDocument, useDocumentStatus (with polling interval)
- [X] T073 [US3] Create DocumentExtractor component frontend/src/components/contacts/DocumentExtractor.tsx (mobile-first) with file upload, processing progress indicator, extracted contacts list preview
- [X] T074 [US3] Create batch contact review UI in DocumentExtractor showing table of extracted contacts with checkboxes, inline editing for each field (name, organization, position, email, phone)
- [X] T075 [US3] Implement batch create in ContactService.createBatch(contacts[]) backend/src/services/contact-service.ts using database transaction
- [X] T076 [US3] Create Supabase Edge Function supabase/functions/contacts-batch-create/index.ts calling ContactService.createBatch()
- [X] T077 [US3] Update ContactCreate page to support "Extract from Document" tab for bulk import workflow
- [X] T078 [P] [US3] Add document extraction translations to frontend/public/locales/en/contacts.json and frontend/public/locales/ar/contacts.json
- [X] T079 [US3] Implement duplicate detection for batch imports: check each extracted contact against existing contacts, show warning dialog with merge options

**Checkpoint**: Document extraction is fully functional - users can upload documents, system identifies multiple contacts, user reviews and batch-saves them

---

## Phase 6: User Story 4 - Contact Organization & Relationships (Priority: P4)

**Goal**: Enable staff to view contacts grouped by organization, define relationships between contacts, tag contacts, and visualize network connections

**Independent Test**: Create 3 contacts from same organization. View directory grouped by organization - verify all 3 appear together. Add relationship "Person A reports to Person B". View Person A's profile - verify relationship is visible. Tag Person A with "Project X". Filter directory by "Project X" - verify Person A appears. View network graph - verify relationship visualization.

### Implementation for User Story 4

- [X] T080 [P] [US4] Implement OrganizationService.create() backend/src/services/organization-service.ts with validation
- [X] T081 [P] [US4] Implement OrganizationService.getAll() backend/src/services/organization-service.ts with filtering and pagination
- [X] T082 [P] [US4] Create Supabase Edge Function supabase/functions/organizations-create/index.ts
- [X] T083 [P] [US4] Create Supabase Edge Function supabase/functions/organizations-list/index.ts
- [X] T084 [P] [US4] Implement RelationshipService.create() backend/src/services/relationship-service.ts validating from_contact_id != to_contact_id, preventing duplicates
- [X] T085 [P] [US4] Implement RelationshipService.getForContact(contactId) backend/src/services/relationship-service.ts returning both incoming and outgoing relationships
- [X] T086 [P] [US4] Create Supabase Edge Function supabase/functions/relationships-manage/index.ts for GET/POST/DELETE relationships
- [X] T087 [P] [US4] Implement TagService.create() backend/src/services/tag-service.ts with unique name validation
- [X] T088 [P] [US4] Implement TagService.getAll() backend/src/services/tag-service.ts with category filtering
- [X] T089 [P] [US4] Create Supabase Edge Function supabase/functions/tags-manage/index.ts for GET/POST tags
- [X] T090 [US4] Enhance ContactService.search() to support grouping by organization_id (SQL GROUP BY) and filtering by tag arrays
- [X] T091 [P] [US4] Create relationship API client frontend/src/services/relationship-api.ts: createRelationship(), getRelationshipsForContact(), deleteRelationship()
- [X] T092 [P] [US4] Create TanStack Query hooks frontend/src/hooks/useRelationships.ts: useCreateRelationship, useRelationships, useDeleteRelationship
- [X] T093 [P] [US4] Install React Flow library: `@xyflow/react` in frontend/package.json for network visualization
- [X] T094 [US4] Create RelationshipGraph component frontend/src/components/contacts/RelationshipGraph.tsx (mobile-first, RTL-aware) using React Flow to visualize contact network (nodes = contacts, edges = relationships)
- [X] T095 [P] [US4] Create RelationshipForm component in ContactDetails page to add/edit relationships with type selector (reports_to, collaborates_with, partner, colleague, other)
- [X] T096 [P] [US4] Update ContactCard to display relationship count badge with link to network view
- [X] T097 [US4] Enhance ContactList to support "Group by Organization" view mode showing contacts nested under organizations
- [X] T098 [P] [US4] Update ContactSearch to include tag multi-select filter (using tag API)
- [X] T099 [P] [US4] Add organization and relationship translations to frontend/public/locales/en/contacts.json and frontend/public/locales/ar/contacts.json
- [X] T100 [US4] Add "View Network" button to ContactDetails page opening RelationshipGraph in dialog/modal

**Checkpoint**: Contact organization and relationships are fully functional - users can group by org, create relationships, tag contacts, filter by tags, visualize networks

---

## Phase 7: User Story 5 - Contact History & Notes (Priority: P5)

**Goal**: Enable staff to record interaction notes (meetings, emails, calls), view chronological timeline of all interactions, and search notes by keywords

**Independent Test**: View a contact's profile. Add 3 interaction notes with different types (meeting, email, call) and dates. View timeline - verify all 3 notes appear chronologically. Search notes for specific keyword - verify matching notes appear across all contacts. Filter timeline by date range - verify only notes in range appear.

### Implementation for User Story 5

- [X] T101 [P] [US5] Implement InteractionNoteService.create() backend/src/services/interaction-note-service.ts with validation (date not in future, details min length)
- [X] T102 [P] [US5] Implement InteractionNoteService.getForContact(contactId) backend/src/services/interaction-note-service.ts with sorting by date DESC
- [X] T103 [P] [US5] Implement InteractionNoteService.search(query, dateFrom, dateTo, types) backend/src/services/interaction-note-service.ts with full-text search on details field
- [X] T104 [P] [US5] Create Supabase Edge Function supabase/functions/interaction-notes-create/index.ts
- [X] T105 [P] [US5] Create Supabase Edge Function supabase/functions/interaction-notes-list/index.ts with filtering by contact_id, date range, type
- [X] T106 [P] [US5] Create Supabase Edge Function supabase/functions/interaction-notes-search/index.ts for keyword search across all contacts' notes
- [X] T107 [P] [US5] Create interaction note API client frontend/src/services/interaction-api.ts: createNote(), getNotesForContact(), searchNotes()
- [X] T108 [P] [US5] Create TanStack Query hooks frontend/src/hooks/useInteractions.ts: useCreateNote, useInteractionNotes, useSearchNotes
- [X] T109 [US5] Create InteractionTimeline component frontend/src/components/contacts/InteractionTimeline.tsx (mobile-first, RTL-aware) displaying chronological list of notes with date, type icon, details preview
- [X] T110 [P] [US5] Create InteractionNoteForm dialog component for adding new notes with fields: date (date picker), type (select: meeting/email/call/conference/other), details (textarea), attendees (contact multi-select)
- [X] T111 [US5] Add InteractionTimeline to ContactDetails page below contact info with "Add Note" button opening form
- [X] T112 [P] [US5] Create global notes search page frontend/src/pages/contacts/NotesSearch.tsx with search input, date range filters, type filters, results list showing matching notes with associated contact info
- [X] T113 [P] [US5] Add interaction notes translations to frontend/public/locales/en/contacts.json and frontend/public/locales/ar/contacts.json
- [X] T114 [US5] Implement attachment support in InteractionNoteForm: file upload to Supabase Storage (path: contacts/interactions/{contactId}/{noteId}/{filename}), store paths in attachments array
- [X] T115 [US5] Add attachment display to InteractionTimeline: show attachment links with download buttons

**Checkpoint**: Contact history and notes are fully functional - users can add notes, view timelines, search across all notes, filter by date/type, attach files

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T116 [P] [US1] Implement CSV export in backend/src/services/export-service.ts: generateCSV(contacts) returning CSV string with headers: Full Name, Organization, Position, Email, Phone, Tags, Created At
- [X] T117 [P] [US1] Implement vCard export in backend/src/services/export-service.ts: generateVCard(contacts) returning vCard 3.0 format with FN, ORG, TITLE, EMAIL, TEL fields
- [X] T118 [US1] Create Supabase Edge Function supabase/functions/contacts-export/index.ts accepting format (csv/vcard) and contact_ids/organization_id filters, returning file download
- [X] T119 [P] [US1] Create export API client frontend/src/services/export-api.ts: exportContacts(format, filters)
- [X] T120 [US1] Add export buttons to ContactsDirectory page: "Export All", "Export Selected" with format dropdown (CSV/vCard)
- [X] T121 [P] Add mobile-first responsive validation across all forms: verify min-h-11 touch targets, gap-2 spacing, px-4 containers
- [X] T122 [P] Add RTL layout validation across all components: verify logical properties (ms-*, me-*, ps-*, pe-*), text-start/end, dir attribute
- [X] T123 [P] Run accessibility audit using axe-playwright: verify WCAG AA compliance for color contrast, ARIA labels, keyboard navigation
- [X] T124 [P] Performance optimization: Add Redis caching in ContactService for frequently accessed contacts (TTL: 5 minutes)
- [X] T125 [P] Performance optimization: Implement pagination cursors in ContactService.search() for better performance on large datasets
- [X] T126 Security review: Verify all RLS policies are enforced, audit logging triggers are working, file uploads are validated
- [X] T127 Documentation: Add API documentation to contracts/README.md for any new endpoints
- [X] T128 Code cleanup: Remove any console.log statements, fix TypeScript strict mode violations
- [X] T129 Final testing: Run complete user journey from manual entry → business card scan → document extraction → relationships → notes
- [X] T130 Deployment: Deploy all Edge Functions using Supabase MCP, verify all migrations applied to staging project

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-7)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4 → P5)
- **Polish (Phase 8)**: Depends on desired user stories being complete (minimally US1 for MVP)

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Depends on US1's ContactForm for review UI, but core OCR logic is independent
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Depends on US1's ContactService.create() and ContactForm, plus US2's DocumentSource model
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Depends on US1's ContactService and ContactDetails page for displaying relationships
- **User Story 5 (P5)**: Can start after Foundational (Phase 2) - Depends on US1's ContactDetails page for embedding timeline

### Within Each User Story

- Backend services before Edge Functions
- Edge Functions before frontend API clients
- API clients before TanStack Query hooks
- Hooks before UI components
- Basic components before page integration
- Pages before routes
- Core functionality before translations
- Functionality before duplicate detection integration

### Parallel Opportunities

**Phase 1 - All tasks can run in parallel** (T001-T005 marked [P])

**Phase 2 - Within migration creation:**
- T007-T012: All index creation can run in parallel
- T013-T018: All RLS policy creation can run in parallel
- T023-T025: All Edge Function stubs can run in parallel
- T026-T027: Translation setup and UI component installation can run in parallel

**Phase 3 (US1) - Parallel opportunities:**
- T028-T032: All ContactService methods can run in parallel
- T033-T035: All Edge Functions can run in parallel after T028-T032 complete
- T036-T037: API client and hooks can run in parallel after T033-T035
- T038-T041: All UI components can run in parallel after T036-T037
- T046-T047: Translation files can run in parallel

**Phase 4 (US2) - Parallel opportunities:**
- T049-T051: OCR service methods can run in parallel
- T057-T058: API client and hooks can run in parallel
- T062: Both translation files can run in parallel

**Phase 5 (US3) - Parallel opportunities:**
- T064-T065: PDF and Word parsers can run in parallel
- T071-T072: API client methods and hooks can run in parallel
- T078: Both translation files can run in parallel

**Phase 6 (US4) - Parallel opportunities:**
- T080-T081, T084-T085, T087-T088: All service methods can run in parallel
- T082-T083, T086, T089: All Edge Functions can run in parallel after services
- T091-T093: API client, hooks, and React Flow installation can run in parallel
- T094-T098: All UI components can run in parallel
- T099: Both translation files can run in parallel

**Phase 7 (US5) - Parallel opportunities:**
- T101-T103: All InteractionNoteService methods can run in parallel
- T104-T106: All Edge Functions can run in parallel after services
- T107-T108: API client and hooks can run in parallel
- T109-T110: Timeline and form components can run in parallel
- T113: Both translation files can run in parallel

**Phase 8 - Parallel opportunities:**
- T116-T117: CSV and vCard export can run in parallel
- T121-T126: All validation and optimization tasks can run in parallel

---

## Parallel Example: User Story 1 Backend Services

```bash
# Launch all ContactService methods together:
Task: "Implement ContactService.create() in backend/src/services/contact-service.ts"
Task: "Implement ContactService.getById() in backend/src/services/contact-service.ts"
Task: "Implement ContactService.update() in backend/src/services/contact-service.ts"
Task: "Implement ContactService.archive() in backend/src/services/contact-service.ts"
Task: "Implement ContactService.search() in backend/src/services/contact-service.ts"

# After services complete, launch all Edge Functions together:
Task: "Complete supabase/functions/contacts-create/index.ts"
Task: "Complete supabase/functions/contacts-update/index.ts"
Task: "Complete supabase/functions/contacts-search/index.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T027) - **CRITICAL**
3. Complete Phase 3: User Story 1 (T028-T048)
4. **STOP and VALIDATE**: Test manual contact entry independently
5. Optional: Add export functionality from Phase 8 (T116-T120)
6. Deploy/demo MVP

**MVP Scope**: Manual contact entry, search, CRUD operations, export - delivers immediate value (SC-001, SC-005, FR-001, FR-011, FR-021)

### Incremental Delivery

1. Foundation (Phases 1-2) → Foundation ready
2. + User Story 1 → Test independently → Deploy/Demo (MVP!)
3. + User Story 2 → Test independently → Deploy/Demo (business card scanning adds 70% time savings per SC-007)
4. + User Story 3 → Test independently → Deploy/Demo (bulk document extraction)
5. + User Story 4 → Test independently → Deploy/Demo (organizational intelligence)
6. + User Story 5 → Test independently → Deploy/Demo (interaction history tracking)
7. + Phase 8 → Test independently → Final production release

Each story adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (critical path)
2. Once Foundational is done (after T027):
   - Developer A: User Story 1 (T028-T048)
   - Developer B: User Story 2 (T049-T063) - requires US1's ContactForm after T038
   - Developer C: User Story 4 (T080-T100) - requires US1's ContactDetails after T043
3. User Story 3 starts after US1 and US2 complete (depends on both)
4. User Story 5 starts after US1 completes (depends on ContactDetails)
5. Phase 8 polish after desired stories complete

---

## Task Summary

**Total Tasks**: 130
- Phase 1 (Setup): 5 tasks
- Phase 2 (Foundational): 22 tasks
- Phase 3 (US1 - Manual Entry): 21 tasks
- Phase 4 (US2 - Business Card): 15 tasks
- Phase 5 (US3 - Document Extraction): 16 tasks
- Phase 6 (US4 - Organization & Relationships): 21 tasks
- Phase 7 (US5 - History & Notes): 15 tasks
- Phase 8 (Polish): 15 tasks

**Parallel Opportunities**: 65 tasks marked [P] (50% of tasks can run in parallel within their phase)

**MVP Scope**: Phases 1-3 + export from Phase 8 = 48 tasks for minimal viable product

**Independent Test Criteria**:
- US1: Manual entry, search, retrieve all fields
- US2: Upload card, extract fields, review, save
- US3: Upload document, identify multiple contacts, batch import
- US4: Group by org, create relationships, tag, filter, visualize
- US5: Add notes, view timeline, search keywords, filter

**Format Validation**: ✅ All tasks follow checklist format (checkbox, ID, [P]/[Story] labels, file paths)

---

## Notes

- [P] tasks = different files/services, no dependencies within their section
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable after Foundational phase
- Stop at any checkpoint to validate story independently before proceeding
- Commit after each task or logical group for version control
- Tests were not explicitly requested in specification - omitted per template guidelines
- All tasks include exact file paths for immediate executability
- Constitution compliance embedded: mobile-first, RTL support, TypeScript strict, RLS policies, audit logging
