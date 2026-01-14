/**
 * Specification Pattern Infrastructure
 *
 * A composable, testable, and reusable pattern for encapsulating business rules
 * for filtering and querying entities across the application.
 *
 * Key features:
 * - Type-safe specification building
 * - Composable AND/OR/NOT operations
 * - Testable business rules without database dependencies
 * - Reusable across repositories, services, and edge functions
 * - Supabase query builder integration
 *
 * @module specifications
 */

// Core types and interfaces
export * from './types'

// Base specification class and utilities
export * from './base'

// Built-in composite specifications
export * from './composite'

// Domain-specific specifications
export {
  // Types
  type WorkSource,
  type TrackingType,
  type WorkItemStatus,
  type WorkItemPriority,
  type WorkItem,
  type WorkItemFilters,
  // Specifications
  WorkItemSourceSpecification,
  WorkItemTrackingTypeSpecification,
  WorkItemStatusSpecification,
  WorkItemPrioritySpecification,
  WorkItemOverdueSpecification,
  WorkItemDossierSpecification,
  WorkItemSearchSpecification,
  WorkItemAssigneeSpecification,
  WorkItemDeadlineRangeSpecification,
  WorkItemFilterSpecification,
  // Factory functions
  bySource,
  byTrackingType,
  byStatus,
  byPriority,
  overdueOnly,
  notOverdue,
  byDossier,
  withSearch,
  assignedTo,
  deadlineBetween,
  fromFilters as workItemFromFilters,
  // URL utilities
  filtersToQueryParams as workItemFiltersToQueryParams,
  queryParamsToFilters as workItemQueryParamsToFilters,
} from './work-item.specification'

export {
  // Types
  type IntakeTicketStatus,
  type IntakeRequestType,
  type SensitivityLevel,
  type UrgencyLevel,
  type SLAState,
  type IntakeTicket,
  type IntakeTicketFilters,
  // Specifications
  IntakeTicketStatusSpecification,
  IntakeTicketRequestTypeSpecification,
  IntakeTicketSensitivitySpecification,
  IntakeTicketUrgencySpecification,
  IntakeTicketAssigneeSpecification,
  IntakeTicketAssignedUnitSpecification,
  IntakeTicketSLABreachedSpecification,
  IntakeTicketDateRangeSpecification,
  IntakeTicketSearchSpecification,
  IntakeTicketActiveSpecification,
  IntakeTicketFilterSpecification,
  // Factory functions
  withStatus,
  withRequestType,
  withSensitivity,
  withUrgency,
  ticketAssignedTo,
  inUnit,
  slaBreached,
  slaNotBreached,
  createdAfter,
  createdBefore,
  createdBetween,
  ticketSearch,
  activeTicketsOnly,
  fromIntakeFilters,
  // URL utilities
  intakeFiltersToQueryParams,
  queryParamsToIntakeFilters,
} from './intake-ticket.specification'

export {
  // Types
  type FieldDataType as ReportFieldDataType,
  type ReportFilter,
  type FilterGroup,
  // Specifications
  ReportFilterConditionSpecification,
  ReportFilterGroupSpecification,
  // Factory functions
  fromFilter,
  fromFilterGroup,
  emptyFilterGroup,
  // Helpers
  getValidOperatorsForType,
  isValidOperatorForType,
  validateFilterValue,
  countConditions,
  getMaxDepth,
  flattenFilters,
  isEmptyFilterGroup,
  createFilter,
  andGroup,
  orGroup,
  mergeGroups,
} from './report-filter.specification'

// Supabase query builder integration
export * from './supabase-adapter'

// Specification builder utility
export * from './builder'
