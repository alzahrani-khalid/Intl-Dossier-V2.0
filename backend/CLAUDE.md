# backend — Express + TypeScript API (DDD layers)

The HTTP API. Domain logic in `src/core/domain/`, ports/adapters in `src/core/ports/` + `src/adapters/`, request handlers in `src/api/`. JWT auth, Winston logging, Supabase-backed.

## Conventions

- **Domain layer is framework-agnostic.** Nothing in `src/core/domain/` imports Express, Supabase, or anything in `src/adapters/`. The dependency arrow points inward.
- **Handlers raise typed errors, they don't return error envelopes.** Use the error hierarchy + `errorHandler` middleware; never hand-build `{status: 404}`.
- **No floating promises.** `@typescript-eslint/no-floating-promises` is error-level — always `await` or explicit `.catch`.
- **camelCase functions, explicit return types** (ESLint enforced). Single-quote strings, no semicolons, 100-col print width.
- **Middleware files**: hyphenated with `.middleware.ts` suffix (e.g. `rate-limit.middleware.ts`). Types: `.types.ts` suffix.

### Naming Patterns (backend)

- **Middleware**: hyphenated or camelCase with `.ts` extension (e.g., `rate-limit.middleware.ts`, `errorHandler.ts`)
- **Types/Interfaces**: Suffix with `.types.ts` (e.g., `work-item.types.ts`, `common.types.ts`, `ai-extraction.types.ts`)
- **Test files**: `*.test.ts` (e.g., `Country.test.ts`)
- camelCase for all function names; explicit return types required (`@typescript-eslint/explicit-function-return-type`)
- PascalCase for interfaces and type aliases
- Enum values: CONSTANT_CASE (e.g., `conflict_type: 'contradiction' as const`)

### Error Handling

- Use `try/catch` with specific error types
- Return discriminated union types: `{ success: boolean, data?: T, error?: Error }`
- Async operations must not produce floating promises

### Logging

- **Winston logger** configured in `src/utils/logger.ts` — use this, not `console.*`

### Module Design

- Named exports for functions/classes
- `src/types/index.ts` and `src/utils/index.ts` re-export all; avoid circular deps

### Cross-cutting (backend side)

- **Auth**: JWT via `authenticateToken` middleware + Supabase Auth
- **Validation**: `express-validator` at the route boundary
- **Rate limiting** (`src/middleware/rate-limit.middleware.ts`): use the variant that matches the endpoint kind — `apiLimiter`, `authLimiter`, `uploadLimiter`, `aiLimiter`
- **Caching**: Redis/ioredis

## Work Item Terminology (MANDATORY)

Use consistent terminology across all work-related features. This glossary is the single source of truth.

### Unified Terms

| Term          | Definition                                                                  | Replaces                          |
| ------------- | --------------------------------------------------------------------------- | --------------------------------- |
| **Work Item** | Any trackable unit of work in the system                                    | Task, Assignment                  |
| **Assignee**  | Person responsible for completing work                                      | Owner, Assigned To, Assigned User |
| **Deadline**  | Target completion date/time                                                 | Due Date, SLA Deadline            |
| **Priority**  | Importance level: `low`, `medium`, `high`, `urgent`                         | `critical` (use `urgent` instead) |
| **Status**    | Current state: `pending`, `in_progress`, `review`, `completed`, `cancelled` | Workflow Stage (for display)      |

### Source Types

Work items originate from different sources, identified by the `source` field:

| Source         | Description                                    | Typical Use Case          |
| -------------- | ---------------------------------------------- | ------------------------- |
| **task**       | Internal operational work with Kanban workflow | Assignments, action items |
| **commitment** | Promises from after-action records             | Deliverables, follow-ups  |
| **intake**     | Service requests through intake system         | Support tickets, requests |

### Tracking Types

Work items are categorized by how they're tracked:

| Tracking Type | Description                | Typical Sources              |
| ------------- | -------------------------- | ---------------------------- |
| **delivery**  | Deliverable-based tracking | Internal commitments, tasks  |
| **follow_up** | External party follow-up   | External commitments         |
| **sla**       | SLA-driven with deadlines  | Intake tickets, urgent tasks |

### Workflow Stages (Tasks Only)

Kanban board positions for tasks:

| Stage         | Description              |
| ------------- | ------------------------ |
| `todo`        | Not started, in backlog  |
| `in_progress` | Actively being worked on |
| `review`      | Pending review/approval  |
| `done`        | Successfully completed   |
| `cancelled`   | Explicitly cancelled     |

### Code Usage

```typescript
// Always use unified types from work-item.types.ts
import type { WorkItem, WorkSource, Priority, TrackingType } from '@/types/work-item.types'

// Always use unified i18n namespace
import { useTranslation } from 'react-i18next'
const { t } = useTranslation('unified-kanban')

// Correct terminology
t('priority.urgent') // NOT 'priority.critical'
t('status.in_progress') // Consistent naming
t('columns.todo') // Workflow stage for display
```

### Database Column Naming

| Field           | Type        | Description                                        |
| --------------- | ----------- | -------------------------------------------------- |
| `assignee_id`   | UUID        | User responsible (NOT `owner_id`, `assigned_to`)   |
| `deadline`      | TIMESTAMPTZ | Target completion (NOT `due_date`, `sla_deadline`) |
| `priority`      | ENUM        | `low`, `medium`, `high`, `urgent`                  |
| `status`        | ENUM        | Current state                                      |
| `source`        | ENUM        | `commitment`, `task`, `intake`                     |
| `tracking_type` | ENUM        | `delivery`, `follow_up`, `sla`                     |

## Tests

```bash
pnpm --filter backend test               # backend suite
pnpm --filter backend test <file>        # one file
pnpm --filter backend typecheck          # types only
```

## Gotchas

- **Floating-promise lint rule is error-level.** Don't suppress — fix the call site.
- **`src/core/domain/` changes ripple across all API routes.** Run the full backend suite, not just one route's tests.
- **Rate-limit middleware variants:** `apiLimiter`, `authLimiter`, `uploadLimiter`, `aiLimiter` — use the right one for the endpoint kind.
