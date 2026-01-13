/**
 * WidgetGrid Component
 *
 * A drag-and-drop grid layout for dashboard widgets using @dnd-kit.
 * Supports responsive layout, RTL, and edit mode.
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { cn } from '@/lib/utils'
import { WidgetContainer } from './WidgetContainer'
import { KpiWidget } from './KpiWidget'
import { ChartWidget } from './ChartWidget'
import { EventsWidget } from './EventsWidget'
import { TaskListWidget } from './TaskListWidget'
import { NotificationsWidget } from './NotificationsWidget'
import { QuickActionsWidget } from './QuickActionsWidget'
import type {
  WidgetConfig,
  KpiData,
  ChartData,
  EventData,
  NotificationData,
} from '@/types/dashboard-widget.types'

interface WidgetGridProps {
  widgets: WidgetConfig[]
  widgetData: Record<string, unknown>
  isEditMode: boolean
  onReorder: (widgets: WidgetConfig[]) => void
  onRemove: (widgetId: string) => void
  onSettings: (widget: WidgetConfig) => void
  onRefresh?: (widgetId: string) => void
  className?: string
}

/**
 * Renders the appropriate widget component based on type
 */
function renderWidget(config: WidgetConfig, data: unknown, isLoading: boolean): React.ReactNode {
  switch (config.type) {
    case 'kpi-card':
      return (
        <KpiWidget
          config={config as WidgetConfig & { type: 'kpi-card' }}
          data={data as KpiData | null}
          isLoading={isLoading}
        />
      )
    case 'chart':
      return (
        <ChartWidget
          config={config as WidgetConfig & { type: 'chart' }}
          data={data as ChartData | null}
          isLoading={isLoading}
        />
      )
    case 'upcoming-events':
      return (
        <EventsWidget
          config={config as WidgetConfig & { type: 'upcoming-events' }}
          data={data as EventData[] | null}
          isLoading={isLoading}
        />
      )
    case 'task-list':
      return (
        <TaskListWidget
          config={config as WidgetConfig & { type: 'task-list' }}
          data={data as TaskItem[] | null}
          isLoading={isLoading}
        />
      )
    case 'notifications':
      return (
        <NotificationsWidget
          config={config as WidgetConfig & { type: 'notifications' }}
          data={data as NotificationData[] | null}
          isLoading={isLoading}
        />
      )
    case 'quick-actions':
      return <QuickActionsWidget config={config as WidgetConfig & { type: 'quick-actions' }} />
    default:
      return (
        <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
          Unknown widget type: {config.type}
        </div>
      )
  }
}

// Task item type for TaskListWidget
interface TaskItem {
  id: string
  title: string
  description?: string
  source: 'commitment' | 'task' | 'intake'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  deadline?: string
  isOverdue?: boolean
}

export function WidgetGrid({
  widgets,
  widgetData,
  isEditMode,
  onReorder,
  onRemove,
  onSettings,
  onRefresh,
  className,
}: WidgetGridProps) {
  const { i18n } = useTranslation('dashboard-widgets')
  const isRTL = i18n.language === 'ar'

  const [activeWidget, setActiveWidget] = useState<WidgetConfig | null>(null)

  // Configure sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Handle drag start
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event
      const widget = widgets.find((w) => w.id === active.id)
      if (widget) {
        setActiveWidget(widget)
      }
    },
    [widgets],
  )

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveWidget(null)

      if (over && active.id !== over.id) {
        const oldIndex = widgets.findIndex((w) => w.id === active.id)
        const newIndex = widgets.findIndex((w) => w.id === over.id)

        if (oldIndex !== -1 && newIndex !== -1) {
          const newWidgets = arrayMove(widgets, oldIndex, newIndex).map((widget, index) => ({
            ...widget,
            order: index,
          }))
          onReorder(newWidgets)
        }
      }
    },
    [widgets, onReorder],
  )

  // Get widget IDs for sortable context
  const widgetIds = widgets.map((w) => w.id)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={widgetIds} strategy={rectSortingStrategy}>
        <div
          className={cn(
            // Mobile-first responsive grid
            'grid gap-4',
            'grid-cols-1',
            'sm:grid-cols-2',
            'lg:grid-cols-3',
            'xl:grid-cols-4',
            // Minimum row height
            'auto-rows-[minmax(150px,auto)]',
            className,
          )}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {widgets
            .filter((w) => w.isVisible)
            .sort((a, b) => a.order - b.order)
            .map((widget) => {
              const data = widgetData[widget.id as string]
              const isLoading = !data

              return (
                <WidgetContainer
                  key={widget.id}
                  id={widget.id}
                  title={widget.title}
                  size={widget.size}
                  isEditMode={isEditMode}
                  loadingState={{ isLoading, isError: false }}
                  onSettings={() => onSettings(widget)}
                  onRefresh={onRefresh ? () => onRefresh(widget.id as string) : undefined}
                  onRemove={() => onRemove(widget.id as string)}
                >
                  {renderWidget(widget, data, isLoading)}
                </WidgetContainer>
              )
            })}
        </div>
      </SortableContext>

      {/* Drag Overlay */}
      <DragOverlay adjustScale={false}>
        {activeWidget ? (
          <div className={cn('opacity-90 shadow-lg rounded-lg', 'ring-2 ring-primary')}>
            <WidgetContainer
              id={activeWidget.id}
              title={activeWidget.title}
              size={activeWidget.size}
              isEditMode={false}
            >
              {renderWidget(activeWidget, widgetData[activeWidget.id as string], false)}
            </WidgetContainer>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export default WidgetGrid
