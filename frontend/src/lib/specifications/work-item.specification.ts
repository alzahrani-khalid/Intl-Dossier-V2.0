/**
 * Unified Work Items Specification
 *
 * Encapsulates business rules for filtering and querying work items
 * (commitments, tasks, intake tickets) across the application.
 *
 * This specification centralizes the duplicated query logic from:
 * - frontend/src/hooks/useUnifiedWork.ts
 * - frontend/src/services/unified-work.service.ts
 * - supabase/functions/unified-work-list/index.ts
 *
 * @module specifications/work-item
 */

import type { Specification, SupabaseQueryBuilder, SpecificationJSON, DateRange } from './types'
import { BaseSpecification } from './base'
import { allOf } from './composite'

// ============================================
// Work Item Types (from unified-work.types.ts)
// ============================================

export type WorkSource = 'commitment' | 'task' | 'intake'
export type TrackingType = 'delivery' | 'follow_up' | 'sla'
export type WorkItemStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'overdue'
  | 'resolved'
  | 'closed'
  | 'done'
export type WorkItemPriority = 'low' | 'medium' | 'high' | 'critical' | 'urgent'

/**
 * Represents a unified work item (commitment, task, or intake ticket)
 */
export interface WorkItem {
  id: string
  source: WorkSource
  title: string
  description: string | null
  priority: string
  status: string
  assigned_to: string
  deadline: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  dossier_id: string | null
  tracking_type: TrackingType
  is_overdue: boolean
  days_until_due: number | null
}

/**
 * Filter parameters for work items (matches WorkItemFilters)
 */
export interface WorkItemFilters {
  sources?: WorkSource[]
  trackingTypes?: TrackingType[]
  statuses?: string[]
  priorities?: string[]
  isOverdue?: boolean
  dossierId?: string
  searchQuery?: string
  assignedTo?: string
  dateRange?: DateRange
}

// ============================================
// Source Specification
// ============================================

/**
 * Specification that filters work items by their source type
 */
export class WorkItemSourceSpecification extends BaseSpecification<WorkItem> {
  readonly name: string

  constructor(private readonly sources: WorkSource[]) {
    super()
    this.name = `source IN [${sources.join(', ')}]`
  }

  isSatisfiedBy(candidate: WorkItem): boolean {
    if (this.sources.length === 0) return true
    return this.sources.includes(candidate.source)
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    if (this.sources.length === 0) return query
    return query.in('source', this.sources) as QueryBuilder
  }

  toJSON(): SpecificationJSON {
    return {
      type: 'work_item_source',
      name: this.name,
      params: { sources: this.sources },
    }
  }
}

// ============================================
// Tracking Type Specification
// ============================================

/**
 * Specification that filters work items by tracking type
 */
export class WorkItemTrackingTypeSpecification extends BaseSpecification<WorkItem> {
  readonly name: string

  constructor(private readonly trackingTypes: TrackingType[]) {
    super()
    this.name = `tracking_type IN [${trackingTypes.join(', ')}]`
  }

  isSatisfiedBy(candidate: WorkItem): boolean {
    if (this.trackingTypes.length === 0) return true
    return this.trackingTypes.includes(candidate.tracking_type)
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    if (this.trackingTypes.length === 0) return query
    return query.in('tracking_type', this.trackingTypes) as QueryBuilder
  }

  toJSON(): SpecificationJSON {
    return {
      type: 'work_item_tracking_type',
      name: this.name,
      params: { trackingTypes: this.trackingTypes },
    }
  }
}

// ============================================
// Status Specification
// ============================================

/**
 * Specification that filters work items by status
 */
export class WorkItemStatusSpecification extends BaseSpecification<WorkItem> {
  readonly name: string

  constructor(private readonly statuses: string[]) {
    super()
    this.name = `status IN [${statuses.join(', ')}]`
  }

  isSatisfiedBy(candidate: WorkItem): boolean {
    if (this.statuses.length === 0) return true
    return this.statuses.includes(candidate.status)
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    if (this.statuses.length === 0) return query
    return query.in('status', this.statuses) as QueryBuilder
  }

  toJSON(): SpecificationJSON {
    return {
      type: 'work_item_status',
      name: this.name,
      params: { statuses: this.statuses },
    }
  }
}

// ============================================
// Priority Specification
// ============================================

/**
 * Specification that filters work items by priority
 */
export class WorkItemPrioritySpecification extends BaseSpecification<WorkItem> {
  readonly name: string

  constructor(private readonly priorities: string[]) {
    super()
    this.name = `priority IN [${priorities.join(', ')}]`
  }

  isSatisfiedBy(candidate: WorkItem): boolean {
    if (this.priorities.length === 0) return true
    return this.priorities.includes(candidate.priority)
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    if (this.priorities.length === 0) return query
    return query.in('priority', this.priorities) as QueryBuilder
  }

  toJSON(): SpecificationJSON {
    return {
      type: 'work_item_priority',
      name: this.name,
      params: { priorities: this.priorities },
    }
  }
}

// ============================================
// Overdue Specification
// ============================================

/**
 * Specification that filters work items by overdue status
 */
export class WorkItemOverdueSpecification extends BaseSpecification<WorkItem> {
  readonly name: string

  constructor(private readonly isOverdue: boolean) {
    super()
    this.name = isOverdue ? 'is_overdue = true' : 'is_overdue = false'
  }

  isSatisfiedBy(candidate: WorkItem): boolean {
    return candidate.is_overdue === this.isOverdue
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    return query.eq('is_overdue', this.isOverdue) as QueryBuilder
  }

  toJSON(): SpecificationJSON {
    return {
      type: 'work_item_overdue',
      name: this.name,
      params: { isOverdue: this.isOverdue },
    }
  }
}

// ============================================
// Dossier Specification
// ============================================

/**
 * Specification that filters work items by associated dossier
 */
export class WorkItemDossierSpecification extends BaseSpecification<WorkItem> {
  readonly name: string

  constructor(private readonly dossierId: string) {
    super()
    this.name = `dossier_id = ${dossierId}`
  }

  isSatisfiedBy(candidate: WorkItem): boolean {
    return candidate.dossier_id === this.dossierId
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    return query.eq('dossier_id', this.dossierId) as QueryBuilder
  }

  toJSON(): SpecificationJSON {
    return {
      type: 'work_item_dossier',
      name: this.name,
      params: { dossierId: this.dossierId },
    }
  }
}

// ============================================
// Search Specification
// ============================================

/**
 * Specification that filters work items by search query (title/description)
 */
export class WorkItemSearchSpecification extends BaseSpecification<WorkItem> {
  readonly name: string

  constructor(private readonly searchQuery: string) {
    super()
    this.name = `search "${searchQuery}"`
  }

  isSatisfiedBy(candidate: WorkItem): boolean {
    const query = this.searchQuery.toLowerCase()
    const titleMatch = candidate.title.toLowerCase().includes(query)
    const descMatch = candidate.description?.toLowerCase().includes(query) ?? false
    return titleMatch || descMatch
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    // Use OR for title and description search
    return query.or(
      `title.ilike.%${this.searchQuery}%,description.ilike.%${this.searchQuery}%`,
    ) as QueryBuilder
  }

  toJSON(): SpecificationJSON {
    return {
      type: 'work_item_search',
      name: this.name,
      params: { searchQuery: this.searchQuery },
    }
  }
}

// ============================================
// Assignee Specification
// ============================================

/**
 * Specification that filters work items by assignee
 */
export class WorkItemAssigneeSpecification extends BaseSpecification<WorkItem> {
  readonly name: string

  constructor(private readonly assignedTo: string) {
    super()
    this.name = `assigned_to = ${assignedTo}`
  }

  isSatisfiedBy(candidate: WorkItem): boolean {
    return candidate.assigned_to === this.assignedTo
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    return query.eq('assigned_to', this.assignedTo) as QueryBuilder
  }

  toJSON(): SpecificationJSON {
    return {
      type: 'work_item_assignee',
      name: this.name,
      params: { assignedTo: this.assignedTo },
    }
  }
}

// ============================================
// Deadline Date Range Specification
// ============================================

/**
 * Specification that filters work items by deadline date range
 */
export class WorkItemDeadlineRangeSpecification extends BaseSpecification<WorkItem> {
  readonly name: string
  private readonly fromDate: Date | null
  private readonly toDate: Date | null

  constructor(dateRange: DateRange) {
    super()

    // Calculate actual dates from preset or explicit range
    const { from, to } = this.calculateDateRange(dateRange)
    this.fromDate = from
    this.toDate = to

    const fromStr = from ? from.toISOString().split('T')[0] : '*'
    const toStr = to ? to.toISOString().split('T')[0] : '*'
    this.name = `deadline BETWEEN ${fromStr} AND ${toStr}`
  }

  private calculateDateRange(dateRange: DateRange): { from: Date | null; to: Date | null } {
    if (dateRange.preset) {
      return this.presetToDateRange(dateRange.preset)
    }

    return {
      from: dateRange.from ? new Date(dateRange.from) : null,
      to: dateRange.to ? new Date(dateRange.to) : null,
    }
  }

  private presetToDateRange(preset: string): { from: Date | null; to: Date | null } {
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
        return { from: null, to: null }
    }
  }

  isSatisfiedBy(candidate: WorkItem): boolean {
    if (!candidate.deadline) return false

    const deadline = new Date(candidate.deadline)

    if (this.fromDate && deadline < this.fromDate) return false
    if (this.toDate && deadline > this.toDate) return false

    return true
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    let result = query

    if (this.fromDate) {
      result = result.gte('deadline', this.fromDate.toISOString()) as QueryBuilder
    }
    if (this.toDate) {
      result = result.lte('deadline', this.toDate.toISOString()) as QueryBuilder
    }

    return result
  }

  toJSON(): SpecificationJSON {
    return {
      type: 'work_item_deadline_range',
      name: this.name,
      params: {
        from: this.fromDate?.toISOString() ?? null,
        to: this.toDate?.toISOString() ?? null,
      },
    }
  }
}

// ============================================
// Composite Work Item Specification
// ============================================

/**
 * Creates a composite specification from WorkItemFilters.
 * This is the main entry point for creating work item specifications.
 */
export class WorkItemFilterSpecification extends BaseSpecification<WorkItem> {
  readonly name = 'WorkItemFilter'
  private readonly compositeSpec: Specification<WorkItem>

  constructor(private readonly filters: WorkItemFilters) {
    super()

    // Build a composite specification from all filter parameters
    const specs: Specification<WorkItem>[] = []

    // Source filter
    if (filters.sources && filters.sources.length > 0) {
      specs.push(new WorkItemSourceSpecification(filters.sources))
    }

    // Tracking type filter
    if (filters.trackingTypes && filters.trackingTypes.length > 0) {
      specs.push(new WorkItemTrackingTypeSpecification(filters.trackingTypes))
    }

    // Status filter
    if (filters.statuses && filters.statuses.length > 0) {
      specs.push(new WorkItemStatusSpecification(filters.statuses))
    }

    // Priority filter
    if (filters.priorities && filters.priorities.length > 0) {
      specs.push(new WorkItemPrioritySpecification(filters.priorities))
    }

    // Overdue filter
    if (filters.isOverdue !== undefined) {
      specs.push(new WorkItemOverdueSpecification(filters.isOverdue))
    }

    // Dossier filter
    if (filters.dossierId) {
      specs.push(new WorkItemDossierSpecification(filters.dossierId))
    }

    // Search query filter
    if (filters.searchQuery) {
      specs.push(new WorkItemSearchSpecification(filters.searchQuery))
    }

    // Assignee filter
    if (filters.assignedTo) {
      specs.push(new WorkItemAssigneeSpecification(filters.assignedTo))
    }

    // Date range filter
    if (filters.dateRange) {
      specs.push(new WorkItemDeadlineRangeSpecification(filters.dateRange))
    }

    this.compositeSpec = allOf(...specs)
  }

  isSatisfiedBy(candidate: WorkItem): boolean {
    return this.compositeSpec.isSatisfiedBy(candidate)
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    return this.compositeSpec.toSupabaseFilter(query) as QueryBuilder
  }

  describe(): string {
    return this.compositeSpec.describe()
  }

  toJSON(): SpecificationJSON {
    return {
      type: 'work_item_filter',
      name: this.name,
      params: this.filters as Record<string, unknown>,
    }
  }
}

// ============================================
// Factory Functions
// ============================================

/**
 * Create a specification for filtering work items by source
 */
export function bySource(...sources: WorkSource[]): WorkItemSourceSpecification {
  return new WorkItemSourceSpecification(sources)
}

/**
 * Create a specification for filtering work items by tracking type
 */
export function byTrackingType(
  ...trackingTypes: TrackingType[]
): WorkItemTrackingTypeSpecification {
  return new WorkItemTrackingTypeSpecification(trackingTypes)
}

/**
 * Create a specification for filtering work items by status
 */
export function byStatus(...statuses: string[]): WorkItemStatusSpecification {
  return new WorkItemStatusSpecification(statuses)
}

/**
 * Create a specification for filtering work items by priority
 */
export function byPriority(...priorities: string[]): WorkItemPrioritySpecification {
  return new WorkItemPrioritySpecification(priorities)
}

/**
 * Create a specification for filtering overdue work items
 */
export function overdueOnly(): WorkItemOverdueSpecification {
  return new WorkItemOverdueSpecification(true)
}

/**
 * Create a specification for filtering non-overdue work items
 */
export function notOverdue(): WorkItemOverdueSpecification {
  return new WorkItemOverdueSpecification(false)
}

/**
 * Create a specification for filtering work items by dossier
 */
export function byDossier(dossierId: string): WorkItemDossierSpecification {
  return new WorkItemDossierSpecification(dossierId)
}

/**
 * Create a specification for searching work items
 */
export function withSearch(query: string): WorkItemSearchSpecification {
  return new WorkItemSearchSpecification(query)
}

/**
 * Create a specification for filtering work items by assignee
 */
export function assignedTo(userId: string): WorkItemAssigneeSpecification {
  return new WorkItemAssigneeSpecification(userId)
}

/**
 * Create a specification for filtering work items by deadline range
 */
export function deadlineBetween(dateRange: DateRange): WorkItemDeadlineRangeSpecification {
  return new WorkItemDeadlineRangeSpecification(dateRange)
}

/**
 * Create a composite specification from filters object
 */
export function fromFilters(filters: WorkItemFilters): WorkItemFilterSpecification {
  return new WorkItemFilterSpecification(filters)
}

// ============================================
// Query Parameter Conversion
// ============================================

/**
 * Convert filters to URL query parameters
 */
export function filtersToQueryParams(filters: WorkItemFilters): Record<string, string> {
  const params: Record<string, string> = {}

  if (filters.sources?.length) {
    params.sources = filters.sources.join(',')
  }
  if (filters.trackingTypes?.length) {
    params.trackingTypes = filters.trackingTypes.join(',')
  }
  if (filters.statuses?.length) {
    params.statuses = filters.statuses.join(',')
  }
  if (filters.priorities?.length) {
    params.priorities = filters.priorities.join(',')
  }
  if (filters.isOverdue !== undefined) {
    params.isOverdue = String(filters.isOverdue)
  }
  if (filters.dossierId) {
    params.dossierId = filters.dossierId
  }
  if (filters.searchQuery) {
    params.search = filters.searchQuery
  }
  if (filters.assignedTo) {
    params.assignedTo = filters.assignedTo
  }

  return params
}

/**
 * Parse URL query parameters to filters
 */
export function queryParamsToFilters(params: Record<string, string>): WorkItemFilters {
  const filters: WorkItemFilters = {}

  if (params.sources) {
    filters.sources = params.sources.split(',') as WorkSource[]
  }
  if (params.trackingTypes) {
    filters.trackingTypes = params.trackingTypes.split(',') as TrackingType[]
  }
  if (params.statuses) {
    filters.statuses = params.statuses.split(',')
  }
  if (params.priorities) {
    filters.priorities = params.priorities.split(',')
  }
  if (params.isOverdue !== undefined) {
    filters.isOverdue = params.isOverdue === 'true'
  }
  if (params.dossierId) {
    filters.dossierId = params.dossierId
  }
  if (params.search) {
    filters.searchQuery = params.search
  }
  if (params.assignedTo) {
    filters.assignedTo = params.assignedTo
  }

  return filters
}
