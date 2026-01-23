/**
 * Bilateral Agreement Card Component (Feature 029 - User Story 6 - T080)
 *
 * Displays a single bilateral agreement (MoU) with key details.
 * Mobile-first layout with RTL support.
 * Shows title, type, dates, status, and AI-generated significance summary.
 */

import { useTranslation } from 'react-i18next'
import { FileText, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Link } from '@tanstack/react-router'
import { formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'

interface BilateralAgreementCardProps {
  agreement: {
    id: string
    reference_number: string
    title: string
    title_ar: string
    type: string
    mou_category: string
    lifecycle_state: string
    effective_date?: string
    expiry_date?: string
    description?: string
    dates?: {
      signed?: string
      effective?: string
      expires?: string
    }
  }
  aiSummary?: string // AI-generated significance from bilateral intelligence
  onClick?: () => void
}

export function BilateralAgreementCard({
  agreement,
  aiSummary,
  onClick,
}: BilateralAgreementCardProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'
  const locale = isRTL ? ar : enUS

  const title = isRTL ? agreement.title_ar : agreement.title
  const effectiveDate = agreement.effective_date || agreement.dates?.effective
  const expiryDate = agreement.expiry_date || agreement.dates?.expires

  // Determine status badge based on lifecycle_state
  const getStatusBadge = () => {
    switch (agreement.lifecycle_state.toLowerCase()) {
      case 'active':
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle className="size-3" />
            {t('mou.status.active', 'Active')}
          </Badge>
        )
      case 'draft':
      case 'under_negotiation':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="size-3" />
            {t('mou.status.draft', 'Draft')}
          </Badge>
        )
      case 'expired':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="size-3" />
            {t('mou.status.expired', 'Expired')}
          </Badge>
        )
      case 'terminated':
        return (
          <Badge variant="outline" className="gap-1">
            {t('mou.status.terminated', 'Terminated')}
          </Badge>
        )
      default:
        return <Badge variant="secondary">{agreement.lifecycle_state}</Badge>
    }
  }

  return (
    <Card
      className="group cursor-pointer p-4 transition-all hover:border-primary/50 sm:p-6"
      onClick={onClick}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header: Title and Status */}
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="mt-1 shrink-0">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="size-5 text-primary" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-foreground transition-colors group-hover:text-primary sm:text-base">
              {title}
            </h3>
            <p className="text-xs text-muted-foreground sm:text-sm">{agreement.reference_number}</p>
          </div>
        </div>
        <div className="shrink-0">{getStatusBadge()}</div>
      </div>

      {/* Type and Category */}
      <div className="mb-3 flex flex-wrap gap-2">
        <Badge variant="outline" className="text-xs">
          {t(`mou.type.${agreement.type.toLowerCase()}`, agreement.type)}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {t(`mou.category.${agreement.mou_category.toLowerCase()}`, agreement.mou_category)}
        </Badge>
      </div>

      {/* Dates */}
      {(effectiveDate || expiryDate) && (
        <div className="mb-3 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-4 sm:text-sm">
          {effectiveDate && (
            <div className="flex items-center gap-2">
              <Calendar className={`size-4 ${isRTL ? 'ms-1' : 'me-1'}`} />
              <span className="text-start">
                {t('mou.effective_date', 'Effective')}:{' '}
                {new Date(effectiveDate).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}
          {expiryDate && (
            <div className="flex items-center gap-2">
              <AlertCircle className={`size-4 ${isRTL ? 'ms-1' : 'me-1'}`} />
              <span className="text-start">
                {t('mou.expiry_date', 'Expires')}:{' '}
                {new Date(expiryDate).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Description */}
      {agreement.description && (
        <p className="mb-3 line-clamp-2 text-start text-xs text-muted-foreground sm:text-sm">
          {agreement.description}
        </p>
      )}

      {/* AI-Generated Significance Summary (Feature 029 - T082) */}
      {aiSummary && (
        <div className="mt-4 border-t border-border pt-4">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 shrink-0">
              <div className="flex size-5 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                <span className="text-xs">✨</span>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs font-medium text-purple-700 dark:text-purple-300">
                {t('intelligence.ai_insight', 'AI Insight')}
              </p>
              <p className="line-clamp-3 text-start text-xs text-muted-foreground">{aiSummary}</p>
            </div>
          </div>
        </div>
      )}

      {/* View Details Link */}
      <div className="mt-4 border-t border-border pt-4">
        <Link
          to="/mous"
          search={{ id: agreement.id }}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline sm:text-sm"
        >
          {t('common.view_details', 'View Details')}
          <span className={isRTL ? 'rotate-180' : ''}>→</span>
        </Link>
      </div>
    </Card>
  )
}
