/**
 * PositionTrackerCard
 *
 * Topic-specific card showing "our stance vs counterpart stances"
 * as a compact comparison card. Summary-level per D-11 (NOT full CRUD).
 * Two-column layout: "Our Position" on one side, "Counterpart" on the other.
 * In RTL: first column (our stance) renders on RIGHT (natural flex-row RTL).
 * Mobile-first, RTL-compatible.
 */

import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { useDossierPositionLinks } from '@/hooks/useDossierPositionLinks'
import { Skeleton } from '@/components/ui/skeleton'
import { ExternalLink } from 'lucide-react'

interface PositionTrackerCardProps {
  dossierId: string
}

export function PositionTrackerCard({
  dossierId,
}: PositionTrackerCardProps): React.ReactElement {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  const { positions, isLoading } = useDossierPositionLinks(dossierId)

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border p-4 sm:p-6">
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-24 flex-1" />
          <Skeleton className="h-24 flex-1" />
        </div>
      </div>
    )
  }

  // Separate our positions (primary) from counterpart positions (related/reference)
  const ourPositions = positions?.filter(
    (p: Record<string, unknown>) => p.link_type === 'primary',
  ) ?? []
  const counterpartPositions = positions?.filter(
    (p: Record<string, unknown>) => p.link_type !== 'primary',
  ) ?? []

  const hasPositions = (positions?.length ?? 0) > 0

  return (
    <div className="bg-card rounded-lg border p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold leading-tight text-start">
          {t('overview.positions.title', { defaultValue: 'Position Tracker' })}
        </h3>
      </div>

      {!hasPositions ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm mb-3">
            {t('overview.positions.empty', {
              defaultValue: 'No positions tracked yet. Add positions in the Positions tab.',
            })}
          </p>
          <Link
            to="/dossiers/topics/$id"
            params={{ id: dossierId }}
            search={{ tab: 'positions' }}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors min-h-11"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t('overview.positions.addPositions', { defaultValue: 'Add Positions' })}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Two-column comparison: Our Stance vs Counterpart */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Our Position — first child renders on RIGHT in RTL */}
            <div className="flex-1 rounded-md bg-primary/5 p-3">
              <h4 className="text-sm font-medium mb-2">
                {t('overview.positions.ourStance', { defaultValue: 'Our Position' })}
              </h4>
              {ourPositions.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {t('overview.positions.noOurStance', { defaultValue: 'Not defined' })}
                </p>
              ) : (
                <div className="space-y-2">
                  {ourPositions.slice(0, 3).map((pos: Record<string, unknown>) => (
                    <div key={pos.id as string} className="text-xs">
                      <p className="font-medium truncate">
                        {(isRTL ? pos.title_ar : pos.title_en) as string || (pos.title_en as string)}
                      </p>
                      {pos.summary_en && (
                        <p className="text-muted-foreground line-clamp-2 mt-0.5">
                          {(isRTL ? pos.summary_ar : pos.summary_en) as string}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Counterpart Positions — second child renders on LEFT in RTL */}
            <div className="flex-1 rounded-md bg-muted/50 p-3">
              <h4 className="text-sm font-medium mb-2">
                {t('overview.positions.counterpart', { defaultValue: 'Counterpart Positions' })}
              </h4>
              {counterpartPositions.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {t('overview.positions.noCounterpart', { defaultValue: 'None recorded' })}
                </p>
              ) : (
                <div className="space-y-2">
                  {counterpartPositions.slice(0, 3).map((pos: Record<string, unknown>) => (
                    <div key={pos.id as string} className="text-xs">
                      <p className="font-medium truncate">
                        {(isRTL ? pos.title_ar : pos.title_en) as string || (pos.title_en as string)}
                      </p>
                      {pos.summary_en && (
                        <p className="text-muted-foreground line-clamp-2 mt-0.5">
                          {(isRTL ? pos.summary_ar : pos.summary_en) as string}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* View Positions link */}
          <Link
            to="/dossiers/topics/$id"
            params={{ id: dossierId }}
            search={{ tab: 'positions' }}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors min-h-11"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t('overview.positions.viewAll', { defaultValue: 'View Positions' })}
          </Link>
        </div>
      )}
    </div>
  )
}
