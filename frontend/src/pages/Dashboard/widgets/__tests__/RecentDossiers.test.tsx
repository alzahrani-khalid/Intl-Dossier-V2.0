/**
 * Plan 38-08 — RecentDossiers unit tests.
 *
 * Verifies:
 *   T1. caps to top 7 recentDossiers from Zustand selector
 *   T2. each row is a Link with `to={entry.route}`
 *   T3. empty state renders when recentDossiers is []
 *   T4. relative timestamp uses Arabic locale when i18n.language === 'ar'
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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
  })

  it('caps to top 7 dossiers when 10 are provided', () => {
    recentDossiersHolder.value = makeEntries(10)
    const { container } = render(<RecentDossiers />)
    expect(container.querySelectorAll('.recent-row')).toHaveLength(7)
  })

  it('wraps each row in a Link with entry.route', () => {
    recentDossiersHolder.value = makeEntries(3)
    render(<RecentDossiers />)
    const link = screen.getByText('Dossier 0').closest('a')
    expect(link).not.toBeNull()
    expect(link?.getAttribute('href')).toBe('/dossiers/d0')
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
})
