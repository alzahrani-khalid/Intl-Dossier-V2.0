/**
 * Intake Domain Barrel
 * @module domains/intake
 */

// Hooks
export {
  intakeKeys,
  useCreateTicket,
  useTicket,
  useTriageSuggestions,
  useApplyTriage,
  useConvertTicket,
  useDuplicateCandidates,
  useMergeTickets,
  useCloseTicket,
  useUploadAttachment,
  useDeleteAttachment,
  useGetSLAPreview,
  usePauseSLA,
  useResumeSLA,
} from './hooks/useIntakeApi'
export type { SLAConfiguration } from './hooks/useIntakeApi'

export {
  useQueueFilters,
  useFilteredAssignments,
} from './hooks/useQueueFilters'
export type { FilterCriteria } from './hooks/useQueueFilters'

export {
  useReminderAction,
  useBulkReminderAction,
  useBulkReminderJobStatus,
  useEscalationAction,
} from './hooks/useWaitingQueueActions'
export type {
  ReminderAPIError,
  SendReminderResponse,
  BulkReminderJob,
  SendBulkRemindersResponse,
  EscalateAssignmentRequest,
  EscalateAssignmentResponse,
  EscalationAPIError,
} from './hooks/useWaitingQueueActions'

// Repository
export * as intakeRepo from './repositories/intake.repository'

// Types
export * from './types'
