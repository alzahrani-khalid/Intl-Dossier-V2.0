/**
 * Reads the current accent hue + setter from `DesignProvider`.
 *
 * Hue is a plain number in OKLCH (0..360). SLA-risk is derived as
 * `(hue + 55) % 360` inside `buildTokens`; SLA-bad stays red-locked.
 */

import { useContext } from 'react'

import { DesignContext } from '@/design-system/DesignProvider'
import type { Hue } from '@/design-system/tokens/types'

export interface UseHueResult {
  hue: Hue
  setHue: (h: Hue) => void
}

export function useHue(): UseHueResult {
  const ctx = useContext(DesignContext)
  if (!ctx) {
    throw new Error('useHue must be used within a <DesignProvider>')
  }
  return { hue: ctx.hue, setHue: ctx.setHue }
}
