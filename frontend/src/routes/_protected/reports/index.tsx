/**
 * Reports Index Page
 *
 * Main page for report templates and generation.
 */

import { createFileRoute } from '@tanstack/react-router'
import { ReportsPage } from '@/pages/reports/ReportsPage'

export const Route = createFileRoute('/_protected/reports/')({
  component: ReportsPage,
})
