# Architectural Integrity Assessment: Intl-DossierV2.0
**Date:** 2025-01-22
**Status:** Critical Issues Identified - Refactor Recommended
**Architectural Integrity Score:** 5.5/10

## Executive Summary

After comprehensive analysis of the Intl-DossierV2.0 codebase, this assessment confirms that the current entity model has significant structural issues that contradict the natural mental model of "everything can be a dossier." The system suffers from dual entity representations, engagement identity confusion, event/calendar fragmentation, and inconsistent relationship patterns.

**Key Finding:** The user's intuition that "anything can be a dossier" is architecturally correct. The current implementation has strayed from this unified model due to incremental development without a cohesive vision.

---

## Critical Issues Identified

### Issue #1: Dual Entity Representation (SEVERITY: HIGH)

**Problem:** The system maintains BOTH:
- `dossiers` table with `type IN ('country', 'organization', 'forum', 'theme')`
- Separate `countries`, `organizations`, `forums` tables with independent IDs

**Impact:**
- Referential ambiguity: Is Saudi Arabia referenced by `countries.id` or `dossiers.id`?
- User confusion about data location
- Code duplication across schemas
- Inconsistent linking patterns throughout the application

**Example:**
```sql
-- Current confusion
intake_tickets.dossier_id UUID  -- Which dossier? What if entity is in countries table?

-- intake_entity_links supports overlapping types
entity_type: 'country' | 'organization' | 'dossier'  -- These concepts overlap!
```

---

### Issue #2: Engagement Identity Crisis (SEVERITY: HIGH)

**Problem:** Engagements are modeled as "referencing" dossiers when they should BE dossiers themselves.

**Current (Incorrect):**
```sql
engagements (
  id UUID,
  dossier_id UUID REFERENCES dossiers(id)  -- "this engagement is ABOUT this dossier"
)
```

**Should Be:**
```sql
engagements (
  id UUID PRIMARY KEY REFERENCES dossiers(id) ON DELETE CASCADE
)
-- Then use dossier_relationships to link engagement to related entities
```

**Impact:**
- "2025 China Trade Talks" should BE a dossier that RELATES to China (country dossier) and Trade Ministry (org dossier)
- Current model awkwardly makes engagement "belong to" one dossier
- Multi-party engagements cannot be modeled properly
- Breaks graph traversal logic

---

### Issue #3: Event/Engagement/Calendar Fragmentation (SEVERITY: MEDIUM)

**Problem:** Three separate, inconsistent temporal models:

1. `events` table → `forums` extends this
2. `engagements` table → Separate, doesn't extend events
3. No unified `calendar_events` table

**Impact:**
- Cannot query "all events happening this month"
- Forums and engagements use different schemas for the same concept
- No unified calendar functionality
- User confusion about event types

**Correct Model:**
- **Dossiers** = The THING (G20 Summit, Trade Talks)
- **Calendar Events** = WHEN it happens (temporal instances)
- Clear separation of identity from temporal occurrence

---

### Issue #4: Inconsistent Relationship Modeling (SEVERITY: MEDIUM)

**Current Mix:**
- Direct FKs: `organization.country_id → countries` (structural - appropriate)
- Direct FKs: `engagement.dossier_id → dossiers` (relational - wrong pattern)
- Polymorphic links: `intake_entity_links` (correct pattern, but limited scope)
- No general relationship model for dossier-to-dossier connections

**Missing Capabilities:**
- "Saudi Arabia has bilateral trade agreement with China" → No table for this
- "UNDP is member of G20 Summit" → No relationship representation
- "Working Group A partners with Working Group B" → Cannot model partnerships

---

### Issue #5: Type System Incoherence (SEVERITY: MEDIUM)

**Problem:** Types defined at different abstraction levels with overlapping values:

```typescript
// Entity type (what it IS)
dossier.type: 'country' | 'organization' | 'forum' | 'theme'

// Engagement category (subtype) - OVERLAPS WITH EVENTS!
engagement_type: 'meeting' | 'consultation' | 'conference' | 'workshop'

// Event type - ALSO OVERLAPS!
event_type: 'conference' | 'workshop'

// Organization subtype (category within type)
org_type: 'government' | 'ngo' | 'private'
```

**Impact:** Confusion about semantic meaning of "conference" - is it an event type, engagement type, or something else?

---

### Issue #6: No General Relationship Model (SEVERITY: MEDIUM)

**Problem:** The system lacks a universal table for modeling relationships between dossiers.

**Missing Use Cases:**
- Country-to-country bilateral relations
- Organization partnerships
- Forum participation
- Working group memberships
- Thematic associations
- Hierarchical relationships beyond parent_org_id

**Current Workarounds:**
- Structural FKs (organization.parent_org_id) - only works for hierarchies
- engagement.dossier_id - wrong pattern, creates identity confusion
- No solution for many-to-many relationships

---

## What's Working Well

1. **Intake Entity Linking (Spec 024)** - Demonstrates correct understanding of polymorphic patterns
2. **Unified Tasks (Spec 025)** - Excellent consolidation of assignments/tasks confusion
3. **Bilingual Support** - Consistent ar/en fields throughout
4. **Security Model** - RLS policies and clearance levels well-implemented
5. **Modern Stack** - Supabase, PostgreSQL, React 19, TypeScript 5.8+ with proper tooling

---

## Entity Definitions (Clarified)

### Entities That SHOULD BE Dossiers (Subjects of Interest)

| Entity | Type | Description | Current Status |
|--------|------|-------------|----------------|
| **Country** | `dossier.type='country'` | Nation states (Saudi Arabia, USA) | ❌ Dual representation |
| **Organization** | `dossier.type='organization'` | Entities (UN, RedCross, ministries) | ❌ Dual representation |
| **Forum** | `dossier.type='forum'` | Multi-session conferences (G20, COP) | ❌ Extends events, not dossiers |
| **Engagement** | `dossier.type='engagement'` | Diplomatic events (meetings, consultations) | ❌ References dossiers instead of being one |
| **Theme** | `dossier.type='theme'` | Policy areas (climate, trade, education) | ⚠️ In dossiers but underutilized |
| **Working Group** | `dossier.type='working_group'` | Task forces, committees, joint bodies | ❌ Not implemented |
| **Person** | `dossier.type='person'` | VIPs (ambassadors, ministers, officials) | ❌ Not implemented |

### Entities That Should NOT Be Dossiers (Supporting Entities)

| Entity | Purpose | Relationship to Dossiers |
|--------|---------|-------------------------|
| **Task** | Work management | Work to be done ON dossiers or documents |
| **Intake Ticket** | Request tracking | Requests ABOUT or FOR dossiers |
| **Position** | Policy document | Artifact ABOUT dossiers |
| **MOU** | Agreement | Artifact LINKING dossiers |
| **Brief** | Background document | Artifact FOR dossiers (meeting prep) |
| **User/Staff** | System actor | Actors who work WITH dossiers (not subjects unless VIP) |
| **Calendar Event** | Temporal instance | WHEN a dossier (engagement/forum) occurs in time |
| **Attachment** | File storage | Supporting files FOR dossiers/documents |

**Key Principle:** Dossiers are subjects of diplomatic interest. Everything else supports working with those subjects.

---

## Recommended Architecture: Class Table Inheritance

### Pattern Overview

Class Table Inheritance provides the best balance of:
- ✅ Single ID namespace (all dossiers have one canonical UUID)
- ✅ Type safety (rich structured data in extension tables)
- ✅ Flexibility (can add new dossier types easily)
- ✅ Queryability (can JOIN type tables when needed)
- ✅ Graph capability (universal relationship table)

### Schema Structure

```
TIER 1: Universal Base
├── dossiers (id, type, name_en, name_ar, status, sensitivity, tags, metadata)

TIER 2: Type Extensions (same UUID as parent)
├── countries (id FK → dossiers.id, iso_code_2, capital, region, population)
├── organizations (id FK → dossiers.id, org_code, org_type, website, parent_org_id)
├── forums (id FK → dossiers.id, sessions, speakers, sponsors, registration_fee)
├── engagements (id FK → dossiers.id, engagement_type, location)
├── themes (id FK → dossiers.id, theme_category, description)
├── working_groups (id FK → dossiers.id, mandate, lead_org_id, status)
├── persons (id FK → dossiers.id, title, org_id, nationality, contact_info)

TIER 3: Universal Relationships (Graph Model)
├── dossier_relationships (source_id, target_id, relationship_type, metadata, temporal)

TIER 4: Temporal Separation
├── calendar_events (id, dossier_id, event_type, start_datetime, end_datetime, location)
├── event_participants (event_id, participant_id, participant_type, role)

TIER 5: Documents & Artifacts
├── positions (about dossiers)
├── mous (between dossiers)
├── briefs (for dossiers)
└── All link via junction tables to dossiers.id
```

### Target Schema (Detailed)

```sql
-- ============================================
-- TIER 1: Universal Base Table
-- ============================================
CREATE TABLE dossiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  type TEXT NOT NULL CHECK (type IN (
    'country', 'organization', 'forum', 'engagement',
    'theme', 'working_group', 'person'
  )),
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,

  -- Content
  description_en TEXT,
  description_ar TEXT,

  -- Classification
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived', 'deleted')),
  sensitivity_level INTEGER NOT NULL DEFAULT 1 CHECK (sensitivity_level BETWEEN 1 AND 4),

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',

  -- Search
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name_en, '')), 'A') ||
    setweight(to_tsvector('arabic', coalesce(name_ar, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description_en, '')), 'B') ||
    setweight(to_tsvector('arabic', coalesce(description_ar, '')), 'B')
  ) STORED,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_dossiers_type ON dossiers(type) WHERE status = 'active';
CREATE INDEX idx_dossiers_status ON dossiers(status);
CREATE INDEX idx_dossiers_sensitivity ON dossiers(sensitivity_level);
CREATE INDEX idx_dossiers_search ON dossiers USING GIN(search_vector);
CREATE INDEX idx_dossiers_tags ON dossiers USING GIN(tags);
CREATE INDEX idx_dossiers_created_at ON dossiers(created_at DESC);

-- ============================================
-- TIER 2: Type-Specific Extensions
-- ============================================

-- Countries extend dossiers (same UUID)
CREATE TABLE countries (
  id UUID PRIMARY KEY REFERENCES dossiers(id) ON DELETE CASCADE,
  iso_code_2 CHAR(2) NOT NULL UNIQUE,
  iso_code_3 CHAR(3) NOT NULL UNIQUE,
  capital_en TEXT,
  capital_ar TEXT,
  region TEXT NOT NULL CHECK (region IN ('africa', 'americas', 'asia', 'europe', 'oceania')),
  subregion TEXT,
  population INTEGER CHECK (population > 0),
  area_sq_km INTEGER CHECK (area_sq_km > 0),
  flag_url TEXT
);

-- Organizations extend dossiers
CREATE TABLE organizations (
  id UUID PRIMARY KEY REFERENCES dossiers(id) ON DELETE CASCADE,
  org_code TEXT NOT NULL UNIQUE,
  org_type TEXT NOT NULL CHECK (org_type IN ('government', 'ngo', 'private', 'international', 'academic')),
  headquarters_country_id UUID REFERENCES countries(id),  -- Structural FK
  parent_org_id UUID REFERENCES organizations(id),  -- Hierarchy
  website TEXT,
  email TEXT,
  phone TEXT,
  address_en TEXT,
  address_ar TEXT,
  logo_url TEXT,
  established_date DATE
);

-- Engagements extend dossiers (NO MORE dossier_id FK!)
CREATE TABLE engagements (
  id UUID PRIMARY KEY REFERENCES dossiers(id) ON DELETE CASCADE,
  engagement_type TEXT NOT NULL CHECK (engagement_type IN (
    'meeting', 'consultation', 'coordination', 'workshop',
    'conference', 'site_visit', 'ceremony', 'other'
  )),
  engagement_category TEXT CHECK (engagement_category IN (
    'bilateral', 'multilateral', 'regional', 'internal'
  )),
  location_en TEXT,
  location_ar TEXT
);

-- Forums extend dossiers
CREATE TABLE forums (
  id UUID PRIMARY KEY REFERENCES dossiers(id) ON DELETE CASCADE,
  number_of_sessions INTEGER DEFAULT 1 CHECK (number_of_sessions > 0),
  keynote_speakers JSONB DEFAULT '[]'::JSONB,
  sponsors JSONB DEFAULT '[]'::JSONB,
  registration_fee DECIMAL(10,2) CHECK (registration_fee >= 0),
  currency CHAR(3),
  agenda_url TEXT,
  live_stream_url TEXT
);

-- Themes extend dossiers
CREATE TABLE themes (
  id UUID PRIMARY KEY REFERENCES dossiers(id) ON DELETE CASCADE,
  theme_category TEXT CHECK (theme_category IN ('policy', 'technical', 'strategic', 'operational')),
  parent_theme_id UUID REFERENCES themes(id)
);

-- Working groups extend dossiers
CREATE TABLE working_groups (
  id UUID PRIMARY KEY REFERENCES dossiers(id) ON DELETE CASCADE,
  mandate_en TEXT,
  mandate_ar TEXT,
  lead_org_id UUID REFERENCES organizations(id),
  wg_status TEXT CHECK (wg_status IN ('active', 'suspended', 'disbanded')),
  established_date DATE,
  disbandment_date DATE
);

-- Persons extend dossiers (VIPs only)
CREATE TABLE persons (
  id UUID PRIMARY KEY REFERENCES dossiers(id) ON DELETE CASCADE,
  title_en TEXT,
  title_ar TEXT,
  organization_id UUID REFERENCES organizations(id),
  nationality_country_id UUID REFERENCES countries(id),
  email TEXT,
  phone TEXT,
  biography_en TEXT,
  biography_ar TEXT,
  photo_url TEXT
);

-- ============================================
-- TIER 3: Universal Relationships
-- ============================================

CREATE TABLE dossier_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationship
  source_dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  target_dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,

  -- Metadata
  relationship_metadata JSONB DEFAULT '{}',
  notes_en TEXT,
  notes_ar TEXT,

  -- Temporal validity
  effective_from TIMESTAMPTZ,
  effective_to TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'historical', 'terminated')),

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),

  -- Constraints
  CHECK (source_dossier_id != target_dossier_id)
);

-- Relationship type examples:
-- bilateral_relation, membership, partnership, parent_of, subsidiary_of,
-- discusses, involves, participant_in, hosted_by, sponsored_by,
-- related_to, depends_on, conflicts_with, supersedes

CREATE INDEX idx_dossier_relationships_source ON dossier_relationships(source_dossier_id);
CREATE INDEX idx_dossier_relationships_target ON dossier_relationships(target_dossier_id);
CREATE INDEX idx_dossier_relationships_type ON dossier_relationships(relationship_type);
CREATE INDEX idx_dossier_relationships_status ON dossier_relationships(status) WHERE status = 'active';

-- ============================================
-- TIER 4: Temporal Separation (Calendar)
-- ============================================

CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to dossier (engagement or forum)
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT CHECK (event_type IN (
    'main_event', 'session', 'plenary', 'working_session',
    'ceremony', 'reception', 'other'
  )),
  title_en TEXT,
  title_ar TEXT,
  description_en TEXT,
  description_ar TEXT,

  -- Timing
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ,
  timezone TEXT DEFAULT 'UTC',

  -- Location
  location_en TEXT,
  location_ar TEXT,
  is_virtual BOOLEAN DEFAULT false,
  virtual_link TEXT,
  room_en TEXT,
  room_ar TEXT,

  -- Status
  status TEXT DEFAULT 'planned' CHECK (status IN (
    'planned', 'ongoing', 'completed', 'cancelled', 'postponed'
  )),

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CHECK (end_datetime IS NULL OR end_datetime > start_datetime)
);

CREATE INDEX idx_calendar_events_dossier ON calendar_events(dossier_id);
CREATE INDEX idx_calendar_events_datetime ON calendar_events(start_datetime, end_datetime);
CREATE INDEX idx_calendar_events_status ON calendar_events(status);

-- Event participants
CREATE TABLE event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,

  -- Polymorphic participant (user or external contact or person dossier)
  participant_type TEXT NOT NULL CHECK (participant_type IN ('user', 'external_contact', 'person_dossier')),
  participant_id UUID NOT NULL,

  -- Role
  role TEXT CHECK (role IN (
    'organizer', 'speaker', 'moderator', 'panelist',
    'attendee', 'observer', 'vip', 'support_staff'
  )),

  -- Attendance
  attendance_status TEXT DEFAULT 'invited' CHECK (attendance_status IN (
    'invited', 'confirmed', 'tentative', 'declined', 'attended', 'no_show'
  )),

  UNIQUE(event_id, participant_type, participant_id)
);

CREATE INDEX idx_event_participants_event ON event_participants(event_id);
CREATE INDEX idx_event_participants_participant ON event_participants(participant_type, participant_id);
```

---

## Benefits of Proposed Architecture

### 1. Single ID Namespace
Every entity of interest has ONE canonical ID in `dossiers.id`:
- No confusion about which table to query
- Polymorphic links always use `dossiers.id`
- Consistent referencing across the system

### 2. Graph Query Capability
```sql
-- Find all entities connected to Saudi Arabia
WITH RECURSIVE connected AS (
  SELECT target_dossier_id AS id FROM dossier_relationships
  WHERE source_dossier_id = 'saudi-id' AND status = 'active'
  UNION
  SELECT source_dossier_id FROM dossier_relationships
  WHERE target_dossier_id = 'saudi-id' AND status = 'active'
)
SELECT d.*, c.iso_code_2, o.org_code
FROM dossiers d
LEFT JOIN countries c ON d.id = c.id
LEFT JOIN organizations o ON d.id = o.id
WHERE d.id IN (SELECT id FROM connected);
```

### 3. Unified Search
```sql
-- Search ALL entity types at once
SELECT
  d.*,
  CASE d.type
    WHEN 'country' THEN c.iso_code_2
    WHEN 'organization' THEN o.org_code
  END AS type_identifier
FROM dossiers d
LEFT JOIN countries c ON d.id = c.id AND d.type = 'country'
LEFT JOIN organizations o ON d.id = o.id AND d.type = 'organization'
WHERE d.search_vector @@ to_tsquery('climate | trade')
  AND d.status = 'active'
ORDER BY ts_rank(d.search_vector, to_tsquery('climate | trade')) DESC;
```

### 4. Type Safety + Flexibility
- Core metadata in `dossiers` (name, status, sensitivity) - enforced by schema
- Rich structured data in type tables (`countries.iso_code_2`, `organizations.website`)
- Can JOIN type tables when type-specific data is needed
- Can add new dossier types without breaking existing code

### 5. Matches User Mental Model
```
"Show me the Saudi Arabia dossier"
→ SELECT * FROM dossiers WHERE id = 'saudi-id'

"Link this ticket to G20 Summit"
→ Use dossiers.id (G20 is type='forum')

"All climate-related entities"
→ SELECT * FROM dossiers WHERE 'climate' = ANY(tags)

"Saudi Arabia has partnership with UAE"
→ INSERT INTO dossier_relationships (source='saudi', target='uae', type='partnership')
```

---

## Implementation Roadmap

Since all data is mock, we can pursue aggressive refactoring:

### Phase 1: Foundation (Week 1)
- **Drop and recreate database schema**
- Implement universal dossiers table
- Create all 7 type extension tables (countries, organizations, forums, engagements, themes, working_groups, persons)
- Create dossier_relationships table
- Create calendar_events and event_participants tables
- Generate fresh seed data following new structure

### Phase 2: Engagement Fix & Relationships (Week 1-2)
- Remove engagement.dossier_id FK
- Create relationships for engagements (what they discuss, who participates)
- Update after-action records, decisions, commitments to link to engagement dossiers
- Test engagement workflows end-to-end

### Phase 3: Polymorphic Standardization (Week 2)
- Define canonical entity_type enum: `'dossier', 'position', 'mou', 'task', 'ticket', 'brief'`
- Update intake_entity_links to always use 'dossier' for all dossier subtypes
- Update tasks.work_item_type to use 'dossier'
- Implement validation triggers
- Regenerate TypeScript types

### Phase 4: API & Backend (Week 2-3)
- Refactor all Supabase Edge Functions
- Create universal entity resolver (given dossier_id, return full entity with type data)
- Implement relationship CRUD APIs
- Implement calendar APIs
- Update all API contracts

### Phase 5: Frontend (Week 3-4)
- Update TypeScript types (regenerate from schema)
- Create universal entity card component (polymorphic rendering based on dossier.type)
- Build relationship graph visualization
- Implement unified search UI
- Update all pages to use new model

### Phase 6: Advanced Features (Week 4)
- Recursive CTE functions for graph traversal
- Universal search endpoint with ranking
- Entity timeline view (chronological activity across all entity types)
- Performance optimization (indexes, caching)
- Comprehensive testing

---

## Migration Considerations

**Since data is mock:**
- ✅ No migration scripts needed
- ✅ Clean slate implementation
- ✅ Can optimize schema from day one
- ✅ No backward compatibility constraints

**Key Decisions:**
- Use **same UUID** for dossier and extension (countries.id = dossiers.id)
- This enables: `SELECT * FROM countries WHERE id = 'some-uuid'` works directly
- Type-specific queries: `SELECT * FROM dossiers WHERE type = 'country'` then JOIN

**Seed Data Strategy:**
- Generate countries with proper dossier rows
- Generate organizations with dossier rows + relationships to countries
- Generate forums with dossier rows + calendar events
- Generate engagements with dossier rows + relationships + calendar events
- Generate relationships between all entities
- Generate realistic calendar events

---

## Success Metrics

After implementation:

### Technical Metrics
- ✅ **Zero dual representations** - Each entity exists in exactly one place
- ✅ **Single ID namespace** - All entity IDs are from dossiers table
- ✅ **Graph traversal works** - Can query "all entities within N degrees of X"
- ✅ **Unified search functional** - Single endpoint returns ranked results across all types
- ✅ **Type generation accurate** - TypeScript types match database schema exactly

### User Experience Metrics
- ✅ **Reduced confusion** - Users understand "everything is a dossier"
- ✅ **Improved query times** - Unified search faster than multiple table queries
- ✅ **Better relationship visibility** - Graph view shows all connections
- ✅ **Calendar clarity** - Unified view of all temporal events

### Code Quality Metrics
- ✅ **Fewer tables** - Consolidated from fragmented model
- ✅ **Consistent patterns** - All polymorphic links use same approach
- ✅ **Better maintainability** - Clear architectural boundaries
- ✅ **Test coverage** - All new patterns tested

---

## Risk Assessment

**Overall Risk: LOW** (due to mock data)

| Risk | Severity | Mitigation |
|------|----------|------------|
| Data loss during migration | ❌ N/A | Mock data, can regenerate |
| Breaking existing integrations | 🟡 Medium | Update all APIs simultaneously |
| Performance degradation | 🟢 Low | Proper indexing, tested queries |
| Type confusion | 🟢 Low | Strong TypeScript types, validation |
| Incomplete migration | 🟢 Low | All-or-nothing approach, comprehensive testing |

---

## Next Steps

1. **Create Feature Specification** - Run `/speckit.specify` to formalize this refactor
2. **Create Implementation Plan** - Run `/speckit.plan` for detailed technical approach
3. **Generate Task List** - Run `/speckit.tasks` for actionable steps
4. **Begin Implementation** - Start with Phase 1 (database schema)
5. **Iterative Testing** - Test each phase thoroughly before proceeding

---

## Appendices

### Appendix A: Relationship Type Reference

Common relationship types in diplomatic context:

| Relationship Type | Description | Example |
|------------------|-------------|---------|
| `bilateral_relation` | Country-to-country diplomatic relation | Saudi Arabia ↔ China |
| `membership` | Entity is member of organization/forum | UNDP → G20 Summit |
| `partnership` | Collaboration between entities | WHO ⟷ RedCross |
| `hosts` | Entity hosts event | Saudi Arabia → Trade Conference |
| `participates_in` | Entity participates in event | Minister X → Bilateral Meeting |
| `discusses` | Engagement discusses dossier | China Meeting → Trade Policy |
| `parent_of` | Hierarchical parent | Ministry of Foreign Affairs → Trade Department |
| `reports_to` | Reporting relationship | Working Group → Committee |
| `relates_to` | Generic relation | Climate Theme ↔ G20 Summit |
| `supersedes` | Replaces previous entity | New MOU → Old MOU |
| `depends_on` | Dependency relationship | Project A → Project B |

### Appendix B: Calendar Event Type Reference

| Event Type | Description | Typical For |
|-----------|-------------|-------------|
| `main_event` | Primary event | Engagement main meeting, Forum opening |
| `session` | Forum session | Forum multi-day sessions |
| `plenary` | Plenary session | Forum all-participant meetings |
| `working_session` | Working group session | Forum breakout sessions |
| `ceremony` | Ceremonial event | Opening ceremony, signing ceremony |
| `reception` | Social gathering | Networking reception, gala dinner |
| `other` | Other event types | Ad-hoc events |

### Appendix C: Dossier Type Usage Guide

| Type | When to Use | When NOT to Use |
|------|-------------|-----------------|
| `country` | Nation states with ISO codes | Regions, territories without sovereignty |
| `organization` | Entities with legal structure | Informal groups |
| `forum` | Multi-session conferences | Single meetings (use engagement) |
| `engagement` | Diplomatic interactions | Internal meetings (use task/calendar) |
| `theme` | Policy areas, initiatives | Generic tags (use tags field) |
| `working_group` | Formal committees with mandate | Ad-hoc teams (use tasks) |
| `person` | VIPs requiring tracking | All staff (use users table) |

---

**Document Version:** 1.0
**Last Updated:** 2025-01-22
**Next Review:** After implementation of Phase 1
