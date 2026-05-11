/**
 * Barrel export for the design-system hooks.
 *
 * Keeps consumer imports stable (`import { useMode } from '@/design-system/hooks'`)
 * so callers do not have to reach into individual hook files.
 */

export { useDesignDirection } from './useDesignDirection'
export { useMode } from './useMode'
export { useHue } from './useHue'
export { useDensity } from './useDensity'
export { useDesignTokens } from './useDesignTokens'
export { useClassification } from './useClassification'
export { useLocale } from './useLocale'
export { useReducedMotion } from './useReducedMotion'

export type { UseModeResult } from './useMode'
export type { UseClassificationResult } from './useClassification'
export type { UseLocaleResult, Locale } from './useLocale'
