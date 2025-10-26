import React from 'react';
import { useTranslation } from 'react-i18next';
import { UserProfile } from './UserProfile';
import { NavigationSection } from './NavigationSection';
import { cn } from '@/lib/utils';
import { navigationCategories, getNavigationCategory } from '../navigationData';

export interface ExpandedPanelProps {
  /** Whether the panel is open/visible */
  isOpen?: boolean;
  /** Callback to close the panel */
  onClose?: () => void;
  /** User name */
  userName?: string;
  /** User email */
  userEmail?: string;
  /** User avatar URL */
  userAvatar?: string;
  /** Logout handler */
  onLogout?: () => void;
  /** Custom class name */
  className?: string;
  /** Active category ID from IconRail */
  activeCategory?: string;
}

/**
 * ExpandedPanel Component
 *
 * The middle navigation panel (280px width)
 * Contains all navigation sections from reference design
 *
 * Features:
 * - User profile section
 * - Projects section
 * - Status section
 * - History section
 * - Document tree
 * - Collapsible with smooth animation
 * - Scrollable content
 * - RTL support
 *
 * @example
 * ```tsx
 * <ExpandedPanel
 *   isOpen={isPanelOpen}
 *   userName="John Doe"
 *   userEmail="customerpop@gmail.com"
 *   onLogout={handleLogout}
 * />
 * ```
 */
export function ExpandedPanel({
  isOpen = true,
  onClose,
  userName,
  userEmail,
  userAvatar,
  onLogout,
  className,
  activeCategory = 'dashboard',
}: ExpandedPanelProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Get navigation items for active category
  const category = getNavigationCategory(activeCategory);
  const navigationItems = category?.items || [];

  return (
    <aside
      className={cn(
        // Use expanded-panel utility class from modern-nav-tokens.css
        'expanded-panel',

        // Layout - height is set in CSS (calc(100vh - 16px))
        'flex flex-col',

        // Visibility and animation
        !isOpen && (isRTL ? 'translate-x-full' : '-translate-x-full'),

        // Hide on mobile, show on desktop
        'hidden lg:flex',

        // Custom classes
        className
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
      aria-label="Expanded navigation panel"
      aria-hidden={!isOpen}
    >
      {/* User Profile Section */}
      <UserProfile
        name={userName}
        email={userEmail}
        avatarUrl={userAvatar}
        onLogout={onLogout}
      />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-visible">
        <div className="flex flex-col gap-6 py-4">
          {/* Category-based Navigation */}
          {navigationItems.length > 0 && (
            <NavigationSection
              titleKey={category?.tooltipKey}
              items={navigationItems}
            />
          )}
        </div>
      </div>
    </aside>
  );
}

ExpandedPanel.displayName = 'ExpandedPanel';
