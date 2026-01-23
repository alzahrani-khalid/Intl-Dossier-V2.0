/**
 * Elected Official Dossier Detail Component
 *
 * Main detail view for elected official dossiers.
 * 2-column asymmetric layout: left (profile/office info), right (committees/contact/interactions).
 * Uses session storage for section collapse state.
 * Mobile-first design with RTL support.
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { CollapsibleSection } from '@/components/Dossier/CollapsibleSection'
import { ElectedOfficialProfile } from '@/components/Dossier/sections/ElectedOfficialProfile'
import { CommitteeAssignments } from '@/components/Dossier/sections/CommitteeAssignments'
import { ContactPreferencesSection } from '@/components/Dossier/sections/ContactPreferencesSection'
import { StaffDirectory } from '@/components/Dossier/sections/StaffDirectory'
import { TermHistory } from '@/components/Dossier/sections/TermHistory'
import { InteractionHistory } from '@/components/Dossier/sections/InteractionHistory'
import { StakeholderInteractionTimeline } from '@/components/stakeholder-timeline'
import type { ElectedOfficialDossier } from '@/lib/dossier-type-guards'

interface ElectedOfficialDossierDetailProps {
  dossier: ElectedOfficialDossier
}

interface SectionStates {
  profile: boolean
  committees: boolean
  contactPreferences: boolean
  staff: boolean
  termHistory: boolean
  interactions: boolean
  stakeholderTimeline: boolean
}

export function ElectedOfficialDossierDetail({ dossier }: ElectedOfficialDossierDetailProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  // Section collapse states - all expanded by default
  const [sections, setSections] = useState<SectionStates>({
    profile: true,
    committees: true,
    contactPreferences: true,
    staff: true,
    termHistory: true,
    interactions: true,
    stakeholderTimeline: true,
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
      {/* Left Column: Profile & Office Info */}
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

      {/* Right Column: Committees, Contact, Staff, Interactions */}
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
          title={t('sections.stakeholderTimeline.title', { defaultValue: 'Interaction Timeline' })}
          description={t('sections.stakeholderTimeline.description', {
            defaultValue: 'All interactions aggregated chronologically',
          })}
          isExpanded={sections.stakeholderTimeline}
          onToggle={() => toggleSection('stakeholderTimeline')}
        >
          <StakeholderInteractionTimeline
            stakeholderId={dossier.id}
            stakeholderType="elected_official"
          />
        </CollapsibleSection>
      </div>
    </div>
  )
}
