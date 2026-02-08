/**
 * HeroUI Card Wrapper
 *
 * Drop-in replacement for shadcn Card components.
 * Renders as plain divs with shadcn-compatible classes for full HTML attribute support.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'

// ============================================================================
// Card
// ============================================================================

const HeroUICard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-xl border bg-card text-card-foreground shadow', className)}
      {...props}
    />
  ),
)
HeroUICard.displayName = 'Card'

// ============================================================================
// CardHeader
// ============================================================================

const HeroUICardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  ),
)
HeroUICardHeader.displayName = 'CardHeader'

// ============================================================================
// CardTitle
// ============================================================================

const HeroUICardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  ),
)
HeroUICardTitle.displayName = 'CardTitle'

// ============================================================================
// CardDescription
// ============================================================================

const HeroUICardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
))
HeroUICardDescription.displayName = 'CardDescription'

// ============================================================================
// CardContent
// ============================================================================

const HeroUICardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  ),
)
HeroUICardContent.displayName = 'CardContent'

// ============================================================================
// CardFooter
// ============================================================================

const HeroUICardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  ),
)
HeroUICardFooter.displayName = 'CardFooter'

// ============================================================================
// Exports
// ============================================================================

export {
  HeroUICard,
  HeroUICardHeader,
  HeroUICardTitle,
  HeroUICardDescription,
  HeroUICardContent,
  HeroUICardFooter,
}
