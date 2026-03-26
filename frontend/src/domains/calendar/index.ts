/**
 * Calendar Domain Barrel
 * @module domains/calendar
 *
 * Re-exports all hooks, repository, and types for the calendar domain.
 * Canonical import path for consumers: `@/domains/calendar`
 */

// Hooks - Calendar Events
export {
  useCalendarEvents,
  type UseCalendarEventsResult,
} from './hooks/useCalendarEvents'
export { useCreateCalendarEvent } from './hooks/useCreateCalendarEvent'
export { useUpdateCalendarEvent } from './hooks/useUpdateCalendarEvent'

// Hooks - Conflicts
export {
  useCalendarConflicts,
  useCheckConflicts,
  useConflictCheck,
  useConflicts,
  useEventConflicts,
  useGenerateSuggestions,
  useSuggestions,
  useAcceptSuggestion,
  useResolveConflict,
  useCreateScenario,
  useScenarios,
  useApplyScenario,
  useDeleteScenario,
  useBulkReschedule,
} from './hooks/useCalendarConflicts'

// Hooks - Recurring Events
export {
  useCreateRecurringEvent,
  useEventSeries,
  useSeriesOccurrences,
  useUpdateSeries,
  useDeleteOccurrences,
  useCreateException,
  useRemoveException,
  useEventNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useIsRecurringEvent,
  useNextOccurrences,
} from './hooks/useRecurringEvents'

// Repository
export * as calendarRepo from './repositories/calendar.repository'

// Types
export * from './types'
