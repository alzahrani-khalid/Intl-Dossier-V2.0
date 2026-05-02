/**
 * Phase 42-09 — SettingsLayout + SettingsNavigation reskin tests.
 *
 * Validates the handoff 240+1fr two-column chrome (R-02, D-09, D-12):
 *   - 9 nav rows in canonical order (R-02; not 7)
 *   - Active row uses `.settings-nav.active` (accent bar via index.css ::before)
 *   - Mobile pill row at ≤768px (className/structure check; the actual
 *     `overflow-x: auto` rule lives in index.css)
 *   - 44×44 touch targets (`min-height: 44px` inline style)
 *   - i18n key for security row → `nav.accessAndSecurity` (D-09 rename)
 *
 * The global i18n mock in tests/setup.ts returns `key` when no translation is
 * mapped, so we assert against the raw key strings (`nav.profile` etc.) rather
 * than localized text.
 */

import type { ReactElement } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SettingsLayout } from '../SettingsLayout'
import { SettingsNavigation } from '../SettingsNavigation'
import type { SettingsSectionId } from '@/types/settings.types'

function renderLayout(activeSection: SettingsSectionId = 'profile'): ReturnType<typeof render> {
  return render(
    (
      <SettingsLayout activeSection={activeSection} onSectionChange={vi.fn()}>
        <div data-testid="content">content</div>
      </SettingsLayout>
    ) as ReactElement,
  )
}

describe('SettingsLayout (Phase 42-09)', () => {
  it('renders a `.settings-layout` root with 240px+1fr CSS Grid', () => {
    const { container } = renderLayout()
    const root = container.querySelector('.settings-layout') as HTMLElement | null
    expect(root).not.toBeNull()
    expect(root!.style.gridTemplateColumns).toBe('240px 1fr')
    expect(root!.style.display).toBe('grid')
  })

  it('emits a `data-loading` attribute on the section root', () => {
    const { container } = renderLayout()
    const root = container.querySelector('.settings-layout') as HTMLElement
    expect(root.getAttribute('data-loading')).toBe('false')
  })

  it('renders a `.card-head` with `.card-title` + `.card-sub` above the children', () => {
    const { container } = renderLayout('appearance')
    expect(container.querySelector('.card-head .card-title')).not.toBeNull()
    expect(container.querySelector('.card-head .card-sub')).not.toBeNull()
    expect(screen.getByTestId('content')).not.toBeNull()
  })
})

describe('SettingsNavigation (Phase 42-09)', () => {
  it('renders exactly 9 nav rows in canonical R-02 order', () => {
    const { container } = render(
      <SettingsNavigation activeSection="profile" onChange={vi.fn()} />,
    )
    const rows = Array.from(container.querySelectorAll('button.settings-nav'))
    expect(rows.length).toBe(9)
    const ids = rows.map((r) => r.getAttribute('data-testid'))
    expect(ids).toEqual([
      'settings-nav-profile',
      'settings-nav-general',
      'settings-nav-appearance',
      'settings-nav-notifications',
      'settings-nav-security',
      'settings-nav-accessibility',
      'settings-nav-data-privacy',
      'settings-nav-email-digest',
      'settings-nav-integrations',
    ])
  })

  it('marks the active row with `.settings-nav.active` and aria-current="page"', () => {
    const { container } = render(
      <SettingsNavigation activeSection="appearance" onChange={vi.fn()} />,
    )
    const active = container.querySelector('button.settings-nav.active') as HTMLElement
    expect(active).not.toBeNull()
    expect(active.getAttribute('data-testid')).toBe('settings-nav-appearance')
    expect(active.getAttribute('aria-current')).toBe('page')
    const inactive = container.querySelector(
      'button.settings-nav[data-testid="settings-nav-profile"]',
    ) as HTMLElement
    expect(inactive.classList.contains('active')).toBe(false)
    expect(inactive.getAttribute('aria-current')).toBeNull()
  })

  it('every nav row has min-height: 44px (touch target)', () => {
    const { container } = render(
      <SettingsNavigation activeSection="profile" onChange={vi.fn()} />,
    )
    const rows = Array.from(container.querySelectorAll<HTMLElement>('button.settings-nav'))
    for (const row of rows) {
      expect(row.style.minHeight).toBe('44px')
    }
  })

  it('Security row uses i18n key `nav.accessAndSecurity` (D-09 rename)', () => {
    const { container } = render(
      <SettingsNavigation activeSection="security" onChange={vi.fn()} />,
    )
    const securityRow = container.querySelector(
      'button[data-testid="settings-nav-security"]',
    ) as HTMLElement
    // The global i18n mock returns the raw key when unmapped; the SettingsNavigation
    // component is wired with the `settings` namespace, so the rendered text is
    // `nav.accessAndSecurity`.
    expect(securityRow.textContent).toContain('nav.accessAndSecurity')
  })

  it('renders inside a `.settings-nav-card` shell (mobile pill row target)', () => {
    const { container } = render(
      <SettingsNavigation activeSection="profile" onChange={vi.fn()} />,
    )
    // The @media (max-width: 768px) rule in index.css turns this card into the
    // horizontal pill row — the component must expose the className target.
    const navCard = container.querySelector('nav.settings-nav-card') as HTMLElement
    expect(navCard).not.toBeNull()
    expect(navCard.classList.contains('card')).toBe(true)
  })
})
