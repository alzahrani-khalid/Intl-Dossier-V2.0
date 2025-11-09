/**
 * MeetingSchedule Section Component
 *
 * Displays calendar_entries where related_dossier_id = forum/working_group.id
 * and entry_type = 'meeting'. Calendar view with next meeting highlighted.
 *
 * Mobile-first responsive, RTL support.
 * Future: Will fetch actual calendar entries from API.
 */

import { useTranslation } from 'react-i18next';
import { CalendarDays, Clock } from 'lucide-react';
import type { ForumDossier, WorkingGroupDossier } from '@/lib/dossier-type-guards';

interface MeetingScheduleProps {
  dossier: ForumDossier | WorkingGroupDossier;
  isWorkingGroup?: boolean;
}

export function MeetingSchedule({
  dossier,
  isWorkingGroup = false,
}: MeetingScheduleProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';

  // Extract next meeting date if available
  const nextMeetingDate =
    dossier.type === 'forum' ? dossier.extension.next_meeting_date : undefined;

  // Placeholder - will fetch from calendar_entries table in future
  const meetings: any[] = [];

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Next Meeting Highlight */}
      {nextMeetingDate && (
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-start gap-3">
            <CalendarDays className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-primary mb-1">
                Next Meeting
              </h4>
              <p className="text-xs text-muted-foreground">
                {new Date(nextMeetingDate).toLocaleDateString(i18n.language, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Frequency Info (for Forums) */}
      {dossier.type === 'forum' && dossier.extension.meeting_frequency && (
        <div className="p-4 rounded-lg bg-muted/30">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium mb-1">Meeting Frequency</h4>
              <p className="text-xs text-muted-foreground">
                {dossier.extension.meeting_frequency}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Meetings List (Placeholder) */}
      {meetings.length === 0 && (
        <div className="text-center py-6 sm:py-8">
          <CalendarDays className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-xs sm:text-sm text-muted-foreground">
            Calendar integration pending. Meetings will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
