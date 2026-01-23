/**
 * DossierIntelligenceTab Component (Feature 029 - User Story 1)
 *
 * Displays AI-generated intelligence for a dossier entity
 * Features: 4 intelligence types (economic, political, security, bilateral)
 * Mobile-first responsive design with RTL support
 * Integrates with AnythingLLM-generated intelligence reports
 */

import { useTranslation } from 'react-i18next'
import { useAllIntelligence, useRefreshIntelligence } from '@/hooks/useIntelligence'
import { IntelligenceCard } from '@/components/intelligence/IntelligenceCard'
import { RefreshButton } from '@/components/intelligence/RefreshButton'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Lightbulb } from 'lucide-react'
import { toast } from 'sonner'
import type { IntelligenceType } from '@/types/intelligence-reports.types'

interface DossierIntelligenceTabProps {
  dossierId: string
}

export function DossierIntelligenceTab({ dossierId }: DossierIntelligenceTabProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  const { data: intelligenceData, isLoading, isError, error } = useAllIntelligence(dossierId)

  const { mutate: refreshIntelligence, isPending: isRefreshing } = useRefreshIntelligence({
    onSuccess: (data) => {
      // Show success toast
      const typeLabels = data.data
        .map((r) => t(`intelligence.types.${r.intelligence_type}`))
        .join(', ')
      toast.success(
        isRTL ? `تم تحديث التقارير بنجاح: ${typeLabels}` : `Successfully refreshed: ${typeLabels}`,
      )
    },
    onError: (error) => {
      // Handle specific error codes
      if (error.code === 'CONFLICT') {
        toast.warning(
          isRTL
            ? 'تحديث جاري بالفعل. يرجى الانتظار حتى يكتمل.'
            : 'Refresh already in progress. Please wait until it completes.',
        )
      } else if (error.code === 'SERVICE_UNAVAILABLE') {
        toast.error(
          isRTL
            ? 'خدمة AnythingLLM غير متاحة. سيتم عرض البيانات المخزنة مؤقتاً.'
            : 'AnythingLLM service unavailable. Showing cached data.',
        )
      } else {
        toast.error(
          isRTL
            ? `فشل التحديث: ${error.message_ar || error.message_en}`
            : `Refresh failed: ${error.message_en}`,
        )
      }
    },
  })

  const handleRefresh = (types: IntelligenceType[]) => {
    refreshIntelligence({
      entity_id: dossierId,
      intelligence_types: types,
      priority: 'normal',
    })
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <Alert variant="destructive" dir={isRTL ? 'rtl' : 'ltr'}>
        <AlertCircle className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
        <AlertDescription>
          {error instanceof Error
            ? error.message
            : t('intelligence.error', 'Failed to load intelligence')}
        </AlertDescription>
      </Alert>
    )
  }

  // Empty state
  if (!intelligenceData || intelligenceData.data.length === 0) {
    return (
      <div className="text-center py-12" dir={isRTL ? 'rtl' : 'ltr'}>
        <Lightbulb className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          {t('intelligence.empty', 'No Intelligence Reports')}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t(
            'intelligence.emptyDescription',
            'No intelligence reports have been generated for this entity yet',
          )}
        </p>
      </div>
    )
  }

  // Sort intelligence by type: economic, political, security, bilateral
  const typeOrder = ['economic', 'political', 'security', 'bilateral']
  const sortedIntelligence = [...intelligenceData.data].sort((a, b) => {
    return typeOrder.indexOf(a.intelligence_type) - typeOrder.indexOf(b.intelligence_type)
  })

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header with Refresh Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">
            {t('intelligence.title', 'Intelligence Reports')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t(
              'intelligence.description',
              'AI-generated intelligence insights from credible sources',
            )}
          </p>
        </div>
        <RefreshButton
          intelligenceTypes={['economic', 'political', 'security', 'bilateral']}
          onRefresh={handleRefresh}
          isLoading={isRefreshing}
          showTypeSelection={true}
          className="w-full sm:w-auto"
        />
      </div>

      {/* Intelligence Reports Grid - Mobile First Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {sortedIntelligence.map((intelligence) => (
          <IntelligenceCard
            key={intelligence.id}
            intelligence={intelligence}
            showFullAnalysis={false}
          />
        ))}
      </div>

      {/* Metadata Summary */}
      {intelligenceData.meta && (
        <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
          <div>
            <span className="font-medium">{t('intelligence.totalReports', 'Total Reports')}:</span>{' '}
            {intelligenceData.meta.total_count}
          </div>
          <div>
            <span className="font-medium">{t('intelligence.freshReports', 'Fresh')}:</span>{' '}
            {intelligenceData.meta.fresh_count}
          </div>
          <div>
            <span className="font-medium">{t('intelligence.staleReports', 'Stale')}:</span>{' '}
            {intelligenceData.meta.stale_count}
          </div>
        </div>
      )}
    </div>
  )
}
