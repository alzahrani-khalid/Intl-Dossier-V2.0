/**
 * Participants List Section (Feature 028 - User Story 3 - T030)
 *
 * Displays attendees and their roles for engagement.
 * Future: Integration with person dossiers via dossier_relationships.
 * Mobile-first layout with RTL support.
 */

import { useTranslation } from 'react-i18next';
import { Users, User } from 'lucide-react';

interface ParticipantsListProps {
  dossierId: string;
}

export function ParticipantsList({ dossierId }: ParticipantsListProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';

  // TODO: Fetch person dossiers linked to this engagement
  // FROM dossier_relationships WHERE relationship_type = 'engagement_participant'
  // For now, show empty state placeholder

  return (
    <div
      className="flex flex-col items-center justify-center py-8 text-center sm:py-12"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="mb-4 sm:mb-6">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 sm:size-20">
          <Users className="size-8 text-primary sm:size-10" />
        </div>
      </div>

      <h3 className="mb-2 text-base font-semibold text-foreground sm:text-lg">
        {t('sections.engagement.participantsListEmpty')}
      </h3>

      <p className="mb-6 max-w-md px-4 text-sm text-muted-foreground sm:text-base">
        {t('sections.engagement.participantsListEmptyDescription')}
      </p>

      <div className="px-4 text-xs text-muted-foreground sm:text-sm">
        <p>{t('sections.engagement.participantsListPlaceholder')}</p>
      </div>
    </div>
  );
}
