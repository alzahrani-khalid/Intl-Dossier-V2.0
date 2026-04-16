import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { UseFormReturn } from 'react-hook-form'
import type { EngagementFormData } from '../../schemas/engagement.schema'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
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
    <section data-testid="review-section">
      <h3>{title}</h3>
      <button type="button" onClick={onEdit} data-testid={`edit-${title}`}>
        edit
      </button>
      <div>{children}</div>
    </section>
  ),
  ReviewField: ({ label, value }: { label: string; value: string | undefined }) => (
    <div data-testid="review-field">
      <dt>{label}</dt>
      <dd>{value ?? '--'}</dd>
    </div>
  ),
}))

import { EngagementReviewStep } from '../EngagementReviewStep'

function createMockForm(
  values: Partial<EngagementFormData>,
): UseFormReturn<EngagementFormData> {
  return {
    control: {} as UseFormReturn<EngagementFormData>['control'],
    watch: vi.fn().mockReturnValue(values),
    getValues: vi.fn(),
    setValue: vi.fn(),
  } as unknown as UseFormReturn<EngagementFormData>
}

describe('EngagementReviewStep', () => {
  it('renders 3 review sections', () => {
    const form = createMockForm({})
    render(<EngagementReviewStep form={form} onEditStep={vi.fn()} />)

    const sections = screen.getAllByTestId('review-section')
    expect(sections.length).toBe(3)
  })

  it('Edit buttons call onEditStep(0), onEditStep(1), onEditStep(2)', () => {
    const onEditStep = vi.fn()
    const form = createMockForm({})
    render(<EngagementReviewStep form={form} onEditStep={onEditStep} />)

    fireEvent.click(screen.getByTestId('edit-form-wizard:review.basic_info'))
    expect(onEditStep).toHaveBeenNthCalledWith(1, 0)

    fireEvent.click(screen.getByTestId('edit-form-wizard:review.engagement_details'))
    expect(onEditStep).toHaveBeenNthCalledWith(2, 1)

    fireEvent.click(screen.getByTestId('edit-form-wizard:review.participants_summary'))
    expect(onEditStep).toHaveBeenNthCalledWith(3, 2)
  })

  it('displays participant counts as stringified numbers', () => {
    const form = createMockForm({
      participant_country_ids: [
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
      ],
      participant_organization_ids: ['33333333-3333-3333-3333-333333333333'],
      participant_person_ids: [],
    })
    render(<EngagementReviewStep form={form} onEditStep={vi.fn()} />)

    expect(screen.getByText('2')).toBeTruthy()
    expect(screen.getByText('1')).toBeTruthy()
    expect(screen.getByText('0')).toBeTruthy()
  })

  it('displays type + category labels translated via i18n keys', () => {
    const form = createMockForm({
      engagement_type: 'summit',
      engagement_category: 'statistical',
    })
    render(<EngagementReviewStep form={form} onEditStep={vi.fn()} />)

    expect(screen.getByText('form-wizard:engagement.types.summit')).toBeTruthy()
    expect(screen.getByText('form-wizard:engagement.categories.statistical')).toBeTruthy()
  })
})
