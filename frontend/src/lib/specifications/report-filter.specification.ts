/**
 * Report Filter Specification
 *
 * Encapsulates business rules for evaluating report filters and converting
 * them to Supabase queries. Supports nested filter groups with AND/OR logic.
 *
 * This specification centralizes the complex report filter logic from:
 * - frontend/src/types/report-builder.types.ts
 * - Report builder components and hooks
 *
 * @module specifications/report-filter
 */

import type {
  Specification,
  SupabaseQueryBuilder,
  SpecificationJSON,
  FilterOperator,
} from './types'
import { BaseSpecification } from './base'
import { allOf, anyOf } from './composite'

// ============================================
// Import Report Types
// ============================================

// Re-export relevant types from report-builder.types.ts
export type FieldDataType =
  | 'string'
  | 'number'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'enum'
  | 'uuid'
  | 'json'

export interface ReportFilter {
  id: string
  fieldId: string
  operator: FilterOperator
  value: unknown
  valueEnd?: unknown // For 'between' operator
}

export interface FilterGroup {
  id: string
  logic: 'and' | 'or'
  filters: ReportFilter[]
  groups: FilterGroup[]
}

// ============================================
// Operator Mapping
// ============================================

/**
 * Maps report filter operators to their evaluation functions
 */
type OperatorEvaluator = (
  fieldValue: unknown,
  filterValue: unknown,
  filterValueEnd?: unknown,
) => boolean

const OPERATOR_EVALUATORS: Record<FilterOperator, OperatorEvaluator> = {
  equals: (field, value) => field === value,
  not_equals: (field, value) => field !== value,
  contains: (field, value) => {
    if (typeof field !== 'string' || typeof value !== 'string') return false
    return field.toLowerCase().includes(value.toLowerCase())
  },
  not_contains: (field, value) => {
    if (typeof field !== 'string' || typeof value !== 'string') return true
    return !field.toLowerCase().includes(value.toLowerCase())
  },
  starts_with: (field, value) => {
    if (typeof field !== 'string' || typeof value !== 'string') return false
    return field.toLowerCase().startsWith(value.toLowerCase())
  },
  ends_with: (field, value) => {
    if (typeof field !== 'string' || typeof value !== 'string') return false
    return field.toLowerCase().endsWith(value.toLowerCase())
  },
  greater_than: (field, value) => {
    if (field == null || value == null) return false
    return field > value
  },
  less_than: (field, value) => {
    if (field == null || value == null) return false
    return field < value
  },
  greater_equal: (field, value) => {
    if (field == null || value == null) return false
    return field >= value
  },
  less_equal: (field, value) => {
    if (field == null || value == null) return false
    return field <= value
  },
  between: (field, value, valueEnd) => {
    if (field == null || value == null || valueEnd == null) return false
    return field >= value && field <= valueEnd
  },
  not_between: (field, value, valueEnd) => {
    if (field == null || value == null || valueEnd == null) return false
    return field < value || field > valueEnd
  },
  in: (field, value) => {
    if (!Array.isArray(value)) return false
    return value.includes(field)
  },
  not_in: (field, value) => {
    if (!Array.isArray(value)) return true
    return !value.includes(field)
  },
  is_null: (field) => field === null || field === undefined,
  is_not_null: (field) => field !== null && field !== undefined,
  matches_regex: (field, value) => {
    if (typeof field !== 'string' || typeof value !== 'string') return false
    try {
      const regex = new RegExp(value, 'i')
      return regex.test(field)
    } catch {
      return false
    }
  },
}

// ============================================
// Single Filter Specification
// ============================================

/**
 * Specification that evaluates a single report filter condition
 */
export class ReportFilterConditionSpecification<
  T extends Record<string, unknown>,
> extends BaseSpecification<T> {
  readonly name: string

  constructor(private readonly filter: ReportFilter) {
    super()
    this.name = `${filter.fieldId} ${filter.operator} ${JSON.stringify(filter.value)}`
  }

  /**
   * Get the field value from a nested path like "dossiers.status"
   */
  private getFieldValue(candidate: T): unknown {
    const parts = this.filter.fieldId.split('.')
    let value: unknown = candidate

    for (const part of parts) {
      if (value === null || value === undefined) return undefined
      if (typeof value !== 'object') return undefined
      value = (value as Record<string, unknown>)[part]
    }

    return value
  }

  isSatisfiedBy(candidate: T): boolean {
    const fieldValue = this.getFieldValue(candidate)
    const evaluator = OPERATOR_EVALUATORS[this.filter.operator]

    if (!evaluator) {
      console.warn(`Unknown operator: ${this.filter.operator}`)
      return true // Unknown operators pass through
    }

    return evaluator(fieldValue, this.filter.value, this.filter.valueEnd)
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    const column = this.filter.fieldId.split('.').pop() || this.filter.fieldId
    const { operator, value, valueEnd } = this.filter

    switch (operator) {
      case 'equals':
        return query.eq(column, value) as QueryBuilder
      case 'not_equals':
        return query.neq(column, value) as QueryBuilder
      case 'contains':
        return query.ilike(column, `%${value}%`) as QueryBuilder
      case 'not_contains':
        return query.not(column, 'ilike', `%${value}%`) as QueryBuilder
      case 'starts_with':
        return query.ilike(column, `${value}%`) as QueryBuilder
      case 'ends_with':
        return query.ilike(column, `%${value}`) as QueryBuilder
      case 'greater_than':
        return query.gt(column, value) as QueryBuilder
      case 'less_than':
        return query.lt(column, value) as QueryBuilder
      case 'greater_equal':
        return query.gte(column, value) as QueryBuilder
      case 'less_equal':
        return query.lte(column, value) as QueryBuilder
      case 'between':
        return query.gte(column, value).lte(column, valueEnd) as QueryBuilder
      case 'not_between':
        // NOT BETWEEN requires OR: value < min OR value > max
        return query.or(`${column}.lt.${value},${column}.gt.${valueEnd}`) as QueryBuilder
      case 'in':
        return query.in(column, value as unknown[]) as QueryBuilder
      case 'not_in':
        return query.not(column, 'in', `(${(value as unknown[]).join(',')})`) as QueryBuilder
      case 'is_null':
        return query.is(column, null) as QueryBuilder
      case 'is_not_null':
        return query.not(column, 'is', null) as QueryBuilder
      case 'matches_regex':
        return query.match({ [column]: value }) as QueryBuilder
      default:
        return query
    }
  }

  toJSON(): SpecificationJSON {
    return {
      type: 'report_filter_condition',
      name: this.name,
      params: {
        fieldId: this.filter.fieldId,
        operator: this.filter.operator,
        value: this.filter.value,
        valueEnd: this.filter.valueEnd,
      },
    }
  }
}

// ============================================
// Filter Group Specification
// ============================================

/**
 * Specification that evaluates a filter group with nested groups and filters
 */
export class ReportFilterGroupSpecification<
  T extends Record<string, unknown>,
> extends BaseSpecification<T> {
  readonly name: string
  private readonly compositeSpec: Specification<T>

  constructor(private readonly group: FilterGroup) {
    super()

    // Build specifications for all filters in this group
    const filterSpecs = group.filters.map((f) => new ReportFilterConditionSpecification<T>(f))

    // Recursively build specifications for nested groups
    const groupSpecs = group.groups.map((g) => new ReportFilterGroupSpecification<T>(g))

    // Combine all specs
    const allSpecs: Specification<T>[] = [...filterSpecs, ...groupSpecs]

    // Apply logic operator
    if (allSpecs.length === 0) {
      // Empty group - always true
      this.compositeSpec = {
        isSatisfiedBy: () => true,
        and: (other) => other,
        or: (other) => other,
        not: () => ({
          isSatisfiedBy: () => false,
          and: () => this.compositeSpec,
          or: () => this.compositeSpec,
          not: () => this.compositeSpec,
          toSupabaseFilter: (q) => q,
          describe: () => 'FALSE',
        }),
        toSupabaseFilter: (q) => q,
        describe: () => 'TRUE',
      }
    } else if (group.logic === 'and') {
      this.compositeSpec = allOf(...allSpecs)
    } else {
      this.compositeSpec = anyOf(...allSpecs)
    }

    this.name = `FilterGroup(${group.logic.toUpperCase()}, ${allSpecs.length} conditions)`
  }

  isSatisfiedBy(candidate: T): boolean {
    return this.compositeSpec.isSatisfiedBy(candidate)
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    if (this.group.logic === 'and') {
      // AND is implicit in Supabase - apply all filters
      return this.compositeSpec.toSupabaseFilter(query) as QueryBuilder
    } else {
      // OR requires special handling
      // Build OR clause from filters
      const filterClauses = this.group.filters.map((f) => {
        const column = f.fieldId.split('.').pop() || f.fieldId
        return this.buildFilterClause(column, f.operator, f.value, f.valueEnd)
      })

      if (filterClauses.length > 0 && filterClauses.every(Boolean)) {
        return query.or(filterClauses.join(',')) as QueryBuilder
      }

      // Fallback for complex nested ORs
      console.warn('Complex nested OR groups may not translate perfectly to Supabase')
      return query
    }
  }

  private buildFilterClause(
    column: string,
    operator: FilterOperator,
    value: unknown,
    _valueEnd?: unknown,
  ): string {
    switch (operator) {
      case 'equals':
        return `${column}.eq.${value}`
      case 'not_equals':
        return `${column}.neq.${value}`
      case 'contains':
        return `${column}.ilike.%${value}%`
      case 'starts_with':
        return `${column}.ilike.${value}%`
      case 'ends_with':
        return `${column}.ilike.%${value}`
      case 'greater_than':
        return `${column}.gt.${value}`
      case 'less_than':
        return `${column}.lt.${value}`
      case 'greater_equal':
        return `${column}.gte.${value}`
      case 'less_equal':
        return `${column}.lte.${value}`
      case 'in':
        return `${column}.in.(${(value as unknown[]).join(',')})`
      case 'is_null':
        return `${column}.is.null`
      case 'is_not_null':
        return `${column}.not.is.null`
      default:
        return ''
    }
  }

  describe(): string {
    return this.compositeSpec.describe()
  }

  toJSON(): SpecificationJSON {
    return {
      type: 'report_filter_group',
      name: this.name,
      logic: this.group.logic,
      params: {
        logic: this.group.logic,
        filterCount: this.group.filters.length,
        groupCount: this.group.groups.length,
      },
    }
  }
}

// ============================================
// Field Type Validation
// ============================================

/**
 * Get valid operators for a field data type
 */
export function getValidOperatorsForType(fieldType: FieldDataType): FilterOperator[] {
  const baseOperators: FilterOperator[] = ['equals', 'not_equals', 'is_null', 'is_not_null']

  switch (fieldType) {
    case 'string':
      return [
        ...baseOperators,
        'contains',
        'not_contains',
        'starts_with',
        'ends_with',
        'in',
        'not_in',
        'matches_regex',
      ]
    case 'number':
      return [
        ...baseOperators,
        'greater_than',
        'less_than',
        'greater_equal',
        'less_equal',
        'between',
        'not_between',
        'in',
        'not_in',
      ]
    case 'date':
    case 'datetime':
      return [
        ...baseOperators,
        'greater_than',
        'less_than',
        'greater_equal',
        'less_equal',
        'between',
        'not_between',
      ]
    case 'boolean':
      return baseOperators
    case 'enum':
      return [...baseOperators, 'in', 'not_in']
    case 'uuid':
      return ['equals', 'not_equals', 'in', 'not_in', 'is_null', 'is_not_null']
    case 'json':
      return ['is_null', 'is_not_null', 'contains']
    default:
      return baseOperators
  }
}

/**
 * Validate that an operator is valid for a field type
 */
export function isValidOperatorForType(
  operator: FilterOperator,
  fieldType: FieldDataType,
): boolean {
  const validOperators = getValidOperatorsForType(fieldType)
  return validOperators.includes(operator)
}

/**
 * Validate a filter value based on operator
 */
export function validateFilterValue(
  operator: FilterOperator,
  value: unknown,
  valueEnd?: unknown,
): { valid: boolean; error?: string } {
  // Check for null/undefined
  if (operator !== 'is_null' && operator !== 'is_not_null') {
    if (value === null || value === undefined) {
      return { valid: false, error: 'Value is required for this operator' }
    }
  }

  // Check between requires valueEnd
  if (operator === 'between' || operator === 'not_between') {
    if (valueEnd === null || valueEnd === undefined) {
      return { valid: false, error: 'End value is required for between operators' }
    }
  }

  // Check in/not_in requires array
  if (operator === 'in' || operator === 'not_in') {
    if (!Array.isArray(value)) {
      return { valid: false, error: 'Value must be an array for in/not_in operators' }
    }
    if (value.length === 0) {
      return { valid: false, error: 'At least one value is required' }
    }
  }

  return { valid: true }
}

// ============================================
// Factory Functions
// ============================================

/**
 * Create a specification from a single filter
 */
export function fromFilter<T extends Record<string, unknown>>(
  filter: ReportFilter,
): ReportFilterConditionSpecification<T> {
  return new ReportFilterConditionSpecification(filter)
}

/**
 * Create a specification from a filter group
 */
export function fromFilterGroup<T extends Record<string, unknown>>(
  group: FilterGroup,
): ReportFilterGroupSpecification<T> {
  return new ReportFilterGroupSpecification(group)
}

/**
 * Create an empty filter group specification (always true)
 */
export function emptyFilterGroup<
  T extends Record<string, unknown>,
>(): ReportFilterGroupSpecification<T> {
  return new ReportFilterGroupSpecification({
    id: 'empty',
    logic: 'and',
    filters: [],
    groups: [],
  })
}

// ============================================
// Helper Functions
// ============================================

/**
 * Count total conditions in a filter group (including nested)
 */
export function countConditions(group: FilterGroup): number {
  let count = group.filters.length
  for (const nested of group.groups) {
    count += countConditions(nested)
  }
  return count
}

/**
 * Get maximum nesting depth of filter groups
 */
export function getMaxDepth(group: FilterGroup, currentDepth = 0): number {
  if (group.groups.length === 0) return currentDepth

  return Math.max(...group.groups.map((g) => getMaxDepth(g, currentDepth + 1)))
}

/**
 * Flatten a filter group into a list of all filters
 */
export function flattenFilters(group: FilterGroup): ReportFilter[] {
  const filters = [...group.filters]
  for (const nested of group.groups) {
    filters.push(...flattenFilters(nested))
  }
  return filters
}

/**
 * Check if a filter group is empty (no conditions)
 */
export function isEmptyFilterGroup(group: FilterGroup): boolean {
  return countConditions(group) === 0
}

/**
 * Create a filter from field, operator, and value
 */
export function createFilter(
  fieldId: string,
  operator: FilterOperator,
  value: unknown,
  valueEnd?: unknown,
): ReportFilter {
  return {
    id: crypto.randomUUID(),
    fieldId,
    operator,
    value,
    valueEnd,
  }
}

/**
 * Create a filter group with AND logic
 */
export function andGroup(...filters: ReportFilter[]): FilterGroup {
  return {
    id: crypto.randomUUID(),
    logic: 'and',
    filters,
    groups: [],
  }
}

/**
 * Create a filter group with OR logic
 */
export function orGroup(...filters: ReportFilter[]): FilterGroup {
  return {
    id: crypto.randomUUID(),
    logic: 'or',
    filters,
    groups: [],
  }
}

/**
 * Merge multiple filter groups with a logic operator
 */
export function mergeGroups(logic: 'and' | 'or', ...groups: FilterGroup[]): FilterGroup {
  return {
    id: crypto.randomUUID(),
    logic,
    filters: [],
    groups,
  }
}
