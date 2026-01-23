/**
 * Elected Official Dossier Page
 *
 * Wrapper page component for elected official dossiers.
 * Uses DossierDetailLayout with 2-column asymmetric grid [1fr_2fr].
 * Renders ElectedOfficialDossierDetail component.
 */

import type { ElectedOfficialDossier } from '@/lib/dossier-type-guards'
import { DossierDetailLayout } from '@/components/Dossier/DossierDetailLayout'
import { ElectedOfficialDossierDetail } from '@/components/Dossier/ElectedOfficialDossierDetail'

interface ElectedOfficialDossierPageProps {
  dossier: ElectedOfficialDossier
}

export function ElectedOfficialDossierPage({ dossier }: ElectedOfficialDossierPageProps) {
  return (
    <DossierDetailLayout dossier={dossier} gridClassName="lg:grid-cols-[1fr_2fr]">
      <ElectedOfficialDossierDetail dossier={dossier} />
    </DossierDetailLayout>
  )
}
