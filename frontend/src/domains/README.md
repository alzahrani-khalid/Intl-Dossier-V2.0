# Bounded Contexts Architecture

This directory organizes the codebase into distinct bounded contexts following Domain-Driven Design (DDD) principles. Each context has its own models, repositories, services, and explicit contracts defining how they interact.

## Directory Structure

```
domains/
├── shared/                     # Shared Kernel - cross-context types and utilities
│   ├── types/                  # Common types used across contexts
│   ├── contracts/              # Integration contracts and events
│   ├── errors/                 # Domain error types
│   └── utils/                  # Shared utilities
│
├── engagement/                 # Engagement Bounded Context
│   ├── types/                  # Engagement domain types
│   ├── models/                 # Domain models and entities
│   ├── repositories/           # Data access abstraction
│   ├── services/               # Domain services
│   ├── api/                    # API client layer
│   ├── hooks/                  # React Query hooks
│   ├── components/             # Context-specific components
│   └── index.ts                # Public API barrel export
│
├── document/                   # Document Bounded Context
│   ├── types/                  # Document domain types
│   ├── models/                 # Domain models and entities
│   ├── repositories/           # Data access abstraction
│   ├── services/               # Domain services
│   ├── api/                    # API client layer
│   ├── hooks/                  # React Query hooks
│   ├── components/             # Context-specific components
│   └── index.ts                # Public API barrel export
│
├── relationship/               # Relationship Bounded Context
│   ├── types/                  # Relationship domain types
│   ├── models/                 # Domain models and entities
│   ├── repositories/           # Data access abstraction
│   ├── services/               # Domain services
│   ├── api/                    # API client layer
│   ├── hooks/                  # React Query hooks
│   ├── components/             # Context-specific components
│   └── index.ts                # Public API barrel export
│
└── context-map.ts              # Explicit context interaction definitions
```

## Context Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CONTEXT MAP                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐     │
│  │   ENGAGEMENT    │      │    DOCUMENT     │      │  RELATIONSHIP   │     │
│  │    CONTEXT      │      │    CONTEXT      │      │    CONTEXT      │     │
│  ├─────────────────┤      ├─────────────────┤      ├─────────────────┤     │
│  │ • Engagements   │──────│ • Documents     │      │ • Relationships │     │
│  │ • Participants  │      │ • Versions      │      │ • Health Scores │     │
│  │ • Agenda Items  │      │ • Attachments   │      │ • Alerts        │     │
│  └────────┬────────┘      └────────┬────────┘      └────────┬────────┘     │
│           │                        │                        │               │
│           │                        │                        │               │
│           └────────────┬───────────┴───────────┬────────────┘               │
│                        │                       │                            │
│                        ▼                       │                            │
│               ┌─────────────────┐              │                            │
│               │  SHARED KERNEL  │◄─────────────┘                            │
│               ├─────────────────┤                                           │
│               │ • DossierRef    │                                           │
│               │ • EntityLink    │                                           │
│               │ • AuditInfo     │                                           │
│               │ • Pagination    │                                           │
│               │ • Result<T,E>   │                                           │
│               └─────────────────┘                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Integration Patterns

### 1. Upstream/Downstream Relationships

| Upstream Context | Downstream Context | Integration Pattern   |
| ---------------- | ------------------ | --------------------- |
| Engagement       | Document           | Published Language    |
| Engagement       | Relationship       | Published Language    |
| Relationship     | Engagement         | Conformist            |
| Document         | Engagement         | Anti-Corruption Layer |

### 2. Shared Kernel

The shared kernel contains:

- **DossierReference**: Compact entity reference used across contexts
- **EntityLink**: Polymorphic linking between any entity types
- **AuditInfo**: Standard audit trail fields
- **Pagination**: Cursor-based pagination types
- **Result<T, E>**: Type-safe error handling

### 3. Event Contracts

Contexts communicate through typed events:

```typescript
// Engagement publishes
;(EngagementCreated, EngagementUpdated, ParticipantAdded)

// Document publishes
;(DocumentUploaded, VersionCreated, DocumentLinked)

// Relationship publishes
;(RelationshipCreated, HealthScoreUpdated, AlertTriggered)
```

## Usage Guidelines

### Importing from Contexts

Always import from the context's public API:

```typescript
// ✅ Correct - import from context barrel
import { useEngagements, EngagementDossier } from '@/domains/engagement'
import { useDocuments, DocumentVersion } from '@/domains/document'
import { useRelationships, RelationshipHealthScore } from '@/domains/relationship'

// ❌ Incorrect - deep imports break encapsulation
import { EngagementDossier } from '@/domains/engagement/types/engagement'
```

### Cross-Context Communication

Never directly import types/services from another context. Use the shared kernel:

```typescript
// ✅ Correct - use shared types
import { DossierReference, EntityLink } from '@/domains/shared'

// ❌ Incorrect - cross-context dependency
import { EngagementDossier } from '@/domains/engagement'
// inside relationship context
```

### Adding New Features

1. Identify which context owns the feature
2. Add types to the context's `types/` directory
3. Add repository methods if needed
4. Add service logic if complex
5. Create hooks for React integration
6. Export via the context's `index.ts`

## Migration from Legacy Structure

See `MIGRATION_GUIDE.md` for details on migrating existing code to bounded contexts.
