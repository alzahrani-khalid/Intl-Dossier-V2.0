# Implementation Plan: Unified Dossier Architecture

**Branch**: `026-unified-dossier-architecture` | **Date**: 2025-01-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/026-unified-dossier-architecture/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Comprehensive refactor to unified dossier architecture using Class Table Inheritance pattern. Consolidates fragmented entity model (countries, organizations, forums, engagements) into universal dossiers base table with type-specific extensions. Implements universal relationship model for graph queries, separates temporal events from entity identity via calendar_events table, and fixes engagement identity crisis (engagements should BE dossiers, not reference them). Supports 7 dossier types: country, organization, forum, engagement, theme, working_group, person. Enables graph traversal, unified search, and consistent polymorphic linking patterns. Critical architectural foundation that eliminates dual entity representation and establishes single ID namespace across the entire system.

## Technical Context

**Language/Version**: TypeScript 5.8+ (strict mode), Node.js 18+ LTS (backend), React 19 (frontend)

**Primary Dependencies**:
- Frontend: React 19, TanStack Router v5, TanStack Query v5, shadcn/ui, Tailwind CSS, i18next (internationalization), React Flow (graph visualization), @dnd-kit/core (drag-and-drop)
- Backend: Node.js 18+ LTS, Supabase (PostgreSQL 15+, Auth, RLS, Realtime, Storage), Redis 7.x (caching)
- Database: PostgreSQL 15+ with extensions (pg_trgm for fuzzy search, tsvector for full-text search, pgvector for potential AI features)
- Build: Vite (frontend bundler), pnpm (package manager), Turborepo (monorepo orchestration)

**Storage**:
- Primary: PostgreSQL 15+ via Supabase (all entity data, relationships, calendar events)
- Cache: Redis 7.x for frequently accessed data with TTL management
- File Storage: Supabase Storage for documents, photos, attachments

**Testing**:
- Unit/Integration: Vitest for backend services and frontend hooks
- E2E: Playwright for critical user journeys (entity CRUD, relationship creation, search, calendar)
- Contract: OpenAPI/JSON schema validation for Edge Functions
- Performance: k6 for load testing graph queries and search operations

**Target Platform**: Web application (React 19 + Vite frontend, Node.js + Supabase backend)

**Project Type**: Web application with frontend/backend structure

**Performance Goals**:
- Graph traversal queries: <2s for networks up to 5 degrees of separation (SC-003)
- Unified search: <1s for 95% of queries with 10,000+ entities (SC-004)
- Graph visualization: <3s to load networks of 50+ entities (SC-012)
- Query complexity reduction: 60% fewer queries vs current fragmented model (SC-002)
- API response latency: <200ms p95 for standard entity queries

**Constraints**:
- Zero data loss: 100% data preservation during migration from fragmented to unified model (SC-007)
- Type safety: 0 TypeScript errors after schema regeneration, 100% type coverage for dossier operations (SC-008)
- Referential integrity: 0 orphaned records or broken foreign keys after any operation (SC-011)
- Clearance enforcement: 100% RLS coverage preventing unauthorized access across all query paths (constraint #5)
- Cascade correctness: DELETE operations must cascade properly without orphaned extension rows (constraint #7)
- Backward compatibility: Existing APIs must continue working via views/adapters during transition (constraint #9)

**Scale/Scope**:
- Entity volume: 10,000+ dossiers across 7 types (country, organization, forum, engagement, theme, working_group, person)
- Relationship complexity: Multi-degree graph traversal with bidirectional queries
- Search scope: Full-text search across all entity types with weighted ranking
- Migration scope: All existing countries, organizations, forums, engagements tables + polymorphic references
- Database changes: 7 extension tables, 1 universal relationships table, 2 calendar tables, multiple indexes, updated RLS policies

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Mobile-First & Responsive Design (NON-NEGOTIABLE)
**Status**: ✅ COMPLIANT
**Applies To**: All UI components (graph visualization, unified entity card, search UI, calendar views, relationship navigator)
**Requirements**:
- Components must start with base styles (mobile 320-640px)
- Progressive enhancement using Tailwind breakpoints: base → sm: → md: → lg: → xl: → 2xl:
- Touch targets minimum 44x44px, adequate spacing (8px min gap)
**Validation**: Responsive design audit checklist before merge

### Principle II: RTL/LTR Internationalization (NON-NEGOTIABLE)
**Status**: ✅ COMPLIANT
**Applies To**: All UI components
**Requirements**:
- Use logical properties exclusively: ms-*, me-*, ps-*, pe-*, text-start, text-end, start-*, end-*
- Prohibit physical directional properties: ml-*, mr-*, pl-*, pr-*, text-left, text-right
- Detect language direction via i18n.language === 'ar'
- Flip directional icons with rotate-180 for RTL
**Validation**: Code review must verify logical properties, test Arabic rendering

### Principle III: Test-First Development (MANDATORY)
**Status**: ⚠️ TO BE ENFORCED
**Applies To**: All new functionality (entity CRUD, relationship queries, graph traversal, search, calendar)
**Requirements**:
- Tests must be written FIRST and verified to FAIL before implementation
- Red-Green-Refactor cycle strictly enforced
- Contract tests for Edge Functions (relationship APIs, search APIs, calendar APIs)
- Integration tests for user journeys (create dossier, add relationships, search entities, view calendar)
- E2E tests for critical flows (entity creation across types, graph visualization, unified search)
**Validation**: Git history must show test files committed before implementation files

### Principle IV: Type Safety & Strict Mode (NON-NEGOTIABLE)
**Status**: ✅ COMPLIANT
**Applies To**: All TypeScript code (frontend components, backend Edge Functions, type definitions)
**Requirements**:
- TypeScript strict mode enabled project-wide
- All variables, functions, React props must have explicit types
- No `any` types (except wrapped third-party library interfaces)
- TypeScript regeneration from new schema (FR-030, SC-008)
- 0 TypeScript errors after schema changes
**Validation**: TypeScript compiler must pass with zero errors, ESLint flags any/missing types

### Principle V: Security & Privacy by Default
**Status**: ✅ COMPLIANT
**Applies To**: All database tables (dossiers, extension tables, relationships, calendar_events), all API routes
**Requirements**:
- RLS policies must be updated for unified dossier model (in scope per line 252)
- Clearance level filtering must work across all query paths (constraint #5, FR-015)
- Authentication via Supabase Auth with JWT validation
- Environment variables for all configuration (no secrets in git)
- Rate limiting on all API routes
**Validation**: Database migrations must include RLS policies, security scanning in CI/CD

### Principle VI: Performance & Scalability
**Status**: ✅ COMPLIANT
**Applies To**: Database queries (graph traversal, search, entity lookup), React components (graph viz, entity cards), API routes
**Requirements**:
- Indexes on dossiers.type, search_vector, relationship queries, calendar datetime ranges (in scope per line 253)
- Avoid N+1 query patterns via proper JOINs
- Redis caching for frequently accessed data
- React lazy loading for route-based code splitting
- Virtualization for large entity lists
- Performance targets: <2s graph queries, <1s search, <3s graph viz, <200ms API p95
**Validation**: Performance testing with k6, query analysis in code reviews

### Principle VII: Accessibility (WCAG AA Compliance)
**Status**: ✅ COMPLIANT
**Applies To**: All UI components
**Requirements**:
- Semantic HTML, ARIA labels where necessary
- Color contrast 4.5:1 ratio minimum
- Keyboard accessibility for all interactive elements
- Proper form labels and error messages
**Validation**: axe-playwright tests must pass, keyboard navigation in E2E tests

### Principle VIII: Cross-Platform Mobile Development (MANDATORY)
**Status**: ⭕ OUT OF SCOPE
**Platform Declaration**: Web-only
**Rationale**: Spec line 273 explicitly states "Mobile app updates - out of scope" for this feature. Focus is on web application architecture refactor. Mobile platform will inherit unified dossier model in future iteration.

---

### Gate Evaluation: ✅ PASS
All applicable principles are compliant or have enforcement plans. No violations requiring justification. Feature is ready to proceed to Phase 0 research.

## Project Structure

### Documentation (this feature)

```
specs/026-unified-dossier-architecture/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── dossier-crud.yaml       # Entity CRUD operations
│   ├── relationships.yaml      # Relationship management APIs
│   ├── search.yaml             # Unified search APIs
│   ├── calendar.yaml           # Calendar event APIs
│   └── graph-traversal.yaml    # Graph query APIs
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
backend/
├── src/
│   ├── services/
│   │   ├── dossier-service.ts        # Unified dossier CRUD operations
│   │   ├── relationship-service.ts   # Graph relationship management
│   │   ├── search-service.ts         # Full-text search across all types
│   │   └── calendar-service.ts       # Calendar event operations
│   └── types/
│       └── database.types.ts         # Generated from Supabase schema
└── tests/
    ├── contract/
    │   ├── dossier-crud.test.ts
    │   ├── relationships.test.ts
    │   ├── search.test.ts
    │   └── calendar.test.ts
    ├── integration/
    │   ├── graph-traversal.test.ts
    │   ├── unified-search.test.ts
    │   └── migration.test.ts
    └── unit/
        ├── dossier-service.test.ts
        ├── relationship-service.test.ts
        └── search-service.test.ts

frontend/
├── src/
│   ├── components/
│   │   ├── dossier/
│   │   │   ├── UniversalDossierCard.tsx      # Polymorphic entity card
│   │   │   ├── DossierForm.tsx               # Universal create/edit form
│   │   │   └── DossierTypeSelector.tsx       # Type selection UI
│   │   ├── relationships/
│   │   │   ├── RelationshipNavigator.tsx     # Bidirectional relationship browser
│   │   │   ├── GraphVisualization.tsx        # React Flow network graph
│   │   │   └── RelationshipForm.tsx          # Create/edit relationships
│   │   ├── search/
│   │   │   ├── UnifiedSearchBar.tsx          # Search across all types
│   │   │   └── SearchResultsList.tsx         # Ranked results display
│   │   ├── calendar/
│   │   │   ├── UnifiedCalendar.tsx           # Calendar view for all events
│   │   │   └── EventCard.tsx                 # Individual event display
│   │   └── ui/                               # shadcn/ui components (28 existing)
│   ├── pages/
│   │   ├── dossiers/
│   │   │   ├── DossierListPage.tsx           # All dossiers with filters
│   │   │   ├── DossierDetailPage.tsx         # Single dossier view
│   │   │   └── DossierCreatePage.tsx         # Create new dossier
│   │   ├── relationships/
│   │   │   └── RelationshipGraphPage.tsx     # Graph visualization page
│   │   └── calendar/
│   │       └── CalendarPage.tsx              # Calendar view page
│   ├── hooks/
│   │   ├── useDossier.ts                     # Dossier CRUD hooks
│   │   ├── useRelationships.ts               # Relationship query hooks
│   │   ├── useUnifiedSearch.ts               # Search hooks
│   │   └── useCalendar.ts                    # Calendar hooks
│   └── services/
│       ├── dossier-api.ts                    # API client for dossiers
│       ├── relationship-api.ts               # API client for relationships
│       ├── search-api.ts                     # API client for search
│       └── calendar-api.ts                   # API client for calendar
└── tests/
    ├── e2e/
    │   ├── dossier-crud.spec.ts              # Entity CRUD flows
    │   ├── relationship-creation.spec.ts     # Relationship workflows
    │   ├── unified-search.spec.ts            # Search user journeys
    │   └── calendar-events.spec.ts           # Calendar workflows
    └── component/
        ├── UniversalDossierCard.test.tsx
        ├── RelationshipNavigator.test.tsx
        └── UnifiedSearchBar.test.tsx

supabase/
├── migrations/
│   ├── YYYYMMDDHHMMSS_create_unified_dossiers.sql        # Universal dossiers table
│   ├── YYYYMMDDHHMMSS_create_extension_tables.sql        # 7 type-specific tables
│   ├── YYYYMMDDHHMMSS_create_relationships.sql           # dossier_relationships table
│   ├── YYYYMMDDHHMMSS_create_calendar.sql                # calendar_events + participants
│   ├── YYYYMMDDHHMMSS_update_rls_policies.sql            # RLS for unified model
│   ├── YYYYMMDDHHMMSS_create_indexes.sql                 # Performance indexes
│   ├── YYYYMMDDHHMMSS_migrate_data.sql                   # Data migration from fragmented model
│   └── YYYYMMDDHHMMSS_update_polymorphic_refs.sql        # Fix entity_type references
└── seed.sql                                               # Seed data for 7 dossier types

tests/
├── performance/
│   ├── graph-queries.k6.js                   # Load test graph traversal
│   ├── search.k6.js                          # Load test unified search
│   └── entity-lookups.k6.js                  # Load test entity queries
└── accessibility/
    └── axe-tests.spec.ts                     # WCAG AA compliance tests
```

**Structure Decision**: Web application with frontend/backend separation. Backend uses Supabase Edge Functions (serverless) + PostgreSQL for data layer. Frontend is React 19 SPA with TanStack Router for routing and TanStack Query for data fetching. Database migrations in supabase/ directory manage schema evolution. Tests are organized by type (contract/integration/unit for backend, e2e/component for frontend, performance/accessibility as separate concerns). This structure supports the unified dossier architecture refactor while maintaining existing patterns.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

No violations identified. All applicable constitution principles are compliant or have enforcement plans. Feature design aligns with project governance standards.

