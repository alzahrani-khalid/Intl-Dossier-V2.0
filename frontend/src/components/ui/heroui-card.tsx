/**
 * HeroUI Card Wrapper
 *
 * Drop-in replacement for shadcn Card components.
 * Renders as plain divs with shadcn-compatible classes for full HTML attribute support.
 * Uses data-slot attributes for CSS targeting and has-[] selectors.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'

// ============================================================================
// Card
// ============================================================================

function HeroUICard({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn(
        'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6',
        className,
      )}
      {...props}
    />
  )
}

// ============================================================================
// CardHeader
// ============================================================================

function HeroUICardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-[data-slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
        className,
      )}
      {...props}
    />
  )
}

// ============================================================================
// CardTitle
// ============================================================================

function HeroUICardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('leading-none font-semibold', className)}
      {...props}
    />
  )
}

// ============================================================================
// CardDescription
// ============================================================================

function HeroUICardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

// ============================================================================
// CardAction
// ============================================================================

function HeroUICardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  )
}

// ============================================================================
// CardContent
// ============================================================================

function HeroUICardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('px-6', className)} {...props} />
}

// ============================================================================
// CardFooter
// ============================================================================

function HeroUICardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center px-6 [.border-t]:pt-6', className)}
      {...props}
    />
  )
}

// ============================================================================
// Exports
// ============================================================================

export {
  HeroUICard,
  HeroUICardHeader,
  HeroUICardTitle,
  HeroUICardDescription,
  HeroUICardAction,
  HeroUICardContent,
  HeroUICardFooter,
}
