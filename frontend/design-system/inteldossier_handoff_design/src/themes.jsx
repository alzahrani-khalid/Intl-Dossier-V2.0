// themes.jsx — Three design directions, each a pure CSS token set.
// All components read from var(--...). Switching direction = swap tokens.

// Direction A — CHANCERY (editorial, serif-forward, light)
// Direction B — SITUATION (dense intelligence terminal, dark, mono-first)
// Direction C — MINISTERIAL (government-formal, green accent, clean sans)

const DIRECTIONS = {
  chancery: {
    label: 'Chancery',
    labelAr: 'دواوين',
    tagline: 'Editorial · serif · composed',
    fonts: {
      display: "'Fraunces', 'Times New Roman', serif",
      body: "'Inter', system-ui, sans-serif",
      mono: "'JetBrains Mono', ui-monospace, monospace",
    },
    defaultTheme: 'light',
    defaultAccentHue: 22, // warm terracotta
    classificationStyle: 'marginalia', // tiny caps in margin
  },
  situation: {
    label: 'Situation Room',
    labelAr: 'غرفة العمليات',
    tagline: 'Intelligence terminal · dense · mono',
    fonts: {
      display: "'Space Grotesk', system-ui, sans-serif",
      body: "'IBM Plex Sans', system-ui, sans-serif",
      mono: "'IBM Plex Mono', ui-monospace, monospace",
    },
    defaultTheme: 'dark',
    defaultAccentHue: 190, // signal cyan
    classificationStyle: 'ribbon', // ribbon across top + chips
  },
  ministerial: {
    label: 'Ministerial',
    labelAr: 'وزاري',
    tagline: 'Government-formal · clean · restrained',
    fonts: {
      display: "'Public Sans', system-ui, sans-serif",
      body: "'Public Sans', system-ui, sans-serif",
      mono: "'JetBrains Mono', ui-monospace, monospace",
    },
    defaultTheme: 'light',
    defaultAccentHue: 158, // GASTAT-adjacent green/teal
    classificationStyle: 'chip',
  },
  bureau: {
    label: 'Bureau',
    labelAr: 'مكتب',
    tagline: 'Warm neutrals · document-forward · SaaS-clean',
    fonts: {
      display: "'Inter', system-ui, sans-serif",
      body: "'Inter', system-ui, sans-serif",
      mono: "'JetBrains Mono', ui-monospace, monospace",
    },
    defaultTheme: 'light',
    defaultAccentHue: 32, // institutional terracotta
    classificationStyle: 'chip',
  },
};

// Density scales (affects padding, row heights, font sizing)
const DENSITIES = {
  comfortable: { row: 52, pad: 20, gap: 16, label: 'Comfortable' },
  compact:     { row: 40, pad: 14, gap: 12, label: 'Compact' },
  dense:       { row: 32, pad: 10, gap: 8,  label: 'Dense' },
};

// Build CSS variable set for a given (direction, theme, density, hue) combo.
function buildTokens({ direction, theme, density, hue }) {
  const dir = DIRECTIONS[direction];
  const den = DENSITIES[density];
  const isDark = theme === 'dark';
  const h = hue;

  // Per-direction palettes
  let bg, surface, surfaceRaised, ink, inkMute, inkFaint, line, lineSoft, sidebar, sidebarInk;

  if (direction === 'chancery') {
    if (isDark) {
      bg = '#14120f';
      surface = '#1c1a16';
      surfaceRaised = '#23201b';
      ink = '#f3ede1';
      inkMute = '#c9c0ae';
      inkFaint = '#8a8377';
      line = '#2f2b24';
      lineSoft = '#242019';
      sidebar = '#100e0b';
      sidebarInk = '#ddd4c2';
    } else {
      bg = '#f7f3ec';        // warm paper
      surface = '#fdfaf3';
      surfaceRaised = '#ffffff';
      ink = '#1a1814';
      inkMute = '#5a5246';
      inkFaint = '#8f8575';
      line = '#e6ddc9';
      lineSoft = '#efe8d6';
      sidebar = '#ece5d2';
      sidebarInk = '#1a1814';
    }
  } else if (direction === 'situation') {
    if (isDark) {
      bg = '#07090c';        // near-black
      surface = '#0e1218';
      surfaceRaised = '#141a22';
      ink = '#e6edf5';
      inkMute = '#8a96a8';
      inkFaint = '#566274';
      line = '#1e2733';
      lineSoft = '#141c26';
      sidebar = '#05070a';
      sidebarInk = '#c9d4e2';
    } else {
      bg = '#f4f6f9';
      surface = '#ffffff';
      surfaceRaised = '#ffffff';
      ink = '#0b1220';
      inkMute = '#425066';
      inkFaint = '#7a8699';
      line = '#dde3ec';
      lineSoft = '#eaeef4';
      sidebar = '#0b1220';
      sidebarInk = '#d6deeb';
    }
  } else if (direction === 'ministerial') {
    if (isDark) {
      bg = '#0b1310';
      surface = '#111915';
      surfaceRaised = '#16211c';
      ink = '#e9efeb';
      inkMute = '#9fb0a6';
      inkFaint = '#6b7d73';
      line = '#1d2a24';
      lineSoft = '#162019';
      sidebar = '#081110';
      sidebarInk = '#c8d6cd';
    } else {
      bg = '#f5f7f4';
      surface = '#ffffff';
      surfaceRaised = '#ffffff';
      ink = '#0d1a14';
      inkMute = '#4a5a52';
      inkFaint = '#7a8a82';
      line = '#e1e8e1';
      lineSoft = '#ecf1ec';
      sidebar = '#0f2a22';
      sidebarInk = '#e6ede8';
    }
  } else { // bureau
    if (isDark) {
      bg = '#161310';
      surface = '#1d1915';
      surfaceRaised = '#24201b';
      ink = '#f2ece3';
      inkMute = '#b8ac9c';
      inkFaint = '#857c6e';
      line = '#2a2520';
      lineSoft = '#201c18';
      sidebar = '#100d0a';
      sidebarInk = '#ddd3c4';
    } else {
      bg = '#f7f6f4';       // near-white warm neutral canvas
      surface = '#ffffff';    // crisp white cards
      surfaceRaised = '#ffffff';
      ink = '#1a1714';
      inkMute = '#6b6459';
      inkFaint = '#9a9082';
      line = '#e8e4dc';
      lineSoft = '#efece3';
      sidebar = '#ffffff';
      sidebarInk = '#2a2520';
    }
  }

  return {
    '--font-display': dir.fonts.display,
    '--font-body': dir.fonts.body,
    '--font-mono': dir.fonts.mono,

    '--bg': bg,
    '--surface': surface,
    '--surface-raised': surfaceRaised,
    '--ink': ink,
    '--ink-mute': inkMute,
    '--ink-faint': inkFaint,
    '--line': line,
    '--line-soft': lineSoft,
    '--sidebar-bg': sidebar,
    '--sidebar-ink': sidebarInk,

    // Accent driven by hue
    '--accent': `oklch(58% 0.14 ${h})`,
    '--accent-ink': isDark ? `oklch(72% 0.12 ${h})` : `oklch(42% 0.15 ${h})`,
    '--accent-soft': isDark ? `oklch(25% 0.08 ${h})` : `oklch(92% 0.05 ${h})`,
    '--accent-fg': `oklch(99% 0.01 ${h})`,

    // Semantic
    '--danger': isDark ? 'oklch(70% 0.16 25)' : 'oklch(52% 0.18 25)',
    '--danger-soft': isDark ? 'oklch(25% 0.09 25)' : 'oklch(95% 0.04 25)',
    '--warn': isDark ? 'oklch(78% 0.14 75)' : 'oklch(62% 0.14 75)',
    '--warn-soft': isDark ? 'oklch(25% 0.08 75)' : 'oklch(95% 0.05 75)',
    '--ok': isDark ? 'oklch(72% 0.14 155)' : 'oklch(52% 0.12 155)',
    '--ok-soft': isDark ? 'oklch(22% 0.06 155)' : 'oklch(94% 0.04 155)',
    '--info': isDark ? 'oklch(72% 0.13 230)' : 'oklch(50% 0.14 230)',
    '--info-soft': isDark ? 'oklch(22% 0.07 230)' : 'oklch(94% 0.04 230)',

    // SLA palette — theme-aware, derived from accent hue so the SlaHealth
    // donut + legend express the currently selected theme.
    // on-track = full accent (harmonious, positive)
    // at-risk  = accent hue tinted toward warm (+55° on wheel, softer chroma)
    // breached = always red-ish for safety (hue-locked), but lightness tuned
    '--sla-ok': `oklch(58% 0.14 ${h})`,
    '--sla-ok-soft': isDark ? `oklch(28% 0.08 ${h})` : `oklch(94% 0.05 ${h})`,
    '--sla-risk': `oklch(${isDark ? 74 : 60}% 0.13 ${(h + 55) % 360})`,
    '--sla-risk-soft': isDark ? `oklch(26% 0.08 ${(h + 55) % 360})` : `oklch(95% 0.05 ${(h + 55) % 360})`,
    '--sla-bad': isDark ? 'oklch(68% 0.18 25)' : 'oklch(54% 0.2 25)',
    '--sla-bad-soft': isDark ? 'oklch(27% 0.09 25)' : 'oklch(95% 0.05 25)',

    // Density
    '--row-h': `${den.row}px`,
    '--pad': `${den.pad}px`,
    '--gap': `${den.gap}px`,

    // Shape
    '--radius-sm': direction === 'situation' ? '2px' : direction === 'bureau' ? '8px' : '6px',
    '--radius': direction === 'situation' ? '3px' : direction === 'chancery' ? '2px' : direction === 'bureau' ? '12px' : '10px',
    '--radius-lg': direction === 'situation' ? '4px' : direction === 'chancery' ? '2px' : direction === 'bureau' ? '16px' : '14px',
  };
}

Object.assign(window, { DIRECTIONS, DENSITIES, buildTokens });
