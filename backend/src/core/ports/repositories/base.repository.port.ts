/**
 * Base Repository Port
 *
 * Defines the contract for all repository operations.
 * This is a port in the hexagonal architecture that external adapters implement.
 *
 * @description Core repository interface that all specific repositories extend.
 * Provides standard CRUD operations and pagination support.
 */

/**
 * Pagination parameters for list queries
 */
export interface PaginationParams {
  limit?: number
  offset?: number
  cursor?: string
}

/**
 * Paginated result structure
 */
export interface PaginatedResult<T> {
  data: T[]
  total: number
  hasMore: boolean
  nextCursor?: string
}

/**
 * Base repository port that all domain repositories extend.
 * Follows the repository pattern to abstract data access.
 *
 * @template T - The entity type
 * @template CreateDTO - The DTO for creating entities
 * @template UpdateDTO - The DTO for updating entities
 * @template FilterParams - The filter parameters for queries
 */
export interface IBaseRepository<
  T,
  CreateDTO = Partial<T>,
  UpdateDTO = Partial<T>,
  FilterParams = Record<string, unknown>,
> {
  /**
   * Find all entities with optional filtering and pagination
   */
  findAll(params?: FilterParams & PaginationParams): Promise<PaginatedResult<T>>

  /**
   * Find a single entity by its ID
   */
  findById(id: string): Promise<T | null>

  /**
   * Create a new entity
   */
  create(data: CreateDTO, createdBy: string): Promise<T>

  /**
   * Update an existing entity
   */
  update(id: string, data: UpdateDTO, updatedBy: string): Promise<T>

  /**
   * Delete an entity by ID
   */
  delete(id: string, deletedBy: string): Promise<boolean>

  /**
   * Check if an entity exists
   */
  exists(id: string): Promise<boolean>
}

/**
 * Soft-delete capable repository extension
 */
export interface ISoftDeletableRepository<T> {
  /**
   * Soft delete an entity (marks as deleted without removing)
   */
  softDelete(id: string, deletedBy: string): Promise<boolean>

  /**
   * Restore a soft-deleted entity
   */
  restore(id: string, restoredBy: string): Promise<T>

  /**
   * Find entities including soft-deleted ones
   */
  findAllIncludingDeleted(params?: PaginationParams): Promise<PaginatedResult<T>>
}

/**
 * Bulk operations repository extension
 */
export interface IBulkOperationsRepository<T, CreateDTO = Partial<T>> {
  /**
   * Create multiple entities in bulk
   */
  bulkCreate(data: CreateDTO[], createdBy: string): Promise<T[]>

  /**
   * Delete multiple entities by IDs
   */
  bulkDelete(ids: string[], deletedBy: string): Promise<number>

  /**
   * Update multiple entities with the same data
   */
  bulkUpdate(ids: string[], data: Partial<T>, updatedBy: string): Promise<T[]>
}
