/**
 * Permission Error Types
 * Types for handling permission-denied errors with actionable guidance
 */

import type { ErrorAction } from './actionable-error.types'

// =============================================================================
// PERMISSION TYPES
// =============================================================================

/**
 * Permission types that can be required for actions
 */
export type PermissionType =
  | 'read'
  | 'write'
  | 'delete'
  | 'approve'
  | 'publish'
  | 'assign'
  | 'manage'
  | 'admin'

/**
 * Resource types that permissions apply to
 */
export type ResourceType =
  | 'dossier'
  | 'country'
  | 'organization'
  | 'mou'
  | 'event'
  | 'forum'
  | 'brief'
  | 'document'
  | 'report'
  | 'engagement'
  | 'commitment'
  | 'position'
  | 'person'
  | 'calendar'
  | 'user'
  | 'system'

/**
 * Roles that can grant permissions
 */
export type PermissionRole = 'admin' | 'manager' | 'staff' | 'viewer'

// =============================================================================
// PERMISSION ERROR
// =============================================================================

/**
 * Detailed information about who can grant access
 */
export interface AccessGranter {
  /** User ID of the person who can grant access */
  userId: string
  /** Display name of the user */
  name: string
  /** Email of the user */
  email: string
  /** Role of the user */
  role: PermissionRole
  /** Whether this user is the primary contact for access requests */
  isPrimary?: boolean
}

/**
 * Permission denied error with full context
 */
export interface PermissionDeniedError {
  /** HTTP status code (usually 403) */
  status: 403
  /** Error code for tracking */
  code: 'PERMISSION_DENIED'
  /** The permission that was required */
  requiredPermission: PermissionType
  /** The resource type being accessed */
  resourceType: ResourceType
  /** The specific resource ID (if applicable) */
  resourceId?: string
  /** The resource name for display */
  resourceName?: string
  /** User's current role */
  currentRole: PermissionRole
  /** Role required to perform the action */
  requiredRole?: PermissionRole
  /** Why the user doesn't have this permission */
  reason: PermissionDeniedReason
  /** People who can grant this permission */
  accessGranters: AccessGranter[]
  /** Suggested actions the user can take */
  suggestedActions: PermissionAction[]
  /** Timestamp of the error */
  timestamp: string
  /** Attempted action that was blocked */
  attemptedAction?: string
}

/**
 * Reasons why permission was denied
 */
export type PermissionDeniedReason =
  | 'insufficient_role' // User's role doesn't include this permission
  | 'resource_restricted' // Resource has specific access restrictions
  | 'delegation_expired' // User had delegated permissions that expired
  | 'delegation_revoked' // User's delegated permissions were revoked
  | 'not_assigned' // User is not assigned to this resource
  | 'resource_locked' // Resource is locked for editing
  | 'workflow_state' // Resource is in a workflow state that prevents action
  | 'time_restricted' // Access is time-restricted
  | 'quota_exceeded' // User has exceeded their access quota
  | 'pending_approval' // User's access request is pending approval

/**
 * Actions specific to permission errors
 */
export interface PermissionAction extends ErrorAction {
  /** Type of permission-specific action */
  permissionActionType: PermissionActionType
}

/**
 * Types of permission-specific actions
 */
export type PermissionActionType =
  | 'request_access' // Request access from a granter
  | 'view_permissions' // View current permissions
  | 'request_delegation' // Request temporary delegation
  | 'contact_admin' // Contact system administrator
  | 'view_alternatives' // View alternative resources user can access
  | 'escalate' // Escalate the access need
  | 'copy_request_link' // Copy a link to request access

// =============================================================================
// ACCESS REQUEST
// =============================================================================

/**
 * Status of an access request
 */
export type AccessRequestStatus = 'pending' | 'approved' | 'denied' | 'expired' | 'cancelled'

/**
 * Access request to be submitted
 */
export interface AccessRequestPayload {
  /** ID of the user requesting access */
  requesterId: string
  /** ID of the user who can grant access */
  granterId: string
  /** Type of resource being requested */
  resourceType: ResourceType
  /** Specific resource ID (if applicable) */
  resourceId?: string
  /** Permission being requested */
  requestedPermission: PermissionType
  /** Reason/justification for the request */
  reason: string
  /** Urgency level */
  urgency: 'low' | 'medium' | 'high' | 'critical'
  /** Requested duration in days (for temporary access) */
  requestedDuration?: number
}

/**
 * Full access request record
 */
export interface AccessRequest extends AccessRequestPayload {
  /** Unique request ID */
  id: string
  /** Current status */
  status: AccessRequestStatus
  /** Timestamp of request creation */
  createdAt: string
  /** Timestamp of last update */
  updatedAt: string
  /** Response from the granter (if any) */
  response?: {
    /** Whether access was granted */
    granted: boolean
    /** Message from the granter */
    message?: string
    /** If granted, when does it expire */
    expiresAt?: string
    /** User who responded */
    responderId: string
    /** Timestamp of response */
    respondedAt: string
  }
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * API error response for permission denied
 */
export interface PermissionDeniedApiError {
  error: {
    code: 'PERMISSION_DENIED'
    message: string
    message_ar: string
    details: {
      required_permission: PermissionType
      resource_type: ResourceType
      resource_id?: string
      resource_name?: string
      current_role: PermissionRole
      required_role?: PermissionRole
      reason: PermissionDeniedReason
      access_granters: Array<{
        user_id: string
        name: string
        email: string
        role: PermissionRole
        is_primary: boolean
      }>
    }
  }
}

/**
 * API response for access request submission
 */
export interface AccessRequestApiResponse {
  success: boolean
  data?: {
    request_id: string
    status: AccessRequestStatus
    message: string
    message_ar: string
  }
  error?: {
    code: string
    message: string
    message_ar: string
  }
}

// =============================================================================
// HOOK RETURN TYPES
// =============================================================================

/**
 * Return type for usePermissionError hook
 */
export interface UsePermissionErrorReturn {
  /** Current permission error (if any) */
  error: PermissionDeniedError | null
  /** Whether there's an active permission error */
  hasError: boolean
  /** Set a permission error from API response */
  setError: (error: PermissionDeniedApiError) => void
  /** Clear the current error */
  clearError: () => void
  /** Submit an access request */
  requestAccess: (
    payload: Omit<AccessRequestPayload, 'requesterId'>,
  ) => Promise<AccessRequest | null>
  /** Whether an access request is being submitted */
  isRequestingAccess: boolean
  /** Format error message with i18n */
  getErrorMessage: () => string
  /** Get the primary contact for access */
  getPrimaryGranter: () => AccessGranter | null
  /** Get suggested actions for the current error */
  getSuggestedActions: () => PermissionAction[]
}

// =============================================================================
// COMPONENT PROPS
// =============================================================================

/**
 * Props for PermissionDeniedDialog component
 */
export interface PermissionDeniedDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when dialog should close */
  onClose: () => void
  /** The permission error to display */
  error: PermissionDeniedError
  /** Callback when access is requested */
  onRequestAccess?: (granter: AccessGranter, reason: string) => Promise<void>
  /** Whether to show the request access form */
  showRequestForm?: boolean
  /** Additional className */
  className?: string
}

/**
 * Props for PermissionDeniedInline component
 */
export interface PermissionDeniedInlineProps {
  /** The permission error to display */
  error: PermissionDeniedError
  /** Whether to show in compact mode */
  compact?: boolean
  /** Callback when access is requested */
  onRequestAccess?: (granter: AccessGranter) => void
  /** Callback when error is dismissed */
  onDismiss?: () => void
  /** Additional className */
  className?: string
}

/**
 * Props for AccessRequestForm component
 */
export interface AccessRequestFormProps {
  /** The granter to request access from */
  granter: AccessGranter
  /** The resource details */
  resourceType: ResourceType
  resourceId?: string
  resourceName?: string
  /** The permission being requested */
  permission: PermissionType
  /** Callback when form is submitted */
  onSubmit: (
    reason: string,
    urgency: AccessRequestPayload['urgency'],
    duration?: number,
  ) => Promise<void>
  /** Callback when form is cancelled */
  onCancel: () => void
  /** Whether the form is submitting */
  isSubmitting?: boolean
  /** Additional className */
  className?: string
}
