import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  NavigationShell,
  MetricCard,
  ExecutionsTabs,
} from '@/components/modern-nav';

/**
 * Standalone Modern Navigation Demo
 *
 * This route renders OUTSIDE the main app layout to showcase
 * the complete navigation system without the old sidebar.
 *
 * Access at: /modern-nav-standalone
 */
export const Route = createFileRoute('/modern-nav-standalone')({
  component: StandaloneDemo,
});

function StandaloneDemo() {
  const { t } = useTranslation();

  const handleLogout = () => {
    console.log('Logout clicked');
  };

  return (
    <div className="fixed inset-0 overflow-hidden">
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
              All Your Workflows And Permissions
            </p>
          </header>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Large Metric Card */}
            <div className="lg:col-span-2">
              <MetricCard
                label={t('metrics.executions', 'Executions')}
                value={340}
                trend={{ value: 23, direction: 'up' }}
                linkText={t('common.seeReport', 'See Report')}
                onLinkClick={() => console.log('See Report clicked')}
              />
            </div>

            {/* Additional Metrics */}
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

            {/* Executions Tabs */}
            <div className="lg:col-span-2">
              <ExecutionsTabs
                title={t('navigation.executions', 'Executions')}
              />
            </div>
          </div>

          {/* Reference Comparison */}
          <div className="mt-12 p-6 bg-panel rounded-lg border border-panel-border">
            <h2 className="text-lg font-semibold text-content-text mb-4">
              ✅ Reference Design Match
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h3 className="font-medium text-content-text mb-2">
                  Icon Rail (Left)
                </h3>
                <ul className="space-y-1 text-content-text-muted">
                  <li>✓ 56px width</li>
                  <li>✓ Dark background (#1A1D26)</li>
                  <li>✓ Icon-only buttons</li>
                  <li>✓ Green active indicator</li>
                  <li>✓ Settings at bottom</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-content-text mb-2">
                  Expanded Panel (Middle)
                </h3>
                <ul className="space-y-1 text-content-text-muted">
                  <li>✓ 280px width</li>
                  <li>✓ Light gray background</li>
                  <li>✓ User profile at top</li>
                  <li>✓ Projects with badges</li>
                  <li>✓ Status (New 3, Updates 2)</li>
                  <li>✓ Document tree</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-content-text mb-2">
                  Content Area (Right)
                </h3>
                <ul className="space-y-1 text-content-text-muted">
                  <li>✓ White background</li>
                  <li>✓ Dashboard title</li>
                  <li>✓ Executions: 340 +23%</li>
                  <li>✓ Animated counter</li>
                  <li>✓ Tabs with search</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </NavigationShell>
    </div>
  );
}
