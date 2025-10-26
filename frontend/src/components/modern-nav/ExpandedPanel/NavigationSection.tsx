import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface NavigationSectionItem {
  id: string;
  label: string;
  labelKey: string; // i18n key
  icon: LucideIcon;
  path: string;
  count?: number;
  badge?: string;
  adminOnly?: boolean;
}

export interface NavigationSectionProps {
  /** Section title */
  title?: string;
  /** Section title i18n key */
  titleKey?: string;
  /** List of navigation items */
  items: NavigationSectionItem[];
  /** Currently active item ID */
  activeId?: string;
  /** Callback when item is clicked */
  onItemClick?: (item: NavigationSectionItem) => void;
  /** Custom class name */
  className?: string;
  /** Hide section header */
  hideHeader?: boolean;
}

/**
 * NavigationSection Component
 *
 * Generic reusable navigation section for ExpandedPanel
 * Displays navigation items with icons, labels, and optional badges
 *
 * Features:
 * - Icon + label + badge layout
 * - Hover states
 * - Active state highlighting
 * - RTL support
 * - Navigation on click
 *
 * @example
 * ```tsx
 * <NavigationSection
 *   titleKey="navigation.dossiers"
 *   items={dossierItems}
 *   activeId="countries"
 * />
 * ```
 */
export function NavigationSection({
  title,
  titleKey,
  items,
  activeId,
  onItemClick,
  className,
  hideHeader = false,
}: NavigationSectionProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (item: NavigationSectionItem) => {
    if (onItemClick) {
      onItemClick(item);
    } else {
      // Default navigation behavior
      navigate({ to: item.path });
    }
  };

  // Check if a path is active (exact match only to avoid double highlighting)
  const isPathActive = (path: string) => {
    return location.pathname === path;
  };

  const sectionTitle = titleKey ? t(titleKey, title) : title;

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Section Header */}
      {!hideHeader && sectionTitle && (
        <h3 className="section-header px-4 py-2">{sectionTitle}</h3>
      )}

      {/* Navigation Items */}
      <nav
        className="flex flex-col px-2"
        role="navigation"
        aria-label={sectionTitle}
      >
        {items.map((item) => {
          const isActive = isPathActive(item.path);

          return (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              className={cn(
                // Apply glass effect utility class
                'panel-item',

                // Layout
                'flex w-full items-center gap-3 py-2 px-4',

                // Rounded corners for all sides
                'rounded-lg',

                // Typography
                'text-sm font-medium text-start',

                // Colors
                'text-panel-text',

                // Hover state
                'hover:bg-panel-hover',

                // Active state
                isActive && ['bg-white/80', 'active'],

                // Transition
                'transition-colors duration-150',

                // Focus
                'focus-visible:outline-none',
                'focus-visible:ring-2',
                'focus-visible:ring-inset',
                'focus-visible:ring-icon-rail-active-indicator'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Icon */}
              <span className="shrink-0" aria-hidden="true">
                {React.createElement(item.icon, { className: 'h-4 w-4' })}
              </span>

              {/* Label */}
              <span className="flex-1 truncate">
                {t(item.labelKey, item.label)}
              </span>

              {/* Badge Count */}
              {item.count !== undefined && (
                <Badge
                  variant="secondary"
                  className={cn(
                    'h-5 min-w-5 px-2',
                    'bg-badge text-badge-text',
                    'text-xs font-medium',
                    'rounded-full',
                    'flex items-center justify-center'
                  )}
                >
                  {item.count}
                </Badge>
              )}

              {/* Badge Text */}
              {item.badge && (
                <Badge
                  variant="secondary"
                  className={cn(
                    'h-5 px-2',
                    'bg-badge text-badge-text',
                    'text-xs font-medium',
                    'rounded-full'
                  )}
                >
                  {item.badge}
                </Badge>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

NavigationSection.displayName = 'NavigationSection';
