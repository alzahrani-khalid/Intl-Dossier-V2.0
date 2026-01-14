# Ports and Adapters Architecture

This document describes the hexagonal (ports and adapters) architecture implemented in this codebase.

## Overview

The hexagonal architecture separates core business logic from external dependencies through well-defined interfaces (ports) and their implementations (adapters).

```
┌─────────────────────────────────────────────────────────────────┐
│                         External World                          │
│  (HTTP Requests, Database, Cache, External APIs, File Storage)  │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                           ADAPTERS                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Supabase      │  │     Redis       │  │    Winston      │ │
│  │   Repository    │  │     Cache       │  │    Logger       │ │
│  │   Adapters      │  │     Adapter     │  │    Adapter      │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
└───────────┼────────────────────┼────────────────────┼───────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                            PORTS                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  IRepository    │  │   ICachePort    │  │  ILoggerPort    │ │
│  │   interfaces    │  │                 │  │                 │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
└───────────┼────────────────────┼────────────────────┼───────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                       CORE / DOMAIN                             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Domain Services (Business Logic)            │   │
│  │  - TaskDomainService                                     │   │
│  │  - (Future: CommitmentDomainService, etc.)               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Domain Entities                        │   │
│  │  - TaskEntity, CreateTaskDTO, UpdateTaskDTO              │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
backend/src/
├── core/                          # Core domain (no external dependencies)
│   ├── ports/                     # Interface definitions
│   │   ├── repositories/          # Data access contracts
│   │   │   ├── base.repository.port.ts
│   │   │   ├── task.repository.port.ts
│   │   │   └── index.ts
│   │   ├── services/              # External service contracts
│   │   │   ├── ai.service.port.ts
│   │   │   ├── notification.service.port.ts
│   │   │   ├── storage.service.port.ts
│   │   │   └── index.ts
│   │   ├── infrastructure/        # Infrastructure contracts
│   │   │   ├── cache.port.ts
│   │   │   ├── logger.port.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── domain/                    # Business logic
│   │   ├── task.domain-service.ts
│   │   └── index.ts
│   └── index.ts
│
├── adapters/                      # Port implementations
│   ├── repositories/              # Repository adapters
│   │   ├── supabase/              # Supabase implementations
│   │   │   ├── task.repository.supabase.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── infrastructure/            # Infrastructure adapters
│   │   ├── cache/
│   │   │   ├── redis.cache.adapter.ts
│   │   │   └── index.ts
│   │   ├── logging/
│   │   │   ├── winston.logger.adapter.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   └── index.ts
│
├── container/                     # Dependency injection
│   ├── types.ts                   # DI tokens
│   ├── container.ts               # Container implementation
│   └── index.ts
│
└── services/                      # Legacy services (to be migrated)
```

## Key Concepts

### 1. Ports (Interfaces)

Ports define the contracts for external dependencies. They live in `core/ports/`.

```typescript
// Example: Repository port
export interface ITaskRepository {
  findById(id: string): Promise<TaskEntity | null>
  create(data: CreateTaskDTO, createdBy: string): Promise<TaskEntity>
  update(id: string, data: UpdateTaskDTO, updatedBy: string): Promise<TaskEntity>
  delete(id: string, deletedBy: string): Promise<boolean>
}

// Example: Infrastructure port
export interface ICachePort {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, options?: CacheSetOptions): Promise<boolean>
  del(key: string | string[]): Promise<number>
}
```

### 2. Adapters (Implementations)

Adapters implement port interfaces. They live in `adapters/`.

```typescript
// Example: Supabase adapter
export class SupabaseTaskRepository implements ITaskRepository {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly logger: ILoggerPort,
  ) {}

  async findById(id: string): Promise<TaskEntity | null> {
    const { data, error } = await this.supabase.from('tasks').select('*').eq('id', id).single()
    // ...
  }
}
```

### 3. Domain Services

Domain services contain business logic and depend only on ports.

```typescript
export class TaskDomainService {
  constructor(
    private readonly taskRepository: ITaskRepository, // Port, not adapter
    private readonly cache: ICachePort, // Port, not adapter
    private readonly logger: ILoggerPort, // Port, not adapter
  ) {}

  async create(data: CreateTaskDTO, createdBy: string): Promise<TaskEntity> {
    // Business logic: validation
    this.validateTaskCreation(data)

    // Use repository port (database abstraction)
    const task = await this.taskRepository.create(data, createdBy)

    // Use cache port (caching abstraction)
    await this.cache.invalidateByTag('task')

    return task
  }
}
```

### 4. Dependency Injection Container

The container wires everything together.

```typescript
// Register adapters
container.registerSingleton<ITaskRepository>(
  TYPES.TaskRepository,
  () => new SupabaseTaskRepository(supabaseClient, logger),
)

// Resolve and use
const taskService = new TaskDomainService(
  container.resolve<ITaskRepository>(TYPES.TaskRepository),
  container.resolve<ICachePort>(TYPES.Cache),
  container.resolve<ILoggerPort>(TYPES.Logger),
)
```

## Benefits

### 1. Testability

```typescript
// Easy to mock for testing
const mockRepository: ITaskRepository = {
  findById: jest.fn().mockResolvedValue(mockTask),
  create: jest.fn().mockResolvedValue(mockTask),
  // ...
}

const service = new TaskDomainService(mockRepository, mockCache, mockLogger)
```

### 2. Swappability

```typescript
// Switch from Supabase to PostgreSQL
container.registerSingleton<ITaskRepository>(
  TYPES.TaskRepository,
  () => new PostgresTaskRepository(pgPool, logger), // Different adapter, same port
)

// Switch from Redis to Memcached
container.registerSingleton<ICachePort>(
  TYPES.Cache,
  () => new MemcachedCacheAdapter(memcachedClient),
)
```

### 3. Separation of Concerns

- **Core/Domain**: Business logic only
- **Adapters**: External system specifics
- **Container**: Wiring and configuration

## Migration Guide

To migrate existing services:

1. **Define a port** in `core/ports/` for the external dependency
2. **Create an adapter** in `adapters/` implementing the port
3. **Register in container** in `container/container.ts`
4. **Create domain service** in `core/domain/` using ports
5. **Update API routes** to use domain service instead of direct implementation

### Example Migration

**Before (tightly coupled):**

```typescript
// services/TaskService.ts
import { supabaseAdmin } from '../config/supabase'
import { cacheHelpers } from '../config/redis'

export class TaskService {
  async findById(id: string) {
    const cached = await cacheHelpers.get(`task:${id}`)
    if (cached) return cached

    const { data } = await supabaseAdmin.from('tasks').select('*').eq('id', id).single()
    await cacheHelpers.set(`task:${id}`, data)
    return data
  }
}
```

**After (loosely coupled):**

```typescript
// core/domain/task.domain-service.ts
import { ITaskRepository } from '../ports/repositories'
import { ICachePort } from '../ports/infrastructure'

export class TaskDomainService {
  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly cache: ICachePort,
  ) {}

  async findById(id: string) {
    const cached = await this.cache.get(`task:${id}`)
    if (cached) return cached

    const data = await this.taskRepository.findById(id)
    await this.cache.set(`task:${id}`, data)
    return data
  }
}
```

## Usage in API Routes

```typescript
import { getContainer, TYPES } from '../container'
import { TaskDomainService } from '../core/domain'

const router = Router()

router.get('/tasks/:id', async (req, res) => {
  const container = getContainer()

  // Create service with injected dependencies
  const taskService = new TaskDomainService(
    container.resolve(TYPES.TaskRepository),
    container.resolve(TYPES.Cache),
    container.resolve(TYPES.Logger),
  )

  const task = await taskService.findById(req.params.id)
  res.json({ data: task })
})
```

## Future Enhancements

1. **Additional Repository Ports**: `ICountryRepository`, `IOrganizationRepository`, etc.
2. **Additional Service Ports**: `IEmailService`, `IQueueService`, etc.
3. **In-Memory Adapters**: For testing and development
4. **Event Sourcing Port**: For domain events and CQRS
5. **Decorator Pattern**: For cross-cutting concerns (logging, caching, retry)
