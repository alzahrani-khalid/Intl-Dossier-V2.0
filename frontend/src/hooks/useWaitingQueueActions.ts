/**
 * @deprecated Import from '@/domains/intake' instead.
 * Backward-compatible re-export.
 */
export {
  useReminderAction,
  useBulkReminderAction,
  useBulkReminderJobStatus,
  useEscalationAction,
} from '@/domains/intake'
export type {
  ReminderAPIError,
  SendReminderResponse,
  BulkReminderJob,
  SendBulkRemindersResponse,
  EscalateAssignmentRequest,
  EscalateAssignmentResponse,
  EscalationAPIError,
} from '@/domains/intake'
