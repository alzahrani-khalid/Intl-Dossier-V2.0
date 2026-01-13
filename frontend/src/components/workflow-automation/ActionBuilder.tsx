/**
 * ActionBuilder Component
 * Allows users to build actions for their workflow
 */

import { useTranslation } from 'react-i18next'
import {
  Plus,
  Trash2,
  GripVertical,
  Bell,
  Users,
  UserCheck,
  Mail,
  UserPlus,
  UserCog,
  RefreshCw,
  ArrowUpCircle,
  Edit3,
  Tag,
  ListPlus,
  MessageSquarePlus,
  Webhook,
  Timer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type {
  WorkflowAction,
  WorkflowActionType,
  ActionConfig,
} from '@/types/workflow-automation.types'
import { actionTypes, getActionTypeOption, getActionsByCategory } from './workflow-config'

interface ActionBuilderProps {
  actions: WorkflowAction[]
  onActionsChange: (actions: WorkflowAction[]) => void
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Bell,
  Users,
  UserCheck,
  Mail,
  UserPlus,
  UserCog,
  RefreshCw,
  ArrowUpCircle,
  Edit3,
  Tag,
  TagOff: Tag, // Use Tag as fallback
  ListPlus,
  MessageSquarePlus,
  Webhook,
  Timer,
}

export function ActionBuilder({ actions, onActionsChange }: ActionBuilderProps) {
  const { t, i18n } = useTranslation('workflow-automation')
  const isRTL = i18n.language === 'ar'

  const addAction = (type: WorkflowActionType) => {
    const newAction: WorkflowAction = {
      id: crypto.randomUUID(),
      type,
      config: {},
    }
    onActionsChange([...actions, newAction])
  }

  const updateAction = (index: number, updates: Partial<WorkflowAction>) => {
    const updated = actions.map((a, i) => (i === index ? { ...a, ...updates } : a))
    onActionsChange(updated)
  }

  const updateActionConfig = (index: number, configUpdates: Partial<ActionConfig>) => {
    const updated = actions.map((a, i) =>
      i === index ? { ...a, config: { ...a.config, ...configUpdates } } : a,
    )
    onActionsChange(updated)
  }

  const removeAction = (index: number) => {
    onActionsChange(actions.filter((_, i) => i !== index))
  }

  const moveAction = (fromIndex: number, toIndex: number) => {
    const updated = [...actions]
    const [moved] = updated.splice(fromIndex, 1)
    updated.splice(toIndex, 0, moved)
    onActionsChange(updated)
  }

  const renderActionConfig = (action: WorkflowAction, index: number) => {
    const actionOption = getActionTypeOption(action.type)
    if (!actionOption) return null

    return (
      <div className="space-y-3 mt-4 pt-4 border-t">
        {actionOption.configFields.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={`${action.id}-${field.name}`}>
              {isRTL ? field.label_ar : field.label_en}
              {field.required && <span className="text-destructive">*</span>}
            </Label>

            {field.type === 'select' ? (
              <Select
                value={String(action.config[field.name] || '')}
                onValueChange={(value) => updateActionConfig(index, { [field.name]: value })}
              >
                <SelectTrigger id={`${action.id}-${field.name}`}>
                  <SelectValue
                    placeholder={
                      isRTL
                        ? field.placeholder_ar
                        : field.placeholder_en || t('placeholders.enter_value')
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {isRTL ? option.label_ar : option.label_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.type === 'priority' ? (
              <Select
                value={String(action.config[field.name] || '')}
                onValueChange={(value) => updateActionConfig(index, { [field.name]: value })}
              >
                <SelectTrigger id={`${action.id}-${field.name}`}>
                  <SelectValue placeholder={t('placeholders.enter_value')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    {t('priority.low', { ns: 'unified-kanban', defaultValue: 'Low' })}
                  </SelectItem>
                  <SelectItem value="medium">
                    {t('priority.medium', { ns: 'unified-kanban', defaultValue: 'Medium' })}
                  </SelectItem>
                  <SelectItem value="high">
                    {t('priority.high', { ns: 'unified-kanban', defaultValue: 'High' })}
                  </SelectItem>
                  <SelectItem value="urgent">
                    {t('priority.urgent', { ns: 'unified-kanban', defaultValue: 'Urgent' })}
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : field.type === 'status' ? (
              <Select
                value={String(action.config[field.name] || '')}
                onValueChange={(value) => updateActionConfig(index, { [field.name]: value })}
              >
                <SelectTrigger id={`${action.id}-${field.name}`}>
                  <SelectValue placeholder={t('placeholders.enter_value')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">
                    {t('status.pending', { ns: 'unified-kanban', defaultValue: 'Pending' })}
                  </SelectItem>
                  <SelectItem value="in_progress">
                    {t('status.in_progress', { ns: 'unified-kanban', defaultValue: 'In Progress' })}
                  </SelectItem>
                  <SelectItem value="review">
                    {t('status.review', { ns: 'unified-kanban', defaultValue: 'Review' })}
                  </SelectItem>
                  <SelectItem value="completed">
                    {t('status.completed', { ns: 'unified-kanban', defaultValue: 'Completed' })}
                  </SelectItem>
                  <SelectItem value="cancelled">
                    {t('status.cancelled', { ns: 'unified-kanban', defaultValue: 'Cancelled' })}
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={`${action.id}-${field.name}`}
                type={field.type === 'number' ? 'number' : 'text'}
                placeholder={isRTL ? field.placeholder_ar : field.placeholder_en}
                value={String(action.config[field.name] || '')}
                onChange={(e) =>
                  updateActionConfig(index, {
                    [field.name]:
                      field.type === 'number' ? parseInt(e.target.value) : e.target.value,
                  })
                }
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  const categories = ['notification', 'assignment', 'update', 'create', 'external', 'control']

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div>
        <h3 className="text-lg font-semibold">{t('builder.thenDo')}</h3>
        <p className="text-sm text-muted-foreground">{t('help.actions')}</p>
      </div>

      {/* No Actions Alert */}
      {actions.length === 0 && (
        <Alert variant="destructive">
          <AlertDescription>{t('builder.noActions')}</AlertDescription>
        </Alert>
      )}

      {/* Actions List */}
      <div className="space-y-4">
        {actions.map((action, index) => {
          const actionOption = getActionTypeOption(action.type)
          const Icon = iconMap[actionOption?.icon || 'Bell'] || Bell

          return (
            <Card key={action.id || index}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">
                        {isRTL ? actionOption?.label_ar : actionOption?.label_en}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {t('labels.action_type')} {index + 1}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {index > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveAction(index, index - 1)}
                        className="h-8 w-8"
                      >
                        <GripVertical className="h-4 w-4 rotate-90" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAction(index)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">{renderActionConfig(action, index)}</CardContent>
            </Card>
          )
        })}
      </div>

      {/* Add Action */}
      <div className="space-y-4">
        <Label>{t('actions.addAction')}</Label>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const categoryActions = getActionsByCategory(category)
            if (categoryActions.length === 0) return null

            return (
              <div key={category} className="space-y-2">
                <h5 className="text-xs font-medium text-muted-foreground uppercase">
                  {t(`categories.${category}`)}
                </h5>
                <div className="flex flex-wrap gap-2">
                  {categoryActions.map((actionType) => {
                    const Icon = iconMap[actionType.icon] || Bell
                    return (
                      <Button
                        key={actionType.value}
                        variant="outline"
                        size="sm"
                        onClick={() => addAction(actionType.value)}
                        className="flex items-center gap-1"
                      >
                        <Icon className="h-3 w-3" />
                        {isRTL ? actionType.label_ar : actionType.label_en}
                      </Button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
