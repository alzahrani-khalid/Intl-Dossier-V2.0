import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Link } from '@tanstack/react-router'
import { List, User, Clock } from 'lucide-react'
import type { Database } from '@/types/database'

type Assignment = Database['public']['Tables']['assignments']['Row']

interface RelatedAssignment extends Assignment {
  assignee_name?: string
  sla_remaining_hours?: number
}

interface RelatedTasksListProps {
  assignments: RelatedAssignment[]
  currentAssignmentId: string
  contextType: 'engagement' | 'dossier'
}

export function RelatedTasksList({
  assignments,
  currentAssignmentId,
}: RelatedTasksListProps): React.JSX.Element {
  const { t, i18n } = useTranslation('assignments')
  const isRTL = i18n.language === 'ar'

  const getStatusColor = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'in_progress':
        return 'secondary'
      case 'assigned':
        return 'outline'
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getWorkflowStageColor = (stage: string): string => {
    switch (stage) {
      case 'done':
        return 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400'
      case 'in_progress':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400'
      case 'review':
        return 'text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-400'
      case 'todo':
        return 'text-gray-600 bg-gray-50 dark:bg-gray-950 dark:text-gray-400'
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-950 dark:text-gray-400'
    }
  }

  const formatSLARemaining = (hours?: number): string => {
    if (hours === undefined || hours === null) return t('relatedTasks.noSLA')
    if (hours < 0) return t('relatedTasks.slaBreached')
    if (hours < 1) return t('relatedTasks.lessThanHour')
    if (hours < 24) return t('relatedTasks.hoursRemaining', { count: Math.floor(hours) })
    return t('relatedTasks.daysRemaining', { count: Math.floor(hours / 24) })
  }

  // Filter out current assignment
  const siblingAssignments = assignments.filter(
    (assignment) => assignment.id !== currentAssignmentId,
  )

  if (siblingAssignments.length === 0) {
    return (
      <Card dir={isRTL ? 'rtl' : 'ltr'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            {t('relatedTasks.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground text-sm">
            {t('relatedTasks.empty')}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List className="h-5 w-5" />
          {t('relatedTasks.title')}
          <Badge variant="secondary">{siblingAssignments.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {siblingAssignments.map((assignment) => (
            <Link
              key={assignment.id}
              to="/tasks/$id"
              params={{ id: assignment.id }}
              className="block"
            >
              <div className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className="space-y-2">
                  {/* Task Title and Status */}
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium line-clamp-1 flex-1">
                      {`${assignment.work_item_type} #${assignment.work_item_id}` ||
                        t('relatedTasks.untitledTask')}
                    </h4>
                    <Badge variant={getStatusColor(assignment.status)} className="flex-shrink-0">
                      {t(`status.${assignment.status}`)}
                    </Badge>
                  </div>

                  {/* Assignee and Workflow Stage */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {assignment.assignee_name || t('relatedTasks.unassigned')}
                    </span>

                    {assignment.workflow_stage && (
                      <Badge
                        className={`${getWorkflowStageColor(assignment.workflow_stage)} text-xs`}
                        variant="outline"
                      >
                        {t(`workflowStage.${assignment.workflow_stage}`)}
                      </Badge>
                    )}

                    {assignment.sla_remaining_hours !== undefined && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatSLARemaining(assignment.sla_remaining_hours)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
