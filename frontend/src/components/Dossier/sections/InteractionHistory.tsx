/**
 * Interaction History Section (Feature 028 - User Story 4 - T039)
 * Displays engagement dossiers and calendar entries.
 * Mobile-first layout with RTL support.
 */

import { useTranslation } from 'react-i18next';
import { Calendar, MessageSquare } from 'lucide-react';

interface InteractionHistoryProps {
  dossierId: string;
}

export function InteractionHistory({ dossierId }: InteractionHistoryProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';

  // TODO: Fetch engagement dossiers + calendar entries

  return (
    <div
      className="flex flex-col items-center justify-center py-8 sm:py-12 text-center"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="mb-4 sm:mb-6">
        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center">
          <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
        </div>
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
        {t('sections.person.interactionHistoryEmpty')}
      </h3>
      <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-6 px-4">
        {t('sections.person.interactionHistoryEmptyDescription')}
      </p>
      <div className="text-xs sm:text-sm text-muted-foreground px-4">
        <p>{t('sections.person.interactionHistoryPlaceholder')}</p>
      </div>
    </div>
  );
}
