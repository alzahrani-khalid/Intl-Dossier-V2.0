/**
 * Column Builder Component
 *
 * Drop zone for adding and configuring report columns.
 */

import { useTranslation } from 'react-i18next'
import { useDroppable } from '@dnd-kit/core'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { GripVertical, X, Eye, EyeOff, Columns } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReportColumn, ReportField } from '@/types/report-builder.types'

interface ColumnBuilderProps {
  columns: ReportColumn[]
  onRemoveColumn: (columnId: string) => void
  onUpdateColumn: (columnId: string, updates: Partial<ReportColumn>) => void
  onReorderColumns: (sourceIndex: number, destinationIndex: number) => void
}

interface SortableColumnProps {
  column: ReportColumn
  isRTL: boolean
  onRemove: () => void
  onUpdate: (updates: Partial<ReportColumn>) => void
}

function SortableColumn({ column, isRTL, onRemove, onUpdate }: SortableColumnProps) {
  const { t } = useTranslation('report-builder')

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 p-3 rounded-lg border bg-background',
        'hover:border-primary/30 transition-colors',
        isDragging && 'opacity-50 shadow-lg z-50',
      )}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <Input
            value={isRTL ? column.labelAr || column.label || '' : column.label || ''}
            onChange={(e) =>
              onUpdate(isRTL ? { labelAr: e.target.value } : { label: e.target.value })
            }
            className="h-8 text-sm"
            placeholder={t('columns.title')}
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate">{column.fieldId}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onUpdate({ visible: !column.visible })}
        >
          {column.visible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function ColumnBuilder({
  columns,
  onRemoveColumn,
  onUpdateColumn,
  onReorderColumns,
}: ColumnBuilderProps) {
  const { t, i18n } = useTranslation('report-builder')
  const isRTL = i18n.language === 'ar'

  const { setNodeRef, isOver } = useDroppable({
    id: 'columns-drop-zone',
    data: { type: 'columns' },
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = columns.findIndex((c) => c.id === active.id)
      const newIndex = columns.findIndex((c) => c.id === over.id)
      onReorderColumns(oldIndex, newIndex)
    }
  }

  const visibleCount = columns.filter((c) => c.visible).length
  const hiddenCount = columns.length - visibleCount

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'} className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Columns className="h-5 w-5" />
              {t('columns.title')}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t('columns.description')}
            </CardDescription>
          </div>
          {columns.length > 0 && (
            <div className="text-xs text-muted-foreground">
              <span className="text-foreground">{visibleCount}</span> {t('columns.visible')}
              {hiddenCount > 0 && (
                <span className="ms-2 text-muted-foreground">
                  · {hiddenCount} {t('columns.hidden')}
                </span>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0">
        <div
          ref={setNodeRef}
          className={cn(
            'h-full min-h-[200px] rounded-lg border-2 border-dashed transition-colors',
            isOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
            columns.length === 0 && 'flex items-center justify-center',
          )}
        >
          {columns.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={columns.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <ScrollArea className="h-full p-2">
                  <div className="space-y-2">
                    {columns.map((column) => (
                      <SortableColumn
                        key={column.id}
                        column={column}
                        isRTL={isRTL}
                        onRemove={() => onRemoveColumn(column.id)}
                        onUpdate={(updates) => onUpdateColumn(column.id, updates)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </SortableContext>
            </DndContext>
          ) : (
            <p className="text-sm text-muted-foreground text-center px-4">{t('columns.empty')}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
