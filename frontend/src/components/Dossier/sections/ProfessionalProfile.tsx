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
            className="size-32 rounded-full border-4 border-primary/10 object-cover sm:size-40"
          />
        </div>
      )}

      {/* Title */}
      {title && (
        <div className="rounded-lg border bg-card p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <Briefcase className="mt-0.5 size-4 text-primary sm:size-5" />
            <div>
              <p className="text-xs font-medium text-muted-foreground sm:text-sm">
                {t('form.person.titleEn')}
              </p>
              <p className="text-sm font-semibold sm:text-base">{title}</p>
            </div>
          </div>
        </div>
      )}

      {/* Biography */}
      {biography && (
        <div className="rounded-lg border bg-card p-3 sm:p-4">
          <h4 className="mb-2 text-sm font-semibold sm:text-base">
            {t('form.person.biographyEn')}
          </h4>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground sm:text-base">
            {biography}
          </p>
        </div>
      )}
    </div>
  );
}
