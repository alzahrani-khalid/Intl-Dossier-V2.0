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
        className="flex flex-col items-center justify-center py-8 sm:py-12 text-center"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="rounded-full bg-muted p-4 sm:p-6 mb-4">
          <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
        </div>
        <h3 className="text-sm sm:text-base font-medium text-muted-foreground mb-2">
          No Active MoUs
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
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
          className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium mb-1 truncate">{mou.title}</h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Expires: {mou.expiry_date}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
