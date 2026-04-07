import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FirstRunModal } from './FirstRunModal'

// --- Mocks ---------------------------------------------------------------

const rpcMock = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}))

const toastMock = {
  success: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
}
vi.mock('sonner', () => ({
  toast: {
    success: (...a: unknown[]) => toastMock.success(...a),
    info: (...a: unknown[]) => toastMock.info(...a),
    error: (...a: unknown[]) => toastMock.error(...a),
  },
}))

vi.mock('@/hooks/useDirection', () => ({
  useDirection: (): { isRTL: boolean; direction: 'ltr' | 'rtl' } => ({
    isRTL: false,
    direction: 'ltr',
  }),
}))

// `react-i18next` is mocked globally in tests/setup.ts and returns
// `t: (key) => key`, so we can assert on key strings rather than translated copy.

// --- Helpers -------------------------------------------------------------

interface RenderResult {
  onOpenChange: ReturnType<typeof vi.fn>
  queryClient: QueryClient
}

const renderModal = (props: { canSeed: boolean; open?: boolean }): RenderResult => {
  const onOpenChange = vi.fn()
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <FirstRunModal
        open={props.open ?? true}
        onOpenChange={onOpenChange}
        canSeed={props.canSeed}
      />
    </QueryClientProvider>,
  )
  return { onOpenChange, queryClient }
}

// --- Tests ---------------------------------------------------------------

describe('FirstRunModal', () => {
  beforeEach(() => {
    rpcMock.mockReset()
    toastMock.success.mockReset()
    toastMock.info.mockReset()
    toastMock.error.mockReset()
  })

  it('renders admin variant with Populate and Skip buttons', () => {
    renderModal({ canSeed: true })
    expect(screen.getByTestId('first-run-populate')).toBeTruthy()
    expect(screen.getByTestId('first-run-skip')).toBeTruthy()
    expect(screen.queryByTestId('first-run-close')).toBeNull()
  })

  it('renders non-admin variant with Close only — no Populate button', () => {
    renderModal({ canSeed: false })
    expect(screen.queryByTestId('first-run-populate')).toBeNull()
    expect(screen.queryByTestId('first-run-skip')).toBeNull()
    expect(screen.getByTestId('first-run-close')).toBeTruthy()
  })

  it('happy path: seeds, invalidates canonical query keys, shows success toast, closes modal', async () => {
    rpcMock.mockResolvedValueOnce({
      data: {
        status: 'seeded',
        counts: { dossiers: 62, tasks: 50, persons: 12, countries: 10 },
      },
      error: null,
    })

    const { onOpenChange, queryClient } = renderModal({ canSeed: true })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    await userEvent.click(screen.getByTestId('first-run-populate'))

    await waitFor((): void => {
      expect(rpcMock).toHaveBeenCalledWith('populate_diplomatic_seed')
      expect(toastMock.success).toHaveBeenCalled()
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    // Asserts canonical 'tasks' key (NOT 'work-items') and other broad prefixes
    const invalidatedKeys = invalidateSpy.mock.calls.map(
      (c): unknown => (c[0] as { queryKey: unknown[] }).queryKey[0],
    )
    expect(invalidatedKeys).toContain('tasks')
    expect(invalidatedKeys).toContain('dossiers')
    expect(invalidatedKeys).toContain('persons')
    expect(invalidatedKeys).toContain('countries')
    expect(invalidatedKeys).toContain('organizations')
    expect(invalidatedKeys).toContain('forums')
    expect(invalidatedKeys).toContain('engagements')
    expect(invalidatedKeys).toContain('dashboard-success-metrics')
    expect(invalidatedKeys).not.toContain('work-items')

    // Success toast was called with the success title key
    expect(toastMock.success.mock.calls[0][0]).toBe('firstRun.successTitle')
  })

  it('already_seeded: shows info toast and closes modal', async () => {
    rpcMock.mockResolvedValueOnce({ data: { status: 'already_seeded' }, error: null })
    const { onOpenChange } = renderModal({ canSeed: true })

    await userEvent.click(screen.getByTestId('first-run-populate'))

    await waitFor((): void => {
      expect(toastMock.info).toHaveBeenCalled()
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
    expect(toastMock.success).not.toHaveBeenCalled()
  })

  it('forbidden: shows error toast and modal stays open', async () => {
    rpcMock.mockResolvedValueOnce({
      data: { status: 'forbidden', reason: 'not_admin' },
      error: null,
    })
    const { onOpenChange } = renderModal({ canSeed: true })

    await userEvent.click(screen.getByTestId('first-run-populate'))

    await waitFor((): void => {
      expect(toastMock.error).toHaveBeenCalled()
    })
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it('rpc error: shows generic error toast', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: 'boom' } })
    renderModal({ canSeed: true })

    await userEvent.click(screen.getByTestId('first-run-populate'))

    await waitFor((): void => {
      expect(toastMock.error).toHaveBeenCalled()
    })
  })
})
