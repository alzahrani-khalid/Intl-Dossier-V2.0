/**
 * Dashboard Scope Hook
 * Phase 10: Operations Hub Dashboard
 *
 * Single source of truth for user-based filtering across all zones.
 * Officer role filters to current user's items (D-11).
 * Leadership and Analyst roles see all items (userId: null).
 *
 * This hook prevents Pitfall 1 from RESEARCH.md: "each zone hook
 * must receive the same userId to avoid inconsistent filtering."
 */

import { useAuthStore } from '@/store/authStore'
import type { DashboardScope } from '../types/operations-hub.types'
import { useRolePreference } from './useRolePreference'

// ============================================================================
// useDashboardScope Hook
// ============================================================================

/**
 * Returns the dashboard scope based on current role:
 * - Officer: { userId: currentUser.id, role: 'officer' } — filters to user's items
 * - Leadership/Analyst: { userId: null, role } — all items across organization
 */
export function useDashboardScope(): DashboardScope {
  const { role } = useRolePreference()
  const userId = useAuthStore((s) => s.user?.id)

  if (role === 'officer' && userId != null) {
    return { userId, role }
  }

  return { userId: null, role }
}
