/**
 * Direction palettes — the Linear single-direction token source.
 *
 * Phase 77 (linear-token-system) collapsed the engine to Linear only: the four
 * legacy directions and the accent-hue axis were deleted in 77-07. Dark is
 * canonical (verbatim values from
 * shadcn.io/design/linear/raw, 77-RESEARCH §The Linear reference); light is
 * fully derived under dark-canonical discipline. All DERIVED values were
 * computed with culori in the Linear surface band and are WCAG-AA-proven by
 * tests/unit/design-system/contrast.test.ts.
 *
 * THREE-COPY INVARIANT: these literals MUST byte-match two other copies —
 * `frontend/public/bootstrap.js` (first-paint ES5 table) and the
 * `frontend/src/index.css` `:root` fallback block. `scripts/check-bootstrap-parity.mjs`
 * fails the build on any divergence; change all three copies in the same edit.
 *
 * Hairline mapping (deviation from STACK.md — see 77-03-SUMMARY): --line =
 * hairline #23252a; lineSoft = DERIVED (softer than --line); the verbatim
 * hairline-strong #34343a lands as the `lineStrong` tier, NOT --line-soft.
 */

import type { Direction, DirectionPalette, DirectionFonts } from './types'

export const PALETTES: Record<Direction, DirectionPalette> = {
  linear: {
    dark: {
      bg: '#010102', // canvas (verbatim) — 19.61:1 ink contrast
      surface: '#0f1011', // surface-1 (verbatim)
      surfaceRaised: '#141516', // surface-2 (verbatim)
      ink: '#f7f8f8', // ink (verbatim)
      inkMute: '#d0d6e0', // ink-muted (verbatim)
      inkFaint: '#8a8f98', // ink-subtle (verbatim) — 5.86:1 on surface-1
      line: '#23252a', // hairline (verbatim)
      lineSoft: '#1d1e21', // DERIVED — softer hairline than --line vs surface-1
      sidebar: '#0f1011', // DERIVED — surface-1
      sidebarInk: '#d0d6e0', // DERIVED — ink-muted ladder (13.0:1 on sidebar)
      radius: { sm: '6px', base: '8px', lg: '12px' },
      surface3: '#18191a', // surface-3 (verbatim) — drawers/popovers
      surface4: '#191a1b', // surface-4 (verbatim) — elevated overlays
      inkTertiary: '#62666d', // ink-tertiary (verbatim) — faintest, not AA-gated
      lineStrong: '#34343a', // hairline-strong (verbatim) — not AA-gated
      accent: {
        base: '#5e6ad2', // primary (verbatim)
        hover: '#828fff', // primary-hover (verbatim)
        fg: '#ffffff', // on-primary (verbatim) — 4.70:1 on base
        soft: '#5e69d1', // primary-focus (verbatim)
        ink: '#98a6ea', // DERIVED — accent-tinted text, AA on surface-1
      },
      semantic: {
        danger: '#e86154', // DERIVED (h28) — 4.73:1 on dangerSoft
        dangerSoft: '#3c1713',
        warn: '#e1af4a', // DERIVED (h82)
        warnSoft: '#302103',
        ok: '#27a644', // semantic-success (verbatim) — 6.01:1 on surface-1
        okSoft: '#102b17',
        info: '#66a0ee', // DERIVED (h256)
        infoSoft: '#0f2440',
      },
      sla: {
        ok: '#8998e9', // DERIVED — accent band (h275)
        okSoft: '#1c2141',
        risk: '#e1af4a', // DERIVED — amber (h82)
        riskSoft: '#302103',
        bad: '#e86154', // DERIVED — red (h28)
        badSoft: '#3c1713',
      },
      status: [
        { fg: '#87adfa', soft: '#16233f' }, // indigo (h264)
        { fg: '#2ac4cc', soft: '#002c2e' }, // cyan (h200)
        { fg: '#6ac48c', soft: '#082c18' }, // green (h155)
        { fg: '#cbaa4b', soft: '#2e2200' }, // amber (h90)
        { fg: '#ef9179', soft: '#3a1911' }, // orange (h35)
        { fg: '#d991d2', soft: '#331931' }, // magenta (h330)
      ],
    },
    light: {
      bg: '#ffffff', // inverse-canvas (verbatim)
      surface: '#f5f6f6', // inverse-surface-1 (verbatim)
      surfaceRaised: '#f6f7f7', // inverse-surface-2 (verbatim)
      ink: '#000000', // inverse-ink (verbatim)
      inkMute: '#4f5359', // DERIVED — AA on bg + surface
      inkFaint: '#656970', // DERIVED — 5.09:1 on surface
      line: '#dddee1', // DERIVED
      lineSoft: '#eaebed', // DERIVED — softer than --line
      sidebar: '#f5f6f6', // DERIVED
      sidebarInk: '#14161a', // DERIVED
      radius: { sm: '6px', base: '8px', lg: '12px' },
      surface3: '#eff0f2', // DERIVED
      surface4: '#e6e8eb', // DERIVED
      inkTertiary: '#83868e', // DERIVED — faintest, not AA-gated
      lineStrong: '#ccced1', // DERIVED — not AA-gated
      accent: {
        base: '#5e6ad2', // brand-invariant across modes
        hover: '#828fff',
        fg: '#ffffff', // 4.70:1 on base
        soft: '#e8edff', // DERIVED — pale accent wash
        ink: '#4d57b7', // DERIVED — accent-tinted dark text, AA on surface
      },
      semantic: {
        danger: '#be241f', // DERIVED (h28)
        dangerSoft: '#ffeae6',
        warn: '#8c5500', // DERIVED (h72)
        warnSoft: '#fceed6',
        ok: '#137738', // DERIVED (h150)
        okSoft: '#e4f6e6',
        info: '#1664bf', // DERIVED (h256)
        infoSoft: '#e4f1ff',
      },
      sla: {
        ok: '#4d57b7', // DERIVED — accent band (h275)
        okSoft: '#eaefff',
        risk: '#8c5500', // DERIVED — amber (h72)
        riskSoft: '#fceed6',
        bad: '#be241f', // DERIVED — red (h28)
        badSoft: '#ffeae6',
      },
      status: [
        { fg: '#3458ac', soft: '#e6f1ff' }, // indigo (h264)
        { fg: '#00737c', soft: '#daf7f8' }, // cyan (h200)
        { fg: '#007338', soft: '#e1f7e7' }, // green (h155)
        { fg: '#7c5700', soft: '#f8f0da' }, // amber (h90)
        { fg: '#9d381f', soft: '#ffeae3' }, // orange (h35)
        { fg: '#873a82', soft: '#fce9fa' }, // magenta (h330)
      ],
    },
  },
}

/**
 * Phase 77 — Linear font triplet. REGISTERED @fontsource-variable family names
 * (Pitfall 4: plain 'Inter'/'JetBrains Mono' are NOT the variable-font
 * registered families → silent system-ui fallback). These exact strings must
 * byte-match bootstrap.js F.linear.
 */
export const FONTS: Record<Direction, DirectionFonts> = {
  linear: {
    display: "'Inter Variable', system-ui, sans-serif",
    body: "'Inter Variable', system-ui, sans-serif",
    mono: "'JetBrains Mono Variable', ui-monospace, monospace",
  },
} as const
