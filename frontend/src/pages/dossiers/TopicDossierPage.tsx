/**
 * Topic Dossier Page (Feature 028 - Type-Specific Detail Pages)
 *
 * Wrapper page component for topic dossiers (policy areas, strategic priorities).
 * Uses DossierDetailLayout with single-column grid.
 * Renders TopicDossierDetail component.
 */

import { DossierDetailLayout } from '@/components/Dossier/DossierDetailLayout';
import { TopicDossierDetail } from '@/components/Dossier/TopicDossierDetail';
import type { DossierWithExtension } from '@/services/dossier-api';

interface TopicDossierPageProps {
  dossier: DossierWithExtension & { type: 'topic' };
}

export function TopicDossierPage({ dossier }: TopicDossierPageProps) {
  return (
    <DossierDetailLayout
      dossier={dossier}
      gridClassName="grid-cols-1"
    >
      <TopicDossierDetail dossier={dossier} />
    </DossierDetailLayout>
  );
}
