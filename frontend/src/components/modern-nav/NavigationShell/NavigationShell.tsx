import React, { useState, useEffect, ReactNode } from 'react';
import { Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation } from '@tanstack/react-router';
import { IconRail, IconRailItem } from '../IconRail';
import { ExpandedPanel } from '../ExpandedPanel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { navigationCategories } from '../navigationData';

export interface NavigationShellProps {
  /** Icon rail items */
  iconRailItems?: IconRailItem[];
  /** User name for profile */
  userName?: string;
  /** User email for profile */
  userEmail?: string;
  /** User avatar URL */
  userAvatar?: string;
  /** Logout handler */
  onLogout?: () => void;
  /** Content to display in main area */
  children: ReactNode;
  /** Custom class name */
  className?: string;
  /** Default panel open state (desktop only) */
  defaultPanelOpen?: boolean;
}

/**
 * NavigationShell Component
 *
 * 3-column layout container combining IconRail + ExpandedPanel + Content
 * From reference design showing complete navigation structure
 *
 * Layout:
 * - Icon Rail: 56px (always visible on tablet+)
 * - Expanded Panel: 280px (collapsible on desktop, hidden on mobile)
 * - Content Area: Flexible width (fills remaining space)
 *
 * Responsive Behavior:
 * - Mobile (<768px): Hamburger menu, full-screen overlay panel
 * - Tablet (768-1024px): Icon rail visible, panel collapsed by default
 * - Desktop (>1024px): Full 3-column layout, panel open by default
 *
 * Features:
 * - Collapsible expanded panel
 * - Mobile hamburger menu
 * - RTL support
 * - Smooth transitions
 * - Overlay for mobile menu
 *
 * @example
 * ```tsx
 * <NavigationShell
 *   userName="John Doe"
 *   userEmail="customerpop@gmail.com"
 *   onLogout={handleLogout}
 * >
 *   <YourContentHere />
 * </NavigationShell>
 * ```
 */
export function NavigationShell({
  iconRailItems,
  userName,
  userEmail,
  userAvatar,
  onLogout,
  children,
  className,
  defaultPanelOpen = true,
}: NavigationShellProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const location = useLocation();

  // Panel state
  const [isPanelOpen, setIsPanelOpen] = useState(defaultPanelOpen);

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Active category state (for ExpandedPanel content sync)
  const [activeCategory, setActiveCategory] = useState<string>('dashboard');

  // Detect active category based on current route
  useEffect(() => {
    const currentPath = location.pathname;

    // Find which category contains the current route
    for (const category of navigationCategories) {
      // Check if category's main path matches
      if (currentPath === category.path || currentPath.startsWith(`${category.path}/`)) {
        setActiveCategory(category.id);
        return;
      }

      // Check if any of the category's items match
      for (const item of category.items) {
        if (currentPath === item.path || currentPath.startsWith(`${item.path}/`)) {
          setActiveCategory(category.id);
          return;
        }
      }
    }
  }, [location.pathname]);

  const togglePanel = () => setIsPanelOpen((prev) => !prev);
  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);

  // Handle category change from IconRail
  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    // Auto-open panel when category is clicked (desktop only)
    setIsPanelOpen(true);
  };

  return (
    <div
      className={cn('flex h-screen w-full overflow-hidden', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Mobile Menu Button - Only visible on mobile */}
      <div className="fixed top-0 start-0 z-50 p-4 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMobileMenu}
          className={cn(
            'h-11 w-11 rounded-lg',
            'bg-background border border-content-border',
            'hover:bg-panel-hover',
            'focus-visible:ring-2 focus-visible:ring-icon-rail-active-indicator'
          )}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={toggleMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Icon Rail - Hidden on mobile, visible on tablet+ */}
      <IconRail
        items={iconRailItems}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        className="hidden md:flex"
      />

      {/* Expanded Panel - Full screen overlay on mobile, sidebar on desktop */}
      <div
        className={cn(
          // Mobile: Full screen overlay
          'fixed inset-y-0 start-0 z-40 md:static md:z-auto',

          // Transitions
          'transition-transform duration-250 ease-in-out',

          // Mobile visibility
          'md:flex',
          !isMobileMenuOpen && '-translate-x-full md:translate-x-0',
          isMobileMenuOpen && 'translate-x-0',

          // Desktop visibility
          !isPanelOpen && 'md:-translate-x-full',
          isPanelOpen && 'md:translate-x-0',

          // RTL support
          isRTL && [
            !isMobileMenuOpen && 'translate-x-full md:-translate-x-0',
            isMobileMenuOpen && '-translate-x-0',
            !isPanelOpen && 'md:translate-x-full',
            isPanelOpen && 'md:-translate-x-0',
          ]
        )}
      >
        <ExpandedPanel
          isOpen={true}
          onClose={() => {
            setIsMobileMenuOpen(false);
            setIsPanelOpen(false);
          }}
          userName={userName}
          userEmail={userEmail}
          userAvatar={userAvatar}
          onLogout={onLogout}
          activeCategory={activeCategory}
        />
      </div>

      {/* Main Content Area */}
      <main
        className={cn(
          // Layout
          'flex-1 overflow-auto',

          // Background
          'bg-background',

          // Responsive padding
          'px-4 sm:px-6 lg:px-8',
          'pt-20 md:pt-6 lg:pt-8',
          'pb-6 lg:pb-8',

          // Match IconRail height with margin
          'my-2 me-2 h-[calc(100vh-16px)]',

          // Rounded corners only on the right side (end side for RTL)
          'rounded-e-[12px]'
        )}
        style={{
          backgroundColor: '#f7f9fa',
          backgroundImage: 'linear-gradient(rgba(247, 249, 250, 0.85), rgba(247, 249, 250, 0.85)), url(/white-texture.jpg)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {children}
      </main>
    </div>
  );
}

NavigationShell.displayName = 'NavigationShell';
