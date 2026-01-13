/**
 * Single Report Page
 *
 * Page for editing a specific saved report.
 */

import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ReportBuilder } from '@/components/report-builder'

export const Route = createFileRoute('/_protected/reports/$reportId')({
  component: ReportDetailPage,
})

function ReportDetailPage() {
  const { reportId } = Route.useParams()
  const { t, i18n } = useTranslation('report-builder')
  const isRTL = i18n.language === 'ar'

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 h-[calc(100vh-4rem)]"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <ReportBuilder initialReportId={reportId} />
    </div>
  )
}
