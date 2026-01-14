/**
 * Base Specification Implementation
 *
 * Provides the abstract base class for all specifications, implementing
 * the composable AND/OR/NOT operations and default behavior.
 */

import type {
  Specification,
  ExtendedSpecification,
  SupabaseQueryBuilder,
  SpecificationJSON,
} from './types'

// ============================================
// Abstract Base Specification
// ============================================

/**
 * Abstract base class for all specifications.
 * Provides default implementations for composition methods.
 *
 * @template T - The type of entity this specification evaluates
 */
export abstract class BaseSpecification<T> implements ExtendedSpecification<T> {
  abstract readonly name: string

  /**
   * Evaluate if a candidate satisfies this specification.
   * Must be implemented by concrete specifications.
   */
  abstract isSatisfiedBy(candidate: T): boolean

  /**
   * Apply this specification to a Supabase query builder.
   * Must be implemented by concrete specifications.
   */
  abstract toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(
    query: QueryBuilder,
  ): QueryBuilder

  /**
   * Get a human-readable description.
   * Can be overridden by concrete specifications.
   */
  describe(): string {
    return this.name
  }

  /**
   * Combine with another specification using AND logic
   */
  and(other: Specification<T>): Specification<T> {
    return new AndSpecification<T>(this, other)
  }

  /**
   * Combine with another specification using OR logic
   */
  or(other: Specification<T>): Specification<T> {
    return new OrSpecification<T>(this, other)
  }

  /**
   * Negate this specification
   */
  not(): Specification<T> {
    return new NotSpecification<T>(this)
  }

  /**
   * Convert to JSON for serialization
   */
  toJSON(): SpecificationJSON {
    return {
      type: 'base',
      name: this.name,
    }
  }
}

// ============================================
// Composite Specifications
// ============================================

/**
 * AND composite specification - requires all child specs to be satisfied
 */
export class AndSpecification<T> extends BaseSpecification<T> {
  readonly name: string

  constructor(
    private readonly left: Specification<T>,
    private readonly right: Specification<T>,
  ) {
    super()
    this.name = `(${left.describe()} AND ${right.describe()})`
  }

  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) && this.right.isSatisfiedBy(candidate)
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    // Apply both filters to the query (implicitly AND)
    let result = this.left.toSupabaseFilter(query)
    result = this.right.toSupabaseFilter(result)
    return result as QueryBuilder
  }

  describe(): string {
    return this.name
  }

  toJSON(): SpecificationJSON {
    const leftJSON = (this.left as BaseSpecification<T>).toJSON?.() ?? {
      type: 'unknown',
      name: this.left.describe(),
    }
    const rightJSON = (this.right as BaseSpecification<T>).toJSON?.() ?? {
      type: 'unknown',
      name: this.right.describe(),
    }

    return {
      type: 'composite',
      name: 'and',
      logic: 'and',
      children: [leftJSON, rightJSON],
    }
  }
}

/**
 * OR composite specification - requires at least one child spec to be satisfied
 */
export class OrSpecification<T> extends BaseSpecification<T> {
  readonly name: string

  constructor(
    private readonly left: Specification<T>,
    private readonly right: Specification<T>,
  ) {
    super()
    this.name = `(${left.describe()} OR ${right.describe()})`
  }

  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) || this.right.isSatisfiedBy(candidate)
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    // Build OR clause for Supabase
    // This requires building the filter string manually
    const leftDesc = this.left.describe()
    const rightDesc = this.right.describe()

    // For complex OR conditions, we need to use the .or() method
    // This is a simplified implementation - complex ORs may need custom handling
    console.warn(
      `OrSpecification.toSupabaseFilter: Complex OR between "${leftDesc}" and "${rightDesc}" - may require custom implementation`,
    )

    // Apply both as separate filters and let Supabase handle via .or()
    // Note: This is a limitation - complex nested ORs need manual SQL
    return query
  }

  describe(): string {
    return this.name
  }

  toJSON(): SpecificationJSON {
    const leftJSON = (this.left as BaseSpecification<T>).toJSON?.() ?? {
      type: 'unknown',
      name: this.left.describe(),
    }
    const rightJSON = (this.right as BaseSpecification<T>).toJSON?.() ?? {
      type: 'unknown',
      name: this.right.describe(),
    }

    return {
      type: 'composite',
      name: 'or',
      logic: 'or',
      children: [leftJSON, rightJSON],
    }
  }
}

/**
 * NOT specification - negates the child specification
 */
export class NotSpecification<T> extends BaseSpecification<T> {
  readonly name: string

  constructor(private readonly spec: Specification<T>) {
    super()
    this.name = `NOT (${spec.describe()})`
  }

  isSatisfiedBy(candidate: T): boolean {
    return !this.spec.isSatisfiedBy(candidate)
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    // NOT filters require special handling in Supabase
    // This is a simplified implementation
    console.warn(
      `NotSpecification.toSupabaseFilter: Negating "${this.spec.describe()}" - may require custom implementation`,
    )
    return query
  }

  describe(): string {
    return this.name
  }

  toJSON(): SpecificationJSON {
    const childJSON = (this.spec as BaseSpecification<T>).toJSON?.() ?? {
      type: 'unknown',
      name: this.spec.describe(),
    }

    return {
      type: 'composite',
      name: 'not',
      logic: 'not',
      children: [childJSON],
    }
  }
}

// ============================================
// Utility Specifications
// ============================================

/**
 * Always true specification - useful for conditional composition
 */
export class TrueSpecification<T> extends BaseSpecification<T> {
  readonly name = 'TRUE'

  isSatisfiedBy(): boolean {
    return true
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    // No filter needed - returns all
    return query
  }
}

/**
 * Always false specification - useful for conditional composition
 */
export class FalseSpecification<T> extends BaseSpecification<T> {
  readonly name = 'FALSE'

  isSatisfiedBy(): boolean {
    return false
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    // Filter that matches nothing
    // Use a condition that's always false
    return query.eq('1', '0') as QueryBuilder
  }
}

// ============================================
// Field-Based Specifications
// ============================================

/**
 * Specification that checks if a field equals a value
 */
export class EqualsSpecification<T, K extends keyof T> extends BaseSpecification<T> {
  readonly name: string

  constructor(
    private readonly field: K,
    private readonly value: T[K],
  ) {
    super()
    this.name = `${String(field)} = ${String(value)}`
  }

  isSatisfiedBy(candidate: T): boolean {
    return candidate[this.field] === this.value
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    return query.eq(String(this.field), this.value) as QueryBuilder
  }

  toJSON(): SpecificationJSON {
    return {
      type: 'equals',
      name: this.name,
      params: { field: String(this.field), value: this.value },
    }
  }
}

/**
 * Specification that checks if a field is in a list of values
 */
export class InSpecification<T, K extends keyof T> extends BaseSpecification<T> {
  readonly name: string

  constructor(
    private readonly field: K,
    private readonly values: T[K][],
  ) {
    super()
    this.name = `${String(field)} IN [${values.map(String).join(', ')}]`
  }

  isSatisfiedBy(candidate: T): boolean {
    return this.values.includes(candidate[this.field])
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    if (this.values.length === 0) {
      // Empty IN clause - return nothing
      return query.eq('1', '0') as QueryBuilder
    }
    return query.in(String(this.field), this.values) as QueryBuilder
  }

  toJSON(): SpecificationJSON {
    return {
      type: 'in',
      name: this.name,
      params: { field: String(this.field), values: this.values },
    }
  }
}

/**
 * Specification that checks if a field contains a substring (case-insensitive)
 */
export class ContainsSpecification<T, K extends keyof T> extends BaseSpecification<T> {
  readonly name: string

  constructor(
    private readonly field: K,
    private readonly substring: string,
  ) {
    super()
    this.name = `${String(field)} CONTAINS "${substring}"`
  }

  isSatisfiedBy(candidate: T): boolean {
    const value = candidate[this.field]
    if (typeof value !== 'string') return false
    return value.toLowerCase().includes(this.substring.toLowerCase())
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    return query.ilike(String(this.field), `%${this.substring}%`) as QueryBuilder
  }

  toJSON(): SpecificationJSON {
    return {
      type: 'contains',
      name: this.name,
      params: { field: String(this.field), substring: this.substring },
    }
  }
}

/**
 * Specification that checks if a field is greater than a value
 */
export class GreaterThanSpecification<T, K extends keyof T> extends BaseSpecification<T> {
  readonly name: string

  constructor(
    private readonly field: K,
    private readonly value: T[K],
  ) {
    super()
    this.name = `${String(field)} > ${String(value)}`
  }

  isSatisfiedBy(candidate: T): boolean {
    return candidate[this.field] > this.value
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    return query.gt(String(this.field), this.value) as QueryBuilder
  }

  toJSON(): SpecificationJSON {
    return {
      type: 'greater_than',
      name: this.name,
      params: { field: String(this.field), value: this.value },
    }
  }
}

/**
 * Specification that checks if a field is less than a value
 */
export class LessThanSpecification<T, K extends keyof T> extends BaseSpecification<T> {
  readonly name: string

  constructor(
    private readonly field: K,
    private readonly value: T[K],
  ) {
    super()
    this.name = `${String(field)} < ${String(value)}`
  }

  isSatisfiedBy(candidate: T): boolean {
    return candidate[this.field] < this.value
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    return query.lt(String(this.field), this.value) as QueryBuilder
  }

  toJSON(): SpecificationJSON {
    return {
      type: 'less_than',
      name: this.name,
      params: { field: String(this.field), value: this.value },
    }
  }
}

/**
 * Specification that checks if a field is between two values (inclusive)
 */
export class BetweenSpecification<T, K extends keyof T> extends BaseSpecification<T> {
  readonly name: string

  constructor(
    private readonly field: K,
    private readonly min: T[K],
    private readonly max: T[K],
  ) {
    super()
    this.name = `${String(field)} BETWEEN ${String(min)} AND ${String(max)}`
  }

  isSatisfiedBy(candidate: T): boolean {
    const value = candidate[this.field]
    return value >= this.min && value <= this.max
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    return query.gte(String(this.field), this.min).lte(String(this.field), this.max) as QueryBuilder
  }

  toJSON(): SpecificationJSON {
    return {
      type: 'between',
      name: this.name,
      params: { field: String(this.field), min: this.min, max: this.max },
    }
  }
}

/**
 * Specification that checks if a field is null
 */
export class IsNullSpecification<T, K extends keyof T> extends BaseSpecification<T> {
  readonly name: string

  constructor(private readonly field: K) {
    super()
    this.name = `${String(field)} IS NULL`
  }

  isSatisfiedBy(candidate: T): boolean {
    return candidate[this.field] === null || candidate[this.field] === undefined
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    return query.is(String(this.field), null) as QueryBuilder
  }

  toJSON(): SpecificationJSON {
    return {
      type: 'is_null',
      name: this.name,
      params: { field: String(this.field) },
    }
  }
}

/**
 * Specification that checks if a field is not null
 */
export class IsNotNullSpecification<T, K extends keyof T> extends BaseSpecification<T> {
  readonly name: string

  constructor(private readonly field: K) {
    super()
    this.name = `${String(field)} IS NOT NULL`
  }

  isSatisfiedBy(candidate: T): boolean {
    return candidate[this.field] !== null && candidate[this.field] !== undefined
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    return query.not(String(this.field), 'is', null) as QueryBuilder
  }

  toJSON(): SpecificationJSON {
    return {
      type: 'is_not_null',
      name: this.name,
      params: { field: String(this.field) },
    }
  }
}

// ============================================
// Factory Functions
// ============================================

/**
 * Create an equals specification
 */
export function equals<T, K extends keyof T>(field: K, value: T[K]): EqualsSpecification<T, K> {
  return new EqualsSpecification(field, value)
}

/**
 * Create an in specification
 */
export function isIn<T, K extends keyof T>(field: K, values: T[K][]): InSpecification<T, K> {
  return new InSpecification(field, values)
}

/**
 * Create a contains specification
 */
export function contains<T, K extends keyof T>(
  field: K,
  substring: string,
): ContainsSpecification<T, K> {
  return new ContainsSpecification(field, substring)
}

/**
 * Create a greater than specification
 */
export function greaterThan<T, K extends keyof T>(
  field: K,
  value: T[K],
): GreaterThanSpecification<T, K> {
  return new GreaterThanSpecification(field, value)
}

/**
 * Create a less than specification
 */
export function lessThan<T, K extends keyof T>(field: K, value: T[K]): LessThanSpecification<T, K> {
  return new LessThanSpecification(field, value)
}

/**
 * Create a between specification
 */
export function between<T, K extends keyof T>(
  field: K,
  min: T[K],
  max: T[K],
): BetweenSpecification<T, K> {
  return new BetweenSpecification(field, min, max)
}

/**
 * Create an is null specification
 */
export function isNull<T, K extends keyof T>(field: K): IsNullSpecification<T, K> {
  return new IsNullSpecification(field)
}

/**
 * Create an is not null specification
 */
export function isNotNull<T, K extends keyof T>(field: K): IsNotNullSpecification<T, K> {
  return new IsNotNullSpecification(field)
}

/**
 * Create an always true specification
 */
export function alwaysTrue<T>(): TrueSpecification<T> {
  return new TrueSpecification<T>()
}

/**
 * Create an always false specification
 */
export function alwaysFalse<T>(): FalseSpecification<T> {
  return new FalseSpecification<T>()
}
