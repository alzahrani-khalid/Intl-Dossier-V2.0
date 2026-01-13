import { createFileRoute } from '@tanstack/react-router'
import { NotificationsPage } from '@/pages/notifications/NotificationsPage'

export const Route = createFileRoute('/_protected/notifications')({
  component: NotificationsPage,
})
