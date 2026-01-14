/**
 * Repository Ports Index
 *
 * Re-exports all repository port interfaces for easy importing.
 * These ports define the contracts that adapters must implement.
 */

// Base repository interfaces
export type {
  IBaseRepository,
  ISoftDeletableRepository,
  IBulkOperationsRepository,
  PaginationParams,
  PaginatedResult,
} from './base.repository.port'

// Task repository
export type {
  ITaskRepository,
  TaskEntity,
  CreateTaskDTO,
  UpdateTaskDTO,
  TaskFilterParams,
  TaskStatistics,
  TaskEscalationRule,
  TaskComment,
} from './task.repository.port'

// Tenant-scoped repository
export type {
  ITenantScopedRepository,
  RepositoryTenantContext,
  TenantScopedFilterParams,
  ITenantQueryBuilder,
  TenantScopedEntity,
} from './tenant-scoped.repository.port'

export {
  TenantAccessViolationError,
  TenantContextNotSetError,
} from './tenant-scoped.repository.port'
