/**
 * HeroUI Chip Wrapper (Badge replacement) — Phase 33-05 (Wave 3)
 *
 * Real @heroui/react Chip primitive. Preserves the shadcn-style `badgeVariants`
 * cva API and `asChild` branch used by existing Badge call sites.
 *
 * Token model (SC-5): the cva strings use semantic Tailwind utilities only —
 * `bg-destructive`, `text-destructive-foreground`, `bg-warn`, `text-ok`,
 * `bg-info`, `border-*`, `text-foreground`, etc. Literal color utilities
 * (`bg-red-*`, `text-red-*`, `bg-orange-*`, `bg-blue-*`, `bg-green-*`) were
 * removed in this pass — the zero-override audit in plan DoD greps for them
 * and must return zero matches.
 *
 * The status palettes map onto D-16 runtime vars (--danger, --warn, --ok,
 * --info) via the @theme block in frontend/src/index.css.
 */

import type * as React from 'react'
import { Chip as HeroUIChipPrimitive } from '@heroui/react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 overflow-hidden transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'border-destructive/40 bg-destructive/10 text-destructive [a&]:hover:bg-destructive/20',
        outline: 'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        warning: 'border-warn/40 bg-warn/10 text-warn [a&]:hover:bg-warn/20',
        info: 'border-info/40 bg-info/10 text-info [a&]:hover:bg-info/20',
        success: 'border-ok/40 bg-ok/10 text-ok [a&]:hover:bg-ok/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface HeroUIChipProps
  extends React.ComponentProps<'span'>,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean
}

export type BadgeProps = HeroUIChipProps

function HeroUIChip({
  className,
  variant,
  asChild = false,
  children,
  ...props
}: HeroUIChipProps): React.JSX.Element {
  const mergedClassName = cn(badgeVariants({ variant }), className)

  const forward = props as Record<string, unknown>

  if (asChild) {
    return (
      <Slot
        data-slot="badge"
        className={mergedClassName}
        {...(forward as React.HTMLAttributes<HTMLElement>)}
      >
        {children}
      </Slot>
    )
  }

  return (
    <HeroUIChipPrimitive
      data-slot="badge"
      className={mergedClassName}
      {...(forward as unknown as React.ComponentProps<typeof HeroUIChipPrimitive<'span'>>)}
    >
      {children}
    </HeroUIChipPrimitive>
  )
}

export { HeroUIChip, badgeVariants }
export default HeroUIChip
