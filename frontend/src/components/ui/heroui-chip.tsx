/**
 * HeroUI Chip Wrapper (Badge replacement)
 *
 * Drop-in replacement for shadcn Badge.
 * Renders as a span with shadcn-compatible classes for full HTML attribute support.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

type Variant = 'default' | 'secondary' | 'outline' | 'destructive' | 'none'

export interface HeroUIChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant
}

// Backward-compat alias
export type BadgeProps = HeroUIChipProps

// ============================================================================
// Variant classes
// ============================================================================

const variantClasses: Record<Variant, string> = {
  default: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  outline: 'border border-border text-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  none: '',
}

// ============================================================================
// HeroUIChip
// ============================================================================

const HeroUIChip = React.forwardRef<HTMLSpanElement, HeroUIChipProps>(
  ({ className = '', variant = 'default', ...props }, ref) => {
    const base = 'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium'
    return <span ref={ref} className={cn(base, variantClasses[variant], className)} {...props} />
  },
)
HeroUIChip.displayName = 'Badge'

// ============================================================================
// Exports
// ============================================================================

export { HeroUIChip }
export default HeroUIChip
