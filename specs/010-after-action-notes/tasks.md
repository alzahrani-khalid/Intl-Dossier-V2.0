# Tasks: After-Action Notes

**Input**: Design documents from `/specs/010-after-action-notes/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/api-spec.yaml, quickstart.md

## Execution Flow
```
1. Load plan.md from feature directory ✅
   → Tech stack: TypeScript 5.0+, React 18+, Supabase, TanStack Router/Query
   → Structure: Web app (backend/ + frontend/)
2. Load design documents ✅
   → data-model.md: 11 entities extracted
   → contracts/api-spec.yaml: 16 endpoints across 4 categories
   → research.md: 4 technical decisions
   → quickstart.md: 8 user stories + 8 edge cases
3. Generate tasks by category ✅
4. Apply task rules ✅
5. Number tasks sequentially (T001-T101) ✅
6. Generate dependency graph ✅
7. Create parallel execution examples ✅
8. Validate task completeness ✅
```

## Format: `- [ ] [ID] [P?] Description`
- **Checkbox `- [ ]`**: Mark as `- [x]` when task is complete
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

### Progress Tracking
To mark a task as complete, change `- [ ]` to `- [x]` in the task header. Example:
```markdown
### - [x] T001 [P] Create engagements table migration  ✅ Done
### - [ ] T002 Create after_action_records table migration  ⏳ In Progress
```

## Path Conventions
- **Backend**: `supabase/migrations/`, `supabase/functions/`
- **Frontend**: `frontend/src/components/`, `frontend/src/hooks/`, `frontend/src/routes/`
- **Tests**: `backend/tests/contract/`, `frontend/tests/e2e/`

---

## Phase 1: Database Layer (Migrations)

### - [x] T001 [P] Create engagements table migration ✅ Done
**File**: `supabase/migrations/20250930100_create_engagements_table.sql`
**Description**: Create `engagements` table with columns: id, dossier_id, title, engagement_type, engagement_date, location, description, created_by, created_at, updated_at. Include CHECK constraints for engagement_type enum and indexes on dossier_id and engagement_date.
**Reference**: data-model.md lines 76-94

### - [x] T002 Create after_action_records table migration ✅ Done
**File**: `supabase/migrations/20250930101_create_after_action_records_table.sql`
**Description**: Create `after_action_records` table with columns per data-model.md. Depends on engagements table (foreign key). Include publication_status enum, optimistic locking version field, and indexes on engagement_id, dossier_id, status.
**Reference**: data-model.md lines 147-177
**Dependencies**: T001

### - [x] T003 [P] Create external_contacts table migration ✅ Done
**File**: `supabase/migrations/20250930102_create_external_contacts_table.sql`
**Description**: Create `external_contacts` table with email (unique), full_name, organization, notification_preference. Include email format CHECK constraint and index on email.
**Reference**: data-model.md lines 426-437

### - [x] T004 Create decisions table migration ✅ Done
**File**: `supabase/migrations/20250930103_create_decisions_table.sql`
**Description**: Create `decisions` table with foreign key to after_action_records. Include CHECK constraints on description (1-2000 chars) and index on after_action_id.
**Reference**: data-model.md lines 277-289
**Dependencies**: T002

### - [x] T005 [P] Create commitments table migration ✅ Done
**File**: `supabase/migrations/20250930104_create_commitments_table.sql`
**Description**: Create `commitments` table with foreign keys to after_action_records, dossiers, auth.users, external_contacts. Include CHECK constraints for valid_owner (internal XOR external) and valid_tracking (automatic=internal, manual=external). Add indexes on after_action_id, dossier_id, owner_user_id, owner_contact_id, status, due_date.
**Reference**: data-model.md lines 353-387
**Dependencies**: T002, T003

### - [x] T006 [P] Create risks table migration ✅ Done
**File**: `supabase/migrations/20250930105_create_risks_table.sql`
**Description**: Create `risks` table with foreign key to after_action_records. Include severity and likelihood enums, ai_confidence field (0-1), indexes on after_action_id and severity.
**Reference**: data-model.md lines 486-500
**Dependencies**: T002

### - [x] T007 [P] Create follow_up_actions table migration ✅ Done
**File**: `supabase/migrations/20250930106_create_follow_up_actions_table.sql`
**Description**: Create `follow_up_actions` table with foreign key to after_action_records. Optional assigned_to and target_date fields. Indexes on after_action_id and completed.
**Reference**: data-model.md lines 531-543
**Dependencies**: T002

### - [x] T008 [P] Create attachments table migration ✅ Done
**File**: `supabase/migrations/20250930107_create_attachments_table.sql`
**Description**: Create `attachments` table with foreign key to after_action_records. Include mime_type CHECK constraint (PDF, DOCX, XLSX, PPTX, PNG, JPG, TXT, CSV), file_size constraint (max 100MB), scan_status enum. Add trigger `enforce_attachment_limit` to block >10 attachments per record.
**Reference**: data-model.md lines 583-617
**Dependencies**: T002

### - [x] T009 Create after_action_versions table migration ✅ Done
**File**: `supabase/migrations/20250930108_create_after_action_versions_table.sql`
**Description**: Create `after_action_versions` table for audit trail. JSONB content field for full snapshots. Unique constraint on (after_action_id, version_number). Index on (after_action_id, version_number DESC).
**Reference**: data-model.md lines 233-245
**Dependencies**: T002

### - [x] T010 [P] Create user_notification_preferences table migration ✅ Done
**File**: `supabase/migrations/20250930109_create_user_notification_preferences_table.sql`
**Description**: Create `user_notification_preferences` table with user_id as primary key. Boolean fields for in-app/email preferences, language_preference (en/ar). Add trigger to auto-create preferences on user creation.
**Reference**: data-model.md lines 654-662, 839-852

### - [x] T011 [P] Create notifications table migration ✅ Done
**File**: `supabase/migrations/20250930110_create_notifications_table.sql`
**Description**: Create `notifications` table with foreign key to auth.users. Type enum (commitment_assigned, commitment_due_soon, after_action_published, edit_approved, edit_rejected). Indexes on (user_id, read_at) WHERE read_at IS NULL, and created_at DESC.
**Reference**: data-model.md lines 702-718

### - [x] T012 Create indexes migration ✅ Done
**File**: `supabase/migrations/20250930111_create_indexes.sql`
**Description**: Create all missing performance indexes: composite index on dossier_owners(user_id, dossier_id), partial indexes on unread notifications, indexes on foreign keys not already indexed.
**Reference**: data-model.md lines 901-906, research.md lines 326-338
**Dependencies**: T001-T011

### - [x] T013 Enable RLS on all tables migration ✅ Done
**File**: `supabase/migrations/20250930112_enable_rls.sql`
**Description**: Execute `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` on all after-action tables (engagements, after_action_records, decisions, commitments, risks, follow_up_actions, attachments, after_action_versions, external_contacts, user_notification_preferences, notifications).
**Reference**: data-model.md lines 730-783
**Dependencies**: T001-T011

### - [x] T014 Create RLS policies migration ✅ Done
**File**: `supabase/migrations/20250930113_create_rls_policies.sql`
**Description**: Create hybrid permission RLS policies: after_actions (role + dossier assignment), commitments (owner OR dossier assignment), decisions/risks/follow_ups (cascade from after_action). Use auth.uid() and auth.jwt()->>'role'.
**Reference**: data-model.md lines 743-783, research.md lines 287-318
**Dependencies**: T013

### - [x] T015 Create database functions migration ✅ Done
**File**: `supabase/migrations/20250930114_create_database_functions.sql`
**Description**: Create `update_overdue_commitments()` function to mark commitments overdue past due_date. Schedule via pg_cron (hourly: '0 * * * *'). Create `check_attachment_limit()` trigger function (already in T008 schema).
**Reference**: data-model.md lines 820-832
**Dependencies**: T005, T008

---

## Phase 2: Backend - Contract Tests (TDD) ⚠️ MUST COMPLETE BEFORE PHASE 3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY Edge Function implementation**

### - [x] T016 [P] Contract test: POST /engagements ✅ Done
**File**: `backend/tests/contract/engagements-create.test.ts`
**Description**: Test contract for POST /engagements endpoint. Assert request schema (CreateEngagementRequest: dossier_id, title, engagement_type, engagement_date), response 201 with Engagement schema, 400 on invalid type, 403 on unauthorized dossier.
**Reference**: contracts/api-spec.yaml lines 32-54

### - [x] T017 [P] Contract test: GET /engagements/{id}
**File**: `backend/tests/contract/engagements-get.test.ts`
**Description**: Test contract for GET /engagements/{engagementId}. Assert response 200 with Engagement schema, 404 on non-existent ID.
**Reference**: contracts/api-spec.yaml lines 57-71

### - [x] T018 [P] Contract test: PATCH /engagements/{id}
**File**: `backend/tests/contract/engagements-update.test.ts`
**Description**: Test contract for PATCH /engagements/{engagementId}. Assert UpdateEngagementRequest schema, response 200 with updated Engagement.
**Reference**: contracts/api-spec.yaml lines 73-92

### - [x] T019 [P] Contract test: GET /dossiers/{id}/engagements
**File**: `backend/tests/contract/engagements-list.test.ts`
**Description**: Test contract for GET /dossiers/{dossierId}/engagements. Assert pagination (limit, offset), response with data array, total count.
**Reference**: contracts/api-spec.yaml lines 93-128

### - [x] T020 [P] Contract test: POST /after-actions
**File**: `backend/tests/contract/after-actions-create.test.ts`
**Description**: Test contract for POST /after-actions. Assert CreateAfterActionRequest schema (engagement_id, is_confidential, attendees max 100, nested decisions/commitments/risks), response 201 with AfterActionRecord.
**Reference**: contracts/api-spec.yaml lines 131-150

### - [x] T021 [P] Contract test: GET /after-actions/{id}
**File**: `backend/tests/contract/after-actions-get.test.ts`
**Description**: Test contract for GET /after-actions/{afterActionId}. Assert response includes all child entities (decisions, commitments, risks, follow_ups) via JSON aggregation, 404 on non-existent.
**Reference**: contracts/api-spec.yaml lines 153-167

### - [x] T022 [P] Contract test: PATCH /after-actions/{id}
**File**: `backend/tests/contract/after-actions-update.test.ts`
**Description**: Test contract for PATCH /after-actions/{afterActionId}. Assert version field required (optimistic locking), response 409 on version mismatch, 200 on success with incremented version.
**Reference**: contracts/api-spec.yaml lines 169-194

### - [x] T023 [P] Contract test: POST /after-actions/{id}/publish
**File**: `backend/tests/contract/after-actions-publish.test.ts`
**Description**: Test publish endpoint. Assert 403 with "step_up_required" error if is_confidential=true and no mfa_token, 403 if role != supervisor/admin, 200 on success with publication_status=published.
**Reference**: contracts/api-spec.yaml lines 195-228

### - [x] T024 [P] Contract test: POST /after-actions/{id}/request-edit
**File**: `backend/tests/contract/after-actions-request-edit.test.ts`
**Description**: Test edit request. Assert reason (10-500 chars) and changes (JSON patch) required, status changes to edit_requested, 400 on invalid reason length.
**Reference**: contracts/api-spec.yaml lines 229-257

### - [x] T025 [P] Contract test: POST /after-actions/{id}/approve-edit
**File**: `backend/tests/contract/after-actions-approve-edit.test.ts`
**Description**: Test approve edit. Assert 403 if role != supervisor, creates new version on success, status returns to published, edit_approved_by and edit_approved_at populated.
**Reference**: contracts/api-spec.yaml lines 259-283

### - [x] T026 [P] Contract test: POST /after-actions/{id}/reject-edit
**File**: `backend/tests/contract/after-actions-reject-edit.test.ts`
**Description**: Test reject edit. Assert rejection_reason required (10-500 chars), status returns to published (no version created), edit_rejection_reason populated.
**Reference**: contracts/api-spec.yaml lines 285-306

### - [x] T027 [P] Contract test: GET /after-actions/{id}/versions
**File**: `backend/tests/contract/after-actions-versions.test.ts`
**Description**: Test version history retrieval. Assert returns array of AfterActionVersion with version_number descending, content JSONB includes full snapshot.
**Reference**: contracts/api-spec.yaml lines 308-323

### - [x] T028 [P] Contract test: GET /dossiers/{id}/after-actions
**File**: `backend/tests/contract/after-actions-list.test.ts`
**Description**: Test list endpoint. Assert status filter (draft/published/edit_requested), pagination, RLS enforcement (only assigned dossiers visible).
**Reference**: contracts/api-spec.yaml lines 325-360

### - [x] T029 [P] Contract test: POST /ai/extract
**File**: `backend/tests/contract/ai-extract.test.ts`
**Description**: Test AI extraction endpoint. Assert multipart/form-data with file, language (en/ar), mode (sync/async/auto). Response 200 (sync) with ExtractionResult or 202 (async) with job_id and estimated_time.
**Reference**: contracts/api-spec.yaml lines 363-411

### - [x] T030 [P] Contract test: GET /ai/extract/{jobId}
**File**: `backend/tests/contract/ai-extract-status.test.ts`
**Description**: Test async job status. Assert response oneOf: processing (progress 0-100), completed (result), failed (error message).
**Reference**: contracts/api-spec.yaml lines 413-453

### - [x] T031 [P] Contract test: POST /after-actions/{id}/pdf
**File**: `backend/tests/contract/pdf-generate.test.ts`
**Description**: Test PDF generation. Assert mfa_token required if is_confidential=true, language (en/ar/both) param, response includes pdf_url (signed URL) with 24-hour expiry.
**Reference**: contracts/api-spec.yaml lines 456-492

### - [x] T032 [P] Contract test: POST /after-actions/{id}/attachments
**File**: `backend/tests/contract/attachments-upload.test.ts`
**Description**: Test attachment upload. Assert multipart/form-data, max 100MB, allowed mime types, scan_status=pending on upload, 400 if >10 attachments exist.
**Reference**: contracts/api-spec.yaml lines 494-520

### - [x] T033 [P] Contract test: GET /after-actions/{id}/attachments
**File**: `backend/tests/contract/attachments-list.test.ts`
**Description**: Test attachments list. Assert returns array of Attachment with file_url (signed URL, 24-hour expiry), scan_status visible.
**Reference**: contracts/api-spec.yaml lines 522-536

### - [x] T034 [P] Contract test: DELETE /attachments/{id}
**File**: `backend/tests/contract/attachments-delete.test.ts`
**Description**: Test attachment deletion. Assert 204 on success, deletes from Supabase Storage and DB record, 403 if not creator.
**Reference**: contracts/api-spec.yaml lines 538-552

### - [x] T035 [P] Contract test: PATCH /commitments/{id}/status
**File**: `backend/tests/contract/commitments-update-status.test.ts`
**Description**: Test commitment status update. Assert status enum validation (pending, in_progress, completed, cancelled, overdue), completed_at timestamp set when status=completed, 403 if not owner (for internal) or not authorized (for external manual updates).
**Reference**: quickstart.md lines 599-650, data-model.md lines 332-338

---

## Phase 3: Backend - Edge Functions Implementation (ONLY after Phase 2 tests failing)

### - [x] T036 Implement Supabase Edge Function: engagements (CRUD) ✅ Done
**File**: `supabase/functions/engagements/index.ts`
**Description**: Implement POST, GET, PATCH, LIST for engagements. Use Supabase client with RLS. Zod validation for request bodies. Make T016-T019 pass.
**Reference**: contracts/api-spec.yaml lines 30-128
**Dependencies**: T016-T019 (tests must fail first)

### - [x] T037 Implement Supabase Edge Function: after-actions-create ✅ Done
**File**: `supabase/functions/after-actions-create/index.ts`
**Description**: Implement POST /after-actions. Transaction to insert after_action_record + child entities (decisions, commitments, risks, follow_ups). Handle external contact creation/linking for commitments. Make T020 pass.
**Reference**: contracts/api-spec.yaml lines 131-150, data-model.md lines 304-349
**Dependencies**: T020

### - [x] T038 Implement Supabase Edge Function: after-actions-get ✅ Done
**File**: `supabase/functions/after-actions-get/index.ts`
**Description**: Implement GET /after-actions/{id}. Single query with json_agg to avoid N+1 for child entities. RLS enforcement. Make T021 pass.
**Reference**: contracts/api-spec.yaml lines 153-167, research.md lines 340-349
**Dependencies**: T021

### - [x] T039 Implement Supabase Edge Function: after-actions-update ✅ Done
**File**: `supabase/functions/after-actions-update/index.ts`
**Description**: Implement PATCH /after-actions/{id}. Check version field (optimistic locking), return 409 if mismatch. Update parent + upsert child entities. Increment version. Make T022 pass.
**Reference**: contracts/api-spec.yaml lines 169-194
**Dependencies**: T022

### - [x] T040 Implement Supabase Edge Function: after-actions-publish ✅ Done
**File**: `supabase/functions/after-actions-publish/index.ts`
**Description**: Implement POST /after-actions/{id}/publish. Check role (supervisor/admin), verify step-up MFA if is_confidential=true (Supabase auth.mfa.verify), set publication_status=published, insert version 1, send notifications. Make T023 pass.
**Reference**: contracts/api-spec.yaml lines 195-228, research.md lines 362-374
**Dependencies**: T023

### - [x] T041 Implement Supabase Edge Function: after-actions-request-edit ✅ Done
**File**: `supabase/functions/after-actions-request-edit/index.ts`
**Description**: Implement POST /after-actions/{id}/request-edit. Validate reason (10-500 chars), store proposed changes as JSON, set status=edit_requested, send notification to supervisors. Make T024 pass.
**Reference**: contracts/api-spec.yaml lines 229-257
**Dependencies**: T024

### - [x] T042 Implement Supabase Edge Function: after-actions-approve-edit ✅ Done
**File**: `supabase/functions/after-actions-approve-edit/index.ts`
**Description**: Implement POST /after-actions/{id}/approve-edit. Check role (supervisor), apply proposed changes, increment version, insert new version snapshot, set edit_approved_by/at, send notification to requester. Make T025 pass.
**Reference**: contracts/api-spec.yaml lines 259-283
**Dependencies**: T025

### - [x] T043 Implement Supabase Edge Function: after-actions-reject-edit ✅ Done
**File**: `supabase/functions/after-actions-reject-edit/index.ts`
**Description**: Implement POST /after-actions/{id}/reject-edit. Check role (supervisor), validate rejection_reason (10-500 chars), set status=published (no version increment), send notification to requester. Make T026 pass.
**Reference**: contracts/api-spec.yaml lines 285-306
**Dependencies**: T026

### - [x] T044 Implement Supabase Edge Function: after-actions-versions ✅ Done
**File**: `supabase/functions/after-actions-versions/index.ts`
**Description**: Implement GET /after-actions/{id}/versions. Query after_action_versions ordered by version_number DESC, return full content snapshots. Make T027 pass.
**Reference**: contracts/api-spec.yaml lines 308-323
**Dependencies**: T027

### - [x] T045 Implement Supabase Edge Function: after-actions-list ✅ Done
**File**: `supabase/functions/after-actions-list/index.ts`
**Description**: Implement GET /dossiers/{id}/after-actions. Filter by status query param, pagination (limit/offset), RLS enforcement. Make T028 pass.
**Reference**: contracts/api-spec.yaml lines 325-360
**Dependencies**: T028

### - [x] T046 Implement Supabase Edge Function: ai-extract ✅ Done
**File**: `supabase/functions/ai-extract/index.ts`
**Description**: Implement POST /ai/extract. Estimate processing time based on file size (research.md lines 273-281). Sync mode (<5 sec): extract via AnythingLLM API with structured prompt (research.md lines 82-102), return ExtractionResult with confidence scores. Async mode: store job, process in background, return job_id. Fallback: return error if AnythingLLM unavailable. Make T029 pass.
**Reference**: contracts/api-spec.yaml lines 363-411, research.md lines 68-120
**Dependencies**: T029

### - [x] T047 Implement Supabase Edge Function: ai-extract-status ✅ Done
**File**: `supabase/functions/ai-extract-status/index.ts`
**Description**: Implement GET /ai/extract/{jobId}. Query job status from DB (create ai_extraction_jobs table in T045 if needed). Return processing/completed/failed with result or error. Make T030 pass.
**Reference**: contracts/api-spec.yaml lines 413-453
**Dependencies**: T030

### - [x] T048 Implement Supabase Edge Function: pdf-generate ✅ Done
**File**: `supabase/functions/pdf-generate/index.ts`
**Description**: Implement POST /after-actions/{id}/pdf. Verify step-up MFA if is_confidential. Use @react-pdf/renderer with bilingual templates (research.md lines 40-60). Generate PDF (target <3 sec), upload to Supabase Storage, return signed URL (24-hour expiry). Include confidential watermark if applicable. Make T031 pass.
**Reference**: contracts/api-spec.yaml lines 456-492, research.md lines 13-66
**Dependencies**: T031

### - [x] T049 Implement Supabase Edge Function: attachments (upload/list/delete) ✅ Done
**File**: `supabase/functions/attachments/index.ts`
**Description**: Implement POST /after-actions/{id}/attachments (upload to Supabase Storage, trigger ClamAV scan via Docker API, insert DB record with scan_status=pending), GET /after-actions/{id}/attachments (list with signed URLs), DELETE /attachments/{id} (delete from Storage + DB). Enforce max 10 attachments, max 100MB, allowed mime types. Make T032-T034 pass.
**Reference**: contracts/api-spec.yaml lines 494-552, data-model.md lines 588-617
**Dependencies**: T032-T034

### - [x] T050 Implement Supabase Edge Function: commitments-update-status ✅ Done
**File**: `supabase/functions/commitments-update-status/index.ts`
**Description**: Implement PATCH /commitments/{id}/status. Validate status enum (pending, in_progress, completed, cancelled, overdue). Set completed_at timestamp when status=completed. For internal commitments: only owner can update. For external commitments: staff/supervisor can update manually (tracking_mode=manual). Record audit trail. Make T035 pass.
**Reference**: quickstart.md lines 599-650, data-model.md lines 332-338
**Dependencies**: T035

---

## Phase 4: Frontend - Components

### - [x] T051 [P] Create EngagementForm component ✅ Done
**File**: `frontend/src/components/EngagementForm.tsx`
**Description**: Form component for creating/editing engagements. Fields: title, engagement_type dropdown, engagement_date datepicker, location, description. Bilingual labels (i18n). Zod validation client-side.
**Reference**: quickstart.md lines 55-71

### - [x] T052 Create AfterActionForm component ✅ Done
**File**: `frontend/src/components/AfterActionForm.tsx`
**Description**: Main after-action form with sections: attendees (comma-separated input), decisions (DecisionList), commitments (CommitmentEditor), risks (RiskList), follow-ups (FollowUpList), attachments (AttachmentUploader), notes textarea, confidential checkbox. AI extraction button. Save draft / Publish buttons (role-gated).
**Reference**: quickstart.md lines 62-77, 139-146
**Dependencies**: T051-T056

### - [x] T053 [P] Create DecisionList component ✅ Done
**File**: `frontend/src/components/DecisionList.tsx`
**Description**: Repeatable decision fields component. Fields: description, rationale, decision_maker, decision_date. Add/remove buttons. Displays ai_confidence badge if populated.
**Reference**: quickstart.md lines 79-90, data-model.md lines 263-273

### - [x] T054 [P] Create CommitmentEditor component ✅ Done
**File**: `frontend/src/components/CommitmentEditor.tsx`
**Description**: Repeatable commitment fields. Owner type radio (internal/external). Internal: user dropdown. External: email + name + org inputs. Due date, priority dropdown. Manual status update for external commitments. Confidence badge.
**Reference**: quickstart.md lines 92-117, data-model.md lines 304-349

### - [x] T055 [P] Create RiskList component ✅ Done
**File**: `frontend/src/components/RiskList.tsx`
**Description**: Repeatable risk fields. Description, severity dropdown, likelihood dropdown, mitigation_strategy, owner (optional). Confidence badge. Color-coded severity badges.
**Reference**: quickstart.md lines 119-131, data-model.md lines 455-481

### - [x] T056 [P] Create FollowUpList component ✅ Done
**File**: `frontend/src/components/FollowUpList.tsx`
**Description**: Repeatable follow-up action fields. Description, assigned_to (optional), target_date (optional), completed checkbox. Supports TBD fields.
**Reference**: quickstart.md lines 512-527, data-model.md lines 516-527

### - [x] T057 [P] Create AttachmentUploader component ✅ Done
**File**: `frontend/src/components/AttachmentUploader.tsx`
**Description**: File upload component with drag-drop. Displays list of uploaded attachments with file name, size, scan_status badge (pending/clean/infected), delete button. Enforces max 10 files, max 100MB per file, allowed mime types. Shows scan progress.
**Reference**: quickstart.md lines 68-70, data-model.md lines 559-579

### - [x] T058 [P] Create AIExtractionButton component ✅ Done
**File**: `frontend/src/components/AIExtractionButton.tsx`
**Description**: Button to upload meeting minutes and extract data. Shows loading (sync mode) or background notification (async mode). On completion, shows merge modal with side-by-side diff (current form vs extracted data). Per-item [Skip] [Add] [Replace] buttons. Graceful fallback if AI unavailable.
**Reference**: quickstart.md lines 162-252

### - [x] T059 [P] Create PDFGeneratorButton component ✅ Done
**File**: `frontend/src/components/PDFGeneratorButton.tsx`
**Description**: Button to generate PDF. Language selector modal (en/ar/both). Triggers step-up MFA if is_confidential. Shows loading (~2-3 sec). Returns download link (24-hour expiry).
**Reference**: quickstart.md lines 524-585

### - [x] T060 [P] Create VersionHistoryViewer component ✅ Done
**File**: `frontend/src/components/VersionHistoryViewer.tsx`
**Description**: Modal displaying version history table. Columns: version number, changed_by, changed_at, [View] button. Clicking [View] shows side-by-side diff with previous version using deep-diff library. Highlight changes (green=add, red=delete, yellow=modify).
**Reference**: quickstart.md lines 482-492, research.md lines 199-240

### - [x] T061 [P] Create EditApprovalFlow component ✅ Done
**File**: `frontend/src/components/EditApprovalFlow.tsx`
**Description**: Component for supervisors to review edit requests. Shows edit_request_reason, side-by-side diff (v1 current vs v2 proposed), [Approve] [Reject] buttons. Approval notes field (optional). Rejection reason field (required, 10-500 chars).
**Reference**: quickstart.md lines 454-505

---

## Phase 5: Frontend - TanStack Query Hooks

### - [x] T062 [P] Create useEngagement and useCreateEngagement hooks ✅ Done
**File**: `frontend/src/hooks/useEngagement.ts`
**Description**: TanStack Query hooks for engagements. useEngagement(id) for fetching, useCreateEngagement() mutation for POST, useUpdateEngagement() mutation for PATCH. Optimistic updates.
**Reference**: contracts/api-spec.yaml lines 30-92

### - [x] T063 [P] Create useAfterAction, useCreateAfterAction, useUpdateAfterAction hooks ✅ Done
**File**: `frontend/src/hooks/useAfterAction.ts`
**Description**: TanStack Query hooks for after-actions. useAfterAction(id) fetches with child entities. useCreateAfterAction() mutation, useUpdateAfterAction() with version optimistic locking. Invalidates queries on success.
**Reference**: contracts/api-spec.yaml lines 131-194

### - [x] T064 Create usePublishAfterAction hook ✅ Done
**File**: `frontend/src/hooks/usePublishAfterAction.ts`
**Description**: Mutation hook for POST /after-actions/{id}/publish. Checks is_confidential, prompts for step-up MFA if needed (Supabase auth.mfa.challenge), sends mfa_token in request. Invalidates after-action queries on success.
**Reference**: contracts/api-spec.yaml lines 195-228, research.md lines 362-374
**Dependencies**: T061

### - [x] T065 [P] Create useRequestEdit and useApproveEdit hooks ✅ Done
**File**: `frontend/src/hooks/useEditWorkflow.ts`
**Description**: Mutation hooks for POST /after-actions/{id}/request-edit, POST /approve-edit, POST /reject-edit. Handle status transitions. Invalidate queries and send optimistic updates.
**Reference**: contracts/api-spec.yaml lines 229-306

### - [x] T066 Create useAIExtract hook ✅ Done
**File**: `frontend/src/hooks/useAIExtract.ts`
**Description**: Mutation hook for POST /ai/extract. Handles sync (loading state) and async (returns job_id, poll GET /ai/extract/{jobId} every 2 sec until completed/failed). Graceful fallback on error.
**Reference**: contracts/api-spec.yaml lines 363-453, research.md lines 250-270
**Dependencies**: T061

### - [x] T067 Create useGeneratePDF hook ✅ Done
**File**: `frontend/src/hooks/useGeneratePDF.ts`
**Description**: Mutation hook for POST /after-actions/{id}/pdf. Checks is_confidential, prompts for step-up MFA if needed. Returns pdf_url signed URL. Loading state (~2-3 sec).
**Reference**: contracts/api-spec.yaml lines 456-492
**Dependencies**: T061

### - [x] T068 [P] Create useAttachments and useUploadAttachment hooks ✅ Done
**File**: `frontend/src/hooks/useAttachments.ts`
**Description**: TanStack Query hooks for attachments. useAttachments(afterActionId) fetches list with signed URLs. useUploadAttachment() mutation for multipart upload, useDeleteAttachment() mutation. Poll scan_status every 5 sec until clean/infected.
**Reference**: contracts/api-spec.yaml lines 494-552

---

## Phase 6: Frontend - Routes

### - [x] T069 Create route: /engagements/:id ✅ Done
**File**: `frontend/src/routes/_protected/engagements/$engagementId.tsx`
**Description**: TanStack Router route for engagement detail view. Displays engagement info, "Log After-Action" button navigating to T068.
**Reference**: quickstart.md lines 55-57
**Dependencies**: T060

### - [x] T070 Create route: /engagements/:id/after-action ✅ Done
**File**: `frontend/src/routes/_protected/engagements/$engagementId/after-action.tsx`
**Description**: TanStack Router route for after-action form. Embeds AfterActionForm component. Handles save draft / publish actions.
**Reference**: quickstart.md lines 62-146
**Dependencies**: T050, T061

### - [x] T071 Create route: /after-actions/:id ✅ Done
**File**: `frontend/src/routes/_protected/after-actions/$afterActionId.tsx`
**Description**: TanStack Router route for after-action detail view. Read-only display if published. Shows "Request Edit" button (creator/supervisor), "Publish" button (supervisor/admin), "Generate PDF" button, "Version History" button. Edit approval flow for supervisors.
**Reference**: quickstart.md lines 282-337, 420-505
**Dependencies**: T061, T059

### - [x] T072 Create route: /after-actions/:id/versions ✅ Done
**File**: `frontend/src/routes/_protected/after-actions/$afterActionId/versions.tsx`
**Description**: TanStack Router route for version history page. Embeds VersionHistoryViewer component. Shows table of versions with side-by-side diff on click.
**Reference**: quickstart.md lines 482-492
**Dependencies**: T058

---

## Phase 7: Integration Tests (E2E)

### - [x] T079 [P] Integration test: User Story 1 - Log After-Action Record ✅ Done
**File**: `frontend/tests/e2e/log-after-action.spec.ts`
**Description**: Playwright E2E test following quickstart.md lines 46-153. Navigate from engagement → after-action form, fill attendees, add decision, add internal commitment, add external commitment, add risk, save draft. Assert draft appears in timeline.
**Reference**: quickstart.md lines 46-153

### - [x] T080 [P] Integration test: User Story 2 - AI-Assisted Extraction ✅ Done
**File**: `frontend/tests/e2e/ai-extraction.spec.ts`
**Description**: Playwright E2E test for AI extraction. Upload small file (sync mode), verify extracted data populates form with confidence scores. Upload large file (async mode), verify background notification, merge flow. Test fallback when AI unavailable.
**Reference**: quickstart.md lines 155-261

### - [x] T079 [P] Integration test: User Story 3 ✅ Done - Publish After-Action
**File**: `frontend/tests/e2e/publish-non-confidential.spec.ts`
**Description**: Playwright E2E test. Login as supervisor, open draft, publish (no MFA required), verify commitments created, notifications sent (check in-app bell + mock email), published record is read-only.
**Reference**: quickstart.md lines 263-345

### - [x] T080 [P] Integration test: User Story 4 ✅ Done - Publish Confidential (Step-Up Auth)
**File**: `frontend/tests/e2e/publish-confidential.spec.ts`
**Description**: Playwright E2E test. Create confidential draft, login as supervisor, publish → step-up MFA modal appears. Test incorrect code (blocked), correct code (succeeds). Verify audit trail logs MFA verification.
**Reference**: quickstart.md lines 347-405

### - [x] T079 [P] Integration test: User Story 5 ✅ Done - Request and Approve Edits
**File**: `frontend/tests/e2e/edit-workflow.spec.ts`
**Description**: Playwright E2E test. Login as staff, request edit with reason + changes. Login as supervisor, review diff, approve edit → verify version 2 created. Test reject flow (reason required, no version increment).
**Reference**: quickstart.md lines 407-514

### - [x] T080 [P] Integration test: User Story 6 ✅ Done - Generate Bilingual PDF
**File**: `frontend/tests/e2e/generate-pdf.spec.ts`
**Description**: Playwright E2E test. Generate PDF (both languages), download, verify English page 1 (LTR), Arabic page 2 (RTL). Test confidential record (step-up MFA required). Verify signed URL expires after 24 hours.
**Reference**: quickstart.md lines 516-586

### - [x] T079 [P] Integration test: User Story 7 ✅ Done - External Commitment Tracking
**File**: `frontend/tests/e2e/external-commitment-tracking.spec.ts`
**Description**: Playwright E2E test. View external commitment, verify tracking_mode=manual badge. Update status manually (Pending → In Progress → Completed), verify audit trail. Compare with internal commitment (tracking_mode=automatic, staff cannot override).
**Reference**: quickstart.md lines 588-657

### - [x] T080 [P] Integration test: User Story 8 ✅ Done - Notification Preferences
**File**: `frontend/tests/e2e/notification-preferences.spec.ts`
**Description**: Playwright E2E test. Open settings → notifications tab. Change preferences (disable commitment assigned email, enable due soon email, change language to Arabic). Trigger notifications, verify preferences respected (email sent/not sent, Arabic language used).
**Reference**: quickstart.md lines 659-722

---

## Phase 8: Edge Case Tests

### - [x] T081 [P] E2E test: ✅ Done Attachment limit enforcement
**File**: `frontend/tests/e2e/attachment-limit.spec.ts`
**Description**: Playwright test uploading 10 attachments (succeeds), 11th attachment (error: "Maximum 10 attachments per after-action record").
**Reference**: quickstart.md lines 727-731

### - [x] T082 [P] E2E test: ✅ Done Concurrent edit conflict
**File**: `frontend/tests/e2e/concurrent-edit-conflict.spec.ts`
**Description**: Playwright test with 2 browser contexts. User A opens draft v1, User B edits and saves (v2), User A tries to save → conflict error "Record was modified by another user. Please refresh."
**Reference**: quickstart.md lines 733-740

### - [x] T083 [P] E2E test: ✅ Done File size limit
**File**: `frontend/tests/e2e/file-size-limit.spec.ts`
**Description**: Playwright test uploading 150MB file → error "File size exceeds 100MB limit".
**Reference**: quickstart.md lines 742-746

### - [x] T084 [P] E2E test: ✅ Done Invalid file type
**File**: `frontend/tests/e2e/invalid-file-type.spec.ts`
**Description**: Playwright test uploading .exe file → error "File type not allowed. Allowed types: PDF, DOCX, XLSX, PPTX, PNG, JPG, TXT, CSV".
**Reference**: quickstart.md lines 748-752

### - [x] T085 [P] E2E test: ✅ Done Virus detection
**File**: `frontend/tests/e2e/virus-detection.spec.ts`
**Description**: Playwright test uploading file with EICAR test signature. Upload succeeds, scan_status=pending → infected. File download blocked, warning displayed "This file failed virus scan".
**Reference**: quickstart.md lines 754-763

### - [x] T086 [P] E2E test: ✅ Done Permission check (Dossier assignment)
**File**: `frontend/tests/e2e/permission-dossier-assignment.spec.ts`
**Description**: Playwright test. User not assigned to dossier tries to access after-action → 403 Forbidden "You do not have access to this resource".
**Reference**: quickstart.md lines 765-768

### - [x] T087 [P] E2E test: ✅ Done Staff tries to publish
**File**: `frontend/tests/e2e/permission-staff-publish.spec.ts`
**Description**: Playwright test. Login as staff, verify "Publish" button not visible. Attempt direct API call → 403 Forbidden "Insufficient permissions".
**Reference**: quickstart.md lines 770-775

### - [x] T088 [P] E2E test: ✅ Done Low AI confidence handling
**File**: `frontend/tests/e2e/low-confidence-ai.spec.ts`
**Description**: Playwright test. Mock AI extraction returning decision with confidence 0.45 (<0.5 threshold). Verify decision not auto-populated, notice displayed "Low confidence item not populated. Review source and add manually if correct."
**Reference**: quickstart.md lines 777-783

---

## Phase 9: Performance & Accessibility

### - [x] T089 Performance test: API response times
**File**: `backend/tests/performance/api-response-times.test.ts`
**Description**: Load test GET /after-actions/{id} with 100 concurrent requests. Assert p95 <200ms.
**Reference**: quickstart.md lines 789-794

### - [x] T090 Performance test: AI extraction (sync)
**File**: `backend/tests/performance/ai-extraction-sync.test.ts`
**Description**: Benchmark AI extraction with 50KB plain text file. Target <5 sec. Expect 2-4 sec average.
**Reference**: quickstart.md lines 796-800

### - [x] T091 Performance test: AI extraction (async)
**File**: `backend/tests/performance/ai-extraction-async.test.ts`
**Description**: Benchmark AI extraction with 2MB scanned PDF. Target <30 sec. Expect 15-25 sec average.
**Reference**: quickstart.md lines 802-806

### - [x] T092 Performance test: PDF generation
**File**: `backend/tests/performance/pdf-generation.test.ts`
**Description**: Benchmark PDF generation for after-action with 5 decisions, 8 commitments, 3 risks. Target <3 sec. Expect 1.5-2.5 sec average.
**Reference**: quickstart.md lines 808-812

### - [x] T093 [P] Accessibility audit: Keyboard navigation
**File**: `frontend/tests/a11y/keyboard-navigation.spec.ts`
**Description**: Playwright test navigating entire after-action form using only Tab/Shift+Tab/Enter. Assert all fields accessible, logical tab order, no keyboard traps.
**Reference**: quickstart.md lines 829-833

### - [x] T094 [P] Accessibility audit: Screen readers (English)
**File**: `frontend/tests/a11y/screen-reader-en.spec.ts`
**Description**: Automated axe-core audit for English version. Assert all form labels announced, error messages have aria-live, status changes announced. Manual testing notes with VoiceOver/NVDA.
**Reference**: quickstart.md lines 835-839

### - [x] T095 [P] Accessibility audit: Screen readers (Arabic)
**File**: `frontend/tests/a11y/screen-reader-ar.spec.ts`
**Description**: Automated axe-core audit for Arabic version. Assert RTL navigation correct, Arabic labels announced properly. Manual testing notes with VoiceOver Arabic voice.
**Reference**: quickstart.md lines 841-845

### - [x] T096 [P] Accessibility audit: Color contrast
**File**: `frontend/tests/a11y/color-contrast.spec.ts`
**Description**: Automated axe DevTools test. Assert all text passes WCAG AA (4.5:1 ratio), status badges readable.
**Reference**: quickstart.md lines 847-851

### - [x] T097 [P] Accessibility audit: Focus indicators
**File**: `frontend/tests/a11y/focus-indicators.spec.ts`
**Description**: Playwright test tabbing through form, screenshot each focus state. Assert all interactive elements have visible focus indicators (outline or ring).
**Reference**: quickstart.md lines 853-857

---

## Phase 10: Docker & Deployment

### - [x] T098 Add ClamAV to docker-compose.yml
**File**: `docker-compose.yml`
**Description**: Add ClamAV service with image clamav/clamav:latest, volume for virus definitions, health check (clamdscan --ping 1), expose port 3310 for backend to call.
**Reference**: research.md lines 414-431

### - [x] T099 Configure SMTP environment variables
**File**: `.env.example`, `supabase/.env`
**Description**: Add SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS to environment config. Document in .env.example. Update Edge Functions to use via Deno.env.
**Reference**: research.md lines 141-148

### - [x] T100 ✅ Done Add @react-pdf/renderer + Noto Sans Arabic font
**File**: `frontend/package.json`, `frontend/public/fonts/`
**Description**: Install @react-pdf/renderer@^3.0.0. Download Noto Sans Arabic font (NotoSansArabic-Regular.ttf) to public/fonts/. Register font in PDF generation logic (T047).
**Reference**: research.md lines 43-47

### - [x] T101 ✅ Done Update Supabase Edge Functions deployment script
**File**: `supabase/deploy-functions.sh`
**Description**: Create bash script to deploy all Edge Functions in Phase 3 (T035-T048) using `supabase functions deploy`. Include environment variable injection, error handling, health checks post-deployment.
**Reference**: plan.md lines 149-158

---

## Dependencies Graph

```
Phase 1 (Database):
  T001-T003 (parallel) → T002 → T004-T011 → T012 → T013 → T014 → T015

Phase 2 (Contract Tests - All parallel, must complete before Phase 3):
  T016-T035 (all parallel, all must FAIL before Phase 3)

Phase 3 (Backend Implementation):
  T016→T036, T017→T036, T018→T036, T019→T036
  T020→T037, T021→T038, T022→T039, T023→T040, T024→T041
  T025→T042, T026→T043, T027→T044, T028→T045
  T029→T046, T030→T047, T031→T048, T032-T034→T049
  T035→T050 (commitment status update)

Phase 4 (Frontend Components):
  T053-T061 → T052 (AfterActionForm depends on child components)

Phase 5 (Frontend Hooks):
  T062-T068 (parallel, but T063 blocks T064, T066, T067)

Phase 6 (Frontend Routes):
  T062→T069, T052+T063→T070, T063+T061→T071, T060→T072

Phase 7 (Integration Tests - All parallel):
  T073-T080 (all parallel)

Phase 8 (Edge Case Tests - All parallel):
  T081-T088 (all parallel)

Phase 9 (Performance & Accessibility - All parallel):
  T089-T097 (all parallel)

Phase 10 (Docker & Deployment):
  T098-T101 (parallel)
```

---

## Parallel Execution Examples

**Phase 1 - Database (Initial tables):**
```bash
# Run in parallel (independent tables):
Task: "Create engagements table migration in supabase/migrations/20250930100_create_engagements_table.sql"
Task: "Create external_contacts table migration in supabase/migrations/20250930102_create_external_contacts_table.sql"
Task: "Create user_notification_preferences table migration in supabase/migrations/20250930109_create_user_notification_preferences_table.sql"
Task: "Create notifications table migration in supabase/migrations/20250930110_create_notifications_table.sql"
```

**Phase 2 - Contract Tests (All parallel, TDD):**
```bash
# Run ALL contract tests in parallel (different files):
Task: "Contract test POST /engagements in backend/tests/contract/engagements-create.test.ts"
Task: "Contract test GET /engagements/{id} in backend/tests/contract/engagements-get.test.ts"
Task: "Contract test PATCH /engagements/{id} in backend/tests/contract/engagements-update.test.ts"
Task: "Contract test PATCH /commitments/{id}/status in backend/tests/contract/commitments-update-status.test.ts"
# ... all T016-T035 can run in parallel
```

**Phase 4 - Frontend Components (Child components parallel):**
```bash
# Run in parallel (independent components):
Task: "Create EngagementForm component in frontend/src/components/EngagementForm.tsx"
Task: "Create DecisionList component in frontend/src/components/DecisionList.tsx"
Task: "Create CommitmentEditor component in frontend/src/components/CommitmentEditor.tsx"
Task: "Create RiskList component in frontend/src/components/RiskList.tsx"
Task: "Create FollowUpList component in frontend/src/components/FollowUpList.tsx"
Task: "Create AttachmentUploader component in frontend/src/components/AttachmentUploader.tsx"
Task: "Create AIExtractionButton component in frontend/src/components/AIExtractionButton.tsx"
Task: "Create PDFGeneratorButton component in frontend/src/components/PDFGeneratorButton.tsx"
Task: "Create VersionHistoryViewer component in frontend/src/components/VersionHistoryViewer.tsx"
Task: "Create EditApprovalFlow component in frontend/src/components/EditApprovalFlow.tsx"
# Then T052 (AfterActionForm) after child components complete
```

**Phase 7 - Integration Tests (All parallel):**
```bash
# Run ALL E2E tests in parallel (independent user stories):
Task: "Integration test User Story 1 - Log After-Action Record in frontend/tests/e2e/log-after-action.spec.ts"
Task: "Integration test User Story 2 - AI-Assisted Extraction in frontend/tests/e2e/ai-extraction.spec.ts"
Task: "Integration test User Story 3 - Publish After-Action in frontend/tests/e2e/publish-non-confidential.spec.ts"
Task: "Integration test User Story 7 - External Commitment Tracking in frontend/tests/e2e/external-commitment-tracking.spec.ts"
# ... all T073-T080 can run in parallel
```

**Phase 9 - Performance & Accessibility (All parallel):**
```bash
# Run ALL performance and a11y tests in parallel:
Task: "Performance test API response times in backend/tests/performance/api-response-times.test.ts"
Task: "Performance test AI extraction sync in backend/tests/performance/ai-extraction-sync.test.ts"
Task: "Accessibility audit Keyboard navigation in frontend/tests/a11y/keyboard-navigation.spec.ts"
Task: "Accessibility audit Screen readers English in frontend/tests/a11y/screen-reader-en.spec.ts"
# ... all T089-T097 can run in parallel
```

---

## Validation Checklist

- ✅ All 17 API endpoints have corresponding contract tests (T016-T035) - including commitment status updates
- ✅ All 11 database entities have migration tasks (T001-T011)
- ✅ All contract tests come before implementation (Phase 2 before Phase 3)
- ✅ Parallel tasks [P] are truly independent (different files, no shared dependencies)
- ✅ Each task specifies exact file path
- ✅ No task modifies same file as another [P] task
- ✅ All 8 user stories from quickstart.md have integration tests (T073-T080)
- ✅ All 8 edge cases from quickstart.md have E2E tests (T081-T088)
- ✅ All 4 performance benchmarks from quickstart.md have tests (T089-T092)
- ✅ All 5 accessibility checks from quickstart.md have tests (T093-T097)
- ✅ TDD workflow enforced: Phase 2 (tests) blocks Phase 3 (implementation)
- ✅ Commitment status updates covered: contract test (T035) + implementation (T050) + E2E test (T079)

---

## Notes

- **TDD Critical**: Phase 2 contract tests MUST be written and MUST FAIL before Phase 3 implementation
- **[P] tasks**: Different files, no dependencies, can run concurrently
- **Optimistic locking**: T022, T038 enforce version field to prevent concurrent edit conflicts
- **Step-up MFA**: T023, T039, T047, T062, T065 implement step-up auth for confidential records
- **AI fallbacks**: T045, T056, T064 gracefully degrade when AnythingLLM unavailable
- **Bilingual support**: All forms, PDFs, emails, notifications support Arabic (RTL) and English (LTR)
- **RLS policies**: T014 enforces hybrid permission model (role + dossier assignment)
- **Commit after each task**: Recommended for incremental progress tracking

---

**Total Tasks**: 101
**Estimated Completion**: 10 phases (Database → Contract Tests → Backend → Frontend Components → Frontend Hooks → Frontend Routes → Integration Tests → Edge Cases → Performance/A11y → Deployment)
**Ready for Execution**: ✅ All prerequisites met, tasks.md complete

**Key Additions from User Feedback**:
- ✅ **T035**: Contract test for PATCH /commitments/{id}/status (commitment status updates)
- ✅ **T050**: Edge Function implementation for commitments-update-status with manual/automatic tracking modes

**Next**: Execute tasks.md following constitutional principles (Type Safety, Security-First, Resilient Architecture, Bilingual Excellence, Accessibility, Container-First)