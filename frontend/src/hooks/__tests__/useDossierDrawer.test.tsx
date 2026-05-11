/**
 * useDossierDrawer — Wave 0 (Phase 41) hook unit tests.
 * Mocks @tanstack/react-router so navigate/search reflect controlled state.
 */
import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const navigateMock = vi.fn()
let searchValue: Record<string, unknown> = {}

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
  useSearch: () => searchValue,
}))

import { useDossierDrawer } from '../useDossierDrawer'

describe('useDossierDrawer', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    searchValue = {}
  })

  it('returns closed state with no dossier param', () => {
    searchValue = {}
    const { result } = renderHook(() => useDossierDrawer())
    expect(result.current.open).toBe(false)
    expect(result.current.dossierId).toBeNull()
    expect(result.current.dossierType).toBeNull()
  })

  it('returns open state when dossier and dossierType are present', () => {
    searchValue = { dossier: 'abc', dossierType: 'country' }
    const { result } = renderHook(() => useDossierDrawer())
    expect(result.current.open).toBe(true)
    expect(result.current.dossierId).toBe('abc')
    expect(result.current.dossierType).toBe('country')
  })

  it('openDossier navigates with merged search params and replace=false', () => {
    searchValue = { foo: 'bar' }
    const { result } = renderHook(() => useDossierDrawer())
    result.current.openDossier({ id: 'x', type: 'organization' })
    expect(navigateMock).toHaveBeenCalledTimes(1)
    const call = navigateMock.mock.calls[0][0] as {
      search: (prev: Record<string, unknown>) => Record<string, unknown>
      replace: boolean
    }
    expect(call.replace).toBe(false)
    const next = call.search({ foo: 'bar' })
    expect(next).toEqual({ foo: 'bar', dossier: 'x', dossierType: 'organization' })
  })

  it('closeDossier strips dossier and dossierType, preserves rest, replace=true', () => {
    searchValue = { dossier: 'abc', dossierType: 'country', other: 'keep' }
    const { result } = renderHook(() => useDossierDrawer())
    result.current.closeDossier()
    expect(navigateMock).toHaveBeenCalledTimes(1)
    const call = navigateMock.mock.calls[0][0] as {
      search: (prev: Record<string, unknown>) => Record<string, unknown>
      replace: boolean
    }
    expect(call.replace).toBe(true)
    const next = call.search({ dossier: 'abc', dossierType: 'country', other: 'keep' })
    expect(next).toEqual({ other: 'keep' })
    expect(next).not.toHaveProperty('dossier')
    expect(next).not.toHaveProperty('dossierType')
  })
})
