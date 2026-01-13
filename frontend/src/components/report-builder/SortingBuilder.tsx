/**
 * Sorting Builder Component
 *
 * Allows users to configure sorting for their report data.
 */

import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowUpDown, ArrowUp, ArrowDown, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReportSort, ReportField } from '@/types/report-builder.types'

interface SortingBuilderProps {
  sorting: ReportSort[]
  availableFields: ReportField[]
  onAddSort: (fieldId: string, direction: 'asc' | 'desc') => void
  onRemoveSort: (sortId: string) => void
  onUpdateSort: (sortId: string, direction: 'asc' | 'desc') => void
}

export function SortingBuilder({
  sorting,
  availableFields,
  onAddSort,
  onRemoveSort,
  onUpdateSort,
}: SortingBuilderProps) {
  const { t, i18n } = useTranslation('report-builder')
  const isRTL = i18n.language === 'ar'

  const sortableFields = availableFields.filter((f) => f.sortable)

  // Fields not yet used in sorting
  const availableSortFields = sortableFields.filter((f) => !sorting.some((s) => s.fieldId === f.id))

  const handleAddSort = (fieldId: string) => {
    onAddSort(fieldId, 'asc')
  }

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <ArrowUpDown className="h-5 w-5" />
          {t('sorting.title')}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">{t('sorting.description')}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {sorting.length > 0 ? (
          <ScrollArea className={cn(sorting.length > 4 && 'h-[200px]')}>
            <div className="space-y-2">
              {sorting.map((sort, index) => {
                const field = availableFields.find((f) => f.id === sort.fieldId)
                return (
                  <div
                    key={sort.id}
                    className="flex items-center gap-2 p-2 rounded-md border bg-background"
                  >
                    <span className="text-xs text-muted-foreground w-5">{index + 1}.</span>
                    <span className="text-sm flex-1 truncate">
                      {isRTL ? field?.nameAr : field?.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() =>
                        onUpdateSort(sort.id, sort.direction === 'asc' ? 'desc' : 'asc')
                      }
                    >
                      {sort.direction === 'asc' ? (
                        <>
                          <ArrowUp className="h-4 w-4 me-1" />
                          <span className="text-xs">{t('sorting.direction.asc')}</span>
                        </>
                      ) : (
                        <>
                          <ArrowDown className="h-4 w-4 me-1" />
                          <span className="text-xs">{t('sorting.direction.desc')}</span>
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => onRemoveSort(sort.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">{t('sorting.empty')}</p>
        )}

        {availableSortFields.length > 0 && (
          <Select onValueChange={handleAddSort}>
            <SelectTrigger className="h-9">
              <Plus className="h-4 w-4 me-2" />
              <SelectValue placeholder={t('sorting.addSort')} />
            </SelectTrigger>
            <SelectContent>
              {availableSortFields.map((field) => (
                <SelectItem key={field.id} value={field.id}>
                  {isRTL ? field.nameAr : field.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardContent>
    </Card>
  )
}
