import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/dashboard/project-management')({
  component: ProjectManagementRedirect,
})

/**
 * Legacy project-management dashboard route.
 * The old DashboardPage was replaced by OperationsHub in Phase 10.
 * Redirect to the main dashboard (OperationsHub) to avoid 404s.
 */
function ProjectManagementRedirect(): React.ReactElement {
  return <Navigate to="/dashboard" />
}
