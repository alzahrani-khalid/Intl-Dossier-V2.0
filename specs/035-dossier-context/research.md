# Research: Smart Dossier Context Inheritance

**Feature**: 035-dossier-context
**Date**: 2025-01-16
**Phase**: 0 - Research

## Overview

This document captures research findings for implementing smart dossier context inheritance. All "NEEDS CLARIFICATION" items from the Technical Context have been resolved.

---

## 1. React Context with URL Sync

### Decision

Use TanStack Router's `useSearch` hook as the canonical source of truth, with a thin React Context wrapper for shared actions and derived state.

### Rationale

- TanStack Router v5 treats search params as first-class state with type safety via Zod validation
- Built-in support for deep-linking, browser history, and selective re-renders
- Avoids dual state management complexity (Context state vs URL state)

### Alternatives Considered

| Alternative                 | Why Rejected                                     |
| --------------------------- | ------------------------------------------------ |
| React Context only          | No URL sync; links not shareable                 |
| useState + manual URL sync  | Dual state; prone to sync bugs                   |
| Zustand with URL middleware | Over-engineering; TanStack already provides this |

### Implementation Pattern

```typescript
// Route definition with validated search params
const dossierSearchSchema = z.object({
  dossierId: z.string().optional(),
  inheritedFrom: z.enum(['direct', 'engagement', 'after_action']).optional(),
  viewMode: z.enum(['timeline', 'grid']).optional().default('timeline'),
});

// Context provides actions, URL is source of truth
const DossierContext = createContext<{
  dossierId: string | null;
  inheritedFrom: string | null;
  selectDossier: (id: string) => void;
  clearSelection: () => void;
} | null>(null);

function DossierProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const search = useSearch({ from: '/dossiers', strict: false });
  const navigate = useNavigate({ from: '/dossiers' });

  const selectDossier = useCallback((id: string) => {
    navigate({ search: (prev) => ({ ...prev, dossierId: id }) });
  }, [navigate]);

  const clearSelection = useCallback(() => {
    navigate({ search: (prev) => ({ ...prev, dossierId: undefined }) });
  }, [navigate]);

  const value = useMemo(() => ({
    dossierId: search.dossierId || null,
    inheritedFrom: search.inheritedFrom || null,
    selectDossier,
    clearSelection,
  }), [search.dossierId, search.inheritedFrom, selectDossier, clearSelection]);

  return (
    <DossierContext.Provider value={value}>
      <div dir={isRTL ? 'rtl' : 'ltr'}>{children}</div>
    </DossierContext.Provider>
  );
}
```

### Key Learnings

- Use `select` option in `useSearch` to minimize re-renders
- Debounce high-frequency URL updates (300ms)
- Always validate deep-link dossier IDs before rendering

---

## 2. Junction Table Design with Inheritance Tracking

### Decision

Create `work_item_dossiers` junction table with polymorphic work_item_type and explicit inheritance source tracking via JSONB.

### Rationale

- Single table handles all work item types (task, commitment, intake)
- Inheritance source stored at creation time for zero-cost retrieval
- JSONB `inheritance_path` avoids recursive queries for display

### Schema Design

```sql
CREATE TABLE work_item_dossiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Polymorphic work item reference
  work_item_type TEXT NOT NULL CHECK (work_item_type IN ('task', 'commitment', 'intake')),
  work_item_id UUID NOT NULL,

  -- Dossier reference
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,

  -- Inheritance tracking
  inheritance_source TEXT NOT NULL DEFAULT 'direct' CHECK (inheritance_source IN (
    'direct', 'engagement', 'after_action', 'position', 'mou'
  )),
  inherited_from_type TEXT,
  inherited_from_id UUID,
  inheritance_path JSONB DEFAULT '[]'::jsonb,

  -- Multi-dossier support
  display_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,

  -- Audit
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  _version INTEGER NOT NULL DEFAULT 1,

  -- Constraints
  CONSTRAINT unique_work_item_dossier UNIQUE (work_item_type, work_item_id, dossier_id)
    WHERE deleted_at IS NULL
);
```

### Index Strategy

| Index                    | Purpose             | Query Pattern                                                          |
| ------------------------ | ------------------- | ---------------------------------------------------------------------- |
| `idx_dossier_active`     | Timeline fetch      | `WHERE dossier_id = ? AND deleted_at IS NULL ORDER BY created_at DESC` |
| `idx_work_item_active`   | Context resolution  | `WHERE work_item_type = ? AND work_item_id = ?`                        |
| `idx_inheritance_source` | Analytics/filtering | `WHERE dossier_id = ? AND inheritance_source = ?`                      |
| `idx_cursor`             | Pagination          | `WHERE dossier_id = ? AND created_at < ? ORDER BY created_at DESC`     |

### RLS Policy Pattern

```sql
CREATE POLICY work_item_dossiers_select ON work_item_dossiers
FOR SELECT USING (
  -- Dossier access check (sensitivity-based)
  EXISTS (
    SELECT 1 FROM dossiers d
    WHERE d.id = dossier_id
    AND get_user_clearance_level(auth.uid()) >=
      CASE d.sensitivity_level
        WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3
      END
  )
  AND
  -- Polymorphic work item access check
  CASE work_item_type
    WHEN 'task' THEN work_item_id IN (
      SELECT id FROM tasks WHERE assigned_to = auth.uid() OR created_by = auth.uid()
    )
    WHEN 'commitment' THEN work_item_id IN (
      SELECT id FROM commitments WHERE owner_internal_id = auth.uid()
    )
    WHEN 'intake' THEN work_item_id IN (
      SELECT id FROM intake_tickets WHERE created_by = auth.uid()
        OR assigned_to = auth.uid()
    )
  END
);
```

---

## 3. Edge Function Performance Optimization

### Decision

Create `resolve-dossier-context` Edge Function with global client caching, single JOINed query, and PostgreSQL RPC for complex chains.

### Rationale

- Global Supabase client eliminates ~500ms cold start overhead
- Single query with relational JOINs achieves 15-25ms database time
- RLS automatically filters in the same query (0 additional latency)

### Performance Budget (100ms target)

| Component                 | Time (ms)   | Notes               |
| ------------------------- | ----------- | ------------------- |
| Function initialization   | 5-10        | Global client reuse |
| Auth header parsing       | 2-5         | JWT validation      |
| DB query round-trip       | 15-25       | Single JOINed query |
| RLS evaluation            | 0-5         | Built into query    |
| Response serialization    | 2-5         | JSON.stringify      |
| Network latency           | 10-20       | Variable            |
| **Total warm invocation** | **45-70ms** | Well under 100ms    |

### Query Pattern for Context Resolution

```typescript
// Engagement → Dossier (direct)
const { data } = await client
  .from('engagements')
  .select(
    `
    id,
    dossier:dossier_id (
      id, name_en, name_ar, type, status
    )
  `
  )
  .eq('id', engagementId)
  .single();

// After-Action → Engagement → Dossier (chain)
const { data } = await client
  .from('after_action_records')
  .select(
    `
    id,
    engagement:engagement_id (
      id,
      dossier:dossier_id (
        id, name_en, name_ar, type, status
      )
    )
  `
  )
  .eq('id', afterActionId)
  .single();
```

### Permission Filtering Pattern

- RLS policies automatically filter queries
- If dossier field is null after query, user lacks permission
- Fallback: Show dossier selector for manual selection

### PostgreSQL RPC for Complex Resolution

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
  inheritance_source TEXT,
  resolution_path UUID[]
) AS $$
BEGIN
  IF p_entity_type = 'engagement' THEN
    RETURN QUERY
    SELECT d.id, d.name_en, d.name_ar, d.type, 'direct'::TEXT, ARRAY[p_entity_id, d.id]
    FROM engagements e JOIN dossiers d ON e.dossier_id = d.id
    WHERE e.id = p_entity_id;
  ELSIF p_entity_type = 'after_action' THEN
    RETURN QUERY
    SELECT d.id, d.name_en, d.name_ar, d.type, 'via_engagement'::TEXT,
           ARRAY[p_entity_id, e.id, d.id]
    FROM after_action_records aa
    JOIN engagements e ON aa.engagement_id = e.id
    JOIN dossiers d ON e.dossier_id = d.id
    WHERE aa.id = p_entity_id;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;
```

---

## 4. Activity Timeline Query Pattern

### Decision

Use PostgreSQL VIEW with polymorphic LEFT JOINs for unified timeline, cursor-based pagination for performance.

### Query Pattern

```sql
CREATE VIEW dossier_activity_timeline AS
SELECT
  wid.id as link_id,
  wid.work_item_id,
  wid.work_item_type,
  wid.dossier_id,
  wid.inheritance_source,
  wid.created_at as activity_timestamp,

  -- Polymorphic title extraction
  COALESCE(t.title, c.description, it.title) as activity_title,

  -- Status/priority (polymorphic)
  CASE wid.work_item_type
    WHEN 'task' THEN t.status
    WHEN 'commitment' THEN c.status::TEXT
    WHEN 'intake' THEN it.status::TEXT
  END as status,

  -- Inheritance label for badge
  CASE wid.inheritance_source
    WHEN 'direct' THEN NULL
    WHEN 'engagement' THEN 'via ' || e.title
    WHEN 'after_action' THEN 'via After-Action'
  END as inheritance_label

FROM work_item_dossiers wid
LEFT JOIN tasks t ON wid.work_item_type = 'task' AND t.id = wid.work_item_id
LEFT JOIN commitments c ON wid.work_item_type = 'commitment' AND c.id = wid.work_item_id
LEFT JOIN intake_tickets it ON wid.work_item_type = 'intake' AND it.id = wid.work_item_id
LEFT JOIN engagements e ON wid.inherited_from_type = 'engagement'
  AND e.id = wid.inherited_from_id
WHERE wid.deleted_at IS NULL;
```

### Performance Expectation

- Timeline queries: ~18-22ms for 100K rows
- Cursor pagination: Use `(created_at, id)` tuple for stable cursors
- Target: <2s page load for 500 activities

---

## 5. Existing Codebase Patterns

### Current Context Pattern (`auth.context.tsx`)

- Simple React Context with Provider
- Wraps Zustand store
- Memoized context value

### Current Creation Context (`useCreationContext.ts`)

- Detects entity type from URL pathname via regex
- Extracts entity ID from URL
- Does NOT follow inheritance chains (gap to address)

### Existing Timeline Components

- `DeliverablesTimeline` - chronological deliverables
- `TimelineEvent` type exists in `dossier.ts`
- No unified dossier activity timeline (gap to address)

### Hooks Reference

- `useDossier()`, `useDossiers()` - TanStack Query patterns
- Query key factories for cache invalidation
- Optimistic update patterns in mutations

---

## 6. Mobile-First & RTL Patterns

### Required Patterns (from CLAUDE.md)

```typescript
const isRTL = i18n.language === 'ar';

// Container
<div dir={isRTL ? 'rtl' : 'ltr'} className="px-4 sm:px-6 lg:px-8">

// Logical properties only
className="ms-4 me-4 ps-4 pe-4 text-start"

// Icon flipping for directional icons
<ChevronRight className={isRTL ? 'rotate-180' : ''} />

// Touch targets
className="min-h-11 min-w-11"
```

---

## Summary: Resolved Clarifications

| Item                      | Resolution                                     |
| ------------------------- | ---------------------------------------------- |
| URL state sync pattern    | TanStack Router `useSearch` as source of truth |
| Junction table design     | Polymorphic with inheritance_source tracking   |
| Performance target        | 45-70ms warm invocations (under 100ms)         |
| RLS for polymorphic types | CASE-based subqueries in policy                |
| Timeline aggregation      | PostgreSQL VIEW with LEFT JOINs                |
| Cursor pagination         | `(created_at, id)` tuple                       |

All technical unknowns have been resolved. Ready for Phase 1: Design & Contracts.
