# Intl-DossierV2.0 Consolidated Action Plan

**Generated:** 2025-01-23
**Status:** Active

---

## Executive Summary

This action plan consolidates findings from multiple code reviews into prioritized, actionable tasks. The codebase is mature (730+ components, 84,000+ lines of migrations) but has opportunities in:

- **Security & Infrastructure** (critical fixes)
- **RTL/Mobile Compliance** (architecture violations)
- **Performance Optimization** (bundle splitting, indexes, caching)
- **Code Quality** (component consolidation, testing, documentation)

---

## Priority Matrix

| Priority | Timeline    | Description                                 |
| -------- | ----------- | ------------------------------------------- |
| **P0**   | Immediate   | Security vulnerabilities, breaking CI/CD    |
| **P1**   | This Sprint | Architecture violations, critical UX issues |
| **P2**   | Next Sprint | Performance optimizations, tech debt        |
| **P3**   | Backlog     | Features, nice-to-haves                     |

---

## P0 - Critical (Security & CI/CD Fixes)

### P0.1 - Remove Insecure JWT Default Secret

**File:** `backend/src/middleware/auth.ts` (line 22)
**Issue:** Hardcoded fallback secret in authentication
**Action:**

```typescript
// REMOVE THIS:
const JWT_SECRET = process.env.JWT_SECRET || 'insecure-default';

// REPLACE WITH:
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
```

### P0.2 - Add Missing Foreign Key Constraints

**Issue:** Missing `ON DELETE SET NULL` for `created_by`/`updated_by` columns
**Action:** Create migration:

```sql
-- Migration: add_fk_constraints_user_references
ALTER TABLE tasks
  ADD CONSTRAINT fk_tasks_created_by
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE commitments
  ADD CONSTRAINT fk_commitments_created_by
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Repeat for all tables with created_by/updated_by
```

### P0.3 - Fix Node Version Alignment

**Files:** `.github/workflows/ci.yml`, `package.json`
**Issue:** CI requires Node 20.19.0 but engines allow >=18
**Action:**

```json
// package.json
{
  "engines": {
    "node": ">=20.19.0"
  }
}
```

### P0.4 - Fix Turborepo Script Mismatches

**Issue:** Root scripts don't match package scripts
**Action:** Update `package.json`:

```json
{
  "scripts": {
    "typecheck": "turbo run type-check",
    "test:e2e": "turbo run test:e2e",
    "db:migrate": "turbo run migrate"
  }
}
```

### P0.5 - Fix Deploy Staging Gate

**File:** `.github/workflows/deploy.yml`
**Issue:** Workflow triggers on `main` but staging job checks for `develop`
**Action:** Align branch conditions or add proper environment gates

### P0.6 - Consolidate Rate Limiting

**Files:** `backend/src/middleware/security.ts`, `backend/src/middleware/rateLimiter.ts`
**Issue:** Conflicting rate limiting implementations
**Action:** Keep one implementation, remove duplicate, update imports in `index.ts`

### P0.7 - Remove Test Credentials from Code

**Issue:** Hardcoded credentials `kazahrani@stats.gov.sa` in tests
**Action:** Use environment variables or test fixtures

---

## P1 - High Priority (Architecture & UX)

### P1.1 - RTL/Mobile-First Compliance Audit

**Issue:** ~30+ components use directional CSS instead of logical properties
**Files to Fix:**

- `frontend/src/components/ui/alert-dialog.tsx`
- `frontend/src/components/ui/dialog.tsx`
- `frontend/src/components/ui/select.tsx`
- `frontend/src/components/ui/dropdown-menu.tsx`
- `frontend/src/components/ui/navigation-menu.tsx`

**Replacements:**
| Avoid | Use Instead |
|-------|-------------|
| `ml-*` | `ms-*` |
| `mr-*` | `me-*` |
| `pl-*` | `ps-*` |
| `pr-*` | `pe-*` |
| `text-left` | `text-start` |
| `text-right` | `text-end` |
| `left-*` | `start-*` |
| `right-*` | `end-*` |
| `rounded-l-*` | `rounded-s-*` |
| `rounded-r-*` | `rounded-e-*` |

**Audit Command:**

```bash
grep -r "ml-\|mr-\|pl-\|pr-\|text-left\|text-right\|left-\|right-" \
  --include="*.tsx" frontend/src/components
```

### P1.2 - Elevate Dossiers in Navigation

**File:** `frontend/src/components/Layout/navigation-config.ts`
**Issue:** Dossiers should be primary navigation, not buried
**New Structure:**

```
Dossiers (Primary Hub)
├── All Dossiers
├── By Type (Countries, Organizations, Forums, ...)
├── Relationship Graph
└── Recent Activity
```

### P1.3 - Component Consolidation (Cards)

**Issue:** 10+ card variants causing duplication
**Components to Merge:**

- `DossierCard`
- `UniversalDossierCard`
- `PersonCard`
- `DossierAceternityCard`
- `CountryCard`, `OrganizationCard`, etc.

**Target:** Single `BaseCard` with composition pattern

```tsx
// New pattern
<BaseCard variant="dossier" size="md">
  <BaseCard.Header icon={<DossierIcon />} />
  <BaseCard.Content>{/* Type-specific content */}</BaseCard.Content>
  <BaseCard.Actions>{/* Contextual actions */}</BaseCard.Actions>
</BaseCard>
```

### P1.4 - State Management Consolidation

**Issue:** Auth uses both Zustand (`authStore.ts`) AND Context (`auth.context.tsx`)
**Action:** Choose ONE pattern:

- Zustand for global app state
- Context for component-tree-scoped state
- Remove duplicate auth implementations

### P1.5 - Enhanced Dossier Context Provider

**File:** Create `frontend/src/contexts/EnhancedDossierContext.tsx`
**Features:**

- `pinnedDossiers` array (persisted to localStorage)
- `recentDossiers` (last 10 visited)
- `resolveContextFromUrl()` for deep linking
- `inheritContextFromParent()` for work item creation

### P1.6 - RLS Policy Performance

**Issue:** Current policies use subqueries per row
**Action:** Create `SECURITY DEFINER` helper functions:

```sql
CREATE OR REPLACE FUNCTION get_user_clearance_level(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN (SELECT clearance_level FROM user_profiles WHERE id = user_id);
END;
$$;
```

---

## P2 - Medium Priority (Performance & Quality)

### P2.1 - Route-Based Code Splitting

**File:** `frontend/vite.config.ts`
**Issue:** Single vendor chunk (~2-3MB)
**Action:**

```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: (id) => {
        if (id.includes('node_modules')) {
          if (id.includes('react') || id.includes('react-dom')) return 'react-vendor';
          if (id.includes('@tanstack')) return 'tanstack-vendor';
          if (id.includes('framer-motion')) return 'motion-vendor';
          if (id.includes('@radix-ui')) return 'radix-vendor';
          if (id.includes('recharts') || id.includes('d3')) return 'charts-vendor';
          return 'vendor';
        }
      };
    }
  }
}
```

### P2.2 - Add Missing Database Indexes

**Migration:**

```sql
-- Work item dossiers composite index
CREATE INDEX IF NOT EXISTS idx_work_item_dossiers_composite
  ON work_item_dossiers(dossier_id, work_item_type, created_at DESC)
  WHERE deleted_at IS NULL;

-- Tasks deadline + assignee
CREATE INDEX IF NOT EXISTS idx_tasks_deadline_assignee
  ON tasks(deadline NULLS LAST, assignee_id, status)
  WHERE is_deleted = false AND deadline IS NOT NULL;

-- Dossiers common filters
CREATE INDEX IF NOT EXISTS idx_dossiers_sensitivity_status
  ON dossiers(sensitivity_level, status, is_active);

-- Calendar events
CREATE INDEX IF NOT EXISTS idx_calendar_events_dossier_date
  ON calendar_events(dossier_id, start_datetime);
```

### P2.3 - Dossier Statistics Materialized View

**Migration:**

```sql
CREATE MATERIALIZED VIEW dossier_statistics AS
SELECT
  d.id as dossier_id,
  d.type,
  COUNT(DISTINCT wid.id) FILTER (WHERE wid.work_item_type = 'task') as task_count,
  COUNT(DISTINCT wid.id) FILTER (WHERE wid.work_item_type = 'commitment') as commitment_count,
  COUNT(DISTINCT wid.id) FILTER (WHERE wid.work_item_type = 'intake') as intake_count,
  MAX(wid.created_at) as last_activity
FROM dossiers d
LEFT JOIN work_item_dossiers wid ON wid.dossier_id = d.id
GROUP BY d.id, d.type;

-- Refresh trigger with 30s debounce
CREATE INDEX idx_dossier_statistics_id ON dossier_statistics(dossier_id);
```

### P2.4 - Component Test Coverage

**Target:** 50% coverage for `/components/`
**Priority Components:**

1. `UnifiedKanbanBoard`
2. `UniversalDossierCard`
3. `CommitmentCard`
4. All form components (validation logic)
5. Query hooks (`use-tasks.ts`, `useIntakeApi.ts`)

**Pattern:**

```tsx
// ComponentName.test.tsx
import { render, screen } from '@testing-library/react';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByRole('...')).toBeInTheDocument();
  });
});
```

### P2.5 - Edge Function Documentation

**Create:** `docs/api/edge-functions.md`
**Include for each function:**

- Request/response schemas
- Authentication requirements
- Example requests
- Error codes

### P2.6 - Edge Function Error Handling Standardization

**Standard Response Format:**

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  status: number;
}
```

### P2.7 - Input Validation with Zod

**Issue:** Some endpoints lack validation (e.g., `limit` could be negative)
**Action:** Add Zod schemas to all Edge Functions:

```typescript
const querySchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});
```

### P2.8 - Graph Visualization Consolidation

**Issue:** 3 variants exist
**Merge Into:** Single component with feature flags

- `GraphVisualization` (base)
- `EnhancedGraphVisualization`
- `AdvancedGraphVisualization`

### P2.9 - Query Key Factory Standardization

**Create:** `frontend/src/lib/query-keys.ts`

```typescript
export const queryKeys = {
  dossiers: {
    all: ['dossiers'] as const,
    list: (filters: DossierFilters) => ['dossiers', 'list', filters] as const,
    detail: (id: string) => ['dossiers', 'detail', id] as const,
  },
  tasks: {
    // ...
  },
};
```

### P2.10 - Aceternity UI Component Migration

**Priority Migrations:**

1. Dashboard cards → Bento Grid
2. Standard inputs → Vanish Input for key forms
3. User avatars → Animated Tooltip
4. Navigation → Floating Navbar

**Install Commands:**

```bash
npx shadcn@latest add "https://ui.aceternity.com/registry/bento-grid.json" --yes
npx shadcn@latest add "https://ui.aceternity.com/registry/floating-navbar.json" --yes
```

### P2.11 - Mobile WatermelonDB Schema Updates

**Files:** `mobile/database/schema.ts`, `mobile/database/models/`
**Add:**

- `elected_officials` table
- `work_item_dossiers` junction table
- Update sync service for incremental sync

---

## P3 - Backlog (Features & Enhancements)

### P3.1 - Dossier Activity Feed API

**Create:** `supabase/functions/dossier-activity/index.ts`
**Response:**

```typescript
interface DossierActivityResponse {
  activities: Array<{
    id: string;
    type: 'task' | 'commitment' | 'position' | 'event' | 'relationship';
    action: 'created' | 'updated' | 'completed' | 'linked';
    title: string;
    timestamp: string;
    actor: { id: string; name: string };
  }>;
  pagination: { cursor: string; hasMore: boolean };
}
```

### P3.2 - "Everything About X" Query

**Create:** `frontend/src/components/Dossier/DossierEverythingView.tsx`
**Aggregates:**

- Related dossiers (via `dossier_relationships`)
- Documents (positions, MOUs, briefs)
- Work items (via `work_item_dossiers`)
- Calendar events

### P3.3 - Redis Cache for Search Suggestions

**File:** `backend/src/services/redis-cache.service.ts`
**Cache Keys:**

- `search:suggestions:{query_prefix}` (TTL: 5 min)
- `search:recent:{user_id}` (TTL: 24 hours)

### P3.4 - Onboarding Tour

**File:** `frontend/src/components/guided-tours/tour-definitions.ts`
**Steps:**

1. "Welcome to GASTAT International Dossier"
2. "Your Dossiers" (highlight sidebar)
3. "Work Flows Through Dossiers" (demonstrate task creation)

### P3.5 - Batch Operations Progress UI

**Issue:** Hooks exist but no progress UI
**Create:** Progress tracking component for bulk operations

### P3.6 - Search History & Saved Templates

**Issue:** Advanced search lacks persistence
**Add:**

- Save frequent searches
- Show search history
- Template management

### P3.7 - Duplicate Contact Detection

**File:** `duplicate-detection-service.ts`
**Implement:** pg_trgm/Levenshtein + merge workflow

### P3.8 - MoU Milestone Notifications

**File:** `MoUService.ts` (line 392)
**Implement:** Status transition + deliverables completed notifications

### P3.9 - Offline Support (Service Worker)

**Hooks Exist:** `useOfflineState`, `offline-queue.ts`
**Action:** Full implementation

### P3.10 - Real-time Collaboration

**File:** `usePresence.ts.disabled`
**Action:** Re-enable presence tracking

### P3.11 - CONTRIBUTING.md

**Create:** `CONTRIBUTING.md`
**Include:**

- Git workflow
- Code style guide
- PR process
- Testing requirements

### P3.12 - Storybook Coverage

**Issue:** Only 2 stories exist for 69 UI components
**Target:** Stories for all reusable components

---

## Documentation Priorities

| Document                      | Priority | Status  |
| ----------------------------- | -------- | ------- |
| Edge Functions Catalog        | P2       | Missing |
| CONTRIBUTING.md               | P3       | Missing |
| Troubleshooting Guide         | P3       | Missing |
| OpenAPI Spec (full)           | P3       | Partial |
| Architecture Decision Records | P3       | Missing |

---

## Immediate Action Items (Next 2 Weeks)

### Week 1

- [ ] P0.1 - Remove insecure JWT default
- [ ] P0.2 - Add FK constraints migration
- [ ] P0.3 - Fix Node version alignment
- [ ] P0.4 - Fix Turborepo script mismatches
- [ ] P0.6 - Consolidate rate limiting
- [ ] P1.1 - RTL compliance audit (5 critical files)

### Week 2

- [ ] P0.5 - Fix deploy staging gate
- [ ] P0.7 - Remove test credentials
- [ ] P1.2 - Elevate dossiers in navigation
- [ ] P1.6 - RLS helper functions
- [ ] P2.2 - Add missing indexes

---

## Tracking

| Category      | Total Tasks | P0    | P1    | P2     | P3     |
| ------------- | ----------- | ----- | ----- | ------ | ------ |
| Security      | 4           | 3     | 1     | 0      | 0      |
| CI/CD         | 3           | 3     | 0     | 0      | 0      |
| Architecture  | 6           | 0     | 4     | 2      | 0      |
| Performance   | 6           | 0     | 1     | 5      | 0      |
| Code Quality  | 8           | 1     | 2     | 5      | 0      |
| Documentation | 5           | 0     | 0     | 1      | 4      |
| Features      | 12          | 0     | 0     | 2      | 10     |
| **Total**     | **44**      | **7** | **8** | **15** | **14** |
