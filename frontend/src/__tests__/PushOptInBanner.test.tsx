import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PushOptInBanner from '@/components/notifications/PushOptInBanner'

// Mock usePushSubscription
const mockSubscribe = vi.fn()
const mockUnsubscribe = vi.fn()
const mockPushState = {
  isSupported: true,
  permission: 'default' as NotificationPermission | null,
  isSubscribed: false,
  subscribe: mockSubscribe,
  unsubscribe: mockUnsubscribe,
  isLoading: false,
}

vi.mock('@/hooks/usePushSubscription', () => ({
  usePushSubscription: (): typeof mockPushState => mockPushState,
}))

// Mock useDirection
vi.mock('@/hooks/useDirection', () => ({
  useDirection: (): { direction: 'ltr' | 'rtl'; isRTL: boolean } => ({
    direction: 'ltr',
    isRTL: false,
  }),
}))

// Mock useToast
const mockToast = vi.fn()
vi.mock('@/hooks/useToast', () => ({
  useToast: (): { toast: typeof mockToast } => ({ toast: mockToast }),
}))

// Mock supabase
const mockMaybeSingle = vi.fn()
const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockUpsert = vi.fn().mockResolvedValue({ error: null })

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
      }),
    },
    from: vi.fn((table: string) => {
      if (table === 'user_preferences') {
        return {
          select: mockSelect,
          upsert: mockUpsert,
        }
      }
      return {}
    }),
  },
}))

describe('PushOptInBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset push state to defaults
    mockPushState.isSupported = true
    mockPushState.permission = 'default'
    mockPushState.isSubscribed = false
    mockPushState.isLoading = false
    // Default: not dismissed
    mockMaybeSingle.mockResolvedValue({
      data: { push_prompt_dismissed_at: null },
      error: null,
    })
    mockSubscribe.mockResolvedValue(true)
  })

  it('does NOT render when hasActionableNotification is false', async () => {
    render(<PushOptInBanner hasActionableNotification={false} />)

    await waitFor(() => {
      expect(screen.queryByTestId('push-opt-in-banner')).toBeNull()
    })
  })

  it('does NOT render when permission is granted', async () => {
    mockPushState.permission = 'granted'

    render(<PushOptInBanner hasActionableNotification={true} />)

    await waitFor(() => {
      expect(screen.queryByTestId('push-opt-in-banner')).toBeNull()
    })
  })

  it('does NOT render when push_prompt_dismissed_at is set', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { push_prompt_dismissed_at: '2026-04-01T00:00:00Z' },
      error: null,
    })

    render(<PushOptInBanner hasActionableNotification={true} />)

    await waitFor(() => {
      expect(screen.queryByTestId('push-opt-in-banner')).toBeNull()
    })
  })

  it('renders when all visibility conditions are met', async () => {
    render(<PushOptInBanner hasActionableNotification={true} />)

    await waitFor(() => {
      expect(screen.getByTestId('push-opt-in-banner')).toBeTruthy()
    })

    expect(screen.getByTestId('push-enable-btn')).toBeTruthy()
    expect(screen.getByTestId('push-dismiss-btn')).toBeTruthy()
  })

  it('has correct accessibility attributes', async () => {
    render(<PushOptInBanner hasActionableNotification={true} />)

    await waitFor(() => {
      const banner = screen.getByTestId('push-opt-in-banner')
      expect(banner.getAttribute('role')).toBe('alert')
      expect(banner.getAttribute('aria-live')).toBe('polite')
    })
  })

  it('calls subscribe when enable button is clicked', async () => {
    const user = userEvent.setup()

    render(<PushOptInBanner hasActionableNotification={true} />)

    await waitFor(() => {
      expect(screen.getByTestId('push-enable-btn')).toBeTruthy()
    })

    await user.click(screen.getByTestId('push-enable-btn'))

    expect(mockSubscribe).toHaveBeenCalledOnce()
  })

  it('persists dismissal when dismiss button is clicked', async () => {
    const user = userEvent.setup()

    render(<PushOptInBanner hasActionableNotification={true} />)

    await waitFor(() => {
      expect(screen.getByTestId('push-dismiss-btn')).toBeTruthy()
    })

    await user.click(screen.getByTestId('push-dismiss-btn'))

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'test-user-id',
        push_prompt_dismissed_at: expect.any(String),
      }),
      expect.objectContaining({ onConflict: 'user_id' }),
    )
  })

  it('does NOT render when browser does not support push', async () => {
    mockPushState.isSupported = false

    render(<PushOptInBanner hasActionableNotification={true} />)

    await waitFor(() => {
      expect(screen.queryByTestId('push-opt-in-banner')).toBeNull()
    })
  })

  it('does NOT render when already subscribed', async () => {
    mockPushState.isSubscribed = true

    render(<PushOptInBanner hasActionableNotification={true} />)

    await waitFor(() => {
      expect(screen.queryByTestId('push-opt-in-banner')).toBeNull()
    })
  })
})
