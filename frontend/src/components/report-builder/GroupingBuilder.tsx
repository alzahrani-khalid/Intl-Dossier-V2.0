/**
 * Grouping Builder Component
 *
 * Allows users to configure groupings for their report data.
 */

import { useTranslation } from 'react-i18next'
import { useDroppable } from '@dnd-kit/core'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Layers, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  ReportGrouping,
  ReportField,
  AggregationFunction,
  ReportAggregation,
} from '@/types/report-builder.types'

interface GroupingBuilderProps {
  groupings: ReportGrouping[]
  aggregations: ReportAggregation[]
  availableFields: ReportField[]
  onAddGrouping: (field: ReportField) => void
  onRemoveGrouping: (groupingId: string) => void
  onAddAggregation: (aggregation: Omit<ReportAggregation, 'id'>) => void
  onRemoveAggregation: (aggId: string) => void
}

const AGGREGATION_FUNCTIONS: AggregationFunction[] = [
  'count',
  'count_distinct',
  'sum',
  'avg',
  'min',
  'max',
]

export function GroupingBuilder({
  groupings,
  aggregations,
  availableFields,
  onAddGrouping,
  onRemoveGrouping,
  onAddAggregation,
  onRemoveAggregation,
}: GroupingBuilderProps) {
  const { t, i18n } = useTranslation('report-builder')
  const isRTL = i18n.language === 'ar'

  const { setNodeRef, isOver } = useDroppable({
    id: 'groupings-drop-zone',
    data: { type: 'groupings' },
  })

  const groupableFields = availableFields.filter((f) => f.groupable)
  const aggregatableFields = availableFields.filter((f) => f.aggregatable)

  // Fields not yet used in groupings
  const availableGroupingFields = groupableFields.filter(
    (f) => !groupings.some((g) => g.fieldId === f.id),
  )

  const handleAddGrouping = (fieldId: string) => {
    const field = groupableFields.find((f) => f.id === fieldId)
    if (field) {
      onAddGrouping(field)
    }
  }

  const handleAddAggregation = (fieldId: string, func: AggregationFunction) => {
    const field = aggregatableFields.find((f) => f.id === fieldId)
    if (field) {
      onAddAggregation({
        fieldId: field.id,
        function: func,
        label: `${func} of ${field.name}`,
        labelAr: `${t(`aggregations.functions.${func}`)} ${field.nameAr}`,
      })
    }
  }

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Layers className="size-5" />
          {t('groupings.title')}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {t('groupings.description')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Groupings */}
        <div>
          <h4 className="mb-2 text-sm font-medium">{t('groupings.title')}</h4>
          <div
            ref={setNodeRef}
            className={cn(
              'min-h-[60px] rounded-lg border-2 border-dashed p-2 transition-colors',
              isOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
              groupings.length === 0 && 'flex items-center justify-center',
            )}
          >
            {groupings.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {groupings.map((grouping, index) => {
                  const field = availableFields.find((f) => f.id === grouping.fieldId)
                  return (
                    <Badge key={grouping.id} variant="secondary" className="h-8 gap-2 px-3">
                      <span className="me-1 text-xs text-muted-foreground">{index + 1}.</span>
                      {isRTL ? field?.nameAr : field?.name}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-4 p-0 hover:bg-transparent"
                        onClick={() => onRemoveGrouping(grouping.id)}
                      >
                        <X className="size-3" />
                      </Button>
                    </Badge>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('groupings.empty')}</p>
            )}
          </div>

          {availableGroupingFields.length > 0 && (
            <div className="mt-2">
              <Select onValueChange={handleAddGrouping}>
                <SelectTrigger className="h-9">
                  <Plus className="me-2 size-4" />
                  <SelectValue placeholder={t('groupings.title')} />
                </SelectTrigger>
                <SelectContent>
                  {availableGroupingFields.map((field) => (
                    <SelectItem key={field.id} value={field.id}>
                      {isRTL ? field.nameAr : field.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Aggregations */}
        <div>
          <h4 className="mb-2 text-sm font-medium">{t('aggregations.title')}</h4>
          <div className="space-y-2">
            {aggregations.length > 0 ? (
              <ScrollArea className={cn(aggregations.length > 3 && 'h-[150px]')}>
                <div className="space-y-2">
                  {aggregations.map((agg) => {
                    const field = availableFields.find((f) => f.id === agg.fieldId)
                    return (
                      <div
                        key={agg.id}
                        className="flex items-center gap-2 rounded-md border bg-background p-2"
                      >
                        <Badge variant="outline" className="font-mono text-xs">
                          {t(`aggregations.functions.${agg.function}`)}
                        </Badge>
                        <span className="flex-1 text-sm">
                          {isRTL ? field?.nameAr : field?.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          onClick={() => onRemoveAggregation(agg.id)}
                        >
                          <X className="size-3" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            ) : (
              <p className="py-2 text-center text-sm text-muted-foreground">
                {t('aggregations.empty')}
              </p>
            )}

            {aggregatableFields.length > 0 && (
              <div className="flex gap-2">
                <Select>
                  <SelectTrigger className="h-9 flex-1">
                    <SelectValue placeholder={t('fields.title')} />
                  </SelectTrigger>
                  <SelectContent>
                    {aggregatableFields.map((field) => (
                      <SelectItem key={field.id} value={field.id}>
                        {isRTL ? field.nameAr : field.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  onValueChange={(value) => {
                    const [fieldId, func] = value.split('::')
                    handleAddAggregation(fieldId, func as AggregationFunction)
                  }}
                >
                  <SelectTrigger className="h-9 w-[140px]">
                    <SelectValue placeholder={t('aggregations.functions.count')} />
                  </SelectTrigger>
                  <SelectContent>
                    {aggregatableFields.flatMap((field) =>
                      AGGREGATION_FUNCTIONS.map((func) => (
                        <SelectItem key={`${field.id}::${func}`} value={`${field.id}::${func}`}>
                          {t(`aggregations.functions.${func}`)} -{' '}
                          {isRTL ? field.nameAr : field.name}
                        </SelectItem>
                      )),
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
