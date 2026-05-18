/**
 * Phase 56 / TYPE-05 - StakeholderInteractionTimeline consumer-destructure test
 *
 * Covers:
 * - useStakeholderInteractionMutations destructures into the four typed members
 * - the consumer source keeps the bare call site with no local shim or cast
 *
 * Reference: D-56-11. This file is co-located with the consumer because the
 * consumer contract is the regression surface.
 */

import React, { type ReactNode } from 'react'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useStakeholderInteractionMutations } from '@/domains/misc'

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

describe('StakeholderInteractionTimeline consumer destructure - Phase 56 / TYPE-05', () => {
  it('useStakeholderInteractionMutations destructures cleanly without cast', () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useStakeholderInteractionMutations(), { wrapper })
    const { createInteraction, isCreating, createAnnotation, isAnnotating } = result.current

    expect(typeof createInteraction).toBe('function')
    expect(typeof createAnnotation).toBe('function')
    expect(typeof isCreating).toBe('boolean')
    expect(typeof isAnnotating).toBe('boolean')
  })

  it('consumer source keeps the bare destructure call site', async () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    const source = await readFile(join(currentDir, 'StakeholderInteractionTimeline.tsx'), 'utf-8')

    expect(source).not.toMatch(/as unknown as/)
    expect(source).not.toMatch(/StakeholderInteractionMutationsShim/)
    expect(source).toMatch(
      /const\s*\{\s*createInteraction,\s*isCreating,\s*createAnnotation,\s*isAnnotating\s*\}\s*=\s*useStakeholderInteractionMutations\(\)/,
    )
  })
})
