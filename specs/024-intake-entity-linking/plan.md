# Implementation Plan: Intake Entity Linking System

**Branch**: `024-intake-entity-linking` | **Date**: 2025-01-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/024-intake-entity-linking/spec.md`
**Platform Scope**: Web-only (responsive design; mobile app implementation deferred per spec section 11)

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature implements a polymorphic entity linking system that allows triage officers to associate intake tickets with 11 different entity types (dossiers, positions, MOUs, engagements, assignments, commitments, intelligence signals, organizations, countries, forums, working groups, topics). The system supports 5 link types (primary, related, requested, mentioned, assigned_to) with validation rules, AI-powered link suggestions via AnythingLLM with pgvector semantic search, soft-delete for audit trails, and automatic link migration when intake tickets convert to formal positions. Performance targets: <30s manual linking, <3s AI suggestions, <500ms batch operations, <2s reverse lookup for 1000+ intakes.

## Technical Context

**Language/Version**: TypeScript 5.8+ (strict mode), Node.js 18+ LTS (backend), React 19 (frontend)
**Primary Dependencies**: Supabase (PostgreSQL 15+, Auth, RLS, Realtime), TanStack Query v5, TanStack Router v5, Redis 7.x, AnythingLLM API v2.0+ (text-embedding-ada-002 or all-MiniLM-L6-v2), shadcn/ui, Tailwind CSS, @dnd-kit/core (drag-and-drop), i18next (internationalization)
**Storage**: PostgreSQL 15+ with pgvector extension (1536-dimensional embeddings), pg_trgm (fuzzy search), Redis 7.x (entity metadata cache, 5-minute TTL)
**Testing**: Vitest (unit/integration), Playwright (E2E), axe-playwright (accessibility), k6 (performance)
**Target Platform**: Web browsers (Chrome 90+, Safari 14+, Firefox 88+) with responsive design (320px-2560px viewport)
**Project Type**: Web application (backend + frontend)
**Performance Goals**:
- Manual linking workflow: <30 seconds end-to-end (SC-001)
- AI suggestions: <3 seconds for 3-5 recommendations (SC-002)
- Batch link creation: 50 links in <500ms (SC-003)
- Reverse lookup: <2 seconds for 1000+ intakes (SC-004)
- Support 50 concurrent users without degradation (SC-009)

**Constraints**:
- Organization-level multi-tenancy enforced via RLS
- Clearance level validation (1-4 integer hierarchy: Public, Internal, Confidential, Secret)
- Immutable audit logs retained for 7 years (compliance requirement)
- Soft-delete for all link operations (preserves audit trail)
- Mobile-first responsive design with RTL Arabic support (logical CSS properties)

**Scale/Scope**:
- Expected dataset: 10,000+ intake tickets, 11 entity types, 5 link types
- Target link density: 2-5 links per intake ticket average
- AI suggestion acceptance rate: 90% (SC-005)
- Zero unauthorized data access (SC-006)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Mobile-First & Responsive Design ✅ PASS
- **Application**: Entity linking UI (search dialog, link cards, AI suggestions panel, drag-and-drop reordering)
- **Compliance**: All components will use base styles for mobile (320-640px), progressive enhancement with Tailwind breakpoints (sm:, md:, lg:)
- **Touch targets**: Minimum 44x44px for all interactive elements (link cards, buttons, drag handles)
- **Verification**: Responsive design checklist validation before merge

### Principle II: RTL/LTR Internationalization ✅ PASS
- **Application**: All entity linking UI components, link type badges, entity search results
- **Compliance**: Using logical properties exclusively (ms-*, me-*, ps-*, pe-*, text-start, text-end)
- **Directional handling**: Icon flipping for arrows/chevrons based on `i18n.language === 'ar'`
- **Verification**: Component reviews must test Arabic RTL rendering

### Principle III: Test-First Development ✅ PASS
- **Application**: New API endpoints, link validation logic, AI integration, migration workflows
- **Test types required**:
  - Contract tests: 9 API endpoints (create, batch, delete, restore, get, reverse lookup, suggestions, accept, reorder)
  - Integration tests: Link migration, AI service integration, bulk operations, clearance enforcement
  - E2E tests: 5 user stories (P1-P3 priorities) using Playwright
- **Red-Green-Refactor**: Tests written and verified to fail before implementation
- **Verification**: Git history shows test files committed before implementation files

### Principle IV: Type Safety & Strict Mode ✅ PASS
- **Application**: All TypeScript code (backend services, API routes, frontend components, hooks)
- **Compliance**: TypeScript 5.8+ strict mode enabled, explicit types for all functions/variables/props
- **No `any` usage**: Except wrapped interfaces for AnythingLLM API (typed abstractions required)
- **Null safety**: Optional chaining (?.) and nullish coalescing (??) throughout
- **Verification**: Zero TypeScript compiler errors, ESLint flags `any` usage

### Principle V: Security & Privacy by Default ✅ PASS
- **Application**: intake_entity_links, link_audit_logs, ai_link_suggestions tables
- **RLS policies required**:
  - Organization boundary enforcement: `auth.uid() IN (SELECT user_id FROM org_members WHERE org_id = intake.org_id)`
  - Clearance level filtering: `profiles.clearance_level >= entity.classification_level`
  - Soft-delete exclusion: `deleted_at IS NULL` in all queries
- **Authentication**: Supabase Auth JWT validation on all API routes
- **Secrets management**: AnythingLLM API keys in environment variables (never committed)
- **Rate limiting**: Applied to AI suggestion endpoint (3 requests/minute per user)
- **Verification**: RLS policies in migrations, security scanning in CI/CD

### Principle VI: Performance & Scalability ✅ PASS
- **Application**: Database queries, Redis caching, React component optimization
- **Indexing strategy**:
  - Primary: (intake_id, deleted_at), (entity_type, entity_id, deleted_at), (intake_id, link_type, deleted_at)
  - Vector: pgvector HNSW index on intake_embeddings.embedding for <3s AI suggestions
  - Audit: (created_at), GIN index on link_audit_logs.details (JSONB queries)
- **Redis caching**: Entity metadata (name, type, last_linked_at) with 5-minute TTL
- **React optimization**: Lazy loading for EntityLinkManager, virtualization if >50 links per intake, TanStack Query for data fetching
- **N+1 prevention**: Batch entity lookups, JOIN queries for reverse lookup
- **Verification**: k6 performance tests, database query analysis in code reviews

### Principle VII: Accessibility (WCAG AA) ✅ PASS
- **Application**: Entity search dialog, link cards, AI suggestions panel, drag-and-drop reordering
- **Semantic HTML**: `<dialog>` for modals, `<button>` for actions, `<ul>` for link lists
- **ARIA labels**: aria-label="Search entities", aria-describedby for suggestions, aria-live for status updates
- **Keyboard navigation**: Tab through links, Enter to select, Escape to close dialogs, Space for drag-and-drop
- **Color contrast**: 4.5:1 minimum for text, 3:1 for UI components
- **Verification**: axe-playwright tests must pass, keyboard navigation in E2E tests

### Principle VIII: Cross-Platform Mobile Development ✅ PASS (with timeline commitment)
- **Platform scope**: Web-only for initial release (technical phasing decision)
- **Constitutional requirement**: Principle VIII mandates mobile implementation for "data-heavy workflows (dossier management, document handling, relationship mapping)". Intake entity linking qualifies as data-heavy (links intake tickets to 11 entity types, supports bulk operations, maintains relationship graphs).
- **Timeline commitment**: Mobile implementation with offline-first architecture (WatermelonDB sync, React Native Paper UI) MUST be implemented within 6 months of web MVP launch to satisfy Principle VIII requirements for data-heavy workflows.
- **Justification for deferral**: Phased implementation prioritizes foundational backend infrastructure and data model (Phase 2) which will be shared across web and mobile platforms. Web UI validates user workflows and API contracts before mobile investment.
- **Future mobile scope**: Mobile implementation will include:
  - Offline-first link creation with WatermelonDB sync to intake_entity_links table
  - AI suggestions with cached results for offline review
  - Biometric-protected link deletion/restoration (steward+ role)
  - Push notifications for link suggestions and migration events
- **Data model compatibility**: Current intake_entity_links, link_audit_logs, and ai_link_suggestions tables designed for cross-platform sync (includes created_at, updated_at, org_id for multi-tenancy, classification_level for clearance filtering).
- **Verification**: Mobile implementation tracked in separate feature specification (to be created within 3 months of MVP launch).

### Security & Compliance Requirements ✅ PASS
- **Audit trail**: All link operations logged to immutable link_audit_logs table (no UPDATE/DELETE permissions)
- **7-year retention**: Compliance requirement enforced (no automated deletion before 7 years)
- **Clearance validation**: Database check function + application-level validation before link creation
- **Data protection**: Supabase RLS enforces organization boundaries and clearance levels

### Quality Standards ✅ PASS
- **Code organization**: Backend (src/api/, src/services/, src/middleware/), Frontend (src/components/, src/pages/, src/hooks/)
- **Naming conventions**: PascalCase components, kebab-case hooks, YYYYMMDDHHMMSS_description.sql migrations
- **Git workflow**: Conventional Commits (feat/fix/docs), PRs ≤300 LOC preferred, UI changes include screenshots

### Gate Evaluation Summary
- **PASS**: All applicable constitution principles satisfied
- **No violations requiring justification**
- **Ready to proceed**: Phase 0 research approved

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
│   │   ├── intake-entity-links.ts          # Route handlers for link CRUD operations
│   │   ├── ai-link-suggestions.ts          # Route handlers for AI suggestions
│   │   └── entity-search.ts                # Route handlers for entity search
│   ├── services/
│   │   ├── link.service.ts                 # Business logic for link operations
│   │   ├── ai-link-suggestion.service.ts   # AnythingLLM integration, embeddings
│   │   ├── link-audit.service.ts           # Audit log creation
│   │   ├── entity-search.service.ts        # Entity search with ranking algorithm
│   │   └── link-migration.service.ts       # Intake-to-position migration logic
│   ├── middleware/
│   │   ├── clearance-check.ts              # Clearance level validation
│   │   └── organization-check.ts           # Multi-tenancy enforcement
│   └── types/
│       ├── intake-entity-links.types.ts    # TypeScript interfaces for links
│       └── ai-suggestions.types.ts         # TypeScript interfaces for AI
└── tests/
    ├── contract/
    │   ├── intake-links-api.test.ts        # API endpoint tests (9 endpoints)
    │   └── ai-suggestions-api.test.ts      # AI suggestion endpoint tests
    ├── integration/
    │   ├── link-migration.test.ts          # Intake-to-position migration tests
    │   ├── ai-integration.test.ts          # AnythingLLM integration tests
    │   ├── bulk-operations.test.ts         # Batch link creation tests
    │   └── clearance-enforcement.test.ts   # Security validation tests
    └── performance/
        ├── batch-operations.k6.js          # <500ms for 50 links
        └── reverse-lookup.k6.js            # <2s for 1000+ intakes

frontend/
├── src/
│   ├── components/
│   │   ├── entity-links/
│   │   │   ├── EntityLinkManager.tsx       # Main container component
│   │   │   ├── EntitySearchDialog.tsx      # Search modal with ranking
│   │   │   ├── LinkCard.tsx                # Individual link display
│   │   │   ├── LinkList.tsx                # List with drag-and-drop
│   │   │   ├── AIsuggestionPanel.tsx       # AI suggestion cards
│   │   │   └── LinkTypeBadge.tsx           # Visual indicator for link type
│   │   └── ui/
│   │       └── [shadcn components]         # Dialog, Button, Badge, Card
│   ├── pages/
│   │   └── IntakeDetailPage.tsx            # Integration point for linking UI
│   ├── hooks/
│   │   ├── use-entity-links.ts             # TanStack Query for link CRUD
│   │   ├── use-ai-suggestions.ts           # TanStack Query for AI suggestions
│   │   ├── use-entity-search.ts            # TanStack Query for search
│   │   └── use-link-reorder.ts             # Drag-and-drop state management
│   └── services/
│       └── entity-links-api.ts             # API client functions
└── tests/
    ├── component/
    │   ├── EntityLinkManager.test.tsx      # Component unit tests
    │   ├── AIsuggestionPanel.test.tsx      # AI suggestion UI tests
    │   └── LinkList.test.tsx               # Drag-and-drop tests
    ├── e2e/
    │   ├── manual-linking.spec.ts          # User Story 1 (P1)
    │   ├── ai-suggestions.spec.ts          # User Story 2 (P1)
    │   ├── link-migration.spec.ts          # User Story 3 (P2)
    │   ├── reverse-lookup.spec.ts          # User Story 4 (P2)
    │   └── link-management.spec.ts         # User Story 5 (P3)
    └── accessibility/
        ├── entity-search.a11y.test.ts      # Keyboard navigation, ARIA
        └── link-cards.a11y.test.ts         # Color contrast, screen reader

supabase/
├── migrations/
│   ├── YYYYMMDDHHMMSS_create_intake_entity_links.sql        # Main table
│   ├── YYYYMMDDHHMMSS_create_link_audit_logs.sql            # Audit table
│   ├── YYYYMMDDHHMMSS_create_ai_link_suggestions.sql        # Suggestions table
│   ├── YYYYMMDDHHMMSS_create_intake_embeddings.sql          # Vector embeddings
│   ├── YYYYMMDDHHMMSS_add_intake_links_indexes.sql          # Performance indexes
│   ├── YYYYMMDDHHMMSS_add_intake_links_rls.sql              # Security policies
│   ├── YYYYMMDDHHMMSS_add_intake_links_triggers.sql         # Audit triggers
│   └── YYYYMMDDHHMMSS_add_clearance_check_function.sql      # Validation function
└── functions/
    └── [Edge Functions if needed for complex validation]
```

**Structure Decision**: Web application (Option 2) with backend (Express + TypeScript) and frontend (React 19 + Vite). Feature code organized by domain: intake-entity-links as the core module with supporting services for AI, audit, search, and migration. Testing organized by type (contract, integration, component, E2E, accessibility, performance) following Test-First Development principle.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Polymorphic associations (entity_type + entity_id) | Must link intake tickets to 11 different entity types (dossier, position, MOU, engagement, assignment, commitment, intelligence signal, organization, country, forum, working group, topic) with different validation rules per entity type | Creating 11 separate junction tables (intake_dossier_links, intake_position_links, etc.) would require 11 sets of CRUD operations, 11 sets of tests, and massive code duplication. Unified entities table (Phase 2 Global Registry) is explicitly out of scope per spec section 11. |

---

## Post-Design Constitution Re-Evaluation

**Date**: 2025-01-18
**Artifacts Reviewed**: data-model.md, contracts/intake-entity-links-api.yaml, quickstart.md

### Design Decisions Review

#### ✅ Mobile-First & Responsive Design (Principle I)
- **Evidence**: quickstart.md Step 8 documents mobile testing checklist (320px viewport, touch targets 44x44px, vertical stacking)
- **Evidence**: Component structure includes mobile-first patterns (EntitySearchDialog, LinkCard responsive)
- **Status**: PASS - Design supports mobile-first requirements

#### ✅ RTL/LTR Internationalization (Principle II)
- **Evidence**: quickstart.md Step 8.2 documents RTL testing (text alignment, icon rotation, logical properties)
- **Evidence**: Component structure mentions i18next integration and directional handling
- **Status**: PASS - Design supports RTL/LTR requirements

#### ✅ Test-First Development (Principle III)
- **Evidence**: quickstart.md Step 4 documents comprehensive test suite (contract, integration, E2E, accessibility, performance)
- **Evidence**: Test structure defined: backend/tests/ (contract, integration, performance), frontend/tests/ (component, e2e, accessibility)
- **Status**: PASS - Test infrastructure designed before implementation

#### ✅ Type Safety & Strict Mode (Principle IV)
- **Evidence**: Technical Context specifies TypeScript 5.8+ strict mode
- **Evidence**: API contracts define detailed TypeScript schemas for all requests/responses
- **Evidence**: data-model.md includes TypeScript interface references
- **Status**: PASS - Strict type safety enforced throughout

#### ✅ Security & Privacy (Principle V)
- **Evidence**: data-model.md includes comprehensive RLS policies for all tables
- **Evidence**: Clearance validation function `check_clearance_level()` documented
- **Evidence**: quickstart.md Step 9 documents security verification procedures
- **Evidence**: API contracts include authentication (BearerAuth) and authorization checks
- **Status**: PASS - Security designed into all layers

#### ✅ Performance & Scalability (Principle VI)
- **Evidence**: data-model.md includes 8 indexes (B-tree, partial unique, HNSW vector, GIN)
- **Evidence**: Redis caching strategy documented (5-minute TTL, entity metadata)
- **Evidence**: quickstart.md Step 7 documents performance benchmarks (<500ms batch, <2s reverse lookup, <3s AI)
- **Evidence**: TanStack Query optimistic updates for <50ms perceived latency
- **Status**: PASS - Performance targets designed and testable

#### ✅ Accessibility (Principle VII)
- **Evidence**: quickstart.md Step 4.2 includes accessibility test suite (axe-playwright)
- **Evidence**: Component structure mentions semantic HTML (`<dialog>`, `<button>`, `<ul>`)
- **Evidence**: Keyboard navigation documented in research.md (Space, Arrow keys, Escape, Tab)
- **Status**: PASS - Accessibility requirements designed in

#### ✅ Cross-Platform Mobile Development (Principle VIII)
- **Evidence**: Platform scope explicitly declared: "Web-only (responsive design)"
- **Evidence**: Data model designed for future mobile sync compatibility
- **Evidence**: API contracts are platform-agnostic (can be consumed by mobile later)
- **Status**: PASS - Web-only scope justified, future mobile support considered

### Final Gate Evaluation
- **All principles**: ✅ PASS
- **No new violations**: All design decisions comply with constitution
- **Complexity justified**: Polymorphic associations documented in Complexity Tracking table
- **Ready for implementation**: Phase 1 design artifacts complete and compliant

### Signatures
- **Technical Lead**: [Pending review]
- **Architecture Review**: [Pending review]
- **Security Review**: [Pending review]

