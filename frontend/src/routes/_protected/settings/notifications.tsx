import { createFileRoute } from '@tanstack/react-router'
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences'

export const Route = createFileRoute('/_protected/settings/notifications')({
  component: NotificationSettingsPage,
})

function NotificationSettingsPage() {
  return (
    <div className="container mx-auto py-6 sm:py-8 max-w-4xl">
      <NotificationPreferences />
    </div>
  )
}
