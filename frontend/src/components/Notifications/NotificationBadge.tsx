import React from 'react'
import { cn } from '@/lib/utils'

interface NotificationBadgeProps {
  count: number
  max?: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'urgent' | 'muted'
}

export function NotificationBadge({
  count,
  max = 99,
  className,
  size = 'md',
  variant = 'default',
}: NotificationBadgeProps) {
  if (count <= 0) return null

  const displayCount = count > max ? `${max}+` : count.toString()

  const sizeClasses = {
    sm: 'h-4 min-w-4 text-[10px]',
    md: 'h-5 min-w-5 text-xs',
    lg: 'h-6 min-w-6 text-sm',
  }

  const variantClasses = {
    default: 'bg-destructive text-destructive-foreground',
    urgent: 'bg-red-600 text-white animate-pulse',
    muted: 'bg-muted text-muted-foreground',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full px-1.5 font-medium',
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      aria-label={`${count} unread notifications`}
    >
      {displayCount}
    </span>
  )
}
