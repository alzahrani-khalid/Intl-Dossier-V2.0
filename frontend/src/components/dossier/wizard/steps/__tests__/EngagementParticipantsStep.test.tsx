import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { UseFormReturn } from 'react-hook-form'
import type { EngagementFormData } from '../../schemas/engagement.schema'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
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
      field: { value: [], onChange: vi.fn(), onBlur: vi.fn(), name: 'test', ref: vi.fn() },
    }),
  FormItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FormLabel: ({ children }: { children: React.ReactNode }) => <label>{children}</label>,
  FormMessage: () => null,
}))

vi.mock('@/components/work-creation/DossierPicker', () => ({
  DossierPicker: (props: Record<string, unknown>) => (
    <div
      data-testid="dossier-picker"
      data-multiple={String(Boolean(props.multiple))}
      data-filter={String(props.filterByDossierType)}
    />
  ),
}))

import { EngagementParticipantsStep } from '../EngagementParticipantsStep'

function createMockForm(): UseFormReturn<EngagementFormData> {
  return {
    control: {} as UseFormReturn<EngagementFormData>['control'],
    watch: vi.fn().mockReturnValue([]),
    getValues: vi.fn(),
    setValue: vi.fn(),
  } as unknown as UseFormReturn<EngagementFormData>
}

describe('EngagementParticipantsStep', () => {
  it('renders exactly three DossierPicker instances', () => {
    const form = createMockForm()
    render(<EngagementParticipantsStep form={form} />)

    const pickers = screen.getAllByTestId('dossier-picker')
    expect(pickers.length).toBe(3)
  })

  it('each DossierPicker is in multi-select mode', () => {
    const form = createMockForm()
    render(<EngagementParticipantsStep form={form} />)

    const pickers = screen.getAllByTestId('dossier-picker')
    pickers.forEach((picker) => {
      expect(picker.getAttribute('data-multiple')).toBe('true')
    })
  })

  it('filterByDossierType is country, organization, person in JSX order', () => {
    const form = createMockForm()
    render(<EngagementParticipantsStep form={form} />)

    const pickers = screen.getAllByTestId('dossier-picker')
    expect(pickers[0].getAttribute('data-filter')).toBe('country')
    expect(pickers[1].getAttribute('data-filter')).toBe('organization')
    expect(pickers[2].getAttribute('data-filter')).toBe('person')
  })

  it('renders three section labels (countries, organizations, persons)', () => {
    const form = createMockForm()
    render(<EngagementParticipantsStep form={form} />)

    expect(screen.getAllByText('form-wizard:engagement.participants.countries_label').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('form-wizard:engagement.participants.organizations_label').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('form-wizard:engagement.participants.persons_label').length).toBeGreaterThanOrEqual(1)
  })

  it('renders optional section hint text', () => {
    const form = createMockForm()
    render(<EngagementParticipantsStep form={form} />)

    expect(screen.getByText('form-wizard:engagement.participants.section_hint')).toBeTruthy()
  })
})
