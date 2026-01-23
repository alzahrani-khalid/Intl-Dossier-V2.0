/**
 * Engagement Information Section
 * Displays key engagement metadata: dates, location, description, created by
 * Mobile-first design with RTL support
 */

import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, FileText, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import type { EngagementDossier } from '@/lib/dossier-type-guards';

interface EngagementInformationProps {
  dossier: EngagementDossier;
}

export function EngagementInformation({ dossier }: EngagementInformationProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';
  const locale = isRTL ? ar : enUS;

  // Safe access to extension data
  const extension = dossier.extension as any;
  const location = isRTL
    ? extension?.location_ar || extension?.location
    : extension?.location_en || extension?.location;

  return (
    <div
      className="space-y-4 sm:space-y-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Engagement Date */}
      <div className="flex items-start gap-3 sm:gap-4">
        <Calendar className="mt-0.5 size-5 shrink-0 text-muted-foreground sm:size-6" />
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-sm font-medium sm:text-base">
            {t('sections.engagement.date')}
          </p>
          <p className="text-sm text-muted-foreground sm:text-base">
            {format(new Date(dossier.created_at), 'PPP', { locale })}
          </p>
        </div>
      </div>

      {/* Location */}
      {location && (
        <div className="flex items-start gap-3 sm:gap-4">
          <MapPin className="mt-0.5 size-5 shrink-0 text-muted-foreground sm:size-6" />
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-sm font-medium sm:text-base">
              {t('sections.engagement.location')}
            </p>
            <p className="text-sm text-muted-foreground sm:text-base">
              {location}
            </p>
          </div>
        </div>
      )}

      {/* Description */}
      {(isRTL ? dossier.description_ar : dossier.description_en) && (
        <div className="flex items-start gap-3 sm:gap-4">
          <FileText className="mt-0.5 size-5 shrink-0 text-muted-foreground sm:size-6" />
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-sm font-medium sm:text-base">
              {t('sections.engagement.description')}
            </p>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground sm:text-base">
              {isRTL ? dossier.description_ar : dossier.description_en}
            </p>
          </div>
        </div>
      )}

      {/* Created By */}
      <div className="flex items-start gap-3 sm:gap-4">
        <Users className="mt-0.5 size-5 shrink-0 text-muted-foreground sm:size-6" />
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-sm font-medium sm:text-base">
            {t('sections.engagement.createdBy')}
          </p>
          <p className="text-sm text-muted-foreground sm:text-base">
            {format(new Date(dossier.created_at), 'PPp', { locale })}
          </p>
        </div>
      </div>
    </div>
  );
}
