/**
 * DrawerHead — Wave 1 (Phase 41 plan 02 Task 1) unit tests.
 *
 * Behavior contract per 41-02-PLAN.md:
 *   1. sensitivity_level === 4 → DOSSIER + CONFIDENTIAL chips
 *   2. sensitivity_level === 3 → DOSSIER + CONFIDENTIAL chips (threshold >= 3)
 *   3. sensitivity_level === 2 → only DOSSIER chip
 *   4. sensitivity_level undefined → only DOSSIER chip
 *   5. AR locale + name_ar non-empty → renders name_ar; empty/null → falls back to name_en
 *   6. close button has aria-label = t('cta.close') and 44x44 inline minBlock/Inline size
 *   7. clicking close calls props.onClose once
 *   8. head element has class "drawer-head"; title element has class "drawer-title"
 */
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ReactElement } from 'react'

let currentLang = 'en'

vi.mock('react-i18next', () => ({
  useTranslation: (): {
    t: (k: string) => string
    i18n: { language: string }
  } => ({
    t: (k: string): string => k,
    i18n: { language: currentLang },
  }),
  Trans: ({ children }: { children: React.ReactNode }): React.ReactNode => children,
}))

const dossierState: { data: unknown } = { data: undefined }
const overviewState: { data: unknown } = { data: undefined }

vi.mock('@/hooks/useDossier', () => ({
  useDossier: (): { data: unknown } => ({ data: dossierState.data }),
}))

vi.mock('@/hooks/useDossierOverview', () => ({
  useDossierOverview: (): { data: unknown } => ({ data: overviewState.data }),
}))

vi.mock('../DrawerMetaStrip', () => ({
  DrawerMetaStrip: (): ReactElement => <div data-testid="meta-strip-mock" />,
}))

vi.mock('../DrawerCtaRow', () => ({
  DrawerCtaRow: (): ReactElement => <div data-testid="cta-row-mock" />,
}))

import { DrawerHead } from '../DrawerHead'

describe('DrawerHead (Wave 1)', () => {
  beforeEach(() => {
    currentLang = 'en'
    dossierState.data = undefined
    overviewState.data = undefined
  })
  afterEach(() => {
    cleanup()
  })

  it('renders DOSSIER + CONFIDENTIAL chips when sensitivity_level === 4', () => {
    dossierState.data = {
      id: 'd1',
      name_en: 'Saudi Arabia',
      name_ar: null,
      type: 'country',
      sensitivity_level: 4,
      updated_at: '2026-05-01T00:00:00Z',
    }
    render(<DrawerHead dossierId="d1" dossierType="country" onClose={vi.fn()} />)
    expect(screen.getByText('chip.dossier')).toBeTruthy()
    expect(screen.getByTestId('confidential-chip')).toBeTruthy()
  })

  it('renders both chips at sensitivity_level === 3 (threshold >= 3)', () => {
    dossierState.data = {
      id: 'd1',
      name_en: 'Saudi Arabia',
      name_ar: null,
      type: 'country',
      sensitivity_level: 3,
      updated_at: '2026-05-01T00:00:00Z',
    }
    render(<DrawerHead dossierId="d1" dossierType="country" onClose={vi.fn()} />)
    expect(screen.getByTestId('confidential-chip')).toBeTruthy()
  })

  it('renders only DOSSIER chip at sensitivity_level === 2', () => {
    dossierState.data = {
      id: 'd1',
      name_en: 'Saudi Arabia',
      name_ar: null,
      type: 'country',
      sensitivity_level: 2,
      updated_at: '2026-05-01T00:00:00Z',
    }
    render(<DrawerHead dossierId="d1" dossierType="country" onClose={vi.fn()} />)
    expect(screen.getByText('chip.dossier')).toBeTruthy()
    expect(screen.queryByTestId('confidential-chip')).toBeNull()
  })

  it('renders only DOSSIER chip when sensitivity_level is undefined', () => {
    dossierState.data = {
      id: 'd1',
      name_en: 'Saudi Arabia',
      name_ar: null,
      type: 'country',
      updated_at: '2026-05-01T00:00:00Z',
    }
    render(<DrawerHead dossierId="d1" dossierType="country" onClose={vi.fn()} />)
    expect(screen.getByText('chip.dossier')).toBeTruthy()
    expect(screen.queryByTestId('confidential-chip')).toBeNull()
  })

  it('renders name_ar under AR when non-empty, falls back to name_en when empty', () => {
    // EN baseline
    currentLang = 'en'
    dossierState.data = {
      id: 'd1',
      name_en: 'Saudi Arabia',
      name_ar: 'المملكة العربية السعودية',
      type: 'country',
      sensitivity_level: 1,
      updated_at: '2026-05-01T00:00:00Z',
    }
    const { container: enContainer } = render(
      <DrawerHead dossierId="d1" dossierType="country" onClose={vi.fn()} />,
    )
    expect(enContainer.querySelector('.drawer-title')?.textContent).toBe('Saudi Arabia')
    cleanup()

    // AR with non-empty name_ar
    currentLang = 'ar'
    const { container: arContainer } = render(
      <DrawerHead dossierId="d1" dossierType="country" onClose={vi.fn()} />,
    )
    expect(arContainer.querySelector('.drawer-title')?.textContent).toBe('المملكة العربية السعودية')
    cleanup()

    // AR with empty name_ar → fallback to name_en
    currentLang = 'ar'
    dossierState.data = {
      id: 'd1',
      name_en: 'Saudi Arabia',
      name_ar: '',
      type: 'country',
      sensitivity_level: 1,
      updated_at: '2026-05-01T00:00:00Z',
    }
    const { container: arEmpty } = render(
      <DrawerHead dossierId="d1" dossierType="country" onClose={vi.fn()} />,
    )
    expect(arEmpty.querySelector('.drawer-title')?.textContent).toBe('Saudi Arabia')
  })

  it('close button has aria-label t("cta.close") and 44×44 inline sizing', () => {
    dossierState.data = {
      id: 'd1',
      name_en: 'X',
      name_ar: null,
      type: 'country',
      sensitivity_level: 1,
      updated_at: '2026-05-01T00:00:00Z',
    }
    render(<DrawerHead dossierId="d1" dossierType="country" onClose={vi.fn()} />)
    const btn = screen.getByRole('button', { name: 'cta.close' })
    expect(btn).toBeTruthy()
    expect((btn as HTMLButtonElement).style.minBlockSize).toBe('44px')
    expect((btn as HTMLButtonElement).style.minInlineSize).toBe('44px')
  })

  it('clicking close button calls onClose once', () => {
    dossierState.data = {
      id: 'd1',
      name_en: 'X',
      name_ar: null,
      type: 'country',
      sensitivity_level: 1,
      updated_at: '2026-05-01T00:00:00Z',
    }
    const onClose = vi.fn()
    render(<DrawerHead dossierId="d1" dossierType="country" onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'cta.close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('emits classnames "drawer-head" on container and "drawer-title" on title element', () => {
    dossierState.data = {
      id: 'd1',
      name_en: 'Saudi Arabia',
      name_ar: null,
      type: 'country',
      sensitivity_level: 1,
      updated_at: '2026-05-01T00:00:00Z',
    }
    const { container } = render(
      <DrawerHead dossierId="d1" dossierType="country" onClose={vi.fn()} />,
    )
    expect(container.querySelector('.drawer-head')).not.toBeNull()
    expect(container.querySelector('.drawer-title')).not.toBeNull()
  })
})
