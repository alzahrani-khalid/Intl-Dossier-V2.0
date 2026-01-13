/**
 * TriggerSelector Component
 * Allows users to select a trigger type for their workflow
 */

import { useTranslation } from 'react-i18next'
import {
  Plus,
  Edit,
  ArrowRightLeft,
  UserCheck,
  AlertTriangle,
  FileEdit,
  MessageSquare,
  Upload,
  Handshake,
  CheckSquare,
  Clock,
  AlertCircle,
  CalendarClock,
  Calendar,
  Hand,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { WorkflowTriggerType, TriggerConfig } from '@/types/workflow-automation.types'
import { triggerTypes, getTriggersByCategory } from './workflow-config'

interface TriggerSelectorProps {
  selectedTrigger: WorkflowTriggerType | null
  triggerConfig: TriggerConfig
  onSelectTrigger: (trigger: WorkflowTriggerType) => void
  onConfigChange: (config: TriggerConfig) => void
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Plus,
  Edit,
  ArrowRightLeft,
  UserCheck,
  AlertTriangle,
  FileEdit,
  MessageSquare,
  Upload,
  Handshake,
  CheckSquare,
  Clock,
  AlertCircle,
  CalendarClock,
  Calendar,
  Hand,
}

export function TriggerSelector({
  selectedTrigger,
  triggerConfig,
  onSelectTrigger,
  onConfigChange,
}: TriggerSelectorProps) {
  const { t, i18n } = useTranslation('workflow-automation')
  const isRTL = i18n.language === 'ar'

  const eventTriggers = getTriggersByCategory('event')
  const timeTriggers = getTriggersByCategory('time')
  const manualTriggers = getTriggersByCategory('manual')

  const renderTriggerOption = (trigger: (typeof triggerTypes)[0]) => {
    const Icon = iconMap[trigger.icon] || AlertCircle
    const isSelected = selectedTrigger === trigger.value

    return (
      <Card
        key={trigger.value}
        className={cn(
          'cursor-pointer transition-all hover:border-primary',
          isSelected && 'border-primary ring-2 ring-primary/20',
        )}
        onClick={() => onSelectTrigger(trigger.value)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'p-2 rounded-lg',
                isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted',
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm">{isRTL ? trigger.label_ar : trigger.label_en}</h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {isRTL ? trigger.description_ar : trigger.description_en}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div>
        <h3 className="text-lg font-semibold">{t('builder.whenThis')}</h3>
        <p className="text-sm text-muted-foreground">{t('help.trigger')}</p>
      </div>

      {/* Event Triggers */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">{t('categories.event')}</h4>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {eventTriggers.map(renderTriggerOption)}
        </div>
      </div>

      {/* Time-based Triggers */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">{t('categories.time')}</h4>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {timeTriggers.map(renderTriggerOption)}
        </div>
      </div>

      {/* Manual Trigger */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">{t('categories.manual')}</h4>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {manualTriggers.map(renderTriggerOption)}
        </div>
      </div>

      {/* Trigger-specific configuration */}
      {selectedTrigger === 'deadline_approaching' && (
        <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
          <h4 className="font-medium">{t('labels.configuration')}</h4>
          <div className="space-y-2">
            <Label htmlFor="deadline_days">{t('labels.deadline_days')}</Label>
            <Input
              id="deadline_days"
              type="number"
              min={1}
              max={30}
              value={(triggerConfig as { deadline_days_before?: number }).deadline_days_before || 3}
              onChange={(e) =>
                onConfigChange({
                  ...triggerConfig,
                  deadline_days_before: parseInt(e.target.value) || 3,
                })
              }
              className="max-w-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              {t('help.deadline_days', { defaultValue: 'Days before deadline to trigger' })}
            </p>
          </div>
        </div>
      )}

      {selectedTrigger === 'schedule_cron' && (
        <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
          <h4 className="font-medium">{t('labels.configuration')}</h4>
          <div className="space-y-2">
            <Label htmlFor="cron_expression">{t('labels.cron_expression')}</Label>
            <Input
              id="cron_expression"
              type="text"
              placeholder={t('placeholders.cron_expression')}
              value={(triggerConfig as { cron_expression?: string }).cron_expression || ''}
              onChange={(e) =>
                onConfigChange({
                  ...triggerConfig,
                  cron_expression: e.target.value,
                })
              }
              className="max-w-[300px] font-mono"
            />
            <p className="text-xs text-muted-foreground">{t('help.cronExpression')}</p>
          </div>
        </div>
      )}

      {selectedTrigger === 'field_changed' && (
        <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
          <h4 className="font-medium">{t('labels.configuration')}</h4>
          <div className="space-y-2">
            <Label htmlFor="field_name">{t('labels.field')}</Label>
            <Input
              id="field_name"
              type="text"
              placeholder={t('placeholders.select_field')}
              value={(triggerConfig as { field_name?: string }).field_name || ''}
              onChange={(e) =>
                onConfigChange({
                  ...triggerConfig,
                  field_name: e.target.value,
                })
              }
              className="max-w-[300px]"
            />
          </div>
        </div>
      )}
    </div>
  )
}
