/**
 * DecisionLogs Section Component
 *
 * Displays forum/working group meeting outcomes from engagement dossiers
 * linked to forum. List view with dates, mobile-first, RTL text alignment.
 *
 * Wired to real data via useRelationshipsForDossier, filtering for engagement relationships.
 */

import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { FileText, Calendar, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useRelationshipsForDossier } from '@/hooks/useRelationships'
import { getDossierRouteSegment } from '@/lib/dossier-routes'
import type { ForumDossier, WorkingGroupDossier } from '@/lib/dossier-type-guards'
import type { RelationshipWithDossiers } from '@/services/relationship-api'
import { useDirection } from '@/hooks/useDirection'

interface DecisionLogsProps {
  dossier: ForumDossier | WorkingGroupDossier
  isWorkingGroup?: boolean
}

export function DecisionLogs({ dossier }: DecisionLogsProps) {
  const { t } = useTranslation('dossier')
  const { isRTL } = useDirection()
const { data, isLoading } = useRelationshipsForDossier(dossier.id) as unknown as {
  data: { data: RelationshipWithDossiers[] } | undefined
  isLoading: boolean
}
  const allRelationships = data?.data || []

  // Filter for engagement-type related dossiers
  const engagementRelationships = allRelationships.filter((rel: RelationshipWithDossiers) => {
    const related = rel.source_dossier_id === dossier.id ? rel.target_dossier : rel.source_dossier
    return related?.type === 'engagement'
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (engagementRelationships.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 sm:py-12 text-center"
      >
        <div className="rounded-full bg-muted p-4 sm:p-6 mb-4">
          <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
        </div>
        <h3 className="text-sm sm:text-base font-medium text-muted-foreground mb-2">
          {t('sections.decisionLogs.empty', 'No Decision Logs')}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
          {t(
            'sections.decisionLogs.emptyDescription',
            'Formal decisions and resolutions from linked engagements will appear here.',
          )}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {engagementRelationships.map((rel: RelationshipWithDossiers) => {
        const engagement =
          rel.source_dossier_id === dossier.id ? rel.target_dossier : rel.source_dossier
        if (!engagement) return null

        const displayName = isRTL ? engagement.name_ar : engagement.name_en
        const routeSegment = getDossierRouteSegment(engagement.type)

        return (
          <Link
            key={rel.id}
            to={`/dossiers/${routeSegment}/${engagement.id}`}
            className="block p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium mb-1">{displayName}</h4>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-xs capitalize">
                    {rel.relationship_type.replace(/_/g, ' ')}
                  </Badge>
                  {rel.effective_from && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(rel.effective_from).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                      </span>
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {t('sections.decisionLogs.fromEngagement', 'From engagement')}
                  </span>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </Link>
        )
      })}
    </div>
  )
}
