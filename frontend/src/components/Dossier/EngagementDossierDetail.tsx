/**
 * Engagement Dossier Detail Component (Feature 028 - User Story 3 - T028)
 *
 * Main detail view for engagement dossiers.
 * Single-column layout with Information, Positions, and 4 collapsible sections.
 * Uses session storage for section collapse state.
 * Mobile-first design with RTL support.
 */

import { useTranslation } from 'react-i18next';
import { useSessionStorage } from '@/hooks/useSessionStorage';
import { CollapsibleSection } from '@/components/Dossier/CollapsibleSection';
import { EngagementInformation } from '@/components/Dossier/sections/EngagementInformation';
import { EngagementTimeline } from '@/components/timeline/EngagementTimeline';
import { ParticipantsList } from '@/components/Dossier/sections/ParticipantsList';
import { OutcomesSummary } from '@/components/Dossier/sections/OutcomesSummary';
import { FollowUpActions } from '@/components/Dossier/sections/FollowUpActions';
import { EngagementPositionsSection } from '@/components/positions/EngagementPositionsSection';
import type { EngagementDossier } from '@/lib/dossier-type-guards';

interface EngagementDossierDetailProps {
  dossier: EngagementDossier;
}

export function EngagementDossierDetail({ dossier }: EngagementDossierDetailProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';

  // Session storage for section collapse state
  const [informationOpen, setInformationOpen] = useSessionStorage(
    `engagement-${dossier.id}-information-open`,
    true
  );

  const [positionsOpen, setPositionsOpen] = useSessionStorage(
    `engagement-${dossier.id}-positions-open`,
    true
  );

  const [timelineOpen, setTimelineOpen] = useSessionStorage(
    `engagement-${dossier.id}-timeline-open`,
    true
  );

  const [participantsOpen, setParticipantsOpen] = useSessionStorage(
    `engagement-${dossier.id}-participants-open`,
    true
  );

  const [outcomesOpen, setOutcomesOpen] = useSessionStorage(
    `engagement-${dossier.id}-outcomes-open`,
    true
  );

  const [followUpOpen, setFollowUpOpen] = useSessionStorage(
    `engagement-${dossier.id}-followup-open`,
    true
  );

  return (
    <div
      className="space-y-4 sm:space-y-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Information Section */}
      <CollapsibleSection
        id="information"
        title={t('sections.engagement.information')}
        description={t('sections.engagement.informationDescription')}
        isExpanded={informationOpen}
        onToggle={setInformationOpen}
      >
        <EngagementInformation dossier={dossier} />
      </CollapsibleSection>

      {/* Positions Section */}
      <CollapsibleSection
        id="positions"
        title={t('sections.engagement.positions')}
        description={t('sections.engagement.positionsDescription')}
        isExpanded={positionsOpen}
        onToggle={setPositionsOpen}
      >
        <EngagementPositionsSection engagementId={dossier.id} />
      </CollapsibleSection>

      {/* Event Timeline Section - Unified Timeline with Multi-Source Events */}
      <CollapsibleSection
        id="timeline"
        title={t('sections.engagement.eventTimeline')}
        description={t('sections.engagement.eventTimelineDescription')}
        isExpanded={timelineOpen}
        onToggle={setTimelineOpen}
      >
        <EngagementTimeline dossierId={dossier.id} />
      </CollapsibleSection>

      {/* Participants List Section */}
      <CollapsibleSection
        id="participants"
        title={t('sections.engagement.participantsList')}
        description={t('sections.engagement.participantsListDescription')}
        isExpanded={participantsOpen}
        onToggle={setParticipantsOpen}
      >
        <ParticipantsList dossierId={dossier.id} />
      </CollapsibleSection>

      {/* Outcomes Summary Section */}
      <CollapsibleSection
        id="outcomes"
        title={t('sections.engagement.outcomesSummary')}
        description={t('sections.engagement.outcomesSummaryDescription')}
        isExpanded={outcomesOpen}
        onToggle={setOutcomesOpen}
      >
        <OutcomesSummary dossierId={dossier.id} />
      </CollapsibleSection>

      {/* Follow-Up Actions Section */}
      <CollapsibleSection
        id="followup"
        title={t('sections.engagement.followUpActions')}
        description={t('sections.engagement.followUpActionsDescription')}
        isExpanded={followUpOpen}
        onToggle={setFollowUpOpen}
      >
        <FollowUpActions dossierId={dossier.id} />
      </CollapsibleSection>
    </div>
  );
}
