/**
 * PersonBasicInfoStep unit tests (Phase 32 Plan 32-02, Task 7)
 *
 * Verifies:
 *   - All 11 D-24 identity fields render (honorific select + 4 name inputs +
 *     2 known-as inputs + photo_url + nationality picker + DOB + gender)
 *   - Honorific Select renders 13 curated options (including 'Other')
 *   - Selecting 'Other' reveals two free-text honorific inputs
 *   - Gender Select shows exactly 2 options (Female + Male) — no "prefer not to say"
 *   - Required markers appear on last_name_en, last_name_ar, and nationality labels
 *   - Abbreviation input is NOT rendered (PBI-01 regression guard)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import type { UseFormReturn } from 'react-hook-form'
import type { PersonFormData } from '../../schemas/person.schema'

// ── Mock all UI dependencies ────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      // Return the trailing segment after the last dot for readable labels.
      const segments = key.split('.')
      return segments[segments.length - 1]
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

vi.mock('@/components/dossier/AIFieldAssist', () => ({
  AIFieldAssist: () => <div data-testid="ai-field-assist" />,
}))

vi.mock('@/components/forms/ContextualHelp', () => ({
  FieldLabelWithHelp: ({ label, required }: { label: string; required?: boolean }) => (
    <label>
      {label}
      {required === true ? <span aria-hidden="true"> *</span> : null}
    </label>
  ),
}))

vi.mock('@/components/ui/form', () => ({
  FormControl: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FormDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
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

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} />,
}))

// Minimal Select mock: exposes trigger + content and renders options as buttons.
vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div data-testid="select">{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <button type="button" role="option" data-value={value}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/work-creation/DossierPicker', () => ({
  DossierPicker: (props: {
    filterByDossierType?: string
    value?: string
    placeholder?: string
    onChange?: (id: string | null) => void
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

import { PersonBasicInfoStep } from '../PersonBasicInfoStep'

// ── Mock form factory ───────────────────────────────────────────────────────

function createMockForm(overrides: Partial<Record<string, unknown>> = {}): UseFormReturn<PersonFormData> {
  return {
    control: {} as UseFormReturn<PersonFormData>['control'],
    watch: vi.fn((name: string) => (overrides[name] as unknown) ?? ''),
    getValues: vi.fn(),
    setValue: vi.fn(),
  } as unknown as UseFormReturn<PersonFormData>
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('PersonBasicInfoStep', () => {
  beforeEach(() => {
    cleanup()
  })

  it('renders all 4 name inputs (first/last × EN/AR) by name attribute', () => {
    const form = createMockForm()
    const { container } = render(<PersonBasicInfoStep form={form} dossierType="person" />)
    const names = ['first_name_en', 'last_name_en', 'first_name_ar', 'last_name_ar']
    for (const n of names) {
      expect(container.querySelector(`input[name="${n}"]`), `missing ${n}`).not.toBeNull()
    }
  })

  it('renders both known-as inputs by name attribute', () => {
    const form = createMockForm()
    const { container } = render(<PersonBasicInfoStep form={form} dossierType="person" />)
    expect(container.querySelector('input[name="known_as_en"]')).not.toBeNull()
    expect(container.querySelector('input[name="known_as_ar"]')).not.toBeNull()
  })

  it('renders photo_url as url input and date_of_birth as date input', () => {
    const form = createMockForm()
    const { container } = render(<PersonBasicInfoStep form={form} dossierType="person" />)
    const photo = container.querySelector('input[name="photo_url"]')
    const dob = container.querySelector('input[name="date_of_birth"]')
    expect(photo?.getAttribute('type')).toBe('url')
    expect(dob?.getAttribute('type')).toBe('date')
  })

  it('renders DossierPicker for nationality with filterByDossierType="country"', () => {
    const form = createMockForm()
    render(<PersonBasicInfoStep form={form} dossierType="person" />)
    expect(screen.getByTestId('dossier-picker-country')).toBeTruthy()
  })

  it('honorific Select renders all 13 curated options (including Other)', () => {
    const form = createMockForm()
    render(<PersonBasicInfoStep form={form} dossierType="person" />)
    const options = screen.getAllByRole('option')
    // 13 honorific options + 2 gender options = 15. Filter to just honorific values.
    const honorificValues = [
      'H.E.',
      'Dr.',
      'Prof.',
      'Sen.',
      'Hon.',
      'Rep.',
      'Sheikh',
      'Amb.',
      'Mr.',
      'Ms.',
      'Mrs.',
      'Eng.',
      'Other',
    ]
    for (const v of honorificValues) {
      const found = options.find((el) => el.getAttribute('data-value') === v)
      expect(found, `honorific option ${v} missing`).toBeTruthy()
    }
  })

  it("gender Select renders EXACTLY 'female' + 'male' options (no prefer-not-to-say)", () => {
    const form = createMockForm()
    render(<PersonBasicInfoStep form={form} dossierType="person" />)
    const genderOpts = screen
      .getAllByRole('option')
      .filter((el) => {
        const v = el.getAttribute('data-value')
        return v === 'female' || v === 'male'
      })
    expect(genderOpts.length).toBe(2)
    const preferNotToSay = screen
      .queryAllByRole('option')
      .find((el) => el.getAttribute('data-value') === 'prefer_not_to_say')
    expect(preferNotToSay).toBeFalsy()
  })

  it("selecting 'Other' reveals two free-text honorific inputs", () => {
    const form = createMockForm({ honorific_selection: 'Other' })
    const { container } = render(<PersonBasicInfoStep form={form} dossierType="person" />)
    // honorific_en + honorific_ar only appear inside the Other reveal.
    expect(container.querySelector('input[name="honorific_en"]')).not.toBeNull()
    expect(container.querySelector('input[name="honorific_ar"]')).not.toBeNull()
  })

  it('hides the Other reveal when honorific_selection is empty', () => {
    const form = createMockForm({ honorific_selection: '' })
    const { container } = render(<PersonBasicInfoStep form={form} dossierType="person" />)
    expect(container.querySelector('input[name="honorific_en"]')).toBeNull()
    expect(container.querySelector('input[name="honorific_ar"]')).toBeNull()
  })

  it('last_name_en, last_name_ar, and nationality labels carry the required asterisk', () => {
    const form = createMockForm()
    const { container } = render(<PersonBasicInfoStep form={form} dossierType="person" />)

    const lastEn = container.querySelector('input[name="last_name_en"]')
    const lastAr = container.querySelector('input[name="last_name_ar"]')
    expect(lastEn?.parentElement?.parentElement?.textContent ?? '').toContain('*')
    expect(lastAr?.parentElement?.parentElement?.textContent ?? '').toContain('*')

    const natPicker = container.querySelector('[data-testid="dossier-picker-country"]')
    expect(natPicker?.parentElement?.parentElement?.textContent ?? '').toContain('*')
  })

  it('does NOT render an abbreviation input (PBI-01 regression guard)', () => {
    const form = createMockForm()
    const { container } = render(<PersonBasicInfoStep form={form} dossierType="person" />)
    expect(container.querySelector('input[name="abbreviation"]')).toBeNull()
  })

  it('does NOT render a manual status select in classification (D-23)', () => {
    const form = createMockForm()
    render(<PersonBasicInfoStep form={form} dossierType="person" />)
    const statusOpt = screen
      .queryAllByRole('option')
      .find((el) => el.getAttribute('data-value') === 'active')
    expect(statusOpt).toBeFalsy()
  })
})
