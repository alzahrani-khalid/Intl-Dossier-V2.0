/**
 * Phase 42-09 — SettingsLayout + SettingsNavigation reskin tests.
 * Phase 97 NAV-02 — repointed for the route-driven nav column (C9).
 *
 * Validates the handoff chrome (R-02, D-09, D-12):
 *   - 9 nav rows in canonical order (R-02; not 7)
 *   - Active row uses `.settings-nav.active` (accent bar via index.css ::before)
 *   - Mobile pill row at ≤768px (className/structure check; the actual
 *     `overflow-x: auto` rule lives in index.css)
 *   - 44×44 touch targets (`min-height: 44px` inline style)
 *   - i18n key for security row → `nav.accessAndSecurity` (D-09 rename)
 *
 * WHAT PHASE 97 CHANGED HERE, and what it deliberately did NOT. The rows moved
 * from `button` + `onChange` to a TanStack `Link` carrying `?section=`, so the
 * four assertions that queried `button.settings-nav` now query the rendered
 * anchor. The nine `data-testid` values, their order, the `minHeight: 44px` pin
 * and the `nav.accessAndSecurity` copy pin are preserved verbatim — the element
 * type is the only thing that moved. The active-state assertion changed SHAPE:
 * it used to be a function of the `activeSection` prop, and is now a function of
 * the route, so it is asserted twice — exactly one marked row at the index, and
 * ZERO on a child route, which is the contract that made this change necessary.
 *
 * The 240px + 1fr grid assertion left this file with the grid itself: it now
 * lives in `routes/_protected/settings.tsx`, which mounts the column once for
 * the whole subtree. `SettingsLayout` is the index-only content card now, and
 * is asserted as such below.
 *
 * The global i18n mock in tests/setup.ts returns `key` when no translation is
 * mapped, so we assert against the raw key strings (`nav.profile` etc.) rather
 * than localized text.
 */

import type { ReactElement } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SettingsLayout } from '../SettingsLayout'
import { SettingsNavigation } from '../SettingsNavigation'
import type { SettingsSectionId } from '@/types/settings.types'

// SettingsNavigation is router-driven (F18's `useNavigate` back-to-app link, and
// NAV-02's `Link` rows + `useRouterState` active derivation). These are bare
// renders with no RouterProvider, so the router surface is stubbed and the
// location is set per-test — which is exactly how the active-state contract is
// exercised in both directions.
const routerState = vi.hoisted(() => ({
  pathname: '/settings',
  search: {} as Record<string, unknown>,
}))

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  useNavigate: () => vi.fn(),
  useRouterState: <T,>({ select }: { select: (s: unknown) => T }): T =>
    select({ location: { pathname: routerState.pathname, search: routerState.search } }),
  Link: ({
    to,
    search,
    activeOptions: _activeOptions,
    children,
    ...rest
  }: {
    to: string
    search?: Record<string, unknown>
    activeOptions?: unknown
    children?: React.ReactNode
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>): ReactElement => (
    <a href={`${to}?section=${String(search?.section ?? '')}`} {...rest}>
      {children}
    </a>
  ),
}))

/** Point the stubbed router at a location before rendering the column. */
function atLocation(pathname: string, search: Record<string, unknown> = {}): void {
  routerState.pathname = pathname
  routerState.search = search
}

function renderLayout(activeSection: SettingsSectionId = 'profile'): ReturnType<typeof render> {
  return render(
    (
      <SettingsLayout activeSection={activeSection}>
        <div data-testid="content">content</div>
      </SettingsLayout>
    ) as ReactElement,
  )
}

beforeEach(() => {
  atLocation('/settings')
})

describe('SettingsLayout (Phase 42-09)', () => {
  it('renders the index-only content card, without the subtree grid or nav column', () => {
    const { container } = renderLayout()
    const root = container.querySelector('.settings-content') as HTMLElement | null
    expect(root).not.toBeNull()
    // The grid moved to the settings layout ROUTE, which mounts it once for the
    // index and every child — this component must not render a second one.
    expect(container.querySelector('.settings-layout')).toBeNull()
    expect(container.querySelector('nav.settings-nav-card')).toBeNull()
    expect(root!.querySelector('.card')).not.toBeNull()
  })

  it('emits a `data-loading` attribute on the section root', () => {
    const { container } = renderLayout()
    const root = container.querySelector('.settings-content') as HTMLElement
    expect(root.getAttribute('data-loading')).toBe('false')
  })

  it('renders a `.card-head` with `.card-title` + `.card-sub` above the children', () => {
    const { container } = renderLayout('appearance')
    expect(container.querySelector('.card-head .card-title')).not.toBeNull()
    expect(container.querySelector('.card-head .card-sub')).not.toBeNull()
    expect(screen.getByTestId('content')).not.toBeNull()
  })
})

describe('SettingsNavigation (Phase 42-09)', () => {
  it('renders exactly 9 nav rows in canonical R-02 order', () => {
    const { container } = render(<SettingsNavigation />)
    const rows = Array.from(container.querySelectorAll('a.settings-nav'))
    expect(rows.length).toBe(9)
    const ids = rows.map((r) => r.getAttribute('data-testid'))
    expect(ids).toEqual([
      'settings-nav-profile',
      'settings-nav-general',
      'settings-nav-appearance',
      'settings-nav-notifications',
      'settings-nav-security',
      'settings-nav-accessibility',
      'settings-nav-data-privacy',
      'settings-nav-email-digest',
      'settings-nav-integrations',
    ])
  })

  it('marks the routed section with `.settings-nav.active` and aria-current="page"', () => {
    atLocation('/settings', { section: 'appearance' })
    const { container } = render(<SettingsNavigation />)
    const marked = container.querySelectorAll('a.settings-nav[aria-current="page"]')
    expect(marked.length).toBe(1)
    const active = container.querySelector('a.settings-nav.active') as HTMLElement
    expect(active).not.toBeNull()
    expect(active.getAttribute('data-testid')).toBe('settings-nav-appearance')
    expect(active.getAttribute('aria-current')).toBe('page')
    const inactive = container.querySelector(
      'a.settings-nav[data-testid="settings-nav-profile"]',
    ) as HTMLElement
    expect(inactive.classList.contains('active')).toBe(false)
    expect(inactive.getAttribute('aria-current')).toBeNull()
  })

  it('marks NO row on a child route — none of the in-page sections is what renders there', () => {
    atLocation('/settings/webhooks')
    const { container } = render(<SettingsNavigation />)
    expect(container.querySelectorAll('a.settings-nav[aria-current="page"]').length).toBe(0)
    expect(container.querySelectorAll('a.settings-nav.active').length).toBe(0)
    // The rows are still there and still navigable — no dead buttons.
    expect(container.querySelectorAll('a.settings-nav').length).toBe(9)
  })

  it('falls back to the default section when `?section=` is absent or unknown', () => {
    atLocation('/settings', { section: 'not-a-section' })
    const { container } = render(<SettingsNavigation />)
    const active = container.querySelector('a.settings-nav.active') as HTMLElement
    expect(active.getAttribute('data-testid')).toBe('settings-nav-profile')
  })

  it('every nav row has min-height: 44px (touch target)', () => {
    const { container } = render(<SettingsNavigation />)
    const rows = Array.from(container.querySelectorAll<HTMLElement>('a.settings-nav'))
    for (const row of rows) {
      expect(row.style.minHeight).toBe('44px')
    }
  })

  it('Security row uses i18n key `nav.accessAndSecurity` (D-09 rename)', () => {
    atLocation('/settings', { section: 'security' })
    const { container } = render(<SettingsNavigation />)
    const securityRow = container.querySelector(
      'a[data-testid="settings-nav-security"]',
    ) as HTMLElement
    // The global i18n mock returns the raw key when unmapped; the SettingsNavigation
    // component is wired with the `settings` namespace, so the rendered text is
    // `nav.accessAndSecurity`.
    expect(securityRow.textContent).toContain('nav.accessAndSecurity')
  })

  it('renders inside a `.settings-nav-card` shell (mobile pill row target)', () => {
    const { container } = render(<SettingsNavigation />)
    // The @media (max-width: 768px) rule in index.css turns this card into the
    // horizontal pill row — the component must expose the className target.
    const navCard = container.querySelector('nav.settings-nav-card') as HTMLElement
    expect(navCard).not.toBeNull()
    expect(navCard.classList.contains('card')).toBe(true)
  })
})
