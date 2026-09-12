// WRITE-01 / RULING-P94-06 B6 — the wiring oracle for the engagement after-action route.
//
// WHAT THIS KILLS. Before 94-01 the engagement route never passed `canPublish`/`onPublish`, so
// Publish did not render at all, and criterion 1's "published" clause had no oracle that could
// fail. `scripts/probe-after-action-publish.mjs` closes the SERVER half (create -> publish ->
// read back). It never executes the two-step wiring in the route, which is the only code Task 2
// writes. This file is that half.
//
// WHY MOCKING THE HOOKS STILL LEAVES A REAL ORACLE (RULING-P94-07). C9b decides mock-vs-real by
// the SUBJECT. The subject here IS the route's create-then-publish closure; `useCreateAfterAction`
// and `usePublishAfterAction` are its boundary, so mocking them mocks the boundary, not the
// subject. The router, auth and supabase mocks are likewise environment. `AfterActionForm` is
// deliberately REAL — the Publish button only renders when `canPublish && onPublish` actually
// reach it, so "press Publish" is a genuine reachability assertion, not a stub click.
//
// WHY THIS FILE UNMOCKS react-i18next. `tests/setup.ts:131` mocks `useTranslation` globally with a
// hardcoded key->string map, so under the default harness EVERY assertion about rendered copy
// measures that map, not `src/i18n`. D-10's defect class — a t() call addressed at the wrong
// namespace renders the raw key — is invisible to a mocked t by construction. Unmocking here
// makes `t('common:afterActions.publishFailed')` resolve against the real bundle, so this file can
// assert the repaired call actually RESOLVES. Consequence: queries below use the real EN values
// (`afterActions.form.attendeesPlaceholder` is "Type a name and press Enter"), which differ from
// the setup map's stale copy.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders as render, screen, waitFor } from '@tests/utils/render'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'

vi.unmock('react-i18next')

const h = vi.hoisted(() => ({
  createMutateAsync: vi.fn(),
  publishMutateAsync: vi.fn(),
  navigate: vi.fn(),
  role: { current: 'staff' as string | undefined },
}))

// --- environment boundaries -------------------------------------------------

// The ONLY full mock here, and it cannot spread vi.importActual: `src/lib/supabase.ts` THROWS at
// module evaluation when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are unset, which they are
// under vitest. A stable chain object (not one per call), per the test-setup.md checklist.
vi.mock('@/lib/supabase', () => {
  const result = Promise.resolve({ data: [], error: null })
  const chain = {
    select: () => chain,
    eq: () => chain,
    order: () => chain,
    limit: () => result,
  }
  return { supabase: { from: () => chain } }
})

vi.mock('@tanstack/react-router', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router')
  return {
    ...actual,
    createFileRoute: () => (options: Record<string, unknown>) => ({
      ...options,
      useParams: () => ({ engagementId: 'eng-1' }),
    }),
    useNavigate: () => h.navigate,
    Link: ({ children }: { children: React.ReactNode }) => <a href="#link">{children}</a>,
  }
})

vi.mock('sonner', async () => ({
  ...(await vi.importActual<typeof import('sonner')>('sonner')),
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}))

vi.mock('@/hooks/useAuth', async () => ({
  ...(await vi.importActual<typeof import('@/hooks/useAuth')>('@/hooks/useAuth')),
  useAuth: () => ({ user: { id: 'user-1', role: h.role.current } }),
}))

vi.mock('@/hooks/useEngagement', async () => ({
  ...(await vi.importActual<typeof import('@/hooks/useEngagement')>('@/hooks/useEngagement')),
  useEngagement: () => ({
    data: {
      id: 'eng-1',
      dossier_id: 'dos-1',
      name_en: 'Bilateral consultation',
      name_ar: 'مشاورة ثنائية',
    },
    isLoading: false,
  }),
}))

// --- the subject's boundary: the two mutation hooks -------------------------

vi.mock('@/hooks/useAfterAction', async () => ({
  ...(await vi.importActual<typeof import('@/hooks/useAfterAction')>('@/hooks/useAfterAction')),
  useCreateAfterAction: () => ({ mutateAsync: h.createMutateAsync }),
}))

vi.mock('@/hooks/usePublishAfterAction', async () => ({
  ...(await vi.importActual<typeof import('@/hooks/usePublishAfterAction')>(
    '@/hooks/usePublishAfterAction',
  )),
  usePublishAfterAction: () => ({ mutateAsync: h.publishMutateAsync }),
}))

// The ONLY leaf stub: `isFormValid()` needs >=1 decision/commitment/risk/follow-up, and driving
// the real DecisionList through its own form would test that component, not this wiring. Every
// other child of AfterActionForm renders for real.
vi.mock('@/components/decision-list/DecisionList', async () => ({
  ...(await vi.importActual<typeof import('@/components/decision-list/DecisionList')>(
    '@/components/decision-list/DecisionList',
  )),
  DecisionList: ({ decisions, onChange }: any) => (
    <button type="button" onClick={() => onChange([...decisions, { description: 'A decision' }])}>
      Add Decision
    </button>
  ),
}))

import { Route } from '@/routes/_protected/engagements/$engagementId/after-action'

const AfterActionRoutePage = (Route as unknown as { component: () => React.ReactNode }).component

/** Drive the real form to `isFormValid()`: >=1 attendee AND >=1 decision. */
const fillValidForm = async (user: ReturnType<typeof userEvent.setup>): Promise<void> => {
  await user.type(screen.getByPlaceholderText('Type a name and press Enter'), 'John Doe{Enter}')
  await user.click(screen.getByText('Add Decision'))
}

const clickPublish = async (user: ReturnType<typeof userEvent.setup>): Promise<void> => {
  const publishButton = screen.getByRole('button', { name: /^publish$/i })
  await waitFor(() => {
    expect(publishButton).not.toBeDisabled()
  })
  await user.click(publishButton)
}

describe('engagement after-action route wiring (WRITE-01)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    h.role.current = 'staff'
    h.createMutateAsync.mockResolvedValue({
      id: 'aa-created-999',
      engagement_id: 'eng-1',
      dossier_id: 'dos-1',
    })
    h.publishMutateAsync.mockResolvedValue({ id: 'aa-created-999' })
  })

  it('publishes in two steps and hands publish the id CREATE returned', async () => {
    const user = userEvent.setup()
    render(<AfterActionRoutePage />)

    await fillValidForm(user)
    await clickPublish(user)

    await waitFor(() => {
      expect(h.publishMutateAsync).toHaveBeenCalledTimes(1)
    })
    expect(h.createMutateAsync).toHaveBeenCalledTimes(1)
    // The id is the one CREATE returned — not the engagement id, not a route param.
    expect(h.publishMutateAsync).toHaveBeenCalledWith({
      afterActionId: 'aa-created-999',
      isConfidential: false,
    })
  })

  it('never publishes when the create step fails, and leaks no server message', async () => {
    const user = userEvent.setup()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    h.createMutateAsync.mockRejectedValue(new Error('duplicate key value violates unique bang'))

    render(<AfterActionRoutePage />)
    await fillValidForm(user)
    await clickPublish(user)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledTimes(1)
    })
    expect(h.createMutateAsync).toHaveBeenCalledTimes(1)
    expect(h.publishMutateAsync).not.toHaveBeenCalled()
    // D-08 + D-10, asserted on the resolved string: the colon-form key must RESOLVE (the dot form
    // would leak `afterActions.publishFailed` verbatim), and the server's message must not appear.
    expect(toast.error).toHaveBeenCalledWith('Failed to publish after action')
    expect(String(vi.mocked(toast.error).mock.calls[0]?.[0])).not.toContain('duplicate key')
    // The raw error is diagnostics — console only.
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('renders no Publish button for a role the server would reject', () => {
    h.role.current = 'viewer'
    render(<AfterActionRoutePage />)

    expect(screen.getByRole('button', { name: /save draft/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^publish$/i })).not.toBeInTheDocument()
  })
})
