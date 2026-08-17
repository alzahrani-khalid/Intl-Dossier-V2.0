/**
 * Settings subtree layout route (NAV-02, Phase 97).
 *
 * This is the ONE mount of the settings nav column. It renders the shipped
 * 240px + 1fr geometry for the index AND for every child alike, which is what
 * closes the gap the two disagreeing `/settings` checks used to leave: the
 * global sidebar was suppressed by prefix while the column mounted only on an
 * exact match, so all six children rendered no navigation at all.
 *
 * The index-only card-head stays inside `SettingsLayout` (mounted by
 * `SettingsPage`) and deliberately does NOT travel here — wrapping a child in
 * it would print another section's title above unrelated content.
 */
import { createFileRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { SettingsPage } from '@/pages/settings/SettingsPage'
import { useDirection } from '@/hooks/useDirection'
import { SettingsNavigation, toSettingsSection } from '@/components/settings/SettingsNavigation'
import { isSettingsPathExact } from '@/lib/settings-route'
import type { SettingsSectionId } from '@/types/settings.types'

export interface SettingsSearch {
  /** Which in-page section the index renders. Deep-linkable; whitelisted below. */
  section: SettingsSectionId
}

export const Route = createFileRoute('/_protected/settings')({
  component: SettingsRouteLayout,
  // T-97-19: `?section=` is attacker-controllable input that selects which
  // section renders. `toSettingsSection` membership-tests it against the
  // shipped section list and falls back to the default — an unknown value
  // never passes through.
  validateSearch: (search: Record<string, unknown>): SettingsSearch => ({
    section: toSettingsSection(search.section),
  }),
})

function SettingsRouteLayout(): React.JSX.Element {
  const { direction } = useDirection()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isIndex = isSettingsPathExact(pathname)

  return (
    <div
      dir={direction}
      className="page settings-layout"
      style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr',
        gap: 'var(--gap)',
      }}
    >
      <SettingsNavigation />
      {/* `min-w-0` keeps a wide child (tables, code blocks) from blowing the
          1fr track out past the viewport — the classic grid overflow trap. */}
      <div className="min-w-0">{isIndex ? <SettingsPage /> : <Outlet />}</div>
    </div>
  )
}
