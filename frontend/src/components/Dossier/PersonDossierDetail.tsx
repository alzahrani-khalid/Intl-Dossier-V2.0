/**
 * Person Dossier Detail Component (Feature 028 - User Story 4 - T035)
 *
 * Main detail view for person dossiers.
 * 2-column asymmetric layout: left (profile/photo), right (positions/affiliations/interactions).
 * Uses session storage for section collapse state.
 * Mobile-first design with RTL support.
 */

import { useTranslation } from 'react-i18next';
import { useSessionStorage } from '@/hooks/useSessionStorage';
import { CollapsibleSection } from '@/components/Dossier/CollapsibleSection';
import { ProfessionalProfile } from '@/components/Dossier/sections/ProfessionalProfile';
import { PositionsHeld } from '@/components/Dossier/sections/PositionsHeld';
import { OrganizationAffiliations } from '@/components/Dossier/sections/OrganizationAffiliations';
import { InteractionHistory } from '@/components/Dossier/sections/InteractionHistory';
import { PersonTimeline } from '@/components/timeline/PersonTimeline';
import type { PersonDossier } from '@/lib/dossier-type-guards';

interface PersonDossierDetailProps {
  dossier: PersonDossier;
}

export function PersonDossierDetail({ dossier }: PersonDossierDetailProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';

  const [profileOpen, setProfileOpen] = useSessionStorage(
    `person-${dossier.id}-profile-open`,
    true
  );

  const [positionsOpen, setPositionsOpen] = useSessionStorage(
    `person-${dossier.id}-positions-open`,
    true
  );

  const [affiliationsOpen, setAffiliationsOpen] = useSessionStorage(
    `person-${dossier.id}-affiliations-open`,
    true
  );

  const [interactionsOpen, setInteractionsOpen] = useSessionStorage(
    `person-${dossier.id}-interactions-open`,
    true
  );

  const [timelineOpen, setTimelineOpen] = useSessionStorage(
    `person-${dossier.id}-timeline-open`,
    true
  );

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4 sm:gap-6 lg:gap-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Left Column: Profile */}
      <div className="space-y-4 sm:space-y-6">
        <CollapsibleSection
          title={t('sections.person.professionalProfile')}
          description={t('sections.person.professionalProfileDescription')}
          isOpen={profileOpen}
          onToggle={setProfileOpen}
        >
          <ProfessionalProfile dossier={dossier} />
        </CollapsibleSection>
      </div>

      {/* Right Column: Positions, Affiliations, Interactions */}
      <div className="space-y-4 sm:space-y-6">
        <CollapsibleSection
          title={t('sections.person.positionsHeld')}
          description={t('sections.person.positionsHeldDescription')}
          isOpen={positionsOpen}
          onToggle={setPositionsOpen}
        >
          <PositionsHeld dossierId={dossier.id} />
        </CollapsibleSection>

        <CollapsibleSection
          title={t('sections.person.organizationAffiliations')}
          description={t('sections.person.organizationAffiliationsDescription')}
          isOpen={affiliationsOpen}
          onToggle={setAffiliationsOpen}
        >
          <OrganizationAffiliations dossierId={dossier.id} />
        </CollapsibleSection>

        <CollapsibleSection
          title={t('sections.person.interactionHistory')}
          description={t('sections.person.interactionHistoryDescription')}
          isOpen={interactionsOpen}
          onToggle={setInteractionsOpen}
        >
          <InteractionHistory dossierId={dossier.id} />
        </CollapsibleSection>

        {/* Timeline Section - Unified Timeline with Multi-Source Events */}
        <CollapsibleSection
          title={t('timeline.title')}
          description={t('sections.shared.timelineDescription')}
          isOpen={timelineOpen}
          onToggle={setTimelineOpen}
        >
          <PersonTimeline dossierId={dossier.id} />
        </CollapsibleSection>
      </div>
    </div>
  );
}
