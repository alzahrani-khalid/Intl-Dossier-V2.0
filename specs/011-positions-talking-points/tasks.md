# Tasks: Positions & Talking Points Lifecycle

**Feature**: 011-positions-talking-points
**Input**: Design documents from `/specs/011-positions-talking-points/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/api-spec.yaml

---

## Path Conventions

This project uses **Web Application** structure (Option 2):
- **Backend**: `supabase/functions/` (Edge Functions), `supabase/migrations/` (Database)
- **Frontend**: `frontend/src/` (React components, routes, services)
- **Tests**: `backend/tests/contract/`, `backend/tests/integration/`, `frontend/tests/e2e/`, `frontend/tests/a11y/`

---

## Phase 3.1: Database & Infrastructure (Foundation)

- [X] ### T001 Enable pgvector extension
**File**: `supabase/migrations/20250101001_enable_pgvector.sql`
**Dependencies**: None
**Description**: Create migration to enable pgvector extension for AI embeddings
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

- [X] ### T002 [P] Create position_types table
**File**: `supabase/migrations/20250101002_create_position_types.sql`
**Dependencies**: None
**Description**: Create position_types table with bilingual names, approval_stages (1-10), and default_chain_config JSONB field

- [X] ### T003 [P] Create positions table
**File**: `supabase/migrations/20250101003_create_positions.sql`
**Dependencies**: T002
**Description**: Create positions table with title/content/rationale/alignment_notes (EN/AR), status enum, current_stage, approval_chain_config JSONB, consistency_score, version field for optimistic locking

- [X] ### T004 [P] Create position_versions table with partitioning
**File**: `supabase/migrations/20250101004_create_position_versions.sql`
**Dependencies**: T003
**Description**: Create position_versions table partitioned by created_at (annual partitions), retention_until field (7 years), superseded boolean, full_snapshot JSONB

- [X] ### T005 [P] Create approvals table
**File**: `supabase/migrations/20250101005_create_approvals.sql`
**Dependencies**: T003
**Description**: Create approvals table with stage, action enum, step_up_verified, delegated_from/until, reassigned_by/reason fields

- [X] ### T006 [P] Create audience_groups and junction tables
**File**: `supabase/migrations/20250101006_create_audience_groups.sql`
**Dependencies**: T003
**Description**: Create audience_groups, position_audience_groups, and user_audience_memberships tables for access control

- [X] ### T007 [P] Create attachments table
**File**: `supabase/migrations/20250101007_create_attachments.sql`
**Dependencies**: T003
**Description**: Create attachments table with storage_path, file metadata, uploader_id, cascade delete on position deletion

- [X] ### T008 [P] Create consistency_checks table
**File**: `supabase/migrations/20250101008_create_consistency_checks.sql`
**Dependencies**: T003
**Description**: Create consistency_checks table with check_trigger enum, conflicts JSONB, ai_service_available boolean

- [X] ### T009 [P] Create position_embeddings table
**File**: `supabase/migrations/20250101009_create_position_embeddings.sql`
**Dependencies**: T003
**Description**: Create position_embeddings table with content_en_embedding vector(1536), content_ar_embedding vector(1536), ivfflat indexes

- [X] ### T010 [P] Create database indexes
**File**: `supabase/migrations/20250101010_create_indexes.sql`
**Dependencies**: T003-T009
**Description**: Create performance indexes: positions (status, author_id, thematic_category, created_at), approvals (position_id, approver_id), versions (position_id, retention_until), consistency_checks (position_id, consistency_score)

- [X] ### T011 Apply RLS policies for positions
**File**: `supabase/migrations/20250101011_rls_positions.sql`
**Dependencies**: T003, T006
**Description**: Implement RLS policies from data-model.md: drafters view own drafts, approvers view at their stage, users view published for their audience groups, drafters update own drafts

- [X] ### T012 [P] Apply RLS policies for approvals
**File**: `supabase/migrations/20250101012_rls_approvals.sql`
**Dependencies**: T005
**Description**: RLS policies: approvers insert for their stage, admins reassign approvals

- [X] ### T013 [P] Apply RLS policies for attachments and consistency
**File**: `supabase/migrations/20250101013_rls_attachments_consistency.sql`
**Dependencies**: T007, T008
**Description**: RLS policies for attachments (position owner), consistency_checks (authenticated users trigger manual)

- [X] ### T014 [P] Configure Supabase Storage bucket for attachments
**File**: `supabase/migrations/20250101014_storage_bucket.sql`
**Dependencies**: None
**Description**: Create Supabase Storage bucket "position-attachments" with 50MB file limit, allowed MIME types (PDF, DOCX, XLSX, PNG, JPG), RLS policies for upload/download

- [X] ### T015 Seed position types
**File**: `supabase/migrations/20250101015_seed_position_types.sql`
**Dependencies**: T002
**Description**: Insert seed data: "Standard Position" (3 stages), "Critical Position" (5 stages), with default_chain_config JSONB

- [X] ### T016 [P] Seed audience groups
**File**: `supabase/migrations/20250101016_seed_audience_groups.sql`
**Dependencies**: T006
**Description**: Insert seed data: "All Staff", "Management", "Policy Officers" audience groups with bilingual names

---

## Phase 3.2: Contract Tests (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: All contract tests MUST be written and MUST FAIL before ANY Edge Function implementation**

- [X] ### T017 [P] Contract test: GET /positions
**File**: `backend/tests/contract/positions-list.test.ts`
**Dependencies**: None
**Description**: Test list positions endpoint with status/thematic_category filters, pagination (limit/offset), response schema validation (data array, total, limit, offset). Must initially fail.

- [X] ### T018 [P] Contract test: POST /positions
**File**: `backend/tests/contract/positions-create.test.ts`
**Dependencies**: None
**Description**: Test create position endpoint, validate required fields (position_type_id, title_en/ar, audience_groups), 201 response with Position schema. Must initially fail.

- [X] ### T019 [P] Contract test: GET /positions/{id}
**File**: `backend/tests/contract/positions-get.test.ts`
**Dependencies**: None
**Description**: Test get position by ID, validate Position schema response, 404 for non-existent ID, 403 for unauthorized access. Must initially fail.

- [X] ### T020 [P] Contract test: PUT /positions/{id}
**File**: `backend/tests/contract/positions-update.test.ts`
**Dependencies**: None
**Description**: Test update position, validate version field for optimistic locking, 409 on concurrent modification conflict. Must initially fail.

- [X] ### T021 [P] Contract test: PUT /positions/{id}/submit
**File**: `backend/tests/contract/positions-submit.test.ts`
**Dependencies**: None
**Description**: Test submit for review, validate 400 if missing EN/AR content, response includes position + consistency_check. Must initially fail.

- [X] ### T022 [P] Contract test: POST /positions/{id}/approve
**File**: `backend/tests/contract/positions-approve.test.ts`
**Dependencies**: None
**Description**: Test approve position, validate StepUpAuth required (403 without elevated token), 200 with ApprovalRequest body. Must initially fail.

- [X] ### T023 [P] Contract test: POST /positions/{id}/request-revisions
**File**: `backend/tests/contract/positions-request-revisions.test.ts`
**Dependencies**: None
**Description**: Test request revisions, validate comments field required, position returns to draft status. Must initially fail.

- [X] ### T024 [P] Contract test: POST /positions/{id}/delegate
**File**: `backend/tests/contract/positions-delegate.test.ts`
**Dependencies**: None
**Description**: Test delegate approval, validate delegate_to, valid_until fields required, response with delegation_id. Must initially fail.

- [X] ### T025 [P] Contract test: PUT /approvals/{id}/reassign
**File**: `backend/tests/contract/approvals-reassign.test.ts`
**Dependencies**: None
**Description**: Test reassign approval (admin only), validate 403 for non-admin, required reason field. Must initially fail.

- [X] ### T026 [P] Contract test: GET /positions/{id}/versions
**File**: `backend/tests/contract/positions-versions-list.test.ts`
**Dependencies**: None
**Description**: Test get version history, validate array of Version schema objects. Must initially fail.

- [X] ### T027 [P] Contract test: GET /positions/{id}/versions/compare
**File**: `backend/tests/contract/positions-versions-compare.test.ts`
**Dependencies**: None
**Description**: Test compare versions, validate from_version/to_version query params, VersionDiff response with english_diff/arabic_diff arrays. Must initially fail.

- [X] ### T028 [P] Contract test: POST /positions/{id}/publish
**File**: `backend/tests/contract/positions-publish.test.ts`
**Dependencies**: None
**Description**: Test publish position, validate 400 if not approved, status changes to published. Must initially fail.

- [X] ### T029 [P] Contract test: POST /positions/{id}/unpublish
**File**: `backend/tests/contract/positions-unpublish.test.ts`
**Dependencies**: None
**Description**: Test unpublish position, validate status changes. Must initially fail.

- [X] ### T030 [P] Contract test: POST /positions/{id}/consistency-check
**File**: `backend/tests/contract/positions-consistency-check.test.ts`
**Dependencies**: None
**Description**: Test manual consistency check, validate ConsistencyCheck response schema (consistency_score, conflicts array, ai_service_available). Must initially fail.

- [X] ### T031 [P] Contract test: PUT /positions/{id}/consistency-check/{check_id}/reconcile
**File**: `backend/tests/contract/positions-consistency-reconcile.test.ts`
**Dependencies**: None
**Description**: Test reconcile conflicts, validate resolved_conflicts array in request body, updated_score in response. Must initially fail.

- [X] ### T032 [P] Contract test: GET /positions/{id}/attachments
**File**: `backend/tests/contract/attachments-list.test.ts`
**Dependencies**: None
**Description**: Test list attachments, validate array of Attachment schema objects. Must initially fail.

- [X] ### T033 [P] Contract test: POST /positions/{id}/attachments
**File**: `backend/tests/contract/attachments-upload.test.ts`
**Dependencies**: None
**Description**: Test upload attachment (multipart/form-data), validate 413 for files >50MB, 201 with Attachment response. Must initially fail.

- [X] ### T034 [P] Contract test: DELETE /attachments/{id}
**File**: `backend/tests/contract/attachments-delete.test.ts`
**Dependencies**: None
**Description**: Test delete attachment, validate 204 response, file removed from Supabase Storage. Must initially fail.

- [X] ### T035 [P] Contract test: POST /auth-verify-step-up
**File**: `backend/tests/contract/auth-step-up-initiate.test.ts`
**Dependencies**: None
**Description**: Test initiate step-up challenge, validate challenge_id, challenge_type, expires_at in response. Must initially fail.

- [X] ### T036 [P] Contract test: POST /auth-verify-step-up/complete
**File**: `backend/tests/contract/auth-step-up-complete.test.ts`
**Dependencies**: None
**Description**: Test complete step-up, validate elevated_token, valid_until in response, 401 for invalid code. Must initially fail.

---

## Phase 3.3: Backend Implementation (ONLY after all contract tests fail)

- [X] ### T037 Edge Function: positions-list
**File**: `supabase/functions/positions-list/index.ts`
**Dependencies**: T017 (contract test failing)
**Description**: Implement GET /positions with query filters (status, thematic_category, author_id), pagination (limit, offset), RLS enforcement via Supabase client

- [X] ### T038 Edge Function: positions-create
**File**: `supabase/functions/positions-create/index.ts`
**Dependencies**: T018 (contract test failing)
**Description**: Implement POST /positions, validate required bilingual fields, insert with audience_groups junction table, create version 1 record

- [X] ### T039 Edge Function: positions-get
**File**: `supabase/functions/positions-get/index.ts`
**Dependencies**: T019 (contract test failing)
**Description**: Implement GET /positions/{id}, RLS enforcement, include audience_groups, 404 handling

- [X] ### T040 Edge Function: positions-update
**File**: `supabase/functions/positions-update/index.ts`
**Dependencies**: T020 (contract test failing)
**Description**: Implement PUT /positions/{id}, optimistic locking check (version field), create new version record on save, 409 on conflict

- [X] ### T041 Edge Function: positions-submit
**File**: `supabase/functions/positions-submit/index.ts`
**Dependencies**: T021 (contract test failing)
**Description**: Implement PUT /positions/{id}/submit, validate content_en/ar presence, trigger automatic consistency check, set status=under_review, current_stage=1

- [X] ### T042 Edge Function: positions-approve
**File**: `supabase/functions/positions-approve/index.ts`
**Dependencies**: T022 (contract test failing)
**Description**: Implement POST /positions/{id}/approve, verify elevated token from step-up, insert approval record with step_up_verified=true, increment current_stage, set status=approved if final stage

- [X] ### T043 Edge Function: positions-request-revisions
**File**: `supabase/functions/positions-request-revisions/index.ts`
**Dependencies**: T023 (contract test failing)
**Description**: Implement POST /positions/{id}/request-revisions, validate comments required, insert approval record with action=request_revisions, set status=draft, current_stage=0

- [X] ### T044 Edge Function: positions-delegate
**File**: `supabase/functions/positions-delegate/index.ts`
**Dependencies**: T024 (contract test failing)
**Description**: Implement POST /positions/{id}/delegate, validate delegate_to user, insert approval record with action=delegate, delegated_from/until fields

- [X] ### T045 Edge Function: approvals-reassign
**File**: `supabase/functions/approvals-reassign/index.ts`
**Dependencies**: T025 (contract test failing)
**Description**: Implement PUT /approvals/{id}/reassign, verify admin role from JWT, update approval record with reassigned_by/reason, notify new approver

- [X] ### T046 Edge Function: positions-versions-list
**File**: `supabase/functions/positions-versions-list/index.ts`
**Dependencies**: T026 (contract test failing)
**Description**: Implement GET /positions/{id}/versions, return array of versions ordered by version_number DESC

- [X] ### T047 Edge Function: positions-versions-compare
**File**: `supabase/functions/positions-versions-compare/index.ts`
**Dependencies**: T027 (contract test failing)
**Description**: Implement GET /positions/{id}/versions/compare, use diff-match-patch library, generate english_diff and arabic_diff arrays, include metadata_changes

- [X] ### T048 Edge Function: positions-publish
**File**: `supabase/functions/positions-publish/index.ts`
**Dependencies**: T028 (contract test failing)
**Description**: Implement POST /positions/{id}/publish, validate status=approved, set status=published, record publication timestamp

- [X] ### T049 Edge Function: positions-unpublish
**File**: `supabase/functions/positions-unpublish/index.ts`
**Dependencies**: T029 (contract test failing)
**Description**: Implement POST /positions/{id}/unpublish, change status to appropriate state (draft or approved), maintain audit trail

- [X] ### T050 Edge Function: positions-consistency-check
**File**: `supabase/functions/positions-consistency-check/index.ts`
**Dependencies**: T030 (contract test failing)
**Description**: Implement POST /positions/{id}/consistency-check, integrate AnythingLLM API for semantic analysis + pgvector similarity search, fallback to rule-based checks if AI unavailable, insert consistency_checks record

- [X] ### T051 Edge Function: positions-consistency-reconcile
**File**: `supabase/functions/positions-consistency-reconcile/index.ts`
**Dependencies**: T031 (contract test failing)
**Description**: Implement PUT /positions/{id}/consistency-check/{check_id}/reconcile, process resolved_conflicts array, update consistency_checks record, recalculate consistency_score

- [X] ### T052 Edge Function: attachments-list
**File**: `supabase/functions/attachments-list/index.ts`
**Dependencies**: T032 (contract test failing)
**Description**: Implement GET /positions/{id}/attachments, return array of attachments with metadata

- [X] ### T053 Edge Function: attachments-upload
**File**: `supabase/functions/attachments-upload/index.ts`
**Dependencies**: T033 (contract test failing)
**Description**: Implement POST /positions/{id}/attachments, parse multipart/form-data, validate file size (<=50MB), validate MIME type, upload to Supabase Storage, insert attachment record

- [X] ### T054 Edge Function: attachments-delete
**File**: `supabase/functions/attachments-delete/index.ts`
**Dependencies**: T034 (contract test failing)
**Description**: Implement DELETE /attachments/{id}, remove from Supabase Storage, delete attachment record

- [X] ### T055 Edge Function: auth-step-up-initiate
**File**: `supabase/functions/auth-step-up-initiate/index.ts`
**Dependencies**: T035 (contract test failing)
**Description**: Implement POST /auth-verify-step-up, generate challenge_id, determine challenge_type (totp/sms/push), set expiry (10 minutes), return challenge details

- [X] ### T056 Edge Function: auth-step-up-complete
**File**: `supabase/functions/auth-step-up-complete/index.ts`
**Dependencies**: T036 (contract test failing)
**Description**: Implement POST /auth-verify-step-up/complete, verify challenge_id + verification_code, generate elevated JWT token (5-10 min validity), return elevated_token

- [X] ### T096 [P] Add emergency correction fields to positions table
**File**: `supabase/migrations/20250101017_add_emergency_correction_fields.sql`
**Dependencies**: T003
**Description**: Add emergency_correction boolean (default false), corrected_at timestamp, corrected_by uuid, correction_reason text, corrected_version_id uuid to positions table

- [X] ### T097 Contract test: POST /positions/{id}/emergency-correct
**File**: `backend/tests/contract/positions-emergency-correct.test.ts`
**Dependencies**: None
**Description**: Test emergency correction endpoint, validate admin-only (403 for non-admin), required reason field, 201 response with new version. Must initially fail.

- [X] ### T098 Edge Function: positions-emergency-correct
**File**: `supabase/functions/positions-emergency-correct/index.ts`
**Dependencies**: T097 (contract test failing)
**Description**: Implement POST /positions/{id}/emergency-correct, verify admin role, create new corrected version, mark original with emergency_correction=true, set corrected_at/by/reason, trigger audience group notifications

---

## Phase 3.4: Frontend Components

- [X] ### T057 [P] Position Editor component
**File**: `frontend/src/components/PositionEditor.tsx`
**Dependencies**: T038, T040 (backend CRUD)
**Description**: Bilingual side-by-side editor using TipTap, synchronized scroll, EN (LTR) and AR (RTL) panels, auto-save draft, optimistic updates with version conflict handling, keyboard navigation, ARIA labels

- [X] ### T058 [P] Position List component
**File**: `frontend/src/components/PositionList.tsx`
**Dependencies**: T037 (backend list)
**Description**: Position list with faceted filters (status, thematic_category), pagination (infinite scroll), DossierCard per position, loading states, empty states

- [X] ### T059 [P] Approval Chain component
**File**: `frontend/src/components/ApprovalChain.tsx`
**Dependencies**: T042-T045 (approval backend)
**Description**: Workflow visualization showing approval stages, current stage highlight, approver names per stage, action history (approve/delegate/request-revisions), step-up badge for verified approvals

- [X] ### T060 [P] Version Comparison component
**File**: `frontend/src/components/VersionComparison.tsx`
**Dependencies**: T047 (compare backend)
**Description**: Side-by-side diff rendering using diff-match-patch, separate EN and AR diffs, additions (green), deletions (red/strikethrough), metadata changes table, RTL support for Arabic diff

- [X] ### T061 [P] Consistency Panel component
**File**: `frontend/src/components/ConsistencyPanel.tsx`
**Dependencies**: T050, T051 (consistency backend)
**Description**: Conflict list display, severity indicators (high/medium/low), conflict type badges, suggested resolutions, reconcile actions (modify/accept/escalate), consistency score visualization (0-100)

- [X] ### T062 [P] Attachment Uploader component
**File**: `frontend/src/components/AttachmentUploader.tsx`
**Dependencies**: T053, T054 (attachments backend)
**Description**: Drag-and-drop file upload, file type validation (PDF, DOCX, XLSX, PNG, JPG), size validation (50MB), progress indicator, attachment list with delete action

- [X] ### T063 [P] Step-Up MFA component
**File**: `frontend/src/components/StepUpMFA.tsx`
**Dependencies**: T055, T056 (step-up backend)
**Description**: Modal dialog for step-up challenge, TOTP/SMS/Push input, countdown timer, error handling, elevated token storage, auto-trigger before approval actions

- [X] ### T099 [P] Emergency Correction Dialog component
**File**: `frontend/src/components/EmergencyCorrectionDialog.tsx`
**Dependencies**: T098 (backend)
**Description**: Modal dialog for emergency correction, mandatory reason textarea (bilingual), confirmation with admin password re-entry, displays "Emergency Correction" badge preview, warning about audience notifications

---

## Phase 3.5: Frontend Routes

- [X] ### T064 Route: /positions (list view)
**File**: `frontend/src/routes/_protected/positions/index.tsx`
**Dependencies**: T058 (PositionList component)
**Description**: Position list page with PositionList component, FilterPanel for faceted search, "New Position" button, TanStack Query for data fetching, pagination handling

- [X] ### T065 Route: /positions/:id (detail/editor view)
**File**: `frontend/src/routes/_protected/positions/$id.tsx`
**Dependencies**: T057, T059, T061, T062 (components)
**Description**: Position detail page with PositionEditor, ApprovalChain (if under_review/approved), ConsistencyPanel (if checks exist), AttachmentUploader, action buttons (Save Draft, Submit, Approve, Publish)

- [X] ### T066 Route: /positions/:id/versions (version history)
**File**: `frontend/src/routes/_protected/positions/$id/versions.tsx`
**Dependencies**: T060 (VersionComparison component)
**Description**: Version history page, list of versions with timestamps, version selector (compare v1 vs v2), VersionComparison component for side-by-side diff

- [X] ### T067 Route: /positions/:id/approvals (approval tracking)
**File**: `frontend/src/routes/_protected/positions/$id/approvals.tsx`
**Dependencies**: T059 (ApprovalChain component)
**Description**: Approval tracking page with detailed ApprovalChain, approval history table (stage, approver, action, comments, timestamp), delegation/reassignment records

- [X] ### T068 Route: /approvals (My Approvals dashboard)
**File**: `frontend/src/routes/_protected/approvals/index.tsx`
**Dependencies**: T058 (reuse PositionList)
**Description**: My Approvals dashboard showing positions pending current user's approval, filter by stage, sorted by submission date, approve/delegate/request-revisions actions

- [X] ### T069 Route: /admin/approvals (Admin reassignment panel)
**File**: `frontend/src/routes/_protected/admin/approvals.tsx`
**Dependencies**: T045 (reassign backend)
**Description**: Admin-only page for reassigning stuck approvals, list of all under_review positions, reassignment form (select new approver, enter reason), audit trail display

---

## Phase 3.6: TanStack Query Hooks

- [X] ### T070 [P] usePositions hook
**File**: `frontend/src/hooks/usePositions.ts`
**Dependencies**: T037 (list backend)
**Description**: TanStack Query hook for positions list, filters, pagination, staleTime: 5min, cacheTime: 30min, optimistic updates

- [X] ### T071 [P] usePosition hook
**File**: `frontend/src/hooks/usePosition.ts`
**Dependencies**: T039 (get backend)
**Description**: TanStack Query hook for single position, enabled/disabled based on ID, refetchOnWindowFocus: false

- [X] ### T072 [P] useCreatePosition mutation
**File**: `frontend/src/hooks/useCreatePosition.ts`
**Dependencies**: T038 (create backend)
**Description**: TanStack Query mutation for creating position, invalidate positions list on success

- [X] ### T073 [P] useUpdatePosition mutation
**File**: `frontend/src/hooks/useUpdatePosition.ts`
**Dependencies**: T040 (update backend)
**Description**: TanStack Query mutation with optimistic update, rollback on version conflict (409), refetch on success

- [X] ### T074 [P] useSubmitPosition mutation
**File**: `frontend/src/hooks/useSubmitPosition.ts`
**Dependencies**: T041 (submit backend)
**Description**: TanStack Query mutation for submit, invalidate position on success, display consistency results

- [X] ### T075 [P] useApprovePosition mutation
**File**: `frontend/src/hooks/useApprovePosition.ts`
**Dependencies**: T042 (approve backend)
**Description**: TanStack Query mutation with elevated token, trigger step-up before mutation, invalidate approvals on success

- [X] ### T076 [P] useConsistencyCheck mutation
**File**: `frontend/src/hooks/useConsistencyCheck.ts`
**Dependencies**: T050 (consistency backend)
**Description**: TanStack Query mutation for manual consistency check, loading state during async AI processing

- [X] ### T077 [P] useAttachments hooks
**File**: `frontend/src/hooks/usePositionAttachments.ts`
**Dependencies**: T052, T053, T054 (attachments backend)
**Description**: TanStack Query hook for list, mutation for upload (with progress), mutation for delete

- [X] ### T100 [P] useEmergencyCorrect mutation hook
**File**: `frontend/src/hooks/useEmergencyCorrect.ts`
**Dependencies**: T098 (backend)
**Description**: TanStack Query mutation for emergency correction, requires admin role check, invalidates position and notifications on success

---

## Phase 3.7: Integration Tests

- [X] ### T078 [P] Integration test: Complete approval workflow
**File**: `backend/tests/integration/approval-workflow.test.ts`
**Dependencies**: T038-T045 (approval backend)
**Description**: End-to-end test: create draft → submit → approve stage 1 → approve stage 2 → ... → approve final stage → verify status=approved, test delegation mid-workflow, test request-revisions returning to draft

- [X] ### T079 [P] Integration test: Delegation and reassignment
**File**: `backend/tests/integration/delegation-reassignment.test.ts`
**Dependencies**: T044, T045
**Description**: Test delegate approval with expiry, test delegate approval, test admin reassignment (with reason), verify audit trail in approvals table

- [X] ### T080 [P] Integration test: Version comparison and retention
**File**: `backend/tests/integration/version-retention.test.ts`
**Dependencies**: T040, T046, T047
**Description**: Test version creation on update, test 7-year retention_until calculation, test version comparison diff generation, test partitioning by created_at

- [X] ### T081 [P] Integration test: Consistency checking (with AI fallback)
**File**: `backend/tests/integration/consistency-fallback.test.ts`
**Dependencies**: T050
**Description**: Test consistency check with AnythingLLM available (semantic analysis), test graceful fallback when AI unavailable (rule-based), verify ai_service_available flag, test automatic trigger on submit

- [X] ### T082 [P] Integration test: Audience group access control
**File**: `backend/tests/integration/audience-access-control.test.ts`
**Dependencies**: T011, T039
**Description**: Test RLS enforcement: user in audience group sees published position, user NOT in group cannot see published position, test drafter sees own drafts, test approver sees positions at their stage

- [X] ### T083 [P] Integration test: Step-up authentication flow
**File**: `backend/tests/integration/step-up-flow.test.ts`
**Dependencies**: T055, T056, T042
**Description**: Test initiate challenge, test complete challenge with valid code, test elevated token validity (5-10 min), test approval requires elevated token (403 without)

- [X] ### T101 [P] Integration test: Emergency correction workflow
**File**: `backend/tests/integration/emergency-correction.test.ts`
**Dependencies**: T098
**Description**: Test admin triggers emergency correction with reason, verify new version created, verify corrected flag set, verify audience notification sent, verify audit log entry, test 403 for non-admin

---

## Phase 3.8: E2E Tests (Playwright)

- [X] ### T084 [P] E2E test: Approval flow with multiple users
**File**: `frontend/tests/e2e/approval-flow-multi-user.spec.ts`
**Dependencies**: T064-T068 (routes)
**Description**: Playwright test with 3 user contexts (drafter, approver1, approver2), create position as drafter, submit, approve as approver1, approve as approver2, verify status changes, verify notifications

- [X] ### T085 [P] E2E test: Bilingual content editing (EN/AR, RTL)
**File**: `frontend/tests/e2e/bilingual-editing.spec.ts`
**Dependencies**: T057, T065
**Description**: Playwright test for PositionEditor, type English content (LTR), type Arabic content (RTL), verify synchronized scroll, verify both saved, test auto-save, test keyboard navigation

- [X] ### T086 [P] E2E test: Version comparison and diff rendering
**File**: `frontend/tests/e2e/version-comparison.spec.ts`
**Dependencies**: T066
**Description**: Playwright test: create position, edit and save (version 2), navigate to versions page, select v1 vs v2, verify diff display (green additions, red deletions), verify RTL diff for Arabic

- [X] ### T087 [P] E2E test: Step-up MFA challenge
**File**: `frontend/tests/e2e/step-up-mfa.spec.ts`
**Dependencies**: T063, T068
**Description**: Playwright test: navigate to approval dashboard, click Approve, verify step-up modal appears, enter TOTP code, verify elevated token obtained, verify approval succeeds

- [X] ### T088 [P] E2E test: Consistency conflict resolution
**File**: `frontend/tests/e2e/consistency-resolution.spec.ts`
**Dependencies**: T061, T065
**Description**: Playwright test: create position, trigger consistency check, verify conflicts displayed, select resolution action (modify/accept), reconcile, verify consistency score updated

---

## Phase 3.9: Accessibility Tests

- [X] ### T089 [P] A11y test: Positions pages (English)
**File**: `frontend/tests/a11y/positions-a11y-en.spec.ts`
**Dependencies**: T064-T069 (routes)
**Description**: Playwright axe test for all position routes in English, WCAG 2.1 Level AA compliance, keyboard navigation (Tab, Enter, Esc), screen reader compatibility (test with announcements)

- [X] ### T090 [P] A11y test: Positions pages (Arabic with RTL)
**File**: `frontend/tests/a11y/positions-a11y-ar.spec.ts`
**Dependencies**: T064-T069 (routes)
**Description**: Playwright axe test for all position routes in Arabic (RTL mode), WCAG 2.1 Level AA compliance, verify RTL layout (text direction, form alignment), keyboard navigation (RTL arrow keys), screen reader Arabic labels

- [X] ### T091 [P] A11y test: Position Editor keyboard navigation
**File**: `frontend/tests/a11y/editor-keyboard-nav.spec.ts`
**Dependencies**: T057
**Description**: Playwright test for PositionEditor keyboard-only interaction: Tab through fields, Enter in buttons, Esc to cancel, Ctrl+S to save, verify focus indicators visible, verify no keyboard traps

---

## Phase 3.10: Performance & Quality

- [X] ### T092 Performance test: API response times
**File**: `backend/tests/performance/api-response-times.test.ts`
**Dependencies**: T037-T056 (all Edge Functions)
**Description**: Artillery or k6 load test for all endpoints, verify p95 <200ms for GET/POST/PUT endpoints (except consistency check), verify <300ms for approve (includes step-up), generate performance report

- [X] ### T093 Performance test: Position editor time-to-interactive
**File**: `frontend/tests/performance/editor-tti.spec.ts`
**Dependencies**: T057, T065
**Description**: Lighthouse performance audit for /positions/:id route, verify time-to-interactive <3s, verify no layout shift, test with slow 3G network simulation

- [X] ### T094 [P] Load test: 100+ concurrent users
**File**: `frontend/tests/performance/load-test.ts`
**Dependencies**: T037-T056 (all Edge Functions)
**Description**: k6 test simulating 100 concurrent users, mixed workload (list, get, create, submit, approve), verify no errors, verify response times remain under target, test Supabase connection pooling

- [X] ### T095 Run quickstart validation
**File**: `frontend/tests/e2e/quickstart-validation.spec.ts`
**Dependencies**: All previous tasks
**Description**: Automated E2E test covering all 13 steps from quickstart.md, validating all 21 acceptance scenarios with multi-user contexts, bilingual content, and complete approval workflow

---

## Dependencies

**Phase Order**:
```
P1 (Database: T001-T016)
  → P2 (Contract Tests: T017-T036, all [P])
    → P3 (Backend: T037-T056)
      → P4 (Frontend Components: T057-T063, all [P])
        → P5 (Frontend Routes: T064-T069)
          → P6 (TanStack Query Hooks: T070-T077, all [P])
            → P7 (Integration Tests: T078-T083, all [P])
              → P8 (E2E Tests: T084-T088, all [P])
                → P9 (A11y Tests: T089-T091, all [P])
                  → P10 (Performance: T092-T095)
```

**Critical Dependency Notes**:
- **T001** must complete before T009 (pgvector extension before embeddings table)
- **T002** blocks T003 (position_types before positions)
- **T003** blocks T004-T009 (positions table before related tables)
- **T017-T036** must all FAIL before any T037-T056 begins (TDD contract-first)
- **Each Edge Function (T037-T056)** unblocked by its corresponding contract test failing
- **T011-T013** (RLS policies) must complete before T082 (access control integration test)
- **T057-T063** (components) can be built in parallel after backend exists
- **T064-T069** (routes) require respective components complete
- **T070-T077** (hooks) can be built in parallel with routes (same Edge Function dependencies)

---

## Parallel Execution Examples

### Parallel: Phase 3.1 Database Tables (T002-T009)
All table creation migrations are independent and can run in parallel:
```bash
# Launch 8 parallel tasks:
Task: "Create position_types table in supabase/migrations/20250101002_create_position_types.sql"
Task: "Create positions table in supabase/migrations/20250101003_create_positions.sql"
Task: "Create position_versions table in supabase/migrations/20250101004_create_position_versions.sql"
Task: "Create approvals table in supabase/migrations/20250101005_create_approvals.sql"
Task: "Create audience_groups tables in supabase/migrations/20250101006_create_audience_groups.sql"
Task: "Create attachments table in supabase/migrations/20250101007_create_attachments.sql"
Task: "Create consistency_checks table in supabase/migrations/20250101008_create_consistency_checks.sql"
Task: "Create position_embeddings table in supabase/migrations/20250101009_create_position_embeddings.sql"
```

### Parallel: Phase 3.2 Contract Tests (T017-T036)
All 20 contract tests are independent and MUST run in parallel:
```bash
# Launch 20 parallel contract tests:
Task: "Contract test GET /positions in backend/tests/contract/positions-list.test.ts"
Task: "Contract test POST /positions in backend/tests/contract/positions-create.test.ts"
Task: "Contract test GET /positions/{id} in backend/tests/contract/positions-get.test.ts"
# ... (all 20 contract tests)
Task: "Contract test POST /auth-verify-step-up/complete in backend/tests/contract/auth-step-up-complete.test.ts"
```

### Parallel: Phase 3.4 Frontend Components (T057-T063)
All 7 components are independent:
```bash
# Launch 7 parallel component builds:
Task: "Build PositionEditor component in frontend/src/components/PositionEditor.tsx"
Task: "Build PositionList component in frontend/src/components/PositionList.tsx"
Task: "Build ApprovalChain component in frontend/src/components/ApprovalChain.tsx"
Task: "Build VersionComparison component in frontend/src/components/VersionComparison.tsx"
Task: "Build ConsistencyPanel component in frontend/src/components/ConsistencyPanel.tsx"
Task: "Build AttachmentUploader component in frontend/src/components/AttachmentUploader.tsx"
Task: "Build StepUpMFA component in frontend/src/components/StepUpMFA.tsx"
```

### Parallel: Phase 3.6 TanStack Query Hooks (T070-T077)
All 8 hooks are independent:
```bash
# Launch 8 parallel hook implementations:
Task: "Create usePositions hook in frontend/src/hooks/usePositions.ts"
Task: "Create usePosition hook in frontend/src/hooks/usePosition.ts"
Task: "Create useCreatePosition mutation in frontend/src/hooks/useCreatePosition.ts"
# ... (all 8 hooks)
Task: "Create useAttachments hooks in frontend/src/hooks/useAttachments.ts"
```

### Parallel: Phase 3.7 Integration Tests (T078-T083)
All 6 integration tests are independent:
```bash
# Launch 6 parallel integration tests:
Task: "Integration test approval workflow in backend/tests/integration/approval-workflow.test.ts"
Task: "Integration test delegation in backend/tests/integration/delegation-reassignment.test.ts"
Task: "Integration test version retention in backend/tests/integration/version-retention.test.ts"
Task: "Integration test consistency fallback in backend/tests/integration/consistency-fallback.test.ts"
Task: "Integration test audience access in backend/tests/integration/audience-access-control.test.ts"
Task: "Integration test step-up flow in backend/tests/integration/step-up-flow.test.ts"
```

### Parallel: Phase 3.8 E2E Tests (T084-T088)
All 5 E2E tests are independent:
```bash
# Launch 5 parallel Playwright tests:
Task: "E2E test approval flow in frontend/tests/e2e/approval-flow-multi-user.spec.ts"
Task: "E2E test bilingual editing in frontend/tests/e2e/bilingual-editing.spec.ts"
Task: "E2E test version comparison in frontend/tests/e2e/version-comparison.spec.ts"
Task: "E2E test step-up MFA in frontend/tests/e2e/step-up-mfa.spec.ts"
Task: "E2E test consistency resolution in frontend/tests/e2e/consistency-resolution.spec.ts"
```

---

## Notes

### TDD Enforcement
- **Phase 3.2 contract tests MUST fail before Phase 3.3 implementation begins**
- Run `npm test backend/tests/contract/` and verify all tests RED before writing Edge Functions
- Each Edge Function task (T037-T056) explicitly depends on its contract test failing

### Optimistic Locking
- T040 (positions-update) implements version field check to prevent concurrent modification
- T073 (useUpdatePosition hook) handles 409 conflict with rollback and refetch

### Step-Up Authentication
- T055/T056 (step-up Edge Functions) generate elevated tokens with 5-10 min validity
- T063 (StepUpMFA component) auto-triggers before approval actions
- T075 (useApprovePosition mutation) includes elevated token in request header

### Bilingual & RTL Support
- T057 (PositionEditor) uses TipTap with direction="ltr" (EN) and direction="rtl" (AR)
- T060 (VersionComparison) renders separate diffs for EN and AR with RTL formatting
- T090 (A11y test AR) validates RTL layout, Arabic screen reader labels

### AI Integration
- T050 (consistency-check Edge Function) integrates AnythingLLM API for semantic analysis
- FR-048: Graceful fallback to rule-based checks if AI unavailable (ai_service_available=false)
- T081 (integration test) validates both AI and fallback modes

### Performance Targets
- T092: API response <200ms (p95) for CRUD endpoints, <300ms for approve
- T093: Position editor TTI <3s
- T094: 100+ concurrent users without errors

### 7-Year Retention
- T004: position_versions table partitioned by created_at (annual partitions)
- retention_until calculated as created_at + 7 years
- Scheduled job (outside task scope) deletes versions where retention_until < NOW()

### RLS Enforcement
- T011-T013: Database-level RLS policies for all tables
- T082: Integration test validates RLS effectiveness (user cannot access unauthorized positions)
- All Edge Functions use Supabase client with RLS enabled (no service_role key)

---

## Validation Checklist

Before marking feature complete, verify:

- [ ] All 18 contract tests pass (T017-T036)
- [ ] All 6 integration tests pass (T078-T083)
- [ ] All 5 E2E tests pass (T084-T088)
- [ ] All 3 accessibility tests pass (T089-T091)
- [ ] Performance benchmarks met (T092-T094)
- [ ] Quickstart validation completed (T095)
- [ ] All 10 database tables created with indexes
- [ ] All 18 Edge Functions deployed
- [ ] All 7 frontend components functional
- [ ] All 6 frontend routes accessible
- [ ] All 8 TanStack Query hooks implemented
- [ ] Step-up authentication enforced on approvals
- [ ] RLS policies active on all tables
- [ ] 7-year retention mechanism verified
- [ ] Bilingual content (EN/AR) rendering correctly
- [ ] RTL support validated for Arabic
- [ ] AI consistency checking functional with fallback
- [ ] Audience group access control effective
- [ ] Optimistic locking prevents concurrent edits
- [ ] Version comparison diffs accurate

---

**Total Tasks**: 101 tasks across 10 phases (T001-T101)

**Estimated Parallel Efficiency**:
- Sequential only: ~101 sequential units
- With parallelization: ~38-42 sequential units (60% reduction)

**Critical Path**: T001 → T002 → T003 → T096 → T017/T097 (contract tests) → T037/T098 (Edge Functions) → T057/T099 (components) → T064 (routes) → T078/T101 (integration tests) → T084 (E2E test) → T089 (A11y test) → T092 (performance) → T095 (quickstart)

**Emergency Correction Task Dependencies**:
```
T003 (positions table)
  → T096 (add correction fields) [P] with T002-T009
    → T097 (contract test) [P] with T017-T036
      → T098 (Edge Function) with T037-T056
        → T099 (UI component) [P] with T057-T063
        → T100 (TanStack hook) [P] with T070-T077
          → T101 (integration test) [P] with T078-T083
```

---

*Generated from `/specs/011-positions-talking-points/` design artifacts*
*Based on Constitution v2.1.1 principles: Bilingual Excellence, Type Safety, Security-First, Data Sovereignty, Resilient Architecture, Accessibility, Container-First*
