/**
 * Composite Specification Utilities
 *
 * Provides utility functions for combining multiple specifications
 * using AND/OR logic with better handling than simple chaining.
 */

import type { Specification, SupabaseQueryBuilder, SpecificationJSON } from './types'
import { BaseSpecification, TrueSpecification } from './base'

// ============================================
// Multi-Specification Composites
// ============================================

/**
 * Combines multiple specifications with AND logic.
 * More efficient than chaining .and() calls for many specs.
 */
export class AllOfSpecification<T> extends BaseSpecification<T> {
  readonly name: string

  constructor(private readonly specs: Specification<T>[]) {
    super()
    this.name = `ALL OF [${specs.map((s) => s.describe()).join(', ')}]`
  }

  isSatisfiedBy(candidate: T): boolean {
    return this.specs.every((spec) => spec.isSatisfiedBy(candidate))
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    // Apply all filters sequentially (AND is implicit in Supabase)
    let result = query
    for (const spec of this.specs) {
      result = spec.toSupabaseFilter(result) as QueryBuilder
    }
    return result
  }

  toJSON(): SpecificationJSON {
    return {
      type: 'composite',
      name: 'all_of',
      logic: 'and',
      children: this.specs.map(
        (s) =>
          (s as BaseSpecification<T>).toJSON?.() ?? {
            type: 'unknown',
            name: s.describe(),
          },
      ),
    }
  }
}

/**
 * Combines multiple specifications with OR logic.
 * More efficient than chaining .or() calls for many specs.
 */
export class AnyOfSpecification<T> extends BaseSpecification<T> {
  readonly name: string

  constructor(private readonly specs: Specification<T>[]) {
    super()
    this.name = `ANY OF [${specs.map((s) => s.describe()).join(', ')}]`
  }

  isSatisfiedBy(candidate: T): boolean {
    if (this.specs.length === 0) return true
    return this.specs.some((spec) => spec.isSatisfiedBy(candidate))
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    // OR in Supabase requires using .or() with filter strings
    // This is a complex operation - we build a filter string
    if (this.specs.length === 0) return query
    const firstSpec = this.specs[0]
    if (this.specs.length === 1 && firstSpec)
      return firstSpec.toSupabaseFilter(query) as QueryBuilder

    // For now, log a warning - complex ORs need custom handling
    console.warn(
      'AnyOfSpecification.toSupabaseFilter: Complex OR operation - consider using custom SQL',
    )
    return query
  }

  toJSON(): SpecificationJSON {
    return {
      type: 'composite',
      name: 'any_of',
      logic: 'or',
      children: this.specs.map(
        (s) =>
          (s as BaseSpecification<T>).toJSON?.() ?? {
            type: 'unknown',
            name: s.describe(),
          },
      ),
    }
  }
}

/**
 * Requires none of the specifications to be satisfied.
 */
export class NoneOfSpecification<T> extends BaseSpecification<T> {
  readonly name: string

  constructor(private readonly specs: Specification<T>[]) {
    super()
    this.name = `NONE OF [${specs.map((s) => s.describe()).join(', ')}]`
  }

  isSatisfiedBy(candidate: T): boolean {
    return !this.specs.some((spec) => spec.isSatisfiedBy(candidate))
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    // None of = NOT (any of) - complex to express in Supabase
    console.warn(
      'NoneOfSpecification.toSupabaseFilter: Complex NOT operation - consider using custom SQL',
    )
    return query
  }

  toJSON(): SpecificationJSON {
    return {
      type: 'composite',
      name: 'none_of',
      logic: 'not',
      children: this.specs.map(
        (s) =>
          (s as BaseSpecification<T>).toJSON?.() ?? {
            type: 'unknown',
            name: s.describe(),
          },
      ),
    }
  }
}

// ============================================
// Conditional Specifications
// ============================================

/**
 * Specification that only applies when a condition is met.
 * If the condition is false, it acts as a true specification.
 */
export class ConditionalSpecification<T> extends BaseSpecification<T> {
  readonly name: string

  constructor(
    private readonly condition: boolean,
    private readonly spec: Specification<T>,
  ) {
    super()
    this.name = condition ? spec.describe() : 'SKIPPED'
  }

  isSatisfiedBy(candidate: T): boolean {
    if (!this.condition) return true
    return this.spec.isSatisfiedBy(candidate)
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    if (!this.condition) return query
    return this.spec.toSupabaseFilter(query) as QueryBuilder
  }

  toJSON(): SpecificationJSON {
    if (!this.condition) {
      return { type: 'true', name: 'skipped' }
    }
    return (
      (this.spec as BaseSpecification<T>).toJSON?.() ?? {
        type: 'unknown',
        name: this.spec.describe(),
      }
    )
  }
}

/**
 * Specification that applies a spec only when a value is defined
 */
export class WhenDefinedSpecification<T, V> extends BaseSpecification<T> {
  readonly name: string

  constructor(
    private readonly value: V | undefined | null,
    private readonly createSpec: (value: V) => Specification<T>,
  ) {
    super()
    this.name =
      value !== undefined && value !== null ? createSpec(value).describe() : 'SKIPPED (undefined)'
  }

  isSatisfiedBy(candidate: T): boolean {
    if (this.value === undefined || this.value === null) return true
    return this.createSpec(this.value).isSatisfiedBy(candidate)
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    if (this.value === undefined || this.value === null) return query
    return this.createSpec(this.value).toSupabaseFilter(query) as QueryBuilder
  }

  toJSON(): SpecificationJSON {
    if (this.value === undefined || this.value === null) {
      return { type: 'true', name: 'skipped' }
    }
    const spec = this.createSpec(this.value)
    return (
      (spec as BaseSpecification<T>).toJSON?.() ?? {
        type: 'unknown',
        name: spec.describe(),
      }
    )
  }
}

// ============================================
// Factory Functions
// ============================================

/**
 * Create an all-of (AND) specification from multiple specs
 */
export function allOf<T>(...specs: Specification<T>[]): Specification<T> {
  if (specs.length === 0) return new TrueSpecification<T>()
  const firstSpec = specs[0]
  if (specs.length === 1 && firstSpec) return firstSpec
  return new AllOfSpecification(specs)
}

/**
 * Create an any-of (OR) specification from multiple specs
 */
export function anyOf<T>(...specs: Specification<T>[]): Specification<T> {
  if (specs.length === 0) return new TrueSpecification<T>()
  const firstSpec = specs[0]
  if (specs.length === 1 && firstSpec) return firstSpec
  return new AnyOfSpecification(specs)
}

/**
 * Create a none-of (NOT ANY) specification from multiple specs
 */
export function noneOf<T>(...specs: Specification<T>[]): Specification<T> {
  if (specs.length === 0) return new TrueSpecification<T>()
  return new NoneOfSpecification(specs)
}

/**
 * Create a conditional specification that only applies when condition is true
 */
export function when<T>(condition: boolean, spec: Specification<T>): Specification<T> {
  return new ConditionalSpecification(condition, spec)
}

/**
 * Create a specification that only applies when value is defined
 */
export function whenDefined<T, V>(
  value: V | undefined | null,
  createSpec: (value: V) => Specification<T>,
): Specification<T> {
  return new WhenDefinedSpecification(value, createSpec)
}

/**
 * Create a specification that only applies when array is not empty
 */
export function whenNotEmpty<T, V>(
  values: V[] | undefined | null,
  createSpec: (values: V[]) => Specification<T>,
): Specification<T> {
  const hasValues = values && values.length > 0
  return new WhenDefinedSpecification(
    hasValues ? values : null,
    createSpec as (v: V[] | null) => Specification<T>,
  )
}
