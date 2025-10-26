import React from 'react';
import {
  Home,
  FolderOpen,
  ClipboardList,
  Calendar,
  BarChart3,
  Settings,
  Sun,
  Moon,
  Languages,
  LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { IconButton } from './IconButton';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider/theme-provider';

export interface IconRailItem {
  /** Unique identifier */
  id: string;
  /** Lucide icon */
  icon: LucideIcon;
  /** Tooltip text key (i18n) */
  tooltipKey: string;
  /** Route path */
  path: string;
  /** Badge count (optional) */
  badge?: number;
}

export interface IconRailProps {
  /** Navigation items to display */
  items?: IconRailItem[];
  /** Additional CSS classes */
  className?: string;
  /** Callback when an item is clicked */
  onItemClick?: (item: IconRailItem) => void;
  /** Currently active category ID */
  activeCategory?: string;
  /** Callback when category changes (for ExpandedPanel sync) */
  onCategoryChange?: (categoryId: string) => void;
}

/**
 * IconRail Component
 *
 * Vertical navigation rail with icon-only buttons
 * Based on Material Design 3 Navigation Rail pattern
 *
 * Features:
 * - Fixed 56px width
 * - Dark background (#1A1D26)
 * - Active state indicator (green vertical bar)
 * - Settings button at bottom
 * - Mobile: hidden (replaced by hamburger menu)
 * - RTL support
 *
 * @example
 * ```tsx
 * <IconRail
 *   items={navigationItems}
 *   onItemClick={(item) => navigate(item.path)}
 * />
 * ```
 */
export function IconRail({ items, className, onItemClick, activeCategory, onCategoryChange }: IconRailProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isRTL = i18n.language === 'ar';
  const { colorMode, setColorMode } = useTheme();

  // Default navigation items - 5 main categories
  const defaultItems: IconRailItem[] = [
    {
      id: 'dashboard',
      icon: Home,
      tooltipKey: 'navigation.dashboard',
      path: '/dashboard',
    },
    {
      id: 'dossiers',
      icon: FolderOpen,
      tooltipKey: 'navigation.dossiers',
      path: '/dossiers',
    },
    {
      id: 'workflow',
      icon: ClipboardList,
      tooltipKey: 'navigation.workflow',
      path: '/tasks',
    },
    {
      id: 'calendar',
      icon: Calendar,
      tooltipKey: 'navigation.calendar',
      path: '/calendar',
    },
    {
      id: 'reports',
      icon: BarChart3,
      tooltipKey: 'navigation.reports',
      path: '/reports',
    },
  ];

  const navigationItems = items || defaultItems;

  const handleItemClick = (item: IconRailItem) => {
    // Notify parent of category change for ExpandedPanel sync
    if (onCategoryChange) {
      onCategoryChange(item.id);
    }

    if (onItemClick) {
      onItemClick(item);
    } else {
      navigate({ to: item.path });
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
  };

  return (
    <aside
      className={cn(
        // Use icon-rail utility class from modern-nav-tokens.css (handles height with margin)
        'icon-rail',

        // Layout
        'flex flex-col',

        // Hide on mobile, show on tablet+
        'hidden md:flex',

        // Custom classes
        className
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
      aria-label={t('navigation.mainNav', 'Main navigation')}
    >
      {/* Top Navigation Items - ULTRA DARK Section */}
      <nav
        className={cn(
          'flex flex-col items-center overflow-y-auto',
          // ULTRA DARK background for top section - dramatic contrast
          'bg-gradient-to-b from-[hsl(220,15%,2%)] via-[hsl(220,15%,4%)] to-[hsl(220,15%,6%)]',
          // Margins on all sides
          'mx-1 mt-1',
          // Top and bottom rounded corners
          'rounded-t-xl rounded-b-xl',
          // Moderate shadows
          'shadow-[0_3px_12px_rgba(0,0,0,0.35),0_1px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]'
        )}
        aria-label={t('navigation.primary', 'Primary navigation')}
      >
        {/* GASTAT Logo */}
        <div className="w-full px-3 pt-4 pb-3 flex items-center justify-center">
          <img
            src="/GASTAT_LOGO.svg"
            alt="GASTAT Logo"
            className="w-10 h-10 object-contain"
          />
        </div>

        {/* Separator Line - Engraved Effect */}
        <div className="w-full px-3 pb-3">
          <div
            className="h-px relative"
            style={{
              background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.4) 50%, transparent)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.1)'
            }}
          />
        </div>

        {/* Navigation Items */}
        <div className="flex flex-col items-center gap-4 p-3 w-full">
          {navigationItems.map((item) => (
            <IconButton
              key={item.id}
              id={`nav-${item.id}`}
              icon={item.icon}
              tooltip={t(item.tooltipKey, item.id.charAt(0).toUpperCase() + item.id.slice(1))}
              active={isActive(item.path)}
              onClick={() => handleItemClick(item)}
              badge={item.badge}
            />
          ))}
        </div>
      </nav>

      {/* Engraved Text Section - Transparent Background */}
      <div
        className={cn(
          'icon-rail-text-section',
          'flex flex-col items-center justify-center flex-1 px-4',
          // Ensure text stays within bounds
          'overflow-hidden'
        )}
      >
        <p
          className="text-engraved text-center"
          style={{
            letterSpacing: '0.15em',
            transform: 'rotate(-90deg)',
            whiteSpace: 'nowrap'
          }}
        >
          Dossier 2025
        </p>
      </div>

      {/* Spacer when text is hidden - keeps bottom section at bottom */}
      <div
        className={cn(
          'icon-rail-spacer',
          'flex-1 hidden'
        )}
      />

      {/* Bottom Section - Language + Theme + Settings - ULTRA DARK Section (matches top) */}
      <div
        className={cn(
          'flex flex-col items-center gap-3 py-3 px-2',
          // ULTRA DARK background matching top section
          'bg-gradient-to-b from-[hsl(220,15%,2%)] via-[hsl(220,15%,4%)] to-[hsl(220,15%,6%)]',
          // Margins on all sides
          'mx-1 mb-1',
          // Top and bottom rounded corners
          'rounded-t-xl rounded-b-xl',
          // Moderate shadows
          'shadow-[0_3px_12px_rgba(0,0,0,0.35),0_1px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]'
        )}
      >
        {/* Language Switcher */}
        <IconButton
          id="nav-language-toggle"
          icon={Languages}
          tooltip={i18n.language === 'ar' ? t('navigation.switchToEnglish', 'Switch to English') : t('navigation.switchToArabic', 'Switch to Arabic')}
          active={false}
          onClick={toggleLanguage}
        />

        {/* Theme Switcher */}
        <IconButton
          id="nav-theme-toggle"
          icon={colorMode === 'dark' ? Sun : Moon}
          tooltip={colorMode === 'dark' ? t('navigation.lightMode', 'Light Mode') : t('navigation.darkMode', 'Dark Mode')}
          active={false}
          onClick={() => setColorMode(colorMode === 'dark' ? 'light' : 'dark')}
        />

        {/* Settings - Opens System category in ExpandedPanel */}
        <IconButton
          id="nav-settings"
          icon={Settings}
          tooltip={t('navigation.settings', 'Settings')}
          active={activeCategory === 'system'}
          onClick={() => {
            if (onCategoryChange) {
              onCategoryChange('system');
            }
            navigate({ to: '/settings' });
          }}
        />
      </div>
    </aside>
  );
}

IconRail.displayName = 'IconRail';
