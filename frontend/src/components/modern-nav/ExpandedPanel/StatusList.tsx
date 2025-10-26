import React from 'react';
import { Circle, Bell, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface StatusItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
  path?: string;
}

export interface StatusListProps {
  /** List of status items */
  items?: StatusItem[];
  /** Currently active status ID */
  activeId?: string;
  /** Callback when status is clicked */
  onStatusClick?: (status: StatusItem) => void;
  /** Custom class name */
  className?: string;
}

/**
 * StatusList Component
 *
 * Displays status navigation items with badges
 * From reference design "Status" section
 *
 * Features:
 * - New (3)
 * - Updates (2)
 * - Team Review
 * - Hover states
 * - Active state highlighting
 * - RTL support
 *
 * @example
 * ```tsx
 * <StatusList
 *   items={statusItems}
 *   activeId="new"
 *   onStatusClick={handleClick}
 * />
 * ```
 */
export function StatusList({
  items,
  activeId,
  onStatusClick,
  className,
}: StatusListProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Default status items from reference design
  const defaultItems: StatusItem[] = [
    {
      id: 'new',
      label: t('navigation.new', 'New'),
      icon: <Circle className="h-4 w-4" />,
      count: 3,
      path: '/status/new',
    },
    {
      id: 'updates',
      label: t('navigation.updates', 'Updates'),
      icon: <Bell className="h-4 w-4" />,
      count: 2,
      path: '/status/updates',
    },
    {
      id: 'team-review',
      label: t('navigation.teamReview', 'Team Review'),
      icon: <Users className="h-4 w-4" />,
      path: '/status/team-review',
    },
  ];

  const statusItems = items || defaultItems;

  const handleClick = (status: StatusItem) => {
    if (onStatusClick) {
      onStatusClick(status);
    }
  };

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Section Header */}
      <h3 className="section-header px-4 py-2">
        {t('navigation.status', 'Status')}
      </h3>

      {/* Status Items */}
      <nav className="flex flex-col px-2" role="navigation" aria-label={t('navigation.status', 'Status')}>
        {statusItems.map((status) => {
          const isActive = activeId === status.id;

          return (
            <button
              key={status.id}
              onClick={() => handleClick(status)}
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
                isActive && [
                  'bg-white/80',
                  'active',
                ],

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
                {status.icon}
              </span>

              {/* Label */}
              <span className="flex-1 truncate">
                {status.label}
              </span>

              {/* Badge Count */}
              {status.count !== undefined && (
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
                  {status.count}
                </Badge>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

StatusList.displayName = 'StatusList';
