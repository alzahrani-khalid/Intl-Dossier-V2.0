/**
 * CollapsibleSection - WCAG AA compliant accordion component
 * Features: ARIA attributes, keyboard navigation, Framer Motion animations,
 * session storage persistence, 44px touch targets, RTL support
 * Feature: 028-type-specific-dossier-pages
 */

import { useState, useId, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { m, AnimatePresence } from 'framer-motion'
import { ChevronDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollapsibleSectionProps {
  /**
   * Unique section identifier (for session storage)
   */
  id: string

  /**
   * Section title (supports i18n keys or plain text)
   */
  title: string

  /**
   * Optional description shown below title
   */
  description?: string

  /**
   * Section content
   */
  children: ReactNode

  /**
   * Default expanded state (overridden by session storage)
   */
  defaultExpanded?: boolean

  /**
   * Controlled expanded state (optional)
   */
  isExpanded?: boolean

  /**
   * Controlled toggle handler (optional)
   */
  onToggle?: (expanded: boolean) => void

  /**
   * Loading state
   */
  isLoading?: boolean

  /**
   * Error state
   */
  error?: string

  /**
   * Empty state message
   */
  emptyMessage?: string

  /**
   * Show empty state when no children provided
   */
  showEmptyState?: boolean

  /**
   * Custom header class name
   */
  headerClassName?: string

  /**
   * Custom content class name
   */
  contentClassName?: string
}

/**
 * CollapsibleSection component
 * WCAG AA compliant with ARIA accordion pattern
 */
export function CollapsibleSection({
  id,
  title,
  description,
  children,
  defaultExpanded = true,
  isExpanded: controlledExpanded,
  onToggle,
  isLoading = false,
  error,
  emptyMessage,
  showEmptyState = false,
  headerClassName,
  contentClassName,
}: CollapsibleSectionProps) {
  const { t } = useTranslation('dossier')
  const uniqueId = useId()

  // Use controlled state if provided, otherwise use internal state
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded)
  const isExpanded = controlledExpanded ?? internalExpanded

  // Generate unique IDs for ARIA attributes
  const headerId = `collapsible-header-${uniqueId}-${id}`
  const panelId = `collapsible-panel-${uniqueId}-${id}`

  // Handle toggle
  const handleToggle = () => {
    const newValue = !isExpanded
    if (onToggle) {
      onToggle(newValue)
    } else {
      setInternalExpanded(newValue)
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleToggle()
    }
  }

  return (
    <div className="card overflow-hidden p-0">
      {/* Header - WCAG AA touch target: min 44x44px */}
      <button
        type="button"
        id={headerId}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full min-h-11 px-4 py-3 sm:px-6 sm:py-4',
          'flex items-center justify-between gap-3',
          'bg-[var(--surface)] text-[var(--ink)]',
          'hover:bg-[var(--line-soft)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
          'transition-colors duration-200',
          'text-start', // Logical property for RTL support
          headerClassName,
        )}
      >
        <div className="flex-1">
          <h2 className="card-title">{title}</h2>
          {description && <p className="card-sub mt-1">{description}</p>}
        </div>

        {/* Chevron icon */}
        <ChevronDown
          className={cn(
            'h-5 w-5 text-muted-foreground',
            'transition-transform duration-300',
            isExpanded && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>

      {/* Content Panel - AnimatePresence for smooth transitions */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              duration: 0.3,
              ease: [0.04, 0.62, 0.23, 0.98], // Custom easing for smooth motion
            }}
            role="region"
            id={panelId}
            aria-labelledby={headerId}
          >
            <div
              className={cn(
                'border-t border-[var(--line)] bg-[var(--surface)] px-4 py-3 sm:px-6 sm:py-4',
                contentClassName,
              )}
            >
              {/* Loading State - with aria-live for screen readers */}
              {isLoading && (
                <div
                  className="flex items-center justify-center py-8 sm:py-12"
                  aria-live="polite"
                  aria-busy="true"
                >
                  <Loader2 className="h-6 w-6 animate-spin text-[var(--ink-mute)] sm:h-8 sm:w-8" />
                  <span className="card-sub ms-3">{t('sections.collapsible.loading')}</span>
                </div>
              )}

              {/* Error State - with aria-live for screen readers */}
              {error && !isLoading && (
                <div
                  className="flex items-center justify-center py-8 sm:py-12"
                  role="alert"
                  aria-live="assertive"
                >
                  <p className="text-sm text-[var(--danger)] sm:text-base">{error}</p>
                </div>
              )}

              {/* Empty State */}
              {showEmptyState && !isLoading && !error && !children && (
                <div className="flex items-center justify-center py-8 sm:py-12">
                  <p className="text-sm text-[var(--ink-mute)] sm:text-base">
                    {emptyMessage || t('sections.collapsible.empty')}
                  </p>
                </div>
              )}

              {/* Content */}
              {!isLoading && !error && children && (
                <div className="prose prose-sm sm:prose max-w-none dark:prose-invert">
                  {children}
                </div>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
