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
      className="flex flex-col items-center justify-center py-8 text-center sm:py-12"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="mb-4 sm:mb-6">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 sm:size-20">
          <Building2 className="size-8 text-primary sm:size-10" />
        </div>
      </div>
      <h3 className="mb-2 text-base font-semibold text-foreground sm:text-lg">
        {t('sections.person.organizationAffiliationsEmpty')}
      </h3>
      <p className="mb-6 max-w-md px-4 text-sm text-muted-foreground sm:text-base">
        {t('sections.person.organizationAffiliationsEmptyDescription')}
      </p>
      <div className="px-4 text-xs text-muted-foreground sm:text-sm">
        <p>{t('sections.person.organizationAffiliationsPlaceholder')}</p>
      </div>
    </div>
  );
}
