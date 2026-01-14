# Migration Guide: From Flat Structure to Bounded Contexts

This guide helps migrate existing code from the flat `/src/types`, `/src/hooks`, `/src/services` structure to the new bounded contexts architecture.

## Overview

The codebase has been reorganized into distinct bounded contexts:

| Context          | Purpose                               | New Location             |
| ---------------- | ------------------------------------- | ------------------------ |
| **Engagement**   | Engagements, participants, agenda     | `@/domains/engagement`   |
| **Document**     | Documents, versions, attachments      | `@/domains/document`     |
| **Relationship** | Dossier relationships, health scoring | `@/domains/relationship` |
| **Shared**       | Common types, utilities, errors       | `@/domains/shared`       |

## Migration Steps

### Step 1: Update Import Paths

#### Before (Legacy)

```typescript
// Types
import { EngagementDossier, EngagementType } from '@/types/engagement.types'
import { DocumentVersion } from '@/types/document-version.types'
import { RelationshipHealthScore } from '@/types/relationship-health.types'

// Hooks
import { useEngagements, useEngagement } from '@/hooks/useEngagements'
import { useDocuments } from '@/hooks/useDocuments'
import { useRelationships } from '@/hooks/useRelationships'

// Services/API
import { createRelationship } from '@/services/relationship-api'
```

#### After (New)

```typescript
// Engagement Context
import {
  EngagementDossier,
  EngagementType,
  useEngagements,
  useEngagement,
  engagementService,
} from '@/domains/engagement'

// Document Context
import { DocumentVersion, useDocuments, useDocument, documentService } from '@/domains/document'

// Relationship Context
import {
  RelationshipHealthScore,
  useRelationships,
  useRelationship,
  relationshipService,
} from '@/domains/relationship'

// Shared Kernel
import { DossierReference, DomainError, Result, ok, err } from '@/domains/shared'
```

### Step 2: Update Type References

Some type names have been clarified:

| Old Name                   | New Name                   | Context      |
| -------------------------- | -------------------------- | ------------ |
| `EngagementParticipant`    | `EngagementParticipant`    | engagement   |
| `RelationshipWithDossiers` | `RelationshipWithDossiers` | relationship |
| `HealthDossierReference`   | `HealthDossierReference`   | relationship |

### Step 3: Update Service Calls

#### Before (Direct API Calls)

```typescript
// Direct fetch calls
const response = await fetch(`${API_BASE_URL}/engagement-dossiers/${id}`)
const data = await response.json()
```

#### After (Service Layer)

```typescript
import { engagementService } from '@/domains/engagement'
import { isOk } from '@/domains/shared'

// Using service with Result type
const result = await engagementService.getEngagement(id)
if (isOk(result)) {
  const data = result.data
  // Use data...
} else {
  // Handle error
  console.error(result.error.message)
}
```

### Step 4: Update Query Key References

#### Before

```typescript
// Inline query keys
const queryKey = ['engagements', 'list', params]
```

#### After

```typescript
import { engagementKeys } from '@/domains/engagement'

// Centralized query keys
const queryKey = engagementKeys.list(params)
```

### Step 5: Update Error Handling

#### Before

```typescript
try {
  await someApiCall()
} catch (error) {
  toast.error(error.message)
}
```

#### After

```typescript
import { isDomainError, DomainError } from '@/domains/shared'

const result = await engagementService.createEngagement(data)
if (!isOk(result)) {
  if (isDomainError(result.error)) {
    // Handle domain-specific error
    toast.error(result.error.message)
  } else {
    // Handle unexpected error
    toast.error('An unexpected error occurred')
  }
}
```

## File Mapping Reference

### Engagement Context

| Old File                             | New Location                                 |
| ------------------------------------ | -------------------------------------------- |
| `types/engagement.types.ts`          | `domains/engagement/types/engagement.ts`     |
| `hooks/useEngagements.ts`            | `domains/engagement/hooks/useEngagements.ts` |
| `hooks/useEngagement.ts`             | `domains/engagement/hooks/useEngagements.ts` |
| `hooks/useEngagementParticipants.ts` | `domains/engagement/hooks/useEngagements.ts` |
| `hooks/useEngagementAgenda.ts`       | `domains/engagement/hooks/useEngagements.ts` |

### Document Context

| Old File                          | New Location                             |
| --------------------------------- | ---------------------------------------- |
| `types/document-version.types.ts` | `domains/document/types/version.ts`      |
| `types/document-preview.types.ts` | `domains/document/types/document.ts`     |
| `hooks/useDocuments.ts`           | `domains/document/hooks/useDocuments.ts` |
| `hooks/useDocumentVersions.ts`    | `domains/document/hooks/useDocuments.ts` |

### Relationship Context

| Old File                             | New Location                                                   |
| ------------------------------------ | -------------------------------------------------------------- |
| `types/relationship-health.types.ts` | `domains/relationship/types/health.ts`                         |
| `services/relationship-api.ts`       | `domains/relationship/repositories/relationship.repository.ts` |
| `hooks/useRelationships.ts`          | `domains/relationship/hooks/useRelationships.ts`               |
| `hooks/useRelationshipHealth.ts`     | `domains/relationship/hooks/useRelationships.ts`               |

## Common Migration Patterns

### Pattern 1: Converting Direct API Calls to Service Calls

```typescript
// Before: Direct API call with manual error handling
async function loadEngagement(id: string) {
  try {
    const response = await fetch(`${API_URL}/engagement-dossiers/${id}`)
    if (!response.ok) throw new Error('Failed to load')
    return await response.json()
  } catch (error) {
    console.error(error)
    throw error
  }
}

// After: Service call with Result type
async function loadEngagement(id: string) {
  const result = await engagementService.getEngagement(id)
  if (isOk(result)) {
    return result.data
  }
  // Error is already wrapped in DomainError
  throw result.error
}
```

### Pattern 2: Converting Inline Types to Imported Types

```typescript
// Before: Inline type definition
interface Engagement {
  id: string
  name_en: string
  // ...
}

// After: Import from context
import { EngagementDossier } from '@/domains/engagement'
```

### Pattern 3: Converting Labels to Centralized Constants

```typescript
// Before: Inline labels
const statusLabel = status === 'active' ? 'Active' : 'Inactive'

// After: Use centralized label functions
import { getEngagementStatusLabel } from '@/domains/engagement'
const statusLabel = getEngagementStatusLabel(status, 'en')
```

## Gradual Migration Strategy

1. **Phase 1**: Start with new features using bounded contexts
2. **Phase 2**: Migrate shared utilities and types to shared kernel
3. **Phase 3**: Migrate individual features one context at a time
4. **Phase 4**: Update existing components to use new imports
5. **Phase 5**: Remove deprecated files from old locations

## Deprecation Notice

The following files are now deprecated and should be migrated:

- `/src/types/engagement.types.ts` → Use `@/domains/engagement`
- `/src/types/document-version.types.ts` → Use `@/domains/document`
- `/src/types/relationship-health.types.ts` → Use `@/domains/relationship`
- `/src/hooks/useEngagements.ts` → Use `@/domains/engagement`
- `/src/hooks/useDocuments.ts` → Use `@/domains/document`
- `/src/hooks/useRelationships.ts` → Use `@/domains/relationship`
- `/src/services/relationship-api.ts` → Use `@/domains/relationship`

## Need Help?

For questions about this migration, refer to:

- `@/domains/README.md` - Architecture overview
- `@/domains/context-map.ts` - Context relationships
- Individual context `index.ts` files for available exports
