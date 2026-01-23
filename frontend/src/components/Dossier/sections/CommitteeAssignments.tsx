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
        return <Crown className="h-4 w-4 text-yellow-500" />
      case 'vice_chair':
        return <UserCheck className="h-4 w-4 text-blue-500" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
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
            <Users className="h-12 w-12 mb-3 opacity-50" />
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
      <CardContent className="p-0 space-y-4">
        {/* Active Committees */}
        {activeCommittees.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              {t('sections.electedOfficial.activeCommittees')}
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {activeCommittees.map((committee, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  dir={isRTL ? 'rtl' : 'ltr'}
                >
                  {getRoleIcon(committee.role)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {isRTL ? committee.name_ar || committee.name_en : committee.name_en}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
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
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-gray-400"></span>
              {t('sections.electedOfficial.pastCommittees')}
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {inactiveCommittees.map((committee, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 opacity-70"
                  dir={isRTL ? 'rtl' : 'ltr'}
                >
                  {getRoleIcon(committee.role)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-muted-foreground">
                      {isRTL ? committee.name_ar || committee.name_en : committee.name_en}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
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
        <div className="pt-2 border-t">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>
                {t('sections.electedOfficial.totalCommittees', { count: committees.length })}
              </span>
            </div>
            {activeCommittees.some((c) => c.role === 'chair') && (
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-500" />
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
