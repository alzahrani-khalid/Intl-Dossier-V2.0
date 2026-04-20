/**
 * HeroUI Button Wrapper — Phase 33-05 (Wave 3)
 *
 * Real @heroui/react Button primitive, wrapped to preserve the shadcn-style
 * cva API (variant / size / asChild) used by 250+ existing call sites.
 *
 * Token model (SC-5): the cva class strings reference semantic Tailwind
 * utilities only (bg-primary, bg-destructive, text-primary-foreground, ...).
 * Those names resolve through the D-16 @theme remap in frontend/src/index.css
 * and the HeroUI bridge (`--heroui-*` → `var(--accent)`, `var(--danger)` …)
 * to the runtime tokens written by DesignProvider (Plan 33-02) and the FOUC
 * bootstrap (Plan 33-03). No literal color utilities (`bg-red-*`, `text-blue-*`
 * etc.) are allowed anywhere in this file — the zero-override audit in DoD
 * greps for them.
 */

import type * as React from 'react'
import { Button as HeroUIButtonPrimitive } from '@heroui/react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'min-h-11 sm:min-h-9 h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'min-h-11 sm:min-h-8 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'min-h-11 sm:min-h-10 h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 size-9',
        'icon-sm': 'min-h-11 min-w-11 sm:min-h-8 sm:min-w-8 size-8',
        'icon-lg': 'min-h-11 min-w-11 sm:min-h-10 sm:min-w-10 size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface HeroUIButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Whether the button is in a loading state — disables interactivity + dims visually. */
  loading?: boolean
  /** Whether the button contains only an icon. */
  isIconOnly?: boolean
  /** Whether the button should take full width. */
  fullWidth?: boolean
  /** Slot for HeroUI Modal close behavior. */
  slot?: string
  /** Legacy disabled flag; translated to React Aria `isDisabled` internally. */
  disabled?: boolean
  /** React 19 ref prop. */
  ref?: React.Ref<HTMLButtonElement>
}

export type ButtonProps = HeroUIButtonProps

function HeroUIButton({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  fullWidth,
  isIconOnly,
  children,
  ref,
  ...props
}: HeroUIButtonProps): React.JSX.Element {
  const mergedClassName = cn(
    buttonVariants({ variant, size }),
    fullWidth === true && 'w-full',
    loading === true && 'opacity-70 pointer-events-none',
    className,
  )

  if (asChild) {
    return (
      <Slot
        data-slot="button"
        className={mergedClassName}
        ref={ref}
        disabled={disabled === true || loading === true}
        {...props}
      >
        {children}
      </Slot>
    )
  }

  return (
    <HeroUIButtonPrimitive
      data-slot="button"
      className={mergedClassName}
      isDisabled={disabled === true || loading === true}
      isIconOnly={isIconOnly}
      ref={ref}
      {...props}
    >
      {children}
    </HeroUIButtonPrimitive>
  )
}

HeroUIButton.displayName = 'HeroUIButton'

export { HeroUIButton, buttonVariants }
export default HeroUIButton
