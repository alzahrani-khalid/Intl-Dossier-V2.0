/**
 * Organization Affiliations Section (Feature 028 - User Story 4 - T038)
 * Displays org dossiers linked via dossier_relationships.
 * Mobile-first layout with RTL support.
 */

import { useTranslation } from 'react-i18next';
import { Building2 } from 'lucide-react';

interface OrganizationAffiliationsProps {
  dossierId: string;
}

export function OrganizationAffiliations({ dossierId }: OrganizationAffiliationsProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';

  // TODO: Fetch org dossiers from dossier_relationships

  return (
    <div
      className="flex flex-col items-center justify-center py-8 sm:py-12 text-center"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="mb-4 sm:mb-6">
        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
        </div>
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
        {t('sections.person.organizationAffiliationsEmpty')}
      </h3>
      <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-6 px-4">
        {t('sections.person.organizationAffiliationsEmptyDescription')}
      </p>
      <div className="text-xs sm:text-sm text-muted-foreground px-4">
        <p>{t('sections.person.organizationAffiliationsPlaceholder')}</p>
      </div>
    </div>
  );
}
