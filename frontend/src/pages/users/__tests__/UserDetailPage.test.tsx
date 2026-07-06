import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// =============================================================================
// EN copy the detail page renders. The `t` mock supports bare keys (page calls
// useTranslation('user-management')) and returns the key itself when unmapped so
// a raw-key leak is visible in asserts.
// =============================================================================
const enCopy: Record<string, string> = {
  'userDetail.title': 'User Details',
  'userDetail.overview': 'Overview',
  'userProfile.email': 'Email',
  'userProfile.username': 'Username',
  'userProfile.fullName': 'Full Name',
  'userProfile.role': 'Role',
  'userProfile.status': 'Status',
  'userProfile.mfaEnabled': 'MFA Enabled',
  'userProfile.lastLoginAt': 'Last Login',
  'userProfile.department': 'Department',
  'roles.admin': 'Admin',
  'roles.editor': 'Editor',
  'roles.viewer': 'Viewer',
  'roles.assignRole': 'Assign Role',
  'roles.roleAssigned': 'Role assigned successfully',
  'roles.roleRequiresApproval': 'Admin role assignment requires dual approval',
  'roles.sessionsTerminatedCount': '{{count}} active sessions terminated',
  'userStatus.active': 'Active',
  'userStatus.inactive': 'Inactive',
  'userDeactivation.deactivate': 'Deactivate User',
  'userDeactivation.reactivate': 'Reactivate User',
  'userDeactivation.deactivated': 'User deactivated successfully',
  'userDeactivation.reactivated': 'User reactivated successfully',
  'userDeactivation.confirmDeactivation': 'Are you sure you want to deactivate this user?',
  'userDeactivation.orphanedItems': 'Orphaned Items',
  'userDeactivation.orphanedDossiers': '{{count}} dossiers will be marked as orphaned',
  'errors.loadFailed': 'Failed to load user data',
  'errors.saveFailed': 'Failed to save user data',
  'actions.cancel': 'Cancel',
}

function interpolate(key: string, opts?: Record<string, unknown>): string {
  const template = key in enCopy ? enCopy[key] : key
  if (opts === undefined) return template
  return template.replace(/\{\{(\w+)\}\}/g, (_m, name: string) =>
    opts[name] !== undefined ? String(opts[name]) : `{{${name}}}`,
  )
}

vi.mock('react-i18next', () => ({
  useTranslation: (): {
    t: (k: string, opts?: Record<string, unknown>) => string
    i18n: { language: string }
  } => ({
    t: (k: string, opts?: Record<string, unknown>): string => interpolate(k, opts),
    i18n: { language: 'en' },
  }),
  Trans: ({ children }: { children: ReactNode }): ReactNode => children,
}))

// Chainable supabase builder mock for the detail select. `single()` resolves to
// whatever the test stages via `singleMock`.
const singleMock = vi.fn()
vi.mock('@/lib/supabase', () => {
  const builder = {
    select: (): typeof builder => builder,
    eq: (): typeof builder => builder,
    is: (): typeof builder => builder,
    single: (): unknown => singleMock(),
  }
  return { supabase: { from: (): typeof builder => builder } }
})

const assignRoleMock = vi.fn()
const deactivateUserMock = vi.fn()
const reactivateUserMock = vi.fn()
vi.mock('@/services/user-management-api', () => ({
  assignRole: (data: unknown): unknown => assignRoleMock(data),
  deactivateUser: (data: unknown): unknown => deactivateUserMock(data),
  reactivateUser: (data: unknown): unknown => reactivateUserMock(data),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

import { UserDetailPage } from '../UserDetailPage'
import { toast } from 'sonner'

const ACTIVE_EDITOR = {
  id: 'user-1',
  email: 'jane.doe@example.com',
  username: 'jane_doe',
  full_name: 'Jane Doe',
  name_en: 'Jane Doe',
  name_ar: 'جين دو',
  role: 'editor',
  is_active: true,
  mfa_enabled: true,
  last_login_at: '2026-06-01T10:00:00Z',
  department: 'Policy',
  avatar_url: null,
}

function renderPage(): void {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <UserDetailPage userId="user-1" />
    </QueryClientProvider>,
  )
}

describe('UserDetailPage', () => {
  beforeEach(() => {
    singleMock.mockReset()
    assignRoleMock.mockReset()
    deactivateUserMock.mockReset()
    reactivateUserMock.mockReset()
    vi.mocked(toast.success).mockReset()
    vi.mocked(toast.error).mockReset()
    vi.mocked(toast.info).mockReset()
  })

  it('renders the profile: email, username, full name, role label, and status badge', async () => {
    singleMock.mockResolvedValue({ data: ACTIVE_EDITOR, error: null })
    renderPage()

    // Email renders in both the header subtitle and the Email field.
    await waitFor(() =>
      expect(screen.getAllByText('jane.doe@example.com').length).toBeGreaterThan(0),
    )
    expect(screen.getByText('jane_doe')).toBeInTheDocument()
    expect(screen.getAllByText('Jane Doe').length).toBeGreaterThan(0)
    expect(screen.getByText('Editor')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders last_login_at through the day-first format helper (Latin digits), not toLocaleDateString', async () => {
    singleMock.mockResolvedValue({ data: ACTIVE_EDITOR, error: null })
    renderPage()

    // formatDayFirstYear('2026-06-01T10:00:00Z') => '01 Jun 2026' (en-GB, Asia/Dubai)
    await waitFor(() => expect(screen.getByText('01 Jun 2026')).toBeInTheDocument())
  })

  it('renders a localized error state with role="alert" on query error, not a blank page', async () => {
    singleMock.mockResolvedValue({ data: null, error: { message: 'row not found' } })
    renderPage()

    await waitFor(() => {
      const alert = screen.getByRole('alert')
      expect(alert).toHaveTextContent('Failed to load user data')
    })
  })
})
