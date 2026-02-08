/**
 * useDeadlineWarnings - Dashboard toast for approaching deadlines
 * Feature: Deadline Warning System (Fix 2)
 *
 * Shows a toast on dashboard mount when tasks have deadlines within 24h.
 * Uses hasShown ref to prevent repeated toasts within the same session.
 */

import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useTasksApproachingDeadline } from './use-tasks'
import { useToast } from './use-toast'

export function useDeadlineWarnings() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const hasShown = useRef(false)

  const { data: approachingTasks } = useTasksApproachingDeadline(24)

  useEffect(() => {
    if (hasShown.current) return
    if (!approachingTasks || approachingTasks.length === 0) return

    hasShown.current = true

    toast({
      title: t('tasks.deadlineApproaching', 'Deadlines Approaching'),
      description: t('tasks.deadlineApproachingCount', '{{count}} task(s) due within 24 hours', {
        count: approachingTasks.length,
      }),
      variant: 'default',
    })
  }, [approachingTasks, toast, t])
}
