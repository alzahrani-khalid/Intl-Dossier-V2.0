/**
 * FieldErrorHighlight Component
 * Wraps form fields with animated error highlighting
 */

import { useEffect, useState } from 'react'
import { m } from 'motion/react'
import { cn } from '@/lib/utils'
import type { FieldErrorHighlightProps } from '@/types/actionable-error.types'

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const animations = {
  pulse: {
    initial: { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)' },
    animate: {
      boxShadow: [
        '0 0 0 0 rgba(239, 68, 68, 0.4)',
        '0 0 0 8px rgba(239, 68, 68, 0)',
        '0 0 0 0 rgba(239, 68, 68, 0)',
      ],
    },
    transition: { duration: 1.5, repeat: 2 },
  },
  shake: {
    initial: { x: 0 },
    animate: { x: [-4, 4, -4, 4, -2, 2, 0] },
    transition: { duration: 0.5 },
  },
  glow: {
    initial: { boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.3)' },
    animate: {
      boxShadow: [
        '0 0 0 2px rgba(239, 68, 68, 0.3)',
        '0 0 8px 2px rgba(239, 68, 68, 0.5)',
        '0 0 0 2px rgba(239, 68, 68, 0.3)',
      ],
    },
    transition: { duration: 2, repeat: Infinity },
  },
  none: {
    initial: {},
    animate: {},
    transition: {},
  },
}

// =============================================================================
// SEVERITY STYLES
// =============================================================================

const severityStyles = {
  error: {
    ring: 'ring-2 ring-danger/50 dark:ring-danger/50',
    border: 'border-danger dark:border-danger',
    bg: 'bg-danger/50 dark:bg-danger/20',
  },
  warning: {
    ring: 'ring-2 ring-warning/50 dark:ring-warning/50',
    border: 'border-warning dark:border-warning',
    bg: 'bg-warning/50 dark:bg-warning/20',
  },
  info: {
    ring: 'ring-2 ring-info/50 dark:ring-info/50',
    border: 'border-info dark:border-info',
    bg: 'bg-info/50 dark:bg-info/20',
  },
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function FieldErrorHighlight({
  hasError,
  severity = 'error',
  animation = 'pulse',
  children,
  className,
}: FieldErrorHighlightProps) {
  const [shouldAnimate, setShouldAnimate] = useState(false)

  // Trigger animation when error first appears
  useEffect(() => {
    if (hasError) {
      setShouldAnimate(true)
      // Reset after animation completes for pulse/shake
      if (animation !== 'glow') {
        const timer = setTimeout(() => setShouldAnimate(false), 2000)
        return () => clearTimeout(timer)
      }
      return undefined
    } else {
      setShouldAnimate(false)
      return undefined
    }
  }, [hasError, animation])

  const styles = severityStyles[severity]
  const animationConfig = animations[animation]

  if (!hasError) {
    return <>{children}</>
  }

  return (
    <m.div
      className={cn('relative rounded-md transition-all duration-200', styles.ring, className)}
      initial={shouldAnimate ? animationConfig.initial : undefined}
      animate={shouldAnimate ? animationConfig.animate : undefined}
      transition={animationConfig.transition}
    >
      {children}
    </m.div>
  )
}
