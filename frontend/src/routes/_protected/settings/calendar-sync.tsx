/**
 * Calendar Sync Settings Route
 * Two-way sync with external calendar systems (Google Calendar, Outlook, Exchange)
 */

import { createFileRoute } from '@tanstack/react-router'
import { CalendarSyncSettings } from '@/components/Calendar/CalendarSyncSettings'

export const Route = createFileRoute('/_protected/settings/calendar-sync')({
  component: CalendarSyncSettingsPage,
})

function CalendarSyncSettingsPage() {
  return <CalendarSyncSettings />
}
