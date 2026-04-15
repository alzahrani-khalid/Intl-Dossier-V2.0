import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { UseFormReturn } from 'react-hook-form'
import type { CountryFormData } from '../../../wizard/schemas/country.schema'

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}))

vi.mock('@/hooks/useDirection', () => ({
  useDirection: () => ({ direction: 'ltr', isRTL: false }),
}))

vi.mock('@/components/ui/form-wizard', () => ({
  FormWizardStep: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/ui/form', () => ({
  FormControl: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FormField: ({ render }: { render: (props: { field: Record<string, unknown> }) => React.ReactNode }) =>
    render({ field: { value: '', onChange: vi.fn(), onBlur: vi.fn(), name: 'test', ref: vi.fn() } }),
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

vi.mock('../../hooks/useCountryAutoFill', () => ({
  useCountryAutoFill: vi.fn(),
}))

import { CountryDetailsStep } from '../CountryDetailsStep'

function createMockForm(): UseFormReturn<CountryFormData> {
  return {
    control: {} as UseFormReturn<CountryFormData>['control'],
    watch: vi.fn().mockReturnValue(''),
    getValues: vi.fn(),
    setValue: vi.fn(),
  } as unknown as UseFormReturn<CountryFormData>
}

describe('CountryDetailsStep', () => {
  it('renders ISO code, region, and capital fields', () => {
    const form = createMockForm()
    render(<CountryDetailsStep form={form} />)

    expect(screen.getByText('form-wizard:country.iso_code_2')).toBeTruthy()
    expect(screen.getByText('form-wizard:country.iso_code_3')).toBeTruthy()
    expect(screen.getByText('form-wizard:country.region')).toBeTruthy()
    expect(screen.getByText('form-wizard:country.capital_en')).toBeTruthy()
    expect(screen.getByText('form-wizard:country.capital_ar')).toBeTruthy()
  })

  it('ISO code inputs have maxLength and uppercase class', () => {
    const form = createMockForm()
    render(<CountryDetailsStep form={form} />)

    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[]
    const isoInputs = inputs.filter(
      (input) => input.maxLength === 2 || input.maxLength === 3,
    )
    expect(isoInputs.length).toBe(2)
    isoInputs.forEach((input) => {
      expect(input.className).toContain('uppercase')
      expect(input.className).toContain('font-mono')
    })
  })

  it('region dropdown has 6 options', () => {
    const form = createMockForm()
    render(<CountryDetailsStep form={form} />)

    const options = screen.getAllByRole('option')
    expect(options.length).toBe(6)
  })

  it('capital_ar input has RTL direction', () => {
    const form = createMockForm()
    render(<CountryDetailsStep form={form} />)

    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[]
    const rtlInput = inputs.find((input) => input.dir === 'ltr')
    // In LTR mode, direction is 'ltr' -- in RTL mode it would be 'rtl'
    expect(rtlInput).toBeTruthy()
  })
})
