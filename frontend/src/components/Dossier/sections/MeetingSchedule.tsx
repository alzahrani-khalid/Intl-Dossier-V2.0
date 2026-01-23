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
        <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
          <div className="flex items-start gap-3">
            <CalendarDays className="mt-0.5 size-5 shrink-0 text-primary" />
            <div className="flex-1">
              <h4 className="mb-1 text-sm font-medium text-primary">
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
        <div className="rounded-lg bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <div className="flex-1">
              <h4 className="mb-1 text-sm font-medium">Meeting Frequency</h4>
              <p className="text-xs text-muted-foreground">
                {dossier.extension.meeting_frequency}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Meetings List (Placeholder) */}
      {meetings.length === 0 && (
        <div className="py-6 text-center sm:py-8">
          <CalendarDays className="mx-auto mb-3 size-8 text-muted-foreground sm:size-10" />
          <p className="text-xs text-muted-foreground sm:text-sm">
            Calendar integration pending. Meetings will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
