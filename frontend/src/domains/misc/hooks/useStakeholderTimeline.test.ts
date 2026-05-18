/**
 * Phase 56 / TYPE-05 - useStakeholderInteractionMutations typed-stub contract test
 *
 * Covers:
 * - returns the 4-key UseStakeholderInteractionMutationsReturn surface
 * - createInteraction throws "not implemented"
 * - createAnnotation throws "not implemented"
 * - source contains no cast, any annotation, or Promise.resolve success placeholder
 *
 * Reference: D-56-11.
 */

import React, { type ReactNode } from 'react'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useStakeholderInteractionMutations } from './useStakeholderTimeline'
import type {
  CreateAnnotationRequest,
  CreateInteractionRequest,
} from '@/types/stakeholder-interaction.types'

const createWrapper = (): { wrapper: React.FC<{ children: ReactNode }> } => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  const wrapper: React.FC<{ children: ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client }, children)
  return { wrapper }
}

const fixtureCreateInteractionRequest: CreateInteractionRequest = {
  stakeholder_type: 'person',
  stakeholder_id: 'person-1',
  interaction_type: 'meeting',
  title_en: 'Introductory meeting',
}

const fixtureCreateAnnotationRequest: CreateAnnotationRequest = {
  event_type: 'meeting',
  event_id: 'event-1',
  annotation_type: 'note',
  content_en: 'Key follow-up required',
}

describe('useStakeholderInteractionMutations - Phase 56 / TYPE-05', () => {
  it('returns the typed mutation surface', () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useStakeholderInteractionMutations(), { wrapper })

    expect(Object.keys(result.current).sort()).toEqual([
      'createAnnotation',
      'createInteraction',
      'isAnnotating',
      'isCreating',
    ])
    expect(typeof result.current.createInteraction).toBe('function')
    expect(typeof result.current.createAnnotation).toBe('function')
    expect(result.current.isCreating).toBe(false)
    expect(result.current.isAnnotating).toBe(false)
    expect('addInteraction' in result.current).toBe(false)
    expect('updateInteraction' in result.current).toBe(false)
    expect('deleteInteraction' in result.current).toBe(false)
  })

  it('createInteraction throws not-implemented', async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useStakeholderInteractionMutations(), { wrapper })

    await expect(result.current.createInteraction(fixtureCreateInteractionRequest)).rejects.toThrow(
      /not implemented.*wire to real backend/,
    )
  })

  it('createAnnotation throws not-implemented', async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useStakeholderInteractionMutations(), { wrapper })

    await expect(result.current.createAnnotation(fixtureCreateAnnotationRequest)).rejects.toThrow(
      /not implemented.*wire to real backend/,
    )
  })

  it('keeps the hook source free of the retired shim patterns', async () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    const source = await readFile(join(currentDir, 'useStakeholderTimeline.ts'), 'utf-8')

    expect(source).not.toMatch(/as unknown as/)
    expect(source).not.toMatch(/Promise\.resolve\(\{\s*success:\s*true\s*\}\)/)
    expect(source).not.toMatch(/:\s*any\b/)
  })
})
