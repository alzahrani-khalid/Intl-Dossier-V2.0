import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { UseFormReturn } from 'react-hook-form'
import type { ForumFormData } from '../../schemas/forum.schema'

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
    <section>
      <h3>{title}</h3>
      <button onClick={onEdit} aria-label={`edit-${title}`}>
        edit
      </button>
      {children}
    </section>
  ),
  ReviewField: ({ label, value }: { label: string; value: string | undefined }) => (
    <div>
      <dt>{label}</dt>
      <dd>{value ?? '—'}</dd>
    </div>
  ),
}))

import { ForumReviewStep } from '../ForumReviewStep'

function createMockForm(values: Partial<ForumFormData>): UseFormReturn<ForumFormData> {
  return {
    control: {} as UseFormReturn<ForumFormData>['control'],
    watch: vi.fn().mockReturnValue({
      name_en: '',
      name_ar: '',
      abbreviation: '',
      description_en: '',
      description_ar: '',
      status: 'active',
      sensitivity_level: 1,
      tags: [],
      forum_type: '',
      organizing_body_id: '',
      ...values,
    }),
    getValues: vi.fn(),
    setValue: vi.fn(),
  } as unknown as UseFormReturn<ForumFormData>
}

describe('ForumReviewStep', () => {
  it('renders two review sections: basic info and forum details', () => {
    const form = createMockForm({})
    render(<ForumReviewStep form={form} onEditStep={vi.fn()} />)

    expect(screen.getByText('form-wizard:review.basic_info')).toBeTruthy()
    expect(screen.getByText('form-wizard:review.forum_details')).toBeTruthy()
  })

  it('fires onEditStep(0) when basic info Edit is clicked', () => {
    const onEditStep = vi.fn()
    const form = createMockForm({})
    render(<ForumReviewStep form={form} onEditStep={onEditStep} />)

    const editButton = screen.getByLabelText('edit-form-wizard:review.basic_info')
    fireEvent.click(editButton)
    expect(onEditStep).toHaveBeenCalledWith(0)
  })

  it('fires onEditStep(1) when forum details Edit is clicked', () => {
    const onEditStep = vi.fn()
    const form = createMockForm({})
    render(<ForumReviewStep form={form} onEditStep={onEditStep} />)

    const editButton = screen.getByLabelText('edit-form-wizard:review.forum_details')
    fireEvent.click(editButton)
    expect(onEditStep).toHaveBeenCalledWith(1)
  })

  it('translates forum_type value through the forum_types i18n key', () => {
    const form = createMockForm({ forum_type: 'summit' })
    render(<ForumReviewStep form={form} onEditStep={vi.fn()} />)

    expect(screen.getByText('form-wizard:forum.forum_types.summit')).toBeTruthy()
  })

  it('displays organizing_body_id value when set', () => {
    const form = createMockForm({ organizing_body_id: '00000000-0000-0000-0000-000000000042' })
    render(<ForumReviewStep form={form} onEditStep={vi.fn()} />)

    expect(screen.getByText('00000000-0000-0000-0000-000000000042')).toBeTruthy()
  })
})
