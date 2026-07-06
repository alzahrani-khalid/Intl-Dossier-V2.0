import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fireEvent } from '@testing-library/react'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// =============================================================================
// EN copy the dialog renders. The `t` mock supports colon- and dot-form keys,
// returning the mapped string, else the defaultValue, else the key itself
// (a raw-key leak surfaces as a failed assertion).
// =============================================================================
const enCopy: Record<string, string> = {
  'mous.form.dialogTitle': 'New MoU',
  'mous.form.dialogDescription': 'Record a memorandum of understanding between two parties.',
  'mous.form.title': 'Title (English)',
  'mous.form.titleAr': 'Title (Arabic)',
  'mous.form.type': 'Type',
  'mous.form.category': 'Category',
  'mous.form.lifecycleState': 'Lifecycle state',
  'mous.form.signatory1': 'First signatory',
  'mous.form.signatory2': 'Second signatory',
  'mous.form.effectiveDate': 'Effective date',
  'mous.form.expiryDate': 'Expiry date',
  'mous.form.description': 'Description',
  'mous.form.cancel': 'Cancel',
  'mous.form.submit': 'Create MoU',
  'mous.form.toastSuccess': 'MoU created',
  'mous.form.toastError': 'Failed to create MoU. Try again.',
  'mous.form.errors.titleRequired': 'English title is required',
  'mous.form.errors.titleArRequired': 'Arabic title is required',
  'mous.form.errors.signatoriesMustDiffer': 'The two signatories must be different',
  'mous.form.errors.expiryAfterEffective': 'Expiry date must be after the effective date',
  'mous.form.types.bilateral': 'Bilateral',
  'mous.form.types.multilateral': 'Multilateral',
  'mous.form.types.framework': 'Framework',
  'mous.form.types.technical': 'Technical',
  'mous.form.categories.data_exchange': 'Data exchange',
  'mous.form.categories.capacity_building': 'Capacity building',
  'mous.form.categories.strategic': 'Strategic',
  'mous.form.categories.technical': 'Technical',
  'mous.statuses.draft': 'Draft',
  'mous.statuses.negotiation': 'Negotiation',
  'mous.statuses.pending_approval': 'Pending approval',
  'mous.statuses.signed': 'Signed',
  'mous.statuses.active': 'Active',
  'mous.statuses.suspended': 'Suspended',
  'mous.statuses.expired': 'Expired',
  'mous.statuses.terminated': 'Terminated',
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

// Two distinct signatory dossiers (valid v4 uuids so the schema's .uuid() passes).
const DOSSIER_A = {
  id: '11111111-1111-4111-8111-111111111111',
  name_en: 'Country A',
  name_ar: 'الدولة أ',
  type: 'country' as const,
  status: 'active',
}
const DOSSIER_B = {
  id: '22222222-2222-4222-8222-222222222222',
  name_en: 'Country B',
  name_ar: 'الدولة ب',
  type: 'organization' as const,
  status: 'active',
}

// The DossierPicker mock keys its emitted dossier off the `placeholder` prop
// (the dialog passes the signatory label as placeholder). Tests mutate this map
// to force the same-dossier case.
const { pickReturns } = vi.hoisted(() => ({
  pickReturns: {} as Record<string, unknown>,
}))

vi.mock('@/components/work-creation/DossierPicker', () => ({
  DossierPicker: ({
    onChange,
    placeholder,
  }: {
    onChange?: (id: string | null, dossier?: unknown) => void
    placeholder?: string
  }): ReactNode => (
    <button
      type="button"
      onClick={() => {
        const d = pickReturns[placeholder ?? ''] as { id: string } | undefined
        if (d) onChange?.(d.id, d)
      }}
    >
      {`pick-${placeholder ?? ''}`}
    </button>
  ),
}))

const createMock = vi.fn()
vi.mock('@/domains/mous', () => ({
  useCreateMou: (): { mutateAsync: typeof createMock; isPending: boolean } => ({
    mutateAsync: createMock,
    isPending: false,
  }),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import { CreateMouDialog } from '../CreateMouDialog'
import { toast } from 'sonner'

const baseProps = {
  isOpen: true,
  onClose: vi.fn(),
  isRTL: false,
}

function renderDialog(): void {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <CreateMouDialog {...baseProps} />
    </QueryClientProvider>,
  )
}

describe('CreateMouDialog', () => {
  beforeEach(() => {
    createMock.mockReset()
    baseProps.onClose = vi.fn()
    vi.mocked(toast.success).mockReset()
    vi.mocked(toast.error).mockReset()
    pickReturns['First signatory'] = DOSSIER_A
    pickReturns['Second signatory'] = DOSSIER_B
  })

  it('renders every field (titles, type/category/lifecycle selects, two pickers, dates, description)', () => {
    renderDialog()

    expect(screen.getByText('Title (English)')).toBeInTheDocument()
    expect(screen.getByText('Title (Arabic)')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expect(screen.getByText('Category')).toBeInTheDocument()
    expect(screen.getByText('Lifecycle state')).toBeInTheDocument()
    expect(screen.getByText('First signatory')).toBeInTheDocument()
    expect(screen.getByText('Second signatory')).toBeInTheDocument()
    expect(screen.getByText('Effective date')).toBeInTheDocument()
    expect(screen.getByText('Expiry date')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()

    // Two signatory pickers present.
    expect(screen.getByRole('button', { name: 'pick-First signatory' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'pick-Second signatory' })).toBeInTheDocument()

    // Lifecycle defaults to draft (trigger shows the Draft label; Radix also
    // mirrors it into a hidden native <option>, so allow more than one match).
    expect(screen.getAllByText('Draft').length).toBeGreaterThan(0)
  })

  it('blocks submit and surfaces the Arabic-title-required error when title_ar is empty', async () => {
    const user = userEvent.setup()
    renderDialog()

    const submit = screen.getByRole('button', { name: 'Create MoU' })
    expect(submit).toBeDisabled()

    await user.type(screen.getByLabelText('Title (English)', { exact: false }), 'Data MoU')

    // Touch and leave title_ar empty to surface the localized error.
    const titleAr = screen.getByLabelText('Title (Arabic)', { exact: false })
    await user.click(titleAr)
    await user.tab()

    expect(await screen.findByText('Arabic title is required')).toBeInTheDocument()
    expect(submit).toBeDisabled()
  })

  it('surfaces signatoriesMustDiffer when both signatories are the same dossier', async () => {
    const user = userEvent.setup()
    pickReturns['Second signatory'] = DOSSIER_A // same as first
    renderDialog()

    await user.click(screen.getByRole('button', { name: 'pick-First signatory' }))
    await user.click(screen.getByRole('button', { name: 'pick-Second signatory' }))

    expect(await screen.findByText('The two signatories must be different')).toBeInTheDocument()
  })

  it('surfaces expiryAfterEffective when expiry precedes effective', async () => {
    renderDialog()

    const effective = screen.getByLabelText('Effective date', { exact: false })
    const expiry = screen.getByLabelText('Expiry date', { exact: false })

    fireEvent.change(effective, { target: { value: '2026-06-10' } })
    fireEvent.change(expiry, { target: { value: '2026-01-10' } })
    fireEvent.blur(expiry)

    expect(
      await screen.findByText('Expiry date must be after the effective date'),
    ).toBeInTheDocument()
  })

  it('derives parties from the two selected dossiers on submit (Pitfall-2 guard)', async () => {
    const user = userEvent.setup()
    createMock.mockResolvedValue({ id: 'mou-1' })
    renderDialog()

    await user.type(screen.getByLabelText('Title (English)', { exact: false }), 'Data MoU')
    await user.type(screen.getByLabelText('Title (Arabic)', { exact: false }), 'مذكرة بيانات')
    await user.click(screen.getByRole('button', { name: 'pick-First signatory' }))
    await user.click(screen.getByRole('button', { name: 'pick-Second signatory' }))

    const submit = screen.getByRole('button', { name: 'Create MoU' })
    await waitFor(() => expect(submit).toBeEnabled())
    await user.click(submit)

    await waitFor(() =>
      expect(createMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Data MoU',
          title_ar: 'مذكرة بيانات',
          type: 'bilateral',
          mou_category: 'data_exchange',
          lifecycle_state: 'draft',
          parties: [
            { name_en: 'Country A', name_ar: 'الدولة أ' },
            { name_en: 'Country B', name_ar: 'الدولة ب' },
          ],
        }),
      ),
    )
    await waitFor(() => expect(toast.success).toHaveBeenCalled())
  })

  it('keeps the dialog open with input intact and shows the error toast on rejection', async () => {
    const user = userEvent.setup()
    createMock.mockRejectedValue(new Error('boom'))
    renderDialog()

    const titleEn = screen.getByLabelText('Title (English)', { exact: false }) as HTMLInputElement
    await user.type(titleEn, 'Data MoU')
    await user.type(screen.getByLabelText('Title (Arabic)', { exact: false }), 'مذكرة بيانات')

    const submit = screen.getByRole('button', { name: 'Create MoU' })
    await waitFor(() => expect(submit).toBeEnabled())
    await user.click(submit)

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1))
    expect(toast.success).not.toHaveBeenCalled()
    expect(baseProps.onClose).not.toHaveBeenCalled()
    expect(titleEn.value).toBe('Data MoU')
  })
})
