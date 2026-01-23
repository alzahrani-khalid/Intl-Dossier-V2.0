/**
 * Dashboard Route
 *
 * Dossier-centric landing page that shows user's dossiers,
 * recent activity, and pending work grouped by dossier.
 */

import { createFileRoute } from '@tanstack/react-router'
import { DashboardPage } from '@/pages/Dashboard/DashboardPage'

export const Route = createFileRoute('/_protected/dashboard')({
  component: DossierDashboardPage,
})

function DossierDashboardPage() {
  return <DashboardPage />
}
