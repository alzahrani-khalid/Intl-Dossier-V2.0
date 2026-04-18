/**
 * TourableEmptyState — targetType routing unit test (Plan 31-03, D-07 + D-08)
 *
 * Verifies the primary-action precedence:
 *   1. caller-supplied `onCreate`  → wins
 *   2. `targetType` alone          → navigates to per-type wizard
 *   3. neither set                 → no primary action button (informational state)
 *
 * Notes:
 * - The project test setup does NOT register `@testing-library/jest-dom`.
 *   Assertions use plain DOM queries (`getByRole`, `querySelector`) with
 *   `.toBe()` / `.toBeUndefined()`, matching `CreateDossierHub.test.tsx`.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const navigateMock = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
  // Minimal Link stub in case TourTrigger renders a router link.
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('react-i18next', () => ({
  // Echo the key back verbatim — deterministic, and avoids the `t(key, { defaultValue: t(other) })`
  // ambiguity where the inner call would otherwise be used as the label.
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
  // Frontend's real i18n setup calls `.use(initReactI18next)`; expose a no-op
  // so src/i18n/index.ts doesn't crash when pulled in transitively.
  initReactI18next: { type: '3rdParty', init: () => {} },
  Trans: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Stub TourTrigger to sidestep its TourContext/provider deps — the test cares
// only about the primary-action routing behavior.
vi.mock('@/components/guided-tours', () => ({
  TourTrigger: () => null,
}))

// EmptyState pulls useDirection → useLanguage → LanguageProvider; stub it so
// the test doesn't require a provider wrapper.
vi.mock('@/hooks/useDirection', () => ({
  useDirection: () => ({ isRTL: false, direction: 'ltr' as const, locale: 'en' }),
}))

import { TourableEmptyState } from '../TourableEmptyState'

describe('TourableEmptyState — targetType routing (D-07 + D-08)', () => {
  beforeEach(() => {
    navigateMock.mockClear()
  })

  it('routes to per-type wizard when targetType is set and onCreate is not', () => {
    render(<TourableEmptyState entityType="country" targetType="country" />)
    const button = screen.getByRole('button', { name: /list\.country\.create/i })
    fireEvent.click(button)
    expect(navigateMock).toHaveBeenCalledTimes(1)
    expect(navigateMock).toHaveBeenCalledWith({ to: '/dossiers/countries/create' })
  })

  it('routes to elected-officials wizard when targetType is elected_official', () => {
    render(<TourableEmptyState entityType="person" targetType="elected_official" />)
    const button = screen.getByRole('button', { name: /list\.person\.create/i })
    fireEvent.click(button)
    expect(navigateMock).toHaveBeenCalledWith({ to: '/dossiers/elected-officials/create' })
  })

  it('defers to caller-supplied onCreate over targetType (onCreate wins)', () => {
    const onCreate = vi.fn()
    render(
      <TourableEmptyState entityType="country" targetType="country" onCreate={onCreate} />,
    )
    const button = screen.getByRole('button', { name: /list\.country\.create/i })
    fireEvent.click(button)
    expect(onCreate).toHaveBeenCalledTimes(1)
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('renders no primary action button when neither onCreate nor targetType is set', () => {
    render(<TourableEmptyState entityType="dossier" />)
    // Primary "create" button is absent when no creation handler resolved.
    const button = screen.queryByRole('button', { name: /list\.dossier\.create/i })
    expect(button).toBeNull()
  })
})
