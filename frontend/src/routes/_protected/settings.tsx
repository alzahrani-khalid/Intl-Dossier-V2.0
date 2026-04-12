import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'
import { SettingsPage } from '@/pages/settings/SettingsPage'
import { useDirection } from '@/hooks/useDirection'

export const Route = createFileRoute('/_protected/settings')({
  component: SettingsLayout,
})

function SettingsLayout() {
  const { direction } = useDirection()
  // Check if we're on an exact /settings path or a child route
  const matches = useMatches()
  const isExactSettingsRoute =
    matches.length > 0 && matches[matches.length - 1]!.pathname === '/settings'

  // If exact /settings route, show SettingsPage
  // Otherwise, render Outlet for child routes like /settings/webhooks
  if (isExactSettingsRoute) {
    return (
      <div dir={direction}>
        <SettingsPage />
      </div>
    )
  }

  return (
    <div dir={direction}>
      <Outlet />
    </div>
  )
}
