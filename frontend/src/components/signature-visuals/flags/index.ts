/**
 * Phase 37 — 24 country flag SVGs barrel.
 *
 * Verbatim port target (plan 05) from the handoff `glyph.jsx`. ISO set:
 *   SA, AE, ID, EG, QA, JO, BH, OM, KW, PK,
 *   MA, TR, CN, IT, FR, DE, GB, US, JP, KR,
 *   IN, BR, EU, UN
 *
 * Plan 05 populates this file with:
 *   - 24 named re-exports (`export { SaudiArabiaFlag } from './sa'` …)
 *   - a `FlagKey` union type
 *   - a keyed `flags: Record<FlagKey, () => ReactElement>` map
 *
 * Each flag TSX file returns a `<g>` fragment (NOT a `<svg>`) so that
 * `DossierGlyph` can wrap all flags in a single outer `<svg>` with a
 * `clipPath` (VIZ-04 circle clip). Tree-shaking caveat: the `flags`
 * map holds references to all 24 components, so importing it defeats
 * tree-shaking. Acceptable — 24 flags total ~5KB combined (A9).
 *
 * This file is intentionally empty in Wave 0 (plan 00).
 */
export {}
