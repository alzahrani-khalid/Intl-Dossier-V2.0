/**
 * TimelineZoomControls Component
 *
 * Zoom and navigation controls for the interactive timeline:
 * - Zoom in/out buttons
 * - Zoom level presets (day, week, month, year, all)
 * - Go to today button
 * - Navigation arrows
 * - Mobile-first responsive design
 * - RTL support with logical properties
 */

import { useTranslation } from 'react-i18next'
import { ZoomIn, ZoomOut, Calendar, ChevronLeft, ChevronRight, Home, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { TimelineZoomLevel, ZoomLevelConfig } from '@/types/timeline-annotation.types'

interface TimelineZoomControlsProps {
  currentZoom: TimelineZoomLevel
  onZoomChange: (level: TimelineZoomLevel) => void
  onZoomIn: () => void
  onZoomOut: () => void
  onGoToToday: () => void
  onScrollBackward: () => void
  onScrollForward: () => void
  canZoomIn: boolean
  canZoomOut: boolean
  canScrollBackward: boolean
  canScrollForward: boolean
  currentDateLabel?: string
  className?: string
}

/**
 * Zoom level configurations
 */
const zoomLevels: ZoomLevelConfig[] = [
  { level: 'day', label_en: 'Day', label_ar: 'يوم', daysVisible: 1, groupBy: 'hour' },
  { level: 'week', label_en: 'Week', label_ar: 'أسبوع', daysVisible: 7, groupBy: 'day' },
  { level: 'month', label_en: 'Month', label_ar: 'شهر', daysVisible: 30, groupBy: 'day' },
  { level: 'quarter', label_en: 'Quarter', label_ar: 'ربع سنة', daysVisible: 90, groupBy: 'week' },
  { level: 'year', label_en: 'Year', label_ar: 'سنة', daysVisible: 365, groupBy: 'month' },
  { level: 'all', label_en: 'All Time', label_ar: 'كل الوقت', daysVisible: -1, groupBy: 'year' },
]

export function TimelineZoomControls({
  currentZoom,
  onZoomChange,
  onZoomIn,
  onZoomOut,
  onGoToToday,
  onScrollBackward,
  onScrollForward,
  canZoomIn,
  canZoomOut,
  canScrollBackward,
  canScrollForward,
  currentDateLabel,
  className,
}: TimelineZoomControlsProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  const currentConfig = zoomLevels.find((z) => z.level === currentZoom)

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center gap-2 sm:gap-4 p-2 sm:p-3 bg-card rounded-lg border shadow-sm',
        className,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Navigation Controls */}
      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onScrollBackward}
                disabled={!canScrollBackward}
                className="min-h-10 min-w-10 sm:min-h-9 sm:min-w-9"
              >
                <ChevronLeft className={cn('h-4 w-4', isRTL && 'rotate-180')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('timeline.zoom.scroll_back')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onGoToToday}
                className="min-h-10 min-w-10 sm:min-h-9 sm:min-w-9"
              >
                <Home className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('timeline.zoom.go_today')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onScrollForward}
                disabled={!canScrollForward}
                className="min-h-10 min-w-10 sm:min-h-9 sm:min-w-9"
              >
                <ChevronRight className={cn('h-4 w-4', isRTL && 'rotate-180')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('timeline.zoom.scroll_forward')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Current Date Label */}
      {currentDateLabel && (
        <>
          <Separator orientation="vertical" className="hidden sm:block h-6" />
          <div className="flex items-center gap-2 px-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium whitespace-nowrap">{currentDateLabel}</span>
          </div>
        </>
      )}

      <Separator orientation="vertical" className="hidden sm:block h-6" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onZoomOut}
                disabled={!canZoomOut}
                className="min-h-10 min-w-10 sm:min-h-9 sm:min-w-9"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('timeline.zoom.zoom_out')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Select
          value={currentZoom}
          onValueChange={(value) => onZoomChange(value as TimelineZoomLevel)}
        >
          <SelectTrigger className="w-28 sm:w-32 min-h-10 sm:min-h-9">
            <SelectValue>{isRTL ? currentConfig?.label_ar : currentConfig?.label_en}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {zoomLevels.map((zoom) => (
              <SelectItem key={zoom.level} value={zoom.level}>
                {isRTL ? zoom.label_ar : zoom.label_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onZoomIn}
                disabled={!canZoomIn}
                className="min-h-10 min-w-10 sm:min-h-9 sm:min-w-9"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('timeline.zoom.zoom_in')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Fit to Screen */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onZoomChange('all')}
              className="min-h-10 min-w-10 sm:min-h-9 sm:min-w-9 hidden sm:flex"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('timeline.zoom.fit_all')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

/**
 * Hook for managing zoom state
 */
export function useTimelineZoom(_initialLevel: TimelineZoomLevel = 'month') {
  const zoomOrder: TimelineZoomLevel[] = ['day', 'week', 'month', 'quarter', 'year', 'all']

  const getZoomIndex = (level: TimelineZoomLevel) => zoomOrder.indexOf(level)

  const zoomIn = (current: TimelineZoomLevel): TimelineZoomLevel => {
    const currentIndex = getZoomIndex(current)
    const newZoom = currentIndex > 0 ? zoomOrder[currentIndex - 1] : undefined
    return newZoom ?? current
  }

  const zoomOut = (current: TimelineZoomLevel): TimelineZoomLevel => {
    const currentIndex = getZoomIndex(current)
    const newZoom = currentIndex < zoomOrder.length - 1 ? zoomOrder[currentIndex + 1] : undefined
    return newZoom ?? current
  }

  const canZoomIn = (current: TimelineZoomLevel): boolean => {
    return getZoomIndex(current) > 0
  }

  const canZoomOut = (current: TimelineZoomLevel): boolean => {
    return getZoomIndex(current) < zoomOrder.length - 1
  }

  return {
    zoomLevels: zoomOrder,
    zoomIn,
    zoomOut,
    canZoomIn,
    canZoomOut,
    getZoomConfig: (level: TimelineZoomLevel) => zoomLevels.find((z) => z.level === level),
  }
}
