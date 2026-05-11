/**
 * Phase 37 — 24 country flag SVGs barrel (verbatim port from handoff glyph.jsx).
 *
 * Export strategy:
 *   - Named re-exports: each flag as `{Country}Flag` for tree-shaking when consumers
 *     import a single flag by name.
 *   - Keyed map (`flags`): lowercase ISO-alpha-2 keys for `<DossierGlyph>` lookup.
 *     Importing the map defeats tree-shaking (~5KB combined — acceptable per A9).
 *   - `FlagKey` union: exact ISO keys enforced at the type layer.
 *
 * Every flag component returns a `<g>` (not `<svg>`). `<DossierGlyph>` wraps it
 * in a circular clipPath + hairline per D-09..D-11.
 *
 * Security (T-37-01): Only primitive SVG shapes (rect / path / circle / polygon).
 * No `<script>`, no `xlink:href` external refs, no raw-HTML-setting React props.
 */
import type { ReactElement } from 'react'

import { SaudiArabiaFlag } from './sa'
import { UnitedArabEmiratesFlag } from './ae'
import { IndonesiaFlag } from './id'
import { EgyptFlag } from './eg'
import { QatarFlag } from './qa'
import { JordanFlag } from './jo'
import { BahrainFlag } from './bh'
import { OmanFlag } from './om'
import { KuwaitFlag } from './kw'
import { PakistanFlag } from './pk'
import { MoroccoFlag } from './ma'
import { TurkeyFlag } from './tr'
import { ChinaFlag } from './cn'
import { ItalyFlag } from './it'
import { FranceFlag } from './fr'
import { GermanyFlag } from './de'
import { UnitedKingdomFlag } from './gb'
import { UnitedStatesFlag } from './us'
import { JapanFlag } from './jp'
import { KoreaFlag } from './kr'
import { IndiaFlag } from './in'
import { BrazilFlag } from './br'
import { EuropeanUnionFlag } from './eu'
import { UnitedNationsFlag } from './un'

export { SaudiArabiaFlag } from './sa'
export { UnitedArabEmiratesFlag } from './ae'
export { IndonesiaFlag } from './id'
export { EgyptFlag } from './eg'
export { QatarFlag } from './qa'
export { JordanFlag } from './jo'
export { BahrainFlag } from './bh'
export { OmanFlag } from './om'
export { KuwaitFlag } from './kw'
export { PakistanFlag } from './pk'
export { MoroccoFlag } from './ma'
export { TurkeyFlag } from './tr'
export { ChinaFlag } from './cn'
export { ItalyFlag } from './it'
export { FranceFlag } from './fr'
export { GermanyFlag } from './de'
export { UnitedKingdomFlag } from './gb'
export { UnitedStatesFlag } from './us'
export { JapanFlag } from './jp'
export { KoreaFlag } from './kr'
export { IndiaFlag } from './in'
export { BrazilFlag } from './br'
export { EuropeanUnionFlag } from './eu'
export { UnitedNationsFlag } from './un'

export type FlagKey =
  | 'sa'
  | 'ae'
  | 'id'
  | 'eg'
  | 'qa'
  | 'jo'
  | 'bh'
  | 'om'
  | 'kw'
  | 'pk'
  | 'ma'
  | 'tr'
  | 'cn'
  | 'it'
  | 'fr'
  | 'de'
  | 'gb'
  | 'us'
  | 'jp'
  | 'kr'
  | 'in'
  | 'br'
  | 'eu'
  | 'un'

export const flags: Record<FlagKey, () => ReactElement> = {
  sa: SaudiArabiaFlag,
  ae: UnitedArabEmiratesFlag,
  id: IndonesiaFlag,
  eg: EgyptFlag,
  qa: QatarFlag,
  jo: JordanFlag,
  bh: BahrainFlag,
  om: OmanFlag,
  kw: KuwaitFlag,
  pk: PakistanFlag,
  ma: MoroccoFlag,
  tr: TurkeyFlag,
  cn: ChinaFlag,
  it: ItalyFlag,
  fr: FranceFlag,
  de: GermanyFlag,
  gb: UnitedKingdomFlag,
  us: UnitedStatesFlag,
  jp: JapanFlag,
  kr: KoreaFlag,
  in: IndiaFlag,
  br: BrazilFlag,
  eu: EuropeanUnionFlag,
  un: UnitedNationsFlag,
}
