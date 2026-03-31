/**
 * ZoneCollapsible Component
 * Phase 10: Operations Hub Dashboard
 *
 * Mobile: renders collapsible card with animated expand/collapse.
 * Desktop: passes children through without wrapper (D-02).
 *
 * Respects prefers-reduced-motion for accessibility.
 */

import { useState, useId, useCallback } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { useResponsive } from '@/hooks/useResponsive'

interface ZoneCollapsibleProps {
  title: string
  defaultExpanded: boolean
  badgeCount?: number
  children: React.ReactNode
}

/**
 * Checks if the user prefers reduced motion.
 */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function ZoneCollapsible({
  title,
  defaultExpanded,
  badgeCount,
  children,
}: ZoneCollapsibleProps): React.ReactElement {
  const { isMobile } = useResponsive()
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const [expanded, setExpanded] = useState(defaultExpanded)
  const contentId = useId()
  const triggerId = useId()

  const toggleExpanded = useCallback((): void => {
    setExpanded((prev) => !prev)
  }, [])

  // Desktop: pass children through without wrapper
  if (!isMobile) {
    return <>{children}</>
  }

  const skipAnimation = prefersReducedMotion()

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      {/* Header button */}
      <button
        id={triggerId}
        type="button"
        className="flex w-full items-center justify-between min-h-11 px-4 py-3"
        onClick={toggleExpanded}
        aria-expanded={expanded}
        aria-controls={contentId}
      >
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold">{title}</span>
          {badgeCount != null && badgeCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {badgeCount}
            </Badge>
          )}
        </div>
        <m.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={skipAnimation ? { duration: 0 } : { duration: 0.25, ease: 'easeOut' }}
          className={`flex items-center ${isRTL ? 'scale-x-[-1]' : ''}`}
        >
          <ChevronDown className="size-5 text-muted-foreground" />
        </m.span>
      </button>

      {/* Collapsible content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <m.div
            id={contentId}
            role="region"
            aria-labelledby={triggerId}
            initial={skipAnimation ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={skipAnimation ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={skipAnimation ? { duration: 0 } : { duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {children}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
