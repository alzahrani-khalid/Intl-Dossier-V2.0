/**
 * Phase 37 — Signature Visuals barrel.
 *
 * Primitives (added in plans 01–07):
 *   - GlobeLoader (plan 02)
 *   - FullscreenLoader (plan 02)
 *   - GlobeSpinner (plan 03)
 *   - DossierGlyph (plan 05)
 *   - Sparkline (plan 06)
 *   - Donut (plan 07)
 *
 * Consumers will import as:
 *   `import { DossierGlyph } from '@/components/signature-visuals'`
 *
 * This file is intentionally empty in Wave 0 (plan 00). Plans 01–07 append
 * named exports below. See `.planning/phases/37-signature-visuals/` for
 * decisions, research, and acceptance criteria.
 */
export { GlobeLoader } from './GlobeLoader'
export type { GlobeLoaderProps } from './GlobeLoader'
export { GlobeSpinner } from './GlobeSpinner'
export type { GlobeSpinnerProps } from './GlobeSpinner'
export { Sparkline } from './Sparkline'
export type { SparklineProps } from './Sparkline'
export { Donut } from './Donut'
export type { DonutProps } from './Donut'
export { Icon } from './Icon'
export type { IconName, IconProps } from './Icon'
export { FullscreenLoader } from './FullscreenLoader'
export type { FullscreenLoaderProps } from './FullscreenLoader'
export { DossierGlyph } from './DossierGlyph'
export type { DossierGlyphProps } from './DossierGlyph'
export {
  showGlobeLoader,
  subscribe as subscribeGlobeLoader,
  getSnapshot as getGlobeLoaderSnapshot,
  getServerSnapshot as getGlobeLoaderServerSnapshot,
  type GlobeLoaderState,
} from './globeLoaderSignal'
