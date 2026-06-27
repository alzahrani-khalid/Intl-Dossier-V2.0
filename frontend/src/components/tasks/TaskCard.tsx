/**
 * TaskCard Component
 * Feature: 025-unified-tasks-model
 * User Story: US1 - View My Tasks with Clear Titles
 * Task: T033
 *
 * Displays task.title as primary text with mobile-first responsive design and RTL support
 */

import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { SLAIndicator } from './SLAIndicator'
import type { Database } from '../../../../backend/src/types/database.types'
import { useDirection } from '@/hooks/useDirection'
import { getPriorityBadgeClass, getStatusBadgeClass } from '@/lib/semantic-colors'

type Task = Database['public']['Tables']['tasks']['Row']

interface TaskCardProps {
  task: Task
  onClick?: (task: Task) => void
  showEngagement?: boolean
  showWorkItem?: boolean
  className?: string
}

export function TaskCard({
  task,
  onClick,
  showEngagement: _showEngagement = false,
  showWorkItem = true,
  className = '',
}: TaskCardProps) {
  const { t } = useTranslation()
  const { isRTL } = useDirection()

  const isCompleted = task.status === 'completed' || task.status === 'cancelled'

  return (
    <Card
      className={`transition-colors hover:bg-line-soft cursor-pointer ${className}`}
      onClick={() => onClick?.(task)}
    >
      <CardContent className="p-4 sm:p-6">
        {/* Header: Badges and Metadata */}
        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap gap-2">
            <Badge className={getPriorityBadgeClass(task.priority)}>
              {t(`priority.${task.priority}`, task.priority)}
            </Badge>
            <Badge className={getStatusBadgeClass(task.status)}>
              {t(`status.${task.status}`, task.status)}
            </Badge>
            {showWorkItem && task.work_item_type && (
              <Badge variant="outline">
                {t(`work_item.${task.work_item_type}`, task.work_item_type)}
              </Badge>
            )}
          </div>

          {/* SLA Indicator - T078: Integrated SLAIndicator component */}
          <SLAIndicator
            deadline={task.sla_deadline}
            isCompleted={isCompleted}
            completedAt={task.completed_at}
            mode="badge"
          />
        </div>

        {/* Task Title (Primary Display) - Mobile-first, RTL-compatible */}
        <h3
          className={`text-sm sm:text-base md:text-lg font-semibold mb-2 ${isRTL ? 'text-end' : 'text-start'}`}
        >
          {task.title}
        </h3>

        {/* Description Preview */}
        {task.description && (
          <p
            className={`text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3 ${isRTL ? 'text-end' : 'text-start'}`}
          >
            {task.description}
          </p>
        )}

        {/* Footer: Timestamps */}
        <div
          className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground ${isRTL ? 'text-end' : 'text-start'}`}
        >
          <div>
            {t('created', 'Created')}:{' '}
            {new Date(task.created_at).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
          </div>
          {task.sla_deadline && (
            <div>
              {t('due', 'Due')}:{' '}
              {new Date(task.sla_deadline).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
