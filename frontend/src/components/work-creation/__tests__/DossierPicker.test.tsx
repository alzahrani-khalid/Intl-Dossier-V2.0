/**
 * DossierPicker tests
 * Feature: 29-complex-type-wizards (multi-select extension)
 *
 * Covers:
 * - Single-select regression (onChange signature unchanged)
 * - Multi-select chip render, remove, dedup, array filterByDossierType
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'

// ---------- Mocks ----------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultOrOpts?: unknown, maybeOpts?: unknown) => {
      // t('chip.remove', { name, defaultValue: 'Remove ${name}' }) → return defaultValue
      if (
        typeof defaultOrOpts === 'object' &&
        defaultOrOpts !== null &&
        'defaultValue' in (defaultOrOpts as Record<string, unknown>)
      ) {
        return (defaultOrOpts as { defaultValue: string }).defaultValue
      }
      if (typeof defaultOrOpts === 'string') return defaultOrOpts
      if (
        typeof maybeOpts === 'object' &&
        maybeOpts !== null &&
        'defaultValue' in (maybeOpts as Record<string, unknown>)
      ) {
        return (maybeOpts as { defaultValue: string }).defaultValue
      }
      return key
    },
    i18n: { language: 'en' },
  }),
}))

vi.mock('@/hooks/useDirection', () => ({
  useDirection: () => ({ direction: 'ltr', isRTL: false }),
}))

// Capture autocompleteDossiers return for driving search results
const autocompleteMock = vi.fn()
vi.mock('@/services/search-api', () => ({
  autocompleteDossiers: (...args: unknown[]) => autocompleteMock(...args),
}))

// Pass-through UI primitives so we can drive CommandItem onSelect callbacks directly
vi.mock('@/components/ui/command', () => ({
  Command: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CommandEmpty: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CommandGroup: ({ children, heading }: { children: ReactNode; heading?: string }) => (
    <div>
      {heading != null && <div data-testid="cmd-heading">{heading}</div>}
      {children}
    </div>
  ),
  CommandInput: ({
    value,
    onValueChange,
    placeholder,
  }: {
    value?: string
    onValueChange?: (v: string) => void
    placeholder?: string
  }) => (
    <input
      aria-label="search"
      placeholder={placeholder}
      value={value ?? ''}
      onChange={(e) => onValueChange?.(e.target.value)}
    />
  ),
  CommandItem: ({
    children,
    onSelect,
    value,
  }: {
    children: ReactNode
    onSelect?: () => void
    value?: string
  }) => (
    <button type="button" data-testid={`cmd-item-${value ?? ''}`} onClick={() => onSelect?.()}>
      {children}
    </button>
  ),
  CommandList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PopoverContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    type,
  }: {
    children: ReactNode
    onClick?: () => void
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
  }) => (
    <button type={type ?? 'button'} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}))

// localStorage stub (jsdom has one but clear between tests)
beforeEach(() => {
  autocompleteMock.mockReset()
  autocompleteMock.mockResolvedValue({ suggestions: [] })
  localStorage.clear()
})

import { DossierPicker, type DossierOption } from '../DossierPicker'

// ---------- Fixtures ----------

const france: DossierOption = {
  id: 'fra-uuid',
  name_en: 'France',
  name_ar: 'فرنسا',
  type: 'country',
  status: 'active',
}
const japan: DossierOption = {
  id: 'jpn-uuid',
  name_en: 'Japan',
  name_ar: 'اليابان',
  type: 'country',
  status: 'active',
}
const oecd: DossierOption = {
  id: 'oecd-uuid',
  name_en: 'OECD',
  name_ar: 'منظمة التعاون',
  type: 'organization',
  status: 'active',
}

// ---------- Single-select regression ----------

describe('DossierPicker — single-select regression', () => {
  it('calls onChange(id, dossier) when a recent dossier CommandItem is selected', async () => {
    // Seed recents so the picker renders a clickable CommandItem without requiring search
    localStorage.setItem(
      'recent_dossiers_for_work_creation',
      JSON.stringify([france]),
    )
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<DossierPicker onChange={onChange} filterByDossierType="country" />)

    const item = screen.getByTestId('cmd-item-fra-uuid')
    await user.click(item)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(
      'fra-uuid',
      expect.objectContaining({ id: 'fra-uuid', name_en: 'France' }),
    )
  })

  it('renders selected-dossier card with name when selectedDossier prop provided', () => {
    render(
      <DossierPicker
        value="fra-uuid"
        selectedDossier={france}
        onChange={vi.fn()}
      />,
    )
    expect(screen.getByText('France')).toBeTruthy()
  })
})

// ---------- Multi-select ----------

describe('DossierPicker — multi-select', () => {
  it('renders one chip per selected dossier with its localized name', () => {
    render(
      <DossierPicker
        multiple
        values={[france.id, japan.id, oecd.id]}
        selectedDossiers={[france, japan, oecd]}
        onValuesChange={vi.fn()}
        filterByDossierType={['country', 'organization']}
      />,
    )
    expect(screen.getByText('France')).toBeTruthy()
    expect(screen.getByText('Japan')).toBeTruthy()
    expect(screen.getByText('OECD')).toBeTruthy()
  })

  it('calls onValuesChange with remaining ids when a chip ✕ is clicked', async () => {
    const onValuesChange = vi.fn()
    const user = userEvent.setup()
    render(
      <DossierPicker
        multiple
        values={[france.id, japan.id]}
        selectedDossiers={[france, japan]}
        onValuesChange={onValuesChange}
        filterByDossierType="country"
      />,
    )

    const removeFrance = screen.getByRole('button', { name: /remove france/i })
    await user.click(removeFrance)

    expect(onValuesChange).toHaveBeenCalledTimes(1)
    expect(onValuesChange).toHaveBeenCalledWith([japan.id], [japan])
  })

  it('dedupes: selecting an already-selected dossier does not fire onValuesChange', async () => {
    // Seed recents with France so the CommandItem for France is clickable.
    localStorage.setItem(
      'recent_dossiers_for_work_creation',
      JSON.stringify([france]),
    )
    const onValuesChange = vi.fn()
    const user = userEvent.setup()
    render(
      <DossierPicker
        multiple
        values={[france.id]}
        selectedDossiers={[france]}
        onValuesChange={onValuesChange}
        filterByDossierType="country"
      />,
    )

    // Click the already-selected France row — dedupe should kick in
    const item = screen.getByTestId('cmd-item-fra-uuid')
    await user.click(item)

    expect(onValuesChange).not.toHaveBeenCalled()
  })

  it('accepts filterByDossierType as an array without type/runtime errors', () => {
    const { container } = render(
      <DossierPicker
        multiple
        values={[]}
        selectedDossiers={[]}
        onValuesChange={vi.fn()}
        filterByDossierType={['country', 'organization']}
      />,
    )
    expect(container).toBeTruthy()
  })

  it('filters recents by the array of types (only matching types appear as items)', () => {
    // Seed recents with one country, one organization, one person
    const person: DossierOption = {
      id: 'person-uuid',
      name_en: 'John Doe',
      name_ar: 'جون دو',
      type: 'person',
      status: 'active',
    }
    localStorage.setItem(
      'recent_dossiers_for_work_creation',
      JSON.stringify([france, oecd, person]),
    )

    render(
      <DossierPicker
        multiple
        values={[]}
        selectedDossiers={[]}
        onValuesChange={vi.fn()}
        filterByDossierType={['country', 'organization']}
      />,
    )

    // Country + organization should render as CommandItems; person should NOT
    expect(screen.queryByTestId('cmd-item-fra-uuid')).toBeTruthy()
    expect(screen.queryByTestId('cmd-item-oecd-uuid')).toBeTruthy()
    expect(screen.queryByTestId('cmd-item-person-uuid')).toBeNull()
  })

  it('appends dossier to values and fires onValuesChange on new selection', async () => {
    // Seed recents with Japan; current values already has France
    localStorage.setItem(
      'recent_dossiers_for_work_creation',
      JSON.stringify([japan]),
    )
    const onValuesChange = vi.fn()
    const user = userEvent.setup()
    render(
      <DossierPicker
        multiple
        values={[france.id]}
        selectedDossiers={[france]}
        onValuesChange={onValuesChange}
        filterByDossierType="country"
      />,
    )

    const item = screen.getByTestId('cmd-item-jpn-uuid')
    await user.click(item)

    expect(onValuesChange).toHaveBeenCalledTimes(1)
    expect(onValuesChange).toHaveBeenCalledWith(
      [france.id, japan.id],
      [france, japan],
    )
  })
})
