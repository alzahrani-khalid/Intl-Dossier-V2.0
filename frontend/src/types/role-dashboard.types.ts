/**
 * Role-Specific Dashboard Type Definitions
 *
 * Defines configurations for personalized landing pages based on user roles.
 * Surfaces relevant entities, pending actions, and shortcuts for each user type.
 */

import type { UserRole } from './onboarding.types'
import type { QuickAction, KpiMetricType, WidgetConfig } from './dashboard-widget.types'

// ============================================================================
// Role Dashboard Configuration Types
// ============================================================================

/**
 * Extended user roles for dashboard personalization
 * Includes domain-specific roles beyond system roles
 */
export type DashboardRole =
  | UserRole // 'admin' | 'editor' | 'viewer' | 'analyst' | 'manager'
  | 'lobbyist' // Engagement-focused user
  | 'executive' // High-level summary view
  | 'intake_officer' // Service request handler
  | 'staff' // General staff member

/**
 * Role-specific quick action configuration
 */
export interface RoleQuickAction extends QuickAction {
  /** Roles that should see this action */
  visibleTo: DashboardRole[]
  /** Priority order (lower = higher priority) */
  priority: number
  /** Contextual condition for showing the action */
  showWhen?: RoleActionCondition
}

/**
 * Conditions for contextual quick actions
 */
export type RoleActionCondition =
  | 'always'
  | 'has_pending_tasks'
  | 'has_pending_reviews'
  | 'has_overdue_items'
  | 'has_upcoming_events'
  | 'has_unread_notifications'
  | 'is_manager'
  | 'is_weekend'
  | 'is_end_of_quarter'

/**
 * Dashboard section definition
 */
export interface DashboardSection {
  id: string
  titleKey: string
  descriptionKey?: string
  order: number
  isCollapsible?: boolean
  defaultCollapsed?: boolean
  visibleTo: DashboardRole[]
}

/**
 * KPI configuration for role-specific metrics
 */
export interface RoleKpiConfig {
  metric: KpiMetricType
  titleKey: string
  descriptionKey?: string
  priority: number
  visibleTo: DashboardRole[]
  showTrend?: boolean
  showTarget?: boolean
  targetValue?: number
}

/**
 * Role-specific dashboard configuration
 */
export interface RoleDashboardConfig {
  /** Role this config is for */
  role: DashboardRole
  /** Title key for the dashboard */
  titleKey: string
  /** Subtitle/description key */
  subtitleKey: string
  /** Welcome message key */
  welcomeMessageKey?: string
  /** Quick actions for this role */
  quickActions: RoleQuickAction[]
  /** KPIs to display */
  kpis: RoleKpiConfig[]
  /** Dashboard sections */
  sections: DashboardSection[]
  /** Primary entity types for this role */
  primaryEntities: EntityFocus[]
  /** Default widget layout */
  defaultWidgets?: Partial<WidgetConfig>[]
  /** Features enabled for this role */
  features: RoleDashboardFeatures
}

/**
 * Features available in role dashboards
 */
export interface RoleDashboardFeatures {
  showOnboarding: boolean
  showQuickActions: boolean
  showKpis: boolean
  showRecentActivity: boolean
  showUpcomingEvents: boolean
  showNotifications: boolean
  showTeamWorkload: boolean
  showRecommendations: boolean
  showIntelligence: boolean
  showAlerts: boolean
}

/**
 * Entity types that a role primarily focuses on
 */
export interface EntityFocus {
  entityType: EntityType
  priority: number
  showInSidebar: boolean
  showInDashboard: boolean
  quickCreateEnabled: boolean
}

/**
 * Core entity types in the system
 */
export type EntityType =
  | 'dossier'
  | 'engagement'
  | 'commitment'
  | 'task'
  | 'intake'
  | 'document'
  | 'mou'
  | 'brief'
  | 'position'
  | 'forum'
  | 'working_group'
  | 'calendar_event'

// ============================================================================
// Pending Actions Types
// ============================================================================

/**
 * Pending action item for role dashboards
 */
export interface PendingAction {
  id: string
  type: PendingActionType
  titleKey: string
  description: string
  entityType: EntityType
  entityId: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: string
  isOverdue: boolean
  route: string
}

/**
 * Types of pending actions
 */
export type PendingActionType =
  | 'review_required'
  | 'approval_needed'
  | 'task_assigned'
  | 'commitment_due'
  | 'intake_pending'
  | 'document_upload'
  | 'meeting_preparation'
  | 'follow_up_required'
  | 'escalation_needed'

/**
 * Workload summary for the current user
 */
export interface WorkloadSummary {
  totalPending: number
  overdueCount: number
  dueTodayCount: number
  dueThisWeekCount: number
  byPriority: {
    urgent: number
    high: number
    medium: number
    low: number
  }
  bySource: {
    tasks: number
    commitments: number
    intake: number
    reviews: number
  }
}

// ============================================================================
// Role-Specific Metrics Types
// ============================================================================

/**
 * Executive dashboard metrics
 */
export interface ExecutiveMetrics {
  activePartners: number
  partnersChange: number
  mouInWorkflow: number
  mouExpiringSoon: number
  upcomingMissions: number
  intelligenceBriefs: number
  teamUtilization: number
  slaCompliance: number
}

/**
 * Analyst dashboard metrics
 */
export interface AnalystMetrics {
  dossiersAssigned: number
  briefsInProgress: number
  briefsCompleted: number
  averageCompletionTime: number
  dataQualityScore: number
  researchTasks: number
  pendingReviews: number
}

/**
 * Lobbyist dashboard metrics
 */
export interface LobbyistMetrics {
  upcomingEngagements: number
  pendingFollowUps: number
  activeRelationships: number
  recentOutreach: number
  engagementSuccessRate: number
  pendingMeetings: number
  newContacts: number
}

/**
 * Manager dashboard metrics
 */
export interface ManagerMetrics {
  teamSize: number
  teamWorkloadBalance: number
  pendingApprovals: number
  escalatedItems: number
  teamProductivity: number
  overdueItems: number
  slaBreaches: number
}

/**
 * Admin dashboard metrics
 */
export interface AdminMetrics {
  totalUsers: number
  activeUsers: number
  systemHealth: number
  pendingAccess: number
  auditAlerts: number
  storageUsage: number
  apiCalls: number
  errorRate: number
}

/**
 * Intake officer dashboard metrics
 */
export interface IntakeOfficerMetrics {
  pendingIntake: number
  processingToday: number
  completedToday: number
  averageResponseTime: number
  slaCompliance: number
  escalatedItems: number
  backlogSize: number
}

/**
 * Union type for all role-specific metrics
 */
export type RoleMetrics =
  | { role: 'executive'; data: ExecutiveMetrics }
  | { role: 'analyst'; data: AnalystMetrics }
  | { role: 'lobbyist'; data: LobbyistMetrics }
  | { role: 'manager'; data: ManagerMetrics }
  | { role: 'admin'; data: AdminMetrics }
  | { role: 'intake_officer'; data: IntakeOfficerMetrics }

// ============================================================================
// Dashboard State Types
// ============================================================================

/**
 * Role dashboard state for context/hooks
 */
export interface RoleDashboardState {
  currentRole: DashboardRole
  config: RoleDashboardConfig | null
  metrics: RoleMetrics | null
  pendingActions: PendingAction[]
  workload: WorkloadSummary | null
  isLoading: boolean
  error: string | null
}

/**
 * Role dashboard context actions
 */
export interface RoleDashboardActions {
  /** Refresh dashboard data */
  refresh: () => Promise<void>
  /** Dismiss a pending action */
  dismissAction: (actionId: string) => Promise<void>
  /** Mark action as complete */
  completeAction: (actionId: string) => Promise<void>
  /** Get pending actions filtered by type */
  getActionsByType: (type: PendingActionType) => PendingAction[]
  /** Switch dashboard view (for users with multiple roles) */
  switchRole: (role: DashboardRole) => void
}

/**
 * Combined context value
 */
export interface RoleDashboardContextValue extends RoleDashboardState, RoleDashboardActions {}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Props for role dashboard wrapper
 */
export interface RoleDashboardProps {
  /** Override the detected role */
  roleOverride?: DashboardRole
  /** Callback when dashboard loads */
  onLoad?: () => void
  /** Callback on error */
  onError?: (error: Error) => void
  /** Additional CSS classes */
  className?: string
}

/**
 * Props for pending actions widget
 */
export interface PendingActionsWidgetProps {
  actions: PendingAction[]
  maxItems?: number
  showViewAll?: boolean
  onActionClick?: (action: PendingAction) => void
  onViewAll?: () => void
  className?: string
}

/**
 * Props for workload summary widget
 */
export interface WorkloadSummaryWidgetProps {
  workload: WorkloadSummary
  showBreakdown?: boolean
  onCategoryClick?: (category: string) => void
  className?: string
}

/**
 * Props for role-specific KPI grid
 */
export interface RoleKpiGridProps {
  kpis: RoleKpiConfig[]
  data: Record<string, number>
  isLoading?: boolean
  className?: string
}

/**
 * Props for role quick actions
 */
export interface RoleQuickActionsProps {
  actions: RoleQuickAction[]
  onActionClick?: (action: RoleQuickAction) => void
  layout?: 'grid' | 'row'
  maxVisible?: number
  className?: string
}
