/**
 * PDFPreview Component
 *
 * PDF viewer with page navigation, zoom, and printing support.
 * Uses react-pdf for rendering. Mobile-first with RTL support.
 */
import { useState, useCallback, useEffect, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Document, Page, pdfjs } from 'react-pdf'
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Printer,
  X,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { PDFViewerOptions } from '@/types/document-preview.types'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

// Import required CSS
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

interface PDFPreviewProps {
  src: string
  onClose?: () => void
  onDownload?: () => void
  onPageChange?: (page: number, totalPages: number) => void
  options?: PDFViewerOptions
  className?: string
}

const DEFAULT_OPTIONS: PDFViewerOptions = {
  show_page_navigation: true,
  show_toolbar: true,
  show_thumbnails_sidebar: false,
  fit_mode: 'width',
  rotation: 0,
}

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3]

export const PDFPreview = memo(function PDFPreview({
  src,
  onClose,
  onDownload,
  onPageChange,
  options = {},
  className,
}: PDFPreviewProps) {
  const { t, i18n } = useTranslation('document-preview')
  const isRTL = i18n.language === 'ar'
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

  // State
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [zoom, setZoom] = useState<number>(1)
  const [containerWidth, setContainerWidth] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [pageInputValue, setPageInputValue] = useState<string>('1')

  // Update page input when currentPage changes
  useEffect(() => {
    setPageInputValue(String(currentPage))
  }, [currentPage])

  // Document load handlers
  const handleDocumentLoadSuccess = useCallback(
    ({ numPages: pages }: { numPages: number }) => {
      setNumPages(pages)
      setIsLoading(false)
      setError(null)
      onPageChange?.(1, pages)
    },
    [onPageChange],
  )

  const handleDocumentLoadError = useCallback(
    (err: Error) => {
      console.error('PDF load error:', err)
      setIsLoading(false)
      setError(t('errors.pdfLoadFailed', 'Failed to load PDF'))
    },
    [t],
  )

  // Navigation handlers
  const goToPage = useCallback(
    (page: number) => {
      const newPage = Math.max(1, Math.min(page, numPages))
      setCurrentPage(newPage)
      onPageChange?.(newPage, numPages)
    },
    [numPages, onPageChange],
  )

  const goToFirstPage = useCallback(() => goToPage(1), [goToPage])
  const goToLastPage = useCallback(() => goToPage(numPages), [goToPage, numPages])
  const goToPreviousPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage])
  const goToNextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage])

  const handlePageInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInputValue(e.target.value)
  }, [])

  const handlePageInputBlur = useCallback(() => {
    const page = parseInt(pageInputValue, 10)
    if (!isNaN(page) && page >= 1 && page <= numPages) {
      goToPage(page)
    } else {
      setPageInputValue(String(currentPage))
    }
  }, [pageInputValue, numPages, goToPage, currentPage])

  const handlePageInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handlePageInputBlur()
      }
    },
    [handlePageInputBlur],
  )

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    const currentIndex = ZOOM_LEVELS.findIndex((z) => z >= zoom)
    const nextIndex = Math.min(currentIndex + 1, ZOOM_LEVELS.length - 1)
    const nextZoom = ZOOM_LEVELS[nextIndex]
    if (nextZoom !== undefined) {
      setZoom(nextZoom)
    }
  }, [zoom])

  const handleZoomOut = useCallback(() => {
    const currentIndex = ZOOM_LEVELS.findIndex((z) => z >= zoom)
    const prevIndex = Math.max(currentIndex - 1, 0)
    const prevZoom = ZOOM_LEVELS[prevIndex]
    if (prevZoom !== undefined) {
      setZoom(prevZoom)
    }
  }, [zoom])

  const handleFitToWidth = useCallback(() => {
    setZoom(1)
  }, [])

  // Print handler
  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if input is focused
      if (document.activeElement?.tagName === 'INPUT') return

      switch (e.key) {
        case 'ArrowLeft':
          isRTL ? goToNextPage() : goToPreviousPage()
          break
        case 'ArrowRight':
          isRTL ? goToPreviousPage() : goToNextPage()
          break
        case 'Home':
          goToFirstPage()
          break
        case 'End':
          goToLastPage()
          break
        case '+':
        case '=':
          handleZoomIn()
          break
        case '-':
          handleZoomOut()
          break
        case 'Escape':
          onClose?.()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    goToPreviousPage,
    goToNextPage,
    goToFirstPage,
    goToLastPage,
    handleZoomIn,
    handleZoomOut,
    onClose,
    isRTL,
  ])

  // Container resize observer
  useEffect(() => {
    const container = document.getElementById('pdf-container')
    if (!container) return

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setContainerWidth(entry.contentRect.width)
      }
    })

    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [])

  const pageWidth = containerWidth ? Math.min(containerWidth - 32, 800) * zoom : undefined

  return (
    <div
      className={cn('relative flex flex-col h-full w-full bg-gray-900', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Toolbar */}
      {mergedOptions.show_toolbar && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 sm:p-3 bg-gray-800/95 backdrop-blur-sm border-b border-gray-700">
          {/* Navigation controls */}
          {mergedOptions.show_page_navigation && (
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToFirstPage}
                disabled={currentPage <= 1}
                className="h-9 w-9 text-gray-200 hover:bg-gray-700 hidden sm:flex"
                title={t('actions.firstPage', 'First page')}
              >
                <ChevronsLeft className={cn('h-4 w-4', isRTL && 'rotate-180')} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPreviousPage}
                disabled={currentPage <= 1}
                className="h-9 w-9 text-gray-200 hover:bg-gray-700"
                title={t('actions.previousPage', 'Previous page')}
              >
                <ChevronLeft className={cn('h-4 w-4', isRTL && 'rotate-180')} />
              </Button>

              <div className="flex items-center gap-1 text-gray-200 text-sm">
                <Input
                  type="text"
                  value={pageInputValue}
                  onChange={handlePageInputChange}
                  onBlur={handlePageInputBlur}
                  onKeyDown={handlePageInputKeyDown}
                  className="h-8 w-12 sm:w-14 text-center bg-gray-700 border-gray-600 text-gray-200"
                />
                <span className="text-gray-400">/</span>
                <span>{numPages}</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage >= numPages}
                className="h-9 w-9 text-gray-200 hover:bg-gray-700"
                title={t('actions.nextPage', 'Next page')}
              >
                <ChevronRight className={cn('h-4 w-4', isRTL && 'rotate-180')} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToLastPage}
                disabled={currentPage >= numPages}
                className="h-9 w-9 text-gray-200 hover:bg-gray-700 hidden sm:flex"
                title={t('actions.lastPage', 'Last page')}
              >
                <ChevronsRight className={cn('h-4 w-4', isRTL && 'rotate-180')} />
              </Button>
            </div>
          )}

          {/* Zoom controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= (ZOOM_LEVELS[0] ?? 0.5)}
              className="h-9 w-9 text-gray-200 hover:bg-gray-700"
              title={t('actions.zoomOut', 'Zoom out')}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs sm:text-sm text-gray-300 min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= (ZOOM_LEVELS[ZOOM_LEVELS.length - 1] ?? 3)}
              className="h-9 w-9 text-gray-200 hover:bg-gray-700"
              title={t('actions.zoomIn', 'Zoom in')}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFitToWidth}
              className="h-9 w-9 text-gray-200 hover:bg-gray-700"
              title={t('actions.fitToWidth', 'Fit to width')}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Action controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrint}
              className="h-9 w-9 text-gray-200 hover:bg-gray-700 hidden sm:flex"
              title={t('actions.print', 'Print')}
            >
              <Printer className="h-4 w-4" />
            </Button>
            {onDownload && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDownload}
                className="h-9 w-9 text-gray-200 hover:bg-gray-700"
                title={t('actions.download', 'Download')}
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-9 w-9 text-gray-200 hover:bg-gray-700"
                title={t('actions.close', 'Close')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* PDF Container */}
      <div
        id="pdf-container"
        className="flex-1 overflow-auto flex flex-col items-center py-4 px-2 sm:px-4"
      >
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full border-4 border-gray-600 border-t-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-400 text-sm sm:text-base">
                {t('loading.pdf', 'Loading PDF...')}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400 p-4">
              <p className="text-base sm:text-lg">{error}</p>
            </div>
          </div>
        )}

        <Document
          file={src}
          onLoadSuccess={handleDocumentLoadSuccess}
          onLoadError={handleDocumentLoadError}
          loading={null}
          error={null}
          className="max-w-full"
        >
          <Page
            pageNumber={currentPage}
            width={pageWidth}
            renderAnnotationLayer
            renderTextLayer
            loading={
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 rounded-full border-2 border-gray-600 border-t-blue-500 animate-spin" />
              </div>
            }
            className="shadow-lg"
          />
        </Document>
      </div>

      {/* Mobile page indicator */}
      {numPages > 0 && (
        <div className="sm:hidden fixed bottom-4 start-1/2 -translate-x-1/2 text-xs text-gray-300 bg-gray-800/90 px-3 py-1.5 rounded-full">
          {currentPage} / {numPages}
        </div>
      )}
    </div>
  )
})

export default PDFPreview
