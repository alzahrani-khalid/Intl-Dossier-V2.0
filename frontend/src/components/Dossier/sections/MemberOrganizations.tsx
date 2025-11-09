/**
 * MemberOrganizations Section Component
 *
 * Displays forum/working group member organizations from extension.member_organizations array
 * (Forum) or extension.members array (Working Group) with dossier links.
 * Card grid layout, mobile-first responsive, RTL support.
 *
 * Future: Will fetch actual organization dossiers from dossier_relationships table.
 */

import { useTranslation } from 'react-i18next';
import { Building2, Users } from 'lucide-react';
import type { ForumDossier, WorkingGroupDossier } from '@/lib/dossier-type-guards';

interface MemberOrganizationsProps {
  dossier: ForumDossier | WorkingGroupDossier;
  isWorkingGroup?: boolean;
}

export function MemberOrganizations({
  dossier,
  isWorkingGroup = false,
}: MemberOrganizationsProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';

  // Extract member organizations based on type
  const members =
    dossier.type === 'forum'
      ? dossier.extension.member_organizations || []
      : dossier.type === 'working_group'
      ? dossier.extension.members || []
      : [];

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
          No Member Organizations
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
          Member organizations will appear here. Integration with organization dossiers pending.
        </p>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {members.map((member, index) => {
        // Working group members have role info
        const memberId = typeof member === 'string' ? member : member.dossier_id;
        const memberRole =
          typeof member === 'object' && 'role' in member ? member.role : undefined;

        return (
          <div
            key={memberId || index}
            className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <Building2 className="h-10 w-10 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium mb-1 truncate">
                  Organization {index + 1}
                </h4>
                <p className="text-xs text-muted-foreground truncate">
                  ID: {memberId}
                </p>
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
        );
      })}
    </div>
  );
}
