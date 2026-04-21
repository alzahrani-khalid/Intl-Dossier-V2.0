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
      inkFaint: '#9a9082',
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
} as const
