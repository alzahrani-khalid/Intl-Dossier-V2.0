# Data Model: Smart Dossier Context Inheritance

**Feature**: 035-dossier-context
**Date**: 2025-01-16
**Phase**: 1 - Design

## Overview

This document defines the data model for smart dossier context inheritance, including:

- New junction table for work-item-to-dossier links
- TypeScript type definitions
- State management types
- Validation rules

---

## 1. Database Entities

### 1.1 New Table: `work_item_dossiers`

Junction table linking work items (tasks, commitments, intakes) to dossiers with inheritance tracking.

```sql
CREATE TABLE work_item_dossiers (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Polymorphic Work Item Reference
  work_item_type TEXT NOT NULL
    CHECK (work_item_type IN ('task', 'commitment', 'intake')),
  work_item_id UUID NOT NULL,

  -- Dossier Reference
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,

  -- Inheritance Tracking
  inheritance_source TEXT NOT NULL DEFAULT 'direct'
    CHECK (inheritance_source IN ('direct', 'engagement', 'after_action', 'position', 'mou')),
  inherited_from_type TEXT
    CHECK (inherited_from_type IN (NULL, 'engagement', 'after_action_record', 'position', 'mou')),
  inherited_from_id UUID,
  inheritance_path JSONB DEFAULT '[]'::jsonb,

  -- Multi-Dossier Support
  display_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,

  -- Audit Fields
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Soft Delete
  deleted_at TIMESTAMPTZ,

  -- Optimistic Locking
  _version INTEGER NOT NULL DEFAULT 1,

  -- Constraints
  CONSTRAINT valid_inheritance_metadata CHECK (
    (inheritance_source = 'direct' AND inherited_from_type IS NULL AND inherited_from_id IS NULL) OR
    (inheritance_source != 'direct' AND inherited_from_type IS NOT NULL AND inherited_from_id IS NOT NULL)
  ),
  CONSTRAINT unique_work_item_dossier UNIQUE (work_item_type, work_item_id, dossier_id)
    WHERE deleted_at IS NULL,
  CONSTRAINT unique_primary_per_work_item UNIQUE (work_item_type, work_item_id, is_primary)
    WHERE is_primary = true AND deleted_at IS NULL
);

-- Table and column comments
COMMENT ON TABLE work_item_dossiers IS
  'Junction table linking work items to dossiers with inheritance source tracking for context inheritance';
COMMENT ON COLUMN work_item_dossiers.inheritance_source IS
  'How link was established: direct, engagement, after_action, position, mou';
COMMENT ON COLUMN work_item_dossiers.inheritance_path IS
  'JSONB array tracking resolution chain: [{type, id, name_en, name_ar}]';
COMMENT ON COLUMN work_item_dossiers.is_primary IS
  'Primary dossier for UI display. Only one per work_item.';
```

### 1.2 Indexes

```sql
-- Timeline fetch (hot path)
CREATE INDEX idx_work_item_dossiers_dossier_active
  ON work_item_dossiers (dossier_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Context resolution (reverse lookup)
CREATE INDEX idx_work_item_dossiers_work_item_active
  ON work_item_dossiers (work_item_type, work_item_id)
  WHERE deleted_at IS NULL;

-- Inheritance filtering
CREATE INDEX idx_work_item_dossiers_inheritance
  ON work_item_dossiers (dossier_id, inheritance_source, created_at DESC)
  WHERE deleted_at IS NULL;

-- Primary dossier lookup
CREATE INDEX idx_work_item_dossiers_primary
  ON work_item_dossiers (work_item_type, work_item_id)
  WHERE deleted_at IS NULL AND is_primary = true;

-- Cursor pagination
CREATE INDEX idx_work_item_dossiers_cursor
  ON work_item_dossiers (dossier_id, created_at DESC, id)
  WHERE deleted_at IS NULL;

-- Incremental sync (mobile)
CREATE INDEX idx_work_item_dossiers_sync
  ON work_item_dossiers (updated_at DESC)
  WHERE deleted_at IS NULL;
```

### 1.3 RLS Policies

```sql
-- Enable RLS
ALTER TABLE work_item_dossiers ENABLE ROW LEVEL SECURITY;

-- SELECT: User can view links for accessible dossiers + work items
CREATE POLICY work_item_dossiers_select ON work_item_dossiers
FOR SELECT USING (
  -- Dossier access (sensitivity-based)
  EXISTS (
    SELECT 1 FROM dossiers d
    WHERE d.id = dossier_id
    AND get_user_clearance_level(auth.uid()) >=
      CASE d.sensitivity_level
        WHEN 'low' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'high' THEN 3
      END
  )
  AND
  -- Work item access (polymorphic)
  CASE work_item_type
    WHEN 'task' THEN work_item_id IN (
      SELECT id FROM tasks WHERE assigned_to = auth.uid() OR created_by = auth.uid()
    )
    WHEN 'commitment' THEN work_item_id IN (
      SELECT id FROM commitments WHERE owner_internal_id = auth.uid()
    )
    WHEN 'intake' THEN work_item_id IN (
      SELECT id FROM intake_tickets
      WHERE created_by = auth.uid() OR assigned_to = auth.uid()
    )
  END
);

-- INSERT: User can link work items they own to dossiers they can edit
CREATE POLICY work_item_dossiers_insert ON work_item_dossiers
FOR INSERT WITH CHECK (
  can_edit_dossier(dossier_id)
  AND
  CASE work_item_type
    WHEN 'task' THEN work_item_id IN (
      SELECT id FROM tasks WHERE created_by = auth.uid()
    )
    WHEN 'commitment' THEN work_item_id IN (
      SELECT id FROM commitments WHERE owner_internal_id = auth.uid()
    )
    WHEN 'intake' THEN work_item_id IN (
      SELECT id FROM intake_tickets WHERE created_by = auth.uid()
    )
  END
);

-- UPDATE: Link creator or dossier admin
CREATE POLICY work_item_dossiers_update ON work_item_dossiers
FOR UPDATE USING (
  created_by = auth.uid() OR can_edit_dossier(dossier_id)
);

-- DELETE: Link creator or dossier admin
CREATE POLICY work_item_dossiers_delete ON work_item_dossiers
FOR DELETE USING (
  created_by = auth.uid() OR can_edit_dossier(dossier_id)
);
```

### 1.4 Database View: `dossier_activity_timeline`

Aggregated view for activity timeline.

```sql
CREATE VIEW dossier_activity_timeline AS
SELECT
  wid.id as link_id,
  wid.work_item_id,
  wid.work_item_type,
  wid.dossier_id,
  wid.inheritance_source,
  wid.inheritance_path,
  wid.created_at as activity_timestamp,

  -- Polymorphic title
  COALESCE(t.title, c.description, it.title) as activity_title,

  -- Polymorphic status
  CASE wid.work_item_type
    WHEN 'task' THEN t.status
    WHEN 'commitment' THEN c.status::TEXT
    WHEN 'intake' THEN it.status::TEXT
  END as status,

  -- Polymorphic priority
  CASE wid.work_item_type
    WHEN 'task' THEN t.priority
    WHEN 'commitment' THEN c.priority::TEXT
    WHEN 'intake' THEN it.priority::TEXT
  END as priority,

  -- Polymorphic assignee
  CASE wid.work_item_type
    WHEN 'task' THEN t.assignee_id
    WHEN 'commitment' THEN c.owner_internal_id
    WHEN 'intake' THEN it.assigned_to
  END as assignee_id,

  -- UI icon type
  CASE wid.work_item_type
    WHEN 'task' THEN 'checklist'
    WHEN 'commitment' THEN 'handshake'
    WHEN 'intake' THEN 'inbox'
  END as icon_type,

  -- Inheritance label
  CASE wid.inheritance_source
    WHEN 'direct' THEN NULL
    WHEN 'engagement' THEN 'via Engagement'
    WHEN 'after_action' THEN 'via After-Action'
    WHEN 'position' THEN 'via Position'
    WHEN 'mou' THEN 'via MOU'
  END as inheritance_label

FROM work_item_dossiers wid
LEFT JOIN tasks t ON wid.work_item_type = 'task' AND t.id = wid.work_item_id
LEFT JOIN commitments c ON wid.work_item_type = 'commitment' AND c.id = wid.work_item_id
LEFT JOIN intake_tickets it ON wid.work_item_type = 'intake' AND it.id = wid.work_item_id
WHERE wid.deleted_at IS NULL;

COMMENT ON VIEW dossier_activity_timeline IS
  'Aggregated view of all activities linked to dossiers for timeline display';
```

### 1.5 RPC Function: `resolve_dossier_context`

Server-side context resolution for sub-100ms performance.

```sql
CREATE OR REPLACE FUNCTION resolve_dossier_context(
  p_entity_type TEXT,
  p_entity_id UUID
)
RETURNS TABLE (
  dossier_id UUID,
  dossier_name_en TEXT,
  dossier_name_ar TEXT,
  dossier_type TEXT,
  dossier_status TEXT,
  inheritance_source TEXT,
  resolution_path UUID[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  IF p_entity_type = 'dossier' THEN
    RETURN QUERY
    SELECT
      d.id,
      d.name_en,
      d.name_ar,
      d.type,
      d.status,
      'direct'::TEXT,
      ARRAY[d.id]
    FROM dossiers d
    WHERE d.id = p_entity_id
      AND d.status != 'archived';

  ELSIF p_entity_type = 'engagement' THEN
    RETURN QUERY
    SELECT
      d.id,
      d.name_en,
      d.name_ar,
      d.type,
      d.status,
      'engagement'::TEXT,
      ARRAY[p_entity_id, d.id]
    FROM engagements e
    JOIN dossiers d ON e.dossier_id = d.id
    WHERE e.id = p_entity_id
      AND d.status != 'archived';

  ELSIF p_entity_type = 'after_action' THEN
    RETURN QUERY
    SELECT
      d.id,
      d.name_en,
      d.name_ar,
      d.type,
      d.status,
      'after_action'::TEXT,
      ARRAY[p_entity_id, e.id, d.id]
    FROM after_action_records aa
    JOIN engagements e ON aa.engagement_id = e.id
    JOIN dossiers d ON e.dossier_id = d.id
    WHERE aa.id = p_entity_id
      AND d.status != 'archived';

  ELSIF p_entity_type = 'position' THEN
    RETURN QUERY
    SELECT
      d.id,
      d.name_en,
      d.name_ar,
      d.type,
      d.status,
      'position'::TEXT,
      ARRAY[p_entity_id, pdl.dossier_id]
    FROM position_dossier_links pdl
    JOIN dossiers d ON pdl.dossier_id = d.id
    WHERE pdl.position_id = p_entity_id
      AND d.status != 'archived';
  END IF;
END;
$$;

COMMENT ON FUNCTION resolve_dossier_context IS
  'Resolves dossier context from entity type and ID by following relationship chains';
```

---

## 2. TypeScript Type Definitions

### 2.1 Core Types (`dossier-context.types.ts`)

```typescript
// Work item types that can link to dossiers
export type WorkItemType = 'task' | 'commitment' | 'intake';

// How the dossier link was established
export type InheritanceSource =
  | 'direct' // User linked directly from dossier page
  | 'engagement' // Inherited from engagement → dossier
  | 'after_action' // Inherited from after-action → engagement → dossier
  | 'position' // Inherited from position → dossier
  | 'mou'; // Inherited from MOU → dossier

// Entity types that can resolve to dossier context
export type ContextEntityType = 'dossier' | 'engagement' | 'after_action' | 'position';

// Single step in the inheritance chain
export interface InheritancePathStep {
  type: ContextEntityType;
  id: string;
  name_en: string;
  name_ar: string;
}

// Link between work item and dossier
export interface WorkItemDossierLink {
  id: string;
  work_item_type: WorkItemType;
  work_item_id: string;
  dossier_id: string;
  inheritance_source: InheritanceSource;
  inherited_from_type: ContextEntityType | null;
  inherited_from_id: string | null;
  inheritance_path: InheritancePathStep[];
  display_order: number;
  is_primary: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Dossier reference for display in badges
export interface DossierReference {
  id: string;
  name_en: string;
  name_ar: string;
  type: 'country' | 'organization' | 'forum' | 'theme';
  status: 'active' | 'inactive' | 'archived';
}

// Resolved dossier context from RPC
export interface ResolvedDossierContext {
  dossier_id: string;
  dossier_name_en: string;
  dossier_name_ar: string;
  dossier_type: string;
  dossier_status: string;
  inheritance_source: InheritanceSource;
  resolution_path: string[];
}

// Context resolution request
export interface DossierContextRequest {
  entity_type: ContextEntityType;
  entity_id: string;
}

// Context resolution response
export interface DossierContextResponse {
  dossiers: ResolvedDossierContext[];
  resolved_from: ContextEntityType;
  query_time_ms: number;
}
```

### 2.2 State Management Types

```typescript
// Creation context (detected from URL)
export interface CreationContext {
  route: string;
  entityType?: ContextEntityType;
  entityId?: string;

  // Resolved dossier context
  resolvedDossiers?: DossierReference[];
  inheritanceSource?: InheritanceSource;

  // If context could not be resolved
  requiresSelection: boolean;
}

// Dossier context state (synced with URL)
export interface DossierContextState {
  // Selected dossier(s) for current operation
  selectedDossierIds: string[];

  // Resolved context (for display)
  resolvedDossiers: DossierReference[];

  // How context was established
  inheritanceSource: InheritanceSource | null;

  // Loading state
  isResolving: boolean;

  // If manual selection is required
  requiresSelection: boolean;
}

// Dossier context actions
export interface DossierContextActions {
  selectDossier: (dossierId: string) => void;
  selectMultipleDossiers: (dossierIds: string[]) => void;
  clearSelection: () => void;
  resolveFromEntity: (entityType: ContextEntityType, entityId: string) => Promise<void>;
}

// Full context value (state + actions)
export type DossierContextValue = DossierContextState & DossierContextActions;
```

### 2.3 Activity Timeline Types

```typescript
// Single activity in the timeline
export interface DossierActivity {
  link_id: string;
  work_item_id: string;
  work_item_type: WorkItemType;
  dossier_id: string;
  inheritance_source: InheritanceSource;
  inheritance_path: InheritancePathStep[];
  activity_timestamp: string;
  activity_title: string;
  status: string;
  priority: string;
  assignee_id: string | null;
  icon_type: 'checklist' | 'handshake' | 'inbox';
  inheritance_label: string | null;
}

// Timeline query parameters
export interface DossierTimelineParams {
  dossier_id: string;
  limit?: number;
  cursor?: string; // ISO timestamp
  work_item_type?: WorkItemType;
  inheritance_source?: InheritanceSource;
}

// Timeline response
export interface DossierTimelineResponse {
  activities: DossierActivity[];
  next_cursor: string | null;
  total_count: number;
}
```

### 2.4 Component Props Types

```typescript
// DossierContextBadge props
export interface DossierContextBadgeProps {
  dossier: DossierReference;
  inheritanceSource?: InheritanceSource;
  inheritedFromName?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// DossierSelector props
export interface DossierSelectorProps {
  value: string[];
  onChange: (dossierIds: string[]) => void;
  multiple?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

// DossierActivityTimeline props
export interface DossierActivityTimelineProps {
  dossierId: string;
  className?: string;
  initialLimit?: number;
  filterByType?: WorkItemType;
}
```

---

## 3. Validation Rules

### 3.1 Work Item Creation Validation

| Rule                     | Description                                           | Error Key                             |
| ------------------------ | ----------------------------------------------------- | ------------------------------------- |
| At least one dossier     | Work items must have at least one dossier link        | `validation.dossier_required`         |
| Valid dossier access     | User must have permission to access selected dossiers | `validation.dossier_access_denied`    |
| Primary dossier required | If multiple dossiers, one must be marked primary      | `validation.primary_dossier_required` |

### 3.2 Dossier Link Validation

| Rule                    | Description                                         | Error Key                           |
| ----------------------- | --------------------------------------------------- | ----------------------------------- |
| Unique link             | Cannot link same work item to same dossier twice    | `validation.duplicate_link`         |
| Inheritance consistency | inherited_from fields must match inheritance_source | `validation.invalid_inheritance`    |
| Valid work item type    | work_item_type must be task/commitment/intake       | `validation.invalid_work_item_type` |

### 3.3 State Transitions

**Work Item Dossier Link States:**

```
[Created] → [Active] → [Deleted (soft)]

- Created: Link inserted with inheritance metadata
- Active: Link visible in timeline, available for queries
- Deleted: deleted_at set, excluded from queries but retained for audit
```

---

## 4. Entity Relationship Diagram

```
┌─────────────────┐       ┌──────────────────────┐       ┌─────────────┐
│     dossiers    │       │  work_item_dossiers  │       │    tasks    │
├─────────────────┤       ├──────────────────────┤       ├─────────────┤
│ id (PK)         │◄──────│ dossier_id (FK)      │       │ id (PK)     │
│ name_en         │       │ work_item_type       │───────│             │
│ name_ar         │       │ work_item_id         │       └─────────────┘
│ type            │       │ inheritance_source   │
│ status          │       │ inherited_from_type  │       ┌─────────────┐
│ sensitivity     │       │ inherited_from_id    │───────│ commitments │
└─────────────────┘       │ inheritance_path     │       ├─────────────┤
         ▲                │ is_primary           │       │ id (PK)     │
         │                │ created_at           │       └─────────────┘
         │                └──────────────────────┘
         │                         │                     ┌─────────────┐
         │                         │─────────────────────│intake_tickets│
┌─────────────────┐                                      ├─────────────┤
│   engagements   │                                      │ id (PK)     │
├─────────────────┤                                      └─────────────┘
│ id (PK)         │
│ dossier_id (FK) │◄──────────────────┐
│ title           │                    │
└─────────────────┘                    │
         ▲                             │
         │                             │
┌─────────────────────┐                │
│after_action_records │                │
├─────────────────────┤                │
│ id (PK)             │                │
│ engagement_id (FK)  │────────────────┘
│ dossier_id (FK)     │
└─────────────────────┘
```

---

## 5. Migration File Name

```
YYYYMMDD_create_work_item_dossiers.sql
```

Migration should include:

1. CREATE TABLE work_item_dossiers
2. CREATE INDEXES (6 indexes)
3. CREATE RLS POLICIES (4 policies)
4. CREATE VIEW dossier_activity_timeline
5. CREATE FUNCTION resolve_dossier_context

---

## Summary

| Entity                      | Type       | Purpose                                  |
| --------------------------- | ---------- | ---------------------------------------- |
| `work_item_dossiers`        | Table      | Junction table with inheritance tracking |
| `dossier_activity_timeline` | View       | Aggregated timeline for display          |
| `resolve_dossier_context`   | Function   | Sub-100ms context resolution             |
| `WorkItemDossierLink`       | TypeScript | Link entity type                         |
| `DossierContextState`       | TypeScript | State management type                    |
| `DossierActivity`           | TypeScript | Timeline activity type                   |
