/**
 * OrganizationDossierDetail - Type-specific layout for Organization dossiers
 *
 * Component Library Decision:
 * - Checked: Aceternity UI > Aceternity Pro > Kibo-UI
 * - Selected: CollapsibleSection (implemented), section components (custom)
 * - Reason: Reusable collapsible sections with organization-specific content
 *
 * Responsive Strategy:
 * - Base: Single column grid (grid-cols-1)
 * - lg: 3-column grid (lg:grid-cols-3) for hierarchical visualization
 * - Sections: Full-width sections within grid cells
 *
 * RTL Support:
 * - Logical properties: gap-*, text-start
 * - Icon flipping: None needed in organization view
 * - Text alignment: Inherited from CollapsibleSection
 *
 * Accessibility:
 * - ARIA: CollapsibleSection handles accordion ARIA patterns
 * - Keyboard: Tab navigation through sections, Enter/Space to toggle
 * - Focus: CollapsibleSection manages focus states
 *
 * Performance:
 * - Memoization: Section data memoized via useMemo (T065)
 * - Lazy loading: Sections use dynamic imports in future optimization
 *
 * Feature: 028-type-specific-dossier-pages
 */

import { useTranslation } from 'react-i18next';
import { useCollapsibleSections } from '@/hooks/useSessionStorage';
import { CollapsibleSection } from './CollapsibleSection';
import { InstitutionalProfile } from './sections/InstitutionalProfile';
import { OrgHierarchy } from './sections/OrgHierarchy';
import { KeyContacts } from './sections/KeyContacts';
import { ActiveMoUs } from './sections/ActiveMoUs';
import { OrganizationTimeline } from '@/components/timeline/OrganizationTimeline';
import type { OrganizationDossier } from '@/lib/dossier-type-guards';

interface OrganizationDossierDetailProps {
  dossier: OrganizationDossier;
}

export function OrganizationDossierDetail({
  dossier,
}: OrganizationDossierDetailProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';

  // Manage collapsible section state with session storage
  const [sections, toggleSection] = useCollapsibleSections(
    dossier.id,
    'organization',
    {
      institutionalProfile: true,
      orgHierarchy: true,
      keyContacts: true,
      timeline: true,
      activeMous: true,
    }
  );

  return (
    <div
      className="space-y-4 sm:space-y-6 lg:space-y-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Institutional Profile Section - Spans all columns on large screens */}
      <div className="lg:col-span-3">
        <CollapsibleSection
          id="institutionalProfile"
          title={t('sections.organization.institutionalProfile')}
          description={t('sections.organization.institutionalProfileDescription')}
          isExpanded={sections.institutionalProfile}
          onToggle={() => toggleSection('institutionalProfile')}
        >
          <InstitutionalProfile dossier={dossier} />
        </CollapsibleSection>
      </div>

      {/* Organization Hierarchy Section - Spans all columns */}
      <div className="lg:col-span-3">
        <CollapsibleSection
          id="orgHierarchy"
          title={t('sections.organization.orgHierarchy')}
          description={t('sections.organization.orgHierarchyDescription')}
          isExpanded={sections.orgHierarchy}
          onToggle={() => toggleSection('orgHierarchy')}
        >
          <OrgHierarchy dossier={dossier} />
        </CollapsibleSection>
      </div>

      {/* Key Contacts Section - Takes 2 columns on large screens */}
      <div className="lg:col-span-2">
        <CollapsibleSection
          id="keyContacts"
          title={t('sections.organization.keyContacts')}
          description={t('sections.organization.keyContactsDescription')}
          isExpanded={sections.keyContacts}
          onToggle={() => toggleSection('keyContacts')}
        >
          <KeyContacts dossier={dossier} />
        </CollapsibleSection>
      </div>

      {/* Active MoUs Section - Takes 1 column on large screens */}
      <div className="lg:col-span-1">
        <CollapsibleSection
          id="activeMous"
          title={t('sections.organization.activeMous')}
          description={t('sections.organization.activeMousDescription')}
          isExpanded={sections.activeMous}
          onToggle={() => toggleSection('activeMous')}
        >
          <ActiveMoUs dossier={dossier} />
        </CollapsibleSection>
      </div>

      {/* Timeline Section - Unified Timeline with Multi-Source Events */}
      <div className="lg:col-span-3">
        <CollapsibleSection
          id="timeline"
          title={t('timeline.title')}
          description={t('sections.shared.timelineDescription')}
          isExpanded={sections.timeline}
          onToggle={() => toggleSection('timeline')}
        >
          <OrganizationTimeline dossierId={dossier.id} />
        </CollapsibleSection>
      </div>
    </div>
  );
}
