/**
 * Person Dossier Page (Feature 028 - User Story 4 - T034)
 *
 * Wrapper page component for person dossiers.
 * Uses DossierDetailLayout with 2-column asymmetric grid [1fr_2fr].
 * Renders PersonDossierDetail component.
 */

import type { PersonDossier } from '@/lib/dossier-type-guards';
import { DossierDetailLayout } from '@/components/Dossier/DossierDetailLayout';
import { PersonDossierDetail } from '@/components/Dossier/PersonDossierDetail';

interface PersonDossierPageProps {
  dossier: PersonDossier;
}

export function PersonDossierPage({ dossier }: PersonDossierPageProps) {
  return (
    <DossierDetailLayout
      dossier={dossier}
      gridClassName="lg:grid-cols-[1fr_2fr]"
    >
      <PersonDossierDetail dossier={dossier} />
    </DossierDetailLayout>
  );
}
