/**
 * ConditionBuilder Component
 * Allows users to build conditions for their workflow
 */

import { useTranslation } from 'react-i18next'
import { Plus, Trash2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type {
  WorkflowCondition,
  WorkflowEntityType,
  ConditionLogic,
  ConditionOperator,
} from '@/types/workflow-automation.types'
import {
  getEntityFields,
  getFieldOperators,
  conditionOperators,
  getConditionOperatorOption,
} from './workflow-config'

interface ConditionBuilderProps {
  entityType: WorkflowEntityType
  conditions: WorkflowCondition[]
  conditionLogic: ConditionLogic
  onConditionsChange: (conditions: WorkflowCondition[]) => void
  onLogicChange: (logic: ConditionLogic) => void
}

export function ConditionBuilder({
  entityType,
  conditions,
  conditionLogic,
  onConditionsChange,
  onLogicChange,
}: ConditionBuilderProps) {
  const { t, i18n } = useTranslation('workflow-automation')
  const isRTL = i18n.language === 'ar'

  const availableFields = getEntityFields(entityType)

  const addCondition = () => {
    const newCondition: WorkflowCondition = {
      id: crypto.randomUUID(),
      field: '',
      operator: 'equals',
      value: '',
    }
    onConditionsChange([...conditions, newCondition])
  }

  const updateCondition = (index: number, updates: Partial<WorkflowCondition>) => {
    const updated = conditions.map((c, i) => (i === index ? { ...c, ...updates } : c))
    onConditionsChange(updated)
  }

  const removeCondition = (index: number) => {
    onConditionsChange(conditions.filter((_, i) => i !== index))
  }

  const getAvailableOperators = (fieldName: string) => {
    if (!fieldName) return conditionOperators
    return getFieldOperators(entityType, fieldName)
  }

  const getFieldEnumValues = (fieldName: string) => {
    const field = availableFields.find((f) => f.name === fieldName)
    return field?.enumValues || []
  }

  const renderValueInput = (condition: WorkflowCondition, index: number) => {
    const operatorOption = getConditionOperatorOption(condition.operator)

    // No value needed for is_empty, is_not_empty, has_changed
    if (!operatorOption?.requiresValue) {
      return null
    }

    const field = availableFields.find((f) => f.name === condition.field)
    const enumValues = getFieldEnumValues(condition.field)

    // If field has enum values, show select
    if (enumValues.length > 0) {
      return (
        <Select
          value={String(condition.value || '')}
          onValueChange={(value) => updateCondition(index, { value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t('placeholders.enter_value')} />
          </SelectTrigger>
          <SelectContent>
            {enumValues.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {isRTL ? option.label_ar : option.label_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    // Default text input
    return (
      <Input
        type={field?.type === 'number' ? 'number' : 'text'}
        placeholder={t('placeholders.enter_value')}
        value={String(condition.value || '')}
        onChange={(e) => updateCondition(index, { value: e.target.value })}
      />
    )
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div>
        <h3 className="text-lg font-semibold">{t('builder.ifThese')}</h3>
        <p className="text-sm text-muted-foreground">{t('help.conditions')}</p>
      </div>

      {/* Condition Logic Selector */}
      {conditions.length > 1 && (
        <div className="space-y-2">
          <Label>{t('labels.condition_logic')}</Label>
          <RadioGroup
            value={conditionLogic}
            onValueChange={(value) => onLogicChange(value as ConditionLogic)}
            className="flex flex-col sm:flex-row gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="logic-all" />
              <Label htmlFor="logic-all" className="cursor-pointer">
                {t('conditionLogicOptions.all')}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="any" id="logic-any" />
              <Label htmlFor="logic-any" className="cursor-pointer">
                {t('conditionLogicOptions.any')}
              </Label>
            </div>
          </RadioGroup>
        </div>
      )}

      {/* No Conditions Alert */}
      {conditions.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>{t('builder.noConditions')}</AlertDescription>
        </Alert>
      )}

      {/* Conditions List */}
      <div className="space-y-4">
        {conditions.map((condition, index) => (
          <Card key={condition.id || index}>
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                {/* Field Selector */}
                <div className="flex-1 space-y-2">
                  <Label>{t('labels.field')}</Label>
                  <Select
                    value={condition.field}
                    onValueChange={(value) =>
                      updateCondition(index, { field: value, operator: 'equals', value: '' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('placeholders.select_field')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map((field) => (
                        <SelectItem key={field.name} value={field.name}>
                          {isRTL ? field.label_ar : field.label_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Operator Selector */}
                <div className="flex-1 space-y-2">
                  <Label>{t('labels.operator')}</Label>
                  <Select
                    value={condition.operator}
                    onValueChange={(value) =>
                      updateCondition(index, { operator: value as ConditionOperator })
                    }
                    disabled={!condition.field}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('placeholders.select_operator')} />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableOperators(condition.field).map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {isRTL ? op.label_ar : op.label_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Value Input */}
                <div className="flex-1 space-y-2">
                  <Label>{t('labels.value')}</Label>
                  {renderValueInput(condition, index)}
                </div>

                {/* Remove Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCondition(index)}
                  className="shrink-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Condition Button */}
      <Button variant="outline" onClick={addCondition} className="w-full sm:w-auto">
        <Plus className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
        {t('actions.addCondition')}
      </Button>
    </div>
  )
}
