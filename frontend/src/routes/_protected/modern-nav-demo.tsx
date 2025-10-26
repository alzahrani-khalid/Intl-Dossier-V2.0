import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  NavigationShell,
  MetricCard,
  ExecutionsTabs,
} from '@/components/modern-nav';

/**
 * Modern Navigation Demo Page
 *
 * Showcases the complete navigation design system:
 * - Material Design 3 Navigation Rail (56px)
 * - Expanded Panel (280px) with all sections
 * - Dashboard content with animated metrics
 * - Responsive 3-column layout
 * - Dark/Light mode support
 * - RTL support for Arabic
 */
export const Route = createFileRoute('/_protected/modern-nav-demo')({
  component: ModernNavDemo,
});

function ModernNavDemo() {
  const { t } = useTranslation();

  const handleLogout = () => {
    console.log('Logout clicked');
    // Add your logout logic here
  };

  return (
    <NavigationShell
      userName="John Doe"
      userEmail="customerpop@gmail.com"
      onLogout={handleLogout}
      defaultPanelOpen={true}
    >
      {/* Dashboard Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Page Header */}
        <header className="mb-6 sm:mb-8 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-content-text mb-2">
            {t('navigation.dashboard', 'Dashboard')}
          </h1>
          <p className="text-sm sm:text-base text-content-text-muted">
            {t(
              'demo.subtitle',
              'Modern navigation design system demonstration'
            )}
          </p>
        </header>

        {/* Content Grid - Mobile: 1 column, Desktop: 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Metric Card - Large */}
          <div className="lg:col-span-2">
            <MetricCard
              label={t('metrics.executions', 'Executions')}
              value={340}
              trend={{ value: 23, direction: 'up' }}
              linkText={t('common.seeReport', 'See Report')}
              onLinkClick={() => console.log('See Report clicked')}
            />
          </div>

          {/* Additional Metric Cards */}
          <MetricCard
            label={t('metrics.activeProjects', 'Active Projects')}
            value={12}
            trend={{ value: 8, direction: 'up' }}
            linkText={t('common.viewAll', 'View All')}
            onLinkClick={() => console.log('View All Projects')}
          />

          <MetricCard
            label={t('metrics.teamMembers', 'Team Members')}
            value={24}
            trend={{ value: 2, direction: 'neutral' }}
            linkText={t('common.manage', 'Manage')}
            onLinkClick={() => console.log('Manage Team')}
          />

          {/* Executions Tabs - Full width */}
          <div className="lg:col-span-2">
            <ExecutionsTabs
              title={t('navigation.executions', 'Executions')}
            />
          </div>
        </div>

        {/* Demo Information */}
        <div className="mt-12 p-6 bg-panel rounded-lg border border-panel-border">
          <h2 className="text-lg font-semibold text-content-text mb-4">
            {t('demo.features', 'Features Demonstrated')}
          </h2>
          <ul className="space-y-2 text-sm text-content-text-muted">
            <li className="flex items-start gap-2">
              <span className="text-icon-rail-active-indicator">✓</span>
              <span>
                Material Design 3 Navigation Rail (56px) with hover states and
                active indicators
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-icon-rail-active-indicator">✓</span>
              <span>
                Expanded Panel (280px) with user profile, projects, status,
                history, and documents
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-icon-rail-active-indicator">✓</span>
              <span>
                Animated metric cards with trend indicators and smooth counter
                animations
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-icon-rail-active-indicator">✓</span>
              <span>
                Tabbed interface with search functionality (Workflows,
                Permissions, Members)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-icon-rail-active-indicator">✓</span>
              <span>
                Collapsible document tree with nested folders and search
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-icon-rail-active-indicator">✓</span>
              <span>
                Responsive design: Mobile hamburger menu → Tablet icon rail →
                Desktop full layout
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-icon-rail-active-indicator">✓</span>
              <span>
                Full RTL support for Arabic language with logical properties
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-icon-rail-active-indicator">✓</span>
              <span>
                Dark/Light mode support with CSS custom properties design tokens
              </span>
            </li>
          </ul>
        </div>

        {/* Testing Guide */}
        <div className="mt-6 p-6 bg-background rounded-lg border border-content-border">
          <h2 className="text-lg font-semibold text-content-text mb-4">
            {t('demo.testing', 'Testing Guide')}
          </h2>
          <div className="space-y-4 text-sm text-content-text-muted">
            <div>
              <h3 className="font-medium text-content-text mb-2">
                Responsive Testing:
              </h3>
              <ul className="list-disc list-inside space-y-1 ms-4">
                <li>Mobile (&lt;768px): Hamburger menu, full-screen overlay</li>
                <li>
                  Tablet (768-1024px): Icon rail visible, panel collapsed
                </li>
                <li>Desktop (&gt;1024px): Full 3-column layout</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-content-text mb-2">
                RTL Testing:
              </h3>
              <ul className="list-disc list-inside space-y-1 ms-4">
                <li>Switch to Arabic language to test RTL layout</li>
                <li>All icons, text, and layout should flip correctly</li>
                <li>Logical properties ensure proper RTL behavior</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-content-text mb-2">
                Dark Mode Testing:
              </h3>
              <ul className="list-disc list-inside space-y-1 ms-4">
                <li>Toggle theme via settings to test dark mode</li>
                <li>All colors should adapt via CSS custom properties</li>
                <li>Icon rail background: #1A1D26 (dark gray)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </NavigationShell>
  );
}
