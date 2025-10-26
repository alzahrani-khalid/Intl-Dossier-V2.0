import React from 'react'

type Variant = 'default' | 'secondary' | 'outline' | 'destructive' | 'none'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant
}

const variantClasses: Record<Variant, string> = {
  default: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  outline: 'border border-border text-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  none: '', // No default styling - use custom classes
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', ...props }, ref) => {
    const base = 'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium'
    const styles = `${base} ${variantClasses[variant]} ${className}`.trim()
    return <span ref={ref} className={styles} {...props} />
  }
)

Badge.displayName = 'Badge'

export default Badge

