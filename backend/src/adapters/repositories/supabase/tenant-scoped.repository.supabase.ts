/**
 * Supabase Tenant-Scoped Repository Adapter
 *
 * Base implementation for tenant-scoped repositories using Supabase.
 * All queries automatically filter by tenant context.
 *
 * @module tenant-scoped-repository-supabase
 */

import { SupabaseClient, PostgrestFilterBuilder } from '@supabase/supabase-js'
import {
  ITenantScopedRepository,
  RepositoryTenantContext,
  TenantScopedFilterParams,
  TenantAccessViolationError,
  TenantContextNotSetError,
} from '../../../core/ports/repositories/tenant-scoped.repository.port'
import {
  PaginatedResult,
  PaginationParams,
} from '../../../core/ports/repositories/base.repository.port'
import { ILoggerPort } from '../../../core/ports/infrastructure'

/**
 * Configuration for tenant-scoped repository
 */
export interface TenantScopedRepositoryConfig {
  /** Table name */
  tableName: string
  /** Column name for organization/tenant ID */
  tenantColumn?: string
  /** Default select columns */
  defaultSelect?: string
  /** Whether to use soft delete */
  softDelete?: boolean
  /** Column name for soft delete */
  softDeleteColumn?: string
}

/**
 * Abstract base class for tenant-scoped Supabase repositories
 */
export abstract class SupabaseTenantScopedRepository<
  T,
  CreateDTO = Partial<T>,
  UpdateDTO = Partial<T>,
  FilterParams = Record<string, unknown>,
> implements ITenantScopedRepository<T, CreateDTO, UpdateDTO, FilterParams>
{
  protected tenantContext: RepositoryTenantContext | null = null
  protected readonly tenantColumn: string
  protected readonly defaultSelect: string
  protected readonly softDelete: boolean
  protected readonly softDeleteColumn: string

  constructor(
    protected readonly supabase: SupabaseClient,
    protected readonly logger: ILoggerPort,
    protected readonly config: TenantScopedRepositoryConfig,
  ) {
    this.tenantColumn = config.tenantColumn || 'organization_id'
    this.defaultSelect = config.defaultSelect || '*'
    this.softDelete = config.softDelete ?? false
    this.softDeleteColumn = config.softDeleteColumn || 'deleted_at'
  }

  /**
   * Set the tenant context for this repository instance
   */
  setTenantContext(context: RepositoryTenantContext): void {
    this.tenantContext = context
    this.logger.debug('Tenant context set', {
      tenantId: context.tenantId,
      userId: context.userId,
      strictMode: context.strictMode,
    })
  }

  /**
   * Get the current tenant context
   */
  getTenantContext(): RepositoryTenantContext | null {
    return this.tenantContext
  }

  /**
   * Clear the tenant context
   */
  clearTenantContext(): void {
    this.tenantContext = null
  }

  /**
   * Require tenant context for an operation
   */
  protected requireTenantContext(operation: string): RepositoryTenantContext {
    if (!this.tenantContext) {
      throw new TenantContextNotSetError(operation)
    }
    return this.tenantContext
  }

  /**
   * Get tenant IDs for filtering based on context
   */
  protected getTenantIds(options?: TenantScopedFilterParams): string[] {
    const context = this.requireTenantContext('getTenantIds')

    if (options?.tenantId) {
      // Specific tenant requested - verify access
      if (context.role !== 'admin' && !context.accessibleTenants.includes(options.tenantId)) {
        throw new TenantAccessViolationError(
          context.userId,
          options.tenantId,
          context.accessibleTenants,
        )
      }
      return [options.tenantId]
    }

    if (context.strictMode || !options?.includeAllTenants) {
      return [context.tenantId]
    }

    return context.accessibleTenants
  }

  /**
   * Apply tenant filter to a query
   */
  protected applyTenantFilter<R>(
    query: PostgrestFilterBuilder<R, unknown, unknown>,
    options?: TenantScopedFilterParams,
  ): PostgrestFilterBuilder<R, unknown, unknown> {
    const tenantIds = this.getTenantIds(options)

    if (tenantIds.length === 1) {
      return query.eq(this.tenantColumn, tenantIds[0]) as PostgrestFilterBuilder<
        R,
        unknown,
        unknown
      >
    }

    return query.in(this.tenantColumn, tenantIds) as PostgrestFilterBuilder<R, unknown, unknown>
  }

  /**
   * Apply soft delete filter if enabled
   */
  protected applySoftDeleteFilter<R>(
    query: PostgrestFilterBuilder<R, unknown, unknown>,
  ): PostgrestFilterBuilder<R, unknown, unknown> {
    if (this.softDelete) {
      return query.is(this.softDeleteColumn, null) as PostgrestFilterBuilder<R, unknown, unknown>
    }
    return query
  }

  // ============================================
  // ITenantScopedRepository Implementation
  // ============================================

  /**
   * Find all entities with automatic tenant filtering
   */
  async findAllInTenant(
    params?: FilterParams & PaginationParams & TenantScopedFilterParams,
  ): Promise<PaginatedResult<T>> {
    const context = this.requireTenantContext('findAllInTenant')

    try {
      let query = this.supabase
        .from(this.config.tableName)
        .select(this.defaultSelect, { count: 'exact' })

      // Apply tenant filter
      query = this.applyTenantFilter(query, params) as typeof query

      // Apply soft delete filter
      query = this.applySoftDeleteFilter(query) as typeof query

      // Apply custom filters
      if (params) {
        query = this.applyFilters(query, params) as typeof query
      }

      // Apply pagination
      const limit = params?.limit || 50
      const offset = params?.offset || 0
      query = query.range(offset, offset + limit - 1)

      // Apply default ordering
      query = this.applyDefaultOrdering(query) as typeof query

      const { data, error, count } = await query

      if (error) {
        this.logger.error('findAllInTenant error', {
          error,
          tableName: this.config.tableName,
          tenantId: context.tenantId,
        })
        throw new Error(error.message)
      }

      return {
        data: (data as T[]) || [],
        total: count || 0,
        hasMore: (count || 0) > offset + limit,
      }
    } catch (error) {
      this.logger.error('findAllInTenant failed', {
        error,
        tableName: this.config.tableName,
      })
      throw error
    }
  }

  /**
   * Find entity by ID with tenant verification
   */
  async findByIdInTenant(id: string): Promise<T | null> {
    const context = this.requireTenantContext('findByIdInTenant')

    try {
      let query = this.supabase.from(this.config.tableName).select(this.defaultSelect).eq('id', id)

      // Apply tenant filter
      query = this.applyTenantFilter(query) as typeof query

      // Apply soft delete filter
      query = this.applySoftDeleteFilter(query) as typeof query

      const { data, error } = await query.single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Check if entity exists but user doesn't have access
          const { data: entityExists } = await this.supabase
            .from(this.config.tableName)
            .select('id, ' + this.tenantColumn)
            .eq('id', id)
            .single()

          if (entityExists) {
            // Entity exists but not in user's tenant - log violation
            this.logger.warn('Tenant access violation attempted', {
              userId: context.userId,
              entityId: id,
              entityTenantId: entityExists[this.tenantColumn],
              userTenantId: context.tenantId,
            })
          }

          return null
        }

        this.logger.error('findByIdInTenant error', { error, id })
        throw new Error(error.message)
      }

      return data as T
    } catch (error) {
      this.logger.error('findByIdInTenant failed', { error, id })
      throw error
    }
  }

  /**
   * Create entity in the current tenant
   */
  async createInTenant(data: CreateDTO, createdBy: string): Promise<T> {
    const context = this.requireTenantContext('createInTenant')

    try {
      const entityData = {
        ...data,
        [this.tenantColumn]: context.tenantId,
        created_by: createdBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data: created, error } = await this.supabase
        .from(this.config.tableName)
        .insert(entityData)
        .select(this.defaultSelect)
        .single()

      if (error) {
        this.logger.error('createInTenant error', {
          error,
          tableName: this.config.tableName,
        })
        throw new Error(error.message)
      }

      this.logger.info('Entity created in tenant', {
        tableName: this.config.tableName,
        entityId: (created as { id: string }).id,
        tenantId: context.tenantId,
        createdBy,
      })

      return created as T
    } catch (error) {
      this.logger.error('createInTenant failed', { error })
      throw error
    }
  }

  /**
   * Update entity with tenant verification
   */
  async updateInTenant(id: string, data: UpdateDTO, updatedBy: string): Promise<T> {
    const context = this.requireTenantContext('updateInTenant')

    // First verify entity belongs to accessible tenant
    const hasAccess = await this.verifyTenantAccess(id)
    if (!hasAccess) {
      throw new TenantAccessViolationError(
        context.userId,
        'unknown',
        context.accessibleTenants,
        `Entity ${id} not found or not accessible`,
      )
    }

    try {
      const updateData = {
        ...data,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      }

      let query = this.supabase.from(this.config.tableName).update(updateData).eq('id', id)

      // Apply tenant filter for extra safety
      query = this.applyTenantFilter(query) as typeof query

      const { data: updated, error } = await query.select(this.defaultSelect).single()

      if (error) {
        this.logger.error('updateInTenant error', { error, id })
        throw new Error(error.message)
      }

      this.logger.info('Entity updated in tenant', {
        tableName: this.config.tableName,
        entityId: id,
        tenantId: context.tenantId,
        updatedBy,
      })

      return updated as T
    } catch (error) {
      this.logger.error('updateInTenant failed', { error, id })
      throw error
    }
  }

  /**
   * Delete entity with tenant verification
   */
  async deleteInTenant(id: string, deletedBy: string): Promise<boolean> {
    const context = this.requireTenantContext('deleteInTenant')

    // First verify entity belongs to accessible tenant
    const hasAccess = await this.verifyTenantAccess(id)
    if (!hasAccess) {
      throw new TenantAccessViolationError(
        context.userId,
        'unknown',
        context.accessibleTenants,
        `Entity ${id} not found or not accessible`,
      )
    }

    try {
      let query

      if (this.softDelete) {
        // Soft delete
        query = this.supabase
          .from(this.config.tableName)
          .update({
            [this.softDeleteColumn]: new Date().toISOString(),
            updated_by: deletedBy,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
      } else {
        // Hard delete
        query = this.supabase.from(this.config.tableName).delete().eq('id', id)
      }

      // Apply tenant filter for extra safety
      query = this.applyTenantFilter(query) as typeof query

      const { error } = await query

      if (error) {
        this.logger.error('deleteInTenant error', { error, id })
        throw new Error(error.message)
      }

      this.logger.info('Entity deleted in tenant', {
        tableName: this.config.tableName,
        entityId: id,
        tenantId: context.tenantId,
        deletedBy,
        softDelete: this.softDelete,
      })

      return true
    } catch (error) {
      this.logger.error('deleteInTenant failed', { error, id })
      throw error
    }
  }

  /**
   * Check if entity exists in accessible tenants
   */
  async existsInTenant(id: string): Promise<boolean> {
    this.requireTenantContext('existsInTenant')

    try {
      let query = this.supabase.from(this.config.tableName).select('id').eq('id', id)

      // Apply tenant filter
      query = this.applyTenantFilter(query) as typeof query

      // Apply soft delete filter
      query = this.applySoftDeleteFilter(query) as typeof query

      const { data, error } = await query.single()

      if (error && error.code !== 'PGRST116') {
        throw new Error(error.message)
      }

      return !!data
    } catch (error) {
      this.logger.error('existsInTenant failed', { error, id })
      throw error
    }
  }

  /**
   * Verify entity belongs to an accessible tenant
   */
  async verifyTenantAccess(id: string): Promise<boolean> {
    const context = this.requireTenantContext('verifyTenantAccess')

    try {
      const { data, error } = await this.supabase
        .from(this.config.tableName)
        .select(`id, ${this.tenantColumn}`)
        .eq('id', id)
        .single()

      if (error || !data) {
        return false
      }

      const entityTenantId = data[this.tenantColumn]

      // Admin can access all
      if (context.role === 'admin') {
        return true
      }

      return context.accessibleTenants.includes(entityTenantId)
    } catch (error) {
      this.logger.error('verifyTenantAccess failed', { error, id })
      return false
    }
  }

  // ============================================
  // IBaseRepository Implementation (delegates to tenant-scoped methods)
  // ============================================

  async findAll(params?: FilterParams & PaginationParams): Promise<PaginatedResult<T>> {
    return this.findAllInTenant(params)
  }

  async findById(id: string): Promise<T | null> {
    return this.findByIdInTenant(id)
  }

  async create(data: CreateDTO, createdBy: string): Promise<T> {
    return this.createInTenant(data, createdBy)
  }

  async update(id: string, data: UpdateDTO, updatedBy: string): Promise<T> {
    return this.updateInTenant(id, data, updatedBy)
  }

  async delete(id: string, deletedBy: string): Promise<boolean> {
    return this.deleteInTenant(id, deletedBy)
  }

  async exists(id: string): Promise<boolean> {
    return this.existsInTenant(id)
  }

  // ============================================
  // Abstract methods for subclasses to implement
  // ============================================

  /**
   * Apply custom filters to the query
   * Subclasses should override this to add entity-specific filters
   */
  protected abstract applyFilters(
    query: PostgrestFilterBuilder<unknown, unknown, unknown>,
    params: FilterParams,
  ): PostgrestFilterBuilder<unknown, unknown, unknown>

  /**
   * Apply default ordering to the query
   * Subclasses should override this to add entity-specific ordering
   */
  protected abstract applyDefaultOrdering(
    query: PostgrestFilterBuilder<unknown, unknown, unknown>,
  ): PostgrestFilterBuilder<unknown, unknown, unknown>
}
