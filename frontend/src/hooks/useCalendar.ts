/**
 * Calendar Hooks
 * @module hooks/useCalendar
 * @feature calendar-events
 *
 * Central export point for all calendar-related React Query hooks.
 *
 * @description
 * This module consolidates all calendar operation hooks for convenient importing.
 * It provides a single import point for calendar event queries, mutations,
 * conflicts, sync, and recurring event management.
 *
 * @example
 * // Import individual hooks
 * import { useCalendarEvents, useCreateCalendarEvent } from '@/hooks/useCalendar';
 *
 * @example
 * // Or import from specific hook files
 * import { useCalendarEvents } from '@/hooks/useCalendarEvents';
 */

export { useCalendarEvents } from './useCalendarEvents';
export { useCreateCalendarEvent } from './useCreateCalendarEvent';
export { useUpdateCalendarEvent } from './useUpdateCalendarEvent';
