/**
 * Link Type Badge Component
 * Feature: 024-intake-entity-linking
 * Task: T045
 *
 * Mobile-first, RTL-compatible badge for displaying link types
 * Follows mobile-first design principles with logical CSS properties
 */

import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { EntityLink } from '../../../../backend/src/types/intake-entity-links.types';

/**
 * Link type configuration with colors and icons
 */
const LINK_TYPE_CONFIG = {
  primary: {
    variant: 'default' as const,
    colorClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    icon: '⭐',
  },
  related: {
    variant: 'secondary' as const,
    colorClass: 'bg-slate-600 hover:bg-slate-700 text-white',
    icon: '🔗',
  },
  requested: {
    variant: 'outline' as const,
    colorClass: 'bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-300',
    icon: '📋',
  },
  mentioned: {
    variant: 'outline' as const,
    colorClass: 'bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300',
    icon: '💬',
  },
  assigned_to: {
    variant: 'outline' as const,
    colorClass: 'bg-green-100 hover:bg-green-200 text-green-800 border-green-300',
    icon: '👤',
  },
} as const;

export interface LinkTypeBadgeProps {
  /** Link type to display */
  linkType: EntityLink['link_type'];
  /** Show icon alongside text (default: true on desktop, false on mobile) */
  showIcon?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
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
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const config = LINK_TYPE_CONFIG[linkType] || LINK_TYPE_CONFIG.related;

  // Determine if icon should be shown (default: desktop only for space optimization)
  const displayIcon = showIcon ?? false; // Hidden by default on mobile, can be overridden

  // Size-specific classes using mobile-first approach
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    default: 'text-sm px-3 py-1 gap-1.5 sm:gap-2',
    lg: 'text-base px-4 py-1.5 gap-2 sm:gap-2.5',
  };

  // Translation key for link type
  const translationKey = `entityLinks.linkTypes.${linkType}`;

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
        className
      )}
      // Accessibility
      aria-label={t(translationKey)}
      role="status"
    >
      {/* Icon (conditionally rendered) */}
      {displayIcon && (
        <span
          className="inline-block"
          aria-hidden="true"
        >
          {config.icon}
        </span>
      )}

      {/* Link type text */}
      <span className="inline-block whitespace-nowrap">
        {t(translationKey)}
      </span>
    </Badge>
  );
}

/**
 * Helper function to get link type label for non-component contexts
 */
export function getLinkTypeLabel(
  linkType: EntityLink['link_type'],
  t: (key: string) => string
): string {
  return t(`entityLinks.linkTypes.${linkType}`);
}

/**
 * Helper to get link type icon
 */
export function getLinkTypeIcon(linkType: EntityLink['link_type']): string {
  return LINK_TYPE_CONFIG[linkType]?.icon || LINK_TYPE_CONFIG.related.icon;
}

/**
 * Helper to get link type color class
 */
export function getLinkTypeColorClass(linkType: EntityLink['link_type']): string {
  return LINK_TYPE_CONFIG[linkType]?.colorClass || LINK_TYPE_CONFIG.related.colorClass;
}

export default LinkTypeBadge;
