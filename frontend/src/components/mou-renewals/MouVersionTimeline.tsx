/**
 * MouVersionTimeline Component
 * Feature: commitment-renewal-workflow
 *
 * Displays the version chain of an MoU showing historical renewals.
 * Mobile-first, RTL-aware design.
 */

import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { FileText, RefreshCw, Calendar, ChevronRight, CheckCircle, Clock } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import { type MouVersionHistory } from '@/types/mou-renewal.types'

interface MouVersionTimelineProps {
  versions: MouVersionHistory[]
  currentMouId?: string
  onVersionClick?: (mouId: string) => void
  showDetails?: boolean
}

export function MouVersionTimeline({
  versions,
  currentMouId,
  onVersionClick,
  showDetails = true,
}: MouVersionTimelineProps) {
  const { t, i18n } = useTranslation('mou-renewals')
  const isRTL = i18n.language === 'ar'
  const dateLocale = isRTL ? ar : enUS

  if (versions.length === 0) {
    return (
      <Card dir={isRTL ? 'rtl' : 'ltr'}>
        <CardContent className="py-8 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">{t('versionHistory.noVersions')}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <RefreshCw className="h-4 w-4" />
          {t('versionHistory.title')}
          <Badge variant="secondary" className="ms-auto">
            {t('versionHistory.versionCount', { count: versions.length })}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div
            className={cn('absolute top-0 bottom-0 w-0.5 bg-border', isRTL ? 'right-3' : 'left-3')}
          />

          {/* Version entries */}
          <div className="space-y-4">
            {versions.map((version, index) => {
              const isCurrent = version.mou_id === currentMouId || version.is_current
              const isFirst = index === 0
              const isLast = index === versions.length - 1
              const title = isRTL ? version.title_ar : version.title_en
              const changesSummary = isRTL ? version.changes_summary_ar : version.changes_summary_en

              return (
                <div key={version.mou_id} className={cn('relative', isRTL ? 'pe-10' : 'ps-10')}>
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      'absolute top-1 flex h-6 w-6 items-center justify-center rounded-full border-2',
                      isRTL ? 'right-0' : 'left-0',
                      isCurrent
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted bg-background text-muted-foreground',
                    )}
                  >
                    {isCurrent ? (
                      <CheckCircle className="h-3.5 w-3.5" />
                    ) : (
                      <Clock className="h-3.5 w-3.5" />
                    )}
                  </div>

                  {/* Version content */}
                  <div
                    className={cn(
                      'rounded-lg border p-3 transition-all',
                      isCurrent && 'border-primary bg-primary/5',
                      onVersionClick && 'cursor-pointer hover:border-primary/50',
                    )}
                    onClick={() => onVersionClick?.(version.mou_id)}
                    role={onVersionClick ? 'button' : undefined}
                    tabIndex={onVersionClick ? 0 : undefined}
                  >
                    {/* Header */}
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={isCurrent ? 'default' : 'outline'} className="text-xs">
                          {t('versionHistory.version', {
                            number: version.version_number,
                          })}
                        </Badge>
                        {version.renewal_reference && (
                          <Badge variant="secondary" className="text-xs">
                            {version.renewal_reference}
                          </Badge>
                        )}
                      </div>

                      {isCurrent && (
                        <Badge variant="default" className="text-xs">
                          {t('versionHistory.current')}
                        </Badge>
                      )}
                    </div>

                    {/* Reference and title */}
                    <div className="mt-2">
                      <p className="text-sm font-medium">{title}</p>
                      <p className="text-xs text-muted-foreground">{version.reference_number}</p>
                    </div>

                    {/* Date range */}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(new Date(version.effective_from), 'PP', {
                          locale: dateLocale,
                        })}
                      </span>
                      {version.effective_to && (
                        <>
                          <ChevronRight className={cn('h-3 w-3', isRTL && 'rotate-180')} />
                          <span>
                            {format(new Date(version.effective_to), 'PP', {
                              locale: dateLocale,
                            })}
                          </span>
                        </>
                      )}
                      {!version.effective_to && isCurrent && (
                        <span className="text-primary">({t('versionHistory.ongoing')})</span>
                      )}
                    </div>

                    {/* Changes summary */}
                    {showDetails && changesSummary && (
                      <div className="mt-2 rounded bg-muted/50 p-2">
                        <p className="text-xs text-muted-foreground">
                          {t('versionHistory.changes')}:
                        </p>
                        <p className="mt-0.5 text-sm">{changesSummary}</p>
                      </div>
                    )}

                    {/* Click indicator */}
                    {onVersionClick && (
                      <div className="mt-2 flex items-center justify-end">
                        <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
                          {t('actions.viewDetails')}
                          <ChevronRight
                            className={cn('h-3 w-3', isRTL ? 'rotate-180 me-1' : 'ms-1')}
                          />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default MouVersionTimeline
