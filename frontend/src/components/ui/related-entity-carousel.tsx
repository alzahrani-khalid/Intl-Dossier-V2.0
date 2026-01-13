/**
 * RelatedEntityCarousel Component
 *
 * A horizontally scrolling carousel for displaying related entities (dossiers, persons, organizations).
 * Features:
 * - Snap-to-card behavior with smooth scrolling
 * - Position indicators showing carousel progress
 * - Mobile-first responsive design
 * - Full RTL support with logical properties
 * - Touch-friendly navigation
 * - Keyboard accessibility
 *
 * @example
 * ```tsx
 * <RelatedEntityCarousel
 *   items={relatedDossiers}
 *   renderItem={(item) => <DossierCard dossier={item} />}
 *   title={t('relatedDossiers')}
 * />
 * ```
 */

import * as React from 'react'
import { useCallback, useEffect, useRef, useState, memo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export interface CarouselItem {
  id: string
  [key: string]: unknown
}

interface RelatedEntityCarouselProps<T extends CarouselItem> {
  /** Array of items to display in the carousel */
  items: T[]
  /** Render function for each carousel item */
  renderItem: (item: T, index: number) => React.ReactNode
  /** Optional title for the carousel section */
  title?: string
  /** Optional description for the carousel section */
  description?: string
  /** Additional CSS classes for the container */
  className?: string
  /** Callback when an item is clicked */
  onItemClick?: (item: T) => void
  /** Whether to show navigation arrows (default: true) */
  showNavigation?: boolean
  /** Whether to show position indicators (default: true) */
  showIndicators?: boolean
  /** Custom card width classes (default: responsive widths) */
  cardWidthClass?: string
  /** Empty state message */
  emptyMessage?: string
  /** Empty state description */
  emptyDescription?: string
  /** Custom empty state render */
  renderEmpty?: () => React.ReactNode
  /** Gap between cards (default: 'gap-3 sm:gap-4') */
  gapClass?: string
  /** Test ID for automated testing */
  testId?: string
}

/**
 * Position indicator dot component
 */
const PositionIndicator = memo(function PositionIndicator({
  isActive,
  onClick,
  index,
  isRTL,
}: {
  isActive: boolean
  onClick: () => void
  index: number
  isRTL: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full transition-all duration-300',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        isActive ? 'bg-primary scale-110' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50',
      )}
      aria-label={`Go to slide ${index + 1}`}
      aria-current={isActive ? 'true' : undefined}
    />
  )
})

/**
 * Navigation arrow button component
 */
const NavigationButton = memo(function NavigationButton({
  direction,
  onClick,
  disabled,
  isRTL,
}: {
  direction: 'prev' | 'next'
  onClick: () => void
  disabled: boolean
  isRTL: boolean
}) {
  const { t } = useTranslation('dossier')

  // In RTL, prev/next arrows should be flipped
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight
  const label =
    direction === 'prev' ? t('carousel.previous', 'Previous') : t('carousel.next', 'Next')

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-8 w-8 sm:h-10 sm:w-10 rounded-full',
        'shadow-md bg-background/95 backdrop-blur-sm',
        'transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'hover:bg-accent hover:scale-105',
        'focus-visible:ring-2 focus-visible:ring-primary',
      )}
      aria-label={label}
    >
      <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', isRTL && 'rotate-180')} />
    </Button>
  )
})

/**
 * Main carousel component
 */
function RelatedEntityCarouselInner<T extends CarouselItem>({
  items,
  renderItem,
  title,
  description,
  className,
  onItemClick,
  showNavigation = true,
  showIndicators = true,
  cardWidthClass = 'w-[280px] sm:w-[320px] md:w-[360px]',
  emptyMessage,
  emptyDescription,
  renderEmpty,
  gapClass = 'gap-3 sm:gap-4',
  testId = 'related-entity-carousel',
}: RelatedEntityCarouselProps<T>) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [visibleCount, setVisibleCount] = useState(1)

  // Calculate number of pages based on visible items
  const totalPages = Math.max(1, Math.ceil(items.length / Math.max(1, visibleCount)))
  const currentPage = Math.min(Math.floor(activeIndex / Math.max(1, visibleCount)), totalPages - 1)

  /**
   * Update scroll state and active index
   */
  const updateScrollState = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const { scrollLeft, scrollWidth, clientWidth } = container
    const adjustedScrollLeft = isRTL ? -scrollLeft : scrollLeft

    // Check if we can scroll in either direction
    const maxScroll = scrollWidth - clientWidth
    setCanScrollPrev(adjustedScrollLeft > 1)
    setCanScrollNext(adjustedScrollLeft < maxScroll - 1)

    // Calculate visible cards and active index
    const cardElements = container.querySelectorAll('[data-carousel-item]')
    if (cardElements.length === 0) return

    const firstCard = cardElements[0] as HTMLElement
    const cardWidth = firstCard.offsetWidth
    const gap = parseInt(getComputedStyle(container).gap) || 16
    const cardWithGap = cardWidth + gap

    // Calculate how many cards are visible
    const visible = Math.max(1, Math.floor(clientWidth / cardWithGap))
    setVisibleCount(visible)

    // Calculate active index based on scroll position
    const newIndex = Math.round(adjustedScrollLeft / cardWithGap)
    setActiveIndex(Math.max(0, Math.min(newIndex, items.length - 1)))
  }, [isRTL, items.length])

  /**
   * Scroll to a specific index with snap behavior
   */
  const scrollToIndex = useCallback(
    (index: number) => {
      const container = scrollContainerRef.current
      if (!container) return

      const cardElements = container.querySelectorAll('[data-carousel-item]')
      if (cardElements.length === 0 || index >= cardElements.length) return

      const targetCard = cardElements[index] as HTMLElement
      const containerRect = container.getBoundingClientRect()
      const cardRect = targetCard.getBoundingClientRect()

      // Calculate scroll position to center the card (or align to start)
      const scrollOffset = isRTL
        ? -(targetCard.offsetLeft - container.offsetLeft)
        : targetCard.offsetLeft - container.offsetLeft

      container.scrollTo({
        left: isRTL ? -scrollOffset : scrollOffset,
        behavior: 'smooth',
      })
    },
    [isRTL],
  )

  /**
   * Navigate to previous set of items
   */
  const scrollPrev = useCallback(() => {
    const newIndex = Math.max(0, activeIndex - visibleCount)
    scrollToIndex(newIndex)
  }, [activeIndex, visibleCount, scrollToIndex])

  /**
   * Navigate to next set of items
   */
  const scrollNext = useCallback(() => {
    const newIndex = Math.min(items.length - 1, activeIndex + visibleCount)
    scrollToIndex(newIndex)
  }, [activeIndex, items.length, visibleCount, scrollToIndex])

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const { key } = event

      if (key === 'ArrowLeft' || key === 'ArrowRight') {
        event.preventDefault()
        // In RTL, arrow directions should be reversed
        const isPrev = isRTL ? key === 'ArrowRight' : key === 'ArrowLeft'
        if (isPrev) {
          scrollPrev()
        } else {
          scrollNext()
        }
      }
    },
    [isRTL, scrollPrev, scrollNext],
  )

  /**
   * Initialize and update scroll state
   */
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    // Initial state
    updateScrollState()

    // Listen to scroll events
    const handleScroll = () => {
      requestAnimationFrame(updateScrollState)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })

    // Listen to resize events
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(updateScrollState)
    })
    resizeObserver.observe(container)

    return () => {
      container.removeEventListener('scroll', handleScroll)
      resizeObserver.disconnect()
    }
  }, [updateScrollState])

  // Re-update when items change
  useEffect(() => {
    updateScrollState()
  }, [items.length, updateScrollState])

  // Empty state
  if (items.length === 0) {
    if (renderEmpty) {
      return renderEmpty()
    }

    return (
      <div
        className={cn('py-8 sm:py-12 text-center', className)}
        dir={isRTL ? 'rtl' : 'ltr'}
        data-testid={`${testId}-empty`}
      >
        <p className="text-sm sm:text-base text-muted-foreground">
          {emptyMessage || t('carousel.empty', 'No items to display')}
        </p>
        {emptyDescription && (
          <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1">{emptyDescription}</p>
        )}
      </div>
    )
  }

  return (
    <div className={cn('relative', className)} dir={isRTL ? 'rtl' : 'ltr'} data-testid={testId}>
      {/* Header with title and navigation */}
      {(title || showNavigation) && (
        <div className="flex items-center justify-between gap-4 mb-3 sm:mb-4">
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-sm sm:text-base font-semibold text-foreground truncate">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">
                {description}
              </p>
            )}
          </div>

          {/* Desktop navigation arrows */}
          {showNavigation && items.length > visibleCount && (
            <div className="hidden sm:flex items-center gap-2">
              <NavigationButton
                direction="prev"
                onClick={scrollPrev}
                disabled={!canScrollPrev}
                isRTL={isRTL}
              />
              <NavigationButton
                direction="next"
                onClick={scrollNext}
                disabled={!canScrollNext}
                isRTL={isRTL}
              />
            </div>
          )}
        </div>
      )}

      {/* Scroll container with fade indicators */}
      <div className="relative group">
        {/* Start fade gradient */}
        <div
          className={cn(
            'absolute top-0 bottom-0 w-6 sm:w-12 z-10 pointer-events-none transition-opacity duration-300',
            'bg-gradient-to-e from-background to-transparent',
            isRTL ? 'end-0' : 'start-0',
            canScrollPrev ? 'opacity-100' : 'opacity-0',
          )}
          aria-hidden="true"
        />

        {/* End fade gradient */}
        <div
          className={cn(
            'absolute top-0 bottom-0 w-6 sm:w-12 z-10 pointer-events-none transition-opacity duration-300',
            'bg-gradient-to-s from-background to-transparent',
            isRTL ? 'start-0' : 'end-0',
            canScrollNext ? 'opacity-100' : 'opacity-0',
          )}
          aria-hidden="true"
        />

        {/* Scrollable carousel */}
        <div
          ref={scrollContainerRef}
          className={cn(
            'flex overflow-x-auto scrollbar-hide',
            'scroll-smooth snap-x snap-mandatory',
            '-mx-4 px-4 sm:-mx-6 sm:px-6',
            gapClass,
          )}
          role="region"
          aria-label={title || t('carousel.label', 'Related items carousel')}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          data-testid={`${testId}-scroll-container`}
        >
          {items.map((item, index) => (
            <div
              key={item.id}
              className={cn('flex-shrink-0 snap-start', cardWidthClass)}
              data-carousel-item
              data-testid={`${testId}-item-${index}`}
            >
              <div
                className={cn('h-full', onItemClick && 'cursor-pointer')}
                onClick={() => onItemClick?.(item)}
                role={onItemClick ? 'button' : undefined}
                tabIndex={onItemClick ? 0 : undefined}
                onKeyDown={(e) => {
                  if (onItemClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onItemClick(item)
                  }
                }}
              >
                {renderItem(item, index)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Position indicators */}
      {showIndicators && totalPages > 1 && (
        <div
          className="flex items-center justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4"
          role="tablist"
          aria-label={t('carousel.pagination', 'Carousel pagination')}
          data-testid={`${testId}-indicators`}
        >
          {Array.from({ length: totalPages }).map((_, pageIndex) => (
            <PositionIndicator
              key={pageIndex}
              isActive={pageIndex === currentPage}
              onClick={() => scrollToIndex(pageIndex * visibleCount)}
              index={pageIndex}
              isRTL={isRTL}
            />
          ))}
        </div>
      )}

      {/* Item count indicator */}
      <div className="flex justify-center mt-2">
        <span className="text-xs text-muted-foreground">
          {t('carousel.itemCount', '{{current}} of {{total}}', {
            current: Math.min(activeIndex + visibleCount, items.length),
            total: items.length,
          })}
        </span>
      </div>
    </div>
  )
}

// Export with proper typing
export const RelatedEntityCarousel = memo(
  RelatedEntityCarouselInner,
) as typeof RelatedEntityCarouselInner
