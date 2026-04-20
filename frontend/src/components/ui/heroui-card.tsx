/**
 * HeroUI Card Wrapper — Phase 33-05 (Wave 3)
 *
 * Real @heroui/react Card compound primitives (Card.Root / Card.Header /
 * Card.Title / Card.Description / Card.Content / Card.Footer). `CardAction`
 * has no HeroUI analog — kept as a plain div because its job is grid
 * positioning only (col-start-2 row-span-2 …) and has-[data-slot=card-action]
 * selectors in card-header rely on the data-slot attribute.
 *
 * Token model (SC-5): semantic utilities only (`bg-card`,
 * `text-card-foreground`, `text-muted-foreground`, `border-*`). These resolve
 * through the D-16 @theme remap in frontend/src/index.css to the runtime
 * tokens written by DesignProvider (33-02). Zero literal-color utilities.
 *
 * All `data-slot="card-*"` attributes are preserved — downstream CSS uses
 * `has-[data-slot=card-header]` / `has-[data-slot=card-action]` selectors
 * (see .planning/phases/33-token-engine/33-PATTERNS.md §Section 1).
 */

import type * as React from 'react'
import { Card as HeroUICardPrimitive } from '@heroui/react'
import { cn } from '@/lib/utils'

function HeroUICard({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <HeroUICardPrimitive
      data-slot="card"
      className={cn(
        'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6',
        className,
      )}
      {...props}
    />
  )
}

function HeroUICardHeader({
  className,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <HeroUICardPrimitive.Header
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-[data-slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
        className,
      )}
      {...props}
    />
  )
}

function HeroUICardTitle({
  className,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element {
  // HeroUI Card.Title defaults to <h3>; call sites overwhelmingly pass only
  // className + children, which both tags accept. We keep <div> semantics via
  // the existing consumer ergonomics (ComponentProps<'div'>) and let HeroUI
  // render whatever it renders — downstream selectors key off data-slot, not
  // the tag.
  return (
    <HeroUICardPrimitive.Title
      data-slot="card-title"
      className={cn('leading-none font-semibold', className)}
      {...(props as React.ComponentProps<'h3'>)}
    />
  )
}

function HeroUICardDescription({
  className,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <HeroUICardPrimitive.Description
      data-slot="card-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...(props as React.ComponentProps<'p'>)}
    />
  )
}

function HeroUICardAction({
  className,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  )
}

function HeroUICardContent({
  className,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <HeroUICardPrimitive.Content
      data-slot="card-content"
      className={cn('px-6', className)}
      {...props}
    />
  )
}

function HeroUICardFooter({
  className,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <HeroUICardPrimitive.Footer
      data-slot="card-footer"
      className={cn('flex items-center px-6 [.border-t]:pt-6', className)}
      {...props}
    />
  )
}

export {
  HeroUICard,
  HeroUICardHeader,
  HeroUICardTitle,
  HeroUICardDescription,
  HeroUICardAction,
  HeroUICardContent,
  HeroUICardFooter,
}
