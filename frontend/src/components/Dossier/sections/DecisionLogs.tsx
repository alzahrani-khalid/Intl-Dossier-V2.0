/**
 * DecisionLogs Section Component
 *
 * Displays forum/working group meeting outcomes from engagement dossiers
 * linked to forum. List view with dates, mobile-first, RTL text alignment.
 *
 * Future: Will fetch actual engagement dossiers and outcomes from API.
 */

import { useTranslation } from 'react-i18next';
import { FileText, Calendar } from 'lucide-react';
import type { ForumDossier, WorkingGroupDossier } from '@/lib/dossier-type-guards';

interface DecisionLogsProps {
  dossier: ForumDossier | WorkingGroupDossier;
  isWorkingGroup?: boolean;
}

export function DecisionLogs({
  dossier,
  isWorkingGroup = false,
}: DecisionLogsProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';

  // Placeholder - will fetch from engagement dossiers linked to forum in future
  const decisions: any[] = [];

  if (decisions.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 sm:py-12 text-center"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="rounded-full bg-muted p-4 sm:p-6 mb-4">
          <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
        </div>
        <h3 className="text-sm sm:text-base font-medium text-muted-foreground mb-2">
          No Decision Logs
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
          Formal decisions and resolutions from meetings will appear here.
          Engagement dossiers integration pending.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3" dir={isRTL ? 'rtl' : 'ltr'}>
      {decisions.map((decision) => (
        <div
          key={decision.id}
          className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium mb-2">{decision.title}</h4>
              <p className="text-xs text-muted-foreground mb-2">
                {decision.description}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{decision.date}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
