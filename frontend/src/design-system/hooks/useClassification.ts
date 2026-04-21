/**
 * Reads the current classification-banner toggle + setter from `DesignProvider`.
 *
 * Persisted under localStorage key `id.classif` as the literal string `'true'`
 * or `'false'`. Anything else (including missing keys or malformed values)
 * deserialises to `false` per T-34-01.
 */

import { useContext } from 'react'

import { DesignContext } from '@/design-system/DesignProvider'

export interface UseClassificationResult {
  classif: boolean
  setClassif: (next: boolean) => void
}

export function useClassification(): UseClassificationResult {
  const ctx = useContext(DesignContext)
  if (!ctx) {
    throw new Error('useClassification must be used within a <DesignProvider>')
  }
  return { classif: ctx.classif, setClassif: ctx.setClassif }
}
