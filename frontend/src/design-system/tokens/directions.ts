/**
 * Direction palettes — verbatim port of `/tmp/inteldossier-handoff/inteldossier/project/src/themes.jsx`
 * `DIRECTIONS` constant (light + dark hex values) with per-direction radius scales.
 *
 * Radius scales (per plan 33-01):
 *   - chancery    : 2 / 2  / 2   px (editorial, minimal curvature)
 *   - situation   : 2 / 3  / 4   px (terminal, sharp corners)
 *   - ministerial : 6 / 10 / 14  px (government-formal)
 *   - bureau      : 8 / 12 / 16  px (SaaS-clean, warm document)
 *
 * NOTE: The handoff `themes.jsx` computes chancery radii via a fallback ternary
 * branch that yields `6/2/2`. Phase 33 plan overrides chancery to `2/2/2` for
 * stricter editorial restraint; recorded as a handoff deviation in the plan
 * SUMMARY.
 */

import type { Direction, DirectionPalette, DirectionFonts } from './types'

export const PALETTES: Record<Direction, DirectionPalette> = {
  chancery: {
    light: {
      bg: '#f7f3ec', // warm paper
      surface: '#fdfaf3',
      surfaceRaised: '#ffffff',
      ink: '#1a1814',
      inkMute: '#5a5246',
      inkFaint: '#8f8575',
      line: '#e6ddc9',
      lineSoft: '#efe8d6',
      sidebar: '#ece5d2',
      sidebarInk: '#1a1814',
      radius: { sm: '2px', base: '2px', lg: '2px' },
    },
    dark: {
      bg: '#14120f',
      surface: '#1c1a16',
      surfaceRaised: '#23201b',
      ink: '#f3ede1',
      inkMute: '#c9c0ae',
      inkFaint: '#8a8377',
      line: '#2f2b24',
      lineSoft: '#242019',
      sidebar: '#100e0b',
      sidebarInk: '#ddd4c2',
      radius: { sm: '2px', base: '2px', lg: '2px' },
    },
  },
  situation: {
    light: {
      bg: '#f4f6f9',
      surface: '#ffffff',
      surfaceRaised: '#ffffff',
      ink: '#0b1220',
      inkMute: '#425066',
      inkFaint: '#7a8699',
      line: '#dde3ec',
      lineSoft: '#eaeef4',
      sidebar: '#0b1220',
      sidebarInk: '#d6deeb',
      radius: { sm: '2px', base: '3px', lg: '4px' },
    },
    dark: {
      bg: '#07090c', // near-black
      surface: '#0e1218',
      surfaceRaised: '#141a22',
      ink: '#e6edf5',
      inkMute: '#8a96a8',
      inkFaint: '#566274',
      line: '#1e2733',
      lineSoft: '#141c26',
      sidebar: '#05070a',
      sidebarInk: '#c9d4e2',
      radius: { sm: '2px', base: '3px', lg: '4px' },
    },
  },
  ministerial: {
    light: {
      bg: '#f5f7f4',
      surface: '#ffffff',
      surfaceRaised: '#ffffff',
      ink: '#0d1a14',
      inkMute: '#4a5a52',
      inkFaint: '#7a8a82',
      line: '#e1e8e1',
      lineSoft: '#ecf1ec',
      sidebar: '#0f2a22',
      sidebarInk: '#e6ede8',
      radius: { sm: '6px', base: '10px', lg: '14px' },
    },
    dark: {
      bg: '#0b1310',
      surface: '#111915',
      surfaceRaised: '#16211c',
      ink: '#e9efeb',
      inkMute: '#9fb0a6',
      inkFaint: '#6b7d73',
      line: '#1d2a24',
      lineSoft: '#162019',
      sidebar: '#081110',
      sidebarInk: '#c8d6cd',
      radius: { sm: '6px', base: '10px', lg: '14px' },
    },
  },
  bureau: {
    light: {
      bg: '#f7f6f4', // near-white warm neutral canvas
      surface: '#ffffff', // crisp white cards
      surfaceRaised: '#ffffff',
      ink: '#1a1714',
      inkMute: '#6b6459',
      // Phase 42-11: bumped from #9a9082 (3.14:1 on white — failed WCAG AA)
      // to #736b60 (5.07:1 on white, 4.82:1 on the warm bg #f7f6f4). The
      // .page-sub subtitle in PageHeader sits on the page bg, not on a
      // surface card, so the value has to clear AA on both. Same darkening
      // pattern as Plan 40-15 G2 close (which bumped --warn/--ok/--info-ink).
      inkFaint: '#736b60',
      line: '#e8e4dc',
      lineSoft: '#efece3',
      sidebar: '#ffffff',
      sidebarInk: '#2a2520',
      radius: { sm: '8px', base: '12px', lg: '16px' },
    },
    dark: {
      bg: '#161310',
      surface: '#1d1915',
      surfaceRaised: '#24201b',
      ink: '#f2ece3',
      inkMute: '#b8ac9c',
      inkFaint: '#857c6e',
      line: '#2a2520',
      lineSoft: '#201c18',
      sidebar: '#100d0a',
      sidebarInk: '#ddd3c4',
      radius: { sm: '8px', base: '12px', lg: '16px' },
    },
  },
  // Phase 77 (linear-token-system) — the Linear direction. Dark is canonical
  // (verbatim values from shadcn.io/design/linear/raw, 77-RESEARCH §The Linear
  // reference); light is fully derived under dark-canonical discipline. All
  // DERIVED values were computed with culori in the Linear surface band and are
  // WCAG-AA-proven by tests/unit/design-system/contrast.test.ts.
  // Hairline mapping (deviation from STACK.md — see 77-03-SUMMARY): --line =
  // hairline #23252a; lineSoft = DERIVED (softer than --line); the verbatim
  // hairline-strong #34343a lands as the NEW `lineStrong` tier, NOT --line-soft.
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

/** Phase 35 — D-01: per-direction font-family triplet emitted as --font-display/body/mono. */
export const FONTS: Record<Direction, DirectionFonts> = {
  chancery: {
    display: "'Fraunces', serif",
    body: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
  situation: {
    display: "'Space Grotesk', system-ui, sans-serif",
    body: "'IBM Plex Sans', system-ui, sans-serif",
    mono: "'IBM Plex Mono', ui-monospace, monospace",
  },
  ministerial: {
    display: "'Public Sans', system-ui, sans-serif",
    body: "'Public Sans', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
  bureau: {
    display: "'Inter', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
  // Phase 77 — REGISTERED @fontsource-variable family names (Pitfall 4: plain
  // 'Inter'/'JetBrains Mono' are NOT the variable-font registered families).
  // These exact strings must byte-match bootstrap.js F.linear.
  linear: {
    display: "'Inter Variable', system-ui, sans-serif",
    body: "'Inter Variable', system-ui, sans-serif",
    mono: "'JetBrains Mono Variable', ui-monospace, monospace",
  },
} as const
