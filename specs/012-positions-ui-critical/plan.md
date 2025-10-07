
# Implementation Plan: Positions UI Critical Integrations

**Branch**: `012-positions-ui-critical` | **Date**: 2025-10-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-positions-ui-critical/spec.md`

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
Implement critical UI integrations to enable multi-entry point access to organizational positions (talking points). Users can access positions through: (1) Dossier detail pages via a dedicated "Positions" tab, (2) Engagement detail pages with AI-suggested positions and attachment capabilities, and (3) a standalone positions library at /positions. The system includes smart AI-powered position suggestions based on engagement context, seamless position attachment/detachment workflows, and professional bilingual briefing pack generation combining engagement details with selected positions. Implementation follows a 4-phase approach with emphasis on cross-module navigation, contextual awareness, and optimal user experience.

## Technical Context
**Language/Version**: TypeScript 5.0+ (strict mode), Node.js 18+ LTS
**Primary Dependencies**: React 18+, TanStack Router v5, TanStack Query v5, Supabase Client, Tailwind CSS, shadcn/ui, AnythingLLM SDK
**Storage**: PostgreSQL 15 via Supabase with RLS policies, pgvector for AI embeddings/suggestions, Supabase Storage for generated briefing packs
**Testing**: Vitest for unit/integration tests, Playwright for E2E tests, accessibility testing with axe-core
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge) with responsive design support
**Project Type**: web (frontend + backend/Supabase edge functions)
**Performance Goals**: Position search results < 1 second, support up to 100 positions per engagement, AI suggestion latency < 2 seconds, briefing pack generation < 10 seconds for 100 positions
**Constraints**: Bilingual (Arabic/English) with RTL/LTR support, security-first with RLS and MFA, self-hosted AI service (AnythingLLM), WCAG 2.1 Level AA accessibility, graceful AI service degradation
**Scale/Scope**: Multi-user system with cross-dossier position library, engagement-position many-to-many relationships, PDF generation service, analytics tracking
**User Input Context**: ultrathink

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Bilingual Excellence
- Arabic and English support throughout (position display, search, briefing packs)
- RTL/LTR seamless switching for all UI components
- Auto-translation for briefing packs when language mismatch occurs
- Cultural conventions respected (date formats, text alignment)

### ✅ Type Safety
- TypeScript strict mode enforced across all components
- Explicit types for all API responses and data models
- No `any` types permitted (documented exceptions only)
- Component size limit <200 lines maintained

### ✅ Security-First
- RLS policies enforced for position visibility and attachment permissions
- Only dossier collaborators can attach/detach positions (FR-043)
- Audit logging for all attachment/detachment actions (FR-045)
- Input validation on all search and filter operations
- Rate limiting on AI suggestion and briefing pack generation endpoints

### ✅ Data Sovereignty
- Self-hosted AnythingLLM for AI suggestions (no external AI services)
- Position embeddings stored locally in pgvector
- Briefing packs stored in Supabase Storage (on-premise)
- No external dependencies for core functionality

### ✅ Resilient Architecture
- Error boundaries on all position-related components
- Graceful AI service degradation (manual search fallback when AI unavailable)
- Timeout controls on AI suggestions (<2s) and briefing pack generation (<10s)
- Retry mechanisms for failed briefing pack generation
- Bilingual error messages for all failure scenarios

### ✅ Accessibility
- WCAG 2.1 Level AA compliance for all new components
- Full keyboard navigation (tab order, shortcuts for attach/detach)
- Screen reader compatibility (ARIA labels for position cards, attachment status)
- Proper semantic HTML and focus management
- Tested in both Arabic (RTL) and English (LTR) modes

### ✅ Testing Requirements
- Unit tests for position attachment logic and state management
- Integration tests for engagement-position relationship flows
- E2E tests for critical user journeys (attach positions, generate briefing pack)
- Performance tests for search (<1s) and briefing generation
- Accessibility tests with axe-core

**GATE STATUS**: ✅ PASS - All constitutional requirements addressed in design approach

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

**Structure Decision**: Option 2 (Web application) - Frontend React app with Supabase backend
- Frontend: `/frontend/src/` for components, pages, hooks, types
- Backend: Supabase Edge Functions in `/supabase/functions/` for API endpoints
- Tests: `/frontend/tests/` for E2E and `/backend/tests/` for contract/integration tests

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
1. **Database Tasks (7-10 tasks)**:
   - Create migration for `engagement_positions` junction table with triggers
   - Create migration for `position_suggestions` table with AI integration
   - Create migration for `briefing_packs` table with storage integration
   - Create migration for `position_usage_analytics` table with auto-increment triggers
   - Create migration for `position_embeddings` table with pgvector indexes
   - Create RLS policies for all new tables (one task per table)
   - Create database functions (match_positions, prevent_position_deletion, etc.)

2. **Backend API Tasks (10-12 tasks)** - Based on contracts/api-spec.yaml:
   - Create Supabase Edge Function: `engagements-positions-list` (GET /engagements/{id}/positions) [P]
   - Create Supabase Edge Function: `engagements-positions-attach` (POST /engagements/{id}/positions) [P]
   - Create Supabase Edge Function: `engagements-positions-detach` (DELETE /engagements/{id}/positions/{positionId}) [P]
   - Create Supabase Edge Function: `engagements-positions-suggestions` (GET /engagements/{id}/positions/suggestions) [P]
   - Create Supabase Edge Function: `briefing-packs-generate` (POST /engagements/{id}/briefing-packs) [P]
   - Create Supabase Edge Function: `briefing-packs-get` (GET /engagements/{id}/briefing-packs/{packId}) [P]
   - Create Supabase Edge Function: `briefing-packs-status` (GET /briefing-packs/jobs/{jobId}/status) [P]
   - Create Supabase Edge Function: `positions-analytics-get` (GET /positions/{id}/analytics) [P]
   - Implement AnythingLLM integration service (embeddings + translations)
   - Implement React-PDF briefing pack template (English + Arabic)
   - Implement circuit breaker pattern for AI service resilience

3. **Frontend Component Tasks (15-18 tasks)**:
   - Create route: `/dossiers/:id` with Positions tab integration
   - Create route: `/engagements/:id` with positions section
   - Create route: `/positions` standalone library
   - Create `<PositionList>` component with virtual scrolling [P]
   - Create `<PositionCard>` component with accessibility [P]
   - Create `<PositionAttachDialog>` searchable modal [P]
   - Create `<PositionSuggestions>` component with AI indicators [P]
   - Create `<BriefingPackGenerator>` component with progress tracking [P]
   - Create `<PositionAnalytics>` dashboard component [P]
   - Implement TanStack Query hooks: `useEngagementPositions`, `useAttachPosition`, `useDetachPosition` [P]
   - Implement TanStack Query hooks: `usePositionSuggestions`, `useGenerateBriefingPack` [P]
   - Add i18n translations for positions UI (en.json + ar.json)
   - Implement breadcrumb navigation component
   - Implement context-aware state preservation (search params + sessionStorage)
   - Create error boundary for position module

4. **Testing Tasks (12-15 tasks)** - Based on quickstart.md:
   - Contract test: List engagement positions endpoint [P]
   - Contract test: Attach position endpoint [P]
   - Contract test: Detach position endpoint [P]
   - Contract test: AI suggestions endpoint [P]
   - Contract test: Briefing pack generation endpoint [P]
   - E2E test: Dossier positions tab navigation
   - E2E test: AI position suggestions workflow
   - E2E test: Manual position attachment dialog
   - E2E test: Bilingual briefing pack generation
   - E2E test: Cross-module navigation (dossier ↔ engagement ↔ positions)
   - E2E test: Edge cases (deletion prevention, limit enforcement, AI fallback)
   - Performance test: Position search (<1s response)
   - Performance test: Briefing pack generation (<10s for 100 positions)
   - A11y test: Keyboard navigation and screen reader support (Arabic + English)
   - Security test: RLS policy enforcement and audit logging

**Ordering Strategy**:
1. **Phase 2A: Foundation (Database + Types)** - Tasks 1-10
   - Database migrations first (dependencies for all)
   - TypeScript types generation from database schema
   - RLS policies and triggers

2. **Phase 2B: Backend Services (API + AI)** - Tasks 11-22 [Many parallel]
   - Edge functions can be built in parallel
   - AI service integration
   - PDF generation service

3. **Phase 2C: Frontend Components (UI)** - Tasks 23-37 [Many parallel]
   - Routes first, then components
   - Shared components (PositionList, PositionCard) early
   - Feature-specific components (suggestions, briefing packs) after

4. **Phase 2D: Testing & Validation** - Tasks 38-52
   - Contract tests alongside endpoint development
   - E2E tests after UI components complete
   - Performance and security tests last

**Dependency Markers**:
- [P] = Can run in parallel (independent files/modules)
- [D:X] = Depends on task X completion
- [DB] = Requires database migrations complete

**Estimated Output**: 50-55 numbered, ordered tasks in tasks.md

**Risk Mitigation**:
- AnythingLLM integration complexity → Early spike task for embedding generation
- PDF RTL rendering issues → Isolated React-PDF prototype task
- Performance at scale → Load testing task with 100+ positions

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
- [x] Phase 0: Research complete (/plan command) ✅ 2025-10-01
- [x] Phase 1: Design complete (/plan command) ✅ 2025-10-01
- [x] Phase 2: Task planning complete (/plan command - describe approach only) ✅ 2025-10-01
- [ ] Phase 3: Tasks generated (/tasks command) - **NEXT STEP**
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS ✅
- [x] Post-Design Constitution Check: PASS ✅
- [x] All NEEDS CLARIFICATION resolved (Technical Context complete, 9 spec clarifications remain for stakeholders)
- [x] Complexity deviations documented (None - design adheres to constitution)

**Artifacts Generated**:
- [x] `research.md` - 8 technical decisions documented
- [x] `data-model.md` - 5 core entities + relationships + migrations
- [x] `contracts/api-spec.yaml` - 10 API endpoints specified
- [x] `quickstart.md` - 18 executable test scenarios
- [x] `CLAUDE.md` - Agent context updated

**Design Highlights**:
- ✅ Multi-entry point navigation (3 routes: dossier tab, engagement section, standalone library)
- ✅ Rich junction table (engagement_positions) with audit trail
- ✅ AI-powered suggestions with circuit breaker fallback
- ✅ Bilingual PDF generation with auto-translation
- ✅ Virtual scrolling for 100+ position performance
- ✅ Comprehensive RLS policies and security

**Ready for /tasks command** to generate 50-55 numbered, ordered implementation tasks

---
*Based on Constitution v2.1.1 - See `.specify/memory/constitution.md`*
