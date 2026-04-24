/**
 * Phase 37 — Pakistan flag.
 * Verbatim port from `/tmp/inteldossier-handoff/inteldossier/project/src/glyph.jsx` (lines 89-98).
 *
 * Returns a `<g>`, not a `<svg>` — `<DossierGlyph>` owns the outer svg + circular clipPath.
 * Only primitive SVG shapes (rect / circle / path) per T-37-01.
 */
import type { ReactElement } from 'react'

export function PakistanFlag(): ReactElement {
  return (
    <g aria-hidden="true">
      <rect width="32" height="32" fill="#01411C" />
      <rect width="8" height="32" fill="#fff" />
      <circle cx="20" cy="16" r="5.5" fill="#fff" />
      <circle cx="21.6" cy="15" r="4.8" fill="#01411C" />
      <path d="M26 12 L27 14 L29 14 L27.5 15.3 L28 17 L26 16 L24 17 L24.5 15.3 L23 14 L25 14 Z" fill="#fff" />
    </g>
  )
}
