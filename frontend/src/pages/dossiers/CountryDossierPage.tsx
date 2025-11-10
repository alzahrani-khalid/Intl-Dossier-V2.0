/**
 * Country Dossier Page (Feature 028 - User Story 1 - T019)
 *
 * Wrapper page for country dossier detail view.
 * Uses DossierDetailLayout with country-specific grid configuration.
 * Mobile-first, RTL-compatible, WCAG AA compliant.
 */

import { DossierDetailLayout } from '@/components/Dossier/DossierDetailLayout';
import { CountryDossierDetail } from '@/components/Dossier/CountryDossierDetail';
import type { CountryDossier } from '@/lib/dossier-type-guards';

interface CountryDossierPageProps {
  dossier: CountryDossier;
  initialTab?: string;
}

export function CountryDossierPage({ dossier, initialTab }: CountryDossierPageProps) {
  return (
    <DossierDetailLayout
      dossier={dossier}
      gridClassName="grid-cols-1"
    >
      <CountryDossierDetail dossier={dossier} initialTab={initialTab} />
    </DossierDetailLayout>
  );
}
