# Modular Monolith Architecture

This directory contains the modular monolith implementation for the Intl-Dossier application. Each module is a self-contained unit with clear boundaries and well-defined APIs.

## Architecture Overview

```
modules/
├── core/                   # Core module infrastructure
│   ├── types.ts           # Shared types across all modules
│   ├── contracts.ts       # Module interfaces and DTOs
│   ├── event-bus.ts       # Inter-module event communication
│   ├── registry.ts        # Module registry and lifecycle
│   └── index.ts           # Core exports
├── documents/             # Documents module
│   ├── types.ts          # Internal types
│   ├── repository.ts     # Data access layer
│   ├── service.ts        # Business logic
│   ├── module.ts         # Module implementation
│   └── index.ts          # Public API
├── relationships/         # Relationships module
│   ├── types.ts          # Internal types
│   ├── repository.ts     # Data access layer
│   ├── service.ts        # Business logic
│   ├── module.ts         # Module implementation
│   └── index.ts          # Public API
├── ai/                    # AI module
│   ├── types.ts          # Internal types
│   ├── service.ts        # AI service layer
│   ├── module.ts         # Module implementation
│   └── index.ts          # Public API
└── index.ts              # Main entry point
```

## Key Concepts

### 1. Module Contracts

Each module implements a contract interface defined in `core/contracts.ts`. This ensures:

- **Type safety**: All inter-module communication is type-checked
- **Loose coupling**: Modules depend on interfaces, not implementations
- **Testability**: Modules can be mocked easily for testing

```typescript
// Example: IDocumentModule contract
interface IDocumentModule extends IModule {
  getDocument(id: string, context: ModuleRequestContext): Promise<ModuleResult<DocumentDTO>>
  listDocuments(
    params: DocumentListParams,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<ModulePaginatedResponse<DocumentDTO>>>
  // ...
}
```

### 2. Event-Driven Communication

Modules communicate through events, not direct method calls:

```typescript
import { getEventBus, DOCUMENT_EVENTS } from '@/modules/core'

// Subscribe to events
const eventBus = getEventBus()
eventBus.subscribe(DOCUMENT_EVENTS.UPLOADED, (event) => {
  console.log('Document uploaded:', event.payload)
})

// Publish events
await eventBus.publish(createModuleEvent('document.uploaded', 'documents', { documentId: '123' }))
```

### 3. Module Registry

The registry manages module lifecycle and dependencies:

```typescript
import { getModuleRegistry } from '@/modules/core'

const registry = getModuleRegistry()

// Register modules
registry.register(documentModule)
registry.register(relationshipModule)
registry.register(aiModule)

// Initialize all modules (respects dependency order)
await registry.initializeAll()

// Get a module
const docs = registry.get<IDocumentModule>('documents')
```

### 4. Request Context

All module operations receive a context object for security and tracing:

```typescript
interface ModuleRequestContext {
  userId: string
  tenantId?: string
  locale: 'en' | 'ar'
  correlationId: string
  permissions?: string[]
}
```

## Usage Examples

### Accessing a Module

```typescript
import { getModule } from '@/modules/core'
import type { IDocumentModule } from '@/modules/core/contracts'

const documentsModule = getModule<IDocumentModule>('documents')

const context: ModuleRequestContext = {
  userId: user.id,
  locale: 'en',
  correlationId: generateCorrelationId(),
}

const result = await documentsModule.getDocument('doc-123', context)

if (result.success) {
  console.log('Document:', result.data)
} else {
  console.error('Error:', result.error.message)
}
```

### Cross-Module Communication

```typescript
import { getModule } from '@/modules/core'
import type { IDocumentModule, IRelationshipModule, IAIModule } from '@/modules/core/contracts'

// Get modules
const docs = getModule<IDocumentModule>('documents')
const relationships = getModule<IRelationshipModule>('relationships')
const ai = getModule<IAIModule>('ai')

// Get documents for an entity
const linkedDocs = await docs.getLinkedDocuments(
  { moduleId: 'engagements', entityType: 'dossier', entityId: '123' },
  context,
)

// Get relationships for the same entity
const entityRelationships = await relationships.getRelationshipsForEntity(
  { moduleId: 'engagements', entityType: 'dossier', entityId: '123' },
  context,
)

// Generate an AI brief using data from both modules
const brief = await ai.generateBrief(
  { moduleId: 'engagements', entityType: 'dossier', entityId: '123' },
  { includeDocuments: true, includeRelationships: true },
  context,
)
```

### React Integration

```tsx
import { useModuleInitialization, useModuleHealth, getModule } from '@/modules'
import type { IDocumentModule } from '@/modules/core/contracts'

function App() {
  const { isInitialized, error } = useModuleInitialization()

  if (error) {
    return <ErrorBoundary error={error} />
  }

  if (!isInitialized) {
    return <LoadingSpinner />
  }

  return <MainApp />
}

function DocumentViewer({ documentId }: { documentId: string }) {
  const documentsModule = getModule<IDocumentModule>('documents')

  const { data, error, isLoading } = useQuery({
    queryKey: ['document', documentId],
    queryFn: async () => {
      const result = await documentsModule.getDocument(documentId, getContext())
      if (!result.success) throw new Error(result.error.message)
      return result.data
    },
  })

  // ...
}
```

## Module Boundaries

### Documents Module

- **Owns**: Document storage, versions, classifications, links
- **Exports**: DocumentDTO, DOCUMENT_EVENTS
- **Depends on**: None

### Relationships Module

- **Owns**: Entity relationships, health scores, network graphs
- **Exports**: RelationshipDTO, RelationshipHealthDTO, NetworkGraphDTO, RELATIONSHIP_EVENTS
- **Depends on**: None

### AI Module

- **Owns**: Embeddings, semantic search, entity extraction, briefs, recommendations
- **Exports**: SemanticSearchResult, ExtractedEntity, BriefDTO, RecommendationDTO, AI_EVENTS
- **Depends on**: None (but uses other modules for context)

## Future Microservices Extraction

Each module is designed to be extractable as a separate microservice:

1. **Clear API boundaries**: All inter-module communication uses DTOs
2. **Event-driven**: Events can be routed through a message broker
3. **Independent data**: Each module has its own tables
4. **Stateless services**: No shared state between modules

To extract a module:

1. Create a new service with the module's code
2. Replace direct method calls with HTTP/gRPC
3. Replace in-memory event bus with message broker (e.g., Kafka)
4. Update the module registry to use remote proxies

## Best Practices

1. **Never access internal types**: Use DTOs from `core/contracts.ts`
2. **Always use the module interface**: Don't import from internal files
3. **Pass context to all operations**: Required for auth and tracing
4. **Handle errors with Result type**: Don't throw exceptions across boundaries
5. **Subscribe to events, don't poll**: Use the event bus for reactive updates
6. **Keep modules independent**: Avoid circular dependencies
