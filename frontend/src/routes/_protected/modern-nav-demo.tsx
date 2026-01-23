import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { NavigationShell, MetricCard, ExecutionsTabs } from '@/components/modern-nav'

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
})

function ModernNavDemo() {
  const { t } = useTranslation()

  const handleLogout = () => {
    // TODO: Add your logout logic here
  }

  return (
    <NavigationShell
      userName="John Doe"
      userEmail="customerpop@gmail.com"
      onLogout={handleLogout}
      defaultPanelOpen={true}
    >
      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
        {/* Page Header */}
        <header className="mb-6 sm:mb-8 lg:mb-12">
          <h1 className="text-content-text mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">
            {t('navigation.dashboard', 'Dashboard')}
          </h1>
          <p className="text-content-text-muted text-sm sm:text-base">
            {t('demo.subtitle', 'Modern navigation design system demonstration')}
          </p>
        </header>

        {/* Content Grid - Mobile: 1 column, Desktop: 2 columns */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Metric Card - Large */}
          <div className="lg:col-span-2">
            <MetricCard
              label={t('metrics.executions', 'Executions')}
              value={340}
              trend={{ value: 23, direction: 'up' }}
              linkText={t('common.seeReport', 'See Report')}
              onLinkClick={() => {
                /* TODO: Navigate to report */
              }}
            />
          </div>

          {/* Additional Metric Cards */}
          <MetricCard
            label={t('metrics.activeProjects', 'Active Projects')}
            value={12}
            trend={{ value: 8, direction: 'up' }}
            linkText={t('common.viewAll', 'View All')}
            onLinkClick={() => {
              /* TODO: Navigate to projects */
            }}
          />

          <MetricCard
            label={t('metrics.teamMembers', 'Team Members')}
            value={24}
            trend={{ value: 2, direction: 'neutral' }}
            linkText={t('common.manage', 'Manage')}
            onLinkClick={() => {
              /* TODO: Navigate to team */
            }}
          />

          {/* Executions Tabs - Full width */}
          <div className="lg:col-span-2">
            <ExecutionsTabs title={t('navigation.executions', 'Executions')} />
          </div>
        </div>

        {/* Demo Information */}
        <div className="bg-panel border-panel-border mt-12 rounded-lg border p-6">
          <h2 className="text-content-text mb-4 text-lg font-semibold">
            {t('demo.features', 'Features Demonstrated')}
          </h2>
          <ul className="text-content-text-muted space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-icon-rail-active-indicator">✓</span>
              <span>
                Material Design 3 Navigation Rail (56px) with hover states and active indicators
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-icon-rail-active-indicator">✓</span>
              <span>
                Expanded Panel (280px) with user profile, projects, status, history, and documents
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-icon-rail-active-indicator">✓</span>
              <span>Animated metric cards with trend indicators and smooth counter animations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-icon-rail-active-indicator">✓</span>
              <span>
                Tabbed interface with search functionality (Workflows, Permissions, Members)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-icon-rail-active-indicator">✓</span>
              <span>Collapsible document tree with nested folders and search</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-icon-rail-active-indicator">✓</span>
              <span>
                Responsive design: Mobile hamburger menu → Tablet icon rail → Desktop full layout
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-icon-rail-active-indicator">✓</span>
              <span>Full RTL support for Arabic language with logical properties</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-icon-rail-active-indicator">✓</span>
              <span>Dark/Light mode support with CSS custom properties design tokens</span>
            </li>
          </ul>
        </div>

        {/* Testing Guide */}
        <div className="border-content-border mt-6 rounded-lg border bg-background p-6">
          <h2 className="text-content-text mb-4 text-lg font-semibold">
            {t('demo.testing', 'Testing Guide')}
          </h2>
          <div className="text-content-text-muted space-y-4 text-sm">
            <div>
              <h3 className="text-content-text mb-2 font-medium">Responsive Testing:</h3>
              <ul className="ms-4 list-inside list-disc space-y-1">
                <li>Mobile (&lt;768px): Hamburger menu, full-screen overlay</li>
                <li>Tablet (768-1024px): Icon rail visible, panel collapsed</li>
                <li>Desktop (&gt;1024px): Full 3-column layout</li>
              </ul>
            </div>
            <div>
              <h3 className="text-content-text mb-2 font-medium">RTL Testing:</h3>
              <ul className="ms-4 list-inside list-disc space-y-1">
                <li>Switch to Arabic language to test RTL layout</li>
                <li>All icons, text, and layout should flip correctly</li>
                <li>Logical properties ensure proper RTL behavior</li>
              </ul>
            </div>
            <div>
              <h3 className="text-content-text mb-2 font-medium">Dark Mode Testing:</h3>
              <ul className="ms-4 list-inside list-disc space-y-1">
                <li>Toggle theme via settings to test dark mode</li>
                <li>All colors should adapt via CSS custom properties</li>
                <li>Icon rail background: #1A1D26 (dark gray)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </NavigationShell>
  )
}
