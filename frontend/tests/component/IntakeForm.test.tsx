import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders as render, screen } from '@tests/utils/render'
import userEvent from '@testing-library/user-event'
import { IntakeForm } from '@/components/intake-form/IntakeForm'
import { useCreateTicket, useGetSLAPreview } from '@/hooks/useIntakeApi'

vi.mock('@/hooks/useIntakeApi', async () => ({
  ...(await vi.importActual<typeof import('@/hooks/useIntakeApi')>('@/hooks/useIntakeApi')),
  useCreateTicket: vi.fn(),
  useGetSLAPreview: vi.fn(),
}))
// Stub the heavy child components the form renders (relative imports resolve to these @ modules).
vi.mock('@/components/dossier', async () => ({
  ...(await vi.importActual<typeof import('@/components/dossier')>('@/components/dossier')),
  DossierSelector: (): React.JSX.Element => <div data-testid="dossier-selector" />,
  DossierContextBadge: (): null => null,
}))
vi.mock('@/components/type-specific-fields/TypeSpecificFields', async () => ({
  ...(await vi.importActual<typeof import('@/components/type-specific-fields/TypeSpecificFields')>(
    '@/components/type-specific-fields/TypeSpecificFields',
  )),
  TypeSpecificFields: (): React.JSX.Element => <div data-testid="type-specific-fields" />,
}))
vi.mock('@tanstack/react-router', async () => ({
  ...(await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router')),
  useNavigate: () => vi.fn(),
}))

const mockUseCreateTicket = vi.mocked(useCreateTicket)
const mockUseGetSLAPreview = vi.mocked(useGetSLAPreview)

describe('IntakeForm', () => {
  const mutateAsync = vi.fn().mockResolvedValue({ id: 'ticket-1', ticketNumber: 'TIX-001' })

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCreateTicket.mockReturnValue({ mutateAsync, isError: false, isPending: false } as any)
    mockUseGetSLAPreview.mockReturnValue({ data: undefined } as any)
  })

  it('renders the request-type and urgency selects and a submit button', () => {
    render(<IntakeForm />)

    // The two migrated Radix Select fields (requestType, urgency) render as comboboxes.
    expect(screen.getAllByRole('combobox').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
  })

  it('does not call createTicket when required fields are empty (zod blocks submit)', async () => {
    const user = userEvent.setup()
    render(<IntakeForm />)

    await user.click(screen.getByRole('button', { name: /submit/i }))

    expect(mutateAsync).not.toHaveBeenCalled()
  })
})
