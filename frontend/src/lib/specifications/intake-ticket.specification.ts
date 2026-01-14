/**
 * Intake Ticket Specification
 *
 * Encapsulates business rules for filtering and querying intake tickets
 * across the application.
 *
 * This specification centralizes the duplicated query logic from:
 * - supabase/functions/intake-tickets-list/index.ts
 * - frontend intake ticket components and hooks
 *
 * @module specifications/intake-ticket
 */

import type { Specification, SupabaseQueryBuilder, SpecificationJSON } from './types'
import { BaseSpecification } from './base'
import { allOf } from './composite'

// ============================================
// Intake Ticket Types
// ============================================

/**
 * Intake ticket status values
 */
export type IntakeTicketStatus =
  | 'submitted'
  | 'triaged'
  | 'assigned'
  | 'in_progress'
  | 'awaiting_info'
  | 'converted'
  | 'closed'
  | 'merged'

/**
 * Intake request type values
 */
export type IntakeRequestType =
  | 'data_request'
  | 'briefing_request'
  | 'analysis_request'
  | 'report_request'
  | 'other'

/**
 * Sensitivity level values
 */
export type SensitivityLevel = 'public' | 'internal' | 'confidential' | 'restricted'

/**
 * Urgency level values
 */
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'urgent'

/**
 * SLA state values
 */
export type SLAState = 'on_track' | 'at_risk' | 'breached'

/**
 * Represents an intake ticket
 */
export interface IntakeTicket {
  id: string
  ticket_number: string
  request_type: IntakeRequestType
  title: string
  title_ar?: string
  description?: string
  status: IntakeTicketStatus
  priority: string
  sensitivity: SensitivityLevel
  urgency: UrgencyLevel
  assigned_to: string | null
  assigned_unit: string | null
  created_at: string
  updated_at: string
  triaged_at?: string | null
  sla_status?: {
    acknowledgment: {
      is_breached: boolean
      remaining_minutes: number
    }
    resolution: {
      is_breached: boolean
      remaining_minutes: number
    }
  }
}

/**
 * Filter parameters for intake tickets
 */
export interface IntakeTicketFilters {
  status?: IntakeTicketStatus
  requestType?: IntakeRequestType
  sensitivity?: SensitivityLevel
  urgency?: UrgencyLevel
  assignedTo?: string
  assignedUnit?: string
  slaBreached?: boolean
  createdAfter?: string
  createdBefore?: string
  searchQuery?: string
}

// ============================================
// Status Specification
// ============================================

/**
 * Specification that filters intake tickets by status
 */
export class IntakeTicketStatusSpecification extends BaseSpecification<IntakeTicket> {
  readonly name: string

  constructor(private readonly status: IntakeTicketStatus) {
    super()
    this.name = `status = ${status}`
  }

  isSatisfiedBy(candidate: IntakeTicket): boolean {
    return candidate.status === this.status
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    return query.eq('status', this.status) as QueryBuilder
  }

  toJSON(): SpecificationJSON {
    return {
      type: 'intake_ticket_status',
      name: this.name,
      params: { status: this.status },
    }
  }
}

// ============================================
// Request Type Specification
// ============================================

/**
 * Specification that filters intake tickets by request type
 */
export class IntakeTicketRequestTypeSpecification extends BaseSpecification<IntakeTicket> {
  readonly name: string

  constructor(private readonly requestType: IntakeRequestType) {
    super()
    this.name = `request_type = ${requestType}`
  }

  isSatisfiedBy(candidate: IntakeTicket): boolean {
    return candidate.request_type === this.requestType
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    return query.eq('request_type', this.requestType) as QueryBuilder
  }

  toJSON(): SpecificationJSON {
    return {
      type: 'intake_ticket_request_type',
      name: this.name,
      params: { requestType: this.requestType },
    }
  }
}

// ============================================
// Sensitivity Specification
// ============================================

/**
 * Specification that filters intake tickets by sensitivity level
 */
export class IntakeTicketSensitivitySpecification extends BaseSpecification<IntakeTicket> {
  readonly name: string

  constructor(private readonly sensitivity: SensitivityLevel) {
    super()
    this.name = `sensitivity = ${sensitivity}`
  }

  isSatisfiedBy(candidate: IntakeTicket): boolean {
    return candidate.sensitivity === this.sensitivity
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    return query.eq('sensitivity', this.sensitivity) as QueryBuilder
  }

  toJSON(): SpecificationJSON {
    return {
      type: 'intake_ticket_sensitivity',
      name: this.name,
      params: { sensitivity: this.sensitivity },
    }
  }
}

// ============================================
// Urgency Specification
// ============================================

/**
 * Specification that filters intake tickets by urgency level
 */
export class IntakeTicketUrgencySpecification extends BaseSpecification<IntakeTicket> {
  readonly name: string

  constructor(private readonly urgency: UrgencyLevel) {
    super()
    this.name = `urgency = ${urgency}`
  }

  isSatisfiedBy(candidate: IntakeTicket): boolean {
    return candidate.urgency === this.urgency
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    return query.eq('urgency', this.urgency) as QueryBuilder
  }

  toJSON(): SpecificationJSON {
    return {
      type: 'intake_ticket_urgency',
      name: this.name,
      params: { urgency: this.urgency },
    }
  }
}

// ============================================
// Assignee Specification
// ============================================

/**
 * Specification that filters intake tickets by assignee
 */
export class IntakeTicketAssigneeSpecification extends BaseSpecification<IntakeTicket> {
  readonly name: string

  constructor(private readonly assignedTo: string) {
    super()
    this.name = `assigned_to = ${assignedTo}`
  }

  isSatisfiedBy(candidate: IntakeTicket): boolean {
    return candidate.assigned_to === this.assignedTo
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    return query.eq('assigned_to', this.assignedTo) as QueryBuilder
  }

  toJSON(): SpecificationJSON {
    return {
      type: 'intake_ticket_assignee',
      name: this.name,
      params: { assignedTo: this.assignedTo },
    }
  }
}

// ============================================
// Assigned Unit Specification
// ============================================

/**
 * Specification that filters intake tickets by assigned unit
 */
export class IntakeTicketAssignedUnitSpecification extends BaseSpecification<IntakeTicket> {
  readonly name: string

  constructor(private readonly assignedUnit: string) {
    super()
    this.name = `assigned_unit = ${assignedUnit}`
  }

  isSatisfiedBy(candidate: IntakeTicket): boolean {
    return candidate.assigned_unit === this.assignedUnit
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    return query.eq('assigned_unit', this.assignedUnit) as QueryBuilder
  }

  toJSON(): SpecificationJSON {
    return {
      type: 'intake_ticket_assigned_unit',
      name: this.name,
      params: { assignedUnit: this.assignedUnit },
    }
  }
}

// ============================================
// SLA Breached Specification
// ============================================

/**
 * Specification that filters intake tickets by SLA breach status.
 * Note: SLA breach is typically computed from created_at and priority,
 * not stored directly in the database.
 */
export class IntakeTicketSLABreachedSpecification extends BaseSpecification<IntakeTicket> {
  readonly name: string

  constructor(private readonly breached: boolean) {
    super()
    this.name = breached ? 'SLA breached' : 'SLA not breached'
  }

  /**
   * Check if SLA is breached based on ticket data
   */
  private isSLABreached(ticket: IntakeTicket): boolean {
    // If SLA status is provided, use it directly
    if (ticket.sla_status) {
      return (
        ticket.sla_status.acknowledgment.is_breached || ticket.sla_status.resolution.is_breached
      )
    }

    // Otherwise, compute SLA breach from created_at and priority
    const now = new Date()
    const createdAt = new Date(ticket.created_at)
    const elapsedMinutes = Math.floor((now.getTime() - createdAt.getTime()) / 60000)

    // SLA targets based on priority
    const slaTargets: Record<string, { acknowledgment: number; resolution: number }> = {
      urgent: { acknowledgment: 30, resolution: 480 },
      high: { acknowledgment: 60, resolution: 960 },
      medium: { acknowledgment: 240, resolution: 2880 },
      low: { acknowledgment: 240, resolution: 2880 },
    }

    const targets = slaTargets[ticket.priority] ?? slaTargets.low
    const isTerminalStatus = ['converted', 'closed', 'merged'].includes(ticket.status)

    // Check acknowledgment SLA (breached if not triaged in time)
    const acknowledgmentBreached =
      elapsedMinutes > (targets?.acknowledgment ?? 240) && !ticket.triaged_at

    // Check resolution SLA (breached if not completed in time)
    const resolutionBreached = elapsedMinutes > (targets?.resolution ?? 2880) && !isTerminalStatus

    return acknowledgmentBreached || resolutionBreached
  }

  isSatisfiedBy(candidate: IntakeTicket): boolean {
    return this.isSLABreached(candidate) === this.breached
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    // SLA breach is computed, not stored - we need to filter in application code
    // However, we can add a basic filter to narrow down candidates
    if (this.breached) {
      // Only non-terminal tickets can be breached
      // This helps narrow down the query before in-memory filtering
      return query.not('status', 'in', '(converted,closed,merged)') as QueryBuilder
    }
    return query
  }

  toJSON(): SpecificationJSON {
    return {
      type: 'intake_ticket_sla_breached',
      name: this.name,
      params: { breached: this.breached },
    }
  }
}

// ============================================
// Date Range Specification
// ============================================

/**
 * Specification that filters intake tickets by creation date range
 */
export class IntakeTicketDateRangeSpecification extends BaseSpecification<IntakeTicket> {
  readonly name: string

  constructor(
    private readonly afterDate: string | null,
    private readonly beforeDate: string | null,
  ) {
    super()
    const afterStr = afterDate || '*'
    const beforeStr = beforeDate || '*'
    this.name = `created_at BETWEEN ${afterStr} AND ${beforeStr}`
  }

  isSatisfiedBy(candidate: IntakeTicket): boolean {
    const createdAt = new Date(candidate.created_at)

    if (this.afterDate) {
      const after = new Date(this.afterDate)
      if (createdAt < after) return false
    }

    if (this.beforeDate) {
      const before = new Date(this.beforeDate)
      if (createdAt > before) return false
    }

    return true
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    let result = query

    if (this.afterDate) {
      result = result.gte('created_at', this.afterDate) as QueryBuilder
    }

    if (this.beforeDate) {
      result = result.lte('created_at', this.beforeDate) as QueryBuilder
    }

    return result
  }

  toJSON(): SpecificationJSON {
    return {
      type: 'intake_ticket_date_range',
      name: this.name,
      params: { afterDate: this.afterDate, beforeDate: this.beforeDate },
    }
  }
}

// ============================================
// Search Specification
// ============================================

/**
 * Specification that filters intake tickets by search query
 */
export class IntakeTicketSearchSpecification extends BaseSpecification<IntakeTicket> {
  readonly name: string

  constructor(private readonly searchQuery: string) {
    super()
    this.name = `search "${searchQuery}"`
  }

  isSatisfiedBy(candidate: IntakeTicket): boolean {
    const query = this.searchQuery.toLowerCase()
    return (
      candidate.title.toLowerCase().includes(query) ||
      candidate.title_ar?.toLowerCase().includes(query) ||
      candidate.ticket_number.toLowerCase().includes(query) ||
      candidate.description?.toLowerCase().includes(query) ||
      false
    )
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    return query.or(
      `title.ilike.%${this.searchQuery}%,title_ar.ilike.%${this.searchQuery}%,ticket_number.ilike.%${this.searchQuery}%`,
    ) as QueryBuilder
  }

  toJSON(): SpecificationJSON {
    return {
      type: 'intake_ticket_search',
      name: this.name,
      params: { searchQuery: this.searchQuery },
    }
  }
}

// ============================================
// Active Tickets Specification
// ============================================

/**
 * Specification that filters for active (non-terminal) intake tickets
 */
export class IntakeTicketActiveSpecification extends BaseSpecification<IntakeTicket> {
  readonly name = 'active tickets'

  private readonly activeStatuses: IntakeTicketStatus[] = [
    'submitted',
    'triaged',
    'assigned',
    'in_progress',
    'awaiting_info',
  ]

  isSatisfiedBy(candidate: IntakeTicket): boolean {
    return this.activeStatuses.includes(candidate.status)
  }

  toSupabaseFilter<QueryBuilder extends SupabaseQueryBuilder>(query: QueryBuilder): QueryBuilder {
    return query.in('status', this.activeStatuses) as QueryBuilder
  }

  toJSON(): SpecificationJSON {
    return {
      type: 'intake_ticket_active',
      name: this.name,
    }
  }
}

// ============================================
// Composite Intake Ticket Specification
// ============================================

/**
 * Creates a composite specification from IntakeTicketFilters.
 * This is the main entry point for creating intake ticket specifications.
 */
export class IntakeTicketFilterSpecification extends BaseSpecification<IntakeTicket> {
  readonly name = 'IntakeTicketFilter'
  private readonly compositeSpec: Specification<IntakeTicket>

  constructor(private readonly filters: IntakeTicketFilters) {
    super()

    const specs: Specification<IntakeTicket>[] = []

    if (filters.status) {
      specs.push(new IntakeTicketStatusSpecification(filters.status))
    }

    if (filters.requestType) {
      specs.push(new IntakeTicketRequestTypeSpecification(filters.requestType))
    }

    if (filters.sensitivity) {
      specs.push(new IntakeTicketSensitivitySpecification(filters.sensitivity))
    }

    if (filters.urgency) {
      specs.push(new IntakeTicketUrgencySpecification(filters.urgency))
    }

    if (filters.assignedTo) {
      specs.push(new IntakeTicketAssigneeSpecification(filters.assignedTo))
    }

    if (filters.assignedUnit) {
      specs.push(new IntakeTicketAssignedUnitSpecification(filters.assignedUnit))
    }

    if (filters.slaBreached !== undefined) {
      specs.push(new IntakeTicketSLABreachedSpecification(filters.slaBreached))
    }

    if (filters.createdAfter || filters.createdBefore) {
      specs.push(
        new IntakeTicketDateRangeSpecification(
          filters.createdAfter || null,
          filters.createdBefore || null,
        ),
      )
    }

    if (filters.searchQuery) {
      specs.push(new IntakeTicketSearchSpecification(filters.searchQuery))
    }

    this.compositeSpec = allOf(...specs)
  }

  isSatisfiedBy(candidate: IntakeTicket): boolean {
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
      type: 'intake_ticket_filter',
      name: this.name,
      params: this.filters as Record<string, unknown>,
    }
  }
}

// ============================================
// Factory Functions
// ============================================

/**
 * Create a specification for filtering by status
 */
export function withStatus(status: IntakeTicketStatus): IntakeTicketStatusSpecification {
  return new IntakeTicketStatusSpecification(status)
}

/**
 * Create a specification for filtering by request type
 */
export function withRequestType(
  requestType: IntakeRequestType,
): IntakeTicketRequestTypeSpecification {
  return new IntakeTicketRequestTypeSpecification(requestType)
}

/**
 * Create a specification for filtering by sensitivity
 */
export function withSensitivity(
  sensitivity: SensitivityLevel,
): IntakeTicketSensitivitySpecification {
  return new IntakeTicketSensitivitySpecification(sensitivity)
}

/**
 * Create a specification for filtering by urgency
 */
export function withUrgency(urgency: UrgencyLevel): IntakeTicketUrgencySpecification {
  return new IntakeTicketUrgencySpecification(urgency)
}

/**
 * Create a specification for filtering by assignee
 */
export function ticketAssignedTo(userId: string): IntakeTicketAssigneeSpecification {
  return new IntakeTicketAssigneeSpecification(userId)
}

/**
 * Create a specification for filtering by assigned unit
 */
export function inUnit(unit: string): IntakeTicketAssignedUnitSpecification {
  return new IntakeTicketAssignedUnitSpecification(unit)
}

/**
 * Create a specification for SLA breached tickets
 */
export function slaBreached(): IntakeTicketSLABreachedSpecification {
  return new IntakeTicketSLABreachedSpecification(true)
}

/**
 * Create a specification for non-SLA breached tickets
 */
export function slaNotBreached(): IntakeTicketSLABreachedSpecification {
  return new IntakeTicketSLABreachedSpecification(false)
}

/**
 * Create a specification for tickets created after a date
 */
export function createdAfter(date: string): IntakeTicketDateRangeSpecification {
  return new IntakeTicketDateRangeSpecification(date, null)
}

/**
 * Create a specification for tickets created before a date
 */
export function createdBefore(date: string): IntakeTicketDateRangeSpecification {
  return new IntakeTicketDateRangeSpecification(null, date)
}

/**
 * Create a specification for tickets created between dates
 */
export function createdBetween(after: string, before: string): IntakeTicketDateRangeSpecification {
  return new IntakeTicketDateRangeSpecification(after, before)
}

/**
 * Create a specification for searching tickets
 */
export function ticketSearch(query: string): IntakeTicketSearchSpecification {
  return new IntakeTicketSearchSpecification(query)
}

/**
 * Create a specification for active tickets only
 */
export function activeTicketsOnly(): IntakeTicketActiveSpecification {
  return new IntakeTicketActiveSpecification()
}

/**
 * Create a composite specification from filters object
 */
export function fromIntakeFilters(filters: IntakeTicketFilters): IntakeTicketFilterSpecification {
  return new IntakeTicketFilterSpecification(filters)
}

// ============================================
// Query Parameter Conversion
// ============================================

/**
 * Convert filters to URL query parameters
 */
export function intakeFiltersToQueryParams(filters: IntakeTicketFilters): Record<string, string> {
  const params: Record<string, string> = {}

  if (filters.status) params.status = filters.status
  if (filters.requestType) params.request_type = filters.requestType
  if (filters.sensitivity) params.sensitivity = filters.sensitivity
  if (filters.urgency) params.urgency = filters.urgency
  if (filters.assignedTo) params.assigned_to = filters.assignedTo
  if (filters.assignedUnit) params.assigned_unit = filters.assignedUnit
  if (filters.slaBreached !== undefined) params.sla_breached = String(filters.slaBreached)
  if (filters.createdAfter) params.created_after = filters.createdAfter
  if (filters.createdBefore) params.created_before = filters.createdBefore
  if (filters.searchQuery) params.search = filters.searchQuery

  return params
}

/**
 * Parse URL query parameters to filters
 */
export function queryParamsToIntakeFilters(params: Record<string, string>): IntakeTicketFilters {
  const filters: IntakeTicketFilters = {}

  if (params.status) filters.status = params.status as IntakeTicketStatus
  if (params.request_type) filters.requestType = params.request_type as IntakeRequestType
  if (params.sensitivity) filters.sensitivity = params.sensitivity as SensitivityLevel
  if (params.urgency) filters.urgency = params.urgency as UrgencyLevel
  if (params.assigned_to) filters.assignedTo = params.assigned_to
  if (params.assigned_unit) filters.assignedUnit = params.assigned_unit
  if (params.sla_breached !== undefined) filters.slaBreached = params.sla_breached === 'true'
  if (params.created_after) filters.createdAfter = params.created_after
  if (params.created_before) filters.createdBefore = params.created_before
  if (params.search) filters.searchQuery = params.search

  return filters
}
