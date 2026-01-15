/**
 * MemberOrganizations Section Component
 *
 * Displays forum/working group member organizations from extension.member_organizations array
 * (Forum) or extension.members array (Working Group) with dossier links.
 * Card grid layout, mobile-first responsive, RTL support.
 *
 * For working groups with no members, displays AI-powered member suggestions.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Building2, Users, Sparkles, UserCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { WGMemberSuggestions } from '@/components/working-groups/WGMemberSuggestions'
import type { ForumDossier, WorkingGroupDossier } from '@/lib/dossier-type-guards'

interface MemberOrganizationsProps {
  dossier: ForumDossier | WorkingGroupDossier
  isWorkingGroup?: boolean
}

export function MemberOrganizations({ dossier, isWorkingGroup = false }: MemberOrganizationsProps) {
  const { t, i18n } = useTranslation(['dossier', 'working-groups'])
  const isRTL = i18n.language === 'ar'
  const [showSuggestions, setShowSuggestions] = useState(true)

  // Extract member organizations based on type
  const members =
    dossier.type === 'forum'
      ? dossier.extension.member_organizations || []
      : dossier.type === 'working_group'
        ? dossier.extension.members || []
        : []

  // For working groups with no members, show AI suggestions
  if (members.length === 0 && isWorkingGroup && showSuggestions) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'}>
        <WGMemberSuggestions
          workingGroupId={dossier.id}
          workingGroupName={isRTL ? dossier.name_ar : dossier.name_en}
          onClose={() => setShowSuggestions(false)}
          onMembersAdded={() => {
            // Refresh will happen via query invalidation
            setShowSuggestions(false)
          }}
        />
      </div>
    )
  }

  // Empty state without suggestions (for forums or after dismissing suggestions)
  if (members.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 sm:py-12 text-center"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="rounded-full bg-muted p-4 sm:p-6 mb-4">
          <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
        </div>
        <h3 className="text-sm sm:text-base font-medium text-muted-foreground mb-2">
          {isRTL ? 'لا يوجد أعضاء' : 'No Members Yet'}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mb-4">
          {isRTL
            ? 'سيظهر أعضاء المنظمات هنا بمجرد إضافتهم.'
            : 'Member organizations will appear here once added.'}
        </p>
        {isWorkingGroup && !showSuggestions && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSuggestions(true)}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {isRTL ? 'عرض الاقتراحات الذكية' : 'Show Smart Suggestions'}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {members.map((member, index) => {
        // Working group members have role info
        const memberId = typeof member === 'string' ? member : member.dossier_id
        const memberRole = typeof member === 'object' && 'role' in member ? member.role : undefined

        return (
          <div
            key={memberId || index}
            className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <Building2 className="h-10 w-10 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium mb-1 truncate">Organization {index + 1}</h4>
                <p className="text-xs text-muted-foreground truncate">ID: {memberId}</p>
                {memberRole && (
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5">
                    <span className="text-xs font-medium text-primary capitalize">
                      {memberRole}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
