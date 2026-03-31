/**
 * Role Preference Hook
 * Phase 10: Operations Hub Dashboard
 *
 * Detects user role from auth store, maps to dashboard role,
 * and persists manual overrides in localStorage.
 * Role is a "viewing lens" — not access control (D-10).
 */

import { useState, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import type { DashboardRole } from '../types/operations-hub.types'
import { ROLE_MAP } from '../types/operations-hub.types'

const STORAGE_KEY = 'ops-hub-role'

// ============================================================================
// Role Mapping Utility
// ============================================================================

/**
 * Maps a user role string to a DashboardRole.
 * Falls back to 'officer' for unknown/undefined roles (D-10).
 */
export function mapUserRole(role: string | undefined): DashboardRole {
  if (role == null) return 'officer'
  return ROLE_MAP[role] ?? 'officer'
}

// ============================================================================
// useRolePreference Hook
// ============================================================================

/**
 * Returns the current dashboard role and a setter for manual override.
 * Priority: localStorage override > auth store role > 'officer' default.
 * Selection persists across sessions via localStorage (D-10).
 */
export function useRolePreference(): {
  role: DashboardRole
  setRole: (r: DashboardRole) => void
} {
  const authRole = useAuthStore((s) => s.user?.role)
  const detectedRole = mapUserRole(authRole)

  const [overrideRole, setOverrideRole] = useState<DashboardRole | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'leadership' || stored === 'officer' || stored === 'analyst') {
      return stored
    }
    return null
  })

  const setRole = useCallback((r: DashboardRole): void => {
    localStorage.setItem(STORAGE_KEY, r)
    setOverrideRole(r)
  }, [])

  return {
    role: overrideRole ?? detectedRole,
    setRole,
  }
}
