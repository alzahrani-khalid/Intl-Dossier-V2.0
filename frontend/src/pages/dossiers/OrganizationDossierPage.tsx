/**
 * Organization Dossier Page Wrapper (Feature 028 - User Story 5)
 * Updated for: Phase 2 Tab-Based Layout
 *
 * Component Library Decision:
 * - Checked: Aceternity UI > Aceternity Pro > Kibo-UI
 * - Selected: DossierDetailLayout (shared wrapper) with tab-based content
 * - Reason: Provides consistent header, breadcrumbs, and RTL support
 *
 * Responsive Strategy:
 * - Base: Inherits from DossierDetailLayout (px-4 sm:px-6 lg:px-8)
 * - Tabs: Horizontal scroll on mobile, full-width on desktop
 *
 * RTL Support:
 * - Inherited from DossierDetailLayout (dir attribute, logical properties)
 *
 * Accessibility:
 * - Semantic HTML: Uses DossierDetailLayout's semantic structure
 * - ARIA: Tab role with proper aria-selected and aria-controls
 *
 * Performance:
 * - Lazy-loaded via React.lazy
 * - Tab content lazy-loaded with Suspense
 */

import { DossierDetailLayout } from '@/components/Dossier/DossierDetailLayout'
import { OrganizationDossierDetail } from '@/components/Dossier/OrganizationDossierDetail'
import type { OrganizationDossier } from '@/lib/dossier-type-guards'

interface OrganizationDossierPageProps {
  dossier: OrganizationDossier
  initialTab?: string
}

export function OrganizationDossierPage({ dossier, initialTab }: OrganizationDossierPageProps) {
  return (
    <DossierDetailLayout dossier={dossier} gridClassName="grid-cols-1">
      <OrganizationDossierDetail dossier={dossier} initialTab={initialTab} />
    </DossierDetailLayout>
  )
}
