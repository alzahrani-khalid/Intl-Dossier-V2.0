/**
 * HeroUI Chip Wrapper (Badge replacement)
 *
 * Drop-in replacement for shadcn Badge.
 * Renders as a span with cva variants, asChild support via Slot,
 * and data-slot attribute for CSS targeting.
 */

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

// ============================================================================
// Badge Variants (cva)
// ============================================================================

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 overflow-hidden transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'border border-red-400 bg-red-50 text-red-800 dark:bg-red-900/70 dark:text-white/80 [a&]:hover:bg-red-100 dark:[a&]:hover:bg-red-900/90',
        outline: 'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        warning:
          'border border-orange-400 bg-orange-50 text-orange-800 dark:bg-orange-900/70 dark:text-white/80',
        info: 'border border-blue-400 bg-blue-50 text-blue-800 dark:bg-blue-900/70 dark:text-white/80',
        success:
          'border border-green-400 bg-green-50 text-green-800 dark:bg-green-900/70 dark:text-white/80',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

// ============================================================================
// Types
// ============================================================================

export interface HeroUIChipProps
  extends React.ComponentProps<'span'>, VariantProps<typeof badgeVariants> {
  asChild?: boolean
}

// Backward-compat alias
export type BadgeProps = HeroUIChipProps

// ============================================================================
// HeroUIChip (Badge)
// ============================================================================

function HeroUIChip({ className, variant, asChild = false, ...props }: HeroUIChipProps) {
  const Comp = asChild ? Slot : 'span'

  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

// ============================================================================
// Exports
// ============================================================================

export { HeroUIChip, badgeVariants }
export default HeroUIChip
