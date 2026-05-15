/**
 * Organization Affiliations Section (Feature 028 - User Story 4 - T038)
 * Displays organization memberships via usePerson hook.
 * Mobile-first layout with RTL support.
 */

import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { Building2, Calendar, Plus, CheckCircle, Circle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { usePerson } from '@/hooks/usePersons'
import { AFFILIATION_TYPE_LABELS } from '@/types/person.types'
import type { AffiliationType } from '@/types/person.types'
import { useDirection } from '@/hooks/useDirection'

interface OrganizationAffiliationsProps {
  dossierId: string
}

export function OrganizationAffiliations({ dossierId }: OrganizationAffiliationsProps) {
  const { t } = useTranslation('dossier')
  const { isRTL } = useDirection()
  const { data: personData, isLoading, isError } = usePerson(dossierId)

  // Format date range
  const formatDateRange = (startDate?: string, endDate?: string): string => {
    if (!startDate) return ''

    const start = new Date(startDate).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
    })

    if (!endDate) {
      return `${t('sections.person.since', 'Since')} ${start}`
    }

    const end = new Date(endDate).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
    })

    return `${start} - ${end}`
  }

  // Get display value based on language
  const getDisplayValue = (en?: string, ar?: string) => {
    return isRTL ? ar || en : en || ar
  }

  // Get affiliation type label
  const getAffiliationTypeLabel = (type: AffiliationType): string => {
    const labels = AFFILIATION_TYPE_LABELS[type]
    return isRTL ? labels?.ar : labels?.en || type
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
      <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
        <div className="mb-4 sm:mb-6">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-destructive" />
          </div>
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
          {t('sections.collapsible.error')}
        </h3>
      </div>
    )
  }

  const { affiliations } = personData
  const hasAffiliations = affiliations && affiliations.length > 0

  if (!hasAffiliations) {
    return (
      <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
        <div className="mb-4 sm:mb-6">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          </div>
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
          {t('sections.person.organizationAffiliationsEmpty', 'No affiliations found')}
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-6 px-4">
          {t(
            'sections.person.organizationAffiliationsEmptyDescription',
            'Associated organizations will appear here',
          )}
        </p>
        <Button variant="outline" className="min-h-11">
          <Plus className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
          {t('sections.person.addAffiliation', 'Add Affiliation')}
        </Button>
      </div>
    )
  }

  // Sort: active first, then by start_date descending
  const sortedAffiliations = [...affiliations].sort((a, b) => {
    if (a.is_active && !b.is_active) return -1
    if (!a.is_active && b.is_active) return 1
    const dateA = a.start_date ? new Date(a.start_date).getTime() : 0
    const dateB = b.start_date ? new Date(b.start_date).getTime() : 0
    return dateB - dateA
  })

  return (
    <div className="space-y-4">
      {/* Header with count and add button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {affiliations.length}{' '}
          {t('sections.person.affiliationsCount', {
            count: affiliations.length,
            defaultValue: 'affiliation(s)',
          })}
        </p>
        <Button variant="outline" size="sm" className="min-h-11 sm:min-h-9">
          <Plus className={`h-4 w-4 ${isRTL ? 'ms-1' : 'me-1'}`} />
          {t('sections.person.addAffiliation', 'Add Affiliation')}
        </Button>
      </div>

      {/* Affiliations list */}
      <div className="space-y-3">
        {sortedAffiliations.map((affiliation) => {
          const orgName = getDisplayValue(
            affiliation.organization_name_en,
            affiliation.organization_name_ar,
          )
          const positionTitle = getDisplayValue(
            affiliation.position_title_en,
            affiliation.position_title_ar,
          )

          return (
            <Card
              key={affiliation.id}
              className={affiliation.is_active ? 'border-primary/30 bg-primary/5' : ''}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      affiliation.is_active ? 'bg-primary/20' : 'bg-muted'
                    }`}
                  >
                    <Building2
                      className={`h-5 w-5 ${
                        affiliation.is_active ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {orgName && (
                          <h4 className="font-semibold text-sm sm:text-base">
                            {affiliation.organization_id ? (
                              <Link
                                to="/dossiers/organizations/$id"
                                params={{ id: affiliation.organization_id } as any}
                                className="hover:underline text-primary"
                              >
                                {orgName}
                              </Link>
                            ) : (
                              orgName
                            )}
                          </h4>
                        )}
                        {positionTitle && (
                          <p className="text-sm text-muted-foreground">{positionTitle}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline">
                          {getAffiliationTypeLabel(affiliation.affiliation_type)}
                        </Badge>
                        {affiliation.is_active ? (
                          // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#OrganizationAffiliations
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {(affiliation.start_date || affiliation.end_date) && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDateRange(affiliation.start_date, affiliation.end_date)}</span>
                      </div>
                    )}

                    {affiliation.notes && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {affiliation.notes}
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
