# Developer Guide: Entity Relationships Feature

**Feature ID**: 017-entity-relationships-and
**Last Updated**: 2025-10-09
**Status**: Test Suite Complete - Ready for Validation

## Overview

The Entity Relationships feature transforms the Intl-Dossier system to use dossiers as the central hub for all international relationship management. This guide helps developers understand, extend, and maintain the relationships functionality.

## Architecture

### Core Concepts

1. **Dossiers as Hubs**: Every entity (country, organization, forum) has a corresponding dossier that acts as the central point for all related data
2. **Polymorphic Relationships**: Documents, intelligence signals, and other entities can link to any parent entity type
3. **Many-to-Many Linking**: Positions can relate to multiple dossiers, dossiers can relate to other dossiers
4. **Unified Timeline**: Aggregates events from 6+ entity types into a single chronological view

### Database Schema

#### Key Tables

**dossier_relationships** - M:N relationships between dossiers
```sql
CREATE TABLE dossier_relationships (
  parent_dossier_id UUID REFERENCES dossiers(id),
  child_dossier_id UUID REFERENCES dossiers(id),
  relationship_type TEXT, -- 'member_of', 'participates_in', 'collaborates_with', etc.
  relationship_strength TEXT, -- 'primary', 'secondary', 'observer'
  PRIMARY KEY (parent_dossier_id, child_dossier_id, relationship_type)
);
```

**position_dossier_links** - M:N links between positions and dossiers
```sql
CREATE TABLE position_dossier_links (
  position_id UUID REFERENCES positions(id),
  dossier_id UUID REFERENCES dossiers(id),
  link_type TEXT, -- 'primary', 'related', 'reference'
  PRIMARY KEY (position_id, dossier_id)
);
```

**documents** - Polymorphic document storage
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  owner_type TEXT, -- 'dossier', 'engagement', 'position', 'mou', etc.
  owner_id UUID, -- FK to owner entity (not enforced)
  file_name TEXT,
  storage_path TEXT,
  sensitivity_level TEXT
);
```

#### Performance Indexes

All junction tables have composite indexes on both foreign keys:
```sql
CREATE INDEX idx_dossier_rel_parent ON dossier_relationships(parent_dossier_id);
CREATE INDEX idx_dossier_rel_child ON dossier_relationships(child_dossier_id);
CREATE INDEX idx_position_dossier_position ON position_dossier_links(position_id);
CREATE INDEX idx_position_dossier_dossier ON position_dossier_links(dossier_id);
CREATE INDEX idx_documents_owner ON documents(owner_type, owner_id);
```

**Performance Targets**:
- Network graph query: <3s for 50 nodes
- Timeline aggregation: <1s for 100 events
- Document queries: <500ms for 100 documents

## Backend API

### Edge Functions

#### Dossier Relationships

**GET** `/dossiers-relationships-get?dossierId={id}&direction={parent|child|both}`
- Returns all relationships for a dossier
- Includes expanded dossier info for related entities
- Supports filtering by relationship_type

**POST** `/dossiers-relationships-create`
```json
{
  "parent_dossier_id": "uuid",
  "child_dossier_id": "uuid",
  "relationship_type": "member_of",
  "relationship_strength": "primary"
}
```

**DELETE** `/dossiers-relationships-delete?parentId={id}&childId={id}&type={type}`
- Removes specific relationship between dossiers

#### Position Linking

**POST** `/positions-dossiers-create` - Bulk linking
```json
{
  "position_id": "uuid",
  "dossier_ids": ["uuid1", "uuid2", "uuid3"],
  "link_type": "related"
}
```

#### Polymorphic Documents

**GET** `/documents-get?owner_type={type}&owner_id={id}`
- Returns all documents for an entity
- Respects RLS policies based on owner entity access

**POST** `/documents-create` - File upload with metadata
```json
{
  "owner_type": "dossier",
  "owner_id": "uuid",
  "file": "base64_encoded_file",
  "document_type": "memo",
  "sensitivity_level": "confidential"
}
```

#### Unified Calendar

**GET** `/calendar-get?start={date}&end={date}&filters[]={types}`
- Aggregates 4 event types: engagements (blue), calendar entries (green), assignment deadlines (red), approval deadlines (yellow)
- Supports filtering by dossier_id, assignee_id, event types

## Frontend Components

### Shared Components

#### RelationshipNavigator (React Flow)
```tsx
import { RelationshipNavigator } from '@/components/shared/RelationshipNavigator';

<RelationshipNavigator
  dossierId={currentDossierId}
  onNodeClick={(node) => navigate(`/dossiers/${node.type}/${node.id}`)}
/>
```

**Features**:
- Interactive network graph with zoom/pan
- Node clustering for better visualization
- Hover previews for related dossiers
- Keyboard navigation (Tab, Arrow keys)
- RTL support

#### UnifiedTimeline
```tsx
import { UnifiedTimeline } from '@/components/shared/UnifiedTimeline';

<UnifiedTimeline
  dossierId={currentDossierId}
  limit={100}
  onEventClick={(event) => handleEventNavigation(event)}
/>
```

**Event Types Aggregated**:
- Dossier status changes
- Relationship creation/updates
- Engagement creation
- Position linking
- Document uploads
- Intelligence signal logging

#### UniversalEntityCard
```tsx
import { UniversalEntityCard } from '@/components/shared/UniversalEntityCard';

<UniversalEntityCard
  entityType="dossier"
  entityId={dossierId}
  variant="compact"
  showActions={true}
/>
```

### Hooks

#### useDossierRelationships
```tsx
const {
  relationships,
  isLoading,
  createRelationship,
  deleteRelationship
} = useDossierRelationships(dossierId);
```

#### usePositionDossierLinks
```tsx
const {
  links,
  bulkLink,
  unlink
} = usePositionDossierLinks(positionId);
```

## Testing

### Contract Tests
Location: `tests/contract/`
- Test all API endpoints with Vitest
- Validate request/response schemas
- Test RLS policies

Run: `npm test -- tests/contract`

### Integration Tests
Location: `tests/integration/`
- Performance validation (<3s graph, <1s timeline)
- Realtime updates
- Cross-dossier queries

Run: `npm test -- tests/integration`

### E2E Tests
Location: `tests/e2e/`
- User journeys with Playwright
- Country analyst managing relationships
- Policy officer multi-dossier positions
- Calendar event creation

Run: `npx playwright test`

### Performance Tests
- Network graph: 50 nodes in <3s
- Timeline: 100 events in <1s

Run: `npm test -- tests/performance`

## Common Tasks

### Adding a New Relationship Type

1. Update `relationship_type` CHECK constraint in migration:
```sql
ALTER TABLE dossier_relationships
  DROP CONSTRAINT dossier_relationships_relationship_type_check;

ALTER TABLE dossier_relationships
  ADD CONSTRAINT dossier_relationships_relationship_type_check
  CHECK (relationship_type IN ('member_of', 'participates_in', 'your_new_type'));
```

2. Update TypeScript types:
```typescript
// types/relationships.ts
export type RelationshipType =
  | 'member_of'
  | 'participates_in'
  | 'your_new_type';
```

3. Add translation keys:
```json
// frontend/src/i18n/en/relationships.json
{
  "relationship_types": {
    "your_new_type": "Your New Type Description"
  }
}
```

### Adding a New Document Owner Type

1. Update CHECK constraint:
```sql
ALTER TABLE documents
  DROP CONSTRAINT documents_owner_type_check;

ALTER TABLE documents
  ADD CONSTRAINT documents_owner_type_check
  CHECK (owner_type IN ('dossier', 'engagement', 'your_new_type'));
```

2. Update RLS policies to include new owner type:
```sql
CREATE POLICY "documents_select_policy" ON documents
  FOR SELECT
  USING (
    CASE owner_type
      WHEN 'your_new_type' THEN
        -- Add access check logic for new type
        EXISTS (SELECT 1 FROM your_new_table WHERE id = owner_id AND ...)
      ELSE ...
    END
  );
```

### Extending Timeline Events

1. Add new query to aggregation logic:
```typescript
const [relationships, engagements, yourNewEvents] = await Promise.all([
  // Existing queries...
  supabase.from('your_new_table').select('*').eq('dossier_id', dossierId),
]);
```

2. Transform to timeline format:
```typescript
const yourNewEventsTransformed = yourNewEvents.map(event => ({
  id: event.id,
  event_type: 'your_new_event',
  event_date: event.created_at,
  title: event.title,
  description: event.description,
  icon: '🆕',
}));
```

3. Merge and sort:
```typescript
const timeline = [
  ...existingEvents,
  ...yourNewEventsTransformed,
].sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
```

## Troubleshooting

### Graph Not Rendering

**Problem**: Network graph shows "Loading..." indefinitely

**Solutions**:
1. Check browser console for React Flow errors
2. Verify data is being fetched: `GET /dossiers-relationships-get`
3. Check relationships table has data: `SELECT * FROM dossier_relationships WHERE parent_dossier_id = 'xxx'`
4. Verify React Flow is installed: `npm list reactflow`

### Slow Timeline Queries

**Problem**: Timeline takes >1s to load

**Solutions**:
1. Check index usage: `EXPLAIN ANALYZE SELECT * FROM engagements WHERE dossier_id = 'xxx'`
2. Verify composite indexes exist on junction tables
3. Reduce query scope: Use pagination with LIMIT
4. Consider materializing timeline view for frequently accessed dossiers

### RLS Policy Blocking Access

**Problem**: User can't see relationships/documents they should have access to

**Solutions**:
1. Check user's role: `SELECT auth.jwt() ->> 'role'`
2. Verify dossier ownership: `SELECT * FROM dossier_owners WHERE dossier_id = 'xxx' AND user_id = auth.uid()`
3. Test RLS bypass: Temporarily disable RLS with `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` (dev only!)
4. Check policy logic in migration files: `supabase/migrations/*_rls_policies.sql`

## Performance Optimization Tips

1. **Use Pagination**: Always paginate large result sets
2. **Batch Operations**: Use bulk insert/update for multiple records
3. **Cache Frequently Accessed Data**: Use TanStack Query's cache
4. **Prefetch on Hover**: Prefetch related dossiers when user hovers over graph nodes
5. **Debounce Realtime Updates**: Batch rapid Realtime events (500ms debounce)

## Security Considerations

1. **Polymorphic RLS**: Document access inherits from owner entity permissions
2. **Relationship Validation**: Edge Functions validate both dossiers exist before creating relationships
3. **File Upload Scanning**: Documents are scanned with ClamAV before allowing downloads
4. **Sensitive Data**: Confidential dossiers and their relationships are hidden from unauthorized users

## Further Reading

- **Specification**: `/specs/017-entity-relationships-and/spec.md`
- **Data Model**: `/specs/017-entity-relationships-and/data-model.md`
- **API Contracts**: `/specs/017-entity-relationships-and/contracts/api-spec.yaml`
- **Quickstart Guide**: `/specs/017-entity-relationships-and/quickstart.md`

---
**Questions?** Check the spec documents or contact the development team.
