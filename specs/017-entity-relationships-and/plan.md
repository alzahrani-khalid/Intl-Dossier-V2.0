# Implementation Plan: Entity Relationships & UI/UX Redesign

**Branch**: `017-entity-relationships-and` | **Date**: 2025-10-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/017-entity-relationships-and/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → ✅ Loaded: 69 functional requirements across 12 categories
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → ✅ Web application (frontend + backend)
   → ✅ Structure Decision: Option 2 (Web)
3. Fill the Constitution Check section
   → ✅ Evaluated against Constitution v2.1.1
4. Evaluate Constitution Check section
   → ✅ No violations - fully constitutional
   → ✅ Update Progress Tracking: Initial Constitution Check PASS
5. Execute Phase 0 → research.md
   → ✅ Research complete - no NEEDS CLARIFICATION
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
   → ✅ All Phase 1 artifacts generated
7. Re-evaluate Constitution Check
   → ✅ Post-design check PASS - no new violations
   → ✅ Update Progress Tracking: Post-Design Constitution Check PASS
8. Plan Phase 2 → Task generation approach documented
9. ✅ STOP - Ready for /tasks command
```

## Summary

This feature establishes **Dossiers as the Central Hub** for all international relationship management, implementing a comprehensive entity relationship model redesign. The core architectural changes include:

- **Dossier-to-Dossier Relationships**: Many-to-many relationships between dossiers to model real-world connections (e.g., USA dossier ↔ World Bank, IMF, UN)
- **Polymorphic Document Management**: Unified document storage linked to any entity type (dossiers, engagements, positions, after actions, etc.)
- **Many-to-Many Position Linking**: Positions can relate to multiple dossiers (standalone, dossier-specific, or multi-dossier)
- **Unified Calendar System**: Aggregates engagements, standalone calendar entries, assignment deadlines, and approval deadlines
- **Work-Queue-First Navigation**: Prioritizes active work items (My Assignments, Intake Queue) over browsing

**Technical Approach**: Database schema expansion with 8 new tables (countries, organizations, forums, dossier_relationships, position_dossier_links, mous, intelligence_signals, calendar_entries, documents), hub-based UI architecture with shared components (UniversalEntityCard, RelationshipNavigator, UnifiedTimeline), and work-queue-first navigation redesign.

## Technical Context

**Language/Version**: TypeScript 5.0+ (strict mode), Node.js 18+ LTS
**Primary Dependencies**:
- Frontend: React 18+, TanStack Router v5, TanStack Query v5, Tailwind CSS, shadcn/ui, React Flow (network graphs), i18next
- Backend: Supabase (PostgreSQL 15 + RLS + Auth + Realtime + Storage), pgvector
**Storage**: PostgreSQL 15 via Supabase with:
- Reference tables: countries (193), organizations, forums
- Junction tables: dossier_relationships, position_dossier_links, mou_parties, engagement_positions
- Polymorphic: documents table with owner_type/owner_id
- Existing tables: dossiers (add reference_type/reference_id columns)
**Testing**:
- Contract tests: Vitest for API contracts
- Integration tests: Vitest + Supabase Test Helpers
- E2E tests: Playwright for user journeys
- Performance: Relationship graph render <3s for 50 nodes
**Target Platform**: Web application (desktop + mobile responsive)
**Project Type**: web (frontend + backend)
**Performance Goals**:
- Page load: <2s for dossier hub
- Search: <500ms for keyword search
- Timeline query: <1s for 100 events
- Relationship graph: <3s render for 50 nodes
**Constraints**:
- Mobile-first responsive design (320px - 2560px)
- Full Arabic RTL support with logical properties
- Touch targets ≥44x44px
- WCAG AA color contrast compliance
- Screen reader compatibility
**Scale/Scope**:
- 8 database tiers with 30+ entity types
- 10 new migration files
- 8 shared UI components
- 5 user journeys spanning 3 personas
- Hub architecture with 7-tabbed dossier view

**User Implementation Details (ultrathink)**:
This is a major architectural redesign that touches every layer of the application. The "ultrathink" directive suggests careful consideration of:
- **Breaking changes**: Migration strategy for existing dossiers data
- **N+1 query prevention**: Relationship graph queries must be optimized
- **Real-time updates**: Supabase subscriptions for timeline and relationship changes
- **Component reusability**: Shared components must work across all entity types
- **Navigation state**: Breadcrumb and context preservation across navigation
- **Search integration**: Polymorphic search must maintain performance

## Constitution Check

### ✅ 1. Bilingual Excellence
- All new tables have bilingual columns (name_en, name_ar, title_en, title_ar)
- RTL/LTR support via logical properties in all components
- i18next integration for all UI strings
- Calendar supports Arabic-Indic numerals

### ✅ 2. Type Safety
- TypeScript strict mode enforced
- Generated types from Supabase schema via `generate_typescript_types`
- Component size limit: UniversalEntityCard, RelationshipNavigator, UnifiedTimeline all <200 lines
- Explicit return types in all hooks

### ✅ 3. Security-First
- RLS policies on all new tables (countries, organizations, forums, dossier_relationships, etc.)
- Document upload virus scanning (scan_status field)
- Sensitivity levels on documents (public, internal, confidential, secret)
- Input validation for file size (100MB max), MIME types
- Rate limiting on search APIs

### ✅ 4. Data Sovereignty
- Fully self-hosted: Supabase (containerized), PostgreSQL, Supabase Storage
- No external cloud dependencies
- Documents stored in Supabase Storage (local filesystem)
- All data within Saudi infrastructure

### ✅ 5. Resilient Architecture
- Error boundaries on: DossierHub, RelationshipVisualization, CalendarView
- Graceful handling: Network graph fallback to table view if D3.js fails
- Timeout controls: 30s max for relationship graph queries
- Bilingual error messages via i18next

### ✅ 6. Accessibility
- WCAG 2.1 Level AA: Color contrast on calendar color coding (blue, green, red, yellow)
- Keyboard navigation: Tab through dossier tabs, arrow keys in kanban board
- Screen reader: ARIA labels on all interactive elements (relationship graph nodes, kanban cards)
- Tested in both Arabic and English

### ✅ 7. Container-First
- PostgreSQL via Supabase (containerized)
- Supabase Storage (containerized)
- No additional container requirements for this feature

**Initial Constitution Check**: ✅ PASS (No violations)

## Project Structure

### Documentation (this feature)
```
specs/017-entity-relationships-and/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
│   ├── api-spec.yaml    # OpenAPI specification for new endpoints
│   └── README.md        # Contract test documentation
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 2: Web application (frontend + backend)
backend/
├── src/
│   ├── models/          # NOT USED - Supabase handles schema
│   ├── services/        # New services for this feature
│   │   ├── dossier-relationship.service.ts
│   │   ├── polymorphic-document.service.ts
│   │   ├── position-linking.service.ts
│   │   └── calendar-aggregation.service.ts
│   └── api/             # Supabase Edge Functions
│       ├── dossiers-relationships/
│       ├── positions-link-dossiers/
│       ├── documents-polymorphic/
│       └── calendar-unified/
└── tests/
    ├── contract/        # API contract tests
    │   ├── dossiers-relationships.test.ts
    │   ├── positions-link-dossiers.test.ts
    │   ├── documents-polymorphic.test.ts
    │   └── calendar-unified.test.ts
    ├── integration/     # User journey tests
    │   ├── country-analyst-relationships.test.ts
    │   ├── policy-officer-multi-dossier.test.ts
    │   └── calendar-event-creation.test.ts
    └── unit/            # Service unit tests

frontend/
├── src/
│   ├── components/
│   │   ├── ui/          # shadcn/ui components
│   │   ├── shared/      # New shared components
│   │   │   ├── UniversalEntityCard.tsx
│   │   │   ├── RelationshipNavigator.tsx
│   │   │   ├── UnifiedTimeline.tsx
│   │   │   ├── AssignmentContextWidget.tsx
│   │   │   ├── DossierContextBanner.tsx
│   │   │   ├── ContextBreadcrumb.tsx
│   │   │   └── PolymorphicEntityViewer.tsx
│   │   ├── dossiers/    # Dossier hub components
│   │   │   ├── DossierHub.tsx
│   │   │   ├── RelationshipsTab.tsx
│   │   │   ├── EngagementsTab.tsx
│   │   │   ├── PositionsTab.tsx
│   │   │   └── TimelineTab.tsx
│   │   └── calendar/    # Calendar components
│   │       ├── CalendarView.tsx
│   │       ├── EventCreationModal.tsx
│   │       └── CalendarEventCard.tsx
│   ├── pages/
│   │   ├── dossiers/
│   │   │   └── [id].tsx # Dossier hub page
│   │   └── my-work/
│   │       └── assignments.tsx # Updated kanban
│   ├── hooks/           # New hooks
│   │   ├── useDossierRelationships.ts
│   │   ├── usePositionDossierLinks.ts
│   │   ├── usePolymorphicDocuments.ts
│   │   ├── useUnifiedCalendar.ts
│   │   └── useNavigationContext.ts
│   └── services/
│       └── realtime-subscriptions.ts # Supabase Realtime
└── tests/
    ├── e2e/             # Playwright tests
    │   ├── country-analyst-journey.spec.ts
    │   ├── policy-officer-journey.spec.ts
    │   └── calendar-creation-flow.spec.ts
    └── unit/            # Component tests
        └── shared-components.test.tsx
```

**Structure Decision**: Option 2 (Web application with frontend + backend)

## Phase 0: Outline & Research

### Research Areas

Since the source material is a comprehensive design document (ENTITY_RELATIONSHIPS_AND_UX_REDESIGN.md), most design decisions are already made. Research focuses on implementation best practices:

1. **Polymorphic Relationships in PostgreSQL**
   - Best practices for owner_type/owner_id pattern
   - Performance implications (no foreign key enforcement)
   - Indexing strategy for polymorphic queries

2. **React Flow for Network Graphs**
   - Component library evaluation (React Flow vs vis.js vs D3.js)
   - Performance optimization for 50+ nodes
   - Accessibility support in graph visualizations

3. **Supabase Realtime for Timeline Updates**
   - Subscription patterns for polymorphic entities
   - Performance tuning for high-frequency updates
   - Conflict resolution for optimistic UI updates

4. **Multi-Table Search Performance**
   - Optimizing searches across 6+ entity types
   - Materialized views vs runtime unions
   - pg_tsvector indexing strategy for bilingual search

5. **Drag-and-Drop in RTL Layouts**
   - @dnd-kit RTL compatibility
   - Touch gesture support for mobile
   - Accessibility requirements for drag-drop

### Research Output

See [research.md](./research.md) for detailed findings on each area.

## Phase 1: Design & Contracts

### 1. Data Model (`data-model.md`)

**New Tables** (10 migrations):

1. **countries** - Reference table for 193 countries
2. **organizations** - International organizations reference
3. **forums** - International forums/summits reference
4. **dossier_relationships** - Junction table for dossier-to-dossier links
5. **position_dossier_links** - Junction table for position-to-dossier many-to-many
6. **mous** - MoU work products linked to dossiers
7. **mou_parties** - Junction table for MoU signatories
8. **intelligence_signals** - Knowledge items linked to dossiers
9. **documents** - Polymorphic document storage
10. **calendar_entries** - Standalone calendar events

**Table Modifications**:
- **dossiers**: Add `reference_type`, `reference_id` columns

**Indexes** (27 total):
- Polymorphic indexes: `(owner_type, owner_id)` on documents
- Junction indexes: `(position_id)`, `(dossier_id)` on position_dossier_links
- Relationship indexes: `(parent_dossier_id)`, `(child_dossier_id)` on dossier_relationships
- Search indexes: GIN on search_vector, tags arrays
- Performance indexes: Partial indexes on is_latest, status filters

**RLS Policies** (40+ policies):
- countries, organizations, forums: Read-only for authenticated users
- dossier_relationships: Create/read/update based on dossier ownership
- position_dossier_links: Based on position RLS policies
- documents: Polymorphic RLS based on owner entity permissions
- calendar_entries: Based on organizer/attendee relationship

### 2. API Contracts (`contracts/api-spec.yaml`)

**Dossier Relationships**:
```yaml
GET /api/dossiers/:id/relationships
  Returns: Array of related dossiers with relationship metadata

POST /api/dossiers/:id/relationships
  Body: { child_dossier_id, relationship_type, relationship_strength }
  Returns: Created relationship

DELETE /api/dossiers/:parentId/relationships/:childId
  Returns: 204 No Content
```

**Position Linking**:
```yaml
GET /api/positions/:id/dossiers
  Returns: Array of linked dossiers

POST /api/positions/:id/dossiers
  Body: { dossier_ids: UUID[], link_type: 'primary'|'related'|'reference' }
  Returns: Created links (bulk)

DELETE /api/positions/:id/dossiers/:dossierId
  Returns: 204 No Content
```

**Polymorphic Documents**:
```yaml
GET /api/documents?owner_type=:type&owner_id=:id
  Returns: Array of documents for entity

POST /api/documents
  Body: { owner_type, owner_id, file, document_type, sensitivity_level }
  Returns: Created document with storage_path

DELETE /api/documents/:id
  Returns: 204 No Content (soft delete)
```

**Unified Calendar**:
```yaml
GET /api/calendar?start=:date&end=:date&filters[]=:type
  Returns: Array of events (engagements + calendar_entries + deadlines)

POST /api/calendar/entries
  Body: { title_en, title_ar, event_date, entry_type, dossier_id? }
  Returns: Created calendar entry

PATCH /api/calendar/:type/:id
  Body: { event_date }
  Returns: Updated event (reschedule)
```

### 3. Contract Tests

**Generated Test Files** (10 contract tests):
```
backend/tests/contract/
├── dossiers-relationships-get.test.ts
├── dossiers-relationships-create.test.ts
├── dossiers-relationships-delete.test.ts
├── positions-link-dossiers-get.test.ts
├── positions-link-dossiers-create.test.ts
├── positions-link-dossiers-delete.test.ts
├── documents-polymorphic-get.test.ts
├── documents-polymorphic-create.test.ts
├── calendar-unified-get.test.ts
└── calendar-entries-create.test.ts
```

Each test verifies:
- Request schema validation
- Response schema validation
- HTTP status codes
- Error responses (400, 401, 403, 404)
- Bilingual field support

### 4. Integration Tests

**User Journey Tests** (5 integration tests):
```
backend/tests/integration/
├── country-analyst-relationships.test.ts      # Journey 1
├── intake-officer-processing.test.ts          # Journey 2
├── policy-officer-multi-dossier.test.ts       # Journey 3
├── staff-member-assignments.test.ts           # Journey 4
└── calendar-event-creation.test.ts            # Journey 5
```

### 5. Quickstart Validation (`quickstart.md`)

**Test Scenario**: Country Analyst managing Saudi Arabia dossier relationships

**Steps**:
1. Navigate to Saudi Arabia dossier
2. View Relationships tab → Verify network graph shows World Bank, IMF, G20, OPEC, WTO
3. Click World Bank node → Navigate to World Bank dossier
4. View shared engagements → Verify meetings involving both dossiers
5. Navigate back to Saudi Arabia dossier (breadcrumb or back button)
6. Verify timeline shows relationship creation event

**Expected Results**:
- ✅ Relationships tab loads network graph in <3s
- ✅ Graph shows 5 connected dossiers with relationship types
- ✅ Click navigation works (2 clicks to related dossier)
- ✅ Shared engagements query returns results in <1s
- ✅ Breadcrumb shows: Dossiers > Countries > Saudi Arabia > Relationships

### 6. Agent Context Update (`CLAUDE.md`)

Incremental update to add new technologies and recent changes:

**New Technologies**:
- React Flow: Network graph visualization for dossier relationships
- @dnd-kit/core: Drag-and-drop for calendar rescheduling (already exists for kanban)
- Polymorphic patterns: owner_type/owner_id for documents table

**Recent Changes**:
- 2025-10-07: ✅ Entity Relationships & UI/UX Redesign (017-entity-relationships-and)
  - ✅ Database: 10 new tables, 27 indexes, 40+ RLS policies
  - ✅ Backend: 4 Supabase Edge Function groups (relationships, linking, documents, calendar)
  - ✅ Frontend: 8 shared components, hub architecture, work-queue-first navigation
  - ✅ Features: Dossier-to-dossier relationships, polymorphic documents, many-to-many position linking
  - 📊 Status: Ready for task generation (/tasks command)

## Phase 2: Task Planning Approach

**Task Generation Strategy**:

1. **Load Template**: Use `.specify/templates/tasks-template.md` as base structure

2. **Generate from Design Artifacts**:
   - **From data-model.md**:
     - 10 migration tasks (one per table)
     - Index creation tasks (grouped by table)
     - RLS policy tasks (grouped by table)

   - **From contracts/api-spec.yaml**:
     - 10 contract test tasks (one per endpoint)
     - 4 Edge Function implementation tasks (grouped by domain)

   - **From quickstart.md**:
     - 5 integration test tasks (one per user journey)

   - **Component Implementation**:
     - 8 shared component tasks (UniversalEntityCard, RelationshipNavigator, etc.)
     - 5 dossier tab component tasks
     - 3 calendar component tasks
     - 7 hook implementation tasks

3. **Ordering Strategy** (TDD order with dependencies):
   ```
   Phase A: Database Foundation [P = Parallel]
   ├─ Task 1: [P] Create countries reference table migration
   ├─ Task 2: [P] Create organizations reference table migration
   ├─ Task 3: [P] Create forums reference table migration
   ├─ Task 4: [P] Create dossier_relationships junction table
   ├─ Task 5: [P] Create position_dossier_links junction table
   ├─ Task 6: [P] Create mous + mou_parties tables
   ├─ Task 7: [P] Create intelligence_signals table
   ├─ Task 8: [P] Create documents polymorphic table
   ├─ Task 9: [P] Create calendar_entries table
   ├─ Task 10: Modify dossiers table (add reference columns)
   ├─ Task 11-13: Create indexes (grouped by performance impact)
   └─ Task 14-20: Create RLS policies (grouped by table)

   Phase B: Contract Tests (Tests Before Implementation)
   ├─ Task 21: [P] Contract test: GET /dossiers/:id/relationships
   ├─ Task 22: [P] Contract test: POST /dossiers/:id/relationships
   ├─ Task 23: [P] Contract test: DELETE /dossiers/.../relationships/...
   ├─ Task 24: [P] Contract test: GET /positions/:id/dossiers
   ├─ Task 25: [P] Contract test: POST /positions/:id/dossiers
   ├─ Task 26: [P] Contract test: GET /documents (polymorphic)
   ├─ Task 27: [P] Contract test: POST /documents
   ├─ Task 28: [P] Contract test: GET /calendar (unified)
   └─ Task 29: [P] Contract test: POST /calendar/entries

   Phase C: Backend Services & Edge Functions
   ├─ Task 30: Implement dossier-relationship.service.ts
   ├─ Task 31: Implement Edge Functions: dossiers-relationships/*
   ├─ Task 32: Implement position-linking.service.ts
   ├─ Task 33: Implement Edge Functions: positions-link-dossiers/*
   ├─ Task 34: Implement polymorphic-document.service.ts
   ├─ Task 35: Implement Edge Functions: documents-polymorphic/*
   ├─ Task 36: Implement calendar-aggregation.service.ts
   └─ Task 37: Implement Edge Functions: calendar-unified/*

   Phase D: Shared Components (Reusable UI)
   ├─ Task 38: [P] Build UniversalEntityCard component
   ├─ Task 39: [P] Build ContextBreadcrumb component
   ├─ Task 40: Build RelationshipNavigator (React Flow)
   ├─ Task 41: [P] Build UnifiedTimeline component
   ├─ Task 42: [P] Build AssignmentContextWidget component
   ├─ Task 43: [P] Build DossierContextBanner component
   ├─ Task 44: [P] Build PolymorphicEntityViewer component
   └─ Task 45: [P] Build DocumentUploader component

   Phase E: Dossier Hub Pages
   ├─ Task 46: Build DossierHub layout with tabs
   ├─ Task 47: [P] Build RelationshipsTab (uses RelationshipNavigator)
   ├─ Task 48: [P] Build EngagementsTab
   ├─ Task 49: [P] Build PositionsTab
   ├─ Task 50: [P] Build TimelineTab (uses UnifiedTimeline)
   └─ Task 51: Update dossier route: /dossiers/:type/:id

   Phase F: Calendar System
   ├─ Task 52: Build CalendarView component
   ├─ Task 53: Build EventCreationModal (engagement vs entry flow)
   ├─ Task 54: Build CalendarEventCard
   ├─ Task 55: Implement useUnifiedCalendar hook
   └─ Task 56: Create calendar route: /calendar

   Phase G: Navigation Redesign
   ├─ Task 57: Update Sidebar with work-queue-first structure
   ├─ Task 58: Add SLA countdown badges to nav items
   ├─ Task 59: Update My Assignments page with DossierContextBanner
   ├─ Task 60: Implement global search with relationship context
   └─ Task 61: Add Cmd+K quick-switcher

   Phase H: Hooks & Services
   ├─ Task 62: [P] Implement useDossierRelationships hook
   ├─ Task 63: [P] Implement usePositionDossierLinks hook
   ├─ Task 64: [P] Implement usePolymorphicDocuments hook
   ├─ Task 65: [P] Implement useNavigationContext hook
   └─ Task 66: Set up Realtime subscriptions for timeline

   Phase I: Integration Tests (User Journeys)
   ├─ Task 67: [P] Test: Country analyst managing relationships
   ├─ Task 68: [P] Test: Intake officer processing requests
   ├─ Task 69: [P] Test: Policy officer multi-dossier positions
   ├─ Task 70: [P] Test: Staff member assignments with context
   └─ Task 71: [P] Test: Calendar event creation flow

   Phase J: E2E Tests & Validation
   ├─ Task 72: [P] E2E test: Country analyst journey (Playwright)
   ├─ Task 73: [P] E2E test: Policy officer journey (Playwright)
   ├─ Task 74: [P] E2E test: Calendar creation flow (Playwright)
   ├─ Task 75: Execute quickstart.md validation
   ├─ Task 76: Performance validation (graph render <3s)
   └─ Task 77: Accessibility audit (WCAG AA compliance)
   ```

4. **Parallelization Markers**:
   - [P] marks tasks that can run in parallel
   - Database migrations (Tasks 1-9): All parallel
   - Contract tests (Tasks 21-29): All parallel
   - Shared components (Tasks 38-45): Mostly parallel (except Task 40 depends on research)
   - Integration tests (Tasks 67-71): All parallel

**Estimated Output**: 77 numbered, ordered tasks in tasks.md

**Dependencies**:
- Phase B depends on Phase A (database must exist for tests)
- Phase C depends on Phase B (tests before implementation)
- Phase E depends on Phase D (shared components before hub pages)
- Phase F depends on Phase D (shared components)
- Phase G depends on Phase E (navigation uses hub architecture)
- Phase I depends on Phase C, E, F (backend + frontend ready)
- Phase J depends on Phase I (integration tests pass first)

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

**Phase 3**: Task execution (/tasks command creates tasks.md with 77 tasks)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

**No violations** - This feature fully complies with all constitutional principles:

- ✅ No additional projects required (uses existing backend/frontend structure)
- ✅ No architectural patterns beyond existing conventions
- ✅ No new infrastructure dependencies
- ✅ All security, accessibility, and resilience requirements met
- ✅ Bilingual support maintained throughout

## Progress Tracking

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved (none existed - comprehensive design doc)
- [x] Complexity deviations documented (none required)

---
*Based on Constitution v2.1.1 - See `.specify/memory/constitution.md`*
