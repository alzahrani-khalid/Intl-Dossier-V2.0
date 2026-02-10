import { createFileRoute } from '@tanstack/react-router'
import { DashboardPage } from '@/pages/Dashboard/DashboardPage'

export const Route = createFileRoute('/_protected/dashboard/project-management')({
  component: ProjectManagementDashboardAlias,
})

function ProjectManagementDashboardAlias() {
  return <DashboardPage />
}
