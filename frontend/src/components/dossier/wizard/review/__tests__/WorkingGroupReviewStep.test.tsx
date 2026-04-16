import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import type { UseFormReturn } from 'react-hook-form'
import type { WorkingGroupFormData } from '../../schemas/working-group.schema'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}))

vi.mock('@/components/ui/form-wizard', () => ({
  FormWizardStep: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('../ReviewComponents', () => ({
  ReviewSection: ({
    title,
    onEdit,
    children,
  }: {
    title: string
    onEdit: () => void
    children: React.ReactNode
  }) => (
    <section data-testid={`section-${title}`}>
      <h3>{title}</h3>
      <button type="button" onClick={onEdit} data-testid={`edit-${title}`}>
        edit
      </button>
      {children}
    </section>
  ),
  ReviewField: ({ label, value }: { label: string; value: string | undefined }) => (
    <div data-testid={`field-${label}`}>
      <dt>{label}</dt>
      <dd>{value ?? '—'}</dd>
    </div>
  ),
}))

import { WorkingGroupReviewStep } from '../WorkingGroupReviewStep'

interface WatchReturn {
  name_en?: string
  name_ar?: string
  abbreviation?: string
  description_en?: string
  wg_status?: string
  established_date?: string
  mandate_en?: string
  mandate_ar?: string
  parent_body_id?: string
}

function createMockForm(watchValues: WatchReturn): UseFormReturn<WorkingGroupFormData> {
  return {
    control: {} as UseFormReturn<WorkingGroupFormData>['control'],
    watch: vi.fn().mockReturnValue(watchValues),
    getValues: vi.fn(),
    setValue: vi.fn(),
  } as unknown as UseFormReturn<WorkingGroupFormData>
}

describe('WorkingGroupReviewStep', () => {
  beforeEach(() => {
    cleanup()
  })

  it('renders 2 sections: Basic Info + WG Details', () => {
    const form = createMockForm({})
    render(<WorkingGroupReviewStep form={form} onEditStep={vi.fn()} />)

    expect(screen.getByTestId('section-form-wizard:review.basic_info')).toBeTruthy()
    expect(screen.getByTestId('section-form-wizard:review.working_group_details')).toBeTruthy()
  })

  it('Edit buttons call onEditStep(0) and onEditStep(1)', () => {
    const onEditStep = vi.fn()
    const form = createMockForm({})
    render(<WorkingGroupReviewStep form={form} onEditStep={onEditStep} />)

    fireEvent.click(screen.getByTestId('edit-form-wizard:review.basic_info'))
    expect(onEditStep).toHaveBeenCalledWith(0)

    fireEvent.click(screen.getByTestId('edit-form-wizard:review.working_group_details'))
    expect(onEditStep).toHaveBeenCalledWith(1)
  })

  it('translates wg_status "active" via i18n key path', () => {
    const form = createMockForm({ wg_status: 'active' })
    render(<WorkingGroupReviewStep form={form} onEditStep={vi.fn()} />)

    const statusField = screen.getByTestId('field-form-wizard:workingGroup.status_label')
    expect(statusField.textContent).toContain('form-wizard:workingGroup.statuses.active')
  })

  it('truncates mandate text > 80 chars with ellipsis', () => {
    const longMandate = 'a'.repeat(120)
    const form = createMockForm({ mandate_en: longMandate })
    render(<WorkingGroupReviewStep form={form} onEditStep={vi.fn()} />)

    const mandateField = screen.getByTestId('field-form-wizard:workingGroup.mandate_en_label')
    expect(mandateField.textContent).toContain('…')
    expect(mandateField.textContent).not.toContain('a'.repeat(120))
  })
})
