import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import type { UseFormReturn } from 'react-hook-form'
import type { WorkingGroupFormData } from '../../schemas/working-group.schema'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}))

const useDirectionMock = vi.fn(() => ({ direction: 'ltr' as const, isRTL: false }))
vi.mock('@/hooks/useDirection', () => ({
  useDirection: () => useDirectionMock(),
}))

vi.mock('@/components/ui/form-wizard', () => ({
  FormWizardStep: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/ui/form', () => ({
  FormControl: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FormField: ({
    render,
    name,
  }: {
    render: (props: { field: Record<string, unknown> }) => React.ReactNode
    name: string
  }) =>
    render({
      field: { value: '', onChange: vi.fn(), onBlur: vi.fn(), name, ref: vi.fn() },
    }),
  FormItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FormLabel: ({ children }: { children: React.ReactNode }) => {
    const label = typeof children === 'string' ? children : ''
    return <label htmlFor={label}>{children}</label>
  },
  FormMessage: () => null,
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input aria-label={props.type === 'date' ? 'established_date_label' : undefined} {...props} />
  ),
}))

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea data-testid={`textarea-${props.name ?? 'anon'}`} {...props} />
  ),
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <option value={value} data-testid={`select-item-${value}`}>
      {children}
    </option>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder: string }) => <span>{placeholder}</span>,
}))

vi.mock('@/components/work-creation/DossierPicker', () => ({
  DossierPicker: (props: {
    filterByDossierType?: string | string[]
    placeholder?: string
    value?: string
  }) => (
    <div
      data-testid="dossier-picker"
      data-filter={
        Array.isArray(props.filterByDossierType)
          ? props.filterByDossierType.join(',')
          : String(props.filterByDossierType)
      }
      data-placeholder={props.placeholder}
    />
  ),
}))

function createMockForm(): UseFormReturn<WorkingGroupFormData> {
  return {
    control: {} as UseFormReturn<WorkingGroupFormData>['control'],
    watch: vi.fn().mockReturnValue(''),
    getValues: vi.fn(),
    setValue: vi.fn(),
  } as unknown as UseFormReturn<WorkingGroupFormData>
}

import { WorkingGroupDetailsStep } from '../WorkingGroupDetailsStep'

describe('WorkingGroupDetailsStep', () => {
  beforeEach(() => {
    cleanup()
    useDirectionMock.mockReturnValue({ direction: 'ltr', isRTL: false })
  })

  it('renders all 4 status options via i18n keys', () => {
    const form = createMockForm()
    render(<WorkingGroupDetailsStep form={form} />)

    expect(screen.getByTestId('select-item-active')).toBeTruthy()
    expect(screen.getByTestId('select-item-inactive')).toBeTruthy()
    expect(screen.getByTestId('select-item-pending')).toBeTruthy()
    expect(screen.getByTestId('select-item-suspended')).toBeTruthy()
  })

  it('renders DossierPicker filtered to organization', () => {
    const form = createMockForm()
    render(<WorkingGroupDetailsStep form={form} />)

    const picker = screen.getByTestId('dossier-picker')
    expect(picker.getAttribute('data-filter')).toBe('organization')
  })

  it('established_date input has type="date"', () => {
    const form = createMockForm()
    render(<WorkingGroupDetailsStep form={form} />)

    const dateInput = screen.getByLabelText('established_date_label') as HTMLInputElement
    expect(dateInput.getAttribute('type')).toBe('date')
  })

  it('Arabic mandate textarea receives dir="ltr" when direction is ltr', () => {
    const form = createMockForm()
    render(<WorkingGroupDetailsStep form={form} />)

    const ta = screen.getByTestId('textarea-mandate_ar') as HTMLTextAreaElement
    expect(ta.getAttribute('dir')).toBe('ltr')
  })

  describe('RTL mode', () => {
    it('Arabic mandate textarea receives dir="rtl" when direction is rtl', () => {
      useDirectionMock.mockReturnValue({ direction: 'rtl', isRTL: true })
      const form = createMockForm()
      render(<WorkingGroupDetailsStep form={form} />)

      const ta = screen.getByTestId('textarea-mandate_ar') as HTMLTextAreaElement
      expect(ta.getAttribute('dir')).toBe('rtl')
    })
  })
})
