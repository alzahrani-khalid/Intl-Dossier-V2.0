/**
 * Dashboard Route
 *
 * Role-specific landing page that surfaces relevant entities,
 * pending actions, and shortcuts based on user role.
 */

import { createFileRoute } from '@tanstack/react-router'
import { RoleDashboard } from '@/components/role-dashboards'

export const Route = createFileRoute('/_protected/dashboard')({
  component: RoleDashboardPage,
})

function RoleDashboardPage() {
  return <RoleDashboard />
}
