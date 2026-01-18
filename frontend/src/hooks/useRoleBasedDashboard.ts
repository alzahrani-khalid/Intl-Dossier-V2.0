/**
 * useRoleBasedDashboard Hook
 *
 * Provides role-specific dashboard configuration, metrics, and pending actions.
 * Automatically detects user role and returns appropriate dashboard data.
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useAuth } from '@/contexts/auth.context'
import {
  getRoleDashboardConfig,
  mapUserRoleToDashboardRole,
  getQuickActionsForRole,
} from '@/config/role-dashboard.config'
import type {
  DashboardRole,
  RoleDashboardConfig,
  RoleQuickAction,
  PendingAction,
  WorkloadSummary,
  RoleDashboardState,
  RoleDashboardContextValue,
} from '@/types/role-dashboard.types'

/**
 * Hook options
 */
interface UseRoleBasedDashboardOptions {
  /** Override the detected role */
  roleOverride?: DashboardRole
  /** Auto-fetch data on mount */
  autoFetch?: boolean
  /** Refresh interval in ms (0 to disable) */
  refreshInterval?: number
}

/**
 * Hook return type
 */
interface UseRoleBasedDashboardReturn extends RoleDashboardContextValue {
  /** Computed dashboard role */
  dashboardRole: DashboardRole
  /** Quick actions for current role */
  quickActions: RoleQuickAction[]
  /** Check if user has a specific role capability */
  hasCapability: (capability: string) => boolean
}

/**
 * Custom hook for role-based dashboard functionality
 */
export function useRoleBasedDashboard(
  options: UseRoleBasedDashboardOptions = {},
): UseRoleBasedDashboardReturn {
  const { roleOverride, autoFetch = true, refreshInterval = 0 } = options
  const { user } = useAuth()

  // Determine the dashboard role
  const dashboardRole = useMemo<DashboardRole>(() => {
    if (roleOverride) return roleOverride
    return mapUserRoleToDashboardRole(user?.role)
  }, [roleOverride, user?.role])

  // Get the configuration for this role
  const config = useMemo<RoleDashboardConfig>(() => {
    return getRoleDashboardConfig(dashboardRole)
  }, [dashboardRole])

  // Get quick actions for this role
  const quickActions = useMemo<RoleQuickAction[]>(() => {
    return getQuickActionsForRole(dashboardRole)
  }, [dashboardRole])

  // State management
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([])
  const [workload, setWorkload] = useState<WorkloadSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch pending actions for the current user
   */
  const fetchPendingActions = useCallback(async (): Promise<PendingAction[]> => {
    // Real pending actions are fetched via the unified-work-list API
    // This hook now returns an empty array as a placeholder
    // The actual pending actions are displayed through the MyWorkDashboard component
    // which uses useUnifiedWork hooks for real data
    return []
  }, [])

  /**
   * Fetch workload summary for the current user
   */
  const fetchWorkloadSummary = useCallback(async (): Promise<WorkloadSummary> => {
    // Mock data - in production, this would call an API
    const baseSummary: WorkloadSummary = {
      totalPending: 12,
      overdueCount: 2,
      dueTodayCount: 3,
      dueThisWeekCount: 7,
      byPriority: {
        urgent: 1,
        high: 3,
        medium: 5,
        low: 3,
      },
      bySource: {
        tasks: 5,
        commitments: 3,
        intake: 2,
        reviews: 2,
      },
    }

    // Adjust based on role
    if (dashboardRole === 'manager') {
      return {
        ...baseSummary,
        totalPending: baseSummary.totalPending * 3, // Team aggregate
      }
    }
    if (dashboardRole === 'executive') {
      return {
        ...baseSummary,
        totalPending: baseSummary.totalPending * 10, // Organization-wide
      }
    }
    return baseSummary
  }, [dashboardRole])

  /**
   * Refresh all dashboard data
   */
  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [actions, summary] = await Promise.all([fetchPendingActions(), fetchWorkloadSummary()])
      setPendingActions(actions)
      setWorkload(summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }, [fetchPendingActions, fetchWorkloadSummary])

  /**
   * Dismiss a pending action
   */
  const dismissAction = useCallback(async (actionId: string) => {
    setPendingActions((prev) => prev.filter((a) => a.id !== actionId))
    // In production, this would also call an API to persist the dismissal
  }, [])

  /**
   * Mark an action as complete
   */
  const completeAction = useCallback(async (actionId: string) => {
    setPendingActions((prev) => prev.filter((a) => a.id !== actionId))
    // Update workload counts
    setWorkload((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        totalPending: Math.max(0, prev.totalPending - 1),
      }
    })
    // In production, this would also call an API
  }, [])

  /**
   * Get actions filtered by type
   */
  const getActionsByType = useCallback(
    (type: PendingAction['type']) => {
      return pendingActions.filter((a) => a.type === type)
    },
    [pendingActions],
  )

  /**
   * Switch to a different role view (for users with multiple roles)
   */
  const switchRole = useCallback((_role: DashboardRole) => {
    // This would be implemented if users can switch between role views
    // For now, it's a placeholder
    console.warn('Role switching not yet implemented')
  }, [])

  /**
   * Check if user has a specific capability
   */
  const hasCapability = useCallback(
    (capability: string): boolean => {
      const capabilities: Record<DashboardRole, string[]> = {
        admin: ['manage_users', 'view_all', 'edit_all', 'approve_all', 'system_settings'],
        manager: ['view_team', 'approve_team', 'assign_tasks', 'view_reports'],
        analyst: ['create_dossiers', 'create_briefs', 'research'],
        executive: ['view_all', 'view_reports', 'view_intelligence'],
        lobbyist: ['create_engagements', 'manage_relationships', 'schedule_meetings'],
        intake_officer: ['process_intake', 'create_tickets', 'escalate'],
        editor: ['create_dossiers', 'edit_content'],
        viewer: ['view_only'],
        staff: ['basic_tasks'],
      }
      return capabilities[dashboardRole]?.includes(capability) ?? false
    },
    [dashboardRole],
  )

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      void refresh()
    }
  }, [autoFetch, refresh])

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        void refresh()
      }, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refresh, refreshInterval])

  // Build state object
  const state: RoleDashboardState = {
    currentRole: dashboardRole,
    config,
    metrics: null, // Would be populated from API
    pendingActions,
    workload,
    isLoading,
    error,
  }

  return {
    ...state,
    dashboardRole,
    quickActions,
    refresh,
    dismissAction,
    completeAction,
    getActionsByType,
    switchRole,
    hasCapability,
  }
}

export default useRoleBasedDashboard
