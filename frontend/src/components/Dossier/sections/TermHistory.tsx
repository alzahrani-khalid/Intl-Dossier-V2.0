/**
 * Term History Section
 *
 * Displays the elected official's current and past term information.
 * Mobile-first design with RTL support.
 */

import { useTranslation } from 'react-i18next'
import { Calendar, Clock, Hash, CheckCircle2, Circle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ElectedOfficialDossier } from '@/lib/dossier-type-guards'

interface TermHistoryProps {
  dossier: ElectedOfficialDossier
}

export function TermHistory({ dossier }: TermHistoryProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'
  const { extension } = dossier

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  }

  // Calculate term duration
  const calculateDuration = (start?: string, end?: string) => {
    if (!start) return null
    const startDate = new Date(start)
    const endDate = end ? new Date(end) : new Date()
    const years = Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365),
    )
    const months = Math.floor(
      ((endDate.getTime() - startDate.getTime()) % (1000 * 60 * 60 * 24 * 365)) /
        (1000 * 60 * 60 * 24 * 30),
    )

    if (isRTL) {
      if (years === 0) return `${months} شهر`
      if (months === 0) return `${years} سنة`
      return `${years} سنة و ${months} شهر`
    } else {
      if (years === 0) return `${months} month${months !== 1 ? 's' : ''}`
      if (months === 0) return `${years} year${years !== 1 ? 's' : ''}`
      return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`
    }
  }

  // Get term number ordinal
  const getTermOrdinal = (num?: number) => {
    if (!num) return null
    if (isRTL) {
      return `الفترة ${num}`
    }
    const ordinals = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th']
    return `${ordinals[num - 1] || `${num}th`} Term`
  }

  const hasTermInfo = extension.term_start || extension.term_end || extension.term_number

  if (!hasTermInfo) {
    return (
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mb-3 opacity-50" />
            <p>{t('sections.electedOfficial.noTermInfo')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0 space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Current Term */}
        <div className="p-4 rounded-lg bg-muted/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {extension.is_current_term ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-gray-400" />
              )}
              <span className="font-medium">
                {extension.is_current_term
                  ? t('sections.electedOfficial.currentTerm')
                  : t('sections.electedOfficial.previousTerm')}
              </span>
            </div>
            {extension.term_number && (
              <Badge variant="secondary">
                <Hash className="h-3 w-3 me-1" />
                {getTermOrdinal(extension.term_number)}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Start Date */}
            {extension.term_start && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  {t('sections.electedOfficial.termStart')}
                </span>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{formatDate(extension.term_start)}</span>
                </div>
              </div>
            )}

            {/* End Date */}
            {extension.term_end && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  {t('sections.electedOfficial.termEnd')}
                </span>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{formatDate(extension.term_end)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Duration */}
          {extension.term_start && (
            <div className="pt-2 border-t border-muted">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {t('sections.electedOfficial.duration')}:{' '}
                  <span className="font-medium text-foreground">
                    {calculateDuration(extension.term_start, extension.term_end)}
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Data Source Info */}
        {extension.last_verified_at && (
          <div className="text-xs text-muted-foreground">
            {t('sections.electedOfficial.lastVerified')}: {formatDate(extension.last_verified_at)}
            {extension.data_source && (
              <span className="ms-2">({t(`dataSource.${extension.data_source}`)})</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
