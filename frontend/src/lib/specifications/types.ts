/**
 * Core Specification Pattern Types
 *
 * Defines the foundational interfaces and types for the specification pattern.
 * These types enable type-safe, composable query building across the application.
 */

import type { PostgrestFilterBuilder } from '@supabase/postgrest-js'

// ============================================
// Core Specification Interface
// ============================================

/**
 * Core specification interface - defines a single business rule
 * that can be evaluated against a candidate entity.
 *
 * @template T - The type of entity this specification can evaluate
 */
export interface Specification<T> {
  /**
   * Evaluate if a candidate satisfies this specification (in-memory check)
   * @param candidate - The entity to evaluate
   * @returns true if the candidate satisfies the specification
   */
  isSatisfiedBy(candidate: T): boolean

  /**
   * Combine this specification with another using AND logic
   * @param other - The specification to combine with
   * @returns A new specification that requires both to be satisfied
   */
  and(other: Specification<T>): Specification<T>

  /**
   * Combine this specification with another using OR logic
   * @param other - The specification to combine with
   * @returns A new specification that requires at least one to be satisfied
   */
  or(other: Specification<T>): Specification<T>

  /**
   * Negate this specification
   * @returns A new specification that is satisfied when this one is not
   */
  not(): Specification<T>

  /**
   * Convert this specification to a Supabase query filter
   * This enables server-side filtering without loading all data
   * @param query - The Supabase query builder
   * @returns The query builder with filters applied
   */
  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder

  /**
   * Get a human-readable description of this specification
   * Useful for debugging and audit logging
   */
  describe(): string
}

/**
 * Extended specification interface with additional capabilities
 */
export interface ExtendedSpecification<T> extends Specification<T> {
  /**
   * Get the specification name for logging/debugging
   */
  readonly name: string

  /**
   * Convert to a plain object for serialization (e.g., URL params)
   */
  toJSON(): SpecificationJSON

  /**
   * Create from a plain object (deserialization)
   */
  fromJSON?(json: SpecificationJSON): Specification<T>
}

// ============================================
// Supabase Integration Types
// ============================================

/**
 * Generic type for Supabase query builders
 * This allows specifications to work with any table's query builder
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SupabaseQueryBuilder = PostgrestFilterBuilder<any, any, any, any, any>

/**
 * Supported Supabase filter operations
 */
export type SupabaseFilterOperation =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'like'
  | 'ilike'
  | 'is'
  | 'in'
  | 'contains'
  | 'containedBy'
  | 'rangeGt'
  | 'rangeGte'
  | 'rangeLt'
  | 'rangeLte'
  | 'rangeAdjacent'
  | 'overlaps'
  | 'textSearch'
  | 'match'
  | 'not'
  | 'or'
  | 'filter'

/**
 * Supabase filter definition for query building
 */
export interface SupabaseFilter {
  column: string
  operation: SupabaseFilterOperation
  value: unknown
  negate?: boolean
}

/**
 * Composite Supabase filter with logic operator
 */
export interface CompositeSupabaseFilter {
  logic: 'and' | 'or'
  filters: Array<SupabaseFilter | CompositeSupabaseFilter>
}

// ============================================
// Serialization Types
// ============================================

/**
 * JSON representation of a specification for serialization
 */
export interface SpecificationJSON {
  type: string
  name: string
  params?: Record<string, unknown>
  children?: SpecificationJSON[]
  logic?: 'and' | 'or' | 'not'
}

// ============================================
// Filter Operator Types
// ============================================

/**
 * Generic filter operators that map to both in-memory and database operations
 */
export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_equal'
  | 'less_equal'
  | 'between'
  | 'not_between'
  | 'in'
  | 'not_in'
  | 'is_null'
  | 'is_not_null'
  | 'matches_regex'

/**
 * Mapping from generic operators to Supabase filter operations
 */
export const OPERATOR_TO_SUPABASE: Record<FilterOperator, SupabaseFilterOperation> = {
  equals: 'eq',
  not_equals: 'neq',
  contains: 'ilike',
  not_contains: 'ilike', // Will be negated
  starts_with: 'ilike',
  ends_with: 'ilike',
  greater_than: 'gt',
  less_than: 'lt',
  greater_equal: 'gte',
  less_equal: 'lte',
  between: 'filter', // Custom handling
  not_between: 'filter', // Custom handling
  in: 'in',
  not_in: 'in', // Will be negated
  is_null: 'is',
  is_not_null: 'is', // Will be negated
  matches_regex: 'match',
}

// ============================================
// Date Utilities Types
// ============================================

/**
 * Date preset values for quick date filtering
 */
export type DatePreset =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'this_month'
  | 'this_year'
  | 'next_7_days'
  | 'next_30_days'

/**
 * Date range definition
 */
export interface DateRange {
  from?: Date | string | null
  to?: Date | string | null
  preset?: DatePreset | null
}

// ============================================
// Specification Factory Types
// ============================================

/**
 * Factory function type for creating specifications
 */
export type SpecificationFactory<T, P extends Record<string, unknown> = Record<string, unknown>> = (
  params: P,
) => Specification<T>

/**
 * Registry of specification factories
 */
export type SpecificationRegistry<T> = Record<string, SpecificationFactory<T>>

// ============================================
// Validation Types
// ============================================

/**
 * Specification validation result
 */
export interface SpecificationValidationResult {
  valid: boolean
  errors: SpecificationValidationError[]
}

/**
 * Specification validation error
 */
export interface SpecificationValidationError {
  path: string
  message: string
  code: string
}

/**
 * Validator function type
 */
export type SpecificationValidator<T> = (spec: Specification<T>) => SpecificationValidationResult
