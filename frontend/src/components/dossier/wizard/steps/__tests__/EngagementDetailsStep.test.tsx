import { describe, it, expect, vi } from 'vitest'
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
  FormControl: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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

  it('renders two required date inputs (start + end)', () => {
    const form = createMockForm()
    render(<EngagementDetailsStep form={form} />)

    const dateInputs = document.querySelectorAll('input[type="date"]')
    expect(dateInputs.length).toBe(2)
    dateInputs.forEach((input) => {
      expect((input as HTMLInputElement).required).toBe(true)
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
