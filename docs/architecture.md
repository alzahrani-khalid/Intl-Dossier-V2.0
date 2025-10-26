# System Architecture: Unified Dossier Architecture

**Last Updated**: 2025-01-23
**Feature Branch**: `026-unified-dossier-architecture`
**Status**: Production-Ready

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Principles](#core-principles)
3. [Database Architecture](#database-architecture)
4. [Backend Services](#backend-services)
5. [Frontend Architecture](#frontend-architecture)
6. [API Contracts](#api-contracts)
7. [Performance Optimization](#performance-optimization)
8. [Security & Privacy](#security--privacy)
9. [Deployment Architecture](#deployment-architecture)
10. [Migration Strategy](#migration-strategy)

---

## Architecture Overview

The Intl-Dossier system implements a unified dossier architecture using the **Class Table Inheritance** pattern to consolidate fragmented entity models into a single, coherent system. This architectural refactor addresses critical issues identified in the legacy system:

- **Dual Entity Representation** → Single ID namespace via unified `dossiers` base table
- **Engagement Identity Crisis** → Engagements as independent entities with relationship model
- **Event/Calendar Fragmentation** → Temporal separation via `calendar_events` table
- **Relationship Pattern Incoherence** → Universal `dossier_relationships` graph model
- **Type System Fragmentation** → Standardized polymorphic references across all entities

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React 19)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Components  │  │ TanStack     │  │   i18next    │     │
│  │  (shadcn/ui) │  │ Router/Query │  │   (RTL)      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                           │ HTTPS/REST
┌─────────────────────────────────────────────────────────────┐
│              Backend (Node.js 18+ / Supabase)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Edge         │  │   Services   │  │  Middleware  │     │
│  │ Functions    │  │  (Business   │  │  (Auth/RLS)  │     │
│  │              │  │   Logic)     │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                           │ SQL/RPC
┌─────────────────────────────────────────────────────────────┐
│          Database (PostgreSQL 15+ / Supabase)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   dossiers   │  │relationships │  │   calendar   │     │
│  │   (base)     │  │   (graph)    │  │   (events)   │     │
│  └──────┬───────┘  └──────────────┘  └──────────────┘     │
│         │                                                    │
│  ┌──────┴───────────────────────────────────────────┐     │
│  │  Extension Tables (Class Table Inheritance)      │     │
│  │  • countries  • organizations  • forums          │     │
│  │  • engagements • themes  • working_groups        │     │
│  │  • persons                                        │     │
│  └──────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Principles

### 1. Single ID Namespace

All entities (countries, organizations, forums, engagements, themes, working groups, persons) share a unified ID space via the `dossiers` base table. This eliminates table-switching confusion and enables consistent polymorphic references.

**Benefits:**
- ✅ One ID that works across all queries
- ✅ Simplified API contracts (single entity endpoint)
- ✅ Consistent foreign key patterns
- ✅ Eliminates dual representation issues

### 2. Class Table Inheritance Pattern

Extension tables (e.g., `countries`, `organizations`) use their primary key as a foreign key to `dossiers.id`, implementing the Class Table Inheritance pattern.

```sql
-- Base table
CREATE TABLE dossiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('country', 'organization', ...)),
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    -- Common fields for all entity types
);

-- Extension table example
CREATE TABLE countries (
    id UUID PRIMARY KEY REFERENCES dossiers(id) ON DELETE CASCADE,
    iso_alpha2 CHAR(2) UNIQUE NOT NULL,
    iso_alpha3 CHAR(3) UNIQUE NOT NULL,
    -- Country-specific fields
);
```

**Benefits:**
- ✅ Type safety enforced at database level
- ✅ Cascade deletes prevent orphaned records
- ✅ Single source of truth for shared attributes
- ✅ Extensible for new entity types

### 3. Universal Relationship Model

The `dossier_relationships` table implements a directed graph model supporting any-to-any relationships between entities.

```sql
CREATE TABLE dossier_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES dossiers(id),
    target_id UUID NOT NULL REFERENCES dossiers(id),
    relationship_type TEXT NOT NULL,
    -- Metadata fields
);
```

**Supported Relationship Types:**
- `bilateral_relation` - Country to country
- `membership` - Country/organization to forum
- `engagement_participation` - Entity to engagement
- `parent_child` - Hierarchical relationships
- `affiliated_with` - Organization affiliations
- `works_on` - Person/organization to theme
- `assigned_to` - Staff assignments

### 4. Temporal Separation

Calendar events are separated from entity identity via the `calendar_events` table, enabling multiple temporal instances per dossier.

**Example:** G20 Summit (single dossier) can have multiple events:
- Opening ceremony
- 3 working sessions
- Closing ceremony

### 5. Polymorphic Document Linking

Positions, MOUs, intelligence briefs, and other documents can be linked to any dossier type via standardized `dossier_id` foreign keys.

---

## Database Architecture

### Schema Overview

#### Core Tables

1. **dossiers** (Base Table)
   - `id`: UUID primary key
   - `type`: Entity type enum (7 types)
   - `name`: Display name
   - `status`: Entity status
   - `sensitivity_classification`: Clearance level
   - `search_vector`: Full-text search index
   - Common metadata fields

2. **Extension Tables** (7 tables)
   - `countries`: ISO codes, geographic data
   - `organizations`: Organization codes, hierarchy
   - `forums`: Forum type, membership
   - `engagements`: Engagement details (NO dossier_id FK)
   - `themes`: Theme categories
   - `working_groups`: Parent forum references
   - `persons`: VIP tracking (title, biography, photo)

3. **dossier_relationships** (Graph Model)
   - `source_id`: Source dossier
   - `target_id`: Target dossier
   - `relationship_type`: Relationship classification
   - Bidirectional queries supported

4. **calendar_events** (Temporal Model)
   - `dossier_id`: Associated entity
   - `event_type`: meeting/deadline/milestone/session
   - `datetime_range`: PostgreSQL range type
   - `status`: planned/confirmed/cancelled/completed

5. **event_participants** (Many-to-Many)
   - Links calendar events to participant dossiers
   - Supports polymorphic participant types

### Indexes & Performance

**Critical Indexes:**
```sql
-- Dossiers table
CREATE INDEX idx_dossiers_type ON dossiers(type);
CREATE INDEX idx_dossiers_status ON dossiers(status);
CREATE INDEX idx_dossiers_search_vector ON dossiers USING GIN(search_vector);
CREATE INDEX idx_dossiers_sensitivity ON dossiers(sensitivity_classification);

-- Relationships table
CREATE INDEX idx_relationships_source ON dossier_relationships(source_id);
CREATE INDEX idx_relationships_target ON dossier_relationships(target_id);
CREATE INDEX idx_relationships_type ON dossier_relationships(relationship_type);
CREATE INDEX idx_relationships_bidirectional ON dossier_relationships(source_id, target_id);

-- Calendar events table
CREATE INDEX idx_calendar_dossier ON calendar_events(dossier_id);
CREATE INDEX idx_calendar_datetime ON calendar_events USING GIST(datetime_range);
CREATE INDEX idx_calendar_type ON calendar_events(event_type);

-- Extension tables (examples)
CREATE INDEX idx_countries_iso2 ON countries(iso_alpha2);
CREATE INDEX idx_countries_iso3 ON countries(iso_alpha3);
CREATE INDEX idx_organizations_code ON organizations(organization_code);
CREATE INDEX idx_organizations_parent ON organizations(parent_organization_id);
```

### RLS (Row Level Security) Policies

**Clearance-Based Filtering:**
```sql
-- Dossiers RLS policy
CREATE POLICY dossier_clearance_policy ON dossiers
    FOR SELECT
    USING (
        sensitivity_classification <= (
            SELECT clearance_level FROM user_profiles
            WHERE user_id = auth.uid()
        )
    );

-- Relationships inherit clearance from dossiers
CREATE POLICY relationship_clearance_policy ON dossier_relationships
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM dossiers
            WHERE id = source_id
            AND sensitivity_classification <= user_clearance()
        )
        AND EXISTS (
            SELECT 1 FROM dossiers
            WHERE id = target_id
            AND sensitivity_classification <= user_clearance()
        )
    );
```

---

## Backend Services

### Service Architecture

#### 1. DossierService (`backend/src/services/dossier-service.ts`)

**Responsibilities:**
- CRUD operations for all 7 dossier types
- Type-specific validation
- Extension data JOIN logic
- Cache management (Redis)

**Key Methods:**
```typescript
class DossierService {
  async createCountryDossier(data: CountryInput): Promise<Dossier>
  async createOrganizationDossier(data: OrganizationInput): Promise<Dossier>
  // ... 5 more type-specific create methods

  async getDossierWithExtension(id: UUID): Promise<DossierWithExtension>
  async updateDossier(id: UUID, data: Partial<DossierInput>): Promise<Dossier>
  async deleteDossier(id: UUID): Promise<void>
  async listDossiers(filters: DossierFilters): Promise<Dossier[]>
}
```

#### 2. RelationshipService (`backend/src/services/relationship-service.ts`)

**Responsibilities:**
- Relationship CRUD operations
- Bidirectional queries
- Circular dependency validation
- Self-reference prevention

**Key Methods:**
```typescript
class RelationshipService {
  async createRelationship(data: RelationshipInput): Promise<Relationship>
  async getRelationshipsForDossier(dossierId: UUID): Promise<Relationship[]>
  async getBidirectionalRelationships(dossierId: UUID): Promise<Relationship[]>
  async deleteRelationship(id: UUID): Promise<void>
}
```

#### 3. GraphService (`backend/src/services/graph-service.ts`)

**Responsibilities:**
- Recursive graph traversal
- Degree limit enforcement (max 10)
- Query complexity budgeting
- Path discovery

**Key Methods:**
```typescript
class GraphService {
  async traverseGraph(startId: UUID, depth: number): Promise<GraphResult>
  async findShortestPath(sourceId: UUID, targetId: UUID): Promise<Path>
  async getConnectedComponents(dossierId: UUID): Promise<Dossier[]>
}
```

#### 4. SearchService (`backend/src/services/unified-search-service.ts`)

**Responsibilities:**
- Full-text search across all types
- Weighted ranking algorithm
- Type filtering
- Clearance integration

**Key Methods:**
```typescript
class SearchService {
  async unifiedSearch(query: string, filters: SearchFilters): Promise<SearchResult[]>
  async searchByType(query: string, type: DossierType): Promise<SearchResult[]>
}
```

#### 5. CalendarService (`backend/src/services/calendar-service.ts`)

**Responsibilities:**
- Calendar event CRUD
- Date range queries
- Participant management
- Status tracking

**Key Methods:**
```typescript
class CalendarService {
  async createCalendarEvent(data: EventInput): Promise<CalendarEvent>
  async getEventsForDossier(dossierId: UUID): Promise<CalendarEvent[]>
  async getEventsInDateRange(start: Date, end: Date): Promise<CalendarEvent[]>
  async addEventParticipant(eventId: UUID, participantId: UUID): Promise<void>
}
```

### Edge Functions (Supabase)

**Deployed Functions:**
- `dossiers` - Dossier CRUD operations
- `relationships` - Relationship management
- `graph-traversal` - Graph queries
- `search` - Unified search
- `calendar` - Calendar operations

**Example Edge Function Structure:**
```typescript
// supabase/functions/dossiers/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { DossierService } from "@services/dossier-service.ts"

serve(async (req) => {
  const { method } = req
  const service = new DossierService()

  switch (method) {
    case "GET":
      return await service.getDossier(id)
    case "POST":
      return await service.createDossier(data)
    case "PUT":
      return await service.updateDossier(id, data)
    case "DELETE":
      return await service.deleteDossier(id)
  }
})
```

---

## Frontend Architecture

### Component Hierarchy

```
frontend/src/
├── components/
│   ├── dossier/
│   │   ├── UniversalDossierCard.tsx       # Polymorphic entity display
│   │   ├── DossierForm.tsx                # Universal create/edit form
│   │   ├── DossierTypeSelector.tsx        # Type selection UI
│   │   ├── PersonCard.tsx                 # Person-specific display
│   │   ├── DocumentLinkForm.tsx           # Document linking
│   │   └── DocumentList.tsx               # Document display
│   ├── relationships/
│   │   ├── RelationshipForm.tsx           # Create relationships
│   │   ├── RelationshipList.tsx           # Display relationships
│   │   ├── RelationshipNavigator.tsx      # Browse relationships
│   │   └── GraphVisualization.tsx         # React Flow visualization
│   └── calendar/
│       ├── UnifiedCalendar.tsx            # Calendar view
│       ├── EventCard.tsx                  # Event display
│       └── EventForm.tsx                  # Create/edit events
├── pages/
│   ├── dossiers/
│   │   ├── DossierListPage.tsx
│   │   ├── DossierDetailPage.tsx
│   │   └── DossierCreatePage.tsx
│   ├── relationships/
│   │   └── RelationshipGraphPage.tsx
│   └── calendar/
│       └── CalendarPage.tsx
├── hooks/
│   ├── useDossier.ts                      # TanStack Query hooks
│   ├── useRelationships.ts
│   ├── useCalendar.ts
│   └── useSearch.ts
└── services/
    ├── dossier-api.ts                     # API client
    ├── relationship-api.ts
    ├── calendar-api.ts
    └── search-api.ts
```

### State Management

**TanStack Query (React Query v5):**
- Server state management
- Automatic caching and invalidation
- Optimistic updates
- Background refetching

**Example Hook:**
```typescript
// frontend/src/hooks/useDossier.ts
export function useDossier(id: string) {
  return useQuery({
    queryKey: ['dossier', id],
    queryFn: () => dossierApi.getDossier(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useCreateDossier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: dossierApi.createDossier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
    },
  })
}
```

### Responsive & RTL Design

**Mobile-First Approach:**
```tsx
// Example component with mobile-first responsive design
export function UniversalDossierCard({ dossier }: Props) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <div
      className="
        container mx-auto
        px-4 sm:px-6 lg:px-8
        flex flex-col sm:flex-row
        gap-4 sm:gap-6 lg:gap-8
      "
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <h2 className="text-xl sm:text-2xl md:text-3xl text-start">
        {dossier.name}
      </h2>
      <button className="min-h-11 min-w-11 px-4 sm:px-6 ms-4">
        {t('view')}
      </button>
      <ChevronRight className={isRTL ? 'rotate-180' : ''} />
    </div>
  )
}
```

---

## API Contracts

### REST Endpoints

#### Dossier Operations
- `GET /api/dossiers` - List dossiers (with filters)
- `GET /api/dossiers/:id` - Get dossier with extension data
- `POST /api/dossiers` - Create dossier (type-specific)
- `PUT /api/dossiers/:id` - Update dossier
- `DELETE /api/dossiers/:id` - Delete dossier (cascade)

#### Relationship Operations
- `GET /api/relationships?dossierId=:id` - Get relationships for dossier
- `POST /api/relationships` - Create relationship
- `DELETE /api/relationships/:id` - Delete relationship

#### Graph Operations
- `POST /api/graph/traverse` - Traverse relationship graph
- `POST /api/graph/shortest-path` - Find shortest path

#### Search Operations
- `GET /api/search?q=:query&type=:type` - Unified search

#### Calendar Operations
- `GET /api/calendar/events?dossierId=:id` - Get events for dossier
- `GET /api/calendar/events?start=:date&end=:date` - Get events in range
- `POST /api/calendar/events` - Create calendar event
- `PUT /api/calendar/events/:id` - Update event
- `DELETE /api/calendar/events/:id` - Delete event

### GraphQL (Future Enhancement)

Currently out of scope, but the unified architecture enables future GraphQL implementation:

```graphql
type Dossier {
  id: ID!
  type: DossierType!
  name: String!
  status: Status!
  relationships: [Relationship!]!
  calendarEvents: [CalendarEvent!]!
  documents: [Document!]!
}

type Query {
  dossier(id: ID!): Dossier
  dossiers(filter: DossierFilter): [Dossier!]!
  searchDossiers(query: String!): [Dossier!]!
  traverseGraph(startId: ID!, depth: Int!): GraphResult!
}
```

---

## Performance Optimization

### Caching Strategy

**Redis Caching:**
- Frequently accessed dossiers (TTL: 5 minutes)
- Search results (TTL: 1 minute)
- Graph traversal results (TTL: 2 minutes)

**Cache Invalidation:**
- On dossier update/delete
- On relationship creation/deletion
- On calendar event changes

### Query Optimization

**N+1 Query Prevention:**
```typescript
// ❌ Bad: N+1 queries
async function getDossiersWithRelationships(ids: UUID[]) {
  const dossiers = await getDossiers(ids)

  for (const dossier of dossiers) {
    dossier.relationships = await getRelationships(dossier.id) // N queries!
  }

  return dossiers
}

// ✅ Good: Single JOIN query
async function getDossiersWithRelationships(ids: UUID[]) {
  return await db
    .from('dossiers')
    .select('*, relationships(*)')
    .in('id', ids)
}
```

### Frontend Optimization

**Code Splitting:**
```typescript
// Lazy load route components
const DossierDetailPage = lazy(() => import('./pages/dossiers/DossierDetailPage'))
const RelationshipGraphPage = lazy(() => import('./pages/relationships/RelationshipGraphPage'))
```

**Virtualization:**
```typescript
// Use react-window for large lists
import { FixedSizeList } from 'react-window'

export function DossierList({ dossiers }: Props) {
  return (
    <FixedSizeList
      height={600}
      itemCount={dossiers.length}
      itemSize={100}
    >
      {({ index, style }) => (
        <div style={style}>
          <DossierCard dossier={dossiers[index]} />
        </div>
      )}
    </FixedSizeList>
  )
}
```

### Performance Targets

- ✅ Graph traversal: <2s for 5 degrees of separation
- ✅ Unified search: <1s for 95% of queries
- ✅ Graph visualization: <3s for 50+ entities
- ✅ API response (p95): <200ms for standard queries

---

## Security & Privacy

### Authentication

**Supabase Auth:**
- JWT-based authentication
- Row Level Security (RLS) enforcement
- Clearance level integration

### Authorization

**Clearance-Based Access:**
```typescript
// User clearance levels
enum ClearanceLevel {
  PUBLIC = 0,
  INTERNAL = 1,
  CONFIDENTIAL = 2,
  SECRET = 3,
  TOP_SECRET = 4,
}

// RLS policy enforces clearance filtering
CREATE POLICY clearance_policy ON dossiers
    FOR SELECT
    USING (sensitivity_classification <= user_clearance());
```

### Data Protection

**Encryption:**
- At rest: PostgreSQL encryption
- In transit: TLS 1.3
- Secrets: Environment variables (never in git)

**Rate Limiting:**
- API endpoints: 100 req/min per user
- Search queries: 20 req/min per user
- Graph queries: 10 req/min per user

---

## Deployment Architecture

### Infrastructure

**Production Stack:**
- Frontend: Vercel / Cloudflare Pages
- Backend: Supabase (PostgreSQL 15+, Edge Functions)
- Cache: Redis Cloud / Upstash
- CDN: Cloudflare

**Staging Environment:**
- Project ID: `zkrcjzdemdmwhearhfgg`
- Region: `eu-west-2`
- Database: PostgreSQL 17.6.1.008

### CI/CD Pipeline

**GitHub Actions:**
```yaml
name: Deploy
on: [push]

jobs:
  test:
    - run: npm run test
    - run: npm run lint
    - run: npm run typecheck

  deploy:
    - run: npm run build
    - run: supabase db push
    - run: supabase functions deploy
```

---

## Migration Strategy

### Phase 1: Schema Creation
1. Create unified `dossiers` base table
2. Create 7 extension tables
3. Create `dossier_relationships` table
4. Create `calendar_events` tables

### Phase 2: Data Migration
1. Migrate existing countries → dossiers + countries
2. Migrate existing organizations → dossiers + organizations
3. Migrate existing forums → dossiers + forums
4. Migrate existing engagements → dossiers + engagements
5. Update all foreign key references

### Phase 3: Validation
1. Verify 100% data preservation
2. Validate referential integrity
3. Test RLS policies
4. Performance benchmarking

### Phase 4: Cutover
1. Deploy new schema
2. Update application code
3. Decommission legacy tables (after 30-day grace period)

---

## Appendix

### Related Documentation

- [Feature Specification](../specs/026-unified-dossier-architecture/spec.md)
- [Data Model](../specs/026-unified-dossier-architecture/data-model.md)
- [API Contracts](../specs/026-unified-dossier-architecture/contracts/)
- [Quickstart Guide](../specs/026-unified-dossier-architecture/quickstart.md)
- [Developer Guide](./DEVELOPER_GUIDE_RELATIONSHIPS.md)

### Contact & Support

**Feature Owner**: Architecture Team
**Status**: Production-Ready
**Version**: 1.0.0
