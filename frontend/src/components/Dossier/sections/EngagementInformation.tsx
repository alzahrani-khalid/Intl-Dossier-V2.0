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
        <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-medium mb-1">
            {t('sections.engagement.date')}
          </p>
          <p className="text-sm sm:text-base text-muted-foreground">
            {format(new Date(dossier.created_at), 'PPP', { locale })}
          </p>
        </div>
      </div>

      {/* Location */}
      {location && (
        <div className="flex items-start gap-3 sm:gap-4">
          <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base font-medium mb-1">
              {t('sections.engagement.location')}
            </p>
            <p className="text-sm sm:text-base text-muted-foreground">
              {location}
            </p>
          </div>
        </div>
      )}

      {/* Description */}
      {(isRTL ? dossier.description_ar : dossier.description_en) && (
        <div className="flex items-start gap-3 sm:gap-4">
          <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base font-medium mb-1">
              {t('sections.engagement.description')}
            </p>
            <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-wrap">
              {isRTL ? dossier.description_ar : dossier.description_en}
            </p>
          </div>
        </div>
      )}

      {/* Created By */}
      <div className="flex items-start gap-3 sm:gap-4">
        <Users className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-medium mb-1">
            {t('sections.engagement.createdBy')}
          </p>
          <p className="text-sm sm:text-base text-muted-foreground">
            {format(new Date(dossier.created_at), 'PPp', { locale })}
          </p>
        </div>
      </div>
    </div>
  );
}
