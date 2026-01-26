/**
 * Forum Dossier Page Wrapper (Feature 028 - User Story 6)
 * Updated for: Phase 2 Tab-Based Layout with URL state persistence
 *
 * Component Library Decision:
 * - Checked: Aceternity UI > Aceternity Pro > Kibo-UI
 * - Selected: DossierDetailLayout (shared wrapper) + tab-based ForumDossierDetail
 * - Reason: Provides consistent header, breadcrumbs, and RTL support
 *
 * Responsive Strategy:
 * - Base: Inherits from DossierDetailLayout (px-4 sm:px-6 lg:px-8)
 * - Tabs: Horizontal scrollable tabs with fade indicators
 *
 * RTL Support:
 * - Inherited from DossierDetailLayout (dir attribute, logical properties)
 *
 * Accessibility:
 * - Semantic HTML: Uses DossierDetailLayout's semantic structure
 * - ARIA: Breadcrumbs, heading hierarchy, tab roles
 *
 * Performance:
 * - Tab content loaded on demand with Suspense
 */

import { DossierDetailLayout } from '@/components/Dossier/DossierDetailLayout'
import { ForumDossierDetail } from '@/components/Dossier/ForumDossierDetail'
import type { ForumDossier } from '@/lib/dossier-type-guards'

interface ForumDossierPageProps {
  dossier: ForumDossier
  initialTab?: string
}

export function ForumDossierPage({ dossier, initialTab }: ForumDossierPageProps) {
  return (
    <DossierDetailLayout dossier={dossier} gridClassName="grid-cols-1">
      <ForumDossierDetail dossier={dossier} initialTab={initialTab} />
    </DossierDetailLayout>
  )
}
