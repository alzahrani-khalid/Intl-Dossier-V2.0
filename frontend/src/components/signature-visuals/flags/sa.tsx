/**
 * Phase 37 — Saudi Arabia flag.
 * Verbatim port from `/tmp/inteldossier-handoff/inteldossier/project/src/glyph.jsx` (lines 12-20).
 *
 * Returns a `<g>`, not a `<svg>` — `<DossierGlyph>` owns the outer svg + circular clipPath.
 * Only primitive SVG shapes (rect / path / circle) per T-37-01.
 */
import type { ReactElement } from 'react'

export function SaudiArabiaFlag(): ReactElement {
  return (
    <g aria-hidden="true">
      <rect width="32" height="32" fill="#006C35" />
      <rect x="4" y="18" width="24" height="1.5" fill="#fff" />
      <path d="M6 14 L26 14" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="16" cy="11" r="1.3" fill="#fff" />
    </g>
  )
}
