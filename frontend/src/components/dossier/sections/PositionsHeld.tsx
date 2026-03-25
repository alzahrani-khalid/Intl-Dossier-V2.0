/**
 * Positions Held Section (Feature 028 - User Story 4 - T037)
 * Displays career history via usePerson hook.
 * Mobile-first layout with RTL support.
 */

import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { Briefcase, Building2, Calendar, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { usePerson } from '@/hooks/usePersons'
import type { PersonRole } from '@/types/person.types'
import { useDirection } from '@/hooks/useDirection'

interface PositionsHeldProps {
  dossierId: string
}

export function PositionsHeld({ dossierId }: PositionsHeldProps) {
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
      return `${start} - ${t('sections.person.present', 'Present')}`
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
            <Briefcase className="h-8 w-8 sm:h-10 sm:w-10 text-destructive" />
          </div>
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
          {t('sections.collapsible.error')}
        </h3>
      </div>
    )
  }

  const { current_role, roles } = personData
  const hasRoles = (roles && roles.length > 0) || current_role

  if (!hasRoles) {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 sm:py-12 text-center"
      >
        <div className="mb-4 sm:mb-6">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Briefcase className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          </div>
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
          {t('sections.person.positionsHeldEmpty', 'No positions found')}
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-6 px-4">
          {t('sections.person.positionsHeldEmptyDescription', 'Career history will appear here')}
        </p>
        <Button variant="outline" className="min-h-11">
          <Plus className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
          {t('sections.person.addRole', 'Add Role')}
        </Button>
      </div>
    )
  }

  // Render role card
  const RoleCard = ({ role, isCurrent }: { role: PersonRole; isCurrent?: boolean }) => {
    const roleTitle = getDisplayValue(role.role_title_en, role.role_title_ar)
    const orgName = getDisplayValue(role.organization_name_en, role.organization_name_ar)
    const department = getDisplayValue(role.department_en, role.department_ar)
    const description = getDisplayValue(role.description_en, role.description_ar)

    return (
      <Card className={isCurrent ? 'border-primary/50 bg-primary/5' : ''}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                isCurrent ? 'bg-primary/20' : 'bg-muted'
              }`}
            >
              <Briefcase
                className={`h-5 w-5 ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-sm sm:text-base">{roleTitle}</h4>
                  {orgName && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                      <Building2 className="h-3.5 w-3.5" />
                      {role.organization_id ? (
                        <Link
                          to="/dossiers/organizations/$id"
                          params={{ id: role.organization_id } as any}
                          className="hover:underline text-primary"
                        >
                          {orgName}
                        </Link>
                      ) : (
                        <span>{orgName}</span>
                      )}
                    </div>
                  )}
                </div>

                {isCurrent && (
                  <Badge className="bg-green-500 text-white flex-shrink-0">
                    {t('sections.person.currentPosition', 'Current')}
                  </Badge>
                )}
              </div>

              {department && <p className="text-sm text-muted-foreground mt-1">{department}</p>}

              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                <Calendar className="h-3 w-3" />
                <span>{formatDateRange(role.start_date, role.end_date)}</span>
              </div>

              {description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{description}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Combine and sort roles (current first, then by start date descending)
  const allRoles = [...(roles || [])]
  if (current_role && !allRoles.find((r) => r.id === current_role.id)) {
    allRoles.unshift(current_role)
  }

  // Sort by is_current first, then by start_date descending
  const sortedRoles = allRoles.sort((a, b) => {
    if (a.is_current && !b.is_current) return -1
    if (!a.is_current && b.is_current) return 1
    const dateA = a.start_date ? new Date(a.start_date).getTime() : 0
    const dateB = b.start_date ? new Date(b.start_date).getTime() : 0
    return dateB - dateA
  })

  return (
    <div className="space-y-4">
      {/* Header with count and add button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {sortedRoles.length}{' '}
          {t('sections.person.rolesCount', { count: sortedRoles.length, defaultValue: 'role(s)' })}
        </p>
        <Button variant="outline" size="sm" className="min-h-11 sm:min-h-9">
          <Plus className={`h-4 w-4 ${isRTL ? 'ms-1' : 'me-1'}`} />
          {t('sections.person.addRole', 'Add Role')}
        </Button>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line connector */}
        <div
          className={`absolute top-0 bottom-0 w-0.5 bg-border ${isRTL ? 'end-[1.125rem]' : 'start-[1.125rem]'}`}
        />

        <div className="space-y-4">
          {sortedRoles.map((role) => (
            <div key={role.id} className={`relative ${isRTL ? 'pe-12' : 'ps-12'}`}>
              {/* Timeline dot */}
              <div
                className={`absolute top-4 h-3 w-3 rounded-full border-2 bg-background ${
                  role.is_current ? 'border-primary' : 'border-muted-foreground'
                } ${isRTL ? 'end-[0.625rem]' : 'start-[0.625rem]'}`}
              />
              <RoleCard role={role} isCurrent={role.is_current} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
