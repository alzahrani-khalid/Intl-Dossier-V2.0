/**
 * Permission Errors Components
 * Components for displaying permission denied errors with actionable guidance
 */

export { PermissionDeniedDialog } from './PermissionDeniedDialog'
export {
  PermissionDeniedInline,
  PermissionDeniedBadge,
  PendingRequestIndicator,
} from './PermissionDeniedInline'

// Re-export types for convenience
export type {
  PermissionDeniedError,
  PermissionDeniedDialogProps,
  PermissionDeniedInlineProps,
  AccessGranter,
  AccessRequest,
  AccessRequestPayload,
  PermissionType,
  ResourceType,
  PermissionRole,
  PermissionDeniedReason,
} from '@/types/permission-error.types'
