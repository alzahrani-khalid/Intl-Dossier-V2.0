# Dossier-centric patterns — deep dive

This is the deep-dive companion to the `dossier-centric-link` skill. Load this when:

- Designing a new feature that needs to know which dossier types apply
- Writing a migration that links a new entity to dossiers
- Building a UI card that displays a work item's dossier context

## Dossier-Centric Development Patterns (MANDATORY)

The system is built around **dossiers** as the central organizing concept. All features should connect to dossiers.

### Core Principle

**"Everything starts with a Dossier"** - When building new features:

1. Identify which dossier type(s) the feature relates to
2. Use `work_item_dossiers` for task/commitment/intake linking
3. Show dossier context via `DossierContextBadge` component
4. Include dossier in activity timelines

### Dossier Types (8 total)

| Type               | Description                                   |
| ------------------ | --------------------------------------------- |
| `country`          | Nation states with diplomatic relations       |
| `organization`     | International bodies, agencies, ministries    |
| `forum`            | Multi-party conferences and summits           |
| `engagement`       | Diplomatic meetings, consultations, visits    |
| `topic`            | Policy areas and strategic initiatives        |
| `working_group`    | Committees and task forces                    |
| `person`           | VIPs requiring tracking                       |
| `elected_official` | Government contacts with office/term metadata |

### Key Utilities & Functions

```typescript
// URL generation for dossier routes
import { getDossierRouteSegment } from '@/lib/dossier-routes'
const route = getDossierRouteSegment('country') // Returns 'countries'

// Type validation
import { isValidDossierType } from '@/lib/dossier-type-guards'
if (isValidDossierType(type)) {
  /* type-safe usage */
}

// Dossier context inheritance hook
import { useResolveDossierContext } from '@/hooks/useResolveDossierContext'
const { dossiers, inheritanceSource } = useResolveDossierContext(parentType, parentId)
```

### Component Usage

```tsx
// Display dossier context badge on work items
import { DossierContextBadge } from '@/components/Dossier/DossierContextBadge'
;<DossierContextBadge
  dossier={dossier}
  inheritanceSource="direct" // or 'engagement', 'after_action', etc.
/>

// Universal card for any dossier type
import { UniversalDossierCard } from '@/components/Dossier/UniversalDossierCard'
;<UniversalDossierCard dossier={dossier} />

// Type selector for dossier creation
import { DossierTypeSelector } from '@/components/Dossier/DossierTypeSelector'
;<DossierTypeSelector value={type} onChange={setType} />
```

### Database Linking Pattern

Work items connect to dossiers via the `work_item_dossiers` junction table:

```sql
-- Link work items to dossiers with inheritance tracking
INSERT INTO work_item_dossiers (work_item_id, dossier_id, inheritance_source)
VALUES (
  'task-uuid',
  'country-dossier-uuid',
  'direct'  -- or 'engagement', 'after_action', 'position', 'mou'
);
```

### Architecture Documentation

For comprehensive details, see:

- [Dossier-Centric Architecture](./docs/DOSSIER_CENTRIC_ARCHITECTURE.md) - Complete system design
- Section 2: Dossier Connections Map
- Section 5: 13 Improvement Recommendations with priority matrix
