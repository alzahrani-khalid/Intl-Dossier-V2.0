import { createFileRoute } from '@tanstack/react-router'
import { AvailabilityPollingPage } from '@/pages/availability-polling'

export const Route = createFileRoute('/_protected/availability-polling')({
  component: AvailabilityPollingPage,
})
