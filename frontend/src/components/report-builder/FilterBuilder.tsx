/**
 * Filter Builder Component
 *
 * Allows users to configure filters for their report data.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Filter, Plus, X, CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import type {
  ReportFilter,
  FilterGroup,
  FilterOperator,
  ReportField,
  FILTER_OPERATORS,
} from '@/types/report-builder.types'

interface FilterBuilderProps {
  filters: FilterGroup
  availableFields: ReportField[]
  onAddFilter: (filter: Omit<ReportFilter, 'id'>) => void
  onRemoveFilter: (filterId: string) => void
  onUpdateFilter: (filterId: string, updates: Partial<ReportFilter>) => void
  onSetFilterLogic: (logic: 'and' | 'or') => void
}

const operatorsByType: Record<string, FilterOperator[]> = {
  string: [
    'equals',
    'not_equals',
    'contains',
    'not_contains',
    'starts_with',
    'ends_with',
    'is_null',
    'is_not_null',
  ],
  number: [
    'equals',
    'not_equals',
    'greater_than',
    'less_than',
    'greater_than_or_equal',
    'less_than_or_equal',
    'between',
    'is_null',
    'is_not_null',
  ],
  date: ['equals', 'not_equals', 'greater_than', 'less_than', 'between', 'is_null', 'is_not_null'],
  datetime: [
    'equals',
    'not_equals',
    'greater_than',
    'less_than',
    'between',
    'is_null',
    'is_not_null',
  ],
  boolean: ['equals', 'is_null', 'is_not_null'],
  enum: ['equals', 'not_equals', 'in', 'not_in', 'is_null', 'is_not_null'],
  uuid: ['equals', 'not_equals', 'is_null', 'is_not_null'],
  json: ['is_null', 'is_not_null'],
}

interface FilterRowProps {
  filter: ReportFilter
  fields: ReportField[]
  isRTL: boolean
  onUpdate: (updates: Partial<ReportFilter>) => void
  onRemove: () => void
}

function FilterRow({ filter, fields, isRTL, onUpdate, onRemove }: FilterRowProps) {
  const { t } = useTranslation('report-builder')

  const selectedField = fields.find((f) => f.id === filter.fieldId)
  const availableOperators = selectedField
    ? operatorsByType[selectedField.type] || operatorsByType.string
    : operatorsByType.string

  const needsValue = !['is_null', 'is_not_null'].includes(filter.operator)
  const needsEndValue = filter.operator === 'between'

  return (
    <div className="flex flex-col sm:flex-row gap-2 p-3 rounded-lg border bg-background">
      <Select value={filter.fieldId} onValueChange={(value) => onUpdate({ fieldId: value })}>
        <SelectTrigger className="sm:w-[200px]">
          <SelectValue placeholder={t('fields.title')} />
        </SelectTrigger>
        <SelectContent>
          {fields.map((field) => (
            <SelectItem key={field.id} value={field.id}>
              {isRTL ? field.nameAr : field.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filter.operator}
        onValueChange={(value) => onUpdate({ operator: value as FilterOperator })}
      >
        <SelectTrigger className="sm:w-[180px]">
          <SelectValue placeholder={t('filters.operators.equals')} />
        </SelectTrigger>
        <SelectContent>
          {availableOperators.map((op) => (
            <SelectItem key={op} value={op}>
              {t(`filters.operators.${op}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {needsValue && (
        <div className="flex-1 flex gap-2">
          {selectedField?.type === 'date' || selectedField?.type === 'datetime' ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'flex-1 justify-start text-start font-normal',
                    !filter.value && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="me-2 h-4 w-4" />
                  {filter.value
                    ? format(new Date(filter.value as string), 'PPP')
                    : t('filters.value')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filter.value ? new Date(filter.value as string) : undefined}
                  onSelect={(date) => onUpdate({ value: date?.toISOString() })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          ) : selectedField?.type === 'boolean' ? (
            <Select
              value={String(filter.value)}
              onValueChange={(value) => onUpdate({ value: value === 'true' })}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">{t('common:yes')}</SelectItem>
                <SelectItem value="false">{t('common:no')}</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={String(filter.value || '')}
              onChange={(e) => onUpdate({ value: e.target.value })}
              placeholder={t('filters.value')}
              className="flex-1"
              type={selectedField?.type === 'number' ? 'number' : 'text'}
            />
          )}

          {needsEndValue && (
            <>
              <span className="self-center text-muted-foreground">&mdash;</span>
              <Input
                value={String(filter.valueEnd || '')}
                onChange={(e) => onUpdate({ valueEnd: e.target.value })}
                placeholder={t('filters.valueEnd')}
                className="flex-1"
                type={selectedField?.type === 'number' ? 'number' : 'text'}
              />
            </>
          )}
        </div>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 text-destructive hover:text-destructive flex-shrink-0"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function FilterBuilder({
  filters,
  availableFields,
  onAddFilter,
  onRemoveFilter,
  onUpdateFilter,
  onSetFilterLogic,
}: FilterBuilderProps) {
  const { t, i18n } = useTranslation('report-builder')
  const isRTL = i18n.language === 'ar'

  const filterableFields = availableFields.filter((f) => f.filterable)

  const handleAddFilter = () => {
    if (filterableFields.length === 0) return

    onAddFilter({
      fieldId: filterableFields[0].id,
      operator: 'equals',
      value: '',
    })
  }

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {t('filters.title')}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t('filters.description')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {filters.filters.length > 0 && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{t('filters.logic.and')}:</span>
            <RadioGroup
              value={filters.logic}
              onValueChange={(value) => onSetFilterLogic(value as 'and' | 'or')}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="and" id="logic-and" />
                <Label htmlFor="logic-and" className="text-sm">
                  {t('filters.logic.and')}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="or" id="logic-or" />
                <Label htmlFor="logic-or" className="text-sm">
                  {t('filters.logic.or')}
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        <ScrollArea className={cn(filters.filters.length > 3 && 'h-[300px]')}>
          <div className="space-y-2">
            {filters.filters.map((filter, index) => (
              <FilterRow
                key={filter.id}
                filter={filter}
                fields={filterableFields}
                isRTL={isRTL}
                onUpdate={(updates) => onUpdateFilter(filter.id, updates)}
                onRemove={() => onRemoveFilter(filter.id)}
              />
            ))}
          </div>
        </ScrollArea>

        {filters.filters.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">{t('filters.empty')}</p>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleAddFilter}
          disabled={filterableFields.length === 0}
        >
          <Plus className="h-4 w-4 me-2" />
          {t('filters.addFilter')}
        </Button>
      </CardContent>
    </Card>
  )
}
