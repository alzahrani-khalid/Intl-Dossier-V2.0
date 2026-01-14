/**
 * usePermissionError Hook
 * Manages permission denied errors with actionable guidance and access request functionality
 */

import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import type {
  PermissionDeniedError,
  PermissionDeniedApiError,
  AccessGranter,
  AccessRequest,
  AccessRequestPayload,
  PermissionAction,
  PermissionType,
  ResourceType,
  PermissionDeniedReason,
  UsePermissionErrorReturn,
} from '@/types/permission-error.types'

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Parse API error response into PermissionDeniedError
 */
function parseApiError(apiError: PermissionDeniedApiError): PermissionDeniedError {
  const details = apiError.error.details

  return {
    status: 403,
    code: 'PERMISSION_DENIED',
    requiredPermission: details.required_permission,
    resourceType: details.resource_type,
    resourceId: details.resource_id,
    resourceName: details.resource_name,
    currentRole: details.current_role,
    requiredRole: details.required_role,
    reason: details.reason,
    timestamp: new Date().toISOString(),
    accessGranters: details.access_granters.map((g) => ({
      userId: g.user_id,
      name: g.name,
      email: g.email,
      role: g.role,
      isPrimary: g.is_primary,
    })),
    suggestedActions: [],
  }
}

/**
 * Generate suggested actions based on error context
 */
function generateSuggestedActions(
  error: PermissionDeniedError,
  t: (key: string) => string,
): PermissionAction[] {
  const actions: PermissionAction[] = []

  // Primary action: Request access if there are granters
  if (error.accessGranters.length > 0) {
    const primaryGranter = error.accessGranters.find((g) => g.isPrimary) || error.accessGranters[0]
    actions.push({
      id: 'request-access',
      type: 'open_modal',
      labelKey: 'actions.requestAccess',
      icon: 'send',
      primary: true,
      showOnMobile: true,
      permissionActionType: 'request_access',
    })
  }

  // View current permissions
  actions.push({
    id: 'view-permissions',
    type: 'navigate',
    labelKey: 'actions.viewPermissions',
    icon: 'eye',
    url: '/settings/permissions',
    showOnMobile: false,
    permissionActionType: 'view_permissions',
  })

  // Contact admin if no granters available
  if (error.accessGranters.length === 0) {
    actions.push({
      id: 'contact-admin',
      type: 'contact_support',
      labelKey: 'actions.contactAdmin',
      icon: 'headphones',
      showOnMobile: true,
      permissionActionType: 'contact_admin',
    })
  }

  // Copy request link
  actions.push({
    id: 'copy-link',
    type: 'copy_correct',
    labelKey: 'actions.copyRequestLink',
    icon: 'copy',
    showOnMobile: false,
    permissionActionType: 'copy_request_link',
  })

  return actions
}

/**
 * Check if an error response is a permission denied error
 */
export function isPermissionDeniedError(error: unknown): error is PermissionDeniedApiError {
  if (!error || typeof error !== 'object') return false
  const e = error as Record<string, unknown>
  return (
    e.error !== undefined &&
    typeof e.error === 'object' &&
    e.error !== null &&
    (e.error as Record<string, unknown>).code === 'PERMISSION_DENIED'
  )
}

// =============================================================================
// MAIN HOOK
// =============================================================================

export function usePermissionError(): UsePermissionErrorReturn {
  const { t, i18n } = useTranslation('permission-errors')
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)

  const [error, setErrorState] = useState<PermissionDeniedError | null>(null)

  // Access request mutation
  const accessRequestMutation = useMutation({
    mutationFn: async (payload: AccessRequestPayload) => {
      const { data, error } = await supabase.functions.invoke('access-requests', {
        body: {
          action: 'create',
          ...payload,
        },
      })

      if (error) throw error
      return data as AccessRequest
    },
    onSuccess: (data) => {
      toast({
        title: t('requestAccess.success.title'),
        description: t('requestAccess.success.message', {
          name: error?.accessGranters.find((g) => g.userId === data.granterId)?.name || 'Admin',
        }),
      })
      // Invalidate any pending requests queries
      queryClient.invalidateQueries({ queryKey: ['access-requests'] })
    },
    onError: () => {
      toast({
        title: t('requestAccess.error.title'),
        description: t('requestAccess.error.message'),
        variant: 'destructive',
      })
    },
  })

  // Set error from API response
  const setError = useCallback(
    (apiError: PermissionDeniedApiError) => {
      const parsedError = parseApiError(apiError)
      parsedError.suggestedActions = generateSuggestedActions(parsedError, t)
      setErrorState(parsedError)
    },
    [t],
  )

  // Clear error
  const clearError = useCallback(() => {
    setErrorState(null)
  }, [])

  // Request access
  const requestAccess = useCallback(
    async (payload: Omit<AccessRequestPayload, 'requesterId'>): Promise<AccessRequest | null> => {
      if (!user?.id) return null

      try {
        return await accessRequestMutation.mutateAsync({
          ...payload,
          requesterId: user.id,
        })
      } catch {
        return null
      }
    },
    [user?.id, accessRequestMutation],
  )

  // Get formatted error message
  const getErrorMessage = useCallback((): string => {
    if (!error) return ''

    if (error.resourceName) {
      return t('message.withName', {
        permission: t(`permissions.${error.requiredPermission}`),
        action: t(`permissions.${error.requiredPermission}`),
        resourceName: error.resourceName,
      })
    }

    return t('message.generic', {
      permission: t(`permissions.${error.requiredPermission}`),
      action: t(`permissions.${error.requiredPermission}`),
      resource: t(`resources.${error.resourceType}`),
    })
  }, [error, t])

  // Get primary granter
  const getPrimaryGranter = useCallback((): AccessGranter | null => {
    if (!error) return null
    return error.accessGranters.find((g) => g.isPrimary) || error.accessGranters[0] || null
  }, [error])

  // Get suggested actions
  const getSuggestedActions = useCallback((): PermissionAction[] => {
    return error?.suggestedActions || []
  }, [error])

  return {
    error,
    hasError: error !== null,
    setError,
    clearError,
    requestAccess,
    isRequestingAccess: accessRequestMutation.isPending,
    getErrorMessage,
    getPrimaryGranter,
    getSuggestedActions,
  }
}

// =============================================================================
// CONVENIENCE HOOKS
// =============================================================================

/**
 * Hook to check if user has permission for a resource
 */
export function useHasPermission(
  resourceType: ResourceType,
  permission: PermissionType,
  resourceId?: string,
) {
  const user = useAuthStore((state) => state.user)

  // This would typically call an API or check cached permissions
  // For now, return a simple role-based check
  const hasPermission = useMemo(() => {
    if (!user?.role) return false

    const roleHierarchy: Record<string, number> = {
      admin: 4,
      manager: 3,
      staff: 2,
      viewer: 1,
    }

    const permissionRequirements: Record<PermissionType, number> = {
      read: 1,
      write: 2,
      delete: 3,
      approve: 3,
      publish: 3,
      assign: 3,
      manage: 4,
      admin: 4,
    }

    const userLevel = roleHierarchy[user.role] || 1
    const requiredLevel = permissionRequirements[permission] || 1

    return userLevel >= requiredLevel
  }, [user?.role, permission])

  return hasPermission
}

/**
 * Create a permission error for testing/demo purposes
 */
export function createMockPermissionError(
  overrides?: Partial<PermissionDeniedError>,
): PermissionDeniedError {
  return {
    status: 403,
    code: 'PERMISSION_DENIED',
    requiredPermission: 'write',
    resourceType: 'dossier',
    resourceName: 'Saudi Arabia Country Profile',
    currentRole: 'viewer',
    requiredRole: 'staff',
    reason: 'insufficient_role',
    timestamp: new Date().toISOString(),
    accessGranters: [
      {
        userId: 'user-1',
        name: 'Ahmed Al-Rashid',
        email: 'ahmed.rashid@example.com',
        role: 'manager',
        isPrimary: true,
      },
      {
        userId: 'user-2',
        name: 'Sara Al-Mahmoud',
        email: 'sara.mahmoud@example.com',
        role: 'admin',
        isPrimary: false,
      },
    ],
    suggestedActions: [],
    ...overrides,
  }
}

export default usePermissionError
