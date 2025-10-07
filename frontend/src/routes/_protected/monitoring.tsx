import { createFileRoute } from '@tanstack/react-router'
import MonitoringDashboard from '@/pages/monitoring/Dashboard'

export const Route = createFileRoute('/_protected/monitoring')({
  component: MonitoringDashboard,
})

