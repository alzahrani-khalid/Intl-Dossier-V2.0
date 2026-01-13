/**
 * Custom Dashboard Route
 *
 * Protected route for the customizable dashboard with drag-and-drop widgets.
 */

import { createFileRoute } from '@tanstack/react-router'
import { CustomDashboardPage } from '@/pages/custom-dashboard'

export const Route = createFileRoute('/_protected/custom-dashboard')({
  component: CustomDashboardPage,
})
