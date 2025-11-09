/**
 * Follow-Up Actions Section (Feature 028 - User Story 3 - T032)
 *
 * Displays tasks and next steps from engagement.
 * Future: Integration with tasks/assignments system.
 * Mobile-first layout with RTL support.
 */

import { useTranslation } from 'react-i18next';
import { ListTodo, CheckSquare } from 'lucide-react';

interface FollowUpActionsProps {
  dossierId: string;
}

export function FollowUpActions({ dossierId }: FollowUpActionsProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';

  // TODO: Fetch follow-up tasks/actions from assignments table
  // WHERE entity_type = 'engagement' AND entity_id = dossierId
  // For now, show empty state placeholder

  return (
    <div
      className="flex flex-col items-center justify-center py-8 sm:py-12 text-center"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="mb-4 sm:mb-6">
        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center">
          <ListTodo className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
        </div>
      </div>

      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
        {t('sections.engagement.followUpActionsEmpty')}
      </h3>

      <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-6 px-4">
        {t('sections.engagement.followUpActionsEmptyDescription')}
      </p>

      <div className="text-xs sm:text-sm text-muted-foreground px-4">
        <p>{t('sections.engagement.followUpActionsPlaceholder')}</p>
      </div>
    </div>
  );
}
