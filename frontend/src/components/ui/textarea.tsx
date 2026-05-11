import * as React from 'react'

import { cn } from '@/lib/utils'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'id-textarea flex min-h-[88px] w-full placeholder:text-[var(--ink-faint)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-[13px]',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Textarea.displayName = 'Textarea'

export { Textarea }
