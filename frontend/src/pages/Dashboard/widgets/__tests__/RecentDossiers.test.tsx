/**
 * RecentDossiers unit tests.
 *
 * Phase 38 origin (T1–T4) + Phase 41 plan 06 additions:
 *   T5. clicking a row invokes openDossier({id, type}) (NOT navigates via Link)
 *   T6. each row trigger is a <button> (not <a>) and surfaces an aria-label
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ReactNode } from 'react'

// --- mocks must be declared before component import (vi hoists vi.mock) ---

vi.mock('@/components/signature-visuals', () => ({
  DossierGlyph: (): JSX.Element => <span data-testid="glyph" />,
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    className,
  }: {
    to: string
    children: ReactNode
    className?: string
  }): JSX.Element => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}))

const recentDossiersHolder: { value: Array<Record<string, unknown>> } = { value: [] }

vi.mock('@/store/dossierStore', () => ({
  useDossierStore: (selector: (s: unknown) => unknown): unknown =>
    selector({ recentDossiers: recentDossiersHolder.value }),
}))

const i18nLanguageHolder: { value: string } = { value: 'en' }

vi.mock('react-i18next', () => ({
  useTranslation: (): { t: (k: string) => string; i18n: { language: string } } => ({
    t: (k: string): string => k,
    i18n: { language: i18nLanguageHolder.value },
  }),
}))

const openDossierMock = vi.fn()
vi.mock('@/hooks/useDossierDrawer', () => ({
  useDossierDrawer: (): {
    openDossier: typeof openDossierMock
    closeDossier: () => void
    open: boolean
    dossierId: string | null
    dossierType: string | null
  } => ({
    openDossier: openDossierMock,
    closeDossier: vi.fn(),
    open: false,
    dossierId: null,
    dossierType: null,
  }),
}))

import { RecentDossiers } from '../RecentDossiers'

function makeEntries(n: number): Array<Record<string, unknown>> {
  return Array.from({ length: n }, (_, i) => ({
    id: `d${i}`,
    name_en: `Dossier ${i}`,
    name_ar: `ملف ${i}`,
    type: 'country',
    iso: 'sa',
    route: `/dossiers/d${i}`,
    viewedAt: Date.now() - i * 3600_000,
  }))
}

describe('RecentDossiers', () => {
  beforeEach(() => {
    i18nLanguageHolder.value = 'en'
    openDossierMock.mockReset()
  })

  it('caps to top 7 dossiers when 10 are provided', () => {
    recentDossiersHolder.value = makeEntries(10)
    const { container } = render(<RecentDossiers />)
    expect(container.querySelectorAll('.recent-row')).toHaveLength(7)
  })

  it('renders each row as a <button> (not <a>)', () => {
    recentDossiersHolder.value = makeEntries(3)
    render(<RecentDossiers />)
    const triggers = screen.getAllByTestId('recent-dossier-trigger')
    expect(triggers).toHaveLength(3)
    triggers.forEach((el): void => {
      expect(el.tagName).toBe('BUTTON')
      expect(el.getAttribute('type')).toBe('button')
    })
  })

  it('renders empty state when recentDossiers is empty', () => {
    recentDossiersHolder.value = []
    render(<RecentDossiers />)
    expect(screen.getByText('recent.empty')).toBeTruthy()
  })

  it('uses Arabic name when i18n.language === "ar"', () => {
    i18nLanguageHolder.value = 'ar'
    recentDossiersHolder.value = makeEntries(2)
    render(<RecentDossiers />)
    expect(screen.getByText('ملف 0')).toBeTruthy()
  })

  it('clicking a row calls openDossier({id, type}) with the entry data', () => {
    recentDossiersHolder.value = makeEntries(2)
    render(<RecentDossiers />)
    const triggers = screen.getAllByTestId('recent-dossier-trigger')
    fireEvent.click(triggers[0]!)
    expect(openDossierMock).toHaveBeenCalledTimes(1)
    expect(openDossierMock).toHaveBeenCalledWith({ id: 'd0', type: 'country' })
  })

  it('each trigger has an aria-label identifying the dossier', () => {
    recentDossiersHolder.value = makeEntries(1)
    render(<RecentDossiers />)
    const trigger = screen.getByTestId('recent-dossier-trigger')
    expect(trigger.getAttribute('aria-label')).toBe('Dossier 0')
  })
})
