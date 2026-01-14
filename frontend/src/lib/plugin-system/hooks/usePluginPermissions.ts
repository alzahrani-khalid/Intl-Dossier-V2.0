/**
 * Plugin Permissions Hook
 *
 * Provides permission checking capabilities for entity plugins.
 * Integrates with Supabase RLS and plugin-defined permission rules.
 */

import { useCallback, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { pluginRegistry } from '../registry/plugin-registry'
import type {
  BaseDossier,
  PermissionAction,
  PermissionContext,
  PermissionResult,
  BilingualField,
} from '../types/plugin.types'

// ============================================================================
// Hook Types
// ============================================================================

export interface UsePluginPermissionsOptions {
  /** Entity type to check permissions for */
  entityType: string
}

export interface UsePluginPermissionsReturn<T = Record<string, unknown>> {
  /** Check if user can perform action on entity */
  canPerform: (action: PermissionAction, entity?: BaseDossier & T) => Promise<boolean>
  /** Check multiple permissions at once */
  canPerformBatch: (
    actions: PermissionAction[],
    entity?: BaseDossier & T,
  ) => Promise<Record<PermissionAction, boolean>>
  /** Get permission result with reason */
  checkPermission: (action: PermissionAction, entity?: BaseDossier & T) => Promise<PermissionResult>
  /** Get all allowed actions for entity */
  getAllowedActions: (entity?: BaseDossier & T) => Promise<PermissionAction[]>
  /** Check if user has minimum clearance for entity */
  hasClearance: (entity: BaseDossier & T) => boolean
  /** Get user's clearance level */
  userClearance: number
  /** Check if permissions are being loaded */
  isLoading: boolean
  /** Additional plugin-specific actions */
  additionalActions: Array<{
    action: string
    label: BilingualField
    description: BilingualField
  }>
}

// ============================================================================
// Clearance Level Mapping
// ============================================================================

const SENSITIVITY_CLEARANCE: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  top_secret: 4,
}

// ============================================================================
// Default Permission Logic
// ============================================================================

const DEFAULT_ACTIONS: PermissionAction[] = [
  'view',
  'create',
  'update',
  'delete',
  'archive',
  'export',
  'share',
]

/**
 * Default role-based permissions
 */
const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionAction[]> = {
  admin: DEFAULT_ACTIONS,
  manager: ['view', 'create', 'update', 'archive', 'export', 'share'],
  analyst: ['view', 'create', 'update', 'export'],
  viewer: ['view', 'export'],
}

/**
 * Default permission check
 */
function defaultPermissionCheck(
  action: PermissionAction,
  userRole: string,
  userClearance: number,
  entity?: BaseDossier,
  minViewClearance?: number,
  minEditClearance?: number,
  roleOverrides?: Record<string, PermissionAction[]>,
): PermissionResult {
  // Check role permissions
  const allowedActions = roleOverrides?.[userRole] ?? DEFAULT_ROLE_PERMISSIONS[userRole] ?? []

  if (!allowedActions.includes(action)) {
    return {
      allowed: false,
      reason: {
        en: 'Your role does not have permission for this action',
        ar: 'دورك لا يملك صلاحية لهذا الإجراء',
      },
    }
  }

  // Check clearance for entity-specific actions
  if (entity) {
    const requiredClearance = SENSITIVITY_CLEARANCE[entity.sensitivity_level] || 1

    // View clearance check
    if (action === 'view') {
      const minClearance = minViewClearance ?? requiredClearance
      if (userClearance < minClearance) {
        return {
          allowed: false,
          reason: {
            en: 'Your clearance level is insufficient to view this entity',
            ar: 'مستوى تصريحك غير كافٍ لعرض هذا العنصر',
          },
        }
      }
    }

    // Edit clearance check
    if (['update', 'delete', 'archive'].includes(action)) {
      const minClearance = minEditClearance ?? requiredClearance
      if (userClearance < minClearance) {
        return {
          allowed: false,
          reason: {
            en: 'Your clearance level is insufficient to modify this entity',
            ar: 'مستوى تصريحك غير كافٍ لتعديل هذا العنصر',
          },
        }
      }
    }

    // Check if entity is archived
    if (entity.status === 'archived' && ['update', 'delete'].includes(action)) {
      return {
        allowed: false,
        reason: {
          en: 'Cannot modify an archived entity',
          ar: 'لا يمكن تعديل عنصر مؤرشف',
        },
      }
    }
  }

  return { allowed: true }
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Hook for entity plugin permissions
 */
export function usePluginPermissions<T = Record<string, unknown>>(
  options: UsePluginPermissionsOptions,
): UsePluginPermissionsReturn<T> {
  const { entityType } = options
  const { user, isLoading: authLoading } = useAuth()

  const plugin = pluginRegistry.getPluginByEntityType<T>(entityType)
  const permissions = plugin?.permissions

  // Get user clearance level
  const userClearance = useMemo(() => {
    if (!user) return 0
    // Assume user has a clearance_level field or derive from role
    const clearance = (user as unknown as { clearance_level?: number }).clearance_level
    if (clearance) return clearance
    // Default clearance by role
    const roleClearance: Record<string, number> = {
      admin: 4,
      manager: 3,
      analyst: 2,
      viewer: 1,
    }
    return roleClearance[(user as unknown as { role?: string }).role || 'viewer'] || 1
  }, [user])

  // Get user role
  const userRole = useMemo(() => {
    if (!user) return 'viewer'
    return (user as unknown as { role?: string }).role || 'viewer'
  }, [user])

  // Additional plugin-specific actions
  const additionalActions = useMemo(() => {
    return permissions?.additionalActions || []
  }, [permissions])

  /**
   * Check if user has clearance for entity
   */
  const hasClearance = useCallback(
    (entity: BaseDossier & T): boolean => {
      const requiredClearance = SENSITIVITY_CLEARANCE[entity.sensitivity_level] || 1
      return userClearance >= requiredClearance
    },
    [userClearance],
  )

  /**
   * Check permission for action
   */
  const checkPermission = useCallback(
    async (action: PermissionAction, entity?: BaseDossier & T): Promise<PermissionResult> => {
      if (!user) {
        return {
          allowed: false,
          reason: {
            en: 'Authentication required',
            ar: 'يجب تسجيل الدخول',
          },
        }
      }

      // Custom plugin permission check
      if (permissions?.checkPermission) {
        const context: PermissionContext<T> = {
          action,
          entity,
          user: {
            id: user.id,
            role: userRole,
            clearanceLevel: userClearance,
          },
        }
        return permissions.checkPermission(context)
      }

      // Default permission check
      return defaultPermissionCheck(
        action,
        userRole,
        userClearance,
        entity,
        permissions?.minViewClearance,
        permissions?.minEditClearance,
        permissions?.roleOverrides,
      )
    },
    [user, userRole, userClearance, permissions],
  )

  /**
   * Check if user can perform action
   */
  const canPerform = useCallback(
    async (action: PermissionAction, entity?: BaseDossier & T): Promise<boolean> => {
      const result = await checkPermission(action, entity)
      return result.allowed
    },
    [checkPermission],
  )

  /**
   * Check multiple permissions at once
   */
  const canPerformBatch = useCallback(
    async (
      actions: PermissionAction[],
      entity?: BaseDossier & T,
    ): Promise<Record<PermissionAction, boolean>> => {
      const results: Record<PermissionAction, boolean> = {} as Record<PermissionAction, boolean>

      await Promise.all(
        actions.map(async (action) => {
          results[action] = await canPerform(action, entity)
        }),
      )

      return results
    },
    [canPerform],
  )

  /**
   * Get all allowed actions for entity
   */
  const getAllowedActions = useCallback(
    async (entity?: BaseDossier & T): Promise<PermissionAction[]> => {
      const permissions = await canPerformBatch(DEFAULT_ACTIONS, entity)
      return DEFAULT_ACTIONS.filter((action) => permissions[action])
    },
    [canPerformBatch],
  )

  return {
    canPerform,
    canPerformBatch,
    checkPermission,
    getAllowedActions,
    hasClearance,
    userClearance,
    isLoading: authLoading,
    additionalActions,
  }
}
