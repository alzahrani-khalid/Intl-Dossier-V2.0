/**
 * Specification Builder
 *
 * Provides a fluent API for building complex specifications
 * through method chaining.
 *
 * @module specifications/builder
 */

import type { Specification, DateRange } from './types'
import {
  TrueSpecification,
  EqualsSpecification,
  InSpecification,
  ContainsSpecification,
  GreaterThanSpecification,
  LessThanSpecification,
  BetweenSpecification,
  IsNullSpecification,
  IsNotNullSpecification,
} from './base'
import { allOf, anyOf } from './composite'

// ============================================
// Specification Builder Class
// ============================================

/**
 * Fluent builder for creating complex specifications.
 *
 * @example
 * ```typescript
 * const spec = new SpecificationBuilder<WorkItem>()
 *   .whereIn('source', ['task', 'commitment'])
 *   .whereEquals('status', 'pending')
 *   .whereNotNull('deadline')
 *   .build();
 *
 * // Use the specification
 * const filtered = items.filter(item => spec.isSatisfiedBy(item));
 * const query = spec.toSupabaseFilter(supabase.from('work_items').select('*'));
 * ```
 */
export class SpecificationBuilder<T> {
  private specs: Specification<T>[] = []
  private logic: 'and' | 'or' = 'and'

  /**
   * Set the logic operator for combining specifications
   */
  withLogic(logic: 'and' | 'or'): this {
    this.logic = logic
    return this
  }

  /**
   * Add an equals specification
   */
  whereEquals<K extends keyof T>(field: K, value: T[K]): this {
    this.specs.push(new EqualsSpecification<T, K>(field, value))
    return this
  }

  /**
   * Add an in specification
   */
  whereIn<K extends keyof T>(field: K, values: T[K][]): this {
    if (values.length > 0) {
      this.specs.push(new InSpecification<T, K>(field, values))
    }
    return this
  }

  /**
   * Add a contains specification (case-insensitive string search)
   */
  whereContains<K extends keyof T>(field: K, substring: string): this {
    this.specs.push(new ContainsSpecification<T, K>(field, substring))
    return this
  }

  /**
   * Add a greater than specification
   */
  whereGreaterThan<K extends keyof T>(field: K, value: T[K]): this {
    this.specs.push(new GreaterThanSpecification<T, K>(field, value))
    return this
  }

  /**
   * Add a less than specification
   */
  whereLessThan<K extends keyof T>(field: K, value: T[K]): this {
    this.specs.push(new LessThanSpecification<T, K>(field, value))
    return this
  }

  /**
   * Add a between specification
   */
  whereBetween<K extends keyof T>(field: K, min: T[K], max: T[K]): this {
    this.specs.push(new BetweenSpecification<T, K>(field, min, max))
    return this
  }

  /**
   * Add an is null specification
   */
  whereNull<K extends keyof T>(field: K): this {
    this.specs.push(new IsNullSpecification<T, K>(field))
    return this
  }

  /**
   * Add an is not null specification
   */
  whereNotNull<K extends keyof T>(field: K): this {
    this.specs.push(new IsNotNullSpecification<T, K>(field))
    return this
  }

  /**
   * Add a specification conditionally
   */
  when(condition: boolean, spec: Specification<T>): this {
    if (condition) {
      this.specs.push(spec)
    }
    return this
  }

  /**
   * Add a specification only when value is defined
   */
  whenDefined<V>(value: V | undefined | null, createSpec: (value: V) => Specification<T>): this {
    if (value !== undefined && value !== null) {
      this.specs.push(createSpec(value))
    }
    return this
  }

  /**
   * Add a specification only when array is not empty
   */
  whenNotEmpty<V>(
    values: V[] | undefined | null,
    createSpec: (values: V[]) => Specification<T>,
  ): this {
    if (values && values.length > 0) {
      this.specs.push(createSpec(values))
    }
    return this
  }

  /**
   * Add a custom specification
   */
  where(spec: Specification<T>): this {
    this.specs.push(spec)
    return this
  }

  /**
   * Add multiple specifications at once
   */
  whereAll(...specs: Specification<T>[]): this {
    this.specs.push(...specs)
    return this
  }

  /**
   * Add a nested builder (sub-query)
   */
  nested(builderFn: (builder: SpecificationBuilder<T>) => SpecificationBuilder<T>): this {
    const nestedBuilder = new SpecificationBuilder<T>()
    builderFn(nestedBuilder)
    const nestedSpec = nestedBuilder.build()
    this.specs.push(nestedSpec)
    return this
  }

  /**
   * Build the final specification
   */
  build(): Specification<T> {
    if (this.specs.length === 0) {
      return new TrueSpecification<T>()
    }

    const firstSpec = this.specs[0]
    if (this.specs.length === 1 && firstSpec) {
      return firstSpec
    }

    return this.logic === 'and' ? allOf(...this.specs) : anyOf(...this.specs)
  }

  /**
   * Reset the builder
   */
  reset(): this {
    this.specs = []
    this.logic = 'and'
    return this
  }
}

// ============================================
// Factory Functions
// ============================================

/**
 * Create a new specification builder
 */
export function createBuilder<T>(): SpecificationBuilder<T> {
  return new SpecificationBuilder<T>()
}

/**
 * Create a specification from a filter object
 */
export function fromFilters<T>(
  filters: Partial<Record<keyof T, unknown>>,
  options: {
    nullableFields?: (keyof T)[]
    arrayFields?: (keyof T)[]
    searchFields?: (keyof T)[]
    searchQuery?: string
  } = {},
): Specification<T> {
  const builder = new SpecificationBuilder<T>()

  for (const [key, value] of Object.entries(filters)) {
    const field = key as keyof T

    if (value === undefined || value === null) {
      continue
    }

    // Handle array fields (IN operator)
    if (options.arrayFields?.includes(field) && Array.isArray(value)) {
      if (value.length > 0) {
        builder.whereIn(field, value as T[keyof T][])
      }
      continue
    }

    // Handle search fields
    if (options.searchFields?.includes(field) && typeof value === 'string') {
      builder.whereContains(field, value)
      continue
    }

    // Default to equals
    builder.whereEquals(field, value as T[keyof T])
  }

  // Add global search if provided
  if (options.searchQuery && options.searchFields?.length) {
    const searchBuilder = new SpecificationBuilder<T>().withLogic('or')
    for (const field of options.searchFields) {
      searchBuilder.whereContains(field, options.searchQuery)
    }
    builder.where(searchBuilder.build())
  }

  return builder.build()
}

// ============================================
// Preset Builders
// ============================================

/**
 * Create date range specification
 */
export function dateRange<T, K extends keyof T>(field: K, range: DateRange): Specification<T> {
  const builder = new SpecificationBuilder<T>()

  if (range.preset) {
    const { from, to } = getDateRangeFromPreset(range.preset)
    builder.whereBetween(field, from as T[K], to as T[K])
  } else {
    if (range.from) {
      builder.whereGreaterThan(field, new Date(range.from) as T[K])
    }
    if (range.to) {
      builder.whereLessThan(field, new Date(range.to) as T[K])
    }
  }

  return builder.build()
}

/**
 * Calculate date range from preset
 */
function getDateRangeFromPreset(preset: string): { from: Date; to: Date } {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (preset) {
    case 'today':
      return {
        from: startOfDay,
        to: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1),
      }
    case 'yesterday': {
      const yesterday = new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000)
      return {
        from: yesterday,
        to: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1),
      }
    }
    case 'last_7_days':
      return {
        from: new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000),
        to: now,
      }
    case 'last_30_days':
      return {
        from: new Date(startOfDay.getTime() - 30 * 24 * 60 * 60 * 1000),
        to: now,
      }
    case 'last_90_days':
      return {
        from: new Date(startOfDay.getTime() - 90 * 24 * 60 * 60 * 1000),
        to: now,
      }
    case 'this_month':
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      }
    case 'this_year':
      return {
        from: new Date(now.getFullYear(), 0, 1),
        to: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
      }
    case 'next_7_days':
      return {
        from: startOfDay,
        to: new Date(startOfDay.getTime() + 7 * 24 * 60 * 60 * 1000),
      }
    case 'next_30_days':
      return {
        from: startOfDay,
        to: new Date(startOfDay.getTime() + 30 * 24 * 60 * 60 * 1000),
      }
    default:
      return { from: startOfDay, to: now }
  }
}

// ============================================
// Type-Safe Field Accessors
// ============================================

/**
 * Create a type-safe field accessor for use in specifications
 */
export function field<T, K extends keyof T>(
  name: K,
): {
  equals: (value: T[K]) => EqualsSpecification<T, K>
  in: (values: T[K][]) => InSpecification<T, K>
  contains: (substring: string) => ContainsSpecification<T, K>
  greaterThan: (value: T[K]) => GreaterThanSpecification<T, K>
  lessThan: (value: T[K]) => LessThanSpecification<T, K>
  between: (min: T[K], max: T[K]) => BetweenSpecification<T, K>
  isNull: () => IsNullSpecification<T, K>
  isNotNull: () => IsNotNullSpecification<T, K>
} {
  return {
    equals: (value: T[K]) => new EqualsSpecification(name, value),
    in: (values: T[K][]) => new InSpecification(name, values),
    contains: (substring: string) => new ContainsSpecification(name, substring),
    greaterThan: (value: T[K]) => new GreaterThanSpecification(name, value),
    lessThan: (value: T[K]) => new LessThanSpecification(name, value),
    between: (min: T[K], max: T[K]) => new BetweenSpecification(name, min, max),
    isNull: () => new IsNullSpecification(name),
    isNotNull: () => new IsNotNullSpecification(name),
  }
}
