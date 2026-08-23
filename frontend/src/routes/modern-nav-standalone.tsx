import type { ReactElement } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { NavigationShell, MetricCard, ExecutionsTabs } from '@/components/modern-nav'
import { devModeGuard } from '@/lib/dev-mode-guard'

/**
 * Standalone Modern Navigation Demo
 *
 * This route renders OUTSIDE the main app layout to showcase
 * the complete navigation system without the old sidebar.
 *
 * Access at: /modern-nav-standalone
 */
export const Route = createFileRoute('/modern-nav-standalone')({
  // FE-FUNC-18: standalone navigation demo (carries a placeholder user) — dev-only.
  beforeLoad: devModeGuard,
  component: StandaloneDemo,
})

const ICON_RAIL_CHECKS = [
  '56px width',
  'Dark background (sidebar-bg token)',
  'Icon-only buttons',
  'Green active indicator',
  'Settings at bottom',
]

const PANEL_CHECKS = [
  '280px width',
  'Light gray background',
  'User profile at top',
  'Projects with badges',
  'Status (New 3, Updates 2)',
  'Document tree',
]

const CONTENT_CHECKS = [
  'White background',
  'Dashboard title',
  'Executions: 340 +23%',
  'Animated counter',
  'Tabs with search',
]

function ReferenceColumn({ title, items }: { title: string; items: string[] }): ReactElement {
  return (
    <div>
      <h3 className="font-medium text-content-text mb-2">{title}</h3>
      <ul className="space-y-1 text-content-text-muted">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 shrink-0 text-[var(--ink-mute)]" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function StandaloneDemo() {
  const { t } = useTranslation()

  const handleLogout = () => {
    // TODO: Implement logout
  }

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
                linkText={t('common:seeReport', 'See Report')}
                onLinkClick={() => {
                  /* TODO: Navigate to report */
                }}
              />
            </div>

            {/* Additional Metrics */}
            <MetricCard
              label={t('metrics.activeProjects', 'Active Projects')}
              value={12}
              trend={{ value: 8, direction: 'up' }}
              linkText={t('common:viewAll', 'View All')}
              onLinkClick={() => {
                /* TODO: Navigate to projects */
              }}
            />

            <MetricCard
              label={t('metrics.teamMembers', 'Team Members')}
              value={24}
              trend={{ value: 2, direction: 'neutral' }}
              linkText={t('common:manage', 'Manage')}
              onLinkClick={() => {
                /* TODO: Navigate to team */
              }}
            />

            {/* Executions Tabs */}
            <div className="lg:col-span-2">
              <ExecutionsTabs title={t('navigation.executions', 'Executions')} />
            </div>
          </div>

          {/* Reference Comparison */}
          <div className="mt-12 p-6 bg-panel rounded-lg border border-panel-border">
            <h2 className="text-lg font-semibold text-content-text mb-4 flex items-center gap-2">
              <Check className="h-5 w-5 shrink-0 text-[var(--ok)]" aria-hidden="true" />
              Reference Design Match
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <ReferenceColumn title="Icon Rail (Left)" items={ICON_RAIL_CHECKS} />
              <ReferenceColumn title="Expanded Panel (Middle)" items={PANEL_CHECKS} />
              <ReferenceColumn title="Content Area (Right)" items={CONTENT_CHECKS} />
            </div>
          </div>
        </div>
      </NavigationShell>
    </div>
  )
}
