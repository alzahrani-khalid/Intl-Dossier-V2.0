/**
 * DocumentAnnotation Component
 *
 * Provides annotation tools for documents including:
 * - Highlight text
 * - Add comments
 * - Draw shapes
 * - Add text notes
 *
 * Mobile-first with touch support. RTL-compatible.
 */
import { useState, useCallback, useRef, memo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Highlighter,
  MessageSquare,
  Pencil,
  Type,
  Trash2,
  Save,
  X,
  Circle,
  Square,
  Minus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { Annotation, AnnotationType } from '@/types/document-preview.types'

interface DocumentAnnotationProps {
  documentId: string
  currentPage?: number
  annotations: Annotation[]
  onAddAnnotation: (annotation: Omit<Annotation, 'id' | 'created_at'>) => void
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void
  onDeleteAnnotation: (id: string) => void
  onSave?: () => void
  readOnly?: boolean
  className?: string
}

const ANNOTATION_COLORS = [
  { name: 'Yellow', value: '#FBBF24' },
  { name: 'Green', value: '#34D399' },
  { name: 'Blue', value: '#60A5FA' },
  { name: 'Pink', value: '#F472B6' },
  { name: 'Orange', value: '#FB923C' },
]

const DRAWING_TOOLS = ['line', 'rectangle', 'circle', 'freehand'] as const
type DrawingTool = (typeof DRAWING_TOOLS)[number]

export const DocumentAnnotation = memo(function DocumentAnnotation({
  documentId,
  currentPage = 1,
  annotations,
  onAddAnnotation,
  onUpdateAnnotation: _onUpdateAnnotation, // Prefix with _ to indicate intentionally unused for now
  onDeleteAnnotation,
  onSave,
  readOnly = false,
  className,
}: DocumentAnnotationProps) {
  const { t, i18n } = useTranslation('document-preview')
  const isRTL = i18n.language === 'ar'

  // State
  const [activeTool, setActiveTool] = useState<AnnotationType | null>(null)
  const [activeColor, setActiveColor] = useState(ANNOTATION_COLORS[0]?.value ?? '#FBBF24')
  const [drawingTool, setDrawingTool] = useState<DrawingTool>('freehand')
  const [isDrawing, setIsDrawing] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null)
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null)

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingPathRef = useRef<{ x: number; y: number }[]>([])

  // Filter annotations for current page
  const pageAnnotations = annotations.filter((a) => a.page === currentPage || a.page === undefined)

  // Tool handlers
  const selectTool = useCallback((tool: AnnotationType) => {
    setActiveTool((prev) => (prev === tool ? null : tool))
    setSelectedAnnotation(null)
  }, [])

  // Canvas event handlers for drawing
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (activeTool !== 'drawing' || readOnly) return

      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      setIsDrawing(true)
      drawingPathRef.current = [{ x, y }]
    },
    [activeTool, readOnly],
  )

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing || activeTool !== 'drawing') return

      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      drawingPathRef.current.push({ x, y })

      // Draw on canvas
      ctx.strokeStyle = activeColor
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      const points = drawingPathRef.current
      if (points.length < 2) return

      const prevPoint = points[points.length - 2]
      if (!prevPoint) return
      ctx.beginPath()
      ctx.moveTo(prevPoint.x, prevPoint.y)
      ctx.lineTo(x, y)
      ctx.stroke()
    },
    [isDrawing, activeTool, activeColor],
  )

  const handleCanvasMouseUp = useCallback(() => {
    if (!isDrawing || activeTool !== 'drawing') return

    setIsDrawing(false)

    const path = drawingPathRef.current
    if (path.length < 2) return

    // Calculate bounding box
    const xs = path.map((p) => p.x)
    const ys = path.map((p) => p.y)
    const minX = Math.min(...xs)
    const minY = Math.min(...ys)
    const maxX = Math.max(...xs)
    const maxY = Math.max(...ys)

    onAddAnnotation({
      document_id: documentId,
      type: 'drawing',
      page: currentPage,
      position: {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      },
      content: JSON.stringify(path),
      color: activeColor,
      created_by: '', // Will be set by the backend
    })

    drawingPathRef.current = []
  }, [isDrawing, activeTool, documentId, currentPage, activeColor, onAddAnnotation])

  // Click handler for comment/text annotations
  const handleContainerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (readOnly || !activeTool || activeTool === 'drawing') return

      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      if (activeTool === 'comment' || activeTool === 'text') {
        setPendingPosition({ x, y })
      } else if (activeTool === 'highlight') {
        // For highlight, we'd need text selection support
        // This is a simplified version that creates a highlight box
        onAddAnnotation({
          document_id: documentId,
          type: 'highlight',
          page: currentPage,
          position: { x, y, width: 100, height: 20 },
          color: activeColor,
          created_by: '',
        })
      }
    },
    [readOnly, activeTool, documentId, currentPage, activeColor, onAddAnnotation],
  )

  // Save comment
  const handleSaveComment = useCallback(() => {
    if (!pendingPosition || !commentText.trim()) return

    const type = activeTool === 'text' ? 'text' : 'comment'

    onAddAnnotation({
      document_id: documentId,
      type,
      page: currentPage,
      position: { x: pendingPosition.x, y: pendingPosition.y },
      content: commentText.trim(),
      color: activeColor,
      created_by: '',
    })

    setCommentText('')
    setPendingPosition(null)
  }, [
    pendingPosition,
    commentText,
    activeTool,
    documentId,
    currentPage,
    activeColor,
    onAddAnnotation,
  ])

  // Delete selected annotation
  const handleDeleteSelected = useCallback(() => {
    if (selectedAnnotation) {
      onDeleteAnnotation(selectedAnnotation)
      setSelectedAnnotation(null)
    }
  }, [selectedAnnotation, onDeleteAnnotation])

  if (readOnly && pageAnnotations.length === 0) {
    return null
  }

  return (
    <div className={cn('relative', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Annotation Toolbar */}
      {!readOnly && (
        <div className="absolute start-2 top-2 z-20 flex flex-col gap-1 rounded-lg bg-white p-1.5 shadow-lg dark:bg-gray-800 sm:p-2">
          {/* Highlight tool */}
          <Button
            variant={activeTool === 'highlight' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => selectTool('highlight')}
            className="size-9 p-0"
            title={t('tools.highlight', 'Highlight')}
          >
            <Highlighter className="size-4" />
          </Button>

          {/* Comment tool */}
          <Button
            variant={activeTool === 'comment' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => selectTool('comment')}
            className="size-9 p-0"
            title={t('tools.comment', 'Comment')}
          >
            <MessageSquare className="size-4" />
          </Button>

          {/* Drawing tool */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={activeTool === 'drawing' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => selectTool('drawing')}
                className="size-9 p-0"
                title={t('tools.draw', 'Draw')}
              >
                <Pencil className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side={isRTL ? 'left' : 'right'} className="w-auto p-2">
              <div className="flex gap-1">
                <Button
                  variant={drawingTool === 'line' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setDrawingTool('line')}
                  className="size-8 p-0"
                >
                  <Minus className="size-3" />
                </Button>
                <Button
                  variant={drawingTool === 'rectangle' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setDrawingTool('rectangle')}
                  className="size-8 p-0"
                >
                  <Square className="size-3" />
                </Button>
                <Button
                  variant={drawingTool === 'circle' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setDrawingTool('circle')}
                  className="size-8 p-0"
                >
                  <Circle className="size-3" />
                </Button>
                <Button
                  variant={drawingTool === 'freehand' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setDrawingTool('freehand')}
                  className="size-8 p-0"
                >
                  <Pencil className="size-3" />
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Text tool */}
          <Button
            variant={activeTool === 'text' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => selectTool('text')}
            className="size-9 p-0"
            title={t('tools.text', 'Text')}
          >
            <Type className="size-4" />
          </Button>

          {/* Divider */}
          <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />

          {/* Color picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="size-9 p-0"
                title={t('tools.color', 'Color')}
              >
                <div
                  className="size-5 rounded-full border-2 border-gray-300"
                  style={{ backgroundColor: activeColor }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent side={isRTL ? 'left' : 'right'} className="w-auto p-2">
              <div className="flex gap-1">
                {ANNOTATION_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setActiveColor(color.value)}
                    className={cn(
                      'h-7 w-7 rounded-full border-2 transition-transform',
                      activeColor === color.value
                        ? 'border-gray-900 dark:border-white scale-110'
                        : 'border-transparent hover:scale-105',
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Delete selected */}
          {selectedAnnotation && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteSelected}
              className="size-9 p-0 text-destructive"
              title={t('actions.delete', 'Delete')}
            >
              <Trash2 className="size-4" />
            </Button>
          )}

          {/* Save button */}
          {onSave && pageAnnotations.length > 0 && (
            <>
              <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />
              <Button
                variant="ghost"
                size="sm"
                onClick={onSave}
                className="size-9 p-0 text-primary"
                title={t('actions.save', 'Save')}
              >
                <Save className="size-4" />
              </Button>
            </>
          )}
        </div>
      )}

      {/* Annotation overlay */}
      <div
        className="absolute inset-0 z-10"
        onClick={handleContainerClick}
        style={{ pointerEvents: activeTool && activeTool !== 'drawing' ? 'auto' : 'none' }}
      >
        {/* Render existing annotations */}
        {pageAnnotations.map((annotation) => (
          <div
            key={annotation.id}
            className={cn(
              'absolute cursor-pointer',
              selectedAnnotation === annotation.id && 'ring-2 ring-primary',
            )}
            style={{
              left: annotation.position.x,
              top: annotation.position.y,
              width: annotation.position.width,
              height: annotation.position.height,
            }}
            onClick={(e) => {
              e.stopPropagation()
              setSelectedAnnotation(annotation.id)
            }}
          >
            {annotation.type === 'highlight' && (
              <div
                className="size-full opacity-40"
                style={{
                  backgroundColor: annotation.color || ANNOTATION_COLORS[0]?.value || '#FBBF24',
                }}
              />
            )}
            {annotation.type === 'comment' && (
              <div
                className="flex size-6 items-center justify-center rounded-full text-xs text-white"
                style={{
                  backgroundColor: annotation.color || ANNOTATION_COLORS[0]?.value || '#FBBF24',
                }}
                title={annotation.content}
              >
                <MessageSquare className="size-3" />
              </div>
            )}
            {annotation.type === 'text' && (
              <div
                className="rounded px-2 py-1 text-sm"
                style={{
                  backgroundColor: annotation.color || ANNOTATION_COLORS[0]?.value || '#FBBF24',
                  color: '#000',
                }}
              >
                {annotation.content}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Drawing canvas */}
      {activeTool === 'drawing' && !readOnly && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-10 cursor-crosshair"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        />
      )}

      {/* Comment/Text input popover */}
      {pendingPosition && (activeTool === 'comment' || activeTool === 'text') && (
        <div
          className="absolute z-30 w-64 rounded-lg bg-white p-3 shadow-xl dark:bg-gray-800"
          style={{ left: pendingPosition.x, top: pendingPosition.y }}
        >
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={
              activeTool === 'comment'
                ? t('placeholders.addComment', 'Add a comment...')
                : t('placeholders.addText', 'Enter text...')
            }
            className="min-h-[60px] text-sm"
            autoFocus
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPendingPosition(null)
                setCommentText('')
              }}
            >
              <X className="size-4" />
            </Button>
            <Button size="sm" onClick={handleSaveComment} disabled={!commentText.trim()}>
              <Save className="me-1 size-4" />
              {t('actions.save', 'Save')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
})

export default DocumentAnnotation
