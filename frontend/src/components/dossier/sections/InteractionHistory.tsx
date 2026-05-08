/**
 * Interaction History Section (Feature 028 - User Story 4 - T039)
 * Displays engagement participation via usePerson hook.
 * Mobile-first layout with RTL support.
 */

import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { Calendar, MapPin, Plus, CheckCircle, XCircle, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { usePerson } from '@/hooks/usePersons'
import { ENGAGEMENT_ROLE_LABELS } from '@/types/person.types'
import type { PersonEngagementWithDetails, EngagementRole } from '@/types/person.types'
import { useDirection } from '@/hooks/useDirection'
import { getInteractionTypeBadgeClass } from '@/lib/semantic-colors'

interface InteractionHistoryProps {
  dossierId: string
}

export function InteractionHistory({ dossierId }: InteractionHistoryProps) {
  const { t } = useTranslation('dossier')
  const { isRTL } = useDirection()
const { data: personData, isLoading, isError } = usePerson(dossierId) as unknown as {
  data: { recent_engagements?: PersonEngagementWithDetails[] } | undefined
  isLoading: boolean
  isError: boolean
}

  // Get display value based on language
  const getDisplayValue = (en?: string, ar?: string) => {
    return isRTL ? ar || en : en || ar
  }

  // Get engagement role label
  const getEngagementRoleLabel = (role: EngagementRole): string => {
    const labels = ENGAGEMENT_ROLE_LABELS[role]
    return isRTL ? labels?.ar : labels?.en || role
  }

  // Get engagement type badge color
  const getEngagementTypeBadgeClassFn = (type: string): string => {
    return getInteractionTypeBadgeClass(type)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-1/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (isError || !personData) {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 sm:py-12 text-center"
      >
        <div className="mb-4 sm:mb-6">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <Calendar className="h-8 w-8 sm:h-10 sm:w-10 text-destructive" />
          </div>
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
          {t('sections.collapsible.error', 'Error loading data')}
        </h3>
      </div>
    )
  }

  const { recent_engagements } = personData
  const hasEngagements = recent_engagements && recent_engagements.length > 0

  if (!hasEngagements) {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 sm:py-12 text-center"
      >
        <div className="mb-4 sm:mb-6">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Calendar className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          </div>
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
          {t('sections.person.interactionHistoryEmpty', 'No engagements found')}
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-6 px-4">
          {t(
            'sections.person.interactionHistoryEmptyDescription',
            'Engagement participation will appear here',
          )}
        </p>
        <Button variant="outline" className="min-h-11">
          <Plus className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
          {t('sections.person.linkEngagement', 'Link Engagement')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with count and add button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {recent_engagements.length}{' '}
          {t('sections.person.engagementsCount', {
            count: recent_engagements.length,
            defaultValue: 'engagement(s)',
          })}
        </p>
        <Button variant="outline" size="sm" className="min-h-11 sm:min-h-9">
          <Plus className={`h-4 w-4 ${isRTL ? 'ms-1' : 'me-1'}`} />
          {t('sections.person.linkEngagement', 'Link Engagement')}
        </Button>
      </div>

      {/* Engagements list */}
      <div className="space-y-3">
        {recent_engagements.map((item: PersonEngagementWithDetails) => {
          const { link, engagement } = item
          const engagementName = getDisplayValue(engagement.name_en, engagement.name_ar)
          const location = getDisplayValue(engagement.location_en, engagement.location_ar)

          return (
            <Card key={link.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      link.attended ? 'bg-success/10' : 'bg-muted'
                    }`}
                  >
                    <Users
                      className={`h-5 w-5 ${
                        link.attended ? 'text-success' : 'text-muted-foreground'
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-sm sm:text-base">
                          <Link
                            to="/engagements/$engagementId"
                            params={{ engagementId: engagement.id } as any}
                            className="hover:underline text-primary"
                          >
                            {engagementName}
                          </Link>
                        </h4>

                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge
                            className={getEngagementTypeBadgeClassFn(engagement.engagement_type)}
                          >
                            {engagement.engagement_type}
                          </Badge>
                          {engagement.engagement_category && (
                            <Badge variant="outline">{engagement.engagement_category}</Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="secondary">{getEngagementRoleLabel(link.role)}</Badge>
                        {link.attended ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {location && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <MapPin className="h-3 w-3" />
                        <span>{location}</span>
                      </div>
                    )}

                    {link.notes && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {link.notes}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
