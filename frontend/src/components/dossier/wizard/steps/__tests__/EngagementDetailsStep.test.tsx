import { describe, it, expect, vi } from 'vitest'
import { cloneElement, isValidElement } from 'react'
import type { ReactElement } from 'react'
import { render, screen } from '@testing-library/react'
import type { UseFormReturn } from 'react-hook-form'
import type { EngagementFormData } from '../../schemas/engagement.schema'

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}))

const useDirectionMock = vi.fn(() => ({ direction: 'ltr', isRTL: false }))
vi.mock('@/hooks/useDirection', () => ({
  useDirection: (): { direction: 'ltr' | 'rtl'; isRTL: boolean } => useDirectionMock(),
}))

vi.mock('@/components/ui/form-wizard', () => ({
  FormWizardStep: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/ui/form', () => ({
  FormControl: ({ children, required }: { children: React.ReactNode; required?: boolean }) =>
    isValidElement(children)
      ? cloneElement(
          children as ReactElement<{ 'aria-required'?: boolean }>,
          required === true ? { 'aria-required': true } : {},
        )
      : children,
  FormField: ({
    render,
  }: {
    render: (props: { field: Record<string, unknown> }) => React.ReactNode
  }) =>
    render({
      field: { value: '', onChange: vi.fn(), onBlur: vi.fn(), name: 'test', ref: vi.fn() },
    }),
  FormItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FormLabel: ({ children }: { children: React.ReactNode }) => <label>{children}</label>,
  FormMessage: () => null,
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder: string }) => <span>{placeholder}</span>,
}))

import { EngagementDetailsStep } from '../EngagementDetailsStep'

function createMockForm(): UseFormReturn<EngagementFormData> {
  return {
    control: {} as UseFormReturn<EngagementFormData>['control'],
    watch: vi.fn().mockReturnValue(''),
    getValues: vi.fn(),
    setValue: vi.fn(),
  } as unknown as UseFormReturn<EngagementFormData>
}

describe('EngagementDetailsStep', () => {
  it('renders all 10 engagement type options', () => {
    const form = createMockForm()
    render(<EngagementDetailsStep form={form} />)

    const expectedTypes = [
      'bilateral_meeting',
      'mission',
      'delegation',
      'summit',
      'working_group',
      'roundtable',
      'official_visit',
      'consultation',
      'forum_session',
      'other',
    ]
    expectedTypes.forEach((type) => {
      expect(screen.getByText(`form-wizard:engagement.types.${type}`)).toBeTruthy()
    })
  })

  it('renders all 8 engagement category options including statistical and research', () => {
    const form = createMockForm()
    render(<EngagementDetailsStep form={form} />)

    const expectedCategories = [
      'diplomatic',
      'statistical',
      'technical',
      'economic',
      'cultural',
      'educational',
      'research',
      'other',
    ]
    expectedCategories.forEach((cat) => {
      expect(screen.getByText(`form-wizard:engagement.categories.${cat}`)).toBeTruthy()
    })
  })

  it('renders two date inputs (start + end) marked required via aria-required', () => {
    const form = createMockForm()
    render(<EngagementDetailsStep form={form} />)

    // Wave 3 intentionally removed the HTML5 `required` attribute from the date
    // inputs and validates via Zod + `aria-required` instead. Assert the
    // accessibility contract rather than native HTML constraint validation.
    const dateInputs = document.querySelectorAll('input[type="date"]')
    expect(dateInputs.length).toBe(2)
    dateInputs.forEach((input) => {
      expect(input.getAttribute('aria-required')).toBe('true')
    })
  })

  it('renders location_en and location_ar labels', () => {
    const form = createMockForm()
    render(<EngagementDetailsStep form={form} />)

    expect(screen.getByText('form-wizard:engagement.location_en_label')).toBeTruthy()
    expect(screen.getByText('form-wizard:engagement.location_ar_label')).toBeTruthy()
  })

  it('location_ar input has RTL direction when useDirection returns rtl', () => {
    useDirectionMock.mockReturnValueOnce({ direction: 'rtl', isRTL: true })
    const form = createMockForm()
    render(<EngagementDetailsStep form={form} />)

    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[]
    const rtlInput = inputs.find((input) => input.dir === 'rtl')
    expect(rtlInput).toBeTruthy()
  })
})
