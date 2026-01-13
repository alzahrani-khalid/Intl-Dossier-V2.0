/**
 * WidgetContainer Component
 *
 * A wrapper component for dashboard widgets that provides consistent
 * styling, header, and action buttons (settings, refresh, remove).
 * Supports drag-and-drop via @dnd-kit.
 */

import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { UniqueIdentifier } from '@dnd-kit/core'
import { GripVertical, Settings, RefreshCw, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { WidgetSize, WidgetLoadingState } from '@/types/dashboard-widget.types'

interface WidgetContainerProps {
  id: UniqueIdentifier
  title: string
  size: WidgetSize
  isEditMode: boolean
  loadingState?: WidgetLoadingState
  onSettings?: () => void
  onRefresh?: () => void
  onRemove?: () => void
  children: React.ReactNode
  className?: string
}

/**
 * Maps widget size to grid column span classes (mobile-first)
 */
const sizeToColSpan: Record<WidgetSize, string> = {
  small: 'col-span-1',
  medium: 'col-span-1 sm:col-span-2',
  large: 'col-span-1 sm:col-span-2 lg:col-span-3',
  full: 'col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4',
}

/**
 * Maps widget size to grid row span classes
 */
const sizeToRowSpan: Record<WidgetSize, string> = {
  small: 'row-span-1',
  medium: 'row-span-1',
  large: 'row-span-2',
  full: 'row-span-2',
}

export const WidgetContainer = forwardRef<HTMLDivElement, WidgetContainerProps>(
  (
    {
      id,
      title,
      size,
      isEditMode,
      loadingState,
      onSettings,
      onRefresh,
      onRemove,
      children,
      className,
    },
    ref,
  ) => {
    const { t, i18n } = useTranslation('dashboard-widgets')
    const isRTL = i18n.language === 'ar'

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id,
      disabled: !isEditMode,
    })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    }

    const isLoading = loadingState?.isLoading
    const isError = loadingState?.isError

    return (
      <div
        ref={(node) => {
          setNodeRef(node)
          if (typeof ref === 'function') {
            ref(node)
          } else if (ref) {
            ref.current = node
          }
        }}
        style={style}
        className={cn(
          sizeToColSpan[size],
          sizeToRowSpan[size],
          'min-h-[150px]',
          isDragging && 'opacity-50 z-50',
          className,
        )}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <Card
          className={cn(
            'h-full flex flex-col transition-all duration-200',
            isEditMode && 'ring-2 ring-dashed ring-primary/30 hover:ring-primary/50',
            isError && 'border-destructive/50',
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3 px-3 sm:px-4">
            <div className="flex items-center gap-2 min-w-0">
              {/* Drag Handle - Only visible in edit mode */}
              {isEditMode && (
                <button
                  {...attributes}
                  {...listeners}
                  className={cn(
                    'cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted',
                    'touch-none select-none',
                    'min-h-8 min-w-8 flex items-center justify-center',
                  )}
                  aria-label={t('accessibility.dragHandle')}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
              <CardTitle className="text-sm sm:text-base font-medium truncate">{title}</CardTitle>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              {/* Loading Indicator */}
              {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}

              {/* Refresh Button */}
              {onRefresh && !isEditMode && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onRefresh}
                        disabled={isLoading}
                        className="h-8 w-8"
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span className="sr-only">{t('actions.refresh')}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('actions.refresh')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Settings Button - Only visible in edit mode */}
              {onSettings && isEditMode && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={onSettings} className="h-8 w-8">
                        <Settings className="h-4 w-4" />
                        <span className="sr-only">
                          {t('accessibility.settingsButton', { widget: title })}
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('configureWidget')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Remove Button - Only visible in edit mode */}
              {onRemove && isEditMode && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onRemove}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">
                          {t('accessibility.removeButton', { widget: title })}
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('removeWidget')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-3 sm:p-4 pt-0 overflow-hidden">
            {isError ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                <p>{t('errors.loadFailed')}</p>
              </div>
            ) : (
              children
            )}
          </CardContent>
        </Card>
      </div>
    )
  },
)

WidgetContainer.displayName = 'WidgetContainer'

export default WidgetContainer
