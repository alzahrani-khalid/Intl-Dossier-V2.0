/**
 * Read-only accessor for the live `TokenSet` computed by `DesignProvider`.
 *
 * Intended for consumers that need to read derived token values without
 * triggering recomputation (e.g. Storybook docs, debug overlays). There is
 * no setter — tokens are derived from direction × mode × hue × density;
 * mutate those primitives via the dedicated hooks instead.
 */

import { useContext } from 'react'

import { DesignContext } from '@/design-system/DesignProvider'
import type { TokenSet } from '@/design-system/tokens/types'

export function useDesignTokens(): TokenSet {
  const ctx = useContext(DesignContext)
  if (!ctx) {
    throw new Error('useDesignTokens must be used within a <DesignProvider>')
  }
  return ctx.tokens
}
