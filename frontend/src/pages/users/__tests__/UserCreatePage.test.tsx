import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// =============================================================================
// EN copy the page renders. The `t` mock supports both bare keys (page calls
// useTranslation('user-management') so labels are bare) and colon-form keys
// (Zod messages + form.setError go through FormMessage's default-ns t()).
// Unmapped keys return the key itself, so a raw-key leak is visible in asserts.
// =============================================================================
const enCopy: Record<string, string> = {
  'userOnboarding.createUser': 'Create User',
  'createForm.subtitle': 'Add a new user account. New users are inactive until they activate.',
  'createForm.clearance': 'Clearance level',
  'createForm.submit': 'Create user',
  'userProfile.email': 'Email',
  'userProfile.username': 'Username',
  'userProfile.fullName': 'Full Name',
  'userProfile.role': 'Role',
  'roles.admin': 'Admin',
  'roles.editor': 'Editor',
  'roles.viewer': 'Viewer',
  'actions.cancel': 'Cancel',
  // Validation + server-error messages rendered by FormMessage (colon-form).
  'user-management:createForm.errors.emailInvalid': 'Enter a valid email address',
  'user-management:createForm.errors.usernameFormat': 'Username must be 3-50 lowercase characters',
  'user-management:createForm.errors.fullNameLength': 'Full name must be 2-100 characters',
  'user-management:createForm.errors.clearanceRange':
    'Clearance must be an integer between 1 and 4',
  'user-management:userOnboarding.duplicateEmail': 'Email already exists',
  'user-management:userOnboarding.duplicateUsername': 'Username already exists',
}

vi.mock('react-i18next', () => ({
  useTranslation: (): {
    t: (k: string, opts?: { defaultValue?: string }) => string
    i18n: { language: string }
  } => ({
    t: (k: string, opts?: { defaultValue?: string }): string => {
      if (k in enCopy) return enCopy[k]
      if (opts?.defaultValue !== undefined) return opts.defaultValue
      return k
    },
    i18n: { language: 'en' },
  }),
  Trans: ({ children }: { children: ReactNode }): ReactNode => children,
}))

const createUserMock = vi.fn()
vi.mock('@/services/user-management-api', () => ({
  createUser: (data: unknown): unknown => createUserMock(data),
}))

const navigateMock = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: (): typeof navigateMock => navigateMock,
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import { UserCreatePage } from '../UserCreatePage'
import { toast } from 'sonner'

// Radix Select needs these jsdom stubs to open its portal via userEvent.
beforeAll(() => {
  Element.prototype.hasPointerCapture = (): boolean => false
  Element.prototype.releasePointerCapture = (): void => undefined
  Element.prototype.scrollIntoView = (): void => undefined
})

function renderPage(): void {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <UserCreatePage />
    </QueryClientProvider>,
  )
}

// Fills every field validly, then applies overrides. Role defaults to viewer.
async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  overrides: Partial<{
    email: string
    username: string
    full_name: string
    clearance: string
  }> = {},
): Promise<void> {
  const values = {
    email: 'new.user@example.com',
    username: 'new_user',
    full_name: 'New User',
    clearance: '',
    ...overrides,
  }
  const email = screen.getByLabelText('Email')
  const username = screen.getByLabelText('Username')
  const fullName = screen.getByLabelText('Full Name')
  const clearance = screen.getByLabelText('Clearance level')

  await user.clear(email)
  if (values.email.length > 0) await user.type(email, values.email)
  await user.clear(username)
  if (values.username.length > 0) await user.type(username, values.username)
  await user.clear(fullName)
  if (values.full_name.length > 0) await user.type(fullName, values.full_name)
  await user.clear(clearance)
  if (values.clearance.length > 0) await user.type(clearance, values.clearance)
}

describe('UserCreatePage', () => {
  beforeEach(() => {
    createUserMock.mockReset()
    navigateMock.mockReset()
    vi.mocked(toast.success).mockReset()
    vi.mocked(toast.error).mockReset()
  })

  it('offers exactly admin, editor, viewer as role options (Pitfall 3)', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('combobox'))
    const options = await screen.findAllByRole('option')
    expect(options.map((o) => o.textContent)).toEqual(['Admin', 'Editor', 'Viewer'])
  })

  it('rejects an uppercase/short username client-side before any invoke', async () => {
    const user = userEvent.setup()
    renderPage()

    await fillForm(user, { username: 'AB' })
    await user.click(screen.getByRole('button', { name: 'Create user' }))

    await waitFor(() =>
      expect(screen.getByText('Username must be 3-50 lowercase characters')).toBeInTheDocument(),
    )
    expect(createUserMock).not.toHaveBeenCalled()
  })

  it('rejects a clearance outside 1-4 client-side before any invoke', async () => {
    const user = userEvent.setup()
    renderPage()

    await fillForm(user, { clearance: '5' })
    await user.click(screen.getByRole('button', { name: 'Create user' }))

    await waitFor(() =>
      expect(screen.getByText('Clearance must be an integer between 1 and 4')).toBeInTheDocument(),
    )
    expect(createUserMock).not.toHaveBeenCalled()
  })

  it('submits the full payload with user_type employee and navigates to /users on success', async () => {
    const user = userEvent.setup()
    createUserMock.mockResolvedValue({
      success: true,
      user_id: 'u-1',
      activation_sent: true,
      activation_expires_at: '2026-07-08T00:00:00Z',
    })
    renderPage()

    await fillForm(user, { clearance: '2' })
    await user.click(screen.getByRole('button', { name: 'Create user' }))

    await waitFor(() =>
      expect(createUserMock).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new.user@example.com',
          username: 'new_user',
          full_name: 'New User',
          role: 'viewer',
          clearance: 2,
          user_type: 'employee',
        }),
      ),
    )
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith({ to: '/users' }))
    expect(toast.success).toHaveBeenCalled()
  })

  it('maps DUPLICATE_EMAIL to a field-level error on email, not a generic toast', async () => {
    const user = userEvent.setup()
    createUserMock.mockRejectedValue({
      context: new Response(JSON.stringify({ code: 'DUPLICATE_EMAIL' }), { status: 400 }),
    })
    renderPage()

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Create user' }))

    await waitFor(() => expect(screen.getByText('Email already exists')).toBeInTheDocument())
    expect(createUserMock).toHaveBeenCalledTimes(1)
    expect(navigateMock).not.toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('maps DUPLICATE_USERNAME to a field-level error on username', async () => {
    const user = userEvent.setup()
    createUserMock.mockRejectedValue({
      context: new Response(JSON.stringify({ code: 'DUPLICATE_USERNAME' }), { status: 400 }),
    })
    renderPage()

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Create user' }))

    await waitFor(() => expect(screen.getByText('Username already exists')).toBeInTheDocument())
    expect(createUserMock).toHaveBeenCalledTimes(1)
    expect(navigateMock).not.toHaveBeenCalled()
  })
})
