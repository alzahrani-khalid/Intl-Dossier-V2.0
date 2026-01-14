/**
 * Role Dashboards Components
 *
 * Exports all role-specific dashboard components for personalized landing pages.
 */

export { RoleDashboard } from './RoleDashboard'
export { RoleQuickActions } from './RoleQuickActions'
export { PendingActionsWidget } from './PendingActionsWidget'
export { WorkloadSummaryWidget } from './WorkloadSummaryWidget'

// Re-export types for convenience
export type {
  DashboardRole,
  RoleDashboardConfig,
  RoleQuickAction,
  PendingAction,
  WorkloadSummary,
  RoleDashboardProps,
  PendingActionsWidgetProps,
  WorkloadSummaryWidgetProps,
  RoleQuickActionsProps,
} from '@/types/role-dashboard.types'
