/**
 * HeroUI Button Wrapper
 *
 * Drop-in replacement for shadcn Button with HeroUI v3 styling.
 * Supports full React.ButtonHTMLAttributes, asChild via Slot, and buttonVariants.
 *
 * Variant Mapping (shadcn -> HeroUI classes):
 * - default    -> bg-primary text-primary-foreground
 * - destructive -> bg-destructive text-destructive-foreground
 * - outline    -> border border-input bg-background
 * - secondary  -> bg-secondary text-secondary-foreground
 * - ghost      -> hover:bg-accent hover:text-accent-foreground
 * - link       -> text-primary underline-offset-4 hover:underline
 */

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// ============================================================================
// buttonVariants - CVA function (same API as shadcn)
// ============================================================================

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 touch-manipulation',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline min-h-12',
      },
      size: {
        default: 'min-h-12 h-12 px-4 py-2',
        sm: 'min-h-12 h-12 rounded-md px-3 text-sm',
        lg: 'min-h-14 h-14 rounded-md px-8 text-base',
        icon: 'min-h-12 min-w-12 h-12 w-12',
        'icon-sm': 'min-h-11 min-w-11 h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'sm',
    },
  },
)

// ============================================================================
// Props
// ============================================================================

export interface HeroUIButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Whether the button is in a loading state */
  loading?: boolean
  /** Whether the button contains only an icon */
  isIconOnly?: boolean
  /** Whether the button should take full width */
  fullWidth?: boolean
  /** Slot for HeroUI Modal close behavior */
  slot?: string
}

// Keep backward-compat alias
export type ButtonProps = HeroUIButtonProps

// ============================================================================
// HeroUIButton - Main wrapper component
// ============================================================================

const HeroUIButton = React.forwardRef<HTMLButtonElement, HeroUIButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      fullWidth,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          fullWidth && 'w-full',
          loading && 'opacity-70 pointer-events-none',
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {children}
      </Comp>
    )
  },
)
HeroUIButton.displayName = 'Button'

// ============================================================================
// Exports
// ============================================================================

export { HeroUIButton, buttonVariants }
export default HeroUIButton
