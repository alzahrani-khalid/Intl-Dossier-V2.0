/**
 * Working Group Dossier Page Wrapper (Feature 028 - User Story 6)
 *
 * Component Library Decision:
 * - Checked: Aceternity UI > Aceternity Pro > Kibo-UI
 * - Selected: DossierDetailLayout (shared wrapper)
 * - Reason: Provides consistent header, breadcrumbs, and RTL support
 *
 * Responsive Strategy:
 * - Base: Inherits from DossierDetailLayout (px-4 sm:px-6 lg:px-8)
 * - Grid: Bento grid for collaboration-focused layout (similar to Forum)
 *
 * RTL Support:
 * - Inherited from DossierDetailLayout (dir attribute, logical properties)
 *
 * Accessibility:
 * - Semantic HTML: Uses DossierDetailLayout's semantic structure
 * - ARIA: Breadcrumbs, heading hierarchy
 *
 * Performance:
 * - Will be lazy-loaded via React.lazy in polish phase (T064)
 */

import { DossierDetailLayout } from '@/components/Dossier/DossierDetailLayout';
import { WorkingGroupDossierDetail } from '@/components/Dossier/WorkingGroupDossierDetail';
import type { WorkingGroupDossier } from '@/lib/dossier-type-guards';

interface WorkingGroupDossierPageProps {
  dossier: WorkingGroupDossier;
}

export function WorkingGroupDossierPage({ dossier }: WorkingGroupDossierPageProps) {
  return (
    <DossierDetailLayout
      dossier={dossier}
      gridClassName="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
    >
      <WorkingGroupDossierDetail dossier={dossier} />
    </DossierDetailLayout>
  );
}
