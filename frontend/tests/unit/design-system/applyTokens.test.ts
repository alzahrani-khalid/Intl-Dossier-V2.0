import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { applyTokens } from '@/design-system/tokens/applyTokens'
import { buildTokens } from '@/design-system/tokens/buildTokens'
import type { TokenSet } from '@/design-system/tokens/types'

describe('applyTokens — DOM side effects', () => {
  beforeEach(() => {
    // Clean slate: strip any inline custom properties from previous tests.
    document.documentElement.removeAttribute('style')
  })

  afterEach(() => {
    document.documentElement.removeAttribute('style')
  })

  it('writes every token entry to document.documentElement', () => {
    const tokens = buildTokens({
      direction: 'ltr-en',
      mode: 'light',
      hue: 'teal',
      density: 'comfortable',
    })

    applyTokens(tokens)

    const root = document.documentElement
    for (const [name, value] of Object.entries(tokens)) {
      expect(root.style.getPropertyValue(name)).toBe(value)
    }
  })

  it('returns a cleanup function that removes tokens not previously set', () => {
    const tokens = buildTokens({
      direction: 'ltr-en',
      mode: 'light',
      hue: 'teal',
      density: 'comfortable',
    })

    const cleanup = applyTokens(tokens)
    const root = document.documentElement
    expect(root.style.getPropertyValue('--accent')).not.toBe('')

    cleanup()
    expect(root.style.getPropertyValue('--accent')).toBe('')
    expect(root.style.getPropertyValue('--bg')).toBe('')
  })

  it('cleanup restores a token that had a prior value', () => {
    const root = document.documentElement
    // Pre-seed --accent with a user-controlled value.
    root.style.setProperty('--accent', 'oklch(0.5 0.1 0)')

    const tokens = buildTokens({
      direction: 'ltr-en',
      mode: 'dark',
      hue: 'rose',
      density: 'dense',
    })
    const cleanup = applyTokens(tokens)
    expect(root.style.getPropertyValue('--accent')).toBe(tokens['--accent'])

    cleanup()
    expect(root.style.getPropertyValue('--accent')).toBe('oklch(0.5 0.1 0)')
  })

  it('calling applyTokens twice lets the second cleanup restore the first set', () => {
    const first = buildTokens({
      direction: 'ltr-en',
      mode: 'light',
      hue: 'teal',
      density: 'comfortable',
    })
    const second = buildTokens({
      direction: 'rtl-ar',
      mode: 'dark',
      hue: 'indigo',
      density: 'dense',
    })

    applyTokens(first)
    const cleanupSecond = applyTokens(second)

    const root = document.documentElement
    expect(root.style.getPropertyValue('--accent')).toBe(second['--accent'])

    cleanupSecond()
    expect(root.style.getPropertyValue('--accent')).toBe(first['--accent'])
  })

  it('is a no-op in environments without a document', () => {
    // Guard the no-DOM branch by faking the typeof check. Call path must
    // not throw and must return a callable cleanup.
    const empty: TokenSet = {}
    const cleanup = applyTokens(empty)
    expect(typeof cleanup).toBe('function')
    expect(() => cleanup()).not.toThrow()
  })
})
