/**
 * Reads the current colour mode + setter from `DesignProvider`.
 *
 * Setting `mode` flips the `.dark` class on `<html>` which HeroUI v3 and
 * Tailwind v4 `dark:` variants both observe.
 */

import { useContext } from 'react'

import { DesignContext } from '@/design-system/DesignProvider'
import type { Mode } from '@/design-system/tokens/types'

export interface UseModeResult {
  mode: Mode
  setMode: (m: Mode) => void
}

export function useMode(): UseModeResult {
  const ctx = useContext(DesignContext)
  if (!ctx) {
    throw new Error('useMode must be used within a <DesignProvider>')
  }
  return { mode: ctx.mode, setMode: ctx.setMode }
}
