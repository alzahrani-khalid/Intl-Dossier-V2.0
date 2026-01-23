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
      className="flex flex-col items-center justify-center py-8 text-center sm:py-12"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="mb-4 sm:mb-6">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 sm:size-20">
          <MessageSquare className="size-8 text-primary sm:size-10" />
        </div>
      </div>
      <h3 className="mb-2 text-base font-semibold text-foreground sm:text-lg">
        {t('sections.person.interactionHistoryEmpty')}
      </h3>
      <p className="mb-6 max-w-md px-4 text-sm text-muted-foreground sm:text-base">
        {t('sections.person.interactionHistoryEmptyDescription')}
      </p>
      <div className="px-4 text-xs text-muted-foreground sm:text-sm">
        <p>{t('sections.person.interactionHistoryPlaceholder')}</p>
      </div>
    </div>
  );
}
