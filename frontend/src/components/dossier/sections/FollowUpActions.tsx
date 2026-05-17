/**
 * Follow-Up Actions Section (Feature 028 - User Story 3 - T032)
 *
 * Displays tasks and next steps from engagement.
 * Fetches from unified_work_items and after_action follow_up_actions.
 * Mobile-first layout with RTL support.
 */

import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { arSA, enUS } from 'date-fns/locale'
import { ListTodo, CheckSquare, Circle, Clock, User, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useDirection } from '@/hooks/useDirection'

interface FollowUpAction {
  id: string
  description: string
  assigned_to: string | null
  target_date: string | null
  completed: boolean
  source: 'work_item' | 'after_action'
  priority?: string
  status?: string
}

interface FollowUpActionsProps {
  dossierId: string
}

export function FollowUpActions({ dossierId }: FollowUpActionsProps) {
  const { t } = useTranslation('dossier')
  const { isRTL } = useDirection()
  const dateLocale = isRTL ? arSA : enUS

  // Fetch follow-up actions from work_items linked to this dossier
  const { data: workItems = [], isLoading: isLoadingWorkItems } = useQuery({
    queryKey: ['work-items', dossierId, 'follow-up'],
    queryFn: async () => {
      // Try fetching from work_item_dossiers junction table
      const { data, error } = await supabase
        .from('work_item_dossiers')
        .select(
          `
          work_item_id,
          work_items!inner (
            id,
            title,
            description,
            status,
            priority,
            deadline,
            assignee_id,
            users!work_items_assignee_id_fkey (
              full_name
            )
          )
        `,
        )
        .eq('dossier_id', dossierId)
        .limit(20)

      if (error) {
        console.error('Failed to fetch work items:', error)
        return []
      }

      return (data || []).map((item: any) => ({
        id: item.work_items.id,
        description: item.work_items.title || item.work_items.description,
        assigned_to: item.work_items.users?.full_name || null,
        target_date: item.work_items.deadline,
        completed: item.work_items.status === 'completed',
        source: 'work_item' as const,
        priority: item.work_items.priority,
        status: item.work_items.status,
      }))
    },
    enabled: !!dossierId,
  })

  // Fetch after-action follow-up actions for this dossier
  const { data: afterActionItems = [], isLoading: isLoadingAfterAction } = useQuery({
    queryKey: ['after-action-follow-ups', dossierId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('after-actions-list', {
        body: { dossier_id: dossierId, status: 'published', limit: 10 },
      })

      if (error || !data?.data) {
        return []
      }

      // Extract follow-up actions from all after-action records
      const followUps: FollowUpAction[] = []
      for (const record of data.data) {
        if (record.follow_up_actions) {
          for (const action of record.follow_up_actions) {
            followUps.push({
              id: action.id,
              description: action.description,
              assigned_to: action.assigned_to,
              target_date: action.target_date,
              completed: action.completed,
              source: 'after_action' as const,
            })
          }
        }
      }
      return followUps
    },
    enabled: !!dossierId,
  })

  // Combine and sort all follow-up actions
  const allActions = [...workItems, ...afterActionItems].sort((a, b) => {
    // Incomplete items first
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    // Then by target date
    if (a.target_date && b.target_date) {
      return new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
    }
    return a.target_date ? -1 : 1
  })

  const isLoading = isLoadingWorkItems || isLoadingAfterAction

  // Get priority badge color
  const getPriorityBadge = (priority?: string) => {
    const colors: Record<string, string> = {
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#FollowUpActions
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#FollowUpActions
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#FollowUpActions
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#FollowUpActions
      low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    }
    return colors[priority || 'medium'] || colors.medium
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Show empty state
  if (allActions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
        <div className="mb-4 sm:mb-6">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <ListTodo className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          </div>
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
          {t('sections.engagement.followUpActionsEmpty')}
        </h3>

        <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-6 px-4">
          {t('sections.engagement.followUpActionsEmptyDescription')}
        </p>
      </div>
    )
  }

  // Render follow-up actions list
  return (
    <div className="space-y-3">
      {allActions.map((action) => (
        <Card
          key={action.id}
          className={cn('transition-all hover:shadow-sm', action.completed && 'opacity-60')}
        >
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <div className="pt-0.5">
                {action.completed ? (
                  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#FollowUpActions
                  <CheckSquare className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p
                    className={cn(
                      'text-sm sm:text-base text-start',
                      action.completed && 'line-through text-muted-foreground',
                    )}
                  >
                    {action.description}
                  </p>
                  {action.priority && (
                    <Badge className={cn('text-xs shrink-0', getPriorityBadge(action.priority))}>
                      {String(
                        t(`priority.${action.priority}` as string, {
                          defaultValue: action.priority,
                        }),
                      )}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                  {action.assigned_to && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{action.assigned_to}</span>
                    </div>
                  )}
                  {action.target_date && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {format(new Date(action.target_date), 'PP', { locale: dateLocale })}
                      </span>
                    </div>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {action.source === 'work_item'
                      ? t('sections.engagement.sourceWorkItem', 'Task')
                      : t('sections.engagement.sourceAfterAction', 'After-Action')}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
