/**
 * Phase 37 — United Arab Emirates flag.
 * Verbatim port from `/tmp/inteldossier-handoff/inteldossier/project/src/glyph.jsx` (lines 21-29).
 *
 * Returns a `<g>`, not a `<svg>` — `<DossierGlyph>` owns the outer svg + circular clipPath.
 * Only primitive SVG shapes (rect / path / circle) per T-37-01.
 */
import type { ReactElement } from 'react'

export function UnitedArabEmiratesFlag(): ReactElement {
  return (
    <g aria-hidden="true">
      <rect width="32" height="10.7" fill="#00732F" />
      <rect y="10.7" width="32" height="10.6" fill="#fff" />
      <rect y="21.3" width="32" height="10.7" fill="#000" />
      <rect width="10" height="32" fill="#FF0000" />
    </g>
  )
}
