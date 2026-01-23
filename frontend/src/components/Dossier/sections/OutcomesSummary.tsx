/**
 * Outcomes Summary Section (Feature 028 - User Story 3 - T031)
 *
 * Displays key decisions and results from engagement.
 * Future: Integration with decisions tracking system.
 * Mobile-first layout with RTL support.
 */

import { useTranslation } from 'react-i18next';
import { CheckCircle2, FileCheck } from 'lucide-react';

interface OutcomesSummaryProps {
  dossierId: string;
}

export function OutcomesSummary({ dossierId }: OutcomesSummaryProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';

  // TODO: Fetch outcomes/decisions from related tables
  // Future integration with decisions tracking
  // For now, show empty state placeholder

  return (
    <div
      className="flex flex-col items-center justify-center py-8 text-center sm:py-12"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="mb-4 sm:mb-6">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 sm:size-20">
          <CheckCircle2 className="size-8 text-primary sm:size-10" />
        </div>
      </div>

      <h3 className="mb-2 text-base font-semibold text-foreground sm:text-lg">
        {t('sections.engagement.outcomesSummaryEmpty')}
      </h3>

      <p className="mb-6 max-w-md px-4 text-sm text-muted-foreground sm:text-base">
        {t('sections.engagement.outcomesSummaryEmptyDescription')}
      </p>

      <div className="px-4 text-xs text-muted-foreground sm:text-sm">
        <p>{t('sections.engagement.outcomesSummaryPlaceholder')}</p>
      </div>
    </div>
  );
}
