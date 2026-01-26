/**
 * DeliverablesTracker Section Component
 *
 * Displays forum/working group deliverables from extension.deliverables array
 * with status indicators. Kanban-style layout, mobile-first, RTL support.
 */

import { useTranslation } from 'react-i18next'
import { CheckCircle2, Circle, Clock, Target } from 'lucide-react'
import type { ForumDossier, WorkingGroupDossier } from '@/lib/dossier-type-guards'
import { cn } from '@/lib/utils'

interface DeliverablesTrackerProps {
  dossier: ForumDossier | WorkingGroupDossier
  isWorkingGroup?: boolean
}

type DeliverableStatus = 'pending' | 'in_progress' | 'completed'

export function DeliverablesTracker({ dossier, isWorkingGroup = false }: DeliverablesTrackerProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  // Extract deliverables (only forums have this in extension)
  // Use optional chaining since extension may be undefined for newly created dossiers
  const deliverables = dossier.type === 'forum' ? dossier.extension?.deliverables || [] : []

  if (deliverables.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 sm:py-12 text-center"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="rounded-full bg-muted p-4 sm:p-6 mb-4">
          <Target className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
        </div>
        <h3 className="text-sm sm:text-base font-medium text-muted-foreground mb-2">
          No Deliverables Tracked
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
          Deliverables and milestones will appear here as they are defined.
        </p>
      </div>
    )
  }

  // Status configuration
  const statusConfig: Record<
    DeliverableStatus,
    { icon: typeof Circle; label: string; className: string }
  > = {
    pending: {
      icon: Circle,
      label: 'Pending',
      className: 'text-muted-foreground bg-muted/30',
    },
    in_progress: {
      icon: Clock,
      label: 'In Progress',
      className: 'text-warning bg-warning/10',
    },
    completed: {
      icon: CheckCircle2,
      label: 'Completed',
      className: 'text-success bg-success/10',
    },
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Group deliverables by status (Kanban columns) */}
      {(['pending', 'in_progress', 'completed'] as DeliverableStatus[]).map((status) => {
        const config = statusConfig[status]
        const Icon = config.icon
        const statusDeliverables = deliverables.filter((d) => d.status === status)

        return (
          <div key={status} className="space-y-3">
            {/* Column Header */}
            <div className="flex items-center gap-2 pb-2 border-b">
              <Icon className={cn('h-4 w-4', config.className.split(' ')[0])} />
              <h4 className="text-sm font-medium">{config.label}</h4>
              <span className="ms-auto text-xs text-muted-foreground">
                {statusDeliverables.length}
              </span>
            </div>

            {/* Deliverables Cards */}
            <div className="space-y-2">
              {statusDeliverables.map((deliverable, index) => (
                <div
                  key={index}
                  className={cn(
                    'p-3 rounded-lg border',
                    config.className.split(' ').slice(1).join(' '),
                  )}
                >
                  <h5 className="text-sm font-medium mb-1">{deliverable.name}</h5>
                  <p className="text-xs text-muted-foreground">
                    Due: {new Date(deliverable.due_date).toLocaleDateString(i18n.language)}
                  </p>
                </div>
              ))}

              {statusDeliverables.length === 0 && (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  No {config.label.toLowerCase()} items
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
