import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// =============================================================================
// Mutable test state — each test sets these in beforeEach / per-case.
// =============================================================================
let mockLanguage = 'en'

// EN copy the dialog renders. The `t` mock supports both colon-form keys
// (e.g. 'positions:create_dialog.type_label') and bare keys, returning the
// mapped string, else the defaultValue, else the key itself.
const enCopy: Record<string, string> = {
  'dossier:addToDossier.dialogs.position.title': 'New Position',
  'dossier:addToDossier.dialogs.position.description': 'Add a new position to this dossier',
  'dossier:addToDossier.form.submit.position': 'Create position',
  'dossier:action.cancel': 'Cancel',
  'dossier:addToDossier.context.linkedTo': 'Will be linked to',
  'dossier:addToDossier.context.direct': 'Direct',
  'addToDossier.context.linkedTo': 'Will be linked to',
  'addToDossier.context.direct': 'Direct',
  'positions:create_dialog.type_label': 'Position type',
  'positions:create_dialog.title_en_label': 'Title (English)',
  'positions:create_dialog.title_ar_label': 'Title (Arabic)',
  'positions:create_dialog.content_en_label': 'Content (English) — optional',
  'positions:create_dialog.content_ar_label': 'Content (Arabic) — optional',
  'positions:create_dialog.audience_legend': 'Audience groups',
  'positions:create_dialog.translate_to_ar': 'Translate to Arabic',
  'positions:create_dialog.translate_to_en': 'Translate to English',
  'positions:create_dialog.translating': 'Translating…',
  'positions:create_dialog.translate_unavailable':
    'Translation unavailable. Enter the text manually.',
  'positions:create_dialog.toast_success': 'Position created',
  'positions:create_dialog.toast_open_position': 'Open position',
  'positions:create_dialog.toast_partial_failure':
    'Position created, but linking to this dossier failed.',
  'positions:create_dialog.toast_retry_link': 'Retry link',
  'positions:create_dialog.toast_error': 'Failed to create position. Try again.',
  'positions:create_dialog.lookup_error':
    "Couldn't load form options. Close the dialog and try again.",
  'positions:validation.type_required': 'Select a position type',
  'positions:validation.title_en_required': 'English title is required',
  'positions:validation.title_ar_required': 'Arabic title is required',
  'positions:validation.title_max_length': 'Title must be 200 characters or less',
  'positions:validation.audience_required': 'Select at least one audience group',
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
    i18n: { language: mockLanguage },
  }),
  Trans: ({ children }: { children: ReactNode }): ReactNode => children,
}))

// Lookup hooks — staging-shaped rows. Two position types, four audience groups.
const STANDARD_TYPE_ID = 'type-standard'
const CRITICAL_TYPE_ID = 'type-critical'
const ALL_STAFF_ID = 'aud-all-staff'
const MANAGEMENT_ID = 'aud-management'
const POLICY_ID = 'aud-policy'
const EXTERNAL_ID = 'aud-external'

vi.mock('@/domains/positions/hooks/usePositionTypes', () => ({
  usePositionTypes: (): {
    data: { id: string; name_en: string; name_ar: string; approval_stages: number }[]
    isLoading: boolean
    error: Error | null
  } => ({
    data: [
      {
        id: CRITICAL_TYPE_ID,
        name_en: 'Critical Position',
        name_ar: 'موقف حرج',
        approval_stages: 3,
      },
      {
        id: STANDARD_TYPE_ID,
        name_en: 'Standard Position',
        name_ar: 'موقف قياسي',
        approval_stages: 1,
      },
    ],
    isLoading: false,
    error: null,
  }),
}))

vi.mock('@/domains/positions/hooks/useAudienceGroups', () => ({
  useAudienceGroups: (): {
    data: { id: string; name_en: string; name_ar: string }[]
    isLoading: boolean
    error: Error | null
  } => ({
    data: [
      { id: ALL_STAFF_ID, name_en: 'All Staff', name_ar: 'جميع الموظفين' },
      { id: EXTERNAL_ID, name_en: 'External Relations', name_ar: 'العلاقات الخارجية' },
      { id: MANAGEMENT_ID, name_en: 'Management', name_ar: 'الإدارة' },
      { id: POLICY_ID, name_en: 'Policy Officers', name_ar: 'مسؤولو السياسات' },
    ],
    isLoading: false,
    error: null,
  }),
}))

const createMock = vi.fn()
vi.mock('@/domains/positions/hooks/useCreatePosition', () => ({
  useCreatePosition: (): { mutateAsync: typeof createMock; isPending: boolean } => ({
    mutateAsync: createMock,
    isPending: false,
  }),
}))

const linkMock = vi.fn()
const translateMock = vi.fn()
vi.mock('@/domains/positions/repositories/positions.repository', () => ({
  createPositionDossierLink: linkMock,
  translateContent: translateMock,
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}))

const navigateMock = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: (): typeof navigateMock => navigateMock,
}))

import { NewPositionDialog } from '../NewPositionDialog'
import { toast } from 'sonner'

const baseProps = {
  isOpen: true,
  onClose: vi.fn(),
  dossierContext: {
    dossier_id: 'd-1',
    dossier_type: 'country' as const,
    dossier_name_en: 'Saudi Arabia',
    dossier_name_ar: 'السعودية',
    inheritance_source: 'direct' as const,
  },
  isRTL: false,
}

function renderDialog(): { queryClient: QueryClient } {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <NewPositionDialog {...baseProps} />
    </QueryClientProvider>,
  )
  return { queryClient }
}

describe('NewPositionDialog', () => {
  beforeEach(() => {
    mockLanguage = 'en'
    createMock.mockReset()
    linkMock.mockReset()
    translateMock.mockReset()
    navigateMock.mockReset()
    baseProps.onClose = vi.fn()
    vi.mocked(toast.success).mockReset()
    vi.mocked(toast.warning).mockReset()
    vi.mocked(toast.error).mockReset()
  })

  it('disables submit until type, both titles, and at least one audience group are valid (POSNEW-01, D-04)', async () => {
    const user = userEvent.setup()
    renderDialog()

    const submit = screen.getByRole('button', { name: 'Create position' })
    expect(submit).toBeDisabled()

    // Defaults supply type (Standard) + audience (All Staff); only titles are missing.
    const titleEn = screen.getByLabelText('Title (English)', { exact: false })
    const titleAr = screen.getByLabelText('Title (Arabic)', { exact: false })

    await user.type(titleEn, 'Our position')
    await user.type(titleAr, 'موقفنا')

    await waitFor(() => expect(submit).toBeEnabled())

    // Clearing title_ar disables submit again.
    await user.clear(titleAr)
    await waitFor(() => expect(submit).toBeDisabled())
  })

  it('preselects Standard Position and pre-checks All Staff by name-match (POSNEW-01, D-05/D-06)', async () => {
    renderDialog()

    // Type control shows Standard Position (name-match default, not a hard-coded UUID).
    await waitFor(() => expect(screen.getByText('Standard Position')).toBeInTheDocument())

    // All Staff is checked; the other three are unchecked.
    const allStaff = screen.getByRole('checkbox', { name: 'All Staff' })
    const management = screen.getByRole('checkbox', { name: 'Management' })
    const policy = screen.getByRole('checkbox', { name: 'Policy Officers' })
    const external = screen.getByRole('checkbox', { name: 'External Relations' })

    expect(allStaff).toBeChecked()
    expect(management).not.toBeChecked()
    expect(policy).not.toBeChecked()
    expect(external).not.toBeChecked()
  })

  it('translate failure leaves the target field untouched and never blocks submission (POSNEW-01, D-07)', async () => {
    const user = userEvent.setup()
    translateMock.mockRejectedValue(new Error('503 Service Unavailable'))
    renderDialog()

    const titleEn = screen.getByLabelText('Title (English)', { exact: false })
    await user.type(titleEn, 'Our position')

    // Click the EN-title translate button (fills the AR counterpart on 2xx only).
    const translateBtn = screen.getByRole('button', { name: 'Translate to Arabic' })
    await user.click(translateBtn)

    // title_ar stays empty; an error toast fired exactly once.
    const titleAr = screen.getByLabelText('Title (Arabic)', { exact: false }) as HTMLInputElement
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1))
    expect(titleAr.value).toBe('')

    // Submission can still become enabled by typing manually.
    await user.type(titleAr, 'موقفنا')
    const submit = screen.getByRole('button', { name: 'Create position' })
    await waitFor(() => expect(submit).toBeEnabled())
  })

  it.skip('submits real position_type_id and audience_groups then links with applies_to (POSNEW-02, D-09/D-10)', async () => {
    // unskipped + implemented in plan 64-04 (submit flow)
    const user = userEvent.setup()
    createMock.mockResolvedValue({ id: 'pos-1' })
    linkMock.mockResolvedValue({ id: 'link-1' })
    renderDialog()

    await user.type(screen.getByLabelText('Title (English)', { exact: false }), 'Our position')
    await user.type(screen.getByLabelText('Title (Arabic)', { exact: false }), 'موقفنا')
    await user.click(screen.getByRole('button', { name: 'Create position' }))

    await waitFor(() =>
      expect(createMock).toHaveBeenCalledWith(
        expect.objectContaining({
          position_type_id: STANDARD_TYPE_ID,
          title_ar: 'موقفنا',
          audience_groups: [ALL_STAFF_ID],
        }),
      ),
    )
    expect(linkMock).toHaveBeenCalledWith('pos-1', {
      dossier_id: 'd-1',
      link_type: 'applies_to',
    })
  })

  it.skip('invalidates dossier-position-links and overview keys on full success (POSNEW-02, D-12)', async () => {
    // unskipped + implemented in plan 64-04 (submit flow)
    const user = userEvent.setup()
    createMock.mockResolvedValue({ id: 'pos-1' })
    linkMock.mockResolvedValue({ id: 'link-1' })
    const { queryClient } = renderDialog()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    await user.type(screen.getByLabelText('Title (English)', { exact: false }), 'Our position')
    await user.type(screen.getByLabelText('Title (Arabic)', { exact: false }), 'موقفنا')
    await user.click(screen.getByRole('button', { name: 'Create position' }))

    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['dossier-position-links', 'd-1'] }),
      ),
    )
    expect(toast.success).toHaveBeenCalled()
    expect(baseProps.onClose).toHaveBeenCalled()
  })

  it.skip('shows a warning toast with retry, not success, when the link write fails (POSNEW-02, D-11)', async () => {
    // unskipped + implemented in plan 64-04 (submit flow)
    const user = userEvent.setup()
    createMock.mockResolvedValue({ id: 'pos-1' })
    linkMock.mockRejectedValue(new Error('link failed'))
    renderDialog()

    await user.type(screen.getByLabelText('Title (English)', { exact: false }), 'Our position')
    await user.type(screen.getByLabelText('Title (Arabic)', { exact: false }), 'موقفنا')
    await user.click(screen.getByRole('button', { name: 'Create position' }))

    await waitFor(() => expect(toast.warning).toHaveBeenCalledTimes(1))
    expect(toast.success).not.toHaveBeenCalled()
  })
})
