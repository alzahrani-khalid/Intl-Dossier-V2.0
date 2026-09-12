/**
 * Phase 92 / AUTH-01 + AUTH-03 — the SIGNED_OUT seam's teardown contract (D-29).
 *
 * This asserts the CACHE IS EMPTY, not merely that the route changed. The route
 * assertion alone would pass over a leak: three sign-out paths soft-navigate now, and
 * a soft navigation leaves the previous user's rows resident for gcTime (10 min) and
 * served without refetch for staleTime (5 min).
 *
 * The production SIGNED_OUT branch clears the in-memory query cache and all localStorage
 * residue except the explicit, identity-neutral machine-preference allowlist. Unrelated
 * auth events leave both cache and browser storage untouched.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Hoisted so the spy exists before vi.mock's hoisted factory runs. The seam reaches the
// router through a DYNAMIC import (D-25), so this mock is what that import resolves to.
const { navigateSpy } = vi.hoisted(() => ({ navigateSpy: vi.fn() }))
vi.mock('@/router', () => ({ router: { navigate: navigateSpy } }))

import { queryClient } from '@/lib/query-client'
import { useAuthStore } from './authStore'

const ALLOWLISTED_STORAGE = {
  'id.locale': 'ar',
  'id.theme': 'dark',
  'id.density': 'compact',
  'id.dir': 'rtl',
  i18nextLng: 'ar',
}

const SEEDED_STORAGE = {
  ...ALLOWLISTED_STORAGE,
  'auth-storage': 'previous-auth',
  'dossier-store': 'previous-dossier',
  'entity-history-storage': 'previous-history',
  'pinned-entities-storage': 'previous-pins',
  'ui-storage': 'previous-ui-state',
  'advanced-search-history': 'previous-searches',
  quickswitcher_recent_items: 'previous-recents',
  'recent-navigation': 'previous-navigation',
  'dossier-picker-recents': 'previous-picker-recents',
  'view-preferences:country:42': 'previous-view-preferences',
}

function seedStorage(): void {
  for (const [key, value] of Object.entries(SEEDED_STORAGE)) {
    localStorage.setItem(key, value)
  }
}

function enumerateStorage(): Record<string, string> {
  return Object.fromEntries(
    Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
      .filter((key): key is string => key !== null)
      .sort()
      .map((key) => [key, localStorage.getItem(key) as string]),
  )
}

describe('authStore SIGNED_OUT teardown', () => {
  beforeEach(() => {
    navigateSpy.mockClear()
    queryClient.clear()
    localStorage.clear()
  })

  it('empties the in-memory query cache and navigates to /login', async () => {
    queryClient.setQueryData(['phase-92-probe', 'previous-user-rows'], [{ id: 'row-1' }])
    expect(queryClient.getQueryCache().getAll()).toHaveLength(1)

    await useAuthStore.getState().handleAuthStateChange('SIGNED_OUT', null)

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
    // The navigation rides a dynamic import, so it lands a microtask later.
    await vi.waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith({ to: '/login' })
    })
  })

  it('leaves the cache alone for unrelated auth events', async () => {
    queryClient.setQueryData(['phase-92-probe', 'still-signed-in'], [{ id: 'row-1' }])

    await useAuthStore.getState().handleAuthStateChange('PASSWORD_RECOVERY', null)

    expect(queryClient.getQueryCache().getAll()).toHaveLength(1)
    expect(navigateSpy).not.toHaveBeenCalled()
  })

  it('enumerated browser storage after the SIGNED_OUT handler equals the allowlisted key/value map exactly', async () => {
    seedStorage()

    await useAuthStore.getState().handleAuthStateChange('SIGNED_OUT', null)

    expect(enumerateStorage()).toEqual(ALLOWLISTED_STORAGE)
  })

  it('an auth event other than SIGNED_OUT leaves every seeded key at its seeded value', async () => {
    seedStorage()

    await useAuthStore.getState().handleAuthStateChange('PASSWORD_RECOVERY', null)

    expect(enumerateStorage()).toEqual(SEEDED_STORAGE)
  })
})
