/**
 * Committee Assignments Section
 *
 * Displays the elected official's committee assignments with role and status.
 * Mobile-first design with RTL support.
 */

import { useTranslation } from 'react-i18next'
import { Users, Crown, UserCheck, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ElectedOfficialDossier } from '@/lib/dossier-type-guards'

interface CommitteeAssignmentsProps {
  dossier: ElectedOfficialDossier
}

export function CommitteeAssignments({ dossier }: CommitteeAssignmentsProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'
  const { extension } = dossier

  const committees = extension.committee_assignments || []

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'chair':
        return <Crown className="size-4 text-yellow-500" />
      case 'vice_chair':
        return <UserCheck className="size-4 text-blue-500" />
      default:
        return <User className="size-4 text-gray-500" />
    }
  }

  // Get role label
  const getRoleLabel = (role: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      chair: { en: 'Chair', ar: 'رئيس' },
      vice_chair: { en: 'Vice Chair', ar: 'نائب الرئيس' },
      member: { en: 'Member', ar: 'عضو' },
    }
    return labels[role]?.[isRTL ? 'ar' : 'en'] || role
  }

  if (committees.length === 0) {
    return (
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Users className="mb-3 size-12 opacity-50" />
            <p>{t('sections.electedOfficial.noCommittees')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Separate active and inactive committees
  const activeCommittees = committees.filter((c) => c.is_active)
  const inactiveCommittees = committees.filter((c) => !c.is_active)

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="space-y-4 p-0">
        {/* Active Committees */}
        {activeCommittees.length > 0 && (
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="size-2 rounded-full bg-green-500"></span>
              {t('sections.electedOfficial.activeCommittees')}
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {activeCommittees.map((committee, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted"
                  dir={isRTL ? 'rtl' : 'ltr'}
                >
                  {getRoleIcon(committee.role)}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {isRTL ? committee.name_ar || committee.name_en : committee.name_en}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {getRoleLabel(committee.role)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inactive Committees */}
        {inactiveCommittees.length > 0 && (
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="size-2 rounded-full bg-gray-400"></span>
              {t('sections.electedOfficial.pastCommittees')}
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {inactiveCommittees.map((committee, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-lg bg-muted/30 p-3 opacity-70"
                  dir={isRTL ? 'rtl' : 'ltr'}
                >
                  {getRoleIcon(committee.role)}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-muted-foreground">
                      {isRTL ? committee.name_ar || committee.name_en : committee.name_en}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs opacity-70">
                        {getRoleLabel(committee.role)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="border-t pt-2">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="size-4" />
              <span>
                {t('sections.electedOfficial.totalCommittees', { count: committees.length })}
              </span>
            </div>
            {activeCommittees.some((c) => c.role === 'chair') && (
              <div className="flex items-center gap-2">
                <Crown className="size-4 text-yellow-500" />
                <span>
                  {t('sections.electedOfficial.chairPositions', {
                    count: activeCommittees.filter((c) => c.role === 'chair').length,
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
