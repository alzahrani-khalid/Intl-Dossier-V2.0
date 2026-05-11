/**
 * Sidebar.test.tsx — Phase 36 SHELL-01 GREEN (Wave 1 / 36-02).
 *
 * The three `it` titles MUST keep their prefixes (`renders three sections`,
 * `active accent bar`, `admin gate`) — they are referenced by VALIDATION.md
 * §Per-Task Verification Map and by Wave 2 `--grep` commands.
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// -- Mocks must be declared BEFORE the SUT import so the hoisted vi.mock wins.

const locationMock = { pathname: '/dashboard' }

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    className,
    'aria-current': ariaCurrent,
  }: {
    to: string
    children: React.ReactNode
    className?: string
    'aria-current'?: 'page' | undefined
  }) => (
    <a href={to} className={className} aria-current={ariaCurrent}>
      {children}
    </a>
  ),
  useLocation: () => locationMock,
}))

type AuthState = { user: { id: string; email: string; name?: string; role?: string } | null }

const authState: AuthState = {
  user: { id: 'u1', email: 'ka@gastat.gov.sa', name: 'Khalid Alzahrani', role: 'admin' },
}

vi.mock('@/store/authStore', () => ({
  useAuthStore: () => authState,
}))

// Global i18n mock in tests/setup.ts echoes unknown keys verbatim. We rely on
// that behaviour: `t('navigation.operations')` → `'navigation.operations'`,
// which lets our regex assertions match on `/operations/i` etc.

import { Sidebar } from './Sidebar'

beforeEach(() => {
  locationMock.pathname = '/dashboard'
  authState.user = { id: 'u1', email: 'ka@gastat.gov.sa', name: 'Khalid Alzahrani', role: 'admin' }
})

describe('Sidebar', () => {
  it('renders three sections — Workspace / Intelligence / Administration', () => {
    const { container } = render(<Sidebar />)
    const sidebar = container.querySelector('.sb')
    expect(sidebar).not.toBeNull()
    expect(sidebar!.className).toMatch(/\bsidebar\b/)
    // The i18n mock echoes the translation key back, so we match the tail of
    // each group label against /operations|dossiers|administration/. getByText
    // throws if the node is missing — the non-throw is the assertion.
    expect(screen.getByText(/operations/i)).toBeTruthy()
    expect(screen.getByText(/\bdossiers\b/i)).toBeTruthy()
    expect(screen.getByText(/administration/i)).toBeTruthy()
  })

  it('active accent bar — highlights the matched route with a start-edge indicator', () => {
    locationMock.pathname = '/dashboard'
    render(<Sidebar />)
    const activeLink = screen.getByRole('link', { current: 'page' })
    expect(activeLink).toBeTruthy()
    expect(activeLink.className).toMatch(/\bactive\b/)
    // Accent bar is a ::before pseudo, encoded into the className string.
    expect(activeLink.className).toMatch(/before:start-0/)
    expect(activeLink.className).toMatch(/before:bg-\[var\(--accent\)\]/)
    // No physical-property class leaked in on the active state.
    expect(activeLink.className).not.toMatch(/\bbefore:left-0\b/)
  })

  it('admin gate — hides Administration section from non-admin users', () => {
    authState.user = { id: 'u2', email: 'v@gastat.gov.sa', name: 'Viewer', role: 'viewer' }
    render(<Sidebar />)
    expect(screen.queryByText(/administration/i)).toBeNull()
    // Operations and Dossiers are still visible for non-admin users.
    expect(screen.getByText(/operations/i)).toBeTruthy()
    expect(screen.getByText(/\bdossiers\b/i)).toBeTruthy()
  })
})
