/**
 * ActiveMoUs Section Component
 *
 * Displays MoUs from mous table where organization is a signatory.
 * List view with expiry dates, mobile-first responsive, RTL support.
 *
 * Future: Will fetch actual MoUs from API (Polish Phase).
 */

import { useTranslation } from 'react-i18next';
import { FileText, Calendar } from 'lucide-react';
import type { OrganizationDossier } from '@/lib/dossier-type-guards';

interface ActiveMoUsProps {
  dossier: OrganizationDossier;
}

export function ActiveMoUs({ dossier }: ActiveMoUsProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';

  // Placeholder - will fetch from mous table in future
  const mous: any[] = [];

  if (mous.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 text-center sm:py-12"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="mb-4 rounded-full bg-muted p-4 sm:p-6">
          <FileText className="size-8 text-muted-foreground sm:size-10" />
        </div>
        <h3 className="mb-2 text-sm font-medium text-muted-foreground sm:text-base">
          No Active MoUs
        </h3>
        <p className="max-w-md text-xs text-muted-foreground sm:text-sm">
          MoUs table integration pending. Active memorandums will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3" dir={isRTL ? 'rtl' : 'ltr'}>
      {mous.map((mou) => (
        <div
          key={mou.id}
          className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
        >
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <h4 className="mb-1 truncate text-sm font-medium">{mou.title}</h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="size-3" />
                <span>Expires: {mou.expiry_date}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
