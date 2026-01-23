/**
 * WorkflowRuleCard Component
 * Displays a single workflow rule in a card format
 */

import { useTranslation } from 'react-i18next'
import { formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import {
  MoreHorizontal,
  Play,
  Pause,
  Copy,
  Trash2,
  Settings,
  History,
  Zap,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { WorkflowRule } from '@/types/workflow-automation.types'
import { getTriggerTypeOption, getEntityTypeOption } from './workflow-config'

interface WorkflowRuleCardProps {
  rule: WorkflowRule
  onEdit: (rule: WorkflowRule) => void
  onDelete: (rule: WorkflowRule) => void
  onDuplicate: (rule: WorkflowRule) => void
  onToggle: (rule: WorkflowRule) => void
  onViewExecutions: (rule: WorkflowRule) => void
  onTest: (rule: WorkflowRule) => void
}

export function WorkflowRuleCard({
  rule,
  onEdit,
  onDelete,
  onDuplicate,
  onToggle,
  onViewExecutions,
  onTest,
}: WorkflowRuleCardProps) {
  const { t, i18n } = useTranslation('workflow-automation')
  const isRTL = i18n.language === 'ar'
  const locale = isRTL ? ar : enUS

  const triggerOption = getTriggerTypeOption(rule.trigger_type)
  const entityOption = getEntityTypeOption(rule.entity_type)

  const name = isRTL ? rule.name_ar : rule.name_en
  const description = isRTL ? rule.description_ar : rule.description_en
  const triggerLabel = isRTL ? triggerOption?.label_ar : triggerOption?.label_en
  const entityLabel = isRTL ? entityOption?.label_ar : entityOption?.label_en

  return (
    <Card
      className={`group transition-all hover:shadow-md ${
        rule.is_active ? 'border-s-4 border-s-green-500' : 'opacity-60'
      }`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold">{name}</h3>
              {rule.is_active ? (
                <Badge variant="default\" className="bg-green-500">
                  {t('filters.active')}
                </Badge>
              ) : (
                <Badge variant="secondary">{t('filters.inactive')}</Badge>
              )}
            </div>
            {description && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={rule.is_active}
              onCheckedChange={() => onToggle(rule)}
              aria-label={rule.is_active ? t('actions.deactivate') : t('actions.activate')}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                <DropdownMenuItem onClick={() => onEdit(rule)}>
                  <Settings className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                  {t('actions.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTest(rule)}>
                  <Play className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                  {t('actions.test')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewExecutions(rule)}>
                  <History className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                  {t('actions.viewExecutions')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDuplicate(rule)}>
                  <Copy className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                  {t('actions.duplicate')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(rule)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                  {t('actions.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {/* Trigger Badge */}
          <Badge variant="outline" className="flex items-center gap-1">
            <Zap className="size-3" />
            {triggerLabel}
          </Badge>

          {/* Entity Badge */}
          <Badge variant="outline">{entityLabel}</Badge>

          {/* Conditions Count */}
          {rule.conditions.length > 0 && (
            <Badge variant="secondary">
              {rule.conditions.length} {t('labels.conditions')}
            </Badge>
          )}

          {/* Actions Count */}
          <Badge variant="secondary">
            {rule.actions.length} {t('labels.actions')}
          </Badge>
        </div>

        {/* Last Triggered */}
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="size-3" />
            {rule.last_triggered_at ? (
              <span>
                {t('labels.last_triggered')}:{' '}
                {formatDistanceToNow(new Date(rule.last_triggered_at), {
                  addSuffix: true,
                  locale,
                })}
              </span>
            ) : (
              <span>{t('messages.noExecutions')}</span>
            )}
          </div>

          {rule.cron_expression && (
            <Badge variant="outline" className="text-xs">
              {rule.cron_expression}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
