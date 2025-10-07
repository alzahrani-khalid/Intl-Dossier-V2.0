
# Implementation Plan: After-Action Notes

**Branch**: `010-after-action-notes` | **Date**: 2025-09-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-after-action-notes/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
After-Action Notes enables structured capture of engagement outcomes (decisions, commitments, risks, follow-up actions) with AI-assisted extraction from meeting minutes, automatic task/commitment creation linked to dossiers, and bilingual PDF summary generation. Features include draft/publish workflow with supervisor approval for edits, hybrid permission model (role + dossier assignment), configurable notifications, external contact tracking, and sync/async AI processing modes.

## Technical Context
**Language/Version**: TypeScript 5.0+ (strict mode), Node.js 18+ LTS
**Primary Dependencies**: React 18+, Supabase (PostgreSQL + Auth + RLS + Realtime + Storage), TanStack Router v5, TanStack Query v5, Tailwind CSS, shadcn/ui, AnythingLLM (self-hosted), pgvector
**Storage**: PostgreSQL 15 via Supabase with RLS policies, Supabase Storage for attachments, pgvector for AI embeddings
**Testing**: Vitest for unit tests, Playwright for E2E tests, API contract tests
**Target Platform**: Web application (responsive design supporting desktop + tablet + mobile)
**Project Type**: web (frontend + backend via Supabase Edge Functions)
**Performance Goals**: AI extraction <5 sec (sync mode), <30 sec (async mode); PDF generation <3 sec; API response <200ms p95
**Constraints**: Max 100MB per attachment, max 10 attachments per record; bilingual support mandatory (Arabic/English); offline fallback for AI failures; 24-hour signed URL expiry for attachments
**Scale/Scope**: ~50 after-action records/month per dossier; support 100+ concurrent users; handle 1000+ commitments in system

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Bilingual Excellence**: ✅ PASS
- Arabic/English support required for after-action forms, summaries, notifications
- RTL/LTR switching for form layouts and PDF generation
- Cultural conventions (date formats, name ordering) respected

**Type Safety**: ✅ PASS
- TypeScript strict mode enforced
- All entities (AfterActionRecord, Commitment, Decision, Risk) will have explicit types
- No `any` types planned; components kept under 200 lines

**Security-First**: ✅ PASS
- MFA enforced via Supabase Auth
- RLS policies on all after-action tables (after_action_records, commitments, decisions, risks)
- Step-up authentication for confidential records (FR-011)
- Input validation on forms (client + server)
- Rate limiting on AI extraction and PDF generation endpoints
- Attachment virus scanning (ClamAV integration, FR-023)

**Data Sovereignty**: ✅ PASS
- Supabase self-hosted
- AnythingLLM containerized locally for AI extraction
- All data stays within infrastructure
- No external cloud dependencies

**Resilient Architecture**: ✅ PASS
- Error boundaries on all after-action components
- Graceful AI service fallback (FR-022 async mode with timeout)
- Timeout controls: 5 sec sync, 30 sec async extraction
- Offline fallback: manual form entry when AI unavailable
- Bilingual error messages throughout

**Accessibility**: ✅ PASS
- WCAG 2.1 Level AA compliance required
- Full keyboard navigation for forms
- Screen reader compatibility (ARIA labels on all form fields)
- Tested in both Arabic and English

**Container-First**: ✅ PASS
- Docker containerization for all services
- Docker Compose orchestration (Supabase, AnythingLLM, ClamAV)
- Health checks on AI and storage services
- Resource limits defined for AI processing

**Initial Gate Status**: ✅ ALL CHECKS PASS - Proceeding to Phase 0

---

## Post-Design Constitution Re-Check

**Bilingual Excellence**: ✅ PASS (Verified)
- API contracts include language parameters (en/ar/both)
- PDF generation uses @react-pdf/renderer with RTL support (Noto Sans Arabic)
- Email notifications use Handlebars templates with bilingual versions
- Database fields support Arabic text (TEXT type with UTF-8)
- User preferences table includes language_preference field

**Type Safety**: ✅ PASS (Verified)
- All entities defined with TypeScript interfaces in data-model.md
- OpenAPI spec defines explicit schemas for all request/response types
- No `any` types planned
- Strict validation on enums (engagement_type, publication_status, etc.)

**Security-First**: ✅ PASS (Verified)
- RLS policies defined for hybrid permission model (role + dossier assignment)
- Step-up MFA implemented for confidential records (publish, PDF generation)
- Rate limiting on AI extraction and PDF generation endpoints (research.md)
- Attachment virus scanning with ClamAV (data-model.md constraints)
- Input validation: CHECK constraints on DB, Zod schemas on API (contracts)
- Signed URLs with 24-hour expiry for attachments and PDFs

**Data Sovereignty**: ✅ PASS (Verified)
- AnythingLLM self-hosted (research.md decision)
- Nodemailer + self-hosted SMTP (research.md decision)
- ClamAV self-hosted in Docker (research.md decision)
- No external APIs (no SendGrid, no VirusTotal)
- All data in Supabase (self-hostable)

**Resilient Architecture**: ✅ PASS (Verified)
- AI extraction fallback: Manual form entry when AnythingLLM unavailable
- Timeout controls: 5 sec sync, 30 sec async extraction with cancellation
- Offline handling: Draft saving works without AI
- Error boundaries planned for all React components (quickstart.md)
- Graceful degradation for low-confidence AI results (<0.5 not populated)

**Accessibility**: ✅ PASS (Verified)
- Quickstart.md includes 5 accessibility checks (keyboard nav, screen readers, color contrast)
- ARIA labels required on all form fields (quickstart validation)
- Bilingual screen reader testing (English + Arabic)
- Focus indicators verified

**Container-First**: ✅ PASS (Verified)
- Docker Compose services: AnythingLLM, ClamAV (research.md)
- Health checks defined for AnythingLLM and ClamAV
- Resource limits to be defined in docker-compose.yml

**Post-Design Gate Status**: ✅ ALL CHECKS PASS - Ready for Phase 2

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 2 (Web application) - frontend/ and backend/ directories with Supabase Edge Functions

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh claude`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
The /tasks command will follow these steps:
1. Load `.specify/templates/tasks-template.md` as base structure
2. Extract entities from data-model.md (11 entities: engagements, after_action_records, etc.)
3. Extract endpoints from contracts/api-spec.yaml (16 endpoints across 4 categories)
4. Extract user stories from quickstart.md (8 stories + 8 edge cases)
5. Generate dependency-ordered tasks following TDD principles

**Ordering Strategy** (Dependency Graph):
```
Database Layer (Phase 1):
  1. Create migration: engagements table [P]
  2. Create migration: after_action_records table (depends on engagements)
  3. Create migration: external_contacts table [P]
  4. Create migration: child tables (decisions, commitments, risks, follow_ups, attachments)
  5. Create migration: after_action_versions table
  6. Create migration: notification tables (user_notification_preferences, notifications) [P]
  7. Create indexes and RLS policies
  8. Create database functions (update_overdue_commitments, etc.)

Backend Layer (Phase 2):
  Contract Tests (write first, all will fail):
  9. Write contract tests for Engagements endpoints [P]
  10. Write contract tests for After-Actions endpoints [P]
  11. Write contract tests for AI Extraction endpoints [P]
  12. Write contract tests for Documents endpoints [P]

  Implementation (make tests pass):
  13. Implement Supabase Edge Function: engagements (CRUD)
  14. Implement Supabase Edge Function: after-actions-create
  15. Implement Supabase Edge Function: after-actions-get
  16. Implement Supabase Edge Function: after-actions-update
  17. Implement Supabase Edge Function: after-actions-publish (with step-up MFA)
  18. Implement Supabase Edge Function: after-actions-request-edit
  19. Implement Supabase Edge Function: after-actions-approve-edit
  20. Implement Supabase Edge Function: after-actions-versions
  21. Implement Supabase Edge Function: ai-extract (sync/async hybrid)
  22. Implement Supabase Edge Function: ai-extract-status
  23. Implement Supabase Edge Function: pdf-generate (bilingual)
  24. Implement Supabase Edge Function: attachments (upload/list/delete with virus scan)

Frontend Layer (Phase 3):
  Components:
  25. Create EngagementForm component [P]
  26. Create AfterActionForm component (main form with all sections)
  27. Create DecisionList component [P]
  28. Create CommitmentEditor component [P]
  29. Create RiskList component [P]
  30. Create FollowUpList component [P]
  31. Create AttachmentUploader component (with virus scan status) [P]
  32. Create AIExtractionButton component (sync/async handling) [P]
  33. Create PDFGeneratorButton component [P]
  34. Create VersionHistoryViewer component [P]
  35. Create EditApprovalFlow component (diff view) [P]

  TanStack Query Hooks:
  36. Create useEngagement, useCreateEngagement hooks [P]
  37. Create useAfterAction, useCreateAfterAction, useUpdateAfterAction hooks [P]
  38. Create usePublishAfterAction hook (with step-up MFA)
  39. Create useRequestEdit, useApproveEdit hooks [P]
  40. Create useAIExtract hook (sync/async modes)
  41. Create useGeneratePDF hook
  42. Create useAttachments, useUploadAttachment hooks [P]

  Routes:
  43. Create route: /engagements/:id (detail view)
  44. Create route: /engagements/:id/after-action (form)
  45. Create route: /after-actions/:id (detail view with edit/publish actions)
  46. Create route: /after-actions/:id/versions (version history)

Integration Tests (Phase 4):
  47. Integration test: User Story 1 - Log After-Action Record
  48. Integration test: User Story 2 - AI-Assisted Extraction
  49. Integration test: User Story 3 - Publish After-Action (Non-Confidential)
  50. Integration test: User Story 4 - Publish Confidential (Step-Up Auth)
  51. Integration test: User Story 5 - Request and Approve Edits
  52. Integration test: User Story 6 - Generate Bilingual PDF
  53. Integration test: User Story 7 - External Commitment Tracking
  54. Integration test: User Story 8 - Notification Preferences

Edge Case Tests (Phase 5):
  55. E2E test: Attachment limit enforcement [P]
  56. E2E test: Concurrent edit conflict [P]
  57. E2E test: File size limit [P]
  58. E2E test: Invalid file type [P]
  59. E2E test: Virus detection [P]
  60. E2E test: Permission check (dossier assignment) [P]
  61. E2E test: Staff tries to publish (role check) [P]
  62. E2E test: Low AI confidence handling [P]

Performance & Accessibility (Phase 6):
  63. Performance test: API response times (<200ms p95)
  64. Performance test: AI extraction (sync <5s, async <30s)
  65. Performance test: PDF generation (<3s)
  66. Accessibility audit: Keyboard navigation
  67. Accessibility audit: Screen readers (EN + AR)
  68. Accessibility audit: Color contrast (WCAG AA)

Docker & Deployment (Phase 7):
  69. Add ClamAV to docker-compose.yml with health checks
  70. Configure SMTP environment variables for email notifications
  71. Add @react-pdf/renderer + Noto Sans Arabic font to frontend build
  72. Update Supabase Edge Functions deployment script
```

**Estimated Output**: 72 tasks organized in 7 phases

**Parallelization**: Tasks marked [P] can run in parallel (independent files/services)

**Key Dependencies**:
- Database migrations must complete before Edge Functions
- Contract tests written before implementation
- Backend endpoints ready before frontend hooks
- Components ready before routes
- Unit tests before integration tests
- Integration tests before E2E tests

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) ✅
- [x] Phase 1: Design complete (/plan command) ✅
- [x] Phase 2: Task planning complete (/plan command - describe approach only) ✅
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS ✅
- [x] Post-Design Constitution Check: PASS ✅
- [x] All NEEDS CLARIFICATION resolved ✅
- [x] Complexity deviations documented: NONE (no violations)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
