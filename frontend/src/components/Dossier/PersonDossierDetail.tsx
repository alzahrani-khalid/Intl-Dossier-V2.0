/**
 * Person Dossier Detail Component (Feature 028 - User Story 4 - T035)
 *
 * Main detail view for person dossiers, including elected officials.
 * 2-column asymmetric layout: left (profile/photo), right (positions/affiliations/interactions).
 * Conditionally renders elected official sections when person_subtype === 'elected_official'.
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
// Elected official specific sections
import { ElectedOfficialProfile } from '@/components/Dossier/sections/ElectedOfficialProfile'
import { CommitteeAssignments } from '@/components/Dossier/sections/CommitteeAssignments'
import { ContactPreferencesSection } from '@/components/Dossier/sections/ContactPreferencesSection'
import { StaffDirectory } from '@/components/Dossier/sections/StaffDirectory'
import { TermHistory } from '@/components/Dossier/sections/TermHistory'
import type { PersonDossier } from '@/lib/dossier-type-guards'
import { isElectedOfficial } from '@/lib/dossier-type-guards'

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
  // Elected official specific sections
  committees: boolean
  contactPreferences: boolean
  staff: boolean
  termHistory: boolean
}

export function PersonDossierDetail({ dossier }: PersonDossierDetailProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  // Check if this person is an elected official
  const isElectedOfficialPerson = isElectedOfficial(dossier.extension)

  // Section collapse states - all expanded by default
  const [sections, setSections] = useState<SectionStates>({
    profile: true,
    positions: true,
    affiliations: true,
    interactions: true,
    stakeholderTimeline: true,
    timeline: true,
    // Elected official sections
    committees: true,
    contactPreferences: true,
    staff: true,
    termHistory: true,
  })

  const toggleSection = useCallback((sectionKey: keyof SectionStates) => {
    setSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }))
  }, [])

  // For elected officials, use the elected official profile component
  if (isElectedOfficialPerson) {
    return (
      <div
        className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4 sm:gap-6 lg:gap-8"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Left Column: Profile & Office Info (Elected Official) */}
        <div className="space-y-4 sm:space-y-6">
          <CollapsibleSection
            id="elected-official-profile"
            title={t('sections.electedOfficial.profile')}
            description={t('sections.electedOfficial.profileDescription')}
            isExpanded={sections.profile}
            onToggle={() => toggleSection('profile')}
          >
            <ElectedOfficialProfile dossier={dossier} />
          </CollapsibleSection>

          <CollapsibleSection
            id="elected-official-term-history"
            title={t('sections.electedOfficial.termHistory')}
            description={t('sections.electedOfficial.termHistoryDescription')}
            isExpanded={sections.termHistory}
            onToggle={() => toggleSection('termHistory')}
          >
            <TermHistory dossier={dossier} />
          </CollapsibleSection>
        </div>

        {/* Right Column: Committees, Contact, Staff, Interactions (Elected Official) */}
        <div className="space-y-4 sm:space-y-6">
          <CollapsibleSection
            id="elected-official-committees"
            title={t('sections.electedOfficial.committees')}
            description={t('sections.electedOfficial.committeesDescription')}
            isExpanded={sections.committees}
            onToggle={() => toggleSection('committees')}
          >
            <CommitteeAssignments dossier={dossier} />
          </CollapsibleSection>

          <CollapsibleSection
            id="elected-official-contact-preferences"
            title={t('sections.electedOfficial.contactPreferences')}
            description={t('sections.electedOfficial.contactPreferencesDescription')}
            isExpanded={sections.contactPreferences}
            onToggle={() => toggleSection('contactPreferences')}
          >
            <ContactPreferencesSection dossier={dossier} />
          </CollapsibleSection>

          <CollapsibleSection
            id="elected-official-staff"
            title={t('sections.electedOfficial.staffDirectory')}
            description={t('sections.electedOfficial.staffDirectoryDescription')}
            isExpanded={sections.staff}
            onToggle={() => toggleSection('staff')}
          >
            <StaffDirectory dossier={dossier} />
          </CollapsibleSection>

          <CollapsibleSection
            id="elected-official-interactions"
            title={t('sections.person.interactionHistory')}
            description={t('sections.person.interactionHistoryDescription')}
            isExpanded={sections.interactions}
            onToggle={() => toggleSection('interactions')}
          >
            <InteractionHistory dossierId={dossier.id} />
          </CollapsibleSection>

          {/* Stakeholder Interaction Timeline */}
          <CollapsibleSection
            id="elected-official-stakeholder-timeline"
            title={t('sections.stakeholderTimeline.title', {
              defaultValue: 'Interaction Timeline',
            })}
            description={t('sections.stakeholderTimeline.description', {
              defaultValue: 'All interactions aggregated chronologically',
            })}
            isExpanded={sections.stakeholderTimeline}
            onToggle={() => toggleSection('stakeholderTimeline')}
          >
            <StakeholderInteractionTimeline stakeholderId={dossier.id} stakeholderType="person" />
          </CollapsibleSection>
        </div>
      </div>
    )
  }

  // Standard person layout
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
