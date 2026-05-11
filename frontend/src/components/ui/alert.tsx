import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const alertVariants = cva(
  'relative w-full rounded-[var(--radius)] border p-4 text-[var(--ink)] [&>svg~*]:ps-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:start-4 [&>svg]:top-4',
  {
    variants: {
      variant: {
        default: 'border-[var(--line)] bg-[var(--surface)] [&>svg]:text-[var(--ink-mute)]',
        destructive:
          'border-[var(--danger)] bg-[var(--danger-soft)] text-[var(--danger)] [&>svg]:text-[var(--danger)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
))
Alert.displayName = 'Alert'

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn('card-title mb-1 leading-none', className)} {...props} />
  ),
)
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
))
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertTitle, AlertDescription }
