import { createFileRoute } from '@tanstack/react-router'
import { AnalyticsDashboardPage } from '@/pages/analytics'

export const Route = createFileRoute('/_protected/analytics')({
  component: AnalyticsDashboardPage,
})
