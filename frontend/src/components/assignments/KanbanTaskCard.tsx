import type { ReactElement } from 'react'

import type { KanbanAssignment } from '@/hooks/useEngagementKanban'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Clock, FileText } from 'lucide-react'

interface KanbanTaskCardProps {
  assignment: KanbanAssignment
}

type SlaStatus = 'overdue' | 'urgent' | 'warning' | 'normal'

export function KanbanTaskCard({ assignment }: KanbanTaskCardProps): ReactElement {
  const getSLAStatus = (): SlaStatus | null => {
    if (assignment.current_stage_sla_deadline == null) return null

    const deadline = new Date(assignment.current_stage_sla_deadline)
    const now = new Date()
    const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursRemaining < 0) return 'overdue'
    if (hoursRemaining < 4) return 'urgent'
    if (hoursRemaining < 24) return 'warning'
    return 'normal'
  }

  const slaStatus = getSLAStatus()
  // Phase 52: text colors use Tailwind @theme semantic utilities; soft fills use
  // CSS token variables because index.css exposes --danger-soft/--warn-soft/--ok-soft
  // but does not expose --color-*-soft utilities.
  const slaColors: Record<SlaStatus, string> = {
    overdue: 'text-danger bg-[var(--danger-soft)]',
    urgent: 'text-warn bg-[var(--warn-soft)]',
    warning: 'text-warn bg-[var(--warn-soft)]',
    normal: 'text-ok bg-[var(--ok-soft)]',
  }

  const priorityVariants: Record<string, 'destructive' | 'default' | 'secondary'> = {
    high: 'destructive',
    medium: 'default',
    low: 'secondary',
  }

  // Short identifier — last 6 chars of the work-item UUID keep cards distinguishable
  // in the fixture engagement (first segment is zero-padded in the seed).
  const shortId = assignment.work_item_id.replace(/-/g, '').slice(-6).toUpperCase()
  const workItemTitle = `${assignment.work_item_type.toUpperCase()}-${shortId}`

  return (
    <div className="flex flex-col gap-2 w-full max-w-full min-w-0 overflow-hidden">
      {/* Row 1: icon + truncated title */}
      <div className="flex items-center gap-2 w-full max-w-full min-w-0">
        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span
          className="text-sm font-medium text-start flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
          title={workItemTitle}
        >
          {workItemTitle}
        </span>
      </div>

      {/* Row 2: priority + optional SLA */}
      <div className="flex items-center gap-1.5 w-full max-w-full min-w-0 flex-wrap">
        <Badge
          variant={priorityVariants[assignment.priority] ?? 'default'}
          className="text-[10px] capitalize shrink-0 px-1.5 py-0"
        >
          {assignment.priority}
        </Badge>
        {slaStatus !== null && (
          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium shrink-0 ${slaColors[slaStatus]}`}
          >
            <Clock className="h-3 w-3" />
            <span className="capitalize">{slaStatus}</span>
          </div>
        )}
      </div>

      {/* Row 3: assignee */}
      {assignment.assignee != null && (
        <div className="flex items-center gap-1.5 pt-2 border-t w-full max-w-full min-w-0">
          <Avatar className="h-5 w-5 shrink-0">
            <AvatarImage src={assignment.assignee.avatar_url} />
            <AvatarFallback className="text-[10px]">
              {assignment.assignee.full_name?.charAt(0) ?? 'S'}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
            {assignment.assignee.full_name ?? 'Staff Member'}
          </span>
        </div>
      )}
    </div>
  )
}
