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
      className="flex flex-col items-center justify-center py-8 text-center sm:py-12"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="mb-4 sm:mb-6">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 sm:size-20">
          <ListTodo className="size-8 text-primary sm:size-10" />
        </div>
      </div>

      <h3 className="mb-2 text-base font-semibold text-foreground sm:text-lg">
        {t('sections.engagement.followUpActionsEmpty')}
      </h3>

      <p className="mb-6 max-w-md px-4 text-sm text-muted-foreground sm:text-base">
        {t('sections.engagement.followUpActionsEmptyDescription')}
      </p>

      <div className="px-4 text-xs text-muted-foreground sm:text-sm">
        <p>{t('sections.engagement.followUpActionsPlaceholder')}</p>
      </div>
    </div>
  );
}
