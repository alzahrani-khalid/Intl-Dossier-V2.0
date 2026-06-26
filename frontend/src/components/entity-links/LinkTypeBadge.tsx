/**
 * Link Type Badge Component
 * Feature: 024-intake-entity-linking
 * Task: T045
 *
 * Mobile-first, RTL-compatible badge for displaying link types
 * Follows mobile-first design principles with logical CSS properties
 */

import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { ClipboardList, Link2, MessageSquare, Star, User, type LucideIcon } from 'lucide-react'
import type { EntityLink } from '../../../../backend/src/types/intake-entity-links.types'
import { useDirection } from '@/hooks/useDirection'

/**
 * Link type configuration with colors and icons (stroked icon set, not emoji)
 */
const LINK_TYPE_CONFIG: Record<
  EntityLink['link_type'],
  { variant: 'default' | 'secondary' | 'outline'; colorClass: string; icon: LucideIcon }
> = {
  primary: {
    variant: 'default',
    colorClass: 'bg-accent hover:bg-accent/90 text-accent-foreground',
    icon: Star,
  },
  related: {
    variant: 'secondary',
    colorClass: 'bg-muted hover:bg-muted/90 text-ink',
    icon: Link2,
  },
  requested: {
    variant: 'outline',
    colorClass: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border-secondary',
    icon: ClipboardList,
  },
  mentioned: {
    variant: 'outline',
    colorClass: 'bg-warning/10 hover:bg-warning/20 text-warning border-warning/30',
    icon: MessageSquare,
  },
  assigned_to: {
    variant: 'outline',
    colorClass: 'bg-success/10 hover:bg-success/20 text-success border-success/30',
    icon: User,
  },
}

export interface LinkTypeBadgeProps {
  /** Link type to display */
  linkType: EntityLink['link_type']
  /** Show icon alongside text (default: true on desktop, false on mobile) */
  showIcon?: boolean
  /** Additional CSS classes */
  className?: string
  /** Size variant */
  size?: 'sm' | 'default' | 'lg'
}

/**
 * LinkTypeBadge Component
 *
 * Displays a visually distinct badge for entity link types.
 * Supports mobile-first responsive design and RTL layouts.
 *
 * @example
 * ```tsx
 * <LinkTypeBadge linkType="primary" />
 * <LinkTypeBadge linkType="related" showIcon={true} size="lg" />
 * ```
 */
export function LinkTypeBadge({
  linkType,
  showIcon,
  className,
  size = 'default',
}: LinkTypeBadgeProps) {
  const { t } = useTranslation()
  const { isRTL } = useDirection()
  const config = LINK_TYPE_CONFIG[linkType] || LINK_TYPE_CONFIG.related

  // Determine if icon should be shown (default: desktop only for space optimization)
  const displayIcon = showIcon ?? false // Hidden by default on mobile, can be overridden

  // Size-specific classes using mobile-first approach
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    default: 'text-sm px-3 py-1 gap-1.5 sm:gap-2',
    lg: 'text-base px-4 py-1.5 gap-2 sm:gap-2.5',
  }

  // Translation key for link type
  const translationKey = `entityLinks.linkTypes.${linkType}`

  const Icon = config.icon

  return (
    <Badge
      variant={config.variant}
      className={cn(
        // Base styles (mobile-first)
        'inline-flex items-center justify-center',
        'font-medium',
        'transition-colors duration-200',

        // Size-specific spacing and typography
        sizeClasses[size],

        // Color classes
        config.colorClass,

        // RTL support: reverse flex direction if needed
        isRTL && displayIcon && 'flex-row-reverse',

        // Custom classes
        className,
      )}
      // Accessibility
      aria-label={t(translationKey)}
      role="status"
    >
      {/* Icon (conditionally rendered) */}
      {displayIcon && <Icon className="size-3.5 shrink-0" aria-hidden="true" />}

      {/* Link type text */}
      <span className="inline-block whitespace-nowrap">{t(translationKey)}</span>
    </Badge>
  )
}
