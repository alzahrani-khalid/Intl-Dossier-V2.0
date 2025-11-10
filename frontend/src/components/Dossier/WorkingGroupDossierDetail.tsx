/**
 * WorkingGroupDossierDetail - Type-specific layout for Working Group dossiers
 *
 * Component Library Decision:
 * - Checked: Aceternity UI > Aceternity Pro > Kibo-UI
 * - Selected: CollapsibleSection (implemented), section components (shared with Forum)
 * - Reason: Reusable collapsible sections, shares sections with Forum type
 *
 * Responsive Strategy:
 * - Base: Single column grid (grid-cols-1)
 * - md: 2-column grid (md:grid-cols-2)
 * - lg: 3-column bento grid (lg:grid-cols-3) for collaboration visualization
 * - Sections: Same layout as Forum with subtle spacing differences
 *
 * RTL Support:
 * - Logical properties: gap-*, text-start
 * - Icon flipping: None needed in working group view
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
import type { WorkingGroupDossier } from '@/lib/dossier-type-guards';

interface WorkingGroupDossierDetailProps {
  dossier: WorkingGroupDossier;
}

export function WorkingGroupDossierDetail({
  dossier,
}: WorkingGroupDossierDetailProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';

  // Manage collapsible section state with session storage
  const [sections, toggleSection] = useCollapsibleSections(
    dossier.id,
    'working_group',
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
          title={t('sections.workingGroup.memberOrganizations')}
          description={t('sections.workingGroup.memberOrganizationsDescription')}
          isExpanded={sections.memberOrganizations}
          onToggle={() => toggleSection('memberOrganizations')}
        >
          <MemberOrganizations dossier={dossier} isWorkingGroup />
        </CollapsibleSection>
      </div>

      {/* Meeting Schedule Section - Takes 1 column on large screens */}
      <div className="lg:col-span-1">
        <CollapsibleSection
          id="meetingSchedule"
          title={t('sections.workingGroup.meetingSchedule')}
          description={t('sections.workingGroup.meetingScheduleDescription')}
          isExpanded={sections.meetingSchedule}
          onToggle={() => toggleSection('meetingSchedule')}
        >
          <MeetingSchedule dossier={dossier} isWorkingGroup />
        </CollapsibleSection>
      </div>

      {/* Deliverables Tracker Section - Spans all columns */}
      <div className="lg:col-span-3">
        <CollapsibleSection
          id="deliverablesTracker"
          title={t('sections.workingGroup.deliverablesTracker')}
          description={t('sections.workingGroup.deliverablesTrackerDescription')}
          isExpanded={sections.deliverablesTracker}
          onToggle={() => toggleSection('deliverablesTracker')}
        >
          <DeliverablesTracker dossier={dossier} isWorkingGroup />
        </CollapsibleSection>
      </div>

      {/* Decision Logs Section - Spans all columns */}
      <div className="lg:col-span-3">
        <CollapsibleSection
          id="decisionLogs"
          title={t('sections.workingGroup.decisionLogs')}
          description={t('sections.workingGroup.decisionLogsDescription')}
          isExpanded={sections.decisionLogs}
          onToggle={() => toggleSection('decisionLogs')}
        >
          <DecisionLogs dossier={dossier} isWorkingGroup />
        </CollapsibleSection>
      </div>
    </div>
  );
}
