import { createFileRoute } from '@tanstack/react-router'
import React from 'react'
import { ResponsiveCard } from '@/components/responsive/responsive-card'
import { ResponsiveCardGrid } from '@/components/responsive/responsive-card'
import { ResponsiveTable } from '@/components/responsive/responsive-table'
import { ResponsiveNav, type NavItem } from '@/components/responsive/responsive-nav'
import { ThemeSelector } from '@/components/theme-selector/theme-selector'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useResponsive } from '@/hooks/use-responsive'

function ViewInfo() {
  const r = useResponsive()
  return (
    <div data-testid="viewport-info" className="text-sm text-muted-foreground">
      alias:{' '}
      <span data-testid="alias">{r.alias}</span> · device:{' '}
      <span data-testid="device">{r.deviceType}</span> · width:{' '}
      <span data-testid="width">{r.width}</span>
    </div>
  )
}

export function DemoPage() {
  const items: NavItem[] = [
    { id: 'home', label: 'Home', href: '#' },
    { id: 'reports', label: 'Reports', href: '#', priority: 'high' },
    { id: 'settings', label: 'Settings', href: '#' },
  ]

  const rows = [
    { id: 1, name: 'Saudi Arabia', status: 'Active', mou: 'MoU-001' },
    { id: 2, name: 'UAE', status: 'Draft', mou: 'MoU-002' },
  ]

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Responsive Demo</h1>
      <div className="flex gap-3">
        <ThemeSelector />
        <LanguageSwitcher />
      </div>
      <ViewInfo />

      <div data-testid="responsive-nav">
        <ResponsiveNav items={items} mobileBreakpoint="md" />
      </div>

      <ResponsiveCardGrid>
        <ResponsiveCard
          collapsible
          defaultCollapsed={false}
          title={<span>Progressive Disclosure</span>}
          description={<span>Tap the header on mobile to collapse/expand</span>}
          className="border"
        >
          <div data-testid="collapsible-card-content">This is card content</div>
        </ResponsiveCard>
      </ResponsiveCardGrid>

      <div data-testid="responsive-table">
        <ResponsiveTable
          data={rows}
          mobileView="card"
          columns={[
            { key: 'name', header: 'Name', accessor: (r) => r.name, priority: 'high' },
            { key: 'status', header: 'Status', accessor: (r) => r.status },
            { key: 'mou', header: 'MoU', accessor: (r) => r.mou, hideOnMobile: true },
          ]}
        />
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_protected/responsive-demo')({ component: DemoPage })
