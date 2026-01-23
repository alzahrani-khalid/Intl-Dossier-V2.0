/**
 * WorkflowExecutionsList Component
 * Displays execution history for workflow rules
 */

import { useTranslation } from 'react-i18next'
import { formatDistanceToNow, format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Skeleton } from '@/components/ui/skeleton'
import { useWorkflowExecutions, useRetryWorkflowExecution } from '@/hooks/useWorkflowAutomation'
import type { WorkflowExecution, WorkflowExecutionStatus } from '@/types/workflow-automation.types'

interface WorkflowExecutionsListProps {
  ruleId?: string
}

const statusConfig: Record<
  WorkflowExecutionStatus,
  { icon: typeof CheckCircle2; color: string; bgColor: string }
> = {
  completed: { icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-100' },
  failed: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
  running: { icon: Loader2, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  pending: { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  cancelled: { icon: XCircle, color: 'text-gray-600', bgColor: 'bg-gray-100' },
  paused: { icon: Clock, color: 'text-orange-600', bgColor: 'bg-orange-100' },
}

export function WorkflowExecutionsList({ ruleId }: WorkflowExecutionsListProps) {
  const { t, i18n } = useTranslation('workflow-automation')
  const isRTL = i18n.language === 'ar'
  const locale = isRTL ? ar : enUS

  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useWorkflowExecutions({
    rule_id: ruleId,
    limit: 50,
  })

  const retryMutation = useRetryWorkflowExecution()

  const handleRetry = (executionId: string) => {
    retryMutation.mutate(executionId, {
      onSuccess: () => refetch(),
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="py-12 text-center">
        <p className="text-destructive">{t('messages.error')}</p>
        <Button variant="outline" onClick={() => refetch()} className="mt-4">
          {t('actions.retry')}
        </Button>
      </div>
    )
  }

  if (!data?.data.length) {
    return (
      <div className="py-12 text-center">
        <Clock className="mx-auto mb-4 size-12 text-muted-foreground" />
        <h3 className="text-lg font-semibold">{t('messages.noExecutions')}</h3>
      </div>
    )
  }

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <h2 className="text-lg font-semibold">{t('headings.executions')}</h2>

      {data.data.map((execution) => (
        <ExecutionCard
          key={execution.id}
          execution={execution}
          isExpanded={expandedId === execution.id}
          onToggle={() => setExpandedId(expandedId === execution.id ? null : execution.id)}
          onRetry={() => handleRetry(execution.id)}
          isRetrying={retryMutation.isPending}
          isRTL={isRTL}
          locale={locale}
          t={t}
        />
      ))}
    </div>
  )
}

interface ExecutionCardProps {
  execution: WorkflowExecution
  isExpanded: boolean
  onToggle: () => void
  onRetry: () => void
  isRetrying: boolean
  isRTL: boolean
  locale: Locale
  t: (key: string, options?: Record<string, unknown>) => string
}

function ExecutionCard({
  execution,
  isExpanded,
  onToggle,
  onRetry,
  isRetrying,
  isRTL,
  locale,
  t,
}: ExecutionCardProps) {
  const config = statusConfig[execution.status]
  const StatusIcon = config.icon

  const ruleName = isRTL ? execution.workflow_rules?.name_ar : execution.workflow_rules?.name_en

  return (
    <Card>
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${config.bgColor}`}>
                <StatusIcon
                  className={`size-4 ${config.color} ${
                    execution.status === 'running' ? 'animate-spin' : ''
                  }`}
                />
              </div>
              <div>
                <h4 className="text-sm font-medium">{ruleName || execution.rule_id}</h4>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(execution.created_at), {
                    addSuffix: true,
                    locale,
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={execution.status === 'completed' ? 'default' : 'secondary'}>
                {t(`executionStatus.${execution.status}`)}
              </Badge>

              {execution.status === 'failed' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRetry()
                  }}
                  disabled={isRetrying}
                >
                  <RotateCcw className={`size-3 ${isRTL ? 'ms-1' : 'me-1'}`} />
                  {t('actions.retry')}
                </Button>
              )}

              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  {isExpanded ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="mt-2 border-t pt-0">
            <div className="space-y-4 pt-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('labels.executions')}</span>
                  <p className="font-medium">{execution.actions_executed}</p>
                </div>
                <div>
                  <span className="text-green-600 text-muted-foreground">
                    {t('executionStatus.completed')}
                  </span>
                  <p className="font-medium text-green-600">{execution.actions_succeeded}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-red-600">
                    {t('executionStatus.failed')}
                  </span>
                  <p className="font-medium text-red-600">{execution.actions_failed}</p>
                </div>
              </div>

              {/* Duration */}
              {execution.duration_ms && (
                <div className="text-sm">
                  <span className="text-muted-foreground">{t('stats.avgDuration')}: </span>
                  <span className="font-medium">{execution.duration_ms}ms</span>
                </div>
              )}

              {/* Error Message */}
              {execution.error_message && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm">
                  <p className="font-medium text-destructive">{t('messages.error')}</p>
                  <p className="mt-1 text-destructive/80">{execution.error_message}</p>
                </div>
              )}

              {/* Execution Log */}
              {execution.execution_log.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">{t('test.actionsToExecute')}</h5>
                  <div className="space-y-2">
                    {execution.execution_log.map((entry, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded bg-muted/50 p-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          {entry.status === 'success' ? (
                            <CheckCircle2 className="size-3 text-green-600" />
                          ) : entry.status === 'failed' ? (
                            <XCircle className="size-3 text-red-600" />
                          ) : (
                            <Clock className="size-3 text-gray-600" />
                          )}
                          <span>{entry.type}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {format(new Date(entry.executed_at), 'HH:mm:ss', { locale })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trigger Context */}
              {Object.keys(execution.trigger_context).length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Trigger Context</h5>
                  <pre className="overflow-auto rounded bg-muted p-2 text-xs">
                    {JSON.stringify(execution.trigger_context, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
