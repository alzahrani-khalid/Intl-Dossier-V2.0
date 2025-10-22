# Implementation Plan: After-Action Structured Documentation

**Branch**: `022-after-action-structured` | **Date**: 2025-01-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/022-after-action-structured/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

**Platform Scope**: cross-platform

This feature enables structured after-action documentation for engagement outcomes with AI-assisted extraction and bilingual PDF generation. Staff members can document attendance, decisions, commitments, risks, and follow-up actions after meetings/workshops. The system auto-creates tasks from commitments, supports AI extraction from meeting minutes (synchronous/asynchronous based on document complexity), generates bilingual English/Arabic distribution PDFs, and implements edit approval workflow with version control. Mobile support includes offline record creation with sync queuing and push notifications for async AI processing completion.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.8+ (strict mode), Node.js 18+ LTS (backend), React 19 (web), React Native 0.81+ (mobile)  
**Primary Dependencies**: Supabase (PostgreSQL 15+, Auth, Storage, Realtime), AnythingLLM (AI extraction), TanStack Query v5, React Native Paper 5.12+ (mobile UI), WatermelonDB 0.28+ (offline storage), i18next (i18n), pdfkit/react-pdf (PDF generation)  
**Storage**: PostgreSQL 15+ (after_action_records, decisions, commitments, external_contacts, risks, follow_up_actions, attachments, version_snapshots tables), Supabase Storage (attachment files), WatermelonDB (mobile offline cache), Redis 7.x (caching)  
**Testing**: Vitest (web unit/integration), Jest + RNTL (mobile unit/component), Playwright (web E2E), Maestro (mobile E2E), k6 (performance)  
**Target Platform**: Web browsers (Chrome/Safari/Firefox latest 2 versions), iOS 15+, Android 10+ (API 29+)  
**Project Type**: Cross-platform (web + mobile)  
**Performance Goals**: Form submission <2s, AI extraction sync <5s, async extraction <30s, PDF generation <30s, mobile sync <3s, 100 concurrent users supported  
**Constraints**: Mobile render ≤1s, offline-capable for record creation, bilingual RTL/LTR support, max 100MB attachment size, max 10 attachments per record  
**Scale/Scope**: ~500 engagements/month, ~2000 after-action records/year, 200 active users, 8 new entities, 15+ API endpoints, 5 mobile screens

**Platform Scope**: cross-platform

*For mobile-only or cross-platform features, specify:*
- **Mobile Tech Stack**: Expo SDK 52+, React Native 0.81+, TypeScript 5.8+, WatermelonDB 0.28+ (offline), React Native Paper 5.12+ (UI), React Navigation 7+, expo-local-authentication (biometrics), expo-notifications (push), expo-document-picker (file upload)
- **Offline Requirements**: Offline-first for after-action creation/viewing, commitments queue for sync, attachments queue for upload when WiFi available
- **Sync Strategy**: Incremental sync with last_sync_timestamp, hybrid conflict resolution (auto-merge non-conflicting, user-prompt for conflicts), optimistic locking with _version column
- **Native Features**: Biometric auth for confidential records, camera integration (document scanning with expo-image-picker), push notifications (AI extraction complete, commitment assignments, edit approvals)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with project constitution (.specify/memory/constitution.md):

### Core Principles Compliance

- [x] **Mobile-First & Responsive**: All UI components start with mobile base styles (320-640px), use progressive breakpoints, have 44x44px touch targets - Form components, list views, and PDF preview will follow mobile-first patterns
- [x] **RTL/LTR Support**: All UI uses logical properties (ms-*, me-*, ps-*, pe-*), no physical direction properties, supports Arabic RTL - Bilingual PDF generation requires proper RTL layout for Arabic content
- [x] **Test-First**: Tests written and fail before implementation (if feature requires tests) - Will write contract tests for API endpoints, integration tests for AI extraction workflow, E2E tests for form submission and PDF generation
- [x] **Type Safety**: TypeScript strict mode, explicit types, no `any` usage - All entities (AfterActionRecord, Decision, Commitment, etc.) will have strict TypeScript interfaces
- [x] **Security by Default**: RLS policies on tables, JWT validation, no secrets in git, rate limiting - RLS policies will enforce dossier assignment + role-based access, AnythingLLM API key in environment variables, virus scanning for attachments
- [x] **Performance**: Indexed queries, Redis caching strategy, lazy loading, <200ms p95 latency - Indexes on engagement_id, created_by, published_at; Redis caching for PDF generation results (30-day TTL); lazy load attachments list
- [x] **Accessibility**: WCAG AA compliance, semantic HTML, keyboard navigation, 4.5:1 color contrast - Form inputs with proper labels, error announcements, keyboard-navigable multi-step form
- [x] **Cross-Platform Mobile**: Platform scope declared in spec, mobile features use Expo/RN Paper, offline-first for data-heavy workflows, hybrid conflict resolution - Spec declares cross-platform, mobile uses React Native Paper forms, WatermelonDB for offline after-action creation, hybrid conflict resolution with _version column

### Security & Compliance

- [x] **Data Protection**: Document scanning (ClamAV), sensitivity levels enforced via RLS - Attachments will be virus scanned on upload (scan_status: pending/clean/infected), confidentiality_level field (public/internal/confidential/secret) enforced via RLS
- [x] **Audit Trail**: Audit logging for create/update/delete on core entities - After-action records include created_by, created_at, updated_by, updated_at, published_by, published_at, edit_requested_by, edit_approved_by with immutable audit fields
- [x] **Authentication**: Supabase Auth with JWT, RBAC enforcement - JWT validation on all API routes, hybrid permission model (role + dossier assignment), biometric step-up for confidential records

### Quality Standards

- [x] **Code Organization**: Follows backend/frontend structure conventions - Will use backend/src/api/ for Edge Functions, frontend/src/components/ for web UI, mobile/src/screens/ for mobile screens
- [x] **Naming Conventions**: PascalCase components, kebab-case utilities, proper migration naming - Components: AfterActionForm.tsx, DecisionList.tsx; Utilities: use-after-action.ts; Migrations: YYYYMMDDHHMMSS_create_after_action_records.sql
- [x] **Code Style**: ESLint/Prettier configured, Winston logger (no console.log), explicit error handling - Will use Winston for server-side logging, try-catch blocks for AI extraction and PDF generation errors
- [x] **Git Workflow**: Conventional commits, PRs ≤300 LOC preferred - Will break implementation into atomic PRs: feat(after-action): add database schema, feat(after-action): add form UI, feat(after-action): add AI extraction

### Development Workflow

- [x] **Specification**: Feature has spec in specs/###-feature-name/ following spec-template.md - Spec exists at specs/022-after-action-structured/spec.md with user stories, success criteria, edge cases
- [x] **Planning**: Plan includes technical context, structure decision, complexity tracking - This plan.md includes technical context, will document structure decision below, no complexity violations identified
- [x] **Task Organization**: Tasks organized by user story, exact file paths, [P] markers for parallelization - Will be generated in tasks.md via /speckit.tasks command
- [x] **UI Components**: shadcn/ui or approved registries checked before custom builds - Will use shadcn/ui Form, Input, Textarea, Select components; check originui for file upload component; custom PDF preview component only if needed

**Violations Requiring Justification**: None - all constitution principles are satisfied by the planned implementation

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
backend/
├── src/
│   ├── api/
│   │   ├── after-action/
│   │   │   ├── create.ts              # Edge Function: Create after-action record
│   │   │   ├── update.ts              # Edge Function: Update draft
│   │   │   ├── publish.ts             # Edge Function: Publish record & create tasks
│   │   │   ├── request-edit.ts        # Edge Function: Request post-publish edit
│   │   │   ├── approve-edit.ts        # Edge Function: Supervisor approval
│   │   │   ├── list.ts                # Edge Function: List records for dossier
│   │   │   └── get.ts                 # Edge Function: Get single record
│   │   ├── ai-extraction/
│   │   │   ├── extract-sync.ts        # Edge Function: Synchronous extraction
│   │   │   ├── extract-async.ts       # Edge Function: Async extraction (queue)
│   │   │   └── extraction-status.ts   # Edge Function: Poll async status
│   │   ├── pdf-generation/
│   │   │   ├── generate-bilingual.ts  # Edge Function: Generate EN/AR PDFs
│   │   │   └── download-pdf.ts        # Edge Function: Get signed URL
│   │   └── external-contacts/
│   │       ├── create.ts              # Edge Function: Create external contact
│   │       ├── search.ts              # Edge Function: Search existing contacts
│   │       └── update-commitment.ts   # Edge Function: Update external commitment status
│   ├── services/
│   │   ├── ai-extraction.service.ts   # AnythingLLM integration
│   │   ├── pdf-generation.service.ts  # Bilingual PDF generation logic
│   │   ├── task-creation.service.ts   # Auto-create tasks from commitments
│   │   └── notification.service.ts    # Email/push notification logic
│   └── types/
│       ├── after-action.types.ts      # TypeScript interfaces
│       ├── ai-extraction.types.ts
│       └── pdf-generation.types.ts
└── tests/
    ├── contract/
    │   ├── after-action-api.test.ts   # API endpoint contract tests
    │   ├── ai-extraction-api.test.ts
    │   └── pdf-generation-api.test.ts
    ├── integration/
    │   ├── ai-extraction-workflow.test.ts  # End-to-end extraction flow
    │   ├── task-creation.test.ts           # Commitment → task creation
    │   └── edit-approval-workflow.test.ts  # Edit request → approval flow
    └── unit/
        ├── ai-extraction.service.test.ts
        ├── pdf-generation.service.test.ts
        └── task-creation.service.test.ts

frontend/
├── src/
│   ├── components/
│   │   ├── after-action/
│   │   │   ├── AfterActionForm.tsx         # Multi-step form component
│   │   │   ├── DecisionList.tsx            # Decision entries management
│   │   │   ├── CommitmentList.tsx          # Commitment entries management
│   │   │   ├── RiskList.tsx                # Risk entries management
│   │   │   ├── AttachmentUpload.tsx        # File upload with virus scanning
│   │   │   ├── AIExtractionStatus.tsx      # Async extraction progress
│   │   │   ├── PDFPreview.tsx              # Bilingual PDF preview
│   │   │   ├── EditRequestDialog.tsx       # Request edit modal
│   │   │   └── EditApprovalDialog.tsx      # Supervisor approval modal
│   │   └── ui/                             # shadcn/ui components (reused)
│   ├── pages/
│   │   └── after-action/
│   │       ├── AfterActionCreatePage.tsx   # Create new after-action
│   │       ├── AfterActionEditPage.tsx     # Edit draft
│   │       ├── AfterActionViewPage.tsx     # View published record
│   │       └── AfterActionListPage.tsx     # List for dossier
│   ├── hooks/
│   │   ├── use-after-action.ts             # TanStack Query hooks
│   │   ├── use-ai-extraction.ts            # AI extraction hooks
│   │   └── use-pdf-generation.ts           # PDF generation hooks
│   └── services/
│       └── after-action-api.ts             # API client wrapper
└── tests/
    ├── component/
    │   ├── AfterActionForm.test.tsx
    │   ├── CommitmentList.test.tsx
    │   └── AIExtractionStatus.test.tsx
    └── e2e/
        ├── after-action-create.spec.ts     # Playwright: Create flow
        ├── after-action-publish.spec.ts    # Playwright: Publish & task creation
        ├── ai-extraction.spec.ts           # Playwright: AI extraction flow
        └── edit-approval.spec.ts           # Playwright: Edit workflow

mobile/
├── src/
│   ├── screens/
│   │   └── AfterAction/
│   │       ├── AfterActionCreateScreen.tsx  # RN Paper form
│   │       ├── AfterActionEditScreen.tsx    # Edit draft offline
│   │       ├── AfterActionViewScreen.tsx    # View with offline cache
│   │       └── AfterActionListScreen.tsx    # List with sync status
│   ├── components/
│   │   └── AfterAction/
│   │       ├── DecisionInput.tsx            # RN Paper text input
│   │       ├── CommitmentInput.tsx          # RN Paper with date picker
│   │       ├── DocumentPicker.tsx           # expo-document-picker integration
│   │       └── SyncStatusBadge.tsx          # Offline/synced indicator
│   ├── navigation/
│   │   └── AfterActionNavigator.tsx         # React Navigation stack
│   ├── services/
│   │   ├── sync.service.ts                  # WatermelonDB → Supabase sync
│   │   └── offline-queue.service.ts         # Queue for offline operations
│   └── database/
│       └── schema/
│           ├── after-action-record.ts       # WatermelonDB model
│           ├── decision.ts
│           ├── commitment.ts
│           └── attachment-queue.ts          # Queued file uploads
└── tests/
    ├── component/
    │   ├── AfterActionCreateScreen.test.tsx  # Jest + RNTL
    │   └── CommitmentInput.test.tsx
    ├── integration/
    │   └── offline-sync.test.ts              # WatermelonDB sync logic
    └── e2e/
        └── after-action-offline.yml          # Maestro: Offline creation flow

supabase/
└── migrations/
    ├── YYYYMMDDHHMMSS_create_after_action_records.sql
    ├── YYYYMMDDHHMMSS_create_decisions.sql
    ├── YYYYMMDDHHMMSS_create_commitments.sql
    ├── YYYYMMDDHHMMSS_create_external_contacts.sql
    ├── YYYYMMDDHHMMSS_create_risks.sql
    ├── YYYYMMDDHHMMSS_create_follow_up_actions.sql
    ├── YYYYMMDDHHMMSS_create_attachments.sql
    ├── YYYYMMDDHHMMSS_create_version_snapshots.sql
    └── YYYYMMDDHHMMSS_add_after_action_rls_policies.sql
```

**Structure Decision**: Cross-platform (Option 3) selected. This feature requires full web and mobile support with offline-first architecture for mobile. Backend uses Supabase Edge Functions for API endpoints, frontend uses React 19 components, mobile uses React Native with WatermelonDB for offline persistence. Shared database migrations ensure schema consistency across platforms. Mobile requires distinct UI components (React Native Paper vs shadcn/ui) but shares business logic via backend services.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

## Mobile Architecture *(fill only for mobile-only or cross-platform features)*

### Offline-First Strategy
- **Data persistence**: 
  - WatermelonDB for after-action records, decisions, commitments, risks, follow-up actions (full CRUD offline)
  - AsyncStorage for user preferences, draft auto-save state, sync metadata (last_sync_timestamp)
  - Attachment queue in WatermelonDB: files stored locally via expo-file-system, queued for upload when WiFi available
  - External contacts cached locally for offline commitment assignment
  
- **Sync triggers**: 
  - Manual: Pull-to-refresh on list screens
  - Automatic: On app foreground if >5 minutes since last sync
  - Background: Every 15 minutes when app backgrounded + WiFi available
  - Post-operation: After successful publish/edit approval to immediately sync changes
  - Incremental: Only fetch records with updated_at > last_sync_timestamp
  
- **Conflict resolution**: 
  - Hybrid approach per constitution:
    - Auto-merge: Non-conflicting field updates (user A edits title, user B edits description)
    - User-prompt: Conflicting field updates (both edit same field) → show side-by-side diff, let user choose
  - Optimistic locking: _version column increments on each update, sync fails if versions mismatch
  - Server authority: Server timestamp wins for tie-breaking when both versions have same _version
  - Audit trail: All conflict resolutions logged with resolution_method (auto_merge | user_selected_local | user_selected_remote)

### Native Features Integration
- **Biometrics**: 
  - expo-local-authentication for Touch ID/Face ID when:
    - Creating/viewing after-action with confidentiality_level='confidential' or 'secret'
    - Approving edit requests (supervisor action)
  - Fallback: PIN code if biometrics unavailable or user declines
  - Grace period: 5 minutes after successful auth before re-prompting
  
- **Camera**: 
  - expo-image-picker for document scanning:
    - Multi-page PDF creation with perspective correction
    - Photo capture for meeting evidence (whiteboard photos, signed documents)
    - Compression before upload (max 5MB per image, JPEG quality 85%)
  - expo-document-picker for selecting existing files from device storage
  - In-app preview before attachment upload with edit/crop capability
  
- **Push Notifications**: 
  - expo-notifications with proper permission handling (opt-in on first use)
  - Notification scenarios:
    - AI extraction complete (async processing): "Meeting minutes extraction complete - review 8 suggestions"
    - Commitment assigned: "You've been assigned a new commitment from [Meeting Title] - due [Date]"
    - Edit approval needed (for supervisors): "Edit request from [User] for [After-Action Title]"
    - Edit approved/rejected: "Your edit request was [approved/rejected] by [Supervisor]"
    - Commitment due soon: "Commitment '[Description]' due in 24 hours"
  - Deep linking: Notifications open relevant screen (after-action view, commitment detail)
  - Badge count: Show unread notification count on app icon

### Performance Targets
- Initial screen render: ≤1s (skeleton UI with cached data from WatermelonDB)
- Fresh data load: ≤2s for list of 50 after-action records with metadata
- Incremental sync: ≤3s for typical dataset (10 updated records + attachments metadata)
- Form save to local DB: ≤500ms for record with 5 commitments, 3 decisions
- Attachment upload queue: Background upload with retry logic (3 attempts, exponential backoff)
- PDF generation on mobile: Not supported - redirect to web for PDF generation (mobile shows "Generate on Web" button)
