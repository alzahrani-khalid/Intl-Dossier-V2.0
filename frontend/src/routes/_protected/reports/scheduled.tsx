/**
 * Scheduled Reports Page
 *
 * Page for managing scheduled recurring reports with automatic
 * generation and distribution.
 */

import { createFileRoute } from '@tanstack/react-router'
import { ScheduledReportsManager } from '@/components/scheduled-reports/ScheduledReportsManager'

export const Route = createFileRoute('/_protected/reports/scheduled')({
  component: ScheduledReportsPage,
})

function ScheduledReportsPage() {
  return (
    <div className="container mx-auto py-4 sm:py-6">
      <ScheduledReportsManager />
    </div>
  )
}
