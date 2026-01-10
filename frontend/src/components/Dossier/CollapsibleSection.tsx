/**
 * CollapsibleSection - WCAG AA compliant accordion component
 * Features: ARIA attributes, keyboard navigation, Framer Motion animations,
 * session storage persistence, 44px touch targets, RTL support
 * Feature: 028-type-specific-dossier-pages
 */

import { useState, useId, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
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
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'
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
    <div className="border rounded-lg overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
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
          'bg-card text-card-foreground',
          'hover:bg-accent hover:text-accent-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'transition-colors duration-200',
          'text-start', // Logical property for RTL support
          headerClassName,
        )}
      >
        <div className="flex-1">
          <h2 className="text-base sm:text-lg font-semibold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
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
          <motion.div
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
                'px-4 py-3 sm:px-6 sm:py-4 bg-background',
                'border-t',
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
                  <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
                  <span className="ms-3 text-muted-foreground">
                    {t('sections.collapsible.loading')}
                  </span>
                </div>
              )}

              {/* Error State - with aria-live for screen readers */}
              {error && !isLoading && (
                <div
                  className="flex items-center justify-center py-8 sm:py-12"
                  role="alert"
                  aria-live="assertive"
                >
                  <p className="text-destructive text-sm sm:text-base">{error}</p>
                </div>
              )}

              {/* Empty State */}
              {showEmptyState && !isLoading && !error && !children && (
                <div className="flex items-center justify-center py-8 sm:py-12">
                  <p className="text-muted-foreground text-sm sm:text-base">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
