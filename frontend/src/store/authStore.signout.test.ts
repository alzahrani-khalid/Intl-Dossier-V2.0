/**
 * Phase 92 / AUTH-01 + AUTH-03 — the SIGNED_OUT seam's teardown contract (D-29).
 *
 * This asserts the CACHE IS EMPTY, not merely that the route changed. The route
 * assertion alone would pass over a leak: three sign-out paths soft-navigate now, and
 * a soft navigation leaves the previous user's rows resident for gcTime (10 min) and
 * served without refetch for staleTime (5 min).
 *
 * BOUNDED CLAIM (D-30): `queryClient.clear()` empties the IN-MEMORY query cache only.
 * Persisted localStorage residue (auth-storage, entity-history-storage, ui-storage,
 * pinned-entities-storage, dossier-store, advanced-search-history,
 * quickswitcher_recent_items) is a pre-existing leak filed as CLIENTSEC-01 and owned by
 * Phase 100. A green here must NOT be read as "client-side residue cleared".
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Hoisted so the spy exists before vi.mock's hoisted factory runs. The seam reaches the
// router through a DYNAMIC import (D-25), so this mock is what that import resolves to.
const { navigateSpy } = vi.hoisted(() => ({ navigateSpy: vi.fn() }))
vi.mock('@/router', () => ({ router: { navigate: navigateSpy } }))

import { queryClient } from '@/lib/query-client'
import { useAuthStore } from './authStore'

describe('authStore SIGNED_OUT teardown', () => {
  beforeEach(() => {
    navigateSpy.mockClear()
    queryClient.clear()
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
})
