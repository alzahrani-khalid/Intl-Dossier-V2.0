import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { AnchorHTMLAttributes, ReactNode } from 'react'

// Mock react-i18next to echo translation keys back verbatim — isolates the hub
// from i18n loading while keeping every key assertion meaningful.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}))

// Mock TanStack Router Link so the hub renders without a RouterProvider. The
// Link component is used purely for its `to` attribute in this test — map `to`
// to `href` on a plain anchor so `.closest('a')` + `href` assertions work.
vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    ...rest
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string; children: ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}))

import { CreateDossierHub } from '../CreateDossierHub'

describe('CreateDossierHub', () => {
  it('renders 8 dossier type cards in DOSSIER_TYPES enum order', () => {
    render(<CreateDossierHub />)
    const cards = screen.getAllByTestId(/^hub-card-/)
    expect(cards).toHaveLength(8)
    expect(cards.map((c) => c.getAttribute('data-testid'))).toEqual([
      'hub-card-country',
      'hub-card-organization',
      'hub-card-forum',
      'hub-card-engagement',
      'hub-card-topic',
      'hub-card-working_group',
      'hub-card-person',
      'hub-card-elected_official',
    ])
  })

  it('each card links to its per-type wizard route', () => {
    render(<CreateDossierHub />)
    expect(screen.getByTestId('hub-card-country').getAttribute('href')).toBe(
      '/dossiers/countries/create',
    )
    expect(screen.getByTestId('hub-card-organization').getAttribute('href')).toBe(
      '/dossiers/organizations/create',
    )
    expect(screen.getByTestId('hub-card-elected_official').getAttribute('href')).toBe(
      '/dossiers/elected-officials/create',
    )
    expect(screen.getByTestId('hub-card-working_group').getAttribute('href')).toBe(
      '/dossiers/working_groups/create',
    )
    expect(screen.getByTestId('hub-card-person').getAttribute('href')).toBe(
      '/dossiers/persons/create',
    )
  })

  it('uses logical Tailwind properties only (no ml-/mr-/text-left/text-right in className props)', () => {
    const { container } = render(<CreateDossierHub />)
    const html = container.innerHTML
    // Physical directional classes would break RTL — forbidden per CLAUDE.md
    expect(html).not.toMatch(/\bml-\d/)
    expect(html).not.toMatch(/\bmr-\d/)
    expect(html).not.toMatch(/\btext-left\b/)
    expect(html).not.toMatch(/\btext-right\b/)
    expect(html).not.toMatch(/\bpl-\d/)
    expect(html).not.toMatch(/\bpr-\d/)
  })
})
