import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders as render, screen, waitFor } from '@tests/utils/render'
import userEvent from '@testing-library/user-event'
import { IntakeForm } from '@/components/intake-form/IntakeForm'
import { useCreateTicket, useGetSLAPreview } from '@/hooks/useIntakeApi'

// OECD's live staging dossier id. Its version nibble is 0, so it is NOT an RFC-9562
// UUID — 35 of 44 staging dossiers are seeded this way. Zod 4's `.uuid()` enforces the
// version/variant bits and rejects it, which is what blocked /intake/new (WRITE-03).
const { NON_RFC_DOSSIER_ID } = vi.hoisted(() => ({
  NON_RFC_DOSSIER_ID: 'b0000001-0000-0000-0000-000000000005',
}))

vi.mock('@/hooks/useIntakeApi', async () => ({
  ...(await vi.importActual<typeof import('@/hooks/useIntakeApi')>('@/hooks/useIntakeApi')),
  useCreateTicket: vi.fn(),
  useGetSLAPreview: vi.fn(),
}))
// Stub the heavy child components the form renders (relative imports resolve to these @ modules).
// The selector stub keeps the REAL onChange wiring reachable: it surfaces the validation error
// the form hands it, and picking drives the form's own handleDossierChange.
vi.mock('@/components/dossier', async () => ({
  ...(await vi.importActual<typeof import('@/components/dossier')>('@/components/dossier')),
  DossierSelector: ({
    onChange,
    error,
  }: {
    onChange: (ids: string[], dossiers: unknown[]) => void
    error?: string
  }): React.JSX.Element => (
    <div data-testid="dossier-selector">
      <span data-testid="dossier-error">{error ?? ''}</span>
      <button
        type="button"
        onClick={() =>
          onChange(
            [NON_RFC_DOSSIER_ID],
            [
              {
                id: NON_RFC_DOSSIER_ID,
                name_en: 'OECD',
                name_ar: 'منظمة التعاون الاقتصادي والتنمية',
                type: 'organization',
              },
            ],
          )
        }
      >
        pick dossier
      </button>
    </div>
  ),
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

  it('accepts a non-RFC-9562 staging dossier id and submits (real zod schema)', async () => {
    const user = userEvent.setup()
    const { container } = render(<IntakeForm />)
    const field = (id: string): HTMLElement => container.querySelector(`#${id}`) as HTMLElement

    await user.type(field('title'), 'Bilateral consultation request')
    await user.type(field('titleAr'), 'طلب مشاورات ثنائية')
    await user.type(field('description'), 'Requesting a bilateral consultation with the OECD.')
    await user.type(field('descriptionAr'), 'طلب عقد مشاورات ثنائية مع منظمة التعاون.')
    await user.click(screen.getByRole('button', { name: /pick dossier/i }))

    await user.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ dossierId: NON_RFC_DOSSIER_ID }),
      ),
    )
  })

  it('clears the dossier validation error as soon as a dossier is picked', async () => {
    const user = userEvent.setup()
    render(<IntakeForm />)

    // A failed submit renders the required-dossier message on the selector.
    await user.click(screen.getByRole('button', { name: /submit/i }))
    await waitFor(() => expect(screen.getByTestId('dossier-error')).not.toBeEmptyDOMElement())

    // Picking clears it without a second submit — "Linked to: OECD" and "At least one
    // dossier is required" must never be able to render together.
    await user.click(screen.getByRole('button', { name: /pick dossier/i }))
    await waitFor(() => expect(screen.getByTestId('dossier-error')).toBeEmptyDOMElement())
  })
})
