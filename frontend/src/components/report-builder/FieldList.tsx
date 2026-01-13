/**
 * Field List Component
 *
 * Displays available fields for selected entities with drag capability.
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDraggable } from '@dnd-kit/core'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import {
  Search,
  GripVertical,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  List,
  Key,
  Braces,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReportField, FieldDataType } from '@/types/report-builder.types'

interface FieldListProps {
  fields: ReportField[]
  onAddColumn: (field: ReportField) => void
  onAddFilter?: (field: ReportField) => void
  onAddGrouping?: (field: ReportField) => void
}

const fieldTypeIcons: Record<FieldDataType, React.ComponentType<{ className?: string }>> = {
  string: Type,
  number: Hash,
  date: Calendar,
  datetime: Calendar,
  boolean: ToggleLeft,
  enum: List,
  uuid: Key,
  json: Braces,
}

interface DraggableFieldProps {
  field: ReportField
  isRTL: boolean
  onAddColumn: (field: ReportField) => void
}

function DraggableField({ field, isRTL, onAddColumn }: DraggableFieldProps) {
  const { t } = useTranslation('report-builder')
  const Icon = fieldTypeIcons[field.type]

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: field.id,
    data: { type: 'field', field },
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 p-2 rounded-md border bg-background',
        'hover:border-primary/50 hover:bg-accent/30 transition-colors',
        'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50 shadow-lg',
      )}
    >
      <div {...attributes} {...listeners} className="touch-none">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{isRTL ? field.nameAr : field.name}</p>
        <p className="text-xs text-muted-foreground truncate">{t(`fieldTypes.${field.type}`)}</p>
      </div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                onAddColumn(field)
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('tooltips.addColumn')}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

export function FieldList({ fields, onAddColumn, onAddFilter, onAddGrouping }: FieldListProps) {
  const { t, i18n } = useTranslation('report-builder')
  const isRTL = i18n.language === 'ar'
  const [search, setSearch] = useState('')

  // Group fields by entity
  const groupedFields = useMemo(() => {
    const groups: Record<string, ReportField[]> = {}

    for (const field of fields) {
      if (!groups[field.entity]) {
        groups[field.entity] = []
      }
      groups[field.entity].push(field)
    }

    return groups
  }, [fields])

  // Filter fields by search
  const filteredGroups = useMemo(() => {
    if (!search) return groupedFields

    const searchLower = search.toLowerCase()
    const filtered: Record<string, ReportField[]> = {}

    for (const [entity, entityFields] of Object.entries(groupedFields)) {
      const matchingFields = entityFields.filter(
        (f) =>
          f.name.toLowerCase().includes(searchLower) ||
          f.nameAr.includes(search) ||
          f.id.toLowerCase().includes(searchLower),
      )

      if (matchingFields.length > 0) {
        filtered[entity] = matchingFields
      }
    }

    return filtered
  }, [groupedFields, search])

  const hasFields = fields.length > 0

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'} className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg">{t('fields.title')}</CardTitle>
        <CardDescription className="text-xs sm:text-sm">{t('fields.description')}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0">
        {hasFields ? (
          <>
            <div className="relative mb-3">
              <Search
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground',
                  isRTL ? 'end-3' : 'start-3',
                )}
              />
              <Input
                placeholder={t('fields.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn('h-9', isRTL ? 'pe-9' : 'ps-9')}
              />
            </div>

            <ScrollArea className="flex-1 -mx-2 px-2">
              <div className="space-y-4">
                {Object.entries(filteredGroups).map(([entity, entityFields]) => (
                  <div key={entity}>
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                      {t(`entities.${entity}`)}
                    </h4>
                    <div className="space-y-1">
                      {entityFields.map((field) => (
                        <DraggableField
                          key={field.id}
                          field={field}
                          isRTL={isRTL}
                          onAddColumn={onAddColumn}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <p className="text-xs text-muted-foreground mt-3 text-center">{t('fields.dragHint')}</p>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">{t('fields.noFields')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
