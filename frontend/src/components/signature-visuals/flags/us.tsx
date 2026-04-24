/**
 * Phase 37 — United States flag.
 * Verbatim port from `/tmp/inteldossier-handoff/inteldossier/project/src/glyph.jsx` (lines 160-169).
 *
 * Returns a `<g>`, not a `<svg>` — `<DossierGlyph>` owns the outer svg + circular clipPath.
 * Only primitive SVG shapes (rect) per T-37-01.
 */
import type { ReactElement } from 'react'

const STRIPE_HEIGHT = 32 / 13
const STRIPE_INDEXES: ReadonlyArray<number> = [0, 2, 4, 6, 8, 10, 12]

export function UnitedStatesFlag(): ReactElement {
  return (
    <g aria-hidden="true">
      <rect width="32" height="32" fill="#fff" />
      {STRIPE_INDEXES.map((i): ReactElement => (
        <rect key={i} y={i * STRIPE_HEIGHT} width="32" height={STRIPE_HEIGHT} fill="#B22234" />
      ))}
      <rect width="14" height={(32 * 7) / 13} fill="#3C3B6E" />
    </g>
  )
}
