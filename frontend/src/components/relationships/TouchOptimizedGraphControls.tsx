/**
 * TouchOptimizedGraphControls Component
 *
 * Floating touch-optimized controls for relationship graph navigation.
 * Features:
 * - Floating zoom level indicator with percentage
 * - Reset view button for easy navigation
 * - Zoom in/out buttons with touch-friendly sizes
 * - Fit view button
 * - Mobile-first responsive design
 * - RTL support with logical properties
 *
 * @example
 * <TouchOptimizedGraphControls
 *   zoomLevel={0.75}
 *   onZoomIn={() => zoomIn()}
 *   onZoomOut={() => zoomOut()}
 *   onReset={() => resetView()}
 *   onFitView={() => fitView()}
 * />
 */

import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Move,
  Fingerprint,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface TouchOptimizedGraphControlsProps {
  /** Current zoom level (0.1 - 2) */
  zoomLevel: number
  /** Zoom as percentage string */
  zoomPercentage?: string
  /** Whether a gesture is currently active */
  isGestureActive?: boolean
  /** Whether pinch gesture is active */
  isPinching?: boolean
  /** Whether pan gesture is active */
  isPanning?: boolean
  /** Callback for zoom in */
  onZoomIn: () => void
  /** Callback for zoom out */
  onZoomOut: () => void
  /** Callback for reset view */
  onReset: () => void
  /** Callback for fit view */
  onFitView: () => void
  /** Minimum zoom level */
  minZoom?: number
  /** Maximum zoom level */
  maxZoom?: number
  /** Additional class name */
  className?: string
  /** Position of the controls */
  position?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
  /** Show gesture hint */
  showGestureHint?: boolean
}

export const TouchOptimizedGraphControls = memo(function TouchOptimizedGraphControls({
  zoomLevel,
  zoomPercentage,
  isGestureActive = false,
  isPinching = false,
  isPanning = false,
  onZoomIn,
  onZoomOut,
  onReset,
  onFitView,
  minZoom = 0.1,
  maxZoom = 2,
  className,
  position = 'bottom-end',
  showGestureHint = true,
}: TouchOptimizedGraphControlsProps) {
  const { t, i18n } = useTranslation('relationships')
  const isRTL = i18n.language === 'ar'

  // Calculate zoom percentage if not provided
  const displayPercentage = zoomPercentage || `${Math.round(zoomLevel * 100)}%`

  // Check if at zoom limits
  const isAtMinZoom = zoomLevel <= minZoom + 0.05
  const isAtMaxZoom = zoomLevel >= maxZoom - 0.05

  // Position classes based on RTL
  const getPositionClasses = useCallback(() => {
    const positionMap: Record<string, string> = {
      'bottom-start': isRTL ? 'bottom-4 end-4' : 'bottom-4 start-4',
      'bottom-end': isRTL ? 'bottom-4 start-4' : 'bottom-4 end-4',
      'top-start': isRTL ? 'top-4 end-4' : 'top-4 start-4',
      'top-end': isRTL ? 'top-4 start-4' : 'top-4 end-4',
    }
    return positionMap[position]
  }, [position, isRTL])

  return (
    <div
      className={cn('absolute z-20', getPositionClasses(), className)}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex flex-col gap-2"
      >
        {/* Gesture Indicator - Shows during active gestures */}
        <AnimatePresence>
          {isGestureActive && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-2 rounded-lg bg-primary/90 px-3 py-2 text-primary-foreground shadow-lg backdrop-blur-sm"
            >
              {isPinching && (
                <>
                  <Fingerprint className="size-4 animate-pulse" />
                  <span className="text-sm font-medium">
                    {t('graph.gestures.pinching', 'Pinch to zoom')}
                  </span>
                </>
              )}
              {isPanning && !isPinching && (
                <>
                  <Move className="size-4 animate-pulse" />
                  <span className="text-sm font-medium">
                    {t('graph.gestures.panning', 'Drag to pan')}
                  </span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Control Panel */}
        <div className="rounded-xl border border-border bg-card/95 p-2 shadow-xl backdrop-blur-md sm:p-3">
          {/* Zoom Level Indicator */}
          <div className="mb-2 flex items-center justify-center border-b border-border pb-2">
            <motion.div
              key={displayPercentage}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1.5"
            >
              <span className="text-xs text-muted-foreground">
                {t('graph.controls.zoom', 'Zoom')}
              </span>
              <span className="min-w-[52px] text-center text-lg font-bold text-foreground sm:text-xl">
                {displayPercentage}
              </span>
            </motion.div>
          </div>

          {/* Zoom Slider Visual */}
          <div className="mb-3 px-1">
            <div className="relative h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="absolute inset-y-0 start-0 rounded-full bg-gradient-to-r from-primary to-primary/70"
                style={{ width: `${((zoomLevel - minZoom) / (maxZoom - minZoom)) * 100}%` }}
                layout
                transition={{ duration: 0.2 }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              <span>{Math.round(minZoom * 100)}%</span>
              <span>{Math.round(maxZoom * 100)}%</span>
            </div>
          </div>

          {/* Control Buttons Grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Zoom Out */}
            <Button
              variant="outline"
              size="icon"
              className={cn(
                'min-h-11 min-w-11 h-11 w-full transition-all duration-200',
                'hover:bg-accent hover:scale-105 active:scale-95',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              )}
              onClick={onZoomOut}
              disabled={isAtMinZoom}
              aria-label={t('graph.controls.zoomOut', 'Zoom out')}
            >
              <ZoomOut className="size-5" />
            </Button>

            {/* Zoom In */}
            <Button
              variant="outline"
              size="icon"
              className={cn(
                'min-h-11 min-w-11 h-11 w-full transition-all duration-200',
                'hover:bg-accent hover:scale-105 active:scale-95',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              )}
              onClick={onZoomIn}
              disabled={isAtMaxZoom}
              aria-label={t('graph.controls.zoomIn', 'Zoom in')}
            >
              <ZoomIn className="size-5" />
            </Button>

            {/* Fit View */}
            <Button
              variant="outline"
              size="icon"
              className={cn(
                'min-h-11 min-w-11 h-11 w-full transition-all duration-200',
                'hover:bg-accent hover:scale-105 active:scale-95',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              )}
              onClick={onFitView}
              aria-label={t('graph.controls.fitView', 'Fit view')}
            >
              <Maximize2 className="size-5" />
            </Button>

            {/* Reset View */}
            <Button
              variant="outline"
              size="icon"
              className={cn(
                'min-h-11 min-w-11 h-11 w-full transition-all duration-200',
                'hover:bg-accent hover:scale-105 active:scale-95',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              )}
              onClick={onReset}
              aria-label={t('graph.controls.reset', 'Reset view')}
            >
              <RotateCcw className="size-5" />
            </Button>
          </div>
        </div>

        {/* Gesture Hint - Shows on mobile */}
        {showGestureHint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="hidden rounded-lg bg-muted/80 px-3 py-2 text-xs text-muted-foreground backdrop-blur-sm sm:block"
          >
            <div className="mb-1 flex items-center gap-2">
              <Fingerprint className="size-3.5" />
              <span>{t('graph.hints.pinch', 'Pinch to zoom')}</span>
            </div>
            <div className="mb-1 flex items-center gap-2">
              <Move className="size-3.5" />
              <span>{t('graph.hints.pan', 'Two fingers to pan')}</span>
            </div>
            <div className="flex items-center gap-2">
              <ChevronUp className="size-3.5" />
              <span>{t('graph.hints.doubleTap', 'Double-tap to expand')}</span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
})

/**
 * Compact Floating Zoom Indicator
 * A minimal zoom indicator that appears during zoom gestures
 */
export const FloatingZoomIndicator = memo(function FloatingZoomIndicator({
  zoomLevel,
  isVisible,
  className,
}: {
  zoomLevel: number
  isVisible: boolean
  className?: string
}) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={cn(
            'absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 z-30',
            'bg-black/70 text-white px-6 py-4 rounded-2xl backdrop-blur-sm shadow-2xl',
            className,
          )}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <span className="text-3xl font-bold tabular-nums sm:text-4xl">
            {Math.round(zoomLevel * 100)}%
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
})

/**
 * Minimal Mobile Controls
 * A streamlined version of controls optimized for small screens
 */
export const MobileTouchControls = memo(function MobileTouchControls({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onReset,
  minZoom = 0.1,
  maxZoom = 2,
  className,
}: {
  zoomLevel: number
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  minZoom?: number
  maxZoom?: number
  className?: string
}) {
  const { t, i18n } = useTranslation('relationships')
  const isRTL = i18n.language === 'ar'

  const isAtMinZoom = zoomLevel <= minZoom + 0.05
  const isAtMaxZoom = zoomLevel >= maxZoom - 0.05

  return (
    <div
      className={cn(
        'absolute bottom-4 start-1/2 -translate-x-1/2 z-20',
        'bg-card/95 backdrop-blur-md rounded-full shadow-xl border border-border',
        'flex items-center gap-1 p-1',
        className,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <Button
        variant="ghost"
        size="icon"
        className="size-10 rounded-full"
        onClick={onZoomOut}
        disabled={isAtMinZoom}
        aria-label={t('graph.controls.zoomOut', 'Zoom out')}
      >
        <ChevronDown className="size-5" />
      </Button>

      <div className="min-w-touch-lg px-2 text-center">
        <span className="text-sm font-semibold tabular-nums">{Math.round(zoomLevel * 100)}%</span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="size-10 rounded-full"
        onClick={onZoomIn}
        disabled={isAtMaxZoom}
        aria-label={t('graph.controls.zoomIn', 'Zoom in')}
      >
        <ChevronUp className="size-5" />
      </Button>

      <div className="h-6 w-px bg-border" />

      <Button
        variant="ghost"
        size="icon"
        className="size-10 rounded-full"
        onClick={onReset}
        aria-label={t('graph.controls.reset', 'Reset view')}
      >
        <RotateCcw className="size-4" />
      </Button>
    </div>
  )
})

export default TouchOptimizedGraphControls
