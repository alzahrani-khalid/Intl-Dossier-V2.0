/**
 * FieldErrorHighlight Component
 * Wraps form fields with animated error highlighting
 */

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
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
    ring: 'ring-2 ring-red-500/50 dark:ring-red-400/50',
    border: 'border-red-500 dark:border-red-400',
    bg: 'bg-red-50/50 dark:bg-red-950/20',
  },
  warning: {
    ring: 'ring-2 ring-amber-500/50 dark:ring-amber-400/50',
    border: 'border-amber-500 dark:border-amber-400',
    bg: 'bg-amber-50/50 dark:bg-amber-950/20',
  },
  info: {
    ring: 'ring-2 ring-blue-500/50 dark:ring-blue-400/50',
    border: 'border-blue-500 dark:border-blue-400',
    bg: 'bg-blue-50/50 dark:bg-blue-950/20',
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
    <motion.div
      className={cn('relative rounded-md transition-all duration-200', styles.ring, className)}
      initial={shouldAnimate ? animationConfig.initial : undefined}
      animate={shouldAnimate ? animationConfig.animate : undefined}
      transition={animationConfig.transition}
    >
      {children}
    </motion.div>
  )
}

export default FieldErrorHighlight
