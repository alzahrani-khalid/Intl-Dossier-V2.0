import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAssignmentQueue } from '../hooks/useAssignmentQueue'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { AlertCircle, Clock, UserPlus } from 'lucide-react'

export function AssignmentQueuePage() {
  const { t, i18n } = useTranslation('assignments')
  const dateLocale = i18n.language === 'ar' ? 'ar-SA' : 'en-US'
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>()
  const [typeFilter, setTypeFilter] = useState<string | undefined>()

  const { data, isLoading, error } = useAssignmentQueue({
    priority: priorityFilter,
    work_item_type: typeFilter,
  })

  const getPriorityColor = (priority: string): string => {
    const colors = {
      urgent: 'bg-danger/10 text-danger dark:bg-danger/30',
      high: 'bg-warning/10 text-warning dark:bg-warning/30',
      normal: 'bg-accent/10 text-accent dark:bg-accent/30',
      low: 'bg-muted text-ink-mute dark:bg-muted/30',
    }
    return colors[priority as keyof typeof colors] || colors.normal
  }

  const urgentCount = data?.items.filter((i) => i.priority === 'urgent').length || 0
  const highCount = data?.items.filter((i) => i.priority === 'high').length || 0
  const normalLowCount =
    data?.items.filter((i) => ['normal', 'low'].includes(i.priority)).length || 0

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error.message || t('queue.error')}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">{t('queue.title')}</h1>
        <p className="mt-1 text-muted-foreground">{t('queue.description')}</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('queue.totalItems')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : data?.total_count || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-danger/20 dark:border-danger/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-danger">
              {t('priority.urgent')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger">{isLoading ? '...' : urgentCount}</div>
          </CardContent>
        </Card>

        <Card className="border-warning/20 dark:border-warning/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-warning">{t('priority.high')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{isLoading ? '...' : highCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('queue.normalLow')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : normalLowCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('queue.filterPriority')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('queue.allPriorities')}</SelectItem>
            <SelectItem value="urgent">{t('priority.urgent')}</SelectItem>
            <SelectItem value="high">{t('priority.high')}</SelectItem>
            <SelectItem value="normal">{t('priority.normal')}</SelectItem>
            <SelectItem value="low">{t('priority.low')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('queue.filterWorkItemType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('queue.allTypes')}</SelectItem>
            <SelectItem value="dossier">{t('queue.types.dossier')}</SelectItem>
            <SelectItem value="ticket">{t('queue.types.ticket')}</SelectItem>
            <SelectItem value="position">{t('queue.types.position')}</SelectItem>
            <SelectItem value="task">{t('queue.types.task')}</SelectItem>
          </SelectContent>
        </Select>

        {(priorityFilter || typeFilter) && (
          <Button
            variant="outline"
            onClick={() => {
              setPriorityFilter(undefined)
              setTypeFilter(undefined)
            }}
          >
            {t('queue.clearFilters')}
          </Button>
        )}
      </div>

      {/* Queue Items */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t('queue.queuedItems')}</h2>
        {isLoading ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              {t('queue.loading')}
            </CardContent>
          </Card>
        ) : data?.items && data.items.length > 0 ? (
          data.items.map((item) => (
            <Card key={item.queue_id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge className={getPriorityColor(item.priority)}>
                        {t(`priority.${item.priority}`, { defaultValue: item.priority })}
                      </Badge>
                      <Badge variant="outline">
                        {t(`queue.types.${item.work_item_type}`, {
                          defaultValue: item.work_item_type,
                        })}
                      </Badge>
                      <Badge variant="secondary">
                        {t('queue.position')} #{item.position}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('queue.workItemId')}: {item.work_item_id}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t('queue.createdAt')}: {new Date(item.queued_at).toLocaleString(dateLocale)}
                    </p>
                    {item.required_skills && item.required_skills.length > 0 && (
                      <div className="mt-2">
                        <p className="mb-1 text-xs text-muted-foreground">
                          {t('queue.requiredSkills')}:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {item.required_skills.map((skill) => (
                            <Badge key={skill.skill_id} variant="outline" className="text-xs">
                              {skill.skill_name_en}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 text-end">
                    {/* Disabled until a manual-assignment flow exists (inspection #3):
                        the button had no handler and assignments-manual-override is
                        not contract-safe against the generated assignments schema */}
                    <Button
                      size="sm"
                      className="gap-2"
                      disabled
                      title={t('queue.assignNotAvailable')}
                    >
                      <UserPlus className="size-4" />
                      {t('queue.assign')}
                    </Button>
                    {item.attempts > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {t('queue.failedAttempts', { count: item.attempts })}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <Clock className="mx-auto mb-2 size-12 text-accent" />
              <p>{t('queue.emptyQueue')}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
