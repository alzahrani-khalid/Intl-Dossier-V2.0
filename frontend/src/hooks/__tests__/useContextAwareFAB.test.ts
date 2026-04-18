/**
 * useContextAwareFAB — creation target routing unit test (Plan 31-03, D-09)
 *
 * Exercises `handleCreateDossier` against every typed dossier list route and
 * a handful of non-typed routes. Typed lists must route context-direct to the
 * per-type wizard; non-typed routes must fall back to the hub; a caller-supplied
 * `onCreateDossier` callback must win over both.
 *
 * Notes:
 * - The project's test setup does NOT register `@testing-library/jest-dom`, so
 *   matchers like `.toHaveAttribute` are unavailable. Assertions use plain
 *   `.toHaveBeenCalledWith`, matching the pattern in `CreateDossierHub.test.tsx`.
 */
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mutable pathname the mocked `useLocation` will return on each call.
let currentPathname = '/dashboard'
const navigateMock = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useLocation: () => ({ pathname: currentPathname }),
  useNavigate: () => navigateMock,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}))

import { useContextAwareFAB } from '../useContextAwareFAB'

describe('useContextAwareFAB — creation target routing (D-09)', () => {
  beforeEach(() => {
    navigateMock.mockClear()
  })

  it.each([
    ['/dossiers/countries', '/dossiers/countries/create'],
    ['/dossiers/organizations', '/dossiers/organizations/create'],
    ['/dossiers/forums', '/dossiers/forums/create'],
    ['/dossiers/engagements', '/dossiers/engagements/create'],
    ['/dossiers/topics', '/dossiers/topics/create'],
    ['/dossiers/working_groups', '/dossiers/working_groups/create'],
    ['/dossiers/persons', '/dossiers/persons/create'],
    ['/dossiers/elected-officials', '/dossiers/elected-officials/create'],
  ])('routes %s → %s (context-direct per D-07 + D-09)', (from, to) => {
    currentPathname = from
    const { result } = renderHook(() => useContextAwareFAB())
    act(() => {
      // contextActions uses the matching route key when present; fall back to
      // the default action which also uses handleCreateDossier for non-keyed routes.
      const action = result.current.contextActions[from] ?? result.current.defaultAction
      action.onClick()
    })
    expect(navigateMock).toHaveBeenCalledWith({ to })
  })

  it.each(['/dashboard', '/tasks', '/notifications', '/dossiers/', '/search'])(
    'routes %s → /dossiers/create (hub fallback per D-08)',
    (from) => {
      currentPathname = from
      const { result } = renderHook(() => useContextAwareFAB())
      act(() => {
        result.current.defaultAction.onClick()
      })
      expect(navigateMock).toHaveBeenCalledWith({ to: '/dossiers/create' })
    },
  )

  it('invokes config.onCreateDossier callback instead of navigating when provided', () => {
    currentPathname = '/dossiers/countries'
    const onCreateDossier = vi.fn()
    const { result } = renderHook(() => useContextAwareFAB({ onCreateDossier }))
    act(() => {
      result.current.defaultAction.onClick()
    })
    expect(onCreateDossier).toHaveBeenCalledOnce()
    expect(navigateMock).not.toHaveBeenCalled()
  })
})
