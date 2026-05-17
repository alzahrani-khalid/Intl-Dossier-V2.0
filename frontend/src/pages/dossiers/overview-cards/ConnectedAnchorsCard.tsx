/**
 * ConnectedAnchorsCard
 *
 * Topic-specific card showing cross-cutting view of which anchor dossiers
 * (countries, organizations) are connected to this topic.
 * Compact list with type icon and name, clickable to navigate.
 * Mobile-first, RTL-compatible.
 */

import { useTranslation } from 'react-i18next'
import { useDossierOverview } from '@/hooks/useDossierOverview'
import { Skeleton } from '@/components/ui/skeleton'
import { Link } from '@tanstack/react-router'
import { getDossierRouteSegment } from '@/lib/dossier-routes'
import { Flag, Building2, ChevronLeft } from 'lucide-react'
import type { DossierType } from '@/services/dossier-api'

interface ConnectedAnchorsCardProps {
  dossierId: string
}

const MAX_ANCHORS = 5

function getTypeIcon(type: DossierType): React.ReactNode {
  switch (type) {
    case 'country':
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#ConnectedAnchorsCard
      return <Flag className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
    case 'organization':
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#ConnectedAnchorsCard
      return <Building2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
    default:
      return <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
  }
}

export function ConnectedAnchorsCard({ dossierId }: ConnectedAnchorsCardProps): React.ReactElement {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  const { data, isLoading } = useDossierOverview(dossierId, {
    includeSections: ['related_dossiers'],
  })

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border p-4 sm:p-6">
        <Skeleton className="h-5 w-36 mb-4" />
        <div className="space-y-3">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-10" />
          ))}
        </div>
      </div>
    )
  }

  // Extract anchor dossier types (countries, organizations)
  const countryAnchors = data?.related_dossiers?.by_dossier_type?.country ?? []
  const orgAnchors = data?.related_dossiers?.by_dossier_type?.organization ?? []
  const allAnchors = [...countryAnchors, ...orgAnchors]
  const displayAnchors = allAnchors.slice(0, MAX_ANCHORS)
  const hasMore = allAnchors.length > MAX_ANCHORS

  return (
    <div className="bg-card rounded-lg border p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <h3 className="text-base font-semibold leading-tight text-start mb-4">
        {t('overview.anchors.title', { defaultValue: 'Connected Anchors' })}
      </h3>

      {displayAnchors.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          {t('overview.anchors.empty', {
            defaultValue: 'No anchor dossiers connected',
          })}
        </p>
      ) : (
        <div className="space-y-2">
          {displayAnchors.map((anchor) => {
            const displayName = isRTL ? anchor.name_ar : anchor.name_en
            const routeSegment = getDossierRouteSegment(anchor.type)

            return (
              <Link
                key={anchor.id}
                to={`/dossiers/${routeSegment}/$id`}
                params={{ id: anchor.id }}
                className="block"
              >
                <div className="flex items-center gap-3 rounded-md p-2 hover:bg-muted/50 transition-colors min-h-11">
                  {getTypeIcon(anchor.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {t(`type.${anchor.type}`, anchor.type)}
                    </p>
                  </div>
                  <ChevronLeft
                    className={`h-4 w-4 text-muted-foreground flex-shrink-0 ${isRTL ? '' : 'rotate-180'}`}
                  />
                </div>
              </Link>
            )
          })}

          {hasMore && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              {t('overview.anchors.viewSidebar', {
                defaultValue: 'View all in sidebar',
              })}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
