import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({
  className,
  type,
  ref,
  ...props
}: React.ComponentProps<'input'> & { ref?: React.Ref<HTMLInputElement> }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'id-input flex h-10 min-h-11 w-full min-w-0',
        'selection:bg-[var(--accent)] selection:text-[var(--accent-fg)]',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--ink)]',
        'placeholder:text-[var(--ink-faint)]',
        'outline-none focus-visible:border-[var(--accent)] focus-visible:ring-0',
        'aria-invalid:border-[var(--danger)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'md:text-[13px]',
        className,
      )}
      ref={ref}
      {...props}
    />
  )
}

export { Input }
