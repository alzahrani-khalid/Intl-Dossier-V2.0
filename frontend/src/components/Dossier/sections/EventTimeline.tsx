/**
 * Event Timeline Section (Feature 028 - User Story 3 - T029)
 *
 * Displays chronological sequence of events for engagement.
 * Future: Integration with calendar_entries table.
 * Mobile-first layout with RTL support.
 */

import { useTranslation } from 'react-i18next';
import { Clock, Calendar } from 'lucide-react';

interface EventTimelineProps {
  dossierId: string;
}

export function EventTimeline({ dossierId }: EventTimelineProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';

  // TODO: Fetch calendar entries from calendar_entries table
  // WHERE entity_type = 'engagement' AND entity_id = dossierId
  // For now, show empty state placeholder

  return (
    <div
      className="flex flex-col items-center justify-center py-8 sm:py-12 text-center"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="mb-4 sm:mb-6">
        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Clock className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
        </div>
      </div>

      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
        {t('sections.engagement.eventTimelineEmpty')}
      </h3>

      <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-6 px-4">
        {t('sections.engagement.eventTimelineEmptyDescription')}
      </p>

      <div className="text-xs sm:text-sm text-muted-foreground px-4">
        <p>{t('sections.engagement.eventTimelinePlaceholder')}</p>
      </div>
    </div>
  );
}
