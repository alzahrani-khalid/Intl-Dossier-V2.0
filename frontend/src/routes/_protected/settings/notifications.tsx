import { createFileRoute } from '@tanstack/react-router'
import { NotificationPreferences } from '@/components/Notifications/NotificationPreferences'

export const Route = createFileRoute('/_protected/settings/notifications')({
  component: NotificationSettingsPage,
})

function NotificationSettingsPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl">
      <NotificationPreferences />
    </div>
  )
}
