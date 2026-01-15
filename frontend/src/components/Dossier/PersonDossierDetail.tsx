/**
 * Person Dossier Detail Component (Feature 028 - User Story 4 - T035)
 *
 * Main detail view for person dossiers.
 * 2-column asymmetric layout: left (profile/photo), right (positions/affiliations/interactions).
 * Uses session storage for section collapse state.
 * Mobile-first design with RTL support.
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { CollapsibleSection } from '@/components/Dossier/CollapsibleSection'
import { ProfessionalProfile } from '@/components/Dossier/sections/ProfessionalProfile'
import { PositionsHeld } from '@/components/Dossier/sections/PositionsHeld'
import { OrganizationAffiliations } from '@/components/Dossier/sections/OrganizationAffiliations'
import { InteractionHistory } from '@/components/Dossier/sections/InteractionHistory'
import { PersonTimeline } from '@/components/timeline/PersonTimeline'
import { StakeholderInteractionTimeline } from '@/components/stakeholder-timeline'
import type { PersonDossier } from '@/lib/dossier-type-guards'

interface PersonDossierDetailProps {
  dossier: PersonDossier
}

interface SectionStates {
  profile: boolean
  positions: boolean
  affiliations: boolean
  interactions: boolean
  stakeholderTimeline: boolean
  timeline: boolean
}

export function PersonDossierDetail({ dossier }: PersonDossierDetailProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  // Section collapse states - all expanded by default
  const [sections, setSections] = useState<SectionStates>({
    profile: true,
    positions: true,
    affiliations: true,
    interactions: true,
    stakeholderTimeline: true,
    timeline: true,
  })

  const toggleSection = useCallback((sectionKey: keyof SectionStates) => {
    setSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }))
  }, [])

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4 sm:gap-6 lg:gap-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Left Column: Profile */}
      <div className="space-y-4 sm:space-y-6">
        <CollapsibleSection
          id="person-profile"
          title={t('sections.person.professionalProfile')}
          description={t('sections.person.professionalProfileDescription')}
          isExpanded={sections.profile}
          onToggle={() => toggleSection('profile')}
        >
          <ProfessionalProfile dossier={dossier} />
        </CollapsibleSection>
      </div>

      {/* Right Column: Positions, Affiliations, Interactions */}
      <div className="space-y-4 sm:space-y-6">
        <CollapsibleSection
          id="person-positions"
          title={t('sections.person.positionsHeld')}
          description={t('sections.person.positionsHeldDescription')}
          isExpanded={sections.positions}
          onToggle={() => toggleSection('positions')}
        >
          <PositionsHeld dossierId={dossier.id} />
        </CollapsibleSection>

        <CollapsibleSection
          id="person-affiliations"
          title={t('sections.person.organizationAffiliations')}
          description={t('sections.person.organizationAffiliationsDescription')}
          isExpanded={sections.affiliations}
          onToggle={() => toggleSection('affiliations')}
        >
          <OrganizationAffiliations dossierId={dossier.id} />
        </CollapsibleSection>

        <CollapsibleSection
          id="person-interactions"
          title={t('sections.person.interactionHistory')}
          description={t('sections.person.interactionHistoryDescription')}
          isExpanded={sections.interactions}
          onToggle={() => toggleSection('interactions')}
        >
          <InteractionHistory dossierId={dossier.id} />
        </CollapsibleSection>

        {/* Stakeholder Interaction Timeline - Unified Timeline with Annotations */}
        <CollapsibleSection
          id="person-stakeholder-timeline"
          title={t('sections.stakeholderTimeline.title', { defaultValue: 'Interaction Timeline' })}
          description={t('sections.stakeholderTimeline.description', {
            defaultValue: 'All interactions aggregated chronologically',
          })}
          isExpanded={sections.stakeholderTimeline}
          onToggle={() => toggleSection('stakeholderTimeline')}
        >
          <StakeholderInteractionTimeline stakeholderId={dossier.id} stakeholderType="person" />
        </CollapsibleSection>

        {/* Timeline Section - Unified Timeline with Multi-Source Events */}
        <CollapsibleSection
          id="person-timeline"
          title={t('timeline.title')}
          description={t('sections.shared.timelineDescription')}
          isExpanded={sections.timeline}
          onToggle={() => toggleSection('timeline')}
        >
          <PersonTimeline dossierId={dossier.id} />
        </CollapsibleSection>
      </div>
    </div>
  )
}
