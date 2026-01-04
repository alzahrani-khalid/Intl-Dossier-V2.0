# Tasks: AI Brief Generation & Intelligence Layer

**Feature Branch**: `033-ai-brief-generation`
**Created**: 2025-12-05
**Input**: plan.md, spec.md, data-model.md, research.md, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US5)
- Paths use `backend/`, `frontend/`, `supabase/` structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency installation

- [x] T001 [P] Install AI dependencies in backend: `cd backend && pnpm add @mastra/core @xenova/transformers openai @anthropic-ai/sdk ioredis`
- [x] T002 [P] Create AI module directory structure in backend/src/ai/
- [x] T003 [P] Add AI environment variables to backend/.env.example (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.)
- [x] T004 [P] Create AI feature flag configuration in backend/src/ai/config.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core AI infrastructure that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Migrations

- [x] T005 Create AI enums migration in supabase/migrations/20251205000001_ai_enums.sql
  - Enums: `ai_provider`, `ai_run_status`, `ai_feature`, `link_proposal_status`, `brief_status`, `linkable_entity_type`, `data_classification`
- [x] T006 Create ai_model_pricing table with seed data in supabase/migrations/20251205000002_ai_model_pricing.sql
- [x] T007 Create organization_llm_policies table in supabase/migrations/20251205000003_organization_llm_policies.sql
- [x] T008 Create AI observability tables (ai_runs, ai_messages, ai_tool_calls) in supabase/migrations/20251205000004_ai_observability.sql
- [x] T009 Apply RLS to observability tables in supabase/migrations/20251205000005_ai_observability_rls.sql
- [x] T010 Create AI helper functions (get_monthly_ai_spend, check_ai_spend_cap, calculate_ai_cost) in supabase/migrations/20251205000006_ai_functions.sql

### Backend Core Services

- [x] T011 Implement LLM Router with provider selection, data classification routing, Arabic detection (≥30%), spend cap enforcement in backend/src/ai/llm-router.ts
- [x] T012 Implement Embeddings Service using BGE-M3 (1024-d) as primary, OpenAI fallback for initial setup only in backend/src/ai/embeddings-service.ts
- [x] T013 [P] Create Mastra agent configuration and registry pattern in backend/src/ai/mastra-config.ts
- [x] T014 Refactor vector.service.ts to use new embeddings service in backend/src/services/vector.service.ts
- [x] T015 Refactor semantic-search.service.ts to use new embeddings service in backend/src/services/semantic-search.service.ts

### Unit Tests (Foundational)

- [x] T016 [P] Arabic detection unit tests (pure Arabic, bilingual, English, edge cases) in backend/src/ai/**tests**/arabic-detection.test.ts
- [x] T017 [P] Security enforcement tests (classification routing, RLS, spend caps) in backend/src/ai/**tests**/security-enforcement.test.ts

**Checkpoint**: AI infrastructure ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Generate Engagement Brief (Priority: P1) 🎯 MVP

**Goal**: Enable Country Analysts to generate AI-assisted briefs for upcoming engagements in under 60 seconds

**Independent Test**: Select an upcoming engagement, click "Generate Brief", verify structured brief with citations is produced

### Database for US1

- [x] T018 [US1] Create ai_briefs table migration in supabase/migrations/20251206000001_ai_briefs.sql

### Backend for US1

- [x] T019 [US1] Implement Brief Context Service (semantic search, position retrieval, commitment aggregation) in backend/src/services/brief-context.service.ts
- [x] T020 [US1] Implement Brief Generator Agent with tools (search_dossiers, get_positions, get_commitments, get_engagements) in backend/src/ai/agents/brief-generator.ts
- [x] T021 [US1] Create Brief API endpoints (POST generate, GET by id, GET list) with SSE streaming in backend/src/api/ai/briefs.ts
- [x] T022 [US1] Register brief routes in backend/src/api/index.ts
- [x] T023 [US1] Implement timeout handling (90s) with partial results in backend/src/api/ai/briefs.ts

### Frontend for US1

- [x] T024 [P] [US1] Create BriefGenerationPanel component (progress indicator, streaming, retry) in frontend/src/components/ai/BriefGenerationPanel.tsx
- [x] T025 [P] [US1] Create BriefViewer component (sections, citations, print/export) in frontend/src/components/ai/BriefViewer.tsx
- [x] T026 [US1] Create useGenerateBrief hook (SSE connection, progress state, error handling) in frontend/src/hooks/useGenerateBrief.ts
- [x] T027 [US1] Integrate brief generation into engagement detail page in frontend/src/routes/\_protected/engagements/$engagementId.tsx
- [x] T028 [P] [US1] Add brief generation i18n (EN) in frontend/public/locales/en/ai-brief.json
- [x] T029 [P] [US1] Add brief generation i18n (AR) in frontend/public/locales/ar/ai-brief.json

**Checkpoint**: User Story 1 complete - briefs can be generated and viewed independently

---

## Phase 4: User Story 2 - AI Chat Interface (Priority: P1)

**Goal**: Enable Policy Officers to ask natural language questions about dossiers, commitments, and relationships via persistent chat dock

**Independent Test**: Open chat dock, ask "What commitments do we have with Japan?", verify accurate response with citations

### Backend for US2

- [x] T030 [US2] Implement Chat Assistant Agent with tools (search_entities, get_dossier, query_commitments, get_engagement_history) in backend/src/ai/agents/chat-assistant.ts
- [x] T031 [US2] Create SSE Chat endpoint (POST /api/ai/chat) with streaming in backend/src/api/ai/chat.ts
- [x] T032 [US2] Create WebSocket Chat endpoint for mobile in backend/src/api/ai/ws-chat.ts
- [x] T033 [US2] Register chat routes (SSE and WS) in backend/src/api/index.ts

### Frontend for US2

- [x] T034 [P] [US2] Create ChatDock component (FAB, expandable panel, message history) in frontend/src/components/ai/ChatDock.tsx
- [x] T035 [P] [US2] Create ChatMessage component (user/assistant styling, tool cards, citations) in frontend/src/components/ai/ChatMessage.tsx
- [x] T036 [P] [US2] Create ChatInput component (text input, send button, keyboard handling) in frontend/src/components/ai/ChatInput.tsx
- [x] T037 [P] [US2] Create ToolResultCard component (tool execution display) in frontend/src/components/ai/ToolResultCard.tsx
- [x] T038 [US2] Create useAIChat hook (SSE streaming, message state, tool handling) in frontend/src/hooks/useAIChat.ts
- [x] T039 [US2] Create ChatContext provider (global chat state, session persistence) in frontend/src/contexts/ChatContext.tsx
- [x] T040 [US2] Integrate ChatDock into protected layout in frontend/src/routes/\_protected.tsx
- [x] T041 [P] [US2] Add chat i18n (EN) in frontend/public/locales/en/ai-chat.json
- [x] T042 [P] [US2] Add chat i18n (AR) in frontend/public/locales/ar/ai-chat.json

**Checkpoint**: User Story 2 complete - chat dock works independently for Q&A

---

## Phase 5: User Story 3 - Entity Link Suggestions (Priority: P2)

**Goal**: Enable Intake Officers to review AI-suggested dossier/position links for new intake tickets

**Independent Test**: Create intake ticket, click "Suggest Links", review proposals, approve/reject them

### Database for US3

- [x] T043 [US3] Create ai_entity_link_proposals table in supabase/migrations/20251213000001_entity_link_proposals.sql
- [x] T044 [US3] Create intake_entity_links table in supabase/migrations/20251213000002_intake_entity_links.sql

### Backend for US3

- [x] T045 [US3] Implement Intake Linker Agent (search_similar_entities, confidence scoring, justification) in backend/src/ai/agents/intake-linker.ts
- [x] T046 [US3] Create Entity Linking API (propose-links, approve, reject, get proposals) in backend/src/api/ai/intake-linking.ts
- [x] T047 [US3] Register entity linking routes in backend/src/api/index.ts

### Frontend for US3

- [x] T048 [US3] Create EntityLinkSuggestions component (cards, confidence badge, approve/reject) in frontend/src/components/ai/EntityLinkSuggestions.tsx
- [x] T049 [US3] Integrate suggestions into intake ticket detail page in frontend/src/routes/\_protected/intake/tickets.$id.tsx
- [x] T050 [P] [US3] Add entity linking i18n (EN/AR) in frontend/public/locales/

**Checkpoint**: User Story 3 complete - entity linking works independently

---

## Phase 6: User Stories 4 & 5 - Admin Features (Priority: P3)

**Goal**: Enable Admins to monitor AI usage/costs (US4) and configure LLM policies (US5)

**Independent Test**: Navigate to Admin → AI Usage/Settings, verify metrics display and policy changes take effect

### Frontend for US4 (AI Usage Dashboard)

- [x] T051 [US4] Create AIUsageDashboard page (charts, breakdown, user activity, date filter) in frontend/src/routes/\_protected/admin/ai-usage.tsx
- [x] T052 [US4] Create admin route for AI usage at /admin/ai-usage in frontend/src/routes/\_protected/admin/ai-usage.tsx

### Frontend for US5 (AI Settings)

- [x] T053 [US5] Create AISettings page (LLM policy form, provider config, spend caps, feature toggles) in frontend/src/routes/\_protected/admin/ai-settings.tsx
- [x] T054 [US5] Create admin route for AI settings at /admin/ai-settings in frontend/src/routes/\_protected/admin/ai-settings.tsx

### Shared Admin

- [x] T055 [P] [US4/US5] Add admin navigation links for AI Usage and AI Settings
- [x] T056 [P] [US4/US5] Add admin i18n (EN/AR) in frontend/public/locales/

**Checkpoint**: Admin stories complete - usage monitoring and policy config work

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Performance optimization, error handling, documentation

### Performance

- [x] T057 [P] Implement Redis caching for frequently used embeddings in backend/src/ai/embeddings-service.ts
- [x] T058 [P] Add rate limiting per user/org using Redis in backend/src/middleware/ai-rate-limit.ts
- [x] T059 [P] Implement request deduplication for concurrent identical requests in backend/src/ai/llm-router.ts
- [x] T060 Optimize vector search queries with index tuning (supabase/migrations/20251206100001_optimize_vector_search.sql)

### Error Handling

- [x] T061 Implement graceful LLM fallback with provider health checks in backend/src/ai/llm-router.ts
- [x] T062 Add retry logic with exponential backoff for rate limits in backend/src/ai/llm-router.ts
- [x] T063 [P] Create user-friendly error messages with i18n support in frontend/src/utils/ai-errors.ts

### Integration Tests

- [x] T064 [P] Integration tests for brief generation flow in backend/src/ai/**tests**/brief-generation.integration.test.ts
- [x] T065 [P] E2E tests for chat flow in e2e/tests/ai-chat.spec.ts
- [x] T066 Load testing setup for 50 concurrent users (frontend/tests/performance/ai-load-test.ts)

### Documentation

- [x] T067 [P] API documentation for AI endpoints (docs/ai-api-reference.md, specs/033-ai-brief-generation/contracts/ai-api.yaml)
- [x] T068 [P] Admin guide for policy configuration in docs/ai-admin-guide.md
- [x] T069 [P] User guide for brief generation and chat in docs/ai-user-guide.md

### Validation

- [x] T070 Run quickstart.md validation scenarios
- [x] T071 Update checklists/requirements.md with completed items

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup → Phase 2: Foundational → User Stories (Phase 3-6) → Phase 7: Polish
                           ↓
              ┌────────────┼────────────┐
              ↓            ↓            ↓
          US1 (P1)     US2 (P1)     US3 (P2) → US4/US5 (P3)
```

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - **BLOCKS all user stories**
- **User Story 1 (Phase 3)**: Can start after Foundational
- **User Story 2 (Phase 4)**: Can start after Foundational (parallel with US1)
- **User Story 3 (Phase 5)**: Can start after Foundational (parallel with US1/US2)
- **User Stories 4/5 (Phase 6)**: Can start after Foundational (but depends on observability data from US1-3)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Independence

| Story             | Can Start After  | Dependencies           |
| ----------------- | ---------------- | ---------------------- |
| US1 (Brief Gen)   | Phase 2 complete | None on other stories  |
| US2 (Chat)        | Phase 2 complete | None on other stories  |
| US3 (Entity Link) | Phase 2 complete | None on other stories  |
| US4 (Usage)       | Phase 2 complete | Better with US1-3 data |
| US5 (Settings)    | Phase 2 complete | None on other stories  |

### Parallel Opportunities

**Phase 1 (All parallel)**:

```
T001 ∥ T002 ∥ T003 ∥ T004
```

**Phase 2 (Migrations sequential, then parallel)**:

```
T005 → T006 → T007 → T008 → T009 → T010
                                    ↓
                           T011 → T012 → T014 → T015
                              ↓
                           T013 ∥ T016 ∥ T017
```

**User Stories (Can run in parallel after Phase 2)**:

```
Phase 3 (US1) ∥ Phase 4 (US2) ∥ Phase 5 (US3) → Phase 6 (US4/US5)
```

**Within US1**:

```
T018 → T019 → T020 → T021 → T022 → T023
                              ↓
                    T024 ∥ T025 ∥ T028 ∥ T029
                              ↓
                           T026 → T027
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (1 day)
2. Complete Phase 2: Foundational (3-4 days)
3. Complete Phase 3: User Story 1 - Brief Generation (5-7 days)
4. **STOP and VALIDATE**: Test brief generation independently
5. Deploy/demo if ready - **This is the MVP!**

### Incremental Delivery

| Milestone | Stories   | Value Delivered                              |
| --------- | --------- | -------------------------------------------- |
| MVP       | US1       | Brief generation reduces prep time by 50%    |
| +Chat     | US1 + US2 | Natural language queries for instant answers |
| +Linking  | US1-3     | Automated entity suggestions for intake      |
| +Admin    | US1-5     | Full observability and policy control        |

### Estimated Timeline

| Phase             | Days | Cumulative |
| ----------------- | ---- | ---------- |
| Setup             | 1    | 1          |
| Foundational      | 3-4  | 4-5        |
| US1 (Brief Gen)   | 5-7  | 9-12       |
| US2 (Chat)        | 5-7  | 14-19      |
| US3 (Entity Link) | 3-4  | 17-23      |
| US4/US5 (Admin)   | 2-3  | 19-26      |
| Polish            | 2-3  | 21-29      |

**Total: ~21-29 days** (3-4 weeks)

---

## Task Summary

| Phase             | Tasks  | Files                     |
| ----------------- | ------ | ------------------------- |
| Setup             | 4      | Config, dependencies      |
| Foundational      | 13     | Migrations, core services |
| US1 (Brief Gen)   | 12     | Backend + Frontend        |
| US2 (Chat)        | 13     | Backend + Frontend        |
| US3 (Entity Link) | 8      | Backend + Frontend        |
| US4/US5 (Admin)   | 6      | Frontend only             |
| Polish            | 15     | Cross-cutting             |
| **Total**         | **71** |                           |

---

## Notes

- [P] tasks can run in parallel (different files, no dependencies)
- [USn] label maps task to specific user story
- Each user story is independently completable and testable
- Commit after each task or logical group
- Mobile-first (44x44px touch targets) and RTL support required for all UI
- Use logical properties (ms-_, me-_, ps-_, pe-_) for RTL
