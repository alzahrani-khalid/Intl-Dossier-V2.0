/**
 * Reads the current design-system direction + setter from `DesignProvider`.
 *
 * NOTE (plan 33-02 name-collision decision): this is NOT the same hook as
 * `@/hooks/useDirection` (that one reads `document.dir` via the language
 * provider). The DOM-level hook is being renamed to `useDomDirection` in
 * plan 33-07; this design-system hook lives in a separate namespace.
 *
 * Throws when called outside a `<DesignProvider>` tree — by design, so
 * mis-wired consumers fail loudly at mount rather than silently rendering
 * with stale defaults.
 */

import { useContext } from 'react'

import { DesignContext } from '@/design-system/DesignProvider'
import type { Direction } from '@/design-system/tokens/types'

export interface UseDesignDirectionResult {
  direction: Direction
  setDirection: (d: Direction) => void
}

export function useDesignDirection(): UseDesignDirectionResult {
  const ctx = useContext(DesignContext)
  if (!ctx) {
    throw new Error('useDesignDirection must be used within a <DesignProvider>')
  }
  return { direction: ctx.direction, setDirection: ctx.setDirection }
}
