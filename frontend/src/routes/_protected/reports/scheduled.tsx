/**
 * Scheduled Reports Page
 *
 * Page for managing scheduled recurring reports with automatic
 * generation and distribution.
 */

import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ScheduledReportsManager } from '@/components/scheduled-reports/ScheduledReportsManager'

export const Route = createFileRoute('/_protected/reports/scheduled')({
  component: ScheduledReportsPage,
})

function ScheduledReportsPage() {
  const { i18n } = useTranslation('scheduled-reports')
  const isRTL = i18n.language === 'ar'

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <ScheduledReportsManager />
    </div>
  )
}
