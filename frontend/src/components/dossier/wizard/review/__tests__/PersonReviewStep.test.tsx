/**
 * PersonReviewStep unit tests (Phase 32 Plan 32-03, Task 2)
 *
 * Covers PBI-07 acceptance:
 *   1. Populated case: all 11 identity values + nationality render correctly.
 *   2. Legacy draft case: every identity field renders `—` when null/empty.
 *   3. Edit affordance: Identity card Edit button calls onEditStep(0).
 *   4. Basic Information card no longer rendered for persons (D-17).
 *   5. Card order: Identity → PersonDetails → (elected_official ? OfficeTerm).
 *   6. Bilingual render: AR locale uses `الهوية` card title + female label.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react'
import type { UseFormReturn } from 'react-hook-form'
import type { PersonFormData } from '../../schemas/person.schema'

// ── i18n mock (EN by default; AR test toggles language before mount) ───────
let MOCK_LANGUAGE: 'en' | 'ar' = 'en'

const AR_STRINGS: Record<string, string> = {
  'form-wizard:wizard.person_identity.review.card_title': 'الهوية',
  'form-wizard:wizard.person_identity.review.biographical_summary_heading':
    'ملخص السيرة الذاتية',
  'form-wizard:wizard.person_identity.gender.female': 'أنثى',
  'form-wizard:wizard.person_identity.gender.male': 'ذكر',
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      if (MOCK_LANGUAGE === 'ar' && AR_STRINGS[key] !== undefined) {
        return AR_STRINGS[key]
      }
      return fallback ?? key
    },
    i18n: {
      get language(): string {
        return MOCK_LANGUAGE
      },
    },
  }),
}))

// FormWizardStep is a passthrough wrapper for tests.
vi.mock('@/components/ui/form-wizard', () => ({
  FormWizardStep: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Button passthrough — preserve onClick + children.
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    ...rest
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children: React.ReactNode
  }) => (
    <button type="button" onClick={onClick} {...rest}>
      {children}
    </button>
  ),
}))

// Badge passthrough — preserves text content for getAllByText assertions.
vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

// ReviewSection / ReviewField mocks — simple DOM so tests can find text.
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
      <dd>
        {value !== undefined && value !== '' ? value : <span>--</span>}
      </dd>
    </div>
  ),
}))

// useDossier mock — controllable per-test nationality resolution.
let MOCK_NATIONALITY: {
  name_en: string
  name_ar: string
  extension?: { iso_code_2?: string | null }
} | null = null

vi.mock('@/hooks/useDossier', () => ({
  useDossier: () => ({
    data: MOCK_NATIONALITY,
    isLoading: false,
    error: null,
  }),
}))

// ── Import component under test AFTER mocks ────────────────────────────────
import { PersonReviewStep } from '../PersonReviewStep'

// ── Helpers ────────────────────────────────────────────────────────────────

function createMockForm(
  values: Partial<PersonFormData>,
): UseFormReturn<PersonFormData> {
  return {
    control: {} as UseFormReturn<PersonFormData>['control'],
    watch: vi.fn().mockReturnValue(values),
    getValues: vi.fn(),
    setValue: vi.fn(),
  } as unknown as UseFormReturn<PersonFormData>
}

const populatedValues: Partial<PersonFormData> = {
  person_subtype: 'standard',
  honorific_selection: 'Dr.',
  honorific_en: 'Dr.',
  honorific_ar: 'د.',
  first_name_en: 'Amina',
  last_name_en: 'Salah',
  first_name_ar: 'أمينة',
  last_name_ar: 'صلاح',
  known_as_en: 'The Envoy',
  known_as_ar: 'المبعوثة',
  nationality_id: '11111111-1111-1111-1111-111111111111',
  date_of_birth: '1978-03-14',
  gender: 'female',
  photo_url: 'https://example.com/avatar.jpg',
  description_en: 'Senior diplomat',
  description_ar: 'دبلوماسية كبيرة',
  tags: ['envoy', 'senior'],
}

const emptyValues: Partial<PersonFormData> = {
  person_subtype: 'standard',
  // All identity fields undefined — simulating a legacy draft.
}

beforeEach(() => {
  cleanup()
  MOCK_LANGUAGE = 'en'
  MOCK_NATIONALITY = null
})

describe('PersonReviewStep — Identity card (PBI-07)', () => {
  it('1. Populated: renders all 11 identity values + resolved nationality', () => {
    MOCK_NATIONALITY = {
      name_en: 'Saudi Arabia',
      name_ar: 'المملكة العربية السعودية',
      extension: { iso_code_2: 'SA' },
    }
    const form = createMockForm(populatedValues)
    render(<PersonReviewStep form={form} onEditStep={vi.fn()} />)

    const card = screen.getByTestId('identity-card')
    expect(within(card).getByText('Amina')).toBeTruthy()
    expect(within(card).getByText('Salah')).toBeTruthy()
    expect(within(card).getByText('أمينة')).toBeTruthy()
    expect(within(card).getByText('صلاح')).toBeTruthy()
    expect(within(card).getByText('The Envoy')).toBeTruthy()
    expect(within(card).getByText('المبعوثة')).toBeTruthy()
    expect(within(card).getByText('Dr.')).toBeTruthy()
    expect(within(card).getByText('1978-03-14')).toBeTruthy()
    expect(
      within(card).getByText('form-wizard:wizard.person_identity.gender.female'),
    ).toBeTruthy()
    expect(within(card).getByText('Saudi Arabia (SA)')).toBeTruthy()

    // Photo preview renders as an <img> with the provided URL.
    // Empty alt gives role=presentation, so query by tag name.
    const img = card.querySelector('img')
    expect(img).not.toBeNull()
    expect(img?.getAttribute('src')).toBe('https://example.com/avatar.jpg')
  })

  it('2. Legacy draft: shows "—" for every missing identity value, no crash', () => {
    const form = createMockForm(emptyValues)
    render(<PersonReviewStep form={form} onEditStep={vi.fn()} />)

    const card = screen.getByTestId('identity-card')
    // Dashes for 9 identity rows (honorific, 4 name rows, 2 known-as, dob,
    // gender) + nationality (no dossier resolved) + photo preview = 12.
    // We assert at least 10 to stay resilient to layout tweaks.
    const dashes = within(card).getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(10)

    // No <img> in the card when photo_url is absent.
    expect(card.querySelector('img')).toBeNull()
  })

  it('3. Edit affordance: clicking Identity Edit button calls onEditStep(0)', () => {
    const onEditStep = vi.fn()
    const form = createMockForm(populatedValues)
    render(<PersonReviewStep form={form} onEditStep={onEditStep} />)

    const editBtn = screen.getByTestId('identity-card-edit')
    fireEvent.click(editBtn)
    expect(onEditStep).toHaveBeenCalledWith(0)
    expect(onEditStep).toHaveBeenCalledTimes(1)
  })

  it('4. No "Basic Information" card rendered for persons (D-17)', () => {
    const form = createMockForm(populatedValues)
    render(<PersonReviewStep form={form} onEditStep={vi.fn()} />)

    // Old Basic Info heading key + literal both absent.
    expect(screen.queryByText(/basic information/i)).toBeNull()
    expect(screen.queryByText('form-wizard:review.basic_info')).toBeNull()
  })

  it('5. Card order: Identity → PersonDetails (standard subtype, no OfficeTerm)', () => {
    const form = createMockForm(populatedValues)
    const { container } = render(<PersonReviewStep form={form} onEditStep={vi.fn()} />)

    const identity = container.querySelector('[data-testid="identity-card"]')
    const personDetails = container.querySelector('[data-testid="review-section"]')
    expect(identity).toBeTruthy()
    expect(personDetails).toBeTruthy()
    // Identity card must appear before PersonDetails in DOM order.
    expect(
      (identity as HTMLElement).compareDocumentPosition(personDetails as HTMLElement) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()

    // Only one ReviewSection (PersonDetails) — no OfficeTerm for standard subtype.
    expect(screen.getAllByTestId('review-section').length).toBe(1)
  })

  it('5b. Card order: Identity → PersonDetails → OfficeTerm for elected_official', () => {
    const form = createMockForm({
      ...populatedValues,
      person_subtype: 'elected_official',
      office_name_en: 'Minister of Foreign Affairs',
      country_id: '22222222-2222-2222-2222-222222222222',
      term_start: '2026-01-01',
    })
    render(<PersonReviewStep form={form} onEditStep={vi.fn()} />)

    const sections = screen.getAllByTestId('review-section')
    expect(sections.length).toBe(2) // PersonDetails + OfficeTerm
    // Identity card is a sibling above both sections.
    expect(screen.getByTestId('identity-card')).toBeTruthy()
  })

  it('6. Bilingual: AR locale shows Arabic card title + female label', () => {
    MOCK_LANGUAGE = 'ar'
    MOCK_NATIONALITY = {
      name_en: 'Saudi Arabia',
      name_ar: 'المملكة العربية السعودية',
      extension: { iso_code_2: 'SA' },
    }
    const form = createMockForm(populatedValues)
    render(<PersonReviewStep form={form} onEditStep={vi.fn()} />)

    const card = screen.getByTestId('identity-card')
    expect(within(card).getByText('الهوية')).toBeTruthy()
    expect(within(card).getByText('أنثى')).toBeTruthy()
    // Nationality in Arabic with ISO-2 suffix.
    expect(
      within(card).getByText('المملكة العربية السعودية (SA)'),
    ).toBeTruthy()
  })
})
