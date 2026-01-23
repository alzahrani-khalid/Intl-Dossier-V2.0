import { createFileRoute } from '@tanstack/react-router'
import { NotificationPreferences } from '@/components/Notifications/NotificationPreferences'

export const Route = createFileRoute('/_protected/settings/notifications')({
  component: NotificationSettingsPage,
})

function NotificationSettingsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <NotificationPreferences />
    </div>
  )
}
