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
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'chip w-fit shrink-0 justify-center overflow-hidden whitespace-nowrap border border-transparent transition-[background,color,border-color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] aria-invalid:border-[var(--danger)] [&>svg]:size-3 [&>svg]:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'chip-accent',
        secondary: '',
        destructive: 'chip-danger',
        outline: 'chip-default',
        warning: 'chip-warn',
        info: 'chip-info',
        success: 'chip-ok',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface HeroUIChipProps
  extends React.ComponentProps<'span'>, VariantProps<typeof badgeVariants> {
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
    <span
      data-slot="badge"
      className={mergedClassName}
      {...(forward as React.HTMLAttributes<HTMLSpanElement>)}
    >
      {children}
    </span>
  )
}

export { HeroUIChip, badgeVariants }
export default HeroUIChip
