/**
 * SLA Monitoring Route
 * Feature: sla-monitoring
 */

import { createFileRoute } from '@tanstack/react-router'
import SLADashboardPage from '@/pages/sla-monitoring/SLADashboardPage'

export const Route = createFileRoute('/_protected/sla-monitoring')({
  component: SLADashboardPage,
})
