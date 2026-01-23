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
        className="flex flex-col items-center justify-center py-8 text-center sm:py-12"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="mb-4 rounded-full bg-muted p-4 sm:p-6">
          <FileText className="size-8 text-muted-foreground sm:size-10" />
        </div>
        <h3 className="mb-2 text-sm font-medium text-muted-foreground sm:text-base">
          No Decision Logs
        </h3>
        <p className="max-w-md text-xs text-muted-foreground sm:text-sm">
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
          className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
        >
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <h4 className="mb-2 text-sm font-medium">{decision.title}</h4>
              <p className="mb-2 text-xs text-muted-foreground">
                {decision.description}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="size-3" />
                <span>{decision.date}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
