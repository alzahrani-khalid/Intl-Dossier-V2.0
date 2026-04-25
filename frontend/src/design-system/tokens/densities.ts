import type { Density, DensityValues } from './types'

/**
 * Density presets (Phase 33 canonical). Drive row heights, inline padding,
 * block padding, and inner gap. All values in pixels as CSS strings so they
 * drop straight into `setProperty` calls from `applyTokens`.
 *
 * Handoff port note: the source `themes.jsx` `DENSITIES` constant exposes
 * only `{ row, pad, gap }` (single `pad` dimension). Phase 33 plan 33-01 D-04
 * splits `pad` into `padInline` / `padBlock` so list views can tune vertical
 * rhythm independently of horizontal rhythm. The canonical scale:
 *
 *   - comfortable: 52px rows / 20px inline / 16px block / 12px gap — default
 *   - compact:     40px rows / 14px inline / 12px block /  8px gap — table-dense screens
 *   - dense:       32px rows / 10px inline /  8px block /  4px gap — KPI boards / inspectors
 *
 * RTL-safe: logical property names (`padInline`, not `padLeft`/`padRight`) so
 * downstream CSS utilities can bind to `padding-inline` / `padding-block`.
 *
 * Pure data — no runtime / DOM references. Safe for SSR and tests.
 */
export const DENSITIES: Record<Density, DensityValues> = {
  comfortable: {
    rowH: '52px',
    padInline: '20px',
    padBlock: '16px',
    gap: '12px',
  },
  compact: {
    rowH: '40px',
    padInline: '14px',
    padBlock: '12px',
    gap: '8px',
  },
  dense: {
    rowH: '32px',
    padInline: '10px',
    padBlock: '8px',
    gap: '4px',
  },
}
