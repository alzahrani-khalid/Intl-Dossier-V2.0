/**
 * BooleanLogicBuilder Component
 * Feature: advanced-search-filters
 * Description: Build complex filter conditions with AND/OR/NOT logic
 */

import { useTranslation } from 'react-i18next'
import { Plus, X, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type {
  FilterCondition,
  FilterOperator,
  SearchableEntityType,
  LogicOperator,
} from '@/types/advanced-search.types'
import {
  SEARCHABLE_FIELDS,
  getFieldsForEntityTypes,
  getOperatorsForFieldType,
} from '@/types/advanced-search.types'

interface BooleanLogicBuilderProps {
  conditions: FilterCondition[]
  entityTypes: SearchableEntityType[]
  logic: LogicOperator
  onConditionAdd: (condition: FilterCondition) => void
  onConditionUpdate: (index: number, condition: FilterCondition) => void
  onConditionRemove: (index: number) => void
  onLogicChange: (logic: LogicOperator) => void
  onClear: () => void
  className?: string
}

export function BooleanLogicBuilder({
  conditions,
  entityTypes,
  logic,
  onConditionAdd,
  onConditionUpdate,
  onConditionRemove,
  onLogicChange,
  onClear,
  className,
}: BooleanLogicBuilderProps) {
  const { t, i18n } = useTranslation('advanced-search')
  const isRTL = i18n.language === 'ar'

  const availableFields = getFieldsForEntityTypes(entityTypes)

  const handleAddCondition = () => {
    if (availableFields.length === 0) return

    const firstField = availableFields[0]
    const operators = getOperatorsForFieldType(firstField.type)

    onConditionAdd({
      field_name: firstField.name,
      operator: operators[0]?.value || 'equals',
      value: '',
      is_negated: false,
    })
  }

  const handleFieldChange = (index: number, fieldName: string) => {
    const field = availableFields.find((f) => f.name === fieldName)
    if (!field) return

    const operators = getOperatorsForFieldType(field.type)
    const currentCondition = conditions[index]

    onConditionUpdate(index, {
      ...currentCondition,
      field_name: fieldName,
      operator: operators[0]?.value || 'equals',
      value: field.type === 'boolean' ? false : '',
    })
  }

  const handleOperatorChange = (index: number, operator: FilterOperator) => {
    onConditionUpdate(index, {
      ...conditions[index],
      operator,
    })
  }

  const handleValueChange = (index: number, value: unknown) => {
    onConditionUpdate(index, {
      ...conditions[index],
      value,
    })
  }

  const handleToggleNegate = (index: number) => {
    onConditionUpdate(index, {
      ...conditions[index],
      is_negated: !conditions[index].is_negated,
    })
  }

  const renderValueInput = (condition: FilterCondition, index: number) => {
    const field = availableFields.find((f) => f.name === condition.field_name)
    if (!field) return null

    // Null operators don't need a value
    if (condition.operator === 'is_null' || condition.operator === 'is_not_null') {
      return null
    }

    switch (field.type) {
      case 'select':
        return (
          <Select
            value={condition.value as string}
            onValueChange={(value) => handleValueChange(index, value)}
          >
            <SelectTrigger className="flex-1 min-h-10">
              <SelectValue placeholder={t('conditions.placeholder')} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {isRTL ? option.label_ar : option.label_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'multi-select':
        return (
          <Input
            type="text"
            value={
              Array.isArray(condition.value)
                ? (condition.value as string[]).join(', ')
                : (condition.value as string) || ''
            }
            onChange={(e) =>
              handleValueChange(
                index,
                e.target.value
                  .split(',')
                  .map((v) => v.trim())
                  .filter(Boolean),
              )
            }
            placeholder={t('conditions.placeholder')}
            className="flex-1 min-h-10"
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            value={(condition.value as number) || ''}
            onChange={(e) => handleValueChange(index, e.target.value ? Number(e.target.value) : '')}
            placeholder={t('conditions.placeholder')}
            className="flex-1 min-h-10"
          />
        )

      case 'date':
        return (
          <Input
            type="date"
            value={(condition.value as string) || ''}
            onChange={(e) => handleValueChange(index, e.target.value)}
            className="flex-1 min-h-10"
          />
        )

      case 'boolean':
        return (
          <Select
            value={String(condition.value)}
            onValueChange={(value) => handleValueChange(index, value === 'true')}
          >
            <SelectTrigger className="flex-1 min-h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        )

      default:
        return (
          <Input
            type="text"
            value={(condition.value as string) || ''}
            onChange={(e) => handleValueChange(index, e.target.value)}
            placeholder={t('conditions.placeholder')}
            className="flex-1 min-h-10"
          />
        )
    }
  }

  return (
    <div className={cn('flex flex-col gap-4', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header with Logic Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('conditions.title')}
        </h3>

        <div className="flex items-center gap-2">
          {/* Logic Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              type="button"
              onClick={() => onLogicChange('AND')}
              className={cn(
                'px-3 py-1 rounded text-sm font-medium transition-colors',
                logic === 'AND'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100',
              )}
            >
              {t('logic.and')}
            </button>
            <button
              type="button"
              onClick={() => onLogicChange('OR')}
              className={cn(
                'px-3 py-1 rounded text-sm font-medium transition-colors',
                logic === 'OR'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100',
              )}
            >
              {t('logic.or')}
            </button>
          </div>

          {conditions.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              <Trash2 className="h-4 w-4 me-1" />
              {t('filters.clear')}
            </Button>
          )}
        </div>
      </div>

      {/* Logic Description */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {logic === 'AND' ? t('logic.andDescription') : t('logic.orDescription')}
      </p>

      {/* Conditions List */}
      <div className="flex flex-col gap-3">
        {conditions.map((condition, index) => {
          const field = availableFields.find((f) => f.name === condition.field_name)
          const operators = field ? getOperatorsForFieldType(field.type) : []

          return (
            <div
              key={index}
              className={cn(
                'flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 rounded-lg border',
                condition.is_negated
                  ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
                  : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800',
              )}
            >
              {/* Negate Toggle */}
              <button
                type="button"
                onClick={() => handleToggleNegate(index)}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors',
                  condition.is_negated
                    ? 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
                )}
                aria-label={t('a11y.toggleNegate')}
              >
                {condition.is_negated ? (
                  <ToggleRight className="h-4 w-4" />
                ) : (
                  <ToggleLeft className="h-4 w-4" />
                )}
                {t('logic.not')}
              </button>

              {/* Field Select */}
              <Select
                value={condition.field_name}
                onValueChange={(value) => handleFieldChange(index, value)}
              >
                <SelectTrigger className="w-full sm:w-40 min-h-10">
                  <SelectValue placeholder={t('conditions.field')} />
                </SelectTrigger>
                <SelectContent>
                  {availableFields.map((field) => (
                    <SelectItem key={field.name} value={field.name}>
                      {isRTL ? field.label_ar : field.label_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Operator Select */}
              <Select
                value={condition.operator}
                onValueChange={(value) => handleOperatorChange(index, value as FilterOperator)}
              >
                <SelectTrigger className="w-full sm:w-40 min-h-10">
                  <SelectValue placeholder={t('conditions.operator')} />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {isRTL ? op.label_ar : op.label_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Value Input */}
              {renderValueInput(condition, index)}

              {/* Remove Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onConditionRemove(index)}
                className="shrink-0 min-h-10 min-w-10"
                aria-label={t('a11y.removeCondition')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )
        })}

        {/* Add Condition Button */}
        <Button
          variant="outline"
          onClick={handleAddCondition}
          className="min-h-11 border-dashed"
          disabled={availableFields.length === 0}
        >
          <Plus className="h-4 w-4 me-2" />
          {t('conditions.add')}
        </Button>
      </div>

      {/* Active Filters Summary */}
      {conditions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <span className="text-xs text-gray-500 dark:text-gray-400 self-center">
            {t('filters.activeCount', { count: conditions.length })}:
          </span>
          {conditions.map((condition, index) => {
            const field = availableFields.find((f) => f.name === condition.field_name)
            const fieldLabel = field
              ? isRTL
                ? field.label_ar
                : field.label_en
              : condition.field_name

            return (
              <Badge
                key={index}
                variant={condition.is_negated ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {condition.is_negated && `${t('logic.not')} `}
                {fieldLabel}
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default BooleanLogicBuilder
