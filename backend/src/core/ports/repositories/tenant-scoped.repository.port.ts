/**
 * Tenant-Scoped Repository Port
 *
 * Extends the base repository with tenant isolation capabilities.
 * All methods automatically filter by tenant context.
 *
 * @module tenant-scoped-repository
 */

import { IBaseRepository, PaginatedResult, PaginationParams } from './base.repository.port'

/**
 * Tenant context for repository operations
 */
export interface RepositoryTenantContext {
  /** Current tenant ID */
  tenantId: string
  /** Current user ID */
  userId: string
  /** User role */
  role: string
  /** All accessible tenant IDs */
  accessibleTenants: string[]
  /** Strict mode - only access current tenant */
  strictMode: boolean
}

/**
 * Tenant-scoped filter parameters
 */
export interface TenantScopedFilterParams {
  /** Filter by specific tenant (admin only) */
  tenantId?: string
  /** Include data from all accessible tenants */
  includeAllTenants?: boolean
}

/**
 * Tenant-scoped repository interface
 * Extends base repository with automatic tenant filtering
 */
export interface ITenantScopedRepository<
  T,
  CreateDTO = Partial<T>,
  UpdateDTO = Partial<T>,
  FilterParams = Record<string, unknown>,
> extends IBaseRepository<T, CreateDTO, UpdateDTO, FilterParams> {
  /**
   * Set the tenant context for this repository instance
   */
  setTenantContext(context: RepositoryTenantContext): void

  /**
   * Get the current tenant context
   */
  getTenantContext(): RepositoryTenantContext | null

  /**
   * Clear the tenant context
   */
  clearTenantContext(): void

  /**
   * Find all entities with automatic tenant filtering
   */
  findAllInTenant(
    params?: FilterParams & PaginationParams & TenantScopedFilterParams,
  ): Promise<PaginatedResult<T>>

  /**
   * Find entity by ID with tenant verification
   * @throws if entity doesn't belong to accessible tenants
   */
  findByIdInTenant(id: string): Promise<T | null>

  /**
   * Create entity in the current tenant
   */
  createInTenant(data: CreateDTO, createdBy: string): Promise<T>

  /**
   * Update entity with tenant verification
   * @throws if entity doesn't belong to accessible tenants
   */
  updateInTenant(id: string, data: UpdateDTO, updatedBy: string): Promise<T>

  /**
   * Delete entity with tenant verification
   * @throws if entity doesn't belong to accessible tenants
   */
  deleteInTenant(id: string, deletedBy: string): Promise<boolean>

  /**
   * Check if entity exists in accessible tenants
   */
  existsInTenant(id: string): Promise<boolean>

  /**
   * Verify entity belongs to an accessible tenant
   */
  verifyTenantAccess(id: string): Promise<boolean>
}

/**
 * Tenant isolation query builder interface
 */
export interface ITenantQueryBuilder {
  /**
   * Add tenant filter to query
   */
  withTenantFilter(context: RepositoryTenantContext): this

  /**
   * Add single tenant filter (strict mode)
   */
  withStrictTenantFilter(tenantId: string): this

  /**
   * Add multi-tenant filter (accessible tenants)
   */
  withMultiTenantFilter(tenantIds: string[]): this
}

/**
 * Entity with tenant information
 */
export interface TenantScopedEntity {
  /** Organization/tenant ID */
  organization_id: string
  /** When the entity was created */
  created_at: string
  /** Who created the entity */
  created_by: string
  /** When the entity was last updated */
  updated_at?: string
  /** Who last updated the entity */
  updated_by?: string
}

/**
 * Tenant access violation error
 */
export class TenantAccessViolationError extends Error {
  constructor(
    public readonly userId: string,
    public readonly attemptedTenantId: string,
    public readonly accessibleTenants: string[],
    message?: string,
  ) {
    super(
      message ||
        `User ${userId} attempted to access tenant ${attemptedTenantId} without authorization`,
    )
    this.name = 'TenantAccessViolationError'
  }
}

/**
 * Tenant context not set error
 */
export class TenantContextNotSetError extends Error {
  constructor(operation: string) {
    super(`Tenant context must be set before performing operation: ${operation}`)
    this.name = 'TenantContextNotSetError'
  }
}
