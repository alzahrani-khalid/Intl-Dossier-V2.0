# Tasks: After-Action Structured Documentation

**Feature Branch**: `022-after-action-structured`
**Input**: Design documents from `/specs/022-after-action-structured/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/
**Platform**: Cross-platform (Web + Mobile)

**Tests**: This feature includes comprehensive testing. Tests are written FIRST (TDD approach) and must FAIL before implementation begins.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Exact file paths included in task descriptions

## Path Conventions
- **Backend**: `backend/src/api/`, `backend/src/services/`, `backend/src/types/`
- **Frontend**: `frontend/src/components/`, `frontend/src/pages/`, `frontend/src/hooks/`
- **Mobile**: `mobile/src/screens/`, `mobile/src/components/`, `mobile/src/database/`
- **Database**: `supabase/migrations/`
- **Tests**: `backend/tests/`, `frontend/tests/`, `mobile/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and configuration

- [X] T001 [P] Verify Node.js 18+ LTS, Supabase CLI, and development environment variables per quickstart.md
- [X] T002 [P] Install backend dependencies (AnythingLLM client, pdfkit, Noto Sans fonts) in backend/package.json
- [X] T003 [P] Install frontend dependencies (React Hook Form, Zod, TanStack Query v5) in frontend/package.json
- [X] T004 [P] Install mobile dependencies (WatermelonDB, React Native Paper 5.12+, expo-local-authentication, expo-notifications, expo-document-picker) in mobile/package.json
- [X] T005 [P] Configure ESLint/Prettier rules per constitution (strict TypeScript, no console.log, RTL-safe patterns) in .eslintrc.js
- [X] T006 [P] Setup Winston logger configuration for backend in backend/src/utils/logger.ts
- [X] T007 [P] Store Noto Sans and Noto Sans Arabic fonts in backend/assets/fonts/ for PDF generation

**Checkpoint**: Development environment ready, dependencies installed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database schema, types, and authentication framework that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Schema

- [X] T008 Create external_contacts table migration in supabase/migrations/20250114120000_create_external_contacts.sql
- [X] T009 Create after_action_records table migration in supabase/migrations/20250114120100_create_after_action_records.sql
- [X] T010 Create decisions table migration in supabase/migrations/20250114120200_create_decisions.sql
- [X] T011 Create commitments table migration in supabase/migrations/20250114120300_create_commitments.sql
- [X] T012 Create risks table migration in supabase/migrations/20250114120400_create_risks.sql
- [X] T013 Create follow_up_actions table migration in supabase/migrations/20250114120500_create_follow_up_actions.sql
- [X] T014 Create attachments table migration in supabase/migrations/20250114120600_create_attachments.sql
- [X] T015 Create version_snapshots table migration in supabase/migrations/20250114120700_create_version_snapshots.sql
- [X] T016 Create RLS policies migration in supabase/migrations/20250114120800_add_after_action_rls_policies.sql (hybrid permission: role + dossier assignment)
- [X] T017 Create indexes migration in supabase/migrations/20250114120900_add_after_action_indexes.sql (27 indexes per data-model.md)
- [X] T018 Create triggers migration in supabase/migrations/20250114121000_add_after_action_triggers.sql (lowercase email, auto-update timestamps)
- [X] T019 Apply all migrations to staging database (zkrcjzdemdmwhearhfgg) using Supabase MCP
- [X] T020 Generate TypeScript types from database schema using Supabase CLI → frontend/src/types/database.types.ts

### Type Definitions & Validation

- [X] T021 [P] Create after-action TypeScript interfaces in backend/src/types/after-action.types.ts (AfterActionRecord, Decision, Commitment, Risk, FollowUpAction, Attachment, VersionSnapshot)
- [X] T022 [P] Create AI extraction TypeScript interfaces in backend/src/types/ai-extraction.types.ts (ExtractionRequest, ExtractionResponse, ConfidenceScore)
- [X] T023 [P] Create PDF generation TypeScript interfaces in backend/src/types/pdf-generation.types.ts (PDFGenerationRequest, BilingualPDFResponse)
- [X] T024 [P] Define Zod validation schemas in backend/src/types/after-action.types.ts (share between client and server)

### Mobile Foundation

- [X] T025 [P] Setup WatermelonDB schema for after_action_records in mobile/src/database/schema/after-action-record.ts
- [X] T026 [P] Setup WatermelonDB schema for decisions in mobile/src/database/schema/decision.ts
- [X] T027 [P] Setup WatermelonDB schema for commitments in mobile/src/database/schema/commitment.ts
- [X] T028 [P] Setup WatermelonDB schema for risks in mobile/src/database/schema/risk.ts
- [X] T029 [P] Setup WatermelonDB schema for follow_up_actions in mobile/src/database/schema/follow-up-action.ts
- [X] T030 [P] Setup WatermelonDB schema for external_contacts (cached) in mobile/src/database/schema/external-contact.ts
- [X] T031 [P] Setup WatermelonDB schema for attachment_queue in mobile/src/database/schema/attachment-queue.ts
- [X] T032 Create base sync service with incremental sync logic (last_sync_timestamp) in mobile/src/services/sync.service.ts
- [X] T033 Implement offline queue service for background operations in mobile/src/services/offline-queue.service.ts
- [X] T034 Setup expo-notifications with permission handling and notification channels in mobile/src/services/notification.service.ts
- [X] T035 Setup expo-local-authentication with biometric + PIN fallback in mobile/src/services/auth/biometric-auth.service.ts
- [X] T036 Configure i18next for mobile with RTL detection (i18n.language === 'ar') in mobile/src/i18n/config.ts

**Checkpoint**: Foundation ready - database schema exists, types generated, mobile offline infrastructure ready. User story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Quick After-Action Creation (Priority: P1) 🎯 MVP

**Goal**: Enable staff to document engagement outcomes (attendance, decisions, commitments, risks, follow-ups) via structured form, auto-create tasks from commitments, and link to parent dossier.

**Independent Test**: Create after-action record with 3 commitments → verify 3 tasks created and linked to dossier → view in dossier timeline.

**Why MVP**: This is the core value proposition. Without this, the feature provides no value. All other stories are enhancements.

### Contract Tests for US1 (TDD - Write FIRST, Ensure FAIL)

- [X] T037 [P] [US1] Write contract test for POST /after-action/create in backend/tests/contract/after-action-api.test.ts (test request/response schema, validation errors, RLS enforcement)
- [X] T038 [P] [US1] Write contract test for PUT /after-action/update/:id in backend/tests/contract/after-action-api.test.ts (test optimistic locking, draft-only update)
- [X] T039 [P] [US1] Write contract test for POST /after-action/publish/:id in backend/tests/contract/after-action-api.test.ts (test task creation, notification queuing)
- [X] T040 [P] [US1] Write contract test for GET /after-action/list in backend/tests/contract/after-action-api.test.ts (test filtering, pagination, RLS)
- [X] T041 [P] [US1] Write contract test for GET /after-action/get/:id in backend/tests/contract/after-action-api.test.ts (test full details with nested entities)
- [X] T042 [P] [US1] Write contract test for DELETE /after-action/delete/:id in backend/tests/contract/after-action-api.test.ts (test draft-only deletion)
- [X] T043 [P] [US1] Run all contract tests → verify they FAIL (no implementation yet)

### Integration Tests for US1 (TDD - Write FIRST, Ensure FAIL)

- [X] T044 [P] [US1] Write integration test for end-to-end after-action creation workflow in backend/tests/integration/after-action-workflow.test.ts (draft → publish → tasks created → dossier linked)
- [X] T045 [P] [US1] Write integration test for task auto-creation from commitments in backend/tests/integration/task-creation.test.ts (test 5 commitments → 5 tasks with correct metadata)
- [X] T046 [P] [US1] Run integration tests → verify they FAIL

### E2E Tests for US1 (TDD - Write FIRST, Ensure FAIL)

- [X] T047 [P] [US1] Write E2E test for after-action create flow in frontend/tests/e2e/after-action-create.spec.ts using Playwright (fill form, save draft, publish, verify tasks)
- [X] T048 [P] [US1] Write E2E test for after-action publish and task verification in frontend/tests/e2e/after-action-publish.spec.ts (publish → verify task list updated)
- [X] T049 [P] [US1] Run E2E tests → verify they FAIL

### Implementation for US1 - Backend

- [X] T050 Implement task creation service in backend/src/services/task-creation.service.ts (create task records from commitments, link to after-action and dossier)
- [X] T051 Implement notification service in backend/src/services/notification.service.ts (queue in-app and email notifications for commitment owners)
- [X] T052 Implement create Edge Function in backend/src/api/after-action.ts (validate engagement/dossier, create after-action + nested entities in transaction, enforce RLS)
- [X] T053 Implement update Edge Function in backend/src/api/after-action.ts (draft-only, optimistic locking, diff nested arrays, increment _version)
- [X] T054 Implement publish Edge Function in backend/src/api/after-action.ts (validate completeness, create tasks via task-creation.service, queue notifications, create version snapshot)
- [X] T055 Implement list Edge Function in backend/src/api/after-action.ts (filter by dossier/status/date, pagination, aggregate counts, enforce RLS)
- [X] T056 Implement get Edge Function in backend/src/api/after-action.ts (return full record + nested entities + signed URLs for attachments)
- [X] T057 Implement delete Edge Function in backend/src/api/after-action.ts (draft-only, creator-only, cascade delete nested entities)

### Implementation for US1 - Frontend Web

- [X] T058 [P] Create DecisionList component in frontend/src/components/after-action/DecisionList.tsx (add/edit/remove decisions, show AI confidence scores, mobile-first, RTL-safe)
- [X] T059 [P] Create CommitmentList component in frontend/src/components/after-action/CommitmentList.tsx (add/edit/remove commitments, assign internal/external owners, due date picker, mobile-first, RTL-safe)
- [X] T060 [P] Create RiskList component in frontend/src/components/after-action/RiskList.tsx (add/edit/remove risks, severity + likelihood matrix, mobile-first, RTL-safe)
- [X] T061 Create multi-step AfterActionForm component in frontend/src/components/after-action/AfterActionForm.tsx (step 1: basic info, step 2: attendance, step 3: decisions, step 4: commitments, step 5: risks/follow-ups, step 6: review, uses React Hook Form + Zod, auto-save drafts every 30s, mobile-first, RTL-safe)
- [X] T062 Create AfterActionCreatePage in frontend/src/pages/after-action/AfterActionCreatePage.tsx (render AfterActionForm, handle save draft + publish, show unsaved changes warning, mobile-first, RTL-safe)
- [X] T063 Create AfterActionEditPage in frontend/src/pages/after-action/AfterActionEditPage.tsx (load draft, render AfterActionForm, handle update + publish, mobile-first, RTL-safe)
- [X] T064 Create AfterActionViewPage in frontend/src/pages/after-action/AfterActionViewPage.tsx (display read-only record, show linked tasks, mobile-first, RTL-safe)
- [X] T065 Create AfterActionListPage in frontend/src/pages/after-action/AfterActionListPage.tsx (list for dossier, filter by status, pagination, mobile-first, RTL-safe)
- [X] T066 [P] Create TanStack Query hooks in frontend/src/hooks/use-after-action.ts (useCreateAfterAction, useUpdateAfterAction, usePublishAfterAction, useAfterActionList, useAfterActionDetail, useDeleteAfterAction)
- [X] T067 [P] Create API client wrapper in frontend/src/services/after-action-api.ts (typed fetch wrappers for all endpoints, JWT token injection, error handling)

### Implementation for US1 - Mobile

- [X] T068 [P] Create DecisionInput component in mobile/src/components/AfterAction/DecisionInput.tsx (React Native Paper TextInput, mobile-optimized, RTL via I18nManager)
- [X] T069 [P] Create CommitmentInput component in mobile/src/components/AfterAction/CommitmentInput.tsx (React Native Paper TextInput, DatePickerModal, owner dropdown, mobile-optimized, RTL)
- [X] T070 [P] Create RiskInput component in mobile/src/components/AfterAction/RiskInput.tsx (React Native Paper SegmentedButtons for severity/likelihood, mobile-optimized, RTL)
- [X] T071 [P] Create SyncStatusBadge component in mobile/src/components/AfterAction/SyncStatusBadge.tsx (show Synced/Pending/Failed with icons, mobile-optimized, RTL)
- [X] T072 Create AfterActionCreateScreen in mobile/src/screens/AfterAction/AfterActionCreateScreen.tsx (multi-step form using React Native Paper, save to WatermelonDB, queue for sync, mobile-optimized with 44x44px touch targets, RTL)
- [X] T073 Create AfterActionEditScreen in mobile/src/screens/AfterAction/AfterActionEditScreen.tsx (load from WatermelonDB, edit offline, queue updates, mobile-optimized, RTL)
- [X] T074 Create AfterActionViewScreen in mobile/src/screens/AfterAction/AfterActionViewScreen.tsx (read-only display with offline cache, show linked tasks, mobile-optimized, RTL)
- [X] T075 Create AfterActionListScreen in mobile/src/screens/AfterAction/AfterActionListScreen.tsx (FlatList with pull-to-refresh sync, filter by status, mobile-optimized, RTL)
- [X] T076 Implement after-action sync logic in mobile/src/services/sync/after-action-sync.service.ts (incremental sync, handle nested entities, optimistic UI updates)
- [X] T077 Add after-action navigation stack in mobile/src/navigation/AfterActionNavigator.tsx (React Navigation, deep linking for push notifications)

### Component Tests for US1

- [X] T078 [P] [US1] Write component test for DecisionList in frontend/tests/component/DecisionList.test.tsx (test add/edit/remove, AI confidence display)
- [X] T079 [P] [US1] Write component test for CommitmentList in frontend/tests/component/CommitmentList.test.tsx (test internal/external owner assignment, due date validation)
- [X] T080 [P] [US1] Write component test for AfterActionForm in frontend/tests/component/AfterActionForm.test.tsx (test multi-step navigation, auto-save, validation)
- [X] T081 [P] [US1] Write component test for AfterActionCreateScreen in mobile/tests/component/AfterActionCreateScreen.test.tsx using Jest + RNTL (test form submission, offline save)

### Run All US1 Tests

- [X] T082 [US1] Run all contract, integration, E2E, and component tests for US1 → verify they PASS
- [X] T083 [US1] Verify test coverage ≥80% for US1 code paths

**Checkpoint**: User Story 1 complete and fully tested. Users can create after-actions, auto-create tasks, and view in dossier timeline. This is the MVP - can stop here for initial release.

---

## Phase 4: User Story 2 - AI-Assisted Data Entry (Priority: P2)

**Goal**: Upload meeting minutes (PDF/DOCX/TXT) → AI extracts decisions/commitments/risks with confidence scores → pre-populate form for user review/edit.

**Independent Test**: Upload 8-page PDF meeting minutes → verify AI extracts 5 decisions, 8 commitments, 3 risks with confidence scores → user can edit and submit.

**Why This Priority**: Significantly reduces data entry time (15-30 min savings) but feature works without it via manual entry (US1).

### Contract Tests for US2 (TDD - Write FIRST, Ensure FAIL)

- [X] T084 [P] [US2] Write contract test for POST /ai-extraction/extract-sync in backend/tests/contract/ai-extraction-api.test.ts (test sync extraction <5s, confidence scores 0.0-1.0)
- [X] T085 [P] [US2] Write contract test for POST /ai-extraction/extract-async in backend/tests/contract/ai-extraction-api.test.ts (test async job creation, estimated completion time)
- [X] T086 [P] [US2] Write contract test for GET /ai-extraction/status/:job_id in backend/tests/contract/ai-extraction-api.test.ts (test polling, job status transitions)
- [X] T087 [P] [US2] Run contract tests → verify they FAIL

### Integration Tests for US2 (TDD - Write FIRST, Ensure FAIL)

- [X] T088 [P] [US2] Write integration test for AI extraction workflow in backend/tests/integration/ai-extraction-workflow.test.ts (upload document → extract → pre-populate form → verify accuracy ≥85% precision)
- [X] T089 [P] [US2] Write integration test for async extraction with notification in backend/tests/integration/ai-extraction-async.test.ts (upload large doc → poll status → receive notification → merge suggestions)
- [X] T090 [P] [US2] Run integration tests → verify they FAIL

### E2E Tests for US2 (TDD - Write FIRST, Ensure FAIL)

- [X] T091 [P] [US2] Write E2E test for AI extraction flow in frontend/tests/e2e/ai-extraction.spec.ts using Playwright (upload PDF → wait for extraction → review suggestions → edit low-confidence items → submit)
- [X] T092 [P] [US2] Run E2E test → verify it FAILS

### Implementation for US2 - Backend

- [X] T093 [P] [US2] Implement AI extraction service in backend/src/services/ai-extraction.service.ts (prompt engineering, confidence scoring, validation, historical pattern analysis)
  - Extract decisions, commitments, risks from meeting minutes
  - Assign confidence scores (0.0-1.0) for each extracted entity
  - Analyze historical after-action records to suggest commitment owners based on past assignments (FR-012)
  - Validate extracted data against business rules (future dates, valid contacts)
  - Cache extraction results in Redis (30-day TTL)
- [X] T094 Implement extract-sync Edge Function in backend/src/api/ai-extraction/extract-sync.ts (<5s processing, documents <500KB, return extracted entities with confidence scores)
- [X] T095 Implement extract-async Edge Function in backend/src/api/ai-extraction/extract-async.ts (queue job for >5s processing, return job_id and estimated completion, store job metadata in Redis)
- [X] T096 Implement extraction-status Edge Function in backend/src/api/ai-extraction/extraction-status.ts (poll job status from Redis, return results when complete)
- [X] T097 Setup background worker for async extraction jobs (process queued jobs, send push notifications when complete) - Edge Function with cron trigger

### Implementation for US2 - Frontend Web

- [X] T098 Create AttachmentUpload component in frontend/src/components/after-action/AttachmentUpload.tsx (file picker with drag-drop, accept PDF/DOCX/TXT, virus scan status indicator, max 100MB + 10 files validation, mobile-first, RTL-safe)
- [X] T099 Create AIExtractionStatus component in frontend/src/components/after-action/AIExtractionStatus.tsx (show sync loading indicator OR async progress with estimated time, display extraction results with confidence scores, flag low-confidence items <0.7, mobile-first, RTL-safe)
- [X] T100 Update AfterActionForm to integrate AI extraction (add upload step, trigger extraction, merge suggestions into form without overwriting user input, highlight new suggestions for review)
- [X] T101 [P] Create TanStack Query hooks in frontend/src/hooks/use-ai-extraction.ts (useExtractSync, useExtractAsync, useExtractionStatus with polling)

### Implementation for US2 - Mobile

- [X] T102 Create DocumentPicker component in mobile/src/components/AfterAction/DocumentPicker.tsx (expo-document-picker integration, expo-image-picker for camera, file size validation, queue for upload when WiFi available, mobile-optimized, RTL)
- [X] T103 Update AfterActionCreateScreen to integrate document upload and AI extraction (add upload button, show extraction progress, display suggestions for review, mobile-optimized, RTL)
- [X] T104 Implement push notification handler for AI extraction complete in mobile/src/services/notifications/ai-extraction-handler.ts (deep link to form with suggestions)
- [X] T105 Add attachment queue management in mobile/src/services/attachment-queue.service.ts (queue files for upload, retry with exponential backoff, background upload when WiFi available)

### Component Tests for US2

- [X] T106 [P] [US2] Write component test for AttachmentUpload in frontend/tests/component/AttachmentUpload.test.tsx (test file selection, validation errors, upload progress)
- [X] T107 [P] [US2] Write component test for AIExtractionStatus in frontend/tests/component/AIExtractionStatus.test.tsx (test sync loading, async polling, confidence score display)
- [X] T108 [P] [US2] Write component test for DocumentPicker in mobile/tests/component/DocumentPicker.test.tsx using Jest + RNTL (test camera capture, file picker, queue for upload)

### Run All US2 Tests

- [X] T109 [US2] Run all contract, integration, E2E, and component tests for US2 → verify they PASS
- [X] T110 [US2] Verify AI extraction accuracy ≥85% precision and ≥80% recall on 100 diverse meeting minutes (manual validation)
- [X] T111 [US2] Verify 95% of extracted items have confidence scores ≥0.7

**Checkpoint**: User Story 2 complete. Users can upload meeting minutes and get AI-extracted suggestions, saving 15-30 minutes of manual transcription. Feature still works without AI (fallback to manual entry).

---

## Phase 5: User Story 3 - Bilingual Distribution Package (Priority: P2)

**Goal**: Generate professional bilingual PDFs (English + Arabic) with proper RTL support, organization branding, and confidentiality markings for distribution.

**Independent Test**: Complete after-action record → generate PDFs → verify English PDF has LTR layout, Arabic PDF has RTL layout, both include all content with proper formatting.

**Why This Priority**: Critical for international cooperation but doesn't block core documentation. Can be generated on-demand rather than blocking workflow.

### Contract Tests for US3 (TDD - Write FIRST, Ensure FAIL)

- [X] T112 [P] [US3] Write contract test for POST /pdf-generation/generate-bilingual/:id in backend/tests/contract/pdf-generation-api.test.ts (test bilingual generation <30s, file size validation)
- [X] T113 [P] [US3] Write contract test for GET /pdf-generation/download/:id/:language in backend/tests/contract/pdf-generation-api.test.ts (test signed URL generation, 24h expiry)
- [X] T114 [P] [US3] Run contract tests → verify they FAIL

### Integration Tests for US3 (TDD - Write FIRST, Ensure FAIL)

- [X] T115 [P] [US3] Write integration test for PDF generation workflow in backend/tests/integration/pdf-generation-workflow.test.ts (generate → verify both PDFs created → download via signed URLs → verify content accuracy)
- [X] T116 [P] [US3] Run integration test → verify it FAILS

### E2E Tests for US3 (TDD - Write FIRST, Ensure FAIL)

- [X] T117 [P] [US3] Write E2E test for PDF generation in frontend/tests/e2e/pdf-generation.spec.ts using Playwright (click generate → wait for completion → download both PDFs → verify files exist)
- [X] T118 [P] [US3] Run E2E test → verify it FAILS

### Implementation for US3 - Backend

- [X] T119 Implement PDF generation service in backend/src/services/pdf-generation.service.ts (use pdfkit, custom RTL layout engine for Arabic, Noto Sans fonts, generate English + Arabic PDFs in parallel with Promise.all(), add watermarks for confidential docs, include metadata footer)
- [X] T120 Implement generate-bilingual Edge Function in backend/src/api/pdf-generation/generate-bilingual.ts (validate after-action exists + user has access, call pdf-generation.service, upload PDFs to Supabase Storage, cache metadata in Redis, return file names + storage paths)
- [X] T121 Implement download-pdf Edge Function in backend/src/api/pdf-generation/download-pdf.ts (generate 24h signed URL from Supabase Storage, return download link)

### Implementation for US3 - Frontend Web

- [X] T122 Create PDFPreview component in frontend/src/components/after-action/PDFPreview.tsx (embed PDF viewer for English + Arabic, download buttons for both files, show generation progress, mobile-first, RTL-safe)
- [X] T123 Update AfterActionViewPage to add "Generate Distribution Summary" button (trigger bilingual PDF generation, show PDFPreview when complete, handle generation errors)
- [X] T124 [P] Create TanStack Query hooks in frontend/src/hooks/use-pdf-generation.ts (useGeneratePDF, useDownloadPDF)

### Implementation for US3 - Mobile

- [X] T125 [US3] Implement bilingual PDF generation in mobile/src/services/pdf.service.ts (redirect to web for server-side generation)
  - Detect PDF generation request on mobile
  - Generate deep link URL: `intldossier://after-action/:id/pdf?lang=en|ar&auth_token=JWT`
  - Open in-app browser (expo-web-browser) pointing to web app PDF generation endpoint
  - Web app validates JWT token from URL parameter
  - Web app calls backend Edge Function /pdf-generation/generate-bilingual/:id
  - Backend streams PDF binary to web app
  - Web app triggers browser download or displays inline preview
  - Mobile app monitors deep link callback to close in-app browser after download
  - Handle error cases: expired token (redirect to login), network failure (show retry option)

### Component Tests for US3

- [X] T126 [P] [US3] Write component test for PDFPreview in frontend/tests/component/PDFPreview.test.tsx (test dual PDF display, download buttons, error states)

### Visual Validation for US3

- [X] T127 [US3] Manual visual validation: Generate PDF for after-action with mixed English/Arabic content → verify English PDF has proper LTR layout, Arabic PDF has proper RTL layout with mirrored structure, Arabic numerals used correctly, organization logos present, confidentiality markings visible

### Run All US3 Tests

- [X] T128 [US3] Run all contract, integration, E2E, and component tests for US3 → verify they PASS
- [X] T129 [US3] Verify PDF generation completes within 30 seconds for typical 10-page after-action record
- [X] T130 [US3] Test PDF generation with 10 diverse after-action records (short/long, EN-only/AR-only/mixed) → verify all render correctly

**Checkpoint**: User Story 3 complete. Users can generate bilingual distribution PDFs with proper formatting for both languages. Feature works independently of other stories.

---

## Phase 6: User Story 4 - Edit Workflow with Approvals (Priority: P3)

**Goal**: Allow post-publication edits with supervisor approval to maintain audit integrity and notify stakeholders of updates.

**Independent Test**: Publish after-action → request edit with reason → supervisor approves → edit record → verify version history maintained with field-level diff.

**Why This Priority**: Important for governance but not required for initial launch. Can be added after core functionality is proven.

### Contract Tests for US4 (TDD - Write FIRST, Ensure FAIL)

- [X] T131 [P] [US4] Write contract test for POST /after-action/request-edit/:id in backend/tests/contract/after-action-api.test.ts (test edit request creation, supervisor notification)
- [X] T132 [P] [US4] Write contract test for POST /after-action/approve-edit/:id in backend/tests/contract/after-action-api.test.ts (test approve/reject actions, version snapshot creation)
- [X] T133 [P] [US4] Run contract tests → verify they FAIL

### Integration Tests for US4 (TDD - Write FIRST, Ensure FAIL)

- [X] T134 [P] [US4] Write integration test for edit approval workflow in backend/tests/integration/edit-approval-workflow.test.ts (request edit → approve → make changes → verify version history + field-level diff)
- [X] T135 [P] [US4] Run integration test → verify it FAILS

### E2E Tests for US4 (TDD - Write FIRST, Ensure FAIL)

- [X] T136 [P] [US4] Write E2E test for edit approval workflow in frontend/tests/e2e/edit-approval.spec.ts using Playwright (publish → request edit → supervisor logs in → approve → creator edits → verify version history)
- [X] T137 [P] [US4] Run E2E test → verify it FAILS

### Implementation for US4 - Backend

- [X] T138 Implement state machine workflow service in backend/src/services/after-action-workflow.service.ts (enforce status transitions: draft → published → edit_pending → published, validate transition rules)
- [X] T139 Implement request-edit Edge Function in backend/src/api/after-action/request-edit.ts (validate creator + published status, update status to edit_pending, set edit request metadata, notify supervisor)
- [X] T140 Implement approve-edit Edge Function in backend/src/api/after-action/approve-edit.ts (validate supervisor role, create version snapshot before approval, approve: keep editable temporarily OR reject: clear edit request, notify creator with feedback)
- [X] T141 Update update Edge Function to handle approved edit window (allow edits for 24h after approval OR until next update, then lock again)
- [X] T142 Implement version snapshot creation logic (store full record + nested entities in JSONB, calculate field-level diff from previous version, store in version_snapshots table)

### Implementation for US4 - Frontend Web

- [X] T143 Create EditRequestDialog component in frontend/src/components/after-action/EditRequestDialog.tsx (modal with reason textarea, submit button, mobile-first, RTL-safe)
- [X] T144 Create EditApprovalDialog component in frontend/src/components/after-action/EditApprovalDialog.tsx (side-by-side diff view, approve/reject buttons with feedback textarea, mobile-first, RTL-safe)
- [X] T145 Update AfterActionViewPage to add "Request Edit" button for creators (show EditRequestDialog, handle submission, show "Edit Pending" badge)
- [X] T146 Create supervisor approval page or notification integration (show pending edit requests, open EditApprovalDialog, handle approve/reject actions)
- [X] T147 Add version history tab to AfterActionViewPage (display all versions, version number, timestamps, change diff, who approved, mobile-first, RTL-safe)

### Implementation for US4 - Mobile

- [X] T148 Create EditRequestDialog component in mobile/src/components/AfterAction/EditRequestDialog.tsx (React Native Paper Dialog with TextInput, mobile-optimized, RTL)
- [X] T149 Update AfterActionViewScreen to add "Request Edit" button (show EditRequestDialog, handle submission, biometric confirmation for supervisors per plan.md, mobile-optimized, RTL)
- [X] T150 Implement push notification handler for edit approval requests in mobile/src/services/notifications/edit-approval-handler.ts (notify supervisor, deep link to approval screen)
- [X] T151 Create mobile-optimized diff view for edit approval in mobile/src/screens/AfterAction/EditApprovalScreen.tsx (swipe gestures to compare versions, approve/reject with biometric confirmation, mobile-optimized, RTL)

### Component Tests for US4

- [X] T152 [P] [US4] Write component test for EditRequestDialog in frontend/tests/component/EditRequestDialog.test.tsx (test reason validation, submission)
- [X] T153 [P] [US4] Write component test for EditApprovalDialog in frontend/tests/component/EditApprovalDialog.test.tsx (test diff display, approve/reject actions)

### Run All US4 Tests

- [X] T154 [US4] Run all contract, integration, E2E, and component tests for US4 → verify they PASS
- [X] T155 [US4] Verify version history captures all changes with field-level diff accuracy
- [X] T156 [US4] Verify realtime notifications work for all active viewers when edit is approved

**Checkpoint**: User Story 4 complete. Users can request edits for published after-actions with supervisor approval. Version history maintains full audit trail. Feature works independently.

---

## Phase 7: User Story 5 - External Participant Management (Priority: P3)

**Goal**: Assign commitments to external contacts (non-system users) with optional email notifications and manual status tracking.

**Independent Test**: Create external contact → assign commitment to external contact → verify email notification sent (if enabled) → update commitment status manually → verify status updated.

**Why This Priority**: Handles edge case of mixed internal/external meetings but adds complexity. Most meetings involve internal staff only.

### Contract Tests for US5 (TDD - Write FIRST, Ensure FAIL)

- [X] T157 [P] [US5] Write contract test for POST /external-contacts/create in backend/tests/contract/external-contacts-api.test.ts (test email validation, uniqueness constraint)
- [X] T158 [P] [US5] Write contract test for GET /external-contacts/search in backend/tests/contract/external-contacts-api.test.ts (test fuzzy search, pagination)
- [X] T159 [P] [US5] Write contract test for PUT /external-contacts/update-commitment/:commitment_id in backend/tests/contract/external-contacts-api.test.ts (test manual status updates)
- [X] T160 [P] [US5] Run contract tests → verify they FAIL

### Integration Tests for US5 (TDD - Write FIRST, Ensure FAIL)

- [X] T161 [P] [US5] Write integration test for external contact workflow in backend/tests/integration/external-contact-workflow.test.ts (create contact → assign commitment → send email → update status → verify tracking)
- [X] T162 [P] [US5] Run integration test → verify it FAILS

### Implementation for US5 - Backend

- [X] T163 Implement create Edge Function in backend/src/api/external-contacts/create.ts (validate email format + DNS MX record, enforce uniqueness, lowercase email via trigger)
- [X] T164 Implement search Edge Function in backend/src/api/external-contacts/search.ts (full-text search on name + email using pg_trgm, return top 10 matches, suggest existing contacts before allowing new creation)
- [X] T165 Implement update-commitment Edge Function in backend/src/api/external-contacts/update-commitment.ts (allow internal users to manually update external commitment status, validate commitment belongs to external contact, update updated_at timestamp)
- [X] T166 Update notification service to send emails to external contacts (when commitment assigned + email_enabled=true, include commitment details + due date + context, include public link to after-action summary if not confidential, handle bounce notifications)

### Implementation for US5 - Frontend Web

- [X] T167 Create ExternalContactSearch component in frontend/src/components/after-action/ExternalContactSearch.tsx (autocomplete search, suggest existing before creating new, email validation with typo detection, mobile-first, RTL-safe)
- [X] T168 Update CommitmentList component to support external owner assignment (add "External" owner type toggle, integrate ExternalContactSearch, show "External" badge on external commitments, manual status update controls)
- [X] T169 Create external contact management page (list all external contacts, edit contact preferences, view assigned commitments, mobile-first, RTL-safe)

### Implementation for US5 - Mobile

- [X] T170 Update CommitmentInput component to support external owner selection (add owner type picker, integrate cached external contacts from WatermelonDB, allow offline contact creation queued for sync, mobile-optimized, RTL)
- [X] T171 Update sync service to cache external contacts locally in mobile/src/services/sync/external-contact-sync.service.ts (download full contact list for offline assignment, update when new contacts created)

### Component Tests for US5

- [X] T172 [P] [US5] Write component test for ExternalContactSearch in frontend/tests/component/ExternalContactSearch.test.tsx (test autocomplete, duplicate prevention, email validation)
- [X] T173 [P] [US5] Write component test for updated CommitmentList with external support in frontend/tests/component/CommitmentList-external.test.tsx (test external assignment, manual status tracking)

### Run All US5 Tests

- [X] T174 [US5] Run all contract, integration, and component tests for US5 → verify they PASS
- [X] T175 [US5] Verify email bounce rate <5% through proactive validation
- [X] T176 [US5] Test email notifications sent to 10 external contacts → verify all delivered (or proper bounce handling)

**Checkpoint**: User Story 5 complete. Users can assign commitments to external contacts with email notifications and manual tracking. All 5 user stories now implemented.

---

## Phase 8: Mobile E2E Tests (Cross-Cutting)

**Purpose**: End-to-end mobile testing with offline scenarios

- [X] T177 [P] Write Maestro E2E test for offline after-action creation in mobile/tests/e2e/after-action-offline.yml (create record offline → toggle airplane mode → verify queued for sync → re-enable network → verify sync completes)
- [X] T178 [P] Write Maestro E2E test for sync conflict resolution in mobile/tests/e2e/sync-conflict.yml (edit same record on web + mobile while offline → sync → verify conflict prompt → resolve → verify correct version saved)
- [X] T179 [P] Write Maestro E2E test for push notification flow in mobile/tests/e2e/push-notification.yml (upload document → AI extraction async → receive push notification → verify deep link opens form with suggestions)
- [X] T180 Run all Maestro E2E tests on iOS Simulator and Android Emulator → verify they PASS

---

## Phase 9: Performance & Accessibility Testing (Cross-Cutting)

**Purpose**: Validate performance targets and accessibility compliance

### Performance Tests

- [X] T181 [P] Write performance test for form submission in backend/tests/performance/after-action-submission.test.ts using k6 (100 concurrent users, verify <2s response time, test with 5 commitments + 3 decisions + 2 risks)
- [X] T182 [P] Write performance test for AI extraction sync in backend/tests/performance/ai-extraction.test.ts using k6 (verify <5s for documents <500KB, test 50 concurrent extractions)
- [X] T183 [P] Write performance test for PDF generation in backend/tests/performance/pdf-generation.test.ts using k6 (verify <30s for 10-page after-action, test 20 concurrent generations)
- [X] T184 [P] Write performance test for mobile sync in mobile/tests/performance/sync-performance.test.ts (verify <3s for 10 updated records, test with 1000 records in local DB)
- [X] T185 Run all performance tests → verify targets met: form <2s, AI sync <5s, PDF <30s, mobile sync <3s, 100 concurrent users supported

### Accessibility Tests

- [X] T186 [P] Run WCAG AA compliance tests on all frontend pages using axe-core (verify semantic HTML, keyboard navigation, 4.5:1 color contrast, screen reader compatibility)
- [X] T187 [P] Test RTL layout validation for Arabic on all pages (verify logical properties ms-*/me-*/ps-*/pe-* used, no physical direction properties, directional icons flipped, text-start/text-end alignment)
- [X] T188 [P] Test mobile touch target sizes on all screens (verify min 44x44px touch targets, adequate spacing ≥8px between interactive elements)
- [X] T189 Fix all accessibility violations identified in T186-T188

---

## Phase 10: Polish & Integration (Cross-Cutting Concerns)

**Purpose**: Final improvements affecting multiple user stories

- [X] T190 [P] Add comprehensive error handling across all Edge Functions (Winston logging, user-friendly error messages, retry logic for transient failures)
- [X] T191 [P] Implement rate limiting per API contracts (100 req/min general, 20 req/min write, 10 req/min publish, 5 req/min AI extraction)
- [X] T192 [P] Add Redis caching for AI extraction results (30-day TTL) and PDF generation metadata
- [X] T193 [P] Setup ClamAV virus scanning for attachment uploads (Edge Function trigger on Storage insert, quarantine infected files, notify uploader)
- [X] T194 [P] Implement attachment cleanup cron job (delete orphaned files from Storage after 7 days)
- [X] T195 [P] Add comprehensive audit logging for create/update/delete operations (immutable audit fields, Winston logger with structured logs)
- [X] T196 [P] Setup Supabase Realtime subscriptions for after-action changes (notify active viewers when record updated)
- [X] T197 [P] Add security advisors check using Supabase MCP (check for missing RLS policies, security vulnerabilities)
- [X] T198 Code cleanup and refactoring (remove console.log, apply ESLint/Prettier, extract magic numbers to constants)
- [X] T199 Update quickstart.md with any missing setup steps discovered during implementation
- [X] T200 Run full quickstart.md validation from scratch (fresh environment, follow all steps, verify all features work)

---

## Dependencies & Execution Order

### Phase Dependencies

1. **Setup (Phase 1)**: No dependencies - start immediately
2. **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
3. **User Stories (Phases 3-7)**: All depend on Foundational phase completion
   - User Story 1 (Phase 3 - P1): No dependencies on other stories
   - User Story 2 (Phase 4 - P2): No dependencies on other stories (independent)
   - User Story 3 (Phase 5 - P2): No dependencies on other stories (independent)
   - User Story 4 (Phase 6 - P3): Builds on US1 (requires publish workflow) but independently testable
   - User Story 5 (Phase 7 - P3): Builds on US1 (requires commitment creation) but independently testable
4. **Mobile E2E Tests (Phase 8)**: Depends on US1-US2 mobile implementations
5. **Performance & Accessibility (Phase 9)**: Depends on all desired user stories being complete
6. **Polish (Phase 10)**: Depends on all desired user stories being complete

### User Story Independence

- **US1 (Quick After-Action Creation)**: Foundational story - all others build on this
- **US2 (AI-Assisted Data Entry)**: Independent - can be implemented without US3/US4/US5
- **US3 (Bilingual PDFs)**: Independent - can be implemented without US2/US4/US5
- **US4 (Edit Workflow)**: Depends on US1 publish workflow, but independently testable
- **US5 (External Contacts)**: Depends on US1 commitment creation, but independently testable

### Parallel Opportunities

- **Setup (Phase 1)**: All tasks marked [P] run in parallel (T001-T007)
- **Foundational Database (Phase 2)**: T008-T018 sequential (migrations apply in order), T019-T024 after migrations complete
- **Foundational Types (Phase 2)**: T021-T024 [P] run in parallel after T020 (type generation)
- **Foundational Mobile (Phase 2)**: T025-T036 mixed (schemas [P], services sequential on schemas)
- **Once Foundational complete**: All user stories can START in parallel (if team capacity)
- **Within each user story**:
  - All contract tests [P] run together
  - All integration tests [P] run together
  - All E2E tests [P] run together
  - All component tests [P] run together
  - Backend implementations sequential (dependencies on services)
  - Frontend components [P] run together (different files)
  - Mobile components [P] run together (different files)

---

## Parallel Example: User Story 1

```bash
# After Foundational phase (Phase 2) completes:

# Launch all contract tests for US1 in parallel:
Task T037: Write contract test for POST /after-action/create
Task T038: Write contract test for PUT /after-action/update/:id
Task T039: Write contract test for POST /after-action/publish/:id
Task T040: Write contract test for GET /after-action/list
Task T041: Write contract test for GET /after-action/get/:id
Task T042: Write contract test for DELETE /after-action/delete/:id
Task T043: Run all contract tests → verify FAIL

# Launch all integration tests for US1 in parallel:
Task T044: Write integration test for after-action workflow
Task T045: Write integration test for task creation
Task T046: Run integration tests → verify FAIL

# Launch all E2E tests for US1 in parallel:
Task T047: Write E2E test for after-action create flow
Task T048: Write E2E test for after-action publish
Task T049: Run E2E tests → verify FAIL

# Sequential backend implementation (services → Edge Functions):
Task T050: Implement task creation service (no dependencies)
Task T051: Implement notification service (no dependencies)
Task T052: Implement create Edge Function (depends on T050, T051)
Task T053: Implement update Edge Function (depends on T050, T051)
Task T054: Implement publish Edge Function (depends on T050, T051)
Task T055: Implement list Edge Function (no dependencies)
Task T056: Implement get Edge Function (no dependencies)
Task T057: Implement delete Edge Function (no dependencies)

# Launch all frontend components for US1 in parallel:
Task T058: Create DecisionList component
Task T059: Create CommitmentList component
Task T060: Create RiskList component
# (then T061-T065 sequential on T058-T060)
Task T066: Create TanStack Query hooks
Task T067: Create API client wrapper

# Launch all mobile components for US1 in parallel:
Task T068: Create DecisionInput component
Task T069: Create CommitmentInput component
Task T070: Create RiskInput component
Task T071: Create SyncStatusBadge component
# (then T072-T077 sequential)

# Launch all component tests for US1 in parallel:
Task T078: Write test for DecisionList
Task T079: Write test for CommitmentList
Task T080: Write test for AfterActionForm
Task T081: Write test for AfterActionCreateScreen

# Final validation:
Task T082: Run all US1 tests → verify PASS
Task T083: Verify test coverage ≥80%
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T007)
2. Complete Phase 2: Foundational (T008-T036) - CRITICAL blocking phase
3. Complete Phase 3: User Story 1 (T037-T083)
4. **STOP and VALIDATE**: Test US1 independently - users can create after-actions, auto-create tasks, view in dossier timeline
5. Deploy/demo if ready - this is the **minimum viable product**

**Timeline**: ~3-4 weeks for MVP (1 developer)

### Incremental Delivery

1. **Foundation** (Phases 1-2): Setup + Database + Types + Mobile Infrastructure → Foundation ready
2. **US1** (Phase 3): After-action creation + task auto-creation → Test independently → Deploy/Demo (MVP!)
3. **US2** (Phase 4): AI extraction → Test independently → Deploy/Demo (time savings demonstrated)
4. **US3** (Phase 5): Bilingual PDFs → Test independently → Deploy/Demo (distribution capability added)
5. **US4** (Phase 6): Edit workflow → Test independently → Deploy/Demo (governance satisfied)
6. **US5** (Phase 7): External contacts → Test independently → Deploy/Demo (mixed meetings supported)
7. **Polish** (Phases 8-10): Mobile E2E + Performance + Final polish → Full release

**Timeline**: ~6-8 weeks for full implementation (2 developers in parallel)

### Parallel Team Strategy (2 Developers)

**Week 1-2: Foundation (Together)**
- Both developers: Complete Setup (Phase 1) + Foundational (Phase 2)
- Pairing on database schema, RLS policies, mobile setup

**Week 3-4: US1 + US2 (Parallel)**
- Developer A: User Story 1 (after-action creation) - backend + frontend + mobile
- Developer B: User Story 2 (AI extraction) - backend + frontend + mobile
- Both stories can proceed in parallel after foundation

**Week 5: US3 + US4 (Parallel)**
- Developer A: User Story 3 (bilingual PDFs)
- Developer B: User Story 4 (edit workflow)

**Week 6: US5 + Integration (Parallel)**
- Developer A: User Story 5 (external contacts)
- Developer B: Mobile E2E tests (Phase 8)

**Week 7-8: Polish & Release**
- Both developers: Performance testing (Phase 9), final polish (Phase 10), quickstart validation

---

## Summary

**Total Tasks**: 200 tasks
**Parallel Opportunities**: 89 tasks marked [P] (44.5% parallelizable)
**User Story Breakdown**:
- Setup: 7 tasks
- Foundational: 29 tasks (CRITICAL - blocks all stories)
- User Story 1 (P1 - MVP): 47 tasks
- User Story 2 (P2): 28 tasks
- User Story 3 (P2): 19 tasks
- User Story 4 (P3): 26 tasks
- User Story 5 (P3): 20 tasks
- Mobile E2E: 4 tasks
- Performance & Accessibility: 9 tasks
- Polish: 11 tasks

**MVP Scope**: Phase 1 (Setup) + Phase 2 (Foundational) + Phase 3 (US1) = 83 tasks (41.5% of total)

**Estimated Timeline**:
- MVP (US1 only): 3-4 weeks (1 developer)
- MVP + AI (US1-US2): 4-5 weeks (1 developer) OR 3 weeks (2 developers parallel)
- Full feature (US1-US5): 6-8 weeks (2 developers parallel) OR 10-12 weeks (1 developer sequential)

**Key Success Criteria**:
- Each user story can be tested independently
- MVP (US1) provides immediate value
- Stories can be deployed incrementally
- Team can work in parallel after foundational phase
- All tests written first (TDD approach)
- Constitution compliance verified (mobile-first, RTL, test-first, security, accessibility)

---

## Next Steps

1. Review tasks.md with team
2. Prioritize: Start with MVP (US1) or full feature (US1-US5)?
3. Assign developers to phases/stories
4. Begin Phase 1: Setup
5. Proceed to Phase 2: Foundational (CRITICAL - must complete before user stories)
6. Start user story implementation in priority order or parallel (based on team capacity)
7. Test each story independently before moving to next
8. Deploy incrementally as stories complete
