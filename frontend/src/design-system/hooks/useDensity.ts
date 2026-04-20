/**
 * Reads the current density setting + setter from `DesignProvider`.
 *
 * Density drives `--row-h`, `--pad-inline`, `--pad-block`, `--gap` — all
 * applied as logical properties so RTL flips happen automatically.
 */

import { useContext } from 'react'

import { DesignContext } from '@/design-system/DesignProvider'
import type { Density } from '@/design-system/tokens/types'

export interface UseDensityResult {
  density: Density
  setDensity: (d: Density) => void
}

export function useDensity(): UseDensityResult {
  const ctx = useContext(DesignContext)
  if (!ctx) {
    throw new Error('useDensity must be used within a <DesignProvider>')
  }
  return { density: ctx.density, setDensity: ctx.setDensity }
}
