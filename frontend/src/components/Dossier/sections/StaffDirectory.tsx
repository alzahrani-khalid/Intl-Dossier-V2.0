/**
 * Staff Directory Section
 *
 * Displays the elected official's key staff members for scheduling and contact.
 * Mobile-first design with RTL support.
 */

import { useTranslation } from 'react-i18next'
import { Users, Mail, Phone, Briefcase, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { ElectedOfficialDossier } from '@/lib/dossier-type-guards'

interface StaffDirectoryProps {
  dossier: ElectedOfficialDossier
}

export function StaffDirectory({ dossier }: StaffDirectoryProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'
  const { extension } = dossier

  const staffContacts = extension.staff_contacts || []

  // Get role label
  const getRoleLabel = (role: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      chief_of_staff: { en: 'Chief of Staff', ar: 'رئيس الموظفين' },
      scheduler: { en: 'Scheduler', ar: 'منسق المواعيد' },
      policy_advisor: { en: 'Policy Advisor', ar: 'مستشار سياسات' },
      press_secretary: { en: 'Press Secretary', ar: 'السكرتير الصحفي' },
      other: { en: 'Staff', ar: 'موظف' },
    }
    return labels[role]?.[isRTL ? 'ar' : 'en'] || role
  }

  // Get role variant for badge styling
  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'chief_of_staff':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'scheduler':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'policy_advisor':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'press_secretary':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (staffContacts.length === 0) {
    return (
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Users className="h-12 w-12 mb-3 opacity-50" />
            <p>{t('sections.electedOfficial.noStaffContacts')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0 space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="grid grid-cols-1 gap-3">
          {staffContacts.map((staff, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback className="text-sm">{getInitials(staff.name)}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="font-medium truncate">{staff.name}</span>
                  <Badge className={`text-xs w-fit ${getRoleVariant(staff.role)}`}>
                    {getRoleLabel(staff.role)}
                  </Badge>
                </div>

                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                  {staff.email && (
                    <a
                      href={`mailto:${staff.email}`}
                      className="flex items-center gap-2 hover:text-primary transition-colors"
                    >
                      <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{staff.email}</span>
                    </a>
                  )}
                  {staff.phone && (
                    <a
                      href={`tel:${staff.phone}`}
                      className="flex items-center gap-2 hover:text-primary transition-colors"
                    >
                      <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{staff.phone}</span>
                    </a>
                  )}
                </div>

                {staff.notes && (
                  <div className="flex items-start gap-2 pt-1">
                    <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{staff.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Briefcase className="h-4 w-4" />
            <span>{t('sections.electedOfficial.totalStaff', { count: staffContacts.length })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
