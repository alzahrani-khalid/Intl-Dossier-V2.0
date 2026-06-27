import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders as render, screen } from '@tests/utils/render'
import userEvent from '@testing-library/user-event'
import { TriagePanel } from '@/components/triage-panel/TriagePanel'
import { useTriageSuggestions, useApplyTriage } from '@/hooks/useIntakeApi'

vi.mock('@/hooks/useIntakeApi', async () => ({
  ...(await vi.importActual<typeof import('@/hooks/useIntakeApi')>('@/hooks/useIntakeApi')),
  useTriageSuggestions: vi.fn(),
  useApplyTriage: vi.fn(),
}))
vi.mock('@/hooks/useDirection', async () => ({
  ...(await vi.importActual<typeof import('@/hooks/useDirection')>('@/hooks/useDirection')),
  useDirection: (): { isRTL: boolean } => ({ isRTL: false }),
}))

const mockUseTriageSuggestions = vi.mocked(useTriageSuggestions)
const mockUseApplyTriage = vi.mocked(useApplyTriage)

describe('TriagePanel', () => {
  const mutate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseApplyTriage.mockReturnValue({ mutate, isPending: false } as any)
  })

  describe('AI suggestions branch', () => {
    beforeEach(() => {
      mockUseTriageSuggestions.mockReturnValue({
        data: {
          sensitivity: 'confidential',
          urgency: 'high',
          suggestedUnit: 'Policy Unit',
          confidenceScores: { type: 0.9 },
          modelInfo: { name: 'gpt-4' },
        },
        isLoading: false,
        error: null,
      } as any)
    })

    it('renders the accept and override actions', () => {
      render(<TriagePanel ticketId="ticket-1" />)
      expect(screen.getByText('Accept AI Suggestions')).toBeInTheDocument()
      expect(screen.getByText('Override')).toBeInTheDocument()
    })

    it('accepting the suggestions calls applyTriage with action accept', async () => {
      const user = userEvent.setup()
      render(<TriagePanel ticketId="ticket-1" />)

      await user.click(screen.getByText('Accept AI Suggestions'))

      expect(mutate).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'accept' }),
        expect.anything(),
      )
    })
  })

  describe('manual-triage fallback (AI unavailable)', () => {
    beforeEach(() => {
      mockUseTriageSuggestions.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('AI service down'),
      } as any)
    })

    it('renders the manual triage form', () => {
      render(<TriagePanel ticketId="ticket-1" />)
      expect(screen.getByText('Manual Triage')).toBeInTheDocument()
      expect(screen.getByText('Apply Manual Triage')).toBeInTheDocument()
    })

    it('disables Apply Manual Triage until a reason is entered', () => {
      render(<TriagePanel ticketId="ticket-1" />)
      expect(screen.getByText('Apply Manual Triage')).toBeDisabled()
      expect(mutate).not.toHaveBeenCalled()
    })
  })
})
