import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { UseFormReturn } from 'react-hook-form'
import type { ForumFormData } from '../../schemas/forum.schema'

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

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder: string }) => <span>{placeholder}</span>,
}))

vi.mock('@/components/work-creation/DossierPicker', () => ({
  DossierPicker: (props: Record<string, unknown>) => (
    <div
      data-testid="dossier-picker"
      data-filter={String(props.filterByDossierType)}
      data-placeholder={String(props.placeholder)}
    />
  ),
}))

import { ForumDetailsStep } from '../ForumDetailsStep'

function createMockForm(): UseFormReturn<ForumFormData> {
  return {
    control: {} as UseFormReturn<ForumFormData>['control'],
    watch: vi.fn().mockReturnValue(''),
    getValues: vi.fn(),
    setValue: vi.fn(),
  } as unknown as UseFormReturn<ForumFormData>
}

describe('ForumDetailsStep', () => {
  it('renders forum_type label and organizing body label', () => {
    const form = createMockForm()
    render(<ForumDetailsStep form={form} />)

    expect(screen.getByText('form-wizard:forum.forum_type_label')).toBeTruthy()
    expect(screen.getByText('form-wizard:forum.organizing_body_label')).toBeTruthy()
    expect(screen.getByText('form-wizard:forum.organizing_body_help')).toBeTruthy()
  })

  it('renders all 4 forum_type options', () => {
    const form = createMockForm()
    render(<ForumDetailsStep form={form} />)

    const options = screen.getAllByRole('option')
    expect(options.length).toBe(4)
    expect(screen.getByText('form-wizard:forum.forum_types.conference')).toBeTruthy()
    expect(screen.getByText('form-wizard:forum.forum_types.seminar')).toBeTruthy()
    expect(screen.getByText('form-wizard:forum.forum_types.workshop')).toBeTruthy()
    expect(screen.getByText('form-wizard:forum.forum_types.summit')).toBeTruthy()
  })

  it('mounts DossierPicker filtered to organization dossiers', () => {
    const form = createMockForm()
    render(<ForumDetailsStep form={form} />)

    const picker = screen.getByTestId('dossier-picker')
    expect(picker).toBeTruthy()
    expect(picker.getAttribute('data-filter')).toBe('organization')
    expect(picker.getAttribute('data-placeholder')).toBe(
      'form-wizard:forum.organizing_body_placeholder',
    )
  })
})
