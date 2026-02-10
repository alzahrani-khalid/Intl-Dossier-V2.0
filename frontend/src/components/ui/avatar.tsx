import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

// ============================================================================
// Avatar
// ============================================================================

function Avatar({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn('relative flex size-8 shrink-0 overflow-hidden rounded-full', className)}
      {...props}
    />
  )
}

// ============================================================================
// AvatarImage
// ============================================================================

function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full object-cover', className)}
      {...props}
    />
  )
}

// ============================================================================
// AvatarFallback
// ============================================================================

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'bg-muted flex h-full w-full items-center justify-center rounded-full',
        className,
      )}
      {...props}
    />
  )
}

// ============================================================================
// AvatarIndicator
// ============================================================================

const avatarIndicatorVariants = cva('absolute size-2 rounded-full', {
  variants: {
    variant: {
      success: 'bg-green-400',
      danger: 'bg-red-400',
      warning: 'bg-orange-400',
    },
    position: {
      'top-end': 'end-0.5 top-0.5',
      'bottom-end': 'end-0.5 bottom-0.5',
      'bottom-start': 'start-0.5 bottom-0.5',
      'top-start': 'start-0.5 top-0.5',
    },
  },
  defaultVariants: {
    position: 'bottom-end',
  },
})

function AvatarIndicator({
  className,
  variant,
  position,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof avatarIndicatorVariants>) {
  return (
    <span
      data-slot="avatar-indicator"
      className={cn(avatarIndicatorVariants({ variant, position }), className)}
      {...props}
    />
  )
}

// ============================================================================
// Exports
// ============================================================================

export { Avatar, AvatarImage, AvatarFallback, AvatarIndicator, avatarIndicatorVariants }
