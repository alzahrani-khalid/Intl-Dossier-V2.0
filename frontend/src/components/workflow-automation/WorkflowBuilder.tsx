/**
 * WorkflowBuilder Component
 * Multi-step wizard for creating and editing workflow rules
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Zap,
  Filter,
  Play,
  Settings,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useCreateWorkflowRule, useUpdateWorkflowRule } from '@/hooks/useWorkflowAutomation'
import type {
  WorkflowRule,
  WorkflowRuleCreate,
  WorkflowTriggerType,
  WorkflowEntityType,
  WorkflowCondition,
  WorkflowAction,
  TriggerConfig,
  ConditionLogic,
} from '@/types/workflow-automation.types'
import { TriggerSelector } from './TriggerSelector'
import { ConditionBuilder } from './ConditionBuilder'
import { ActionBuilder } from './ActionBuilder'
import { entityTypes, getTriggerTypeOption, getEntityTypeOption } from './workflow-config'

type BuilderStep = 'trigger' | 'conditions' | 'actions' | 'settings' | 'review'

const steps: BuilderStep[] = ['trigger', 'conditions', 'actions', 'settings', 'review']

const stepIcons: Record<BuilderStep, typeof Zap> = {
  trigger: Zap,
  conditions: Filter,
  actions: Play,
  settings: Settings,
  review: CheckCircle,
}

interface WorkflowBuilderProps {
  rule?: WorkflowRule | null
  onSave: () => void
  onCancel: () => void
}

export function WorkflowBuilder({ rule, onSave, onCancel }: WorkflowBuilderProps) {
  const { t, i18n } = useTranslation('workflow-automation')
  const isRTL = i18n.language === 'ar'

  const isEditing = !!rule

  // Step state
  const [currentStep, setCurrentStep] = useState<BuilderStep>('trigger')

  // Form state
  const [nameEn, setNameEn] = useState(rule?.name_en || '')
  const [nameAr, setNameAr] = useState(rule?.name_ar || '')
  const [descriptionEn, setDescriptionEn] = useState(rule?.description_en || '')
  const [descriptionAr, setDescriptionAr] = useState(rule?.description_ar || '')
  const [triggerType, setTriggerType] = useState<WorkflowTriggerType | null>(
    rule?.trigger_type || null,
  )
  const [triggerConfig, setTriggerConfig] = useState<TriggerConfig>(rule?.trigger_config || {})
  const [entityType, setEntityType] = useState<WorkflowEntityType | null>(rule?.entity_type || null)
  const [conditions, setConditions] = useState<WorkflowCondition[]>(rule?.conditions || [])
  const [conditionLogic, setConditionLogic] = useState<ConditionLogic>(
    rule?.condition_logic || 'all',
  )
  const [actions, setActions] = useState<WorkflowAction[]>(rule?.actions || [])
  const [isActive, setIsActive] = useState(rule?.is_active ?? true)
  const [runOncePerEntity, setRunOncePerEntity] = useState(rule?.run_once_per_entity ?? false)
  const [maxExecutionsPerHour, setMaxExecutionsPerHour] = useState(
    rule?.max_executions_per_hour ?? 100,
  )
  const [cooldownMinutes, setCooldownMinutes] = useState(rule?.cooldown_minutes ?? 0)

  // Mutations
  const createMutation = useCreateWorkflowRule()
  const updateMutation = useUpdateWorkflowRule()

  const isSaving = createMutation.isPending || updateMutation.isPending

  // Validation
  const canProceed = (step: BuilderStep): boolean => {
    switch (step) {
      case 'trigger':
        return !!triggerType && !!entityType
      case 'conditions':
        return true // Conditions are optional
      case 'actions':
        return actions.length > 0
      case 'settings':
        return !!nameEn && !!nameAr
      case 'review':
        return true
      default:
        return false
    }
  }

  const getCurrentStepIndex = () => steps.indexOf(currentStep)

  const goToNextStep = () => {
    const currentIndex = getCurrentStepIndex()
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
    }
  }

  const goToPreviousStep = () => {
    const currentIndex = getCurrentStepIndex()
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }

  const handleSave = () => {
    const ruleData: WorkflowRuleCreate = {
      name_en: nameEn,
      name_ar: nameAr,
      description_en: descriptionEn || undefined,
      description_ar: descriptionAr || undefined,
      trigger_type: triggerType!,
      trigger_config: triggerConfig,
      entity_type: entityType!,
      conditions,
      condition_logic: conditionLogic,
      actions,
      is_active: isActive,
      run_once_per_entity: runOncePerEntity,
      max_executions_per_hour: maxExecutionsPerHour,
      cooldown_minutes: cooldownMinutes,
    }

    if (isEditing && rule) {
      updateMutation.mutate({ id: rule.id, data: ruleData }, { onSuccess: onSave })
    } else {
      createMutation.mutate(ruleData, { onSuccess: onSave })
    }
  }

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'trigger':
        return (
          <div className="space-y-6">
            {/* Entity Type Selection */}
            <div className="space-y-2">
              <Label>{t('labels.entity_type')}</Label>
              <Select
                value={entityType || ''}
                onValueChange={(value) => setEntityType(value as WorkflowEntityType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('placeholders.select_entity')} />
                </SelectTrigger>
                <SelectContent>
                  {entityTypes.map((entity) => (
                    <SelectItem key={entity.value} value={entity.value}>
                      {isRTL ? entity.label_ar : entity.label_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Trigger Selection */}
            <TriggerSelector
              selectedTrigger={triggerType}
              triggerConfig={triggerConfig}
              onSelectTrigger={setTriggerType}
              onConfigChange={setTriggerConfig}
            />
          </div>
        )

      case 'conditions':
        return (
          <ConditionBuilder
            entityType={entityType!}
            conditions={conditions}
            conditionLogic={conditionLogic}
            onConditionsChange={setConditions}
            onLogicChange={setConditionLogic}
          />
        )

      case 'actions':
        return <ActionBuilder actions={actions} onActionsChange={setActions} />

      case 'settings':
        return (
          <div className="space-y-6">
            {/* Names */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name_en">
                  {t('labels.name_en')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name_en"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder={t('placeholders.name_en')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_ar">
                  {t('labels.name_ar')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name_ar"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder={t('placeholders.name_ar')}
                  dir="rtl"
                />
              </div>
            </div>

            {/* Descriptions */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="description_en">{t('labels.description_en')}</Label>
                <Textarea
                  id="description_en"
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  placeholder={t('placeholders.description_en')}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description_ar">{t('labels.description_ar')}</Label>
                <Textarea
                  id="description_ar"
                  value={descriptionAr}
                  onChange={(e) => setDescriptionAr(e.target.value)}
                  placeholder={t('placeholders.description_ar')}
                  rows={3}
                  dir="rtl"
                />
              </div>
            </div>

            {/* Execution Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('labels.settings')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_active">{t('labels.is_active')}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t('help.isActive', { defaultValue: 'Enable or disable this workflow' })}
                    </p>
                  </div>
                  <Switch id="is_active" checked={isActive} onCheckedChange={setIsActive} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="run_once">{t('labels.run_once')}</Label>
                    <p className="text-xs text-muted-foreground">{t('help.runOnce')}</p>
                  </div>
                  <Switch
                    id="run_once"
                    checked={runOncePerEntity}
                    onCheckedChange={setRunOncePerEntity}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="max_executions">{t('labels.max_executions')}</Label>
                    <Input
                      id="max_executions"
                      type="number"
                      min={1}
                      max={1000}
                      value={maxExecutionsPerHour}
                      onChange={(e) => setMaxExecutionsPerHour(parseInt(e.target.value) || 100)}
                    />
                    <p className="text-xs text-muted-foreground">{t('help.maxExecutions')}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cooldown">{t('labels.cooldown')}</Label>
                    <Input
                      id="cooldown"
                      type="number"
                      min={0}
                      max={1440}
                      value={cooldownMinutes}
                      onChange={(e) => setCooldownMinutes(parseInt(e.target.value) || 0)}
                    />
                    <p className="text-xs text-muted-foreground">{t('help.cooldown')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'review':
        const triggerOption = getTriggerTypeOption(triggerType!)
        const entityOption = getEntityTypeOption(entityType!)

        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{isRTL ? nameAr : nameEn}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="text-sm text-muted-foreground">{t('labels.trigger')}</span>
                    <p className="font-medium">
                      {isRTL ? triggerOption?.label_ar : triggerOption?.label_en}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">{t('labels.entity_type')}</span>
                    <p className="font-medium">
                      {isRTL ? entityOption?.label_ar : entityOption?.label_en}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="text-sm text-muted-foreground">{t('labels.conditions')}</span>
                    <p className="font-medium">
                      {conditions.length === 0
                        ? t('builder.noConditions')
                        : `${conditions.length} ${t('labels.conditions')}`}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">{t('labels.actions')}</span>
                    <p className="font-medium">
                      {actions.length} {t('labels.actions')}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {(descriptionEn || descriptionAr) && (
                  <div>
                    <span className="text-sm text-muted-foreground">{t('labels.description')}</span>
                    <p className="mt-1">{isRTL ? descriptionAr : descriptionEn}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          {isEditing ? t('headings.edit') : t('headings.create')}
        </h1>
        <p className="text-muted-foreground mt-1">{t(`builder.stepDescriptions.${currentStep}`)}</p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const StepIcon = stepIcons[step]
          const isActive = step === currentStep
          const isCompleted = index < getCurrentStepIndex()
          const isClickable = index <= getCurrentStepIndex() || canProceed(steps[index - 1])

          return (
            <div key={step} className="flex items-center">
              <button
                type="button"
                onClick={() => isClickable && setCurrentStep(step)}
                disabled={!isClickable}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-lg transition-colors',
                  isActive && 'bg-primary text-primary-foreground',
                  isCompleted && !isActive && 'text-primary',
                  !isActive && !isCompleted && 'text-muted-foreground',
                  isClickable && 'cursor-pointer hover:bg-muted',
                  !isClickable && 'cursor-not-allowed opacity-50',
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full',
                    isActive && 'bg-primary-foreground text-primary',
                    isCompleted && !isActive && 'bg-primary/10',
                    !isActive && !isCompleted && 'bg-muted',
                  )}
                >
                  {isCompleted && !isActive ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <StepIcon className="h-4 w-4" />
                  )}
                </div>
                <span className="hidden sm:inline text-sm font-medium">
                  {t(`builder.steps.${step}`)}
                </span>
              </button>

              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 w-8 sm:w-12 lg:w-16 mx-2',
                    index < getCurrentStepIndex() ? 'bg-primary' : 'bg-muted',
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Step content */}
      <div className="min-h-[400px]">{renderStepContent()}</div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          {t('actions.cancel')}
        </Button>

        <div className="flex items-center gap-2">
          {currentStep !== 'trigger' && (
            <Button variant="outline" onClick={goToPreviousStep}>
              {isRTL ? (
                <ChevronRight className="h-4 w-4 me-2" />
              ) : (
                <ChevronLeft className="h-4 w-4 me-2" />
              )}
              {t('actions.back')}
            </Button>
          )}

          {currentStep === 'review' ? (
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && (
                <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ms-2' : 'me-2'}`} />
              )}
              {t('actions.save')}
            </Button>
          ) : (
            <Button onClick={goToNextStep} disabled={!canProceed(currentStep)}>
              {t('actions.next')}
              {isRTL ? (
                <ChevronLeft className="h-4 w-4 ms-2" />
              ) : (
                <ChevronRight className="h-4 w-4 ms-2" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
