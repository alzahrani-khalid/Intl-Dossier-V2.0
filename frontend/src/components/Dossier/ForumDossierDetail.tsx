/**
 * ForumDossierDetail - Type-specific layout for Forum dossiers
 *
 * Component Library Decision:
 * - Checked: Aceternity UI > Aceternity Pro > Kibo-UI
 * - Selected: CollapsibleSection (implemented), section components (custom)
 * - Reason: Reusable collapsible sections with forum-specific content
 *
 * Responsive Strategy:
 * - Base: Single column grid (grid-cols-1)
 * - md: 2-column grid (md:grid-cols-2)
 * - lg: 3-column bento grid (lg:grid-cols-3) for collaboration visualization
 * - Sections: Different column spans for visual hierarchy
 *
 * RTL Support:
 * - Logical properties: gap-*, text-start
 * - Icon flipping: None needed in forum view
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
import { MemberOrganizations } from './sections/MemberOrganizations';
import { MeetingSchedule } from './sections/MeetingSchedule';
import { DeliverablesTracker } from './sections/DeliverablesTracker';
import { DecisionLogs } from './sections/DecisionLogs';
import type { ForumDossier } from '@/lib/dossier-type-guards';

interface ForumDossierDetailProps {
  dossier: ForumDossier;
}

export function ForumDossierDetail({ dossier }: ForumDossierDetailProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';

  // Manage collapsible section state with session storage
  const [sections, toggleSection] = useCollapsibleSections(
    dossier.id,
    'forum',
    {
      memberOrganizations: true,
      meetingSchedule: true,
      deliverablesTracker: true,
      decisionLogs: true,
    }
  );

  return (
    <div
      className="space-y-5"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Member Organizations Section - Spans 2 columns on large screens */}
      <div className="lg:col-span-2">
        <CollapsibleSection
          id="memberOrganizations"
          title={t('sections.forum.memberOrganizations')}
          description={t('sections.forum.memberOrganizationsDescription')}
          isExpanded={sections.memberOrganizations}
          onToggle={() => toggleSection('memberOrganizations')}
        >
          <MemberOrganizations dossier={dossier} />
        </CollapsibleSection>
      </div>

      {/* Meeting Schedule Section - Takes 1 column on large screens */}
      <div className="lg:col-span-1">
        <CollapsibleSection
          id="meetingSchedule"
          title={t('sections.forum.meetingSchedule')}
          description={t('sections.forum.meetingScheduleDescription')}
          isExpanded={sections.meetingSchedule}
          onToggle={() => toggleSection('meetingSchedule')}
        >
          <MeetingSchedule dossier={dossier} />
        </CollapsibleSection>
      </div>

      {/* Deliverables Tracker Section - Spans all columns */}
      <div className="lg:col-span-3">
        <CollapsibleSection
          id="deliverablesTracker"
          title={t('sections.forum.deliverablesTracker')}
          description={t('sections.forum.deliverablesTrackerDescription')}
          isExpanded={sections.deliverablesTracker}
          onToggle={() => toggleSection('deliverablesTracker')}
        >
          <DeliverablesTracker dossier={dossier} />
        </CollapsibleSection>
      </div>

      {/* Decision Logs Section - Spans all columns */}
      <div className="lg:col-span-3">
        <CollapsibleSection
          id="decisionLogs"
          title={t('sections.forum.decisionLogs')}
          description={t('sections.forum.decisionLogsDescription')}
          isExpanded={sections.decisionLogs}
          onToggle={() => toggleSection('decisionLogs')}
        >
          <DecisionLogs dossier={dossier} />
        </CollapsibleSection>
      </div>
    </div>
  );
}
