/**
 * ImagePreview Component
 *
 * Image viewer with zoom, pan, and rotate functionality.
 * Mobile-first with touch gesture support. RTL-compatible.
 */
import { useState, useCallback, useRef, useEffect, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { ZoomIn, ZoomOut, RotateCw, RotateCcw, Maximize2, Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ImageViewerOptions } from '@/types/document-preview.types'

interface ImagePreviewProps {
  src: string
  alt: string
  onClose?: () => void
  onDownload?: () => void
  options?: ImageViewerOptions
  className?: string
}

const DEFAULT_OPTIONS: ImageViewerOptions = {
  enable_zoom: true,
  enable_pan: true,
  enable_rotate: true,
  min_zoom: 0.5,
  max_zoom: 5,
  show_controls: true,
}

export const ImagePreview = memo(function ImagePreview({
  src,
  alt,
  onClose,
  onDownload,
  options = {},
  className,
}: ImagePreviewProps) {
  const { t, i18n } = useTranslation('document-preview')
  const isRTL = i18n.language === 'ar'
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

  // State
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const positionStartRef = useRef({ x: 0, y: 0 })

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev * 1.25, mergedOptions.max_zoom!))
  }, [mergedOptions.max_zoom])

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev / 1.25, mergedOptions.min_zoom!))
  }, [mergedOptions.min_zoom])

  const handleFitToScreen = useCallback(() => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  // Rotation handlers
  const handleRotateClockwise = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360)
  }, [])

  const handleRotateCounterClockwise = useCallback(() => {
    setRotation((prev) => (prev - 90 + 360) % 360)
  }, [])

  // Pan handlers (mouse)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!mergedOptions.enable_pan || zoom <= 1) return
      e.preventDefault()
      setIsDragging(true)
      dragStartRef.current = { x: e.clientX, y: e.clientY }
      positionStartRef.current = position
    },
    [mergedOptions.enable_pan, zoom, position],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return
      const dx = e.clientX - dragStartRef.current.x
      const dy = e.clientY - dragStartRef.current.y
      setPosition({
        x: positionStartRef.current.x + dx,
        y: positionStartRef.current.y + dy,
      })
    },
    [isDragging],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Touch handlers for mobile
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!mergedOptions.enable_pan || zoom <= 1) return
      if (e.touches.length === 1) {
        const touch = e.touches[0]
        if (!touch) return
        setIsDragging(true)
        dragStartRef.current = { x: touch.clientX, y: touch.clientY }
        positionStartRef.current = position
      }
    },
    [mergedOptions.enable_pan, zoom, position],
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return
      const touch = e.touches[0]
      if (!touch) return
      const dx = touch.clientX - dragStartRef.current.x
      const dy = touch.clientY - dragStartRef.current.y
      setPosition({
        x: positionStartRef.current.x + dx,
        y: positionStartRef.current.y + dy,
      })
    },
    [isDragging],
  )

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!mergedOptions.enable_zoom) return
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      setZoom((prev) =>
        Math.max(mergedOptions.min_zoom!, Math.min(prev * delta, mergedOptions.max_zoom!)),
      )
    },
    [mergedOptions.enable_zoom, mergedOptions.min_zoom, mergedOptions.max_zoom],
  )

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case '+':
        case '=':
          handleZoomIn()
          break
        case '-':
          handleZoomOut()
          break
        case 'r':
          handleRotateClockwise()
          break
        case 'R':
          handleRotateCounterClockwise()
          break
        case '0':
          handleFitToScreen()
          break
        case 'Escape':
          onClose?.()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    handleZoomIn,
    handleZoomOut,
    handleRotateClockwise,
    handleRotateCounterClockwise,
    handleFitToScreen,
    onClose,
  ])

  // Image load handlers
  const handleImageLoad = useCallback(() => {
    setIsLoading(false)
    setError(null)
  }, [])

  const handleImageError = useCallback(() => {
    setIsLoading(false)
    setError(t('errors.loadFailed', 'Failed to load image'))
  }, [t])

  return (
    <div
      className={cn('relative flex flex-col h-full w-full bg-black/95', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Toolbar */}
      {mergedOptions.show_controls && (
        <div className="flex items-center justify-between gap-2 p-2 sm:p-3 bg-black/50 backdrop-blur-sm">
          {/* Left controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            {mergedOptions.enable_zoom && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= mergedOptions.min_zoom!}
                  className="h-9 w-9 sm:h-10 sm:w-10 text-white hover:bg-white/20"
                  title={t('actions.zoomOut', 'Zoom out')}
                >
                  <ZoomOut className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <span className="text-xs sm:text-sm text-white/80 min-w-[3rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= mergedOptions.max_zoom!}
                  className="h-9 w-9 sm:h-10 sm:w-10 text-white hover:bg-white/20"
                  title={t('actions.zoomIn', 'Zoom in')}
                >
                  <ZoomIn className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFitToScreen}
              className="h-9 w-9 sm:h-10 sm:w-10 text-white hover:bg-white/20"
              title={t('actions.fitToScreen', 'Fit to screen')}
            >
              <Maximize2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>

          {/* Center controls */}
          {mergedOptions.enable_rotate && (
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRotateCounterClockwise}
                className="h-9 w-9 sm:h-10 sm:w-10 text-white hover:bg-white/20"
                title={t('actions.rotateLeft', 'Rotate left')}
              >
                <RotateCcw
                  className={cn('h-4 w-4 sm:h-5 sm:w-5', isRTL && 'transform scale-x-[-1]')}
                />
              </Button>
              <span className="text-xs sm:text-sm text-white/80 min-w-[3rem] text-center">
                {rotation}°
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRotateClockwise}
                className="h-9 w-9 sm:h-10 sm:w-10 text-white hover:bg-white/20"
                title={t('actions.rotateRight', 'Rotate right')}
              >
                <RotateCw
                  className={cn('h-4 w-4 sm:h-5 sm:w-5', isRTL && 'transform scale-x-[-1]')}
                />
              </Button>
            </div>
          )}

          {/* Right controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            {onDownload && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDownload}
                className="h-9 w-9 sm:h-10 sm:w-10 text-white hover:bg-white/20"
                title={t('actions.download', 'Download')}
              >
                <Download className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-9 w-9 sm:h-10 sm:w-10 text-white hover:bg-white/20"
                title={t('actions.close', 'Close')}
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Image container */}
      <div
        ref={containerRef}
        className={cn(
          'flex-1 overflow-hidden flex items-center justify-center',
          isDragging ? 'cursor-grabbing' : zoom > 1 ? 'cursor-grab' : 'cursor-default',
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full border-4 border-white/30 border-t-white animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center text-white/80 p-4">
            <p className="text-base sm:text-lg">{error}</p>
          </div>
        )}

        <img
          ref={imageRef}
          src={src}
          alt={alt}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={cn(
            'max-h-full max-w-full object-contain transition-transform duration-100',
            isLoading && 'opacity-0',
          )}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
            transformOrigin: 'center center',
          }}
          draggable={false}
        />
      </div>

      {/* Touch hint for mobile */}
      {mergedOptions.enable_pan && zoom <= 1 && (
        <div className="sm:hidden absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/60 bg-black/50 px-3 py-1.5 rounded-full">
          {t('hints.pinchToZoom', 'Pinch to zoom, drag to pan')}
        </div>
      )}
    </div>
  )
})

export default ImagePreview
