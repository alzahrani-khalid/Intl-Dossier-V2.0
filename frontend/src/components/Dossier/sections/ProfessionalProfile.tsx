/**
 * Professional Profile Section (Feature 028 - User Story 4 - T036)
 * Displays biography, photo, title, education for person.
 * Mobile-first layout with RTL support.
 */

import { useTranslation } from 'react-i18next';
import { User, Briefcase, GraduationCap } from 'lucide-react';
import type { PersonDossier } from '@/lib/dossier-type-guards';

interface ProfessionalProfileProps {
  dossier: PersonDossier;
}

export function ProfessionalProfile({ dossier }: ProfessionalProfileProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';

  const extension = dossier.extension;
  const title = isRTL ? extension.title_ar : extension.title_en;
  const biography = isRTL ? extension.biography_ar : extension.biography_en;
  const photoUrl = extension.photo_url;

  return (
    <div className="space-y-4 sm:space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Photo */}
      {photoUrl && (
        <div className="flex justify-center">
          <img
            src={photoUrl}
            alt={isRTL ? dossier.name_ar : dossier.name_en}
            className="h-32 w-32 sm:h-40 sm:w-40 rounded-full object-cover border-4 border-primary/10"
          />
        </div>
      )}

      {/* Title */}
      {title && (
        <div className="p-3 sm:p-4 rounded-lg border bg-card">
          <div className="flex items-start gap-3">
            <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                {t('form.person.titleEn')}
              </p>
              <p className="text-sm sm:text-base font-semibold">{title}</p>
            </div>
          </div>
        </div>
      )}

      {/* Biography */}
      {biography && (
        <div className="p-3 sm:p-4 rounded-lg border bg-card">
          <h4 className="text-sm sm:text-base font-semibold mb-2">
            {t('form.person.biographyEn')}
          </h4>
          <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-wrap">
            {biography}
          </p>
        </div>
      )}
    </div>
  );
}
