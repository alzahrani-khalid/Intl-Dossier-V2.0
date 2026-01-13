import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Input component with 48px minimum touch target height
 *
 * Mobile-first design ensures touch-friendly interaction
 * while maintaining clean aesthetics on desktop.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base: 48px height (min-h-12) for touch targets
          'flex min-h-12 h-12 w-full rounded-md border border-input bg-transparent',
          'px-4 py-2 text-base shadow-sm transition-colors touch-manipulation',
          // File input styling
          'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
          // Placeholder and focus states
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          // Disabled state
          'disabled:cursor-not-allowed disabled:opacity-50',
          // Responsive text size (smaller on desktop)
          'sm:text-sm',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
