import type { Density } from './types'

/**
 * Density presets drive row heights, inline padding, and control heights.
 *
 * Values (in pixels) are the Phase 33 canonical density scale and must stay
 * synchronized with Wave 2 consumers (list views, grids, forms):
 *   - comfortable: 52px rows / 20px inline pad / 44px control — default
 *   - compact:     40px rows / 14px inline pad / 36px control — table-dense screens
 *   - dense:       32px rows / 10px inline pad / 32px control — KPI boards / inspectors
 *
 * Pure data — no runtime / DOM references. Safe for server rendering.
 */
export const densities: Record<
  Density,
  {
    rowH: string
    padInline: string
    controlH: string
  }
> = {
  comfortable: {
    rowH: '52px',
    padInline: '20px',
    controlH: '44px',
  },
  compact: {
    rowH: '40px',
    padInline: '14px',
    controlH: '36px',
  },
  dense: {
    rowH: '32px',
    padInline: '10px',
    controlH: '32px',
  },
}
