/**
 * OfficeTermStep unit tests (Phase 30 Plan 04, Task 1)
 *
 * Verifies:
 *   - All 4 sections render with correct headings (office, constituency, party, term)
 *   - Both DossierPickers render with correct filterByDossierType props (country + organization)
 *   - All 8 text/date form field inputs are present by name attribute
 *   - Both date inputs have type="date"
 *   - EN field appears before AR field in each bilingual pair (DOM order)
 *   - Required country label includes asterisk marker
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import type { UseFormReturn } from 'react-hook-form'
import type { PersonFormData } from '../../schemas/person.schema'

// ── Mock all UI dependencies ────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      // Return the trailing segment after the last colon/dot for heading assertions
      const segments = key.split('.')
      const leaf = segments[segments.length - 1]
      // Capitalise first letter so headings like 'Office', 'Constituency', 'Party', 'Term' match
      return leaf.charAt(0).toUpperCase() + leaf.slice(1)
    },
    i18n: { language: 'en' },
  }),
}))

vi.mock('@/hooks/useDirection', () => ({
  useDirection: () => ({ direction: 'ltr' as const, isRTL: false }),
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
  FormLabel: ({ children }: { children: React.ReactNode }) => <label>{children}</label>,
  FormMessage: () => null,
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}))

vi.mock('@/components/work-creation/DossierPicker', () => ({
  DossierPicker: (props: {
    filterByDossierType?: string
    value?: string
    placeholder?: string
    onChange?: (id: string | undefined) => void
  }) => (
    <div
      data-testid={`dossier-picker-${String(props.filterByDossierType)}`}
      data-placeholder={props.placeholder}
    >
      mock-dossier-picker
    </div>
  ),
}))

// ── Import component under test (after mocks) ───────────────────────────────

import { OfficeTermStep } from '../OfficeTermStep'

// ── Mock form factory ────────────────────────────────────────────────────────

function createMockForm(): UseFormReturn<PersonFormData> {
  return {
    control: {} as UseFormReturn<PersonFormData>['control'],
    watch: vi.fn().mockReturnValue(''),
    getValues: vi.fn(),
    setValue: vi.fn(),
  } as unknown as UseFormReturn<PersonFormData>
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('OfficeTermStep', () => {
  beforeEach(() => {
    cleanup()
  })

  it('renders all 4 section headings (office, constituency, party, term)', () => {
    const form = createMockForm()
    render(<OfficeTermStep form={form} />)

    const headings = screen.getAllByRole('heading', { level: 3 })
    expect(headings.length).toBe(4)
    const names = headings.map((h) => h.textContent?.trim() ?? '')
    expect(names).toEqual(
      expect.arrayContaining(['Office', 'Constituency', 'Party', 'Term']),
    )
  })

  it('renders DossierPicker for country with filterByDossierType="country"', () => {
    const form = createMockForm()
    render(<OfficeTermStep form={form} />)
    expect(screen.getByTestId('dossier-picker-country')).toBeTruthy()
  })

  it('renders DossierPicker for organization with filterByDossierType="organization"', () => {
    const form = createMockForm()
    render(<OfficeTermStep form={form} />)
    expect(screen.getByTestId('dossier-picker-organization')).toBeTruthy()
  })

  it('renders all 8 ELOF-02 text/date form field inputs by name attribute', () => {
    const form = createMockForm()
    const { container } = render(<OfficeTermStep form={form} />)
    const expectedNames = [
      'office_name_en',
      'office_name_ar',
      'district_en',
      'district_ar',
      'party_en',
      'party_ar',
      'term_start',
      'term_end',
    ]
    for (const name of expectedNames) {
      const input = container.querySelector(`input[name="${name}"]`)
      expect(input, `missing input[name="${name}"]`).not.toBeNull()
    }
  })

  it('renders term_start and term_end as type="date" inputs', () => {
    const form = createMockForm()
    const { container } = render(<OfficeTermStep form={form} />)
    const termStart = container.querySelector('input[name="term_start"]')
    const termEnd = container.querySelector('input[name="term_end"]')
    expect(termStart?.getAttribute('type')).toBe('date')
    expect(termEnd?.getAttribute('type')).toBe('date')
  })

  it('renders EN field before AR field in each bilingual pair (DOM order)', () => {
    const form = createMockForm()
    const { container } = render(<OfficeTermStep form={form} />)
    const allInputs = Array.from(container.querySelectorAll('input[name]'))
    const indexOf = (n: string): number =>
      allInputs.findIndex((el) => el.getAttribute('name') === n)

    expect(indexOf('office_name_en')).toBeLessThan(indexOf('office_name_ar'))
    expect(indexOf('district_en')).toBeLessThan(indexOf('district_ar'))
    expect(indexOf('party_en')).toBeLessThan(indexOf('party_ar'))
  })

  it('country field label contains an asterisk (required marker)', () => {
    const form = createMockForm()
    const { container } = render(<OfficeTermStep form={form} />)
    // country_id is rendered as a DossierPicker; its FormLabel is in the same FormItem div.
    // The label wraps the "Country" text and the "*" span.
    const countryPicker = container.querySelector('[data-testid="dossier-picker-country"]')
    expect(countryPicker).not.toBeNull()
    // Walk up to the FormItem wrapper and check it contains "*"
    const formItem = countryPicker?.parentElement?.parentElement
    expect(formItem?.textContent ?? '').toContain('*')
  })

  it('term_start label contains an asterisk (required marker)', () => {
    const form = createMockForm()
    const { container } = render(<OfficeTermStep form={form} />)
    const termStartInput = container.querySelector('input[name="term_start"]')
    expect(termStartInput).not.toBeNull()
    // Walk up to FormItem to find the label with the asterisk
    const formItem = termStartInput?.parentElement?.parentElement
    expect(formItem?.textContent ?? '').toContain('*')
  })
})
